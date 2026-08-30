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


class ProfileCreateSchema(BaseModel):
    phone_number: str
    user_type: str = "sender"
    full_name: Optional[str] = None
    gender: Optional[str] = "Other"
    aadhaar_doc: Optional[str] = None
    license_doc: Optional[str] = None


class ProfileUpdateSchema(BaseModel):
    phone_number: Optional[str] = None
    user_type: Optional[str] = None
    full_name: Optional[str] = None
    gender: Optional[str] = None
    aadhaar_doc: Optional[str] = None
    license_doc: Optional[str] = None



# ==================================================
# STRICT VEHICLE CATEGORIES, PHYSICAL LIMITS & DISTANCE CONSTRAINTS
# ==================================================

VEHICLE_SPECS = {
    "Two-Wheeler": {
        "name": "Two-Wheeler",
        "display_name": "Two-Wheeler (Bike / Scooter)",
        "min_kg": 5,
        "default_kg": 30,
        "max_kg": 50,
        "max_distance_km": 20.0,
        "base_price": 150.0,
        "per_km_rate": 12.0,
        "efficiency_km_per_l": 40.0,
        "icon": "🛵",
        "aliases": ["two-wheeler", "bike", "scooter", "motorcycle", "2-wheeler"]
    },
    "Three-Wheeler/Auto": {
        "name": "Three-Wheeler/Auto",
        "display_name": "Three-Wheeler/Auto (Cargo Rickshaw)",
        "min_kg": 20,
        "default_kg": 200,
        "max_kg": 350,
        "max_distance_km": 100.0,
        "base_price": 350.0,
        "per_km_rate": 16.0,
        "efficiency_km_per_l": 25.0,
        "icon": "🛺",
        "aliases": ["three-wheeler/auto", "three-wheeler", "auto", "rickshaw", "3-wheeler", "auto rickshaw"]
    },
    "Mini-Truck": {
        "name": "Mini-Truck",
        "display_name": "Mini-Truck (Tata Ace / Pickup / Bolero)",
        "min_kg": 50,
        "default_kg": 800,
        "max_kg": 1500,
        "max_distance_km": 500.0,
        "base_price": 1200.0,
        "per_km_rate": 24.0,
        "efficiency_km_per_l": 14.0,
        "icon": "🛻",
        "aliases": ["mini-truck", "mini truck", "tata ace", "chota hathi", "pickup", "bolero", "van", "eeco", "jeeto", "supro", "yodha"]
    },
    "Heavy-Truck": {
        "name": "Heavy-Truck",
        "display_name": "Heavy-Truck (HCV / 10-Wheeler / Lorry)",
        "min_kg": 500,
        "default_kg": 8000,
        "max_kg": 25000,
        "max_distance_km": float("inf"),
        "base_price": 4500.0,
        "per_km_rate": 42.0,
        "efficiency_km_per_l": 4.5,
        "icon": "🚛",
        "aliases": ["heavy-truck", "heavy truck", "truck", "lorry", "hcv", "trailer", "10-wheeler", "12-wheeler", "tempo", "407", "canter", "tractor"]
    }
}

def get_vehicle_spec(vehicle_str: str) -> dict:
    if not vehicle_str:
        return VEHICLE_SPECS["Mini-Truck"]
    v = vehicle_str.lower().strip()
    
    # Exact category match
    for k, spec in VEHICLE_SPECS.items():
        if k.lower() == v:
            return spec
            
    # Alias / substring match
    for k, spec in VEHICLE_SPECS.items():
        for alias in spec["aliases"]:
            if alias in v:
                return spec
                
    return VEHICLE_SPECS["Mini-Truck"]

def get_vehicle_capacity_limits(vehicle_str: str) -> dict:
    spec = get_vehicle_spec(vehicle_str)
    return {
        "name": spec["display_name"],
        "default_kg": spec["default_kg"],
        "max_kg": spec["max_kg"],
        "min_kg": spec["min_kg"],
        "max_distance_km": spec["max_distance_km"],
        "base_price": spec["base_price"],
        "per_km_rate": spec["per_km_rate"]
    }


class TripCreate(BaseModel):
    state: Optional[str] = ""
    from_loc: Optional[str] = ""
    to_loc: Optional[str] = ""
    date: Optional[str] = ""
    vehicle: Optional[str] = "Mini Truck"
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
    pickup_cargo_image_url: Optional[str] = None
    delivery_proof_image_url: Optional[str] = None
    lang: Optional[str] = "hi"


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
    pickup_cargo_image_url: Optional[str] = None
    delivery_proof_image_url: Optional[str] = None
    driver_phone: Optional[str] = None

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
    farmer_phone: Optional[str] = None
    kg: Optional[int] = 0
    goods_weight_kg: Optional[int] = None
    distance_km: Optional[float] = 150.0
    pickup_place: Optional[str] = None
    delivery_date: Optional[str] = None
    pickup_lat: Optional[float] = 0.0
    pickup_lng: Optional[float] = 0.0
    delivery_lat: Optional[float] = 0.0
    delivery_lng: Optional[float] = 0.0
    pickup_cargo_image_url: Optional[str] = None
    delivery_proof_image_url: Optional[str] = None
    lang: Optional[str] = "hi"


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
    pickup_cargo_image_url: Optional[str] = None
    delivery_proof_image_url: Optional[str] = None
    farmer_phone: Optional[str] = None
    driver_phone: Optional[str] = None
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


class RequestStatusUpdate(BaseModel):
    status: Optional[str] = None
    reason: Optional[str] = None
    lang: Optional[str] = "hi"