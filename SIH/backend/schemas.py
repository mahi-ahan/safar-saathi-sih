from typing import Optional
from pydantic import BaseModel, Field, EmailStr
from models import UserRole


# ==================================================
# AUTHENTICATION SCHEMAS
# ==================================================

class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6)
    role: UserRole = UserRole.USER


class LoginRequest(BaseModel):
    username: str
    password: str
    role: UserRole


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: UserRole


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
# ==================================================
# USER SCHEMAS
# ==================================================

class UserResponse(BaseModel):
    id: int
    username: str
    role: UserRole

    class Config:
        from_attributes = True


# ==================================================
# TRIP SCHEMAS
# ==================================================

class TripCreate(BaseModel):
    state: str
    from_loc: str
    to_loc: str
    date: str
    vehicle: str
    owner: str
    verified: bool = True
    pct: int = 0
    total_kg: int = 1000
    price_per_kg: int = 0
    pickup: str
    lat: float
    lng: float


class TripResponse(TripCreate):
    id: int

    class Config:
        from_attributes = True


# ==================================================
# REQUEST SCHEMAS
# ==================================================

class RequestCreate(BaseModel):
    id: str
    route: str
    vehicle: str
    owner: str
    farmer_name: str
    kg: int


class RequestResponse(RequestCreate):
    status: str
    pickup_date: Optional[str] = None
    pickup_time: Optional[str] = None
    pickup_place: Optional[str] = None
    delivery_date: Optional[str] = None
    reason: Optional[str] = None

    class Config:
        from_attributes = True

    # ==================================================
# GOOGLE AUTH & PROFILE SCHEMAS (NEW)
# ==================================================

class GoogleAuthSchema(BaseModel):
    email: EmailStr
    name: str
    google_token: str


class ProfileCreateSchema(BaseModel):
    phone_number: str = Field(min_length=10, max_length=15)
    user_type: str = Field(..., description="e.g., sender or driver")
    full_name: Optional[str] = None
    gender: Optional[str] = None
    aadhaar_doc: Optional[str] = None
    license_doc: Optional[str] = None


class ProfileUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    gender: Optional[str] = None
    aadhaar_doc: Optional[str] = None
    license_doc: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: int
    phone_number: Optional[str] = None
    user_type: Optional[str] = None
    full_name: Optional[str] = None
    gender: Optional[str] = None
    aadhaar_doc: Optional[str] = None
    license_doc: Optional[str] = None
    is_verified: bool = False
    is_profile_complete: bool = False

    class Config:
        from_attributes = True