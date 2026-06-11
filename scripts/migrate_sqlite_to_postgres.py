#!/usr/bin/env python3
"""
One-time migration: SQLite (local) → Supabase PostgreSQL.

Usage:
    export DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
    python scripts/migrate_sqlite_to_postgres.py

Requires: psycopg2-binary (pip install psycopg2-binary)
"""

from __future__ import annotations

import os
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SQLITE_PATH = ROOT / "backend" / "flashcard.db"

TABLES_IN_ORDER = [
    "users",
    "user_settings",
    "decks",
    "cards",
    "study_sessions",
    "user_card_progress",
    "review_logs",
]

BOOLEAN_COLUMNS = {
    "users": {"is_active"},
    "user_settings": {"sound_enabled"},
    "decks": {"is_deleted"},
    "cards": {"is_deleted"},
    "review_logs": {"is_undone"},
}


def get_postgres_url() -> str:
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url:
        print("ERROR: Set DATABASE_URL to your Supabase PostgreSQL connection string.")
        sys.exit(1)
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


def fetch_sqlite_rows(conn: sqlite3.Connection, table: str) -> list[sqlite3.Row]:
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM {table}")
    return cur.fetchall()


def normalize_row(table: str, row: dict) -> dict:
    bool_cols = BOOLEAN_COLUMNS.get(table, set())
    normalized = {}
    for key, value in row.items():
        if key in bool_cols and value is not None:
            normalized[key] = bool(value)
        else:
            normalized[key] = value
    return normalized


def row_to_dict(table: str, row: sqlite3.Row) -> dict:
    return normalize_row(table, {k: row[k] for k in row.keys()})


def insert_rows(pg_conn, table: str, rows: list[dict]) -> int:
    if not rows:
        return 0
    columns = list(rows[0].keys())
    placeholders = ", ".join(["%s"] * len(columns))
    col_list = ", ".join(columns)
    sql = f"INSERT INTO {table} ({col_list}) VALUES ({placeholders})"
    with pg_conn.cursor() as cur:
        for row in rows:
            cur.execute(sql, [row[c] for c in columns])
    return len(rows)


def verify_counts(sqlite_conn, pg_conn) -> bool:
    ok = True
    with pg_conn.cursor() as cur:
        for table in TABLES_IN_ORDER:
            sqlite_count = sqlite_conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            pg_count = cur.fetchone()[0]
            status = "OK" if sqlite_count == pg_count else "MISMATCH"
            print(f"  {table}: local={sqlite_count}, supabase={pg_count} [{status}]")
            if sqlite_count != pg_count:
                ok = False
    return ok


def main() -> None:
    if not SQLITE_PATH.exists():
        print(f"ERROR: SQLite file not found: {SQLITE_PATH}")
        sys.exit(1)

    try:
        import psycopg2
    except ImportError:
        print("ERROR: pip install psycopg2-binary")
        sys.exit(1)

    pg_url = get_postgres_url()
    print(f"Source: {SQLITE_PATH}")
    print(f"Target: Supabase PostgreSQL")
    print()

    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    pg_conn = psycopg2.connect(pg_url)
    pg_conn.autocommit = False

    try:
        with pg_conn.cursor() as cur:
            print("Clearing target tables (if re-running)...")
            for table in reversed(TABLES_IN_ORDER):
                cur.execute(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE")

        for table in TABLES_IN_ORDER:
            rows = [row_to_dict(table, r) for r in fetch_sqlite_rows(sqlite_conn, table)]
            count = insert_rows(pg_conn, table, rows)
            print(f"  Migrated {table}: {count} rows")

        with pg_conn.cursor() as cur:
            for table in TABLES_IN_ORDER:
                cur.execute(
                    f"""
                    SELECT setval(
                        pg_get_serial_sequence('{table}', 'id'),
                        COALESCE((SELECT MAX(id) FROM {table}), 1)
                    )
                    """
                )

        pg_conn.commit()
        print()
        print("Verification:")
        if verify_counts(sqlite_conn, pg_conn):
            print()
            print("Migration completed successfully.")
        else:
            print()
            print("WARNING: Row counts do not match. Review before deploying.")
            sys.exit(1)
    except Exception as exc:
        pg_conn.rollback()
        print(f"ERROR: {exc}")
        sys.exit(1)
    finally:
        sqlite_conn.close()
        pg_conn.close()


if __name__ == "__main__":
    main()
