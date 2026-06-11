#!/usr/bin/env python3
"""
Export database tables to CSV for weekly backup.

Usage:
    export DATABASE_URL="postgresql://..."
    python scripts/export_backup.py

Output: backup_local/export_YYYY-MM-DD/
"""

from __future__ import annotations

import csv
import os
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TABLES = [
    "users",
    "decks",
    "cards",
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

    out_dir = ROOT / "backup_local" / f"export_{date.today().isoformat()}"
    out_dir.mkdir(parents=True, exist_ok=True)

    conn = psycopg2.connect(url)
    try:
        for table in TABLES:
            path = out_dir / f"{table}.csv"
            with conn.cursor() as cur:
                cur.execute(f"SELECT * FROM {table}")
                rows = cur.fetchall()
                headers = [desc[0] for desc in cur.description]
            with path.open("w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(headers)
                for row in rows:
                    writer.writerow(row)
            print(f"  Exported {table}: {len(rows)} rows → {path.name}")
        print(f"\nBackup saved to {out_dir}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
