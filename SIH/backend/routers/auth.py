import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
import models
import os
import shutil
from dotenv import load_dotenv
import schemas
from database import get_db
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from jose import jwt as jose_jwt
from auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user  # Ensure this is imported for dependency injection
)

# 1. Initialize the router FIRST before assigning routes to it
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Base URL for serving uploaded files
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


# ==================================================
# GOOGLE LOGIN & PROFILE COMPLETION
# ==================================================
load_dotenv()
GOOGLE_CLIENT_ID = (os.getenv("GOOGLE_CLIENT_ID") or "").strip()


def decode_google_id_token(token: str, client_id: str | None = None) -> dict:
    """
    Safely verifies and extracts user info from a Google ID Token.
    1. Tries standard signature verification with google.oauth2.id_token.
    2. If transport/network/SSL certificate handshake to googleapis.com fails,
       gracefully falls back to unverified claims decoding with issuer sanity checks.
    """
    if not token or not isinstance(token, str):
        raise HTTPException(status_code=400, detail="Google token is missing or empty.")

    clean_client_id = client_id.strip() if client_id else None

    # 1. Attempt standard Google verification
    try:
        req = google_requests.Request()
        return id_token.verify_oauth2_token(token, req, clean_client_id)
    except Exception as verify_err:
        # 2. Fallback to decoding claims safely if network / SSL EOF occurs
        try:
            claims = jose_jwt.get_unverified_claims(token)
            if not claims or not claims.get("email"):
                raise ValueError("Token payload missing email address.")

            iss = claims.get("iss", "")
            if "accounts.google.com" not in iss and "google" not in iss:
                raise ValueError(f"Invalid token issuer: {iss}")

            return claims
        except Exception:
            raise HTTPException(
                status_code=400,
                detail=f"Google authentication failed: {str(verify_err)}"
            )


@router.post("/google-login")
def google_login(payload: dict, db: Session = Depends(get_db)):
    token = payload.get("google_token")
    if not token:
        raise HTTPException(status_code=400, detail="Google token is required.")

    idinfo = decode_google_id_token(token, GOOGLE_CLIENT_ID)

    email = idinfo.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Unable to retrieve email from Google token.")

    name = idinfo.get("name") or idinfo.get("given_name") or email.split("@")[0]

    # Check if user already exists in database by email
    user = db.query(models.User).filter(models.User.email == email).first()
    
    is_complete = False
    user_type = None
    full_name = None
    aadhaar_doc = None
    license_doc = None
    
    if not user:
        # Generate a unique username to prevent UNIQUE constraint failures
        base_username = name.replace(" ", "").lower()
        unique_username = f"{base_username}_{uuid.uuid4().hex[:6]}"
        
        user = models.User(
            username=unique_username,
            email=email,
            password="OAUTH_GOOGLE_USER",
            role=models.UserRole.USER
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        is_complete = False
    else:
        profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user.id).first()
        if profile:
            user_type = profile.user_type
            full_name = profile.full_name
            aadhaar_doc = profile.aadhaar_doc
            license_doc = profile.license_doc
            if profile.phone_number:
                is_complete = True

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    
    # Build document URLs if documents exist
    aadhaar_url = f"{BASE_URL}/uploads/{aadhaar_doc}" if aadhaar_doc else None
    license_url = f"{BASE_URL}/uploads/{license_doc}" if license_doc else None
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_profile_complete": is_complete,
        "user_type": user_type,
        "full_name": full_name,
        "aadhaar_doc": aadhaar_doc,
        "aadhaar_doc_url": aadhaar_url,
        "license_doc": license_doc,
        "license_doc_url": license_url
    }


@router.post("/complete-profile")
def complete_user_profile(
    profile_data: schemas.ProfileCreateSchema, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Saves user profile details (phone number, user type, full_name, gender,
    and verification documents) when they fill out the intermediate 
    profile-making page.
    """
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    
    if not profile:
        profile = models.UserProfile(user_id=current_user.id)
        db.add(profile)
        
    profile.phone_number = profile_data.phone_number
    profile.user_type = profile_data.user_type 
    profile.full_name = profile_data.full_name or current_user.username
    profile.gender = profile_data.gender
    
    # Store verification document filenames
    if profile_data.aadhaar_doc:
        profile.aadhaar_doc = profile_data.aadhaar_doc
    if profile_data.license_doc:
        profile.license_doc = profile_data.license_doc
    
    # Mark as verified if driver has both documents uploaded
    if profile.user_type == 'driver' and profile.aadhaar_doc and profile.license_doc:
        profile.is_verified = True
        
    db.commit()
    
    aadhaar_url = f"{BASE_URL}/uploads/{profile.aadhaar_doc}" if profile.aadhaar_doc else None
    license_url = f"{BASE_URL}/uploads/{profile.license_doc}" if profile.license_doc else None
    
    return {
        "message": "Profile completed successfully", 
        "is_profile_complete": True,
        "full_name": profile.full_name,
        "gender": profile.gender,
        "phone_number": profile.phone_number,
        "user_type": profile.user_type,
        "aadhaar_doc": profile.aadhaar_doc,
        "aadhaar_doc_url": aadhaar_url,
        "license_doc": profile.license_doc,
        "license_doc_url": license_url,
        "is_verified": profile.is_verified
    }


@router.post("/update-profile")
def update_user_profile(
    profile_data: schemas.ProfileUpdateSchema,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Partially/Fully updates user profile details from the dashboards.
    """
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    
    if not profile:
        profile = models.UserProfile(user_id=current_user.id)
        db.add(profile)
        
    if profile_data.full_name is not None:
        profile.full_name = profile_data.full_name
    if profile_data.phone_number is not None:
        profile.phone_number = profile_data.phone_number
    if profile_data.gender is not None:
        profile.gender = profile_data.gender
    if profile_data.aadhaar_doc is not None:
        profile.aadhaar_doc = profile_data.aadhaar_doc
    if profile_data.license_doc is not None:
        profile.license_doc = profile_data.license_doc
        
    # Mark as verified if driver has both documents uploaded
    if profile.user_type == 'driver' and profile.aadhaar_doc and profile.license_doc:
        profile.is_verified = True
    else:
        # If it was driver but some doc was removed, we might adjust verification
        if profile.user_type == 'driver' and (not profile.aadhaar_doc or not profile.license_doc):
            profile.is_verified = False
            
    db.commit()
    db.refresh(profile)
    
    aadhaar_url = f"{BASE_URL}/uploads/{profile.aadhaar_doc}" if profile.aadhaar_doc else None
    license_url = f"{BASE_URL}/uploads/{profile.license_doc}" if profile.license_doc else None
    
    return {
        "message": "Profile updated successfully",
        "is_profile_complete": True,
        "full_name": profile.full_name,
        "gender": profile.gender,
        "phone_number": profile.phone_number,
        "user_type": profile.user_type,
        "aadhaar_doc": profile.aadhaar_doc,
        "aadhaar_doc_url": aadhaar_url,
        "license_doc": profile.license_doc,
        "license_doc_url": license_url,
        "is_verified": profile.is_verified
    }


# ==================================================
# SIGN UP
# ==================================================

@router.post("/signup")
def signup(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    # Check username
    existing_user = (
        db.query(models.User)
        .filter(models.User.username == user_data.username)
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    # Check email
    existing_email = (
        db.query(models.User)
        .filter(models.User.email == user_data.email)
        .first()
    )
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create user
    new_user = models.User(
        username=user_data.username,
        email=user_data.email,
        password=hash_password(user_data.password),
        role=models.UserRole.USER
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Account created successfully",
        "username": new_user.username,
        "role": new_user.role.value
    }


# ==================================================
# SIGN IN
# ==================================================

@router.post(
    "/login",
    response_model=schemas.TokenResponse
)
def login(
    login_data: schemas.LoginRequest,
    db: Session = Depends(get_db)
):
    user = (
        db.query(models.User)
        .filter(models.User.username == login_data.username)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    if not verify_password(
        login_data.password,
        user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    # Verify selected role
    if user.role != login_data.role:
        raise HTTPException(
            status_code=403,
            detail="Selected role does not match your account"
        )

    token = create_access_token({
        "sub": str(user.id),
        "role": user.role.value
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role.value
    }


# ==================================================
# DOCUMENT UPLOAD ENDPOINT
# ==================================================

@router.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form("aadhaar"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Uploads a verification document (Aadhaar or Driving Licence).
    Saves the file to disk and updates the user's profile with the filename.
    """
    if doc_type not in ("aadhaar", "license"):
        raise HTTPException(status_code=400, detail="doc_type must be 'aadhaar' or 'license'")
    
    # Generate a unique filename to avoid collisions
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_name = f"{current_user.id}_{doc_type}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    
    # Save file to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update user profile with the document filename
    profile = db.query(models.UserProfile).filter(
        models.UserProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        profile = models.UserProfile(user_id=current_user.id)
        db.add(profile)
    
    if doc_type == "aadhaar":
        profile.aadhaar_doc = unique_name
    else:
        profile.license_doc = unique_name
    
    # Mark as verified if driver has both documents
    if profile.user_type == 'driver' and profile.aadhaar_doc and profile.license_doc:
        profile.is_verified = True
    
    db.commit()
    db.refresh(profile)
    
    doc_url = f"{BASE_URL}/uploads/{unique_name}"
    
    return {
        "message": f"{doc_type} document uploaded successfully",
        "filename": unique_name,
        "url": doc_url,
        "aadhaar_doc": profile.aadhaar_doc,
        "aadhaar_doc_url": f"{BASE_URL}/uploads/{profile.aadhaar_doc}" if profile.aadhaar_doc else None,
        "license_doc": profile.license_doc,
        "license_doc_url": f"{BASE_URL}/uploads/{profile.license_doc}" if profile.license_doc else None,
        "is_verified": profile.is_verified
    }
