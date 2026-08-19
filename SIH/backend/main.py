from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from database import get_db, engine
import models
from models import User
from routers.auth import get_current_user  # Adjust import based on your project structure if needed

# Routers
from routers import auth
from routers import trips
from routers import requests
from routers import users
from routers import drivers
from routers import admins


# =========================================================
# DATABASE TABLE CREATION
# =========================================================

models.Base.metadata.create_all(bind=engine)


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
# SEED INITIAL TRIP DATA
# =========================================================

@app.on_event("startup")
def seed_data():
    db = next(get_db())
    try:
        # Only insert mock trips if table is empty
        if not db.query(
            models.TripModel
        ).first():
            initial_trips = [
                models.TripModel(
                    state="Maharashtra",
                    from_loc="Nashik",
                    to_loc="Pune",
                    date="2026-08-18",
                    vehicle="Pickup",
                    owner="Ramesh Patil",
                    verified=True,
                    pct=62,
                    total_kg=900,
                    price_per_kg=10,
                    pickup=(
                        "Sinnar bypass toll, "
                        "6:00 AM"
                    ),
                    lat=19.90,
                    lng=73.85,
                ),
                models.TripModel(
                    state="Punjab",
                    from_loc="Ludhiana",
                    to_loc="Khanna",
                    date="2026-08-20",
                    vehicle="Mini truck",
                    owner="Gurpreet Singh",
                    verified=True,
                    pct=30,
                    total_kg=1000,
                    price_per_kg=8,
                    pickup=(
                        "Grain market gate 2, "
                        "5:30 AM"
                    ),
                    lat=30.90,
                    lng=75.85,
                ),
                models.TripModel(
                    state="Uttar Pradesh",
                    from_loc="Meerut",
                    to_loc="Ghaziabad",
                    date="2026-08-19",
                    vehicle="Tractor-trolley",
                    owner="Rajesh Yadav",
                    verified=False,
                    pct=85,
                    total_kg=1000,
                    price_per_kg=6,
                    pickup=(
                        "Sadar mandi entrance, "
                        "7:00 AM"
                    ),
                    lat=28.98,
                    lng=77.70,
                ),
                models.TripModel(
                    state="Gujarat",
                    from_loc="Rajkot",
                    to_loc="Ahmedabad",
                    date="2026-08-22",
                    vehicle="Truck",
                    owner="Mahesh Bhai Patel",
                    verified=True,
                    pct=45,
                    total_kg=2000,
                    price_per_kg=7,
                    pickup=(
                        "NH27 highway dhaba junction, "
                        "5:00 AM"
                    ),
                    lat=22.30,
                    lng=70.80,
                ),
            ]

            db.add_all(initial_trips)
            db.commit()
            print(
                "Initial trip data inserted successfully."
            )
        else:
            print(
                "Trip data already exists. "
                "Skipping seed."
            )
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
def get_auth_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns the authenticated user's profile status including driver
    verification documents (Aadhaar & Driving License).
    """
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
        if profile.phone_number:
            is_complete = True
    
    # Fallback if profile not saved yet
    if not full_name:
        full_name = current_user.username
    
    return {
        "email": current_user.email,
        "is_profile_complete": is_complete,
        "user_type": user_type,
        "full_name": full_name,
        "gender": gender,
        "phone_number": phone_number,
        "aadhaar_doc": aadhaar_doc,
        "license_doc": license_doc,
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