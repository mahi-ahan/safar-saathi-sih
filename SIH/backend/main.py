from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os

from typing import Optional
from database import get_db, engine
import models
from models import User
from auth.dependencies import get_current_user, get_optional_current_user

# Routers
from routers import auth
from routers import trips
from routers import requests
from routers import users
from routers import drivers
from routers import admins
from routers import pricing
from routers import notifications
from routers import logistics


# =========================================================
# DATABASE TABLE CREATION & AUTOMATIC MIGRATION
# =========================================================

models.Base.metadata.create_all(bind=engine)

def auto_migrate():
    from sqlalchemy import text
    migrations = [
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS user_id INTEGER;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_phone VARCHAR;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS price_per_kg INTEGER DEFAULT 0;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS total_driver_amount FLOAT DEFAULT 0.0;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS distance_km FLOAT DEFAULT 150.0;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS dest_lat FLOAT DEFAULT 0.0;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS dest_lng FLOAT DEFAULT 0.0;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS pickup_lat FLOAT DEFAULT 0.0;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS pickup_lng FLOAT DEFAULT 0.0;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS speed FLOAT DEFAULT 0.0;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS pickup_cargo_image_url VARCHAR;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS delivery_proof_image_url VARCHAR;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS preferred_lang VARCHAR DEFAULT 'hi';",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS return_trip_id INTEGER;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_return_leg BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS return_discount_pct INTEGER DEFAULT 0;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS has_perishables BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS ice_handling_supported BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS current_checkpoint VARCHAR;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS checkpoint_count INTEGER DEFAULT 0;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS inspection_status VARCHAR DEFAULT 'not_started';",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS inspection_completed BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS goods_area_status VARCHAR DEFAULT 'not_started';",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS goods_area_reached_at VARCHAR;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS goods_area_confirmed_at VARCHAR;",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS return_started_at VARCHAR;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS goods_weight_kg INTEGER;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS distance_km FLOAT DEFAULT 150.0;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS kg_km FLOAT DEFAULT 0.0;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS per_person_share FLOAT DEFAULT 0.0;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS user_id INTEGER;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS pickup_date VARCHAR;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS pickup_time VARCHAR;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS pickup_place VARCHAR;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS delivery_date VARCHAR;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS pickup_lat FLOAT DEFAULT 0.0;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS pickup_lng FLOAT DEFAULT 0.0;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS delivery_lat FLOAT DEFAULT 0.0;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS delivery_lng FLOAT DEFAULT 0.0;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS pickup_cargo_image_url VARCHAR;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS delivery_proof_image_url VARCHAR;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS reason VARCHAR;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS rating INTEGER;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS feedback VARCHAR;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS trip_id INTEGER;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS trip_date VARCHAR;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS preferred_lang VARCHAR DEFAULT 'hi';",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS is_perishable BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS cargo_type VARCHAR;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS ice_handling_required BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS current_temp_c FLOAT;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS loading_status VARCHAR DEFAULT 'pending';",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS loaded_at VARCHAR;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS loaded_by VARCHAR;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS unloaded_at VARCHAR;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS unloaded_by VARCHAR;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS ice_boxes_count INTEGER DEFAULT 0;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS ice_added BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS ice_added_stage VARCHAR DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS ice_added_at VARCHAR DEFAULT NULL;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS ice_unavailable_at_pickup BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE requests ADD COLUMN IF NOT EXISTS ice_surcharge FLOAT DEFAULT 0.0;",
        "UPDATE trips SET ice_handling_supported = FALSE WHERE cargo_category != 'Perishable Goods';",
        "UPDATE trips SET has_perishables = FALSE WHERE cargo_category != 'Perishable Goods';",
        "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_type VARCHAR;",
        "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name VARCHAR;",
        "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gender VARCHAR;",
        "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS aadhaar_doc VARCHAR;",
        "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS license_doc VARCHAR;",
        "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS id_proof_doc VARCHAR;",
        "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS assigned_station VARCHAR;",
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
        """
    ]
    with engine.connect() as conn:
        for stmt in migrations:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception as e:
                print(f"Migration notice: {e}")

try:
    auto_migrate()
except Exception as e:
    print(f"Auto-migration warning: {e}")



# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="Krishi-Anna API",
    description=(
        "Backend for Krishi-Anna shared harvest "
        "transport platform"
    ),
    version="1.0.0",
)


# =========================================================
# HTML TEMPLATES
# =========================================================

templates = Jinja2Templates(
    directory="templates"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# STATIC FILES (for uploaded documents)
# =========================================================

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "cargo"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "delivery_proofs"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# =========================================================
# SEED INITIAL TRIP DATA
# =========================================================

@app.on_event("startup")
def seed_data():
    db = next(get_db())
    try:
        # Seed default driver user profiles if missing
        seed_drivers = [
            {"username": "ramesh_patil", "full_name": "Ramesh Patil", "phone": "9608959215"},
            {"username": "gurpreet_singh", "full_name": "Gurpreet Singh", "phone": "9608959215"},
            {"username": "rajesh_yadav", "full_name": "Rajesh Yadav", "phone": "9608959215"},
            {"username": "mahesh_patel", "full_name": "Mahesh Bhai Patel", "phone": "9608959215"},
        ]
        for sd in seed_drivers:
            existing_u = db.query(models.User).filter(models.User.username == sd["username"]).first()
            if not existing_u:
                u = models.User(username=sd["username"], email=f"{sd['username']}@safarsaathi.com", role=models.UserRole.DRIVER)
                db.add(u)
                db.commit()
                db.refresh(u)
                p = models.UserProfile(user_id=u.id, full_name=sd["full_name"], phone_number=sd["phone"], user_type="driver", is_verified=True)
                db.add(p)
                db.commit()
            else:
                if existing_u.profile and not existing_u.profile.phone_number:
                    existing_u.profile.phone_number = sd["phone"]
                    db.commit()

        # Only insert mock trips if table is empty
        if not db.query(
            models.TripModel
        ).first():
            initial_trips = [
                models.TripModel(
                    state="Maharashtra",
                    from_loc="Nashik, Maharashtra",
                    to_loc="Pune, Maharashtra",
                    date="2026-08-18",
                    vehicle="Mini-Truck",
                    owner="Ramesh Patil",
                    driver_phone="9608959215",
                    verified=True,
                    pct=62,
                    total_kg=900,
                    price_per_kg=10,
                    pickup="Sinnar Bypass Toll Plaza, Nashik",
                    lat=19.9975,
                    lng=73.7898,
                    status="scheduled",
                    is_live=False
                ),
                models.TripModel(
                    state="Punjab",
                    from_loc="Ludhiana, Punjab",
                    to_loc="Khanna, Punjab",
                    date="2026-08-20",
                    vehicle="Mini-Truck",
                    owner="Gurpreet Singh",
                    driver_phone="9608959215",
                    verified=True,
                    pct=30,
                    total_kg=1000,
                    price_per_kg=8,
                    pickup="Grain Market Gate 2, Ludhiana",
                    lat=30.9010,
                    lng=75.8573,
                    status="scheduled",
                    is_live=False
                ),
                models.TripModel(
                    state="Uttar Pradesh",
                    from_loc="Meerut, Uttar Pradesh",
                    to_loc="Ghaziabad, Uttar Pradesh",
                    date="2026-08-19",
                    vehicle="Heavy-Truck",
                    owner="Rajesh Yadav",
                    driver_phone="9608959215",
                    verified=False,
                    pct=85,
                    total_kg=4500,
                    price_per_kg=6,
                    pickup="Sadar Mandi Entrance, Meerut",
                    lat=28.9845,
                    lng=77.7064,
                    status="scheduled",
                    is_live=False
                ),
                models.TripModel(
                    state="Gujarat",
                    from_loc="Rajkot, Gujarat",
                    to_loc="Ahmedabad, Gujarat",
                    date="2026-08-22",
                    vehicle="Heavy-Truck",
                    owner="Mahesh Bhai Patel",
                    driver_phone="9608959215",
                    verified=True,
                    pct=45,
                    total_kg=8000,
                    price_per_kg=7,
                    pickup="NH27 Highway Dhaba Junction, Rajkot",
                    lat=22.3039,
                    lng=70.8022,
                    status="scheduled",
                    is_live=False
                ),
            ]

            db.add_all(initial_trips)
            db.commit()
            print("Initial trip data inserted successfully.")
        # Sync all existing trips with latest UserProfile driver phone numbers
        all_trips = db.query(models.TripModel).all()
        for t in all_trips:
            from services.dispatcher import resolve_user_contact_and_lang
            phone, _ = resolve_user_contact_and_lang(db, user_id=t.user_id, username_or_name=t.owner)
            if phone:
                t.driver_phone = phone
        db.commit()
        print("Trip data synced with latest driver phone numbers.")
    finally:
        db.close()


# =========================================================
# HOME PAGE
# =========================================================

@app.get("/")
def home():
    return {
        "message": "Krishi-Anna Backend is running!",
        "docs": "/docs",
        "login": "/login",
    }


# =========================================================
# AUTHENTICATION STATUS ENDPOINT
# =========================================================

@app.get("/auth/status")
def get_auth_status(current_user: Optional[User] = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    """
    Returns the authenticated user's profile status including driver
    verification documents (Aadhaar & Driving License).
    Gracefully returns authenticated=False if token is absent or expired.
    """
    if not current_user:
        return {
            "authenticated": False,
            "email": None,
            "is_profile_complete": False,
            "user_type": None,
            "full_name": None,
            "gender": None,
            "phone_number": None,
            "aadhaar_doc": None,
            "aadhaar_doc_url": None,
            "license_doc": None,
            "license_doc_url": None,
            "is_verified": False
        }

    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    
    is_complete = False
    user_type = None
    full_name = None
    gender = None
    phone_number = None
    aadhaar_doc = None
    license_doc = None
    is_verified = False
    
    if profile:
        phone_number = profile.phone_number
        user_type = profile.user_type
        full_name = profile.full_name
        gender = profile.gender
        aadhaar_doc = profile.aadhaar_doc
        license_doc = profile.license_doc
        is_verified = profile.is_verified
        if user_type == "driver":
            is_complete = bool(profile.phone_number and profile.aadhaar_doc and profile.license_doc)
        else:
            is_complete = bool(profile.phone_number and profile.user_type)
    
    # Fallback if profile not saved yet
    if not full_name:
        full_name = current_user.username
    
    # Build document URLs
    BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
    aadhaar_doc_url = f"{BASE_URL}/uploads/{aadhaar_doc}" if aadhaar_doc else None
    license_doc_url = f"{BASE_URL}/uploads/{license_doc}" if license_doc else None
    
    return {
        "authenticated": True,
        "email": current_user.email,
        "is_profile_complete": is_complete,
        "user_type": user_type,
        "full_name": full_name,
        "gender": gender,
        "phone_number": phone_number,
        "aadhaar_doc": aadhaar_doc,
        "aadhaar_doc_url": aadhaar_doc_url,
        "license_doc": license_doc,
        "license_doc_url": license_doc_url,
        "is_verified": is_verified
    }


# =========================================================
# LOGIN PAGE
# =========================================================

@app.get("/login")
def login_page(
    request: Request
):
    return templates.TemplateResponse(
        "login.html",
        {
            "request": request
        }
    )


# =========================================================
# USER DASHBOARD
# =========================================================

@app.get("/user")
def user_page(
    request: Request
):
    return templates.TemplateResponse(
        "user.html",
        {
            "request": request
        }
    )


# =========================================================
# DRIVER DASHBOARD
# =========================================================

@app.get("/driver")
def driver_page(
    request: Request
):
    return templates.TemplateResponse(
        "driver.html",
        {
            "request": request
        }
    )


# =========================================================
# ADMIN DASHBOARD
# =========================================================

@app.get("/admin")
def admin_page(
    request: Request
):
    return templates.TemplateResponse(
        "admin.html",
        {
            "request": request
        }
    )


# =========================================================
# REGISTER API ROUTERS
# =========================================================

# Authentication
app.include_router(
    auth.router
)

# Trips
app.include_router(
    trips.router
)

# Requests
app.include_router(
    requests.router
)

# Users
app.include_router(
    users.router
)

# Drivers
app.include_router(
    drivers.router
)

# Admin
app.include_router(
    admins.router
)

# AI Pricing & Market Validation
app.include_router(
    pricing.router
)

# Automated WhatsApp & SMS Dispatch Alerts
app.include_router(
    notifications.router
)

# Ground Logistics & Cold-Chain Operations
app.include_router(
    logistics.router
)