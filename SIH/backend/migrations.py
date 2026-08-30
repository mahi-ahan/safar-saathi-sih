"""
Database migration script to add new columns to existing tables.
Run with: python migrations.py
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set in .env file")
    sys.exit(1)

try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("ERROR: psycopg2 is required. Install with: pip install psycopg2-binary")
    sys.exit(1)

def main():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    migrations = [
        # Add user_id & driver_phone to trips table
        """
        ALTER TABLE trips 
        ADD COLUMN IF NOT EXISTS user_id INTEGER DEFAULT NULL
        """,
        """
        ALTER TABLE trips 
        ADD COLUMN IF NOT EXISTS driver_phone VARCHAR DEFAULT NULL
        """,
        # Add price_per_kg to trips table
        """
        ALTER TABLE trips 
        ADD COLUMN IF NOT EXISTS price_per_kg INTEGER DEFAULT 0
        """,

        # Add new columns to user_profiles table
        """
        ALTER TABLE user_profiles 
        ADD COLUMN IF NOT EXISTS full_name VARCHAR DEFAULT NULL
        """,
        """
        ALTER TABLE user_profiles 
        ADD COLUMN IF NOT EXISTS gender VARCHAR DEFAULT NULL
        """,
        """
        ALTER TABLE user_profiles 
        ADD COLUMN IF NOT EXISTS aadhaar_doc VARCHAR DEFAULT NULL
        """,
        """
        ALTER TABLE user_profiles 
        ADD COLUMN IF NOT EXISTS license_doc VARCHAR DEFAULT NULL
        """,
        """
        ALTER TABLE user_profiles 
        ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE
        """,

        # Add user_id to requests table
        """
        ALTER TABLE requests 
        ADD COLUMN IF NOT EXISTS user_id INTEGER DEFAULT NULL
        """
    ]

    for migration in migrations:
        try:
            cur.execute(migration)
            first_line = migration.strip().splitlines()[0][:80]
            print(f"OK: {first_line}...")
        except Exception as e:
            print(f"SKIP: {e}")

    cur.close()
    conn.close()
    print("\nMigration completed successfully.")

if __name__ == "__main__":
    main()