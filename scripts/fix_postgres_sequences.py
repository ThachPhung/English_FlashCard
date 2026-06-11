#!/usr/bin/env python3
"""Reset PostgreSQL ID sequences after SQLite migration."""

from __future__ import annotations

import os
import sys

TABLES = [
    "users",
    "user_settings",
    "decks",
    "cards",
    "study_sessions",
    "user_card_progress",
    "review_logs",
]


def main() -> None:
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url:
        print("ERROR: Set DATABASE_URL")
        sys.exit(1)
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    try:
        import psycopg2
    except ImportError:
        print("ERROR: pip install psycopg2-binary")
        sys.exit(1)

    conn = psycopg2.connect(url)
    try:
        with conn.cursor() as cur:
            for table in TABLES:
                cur.execute(
                    """
                    SELECT setval(
                        pg_get_serial_sequence(%s, 'id'),
                        COALESCE((SELECT MAX(id) FROM {}), 1)
                    )
                    """.format(table),
                    (table,),
                )
                cur.execute(f"SELECT MAX(id) FROM {table}")
                max_id = cur.fetchone()[0] or 0
                cur.execute("SELECT last_value FROM %s" % f"{table}_id_seq")
                seq_val = cur.fetchone()[0]
                print(f"  {table}: max_id={max_id}, sequence set to {seq_val}")
        conn.commit()
        print("\nSequences fixed. Next insert will use max(id) + 1.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
