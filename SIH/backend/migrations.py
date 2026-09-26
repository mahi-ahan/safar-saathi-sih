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
        # Trips table
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS user_id INTEGER DEFAULT NULL;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_phone VARCHAR DEFAULT NULL;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS price_per_kg INTEGER DEFAULT 0;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS total_driver_amount FLOAT DEFAULT 0.0;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS distance_km FLOAT DEFAULT 150.0;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS dest_lat FLOAT DEFAULT 0.0;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS dest_lng FLOAT DEFAULT 0.0;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS pickup_lat FLOAT DEFAULT 0.0;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS pickup_lng FLOAT DEFAULT 0.0;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS speed FLOAT DEFAULT 0.0;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS pickup_cargo_image_url VARCHAR DEFAULT NULL;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS delivery_proof_image_url VARCHAR DEFAULT NULL;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS preferred_lang VARCHAR DEFAULT 'hi';",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS return_trip_id INTEGER DEFAULT NULL;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_return_leg BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS return_discount_pct INTEGER DEFAULT 0;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS has_perishables BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS ice_handling_supported BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS current_checkpoint VARCHAR DEFAULT NULL;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS checkpoint_count INTEGER DEFAULT 0;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS inspection_status VARCHAR DEFAULT 'not_started';",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS inspection_completed BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS goods_area_status VARCHAR DEFAULT 'not_started';",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS goods_area_reached_at VARCHAR DEFAULT NULL;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS goods_area_confirmed_at VARCHAR DEFAULT NULL;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS return_started_at VARCHAR DEFAULT NULL;",

        # Requests table
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS goods_weight_kg INTEGER DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS distance_km FLOAT DEFAULT 150.0;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS kg_km FLOAT DEFAULT 0.0;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS per_person_share FLOAT DEFAULT 0.0;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS user_id INTEGER DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS pickup_date VARCHAR DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS pickup_time VARCHAR DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS pickup_place VARCHAR DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS delivery_date VARCHAR DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS pickup_lat FLOAT DEFAULT 0.0;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS pickup_lng FLOAT DEFAULT 0.0;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS delivery_lat FLOAT DEFAULT 0.0;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS delivery_lng FLOAT DEFAULT 0.0;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS pickup_cargo_image_url VARCHAR DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS delivery_proof_image_url VARCHAR DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS reason VARCHAR DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS feedback VARCHAR DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS trip_id INTEGER DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS trip_date VARCHAR DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS preferred_lang VARCHAR DEFAULT 'hi';",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS is_perishable BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS cargo_type VARCHAR DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS ice_handling_required BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS current_temp_c FLOAT DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS loading_status VARCHAR DEFAULT 'pending';",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS loaded_at VARCHAR DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS loaded_by VARCHAR DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS unloaded_at VARCHAR DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS unloaded_by VARCHAR DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS ice_boxes_count INTEGER DEFAULT 0;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS ice_added BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS ice_added_stage VARCHAR DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS ice_added_at VARCHAR DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS ice_unavailable_at_pickup BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS cargo_category VARCHAR DEFAULT 'general';",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS dedicated_sub_category VARCHAR DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS is_dedicated BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS seal_number VARCHAR DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS seal_status VARCHAR DEFAULT 'Pending';",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS verified_weight_kg FLOAT DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS weight_compliant BOOLEAN DEFAULT TRUE;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS cooling_type VARCHAR DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS target_temp_c FLOAT DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS ice_surcharge FLOAT DEFAULT 0.0;",
        "UPDATE trips SET ice_handling_supported = FALSE WHERE cargo_category != 'Perishable Goods';",
        "UPDATE trips SET has_perishables = FALSE WHERE cargo_category != 'Perishable Goods';",

        # Trips table cargo & checkpoint updates
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS cargo_category VARCHAR DEFAULT 'general';",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS dedicated_sub_category VARCHAR DEFAULT NULL;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_dedicated BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS seal_number VARCHAR DEFAULT NULL;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS seal_status VARCHAR DEFAULT 'Pending';",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS last_weigh_in_kg FLOAT DEFAULT NULL;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS weight_compliant BOOLEAN DEFAULT TRUE;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS cooling_type VARCHAR DEFAULT NULL;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS target_temp_c FLOAT DEFAULT NULL;",

        # User profiles table
        "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_type VARCHAR DEFAULT NULL;",
        "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name VARCHAR DEFAULT NULL;",
        "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gender VARCHAR DEFAULT NULL;",
        "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS aadhaar_doc VARCHAR DEFAULT NULL;",
        "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS license_doc VARCHAR DEFAULT NULL;",
        "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS id_proof_doc VARCHAR DEFAULT NULL;",
        "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS assigned_station VARCHAR DEFAULT NULL;",
        "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS station_lat FLOAT DEFAULT NULL;",
        "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS station_lng FLOAT DEFAULT NULL;",
        "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_lang VARCHAR DEFAULT 'hi';",
        """
        CREATE TABLE IF NOT EXISTS logistics_checkpoints (
            id SERIAL PRIMARY KEY,
            trip_id INTEGER REFERENCES trips(id),
            checkpoint_name VARCHAR,
            officer_name VARCHAR,
            officer_phone VARCHAR,
            timestamp VARCHAR,
            cargo_seal_intact BOOLEAN DEFAULT TRUE,
            cargo_condition VARCHAR DEFAULT 'Good',
            ice_status VARCHAR DEFAULT 'Adequate',
            temp_celsius FLOAT,
            notes VARCHAR,
            proof_image_url VARCHAR,
            action_taken VARCHAR
        );
        """,
        "ALTER TABLE logistics_checkpoints ADD COLUMN IF NOT EXISTS seal_number VARCHAR DEFAULT NULL;",
        "ALTER TABLE logistics_checkpoints ADD COLUMN IF NOT EXISTS seal_status VARCHAR DEFAULT 'Verified & Intact';",
        "ALTER TABLE logistics_checkpoints ADD COLUMN IF NOT EXISTS measured_weight_kg FLOAT DEFAULT NULL;",
        "ALTER TABLE logistics_checkpoints ADD COLUMN IF NOT EXISTS declared_weight_kg FLOAT DEFAULT NULL;",
        "ALTER TABLE logistics_checkpoints ADD COLUMN IF NOT EXISTS weight_discrepancy_kg FLOAT DEFAULT NULL;",
        "ALTER TABLE logistics_checkpoints ADD COLUMN IF NOT EXISTS weight_compliant BOOLEAN DEFAULT TRUE;",
        "ALTER TABLE logistics_checkpoints ADD COLUMN IF NOT EXISTS safety_parameters_status VARCHAR DEFAULT 'Compliant';",
        "ALTER TABLE logistics_checkpoints ADD COLUMN IF NOT EXISTS cooling_status VARCHAR DEFAULT NULL;",
        "ALTER TABLE logistics_checkpoints ADD COLUMN IF NOT EXISTS checkpoint_type VARCHAR DEFAULT 'Highway Toll Plaza';"
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