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
    state: Optional[str] = ""
    from_loc: Optional[str] = ""
    to_loc: Optional[str] = ""
    date: Optional[str] = ""
    vehicle: Optional[str] = ""
    owner: Optional[str] = ""
    verified: Optional[bool] = True
    pct: Optional[int] = 0
    total_kg: Optional[int] = 1000
    price_per_kg: Optional[float] = 0.0
    total_driver_amount: Optional[float] = 0.0
    distance_km: Optional[float] = 150.0
    pickup: Optional[str] = ""
    lat: Optional[float] = 0.0
    lng: Optional[float] = 0.0
    dest_lat: Optional[float] = 0.0
    dest_lng: Optional[float] = 0.0
    pickup_lat: Optional[float] = 0.0
    pickup_lng: Optional[float] = 0.0
    status: Optional[str] = "scheduled"
    is_live: Optional[bool] = False
    speed: Optional[float] = 0.0


class TripResponse(TripCreate):
    id: int
    total_booked_kg: Optional[float] = 0.0
    available_space_kg: Optional[float] = 0.0
    space_used_percentage: Optional[float] = 0.0
    total_kg_km: Optional[float] = 0.0
    passenger_count: Optional[int] = 0
    slots_total: Optional[int] = 5
    slots_filled: Optional[int] = 0
    partners: Optional[list[dict]] = []

    class Config:
        from_attributes = True



class TripLocationUpdate(BaseModel):
    lat: float
    lng: float
    speed: Optional[float] = 0.0
    status: Optional[str] = "in_transit"
    is_live: Optional[bool] = True



# ==================================================
# REQUEST SCHEMAS
# ==================================================

class RequestCreate(BaseModel):
    id: str
    route: Optional[str] = ""
    vehicle: Optional[str] = ""
    owner: Optional[str] = ""
    farmer_name: Optional[str] = ""
    kg: Optional[int] = 0
    goods_weight_kg: Optional[int] = None
    distance_km: Optional[float] = 150.0
    pickup_place: Optional[str] = None
    delivery_date: Optional[str] = None
    pickup_lat: Optional[float] = 0.0
    pickup_lng: Optional[float] = 0.0
    delivery_lat: Optional[float] = 0.0
    delivery_lng: Optional[float] = 0.0


class RequestResponse(RequestCreate):
    status: Optional[str] = "pending"
    goods_weight_kg: Optional[int] = None
    distance_km: Optional[float] = 150.0
    kg_km: Optional[float] = 0.0
    total_trip_kg_km: Optional[float] = 0.0
    share_pct: Optional[float] = 0.0
    per_person_share: Optional[float] = 0.0
    total_driver_amount: Optional[float] = 0.0
    total_payload_kg: Optional[float] = 0.0
    pickup_date: Optional[str] = None
    pickup_time: Optional[str] = None
    pickup_place: Optional[str] = None
    delivery_date: Optional[str] = None
    pickup_lat: Optional[float] = 0.0
    pickup_lng: Optional[float] = 0.0
    delivery_lat: Optional[float] = 0.0
    delivery_lng: Optional[float] = 0.0
    reason: Optional[str] = None
    rating: Optional[int] = None
    feedback: Optional[str] = None

    class Config:
        from_attributes = True



class ConfirmCompletionRequest(BaseModel):
    rating: Optional[int] = 5
    feedback: Optional[str] = None



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


# ==================================================
# AI PRICING & MARKET VALIDATION SCHEMAS
# ==================================================

class CalculateFareRequest(BaseModel):
    origin: str
    destination: str
    distance_km: float
    vehicle_model: Optional[str] = "Mini Truck"
    goods_weight_kg: Optional[float] = None
    custom_price: Optional[float] = None


class CalculateFareResponse(BaseModel):
    fairMinPrice: float
    fairMaxPrice: float
    recommendedPrice: float
    source: str
    breakdown: dict
    isExorbitant: bool = False
    warningMessage: Optional[str] = None


# ==================================================
# USER PTL PARTIAL LOAD COST DISTRIBUTION SCHEMAS
# ==================================================

class PtlSharerInfo(BaseModel):
    id: Optional[str] = None
    farmer_name: Optional[str] = "Co-sharing Partner"
    pickup_loc: Optional[str] = ""
    delivery_loc: Optional[str] = ""
    segment_distance_km: float = 150.0
    goods_weight_kg: float = 100.0


class CalculatePtlFareRequest(BaseModel):
    trip_id: Optional[int] = None
    total_driver_amount: float
    total_vehicle_capacity_kg: Optional[float] = 1000.0
    driver_full_distance_km: Optional[float] = 150.0
    user_pickup_loc: str
    user_delivery_loc: str
    user_segment_distance_km: float
    user_weight_kg: float
    other_sharers: Optional[list[PtlSharerInfo]] = []


class CalculatePtlFareResponse(BaseModel):
    is_shared: bool
    sharers_count: int
    user_final_price: float
    total_vehicle_price: float
    pricing_rule_applied: str
    source: str
    breakdown: dict
    voice_announcement_text: dict
    warning: Optional[str] = None