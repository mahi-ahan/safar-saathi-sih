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
    return_trip_id: Optional[int] = None
    is_return_leg: Optional[bool] = False
    return_discount_pct: Optional[int] = 0
    has_perishables: Optional[bool] = False
    ice_handling_supported: Optional[bool] = False
    current_checkpoint: Optional[str] = None
    checkpoint_count: Optional[int] = 0
    cargo_category: Optional[str] = "Independent / General Cargo"
    dedicated_sub_category: Optional[str] = None
    is_dedicated: Optional[bool] = False
    seal_number: Optional[str] = None
    seal_status: Optional[str] = None
    last_weigh_in_kg: Optional[float] = None
    weight_compliant: Optional[bool] = None
    cooling_type: Optional[str] = None
    target_temp_c: Optional[float] = None


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
    is_booking_open: Optional[bool] = True
    booking_lock_reason: Optional[str] = None
    outbound_trip_status: Optional[str] = None
    can_start_trip: Optional[bool] = True
    start_lock_reason: Optional[str] = None
    is_load_verified: Optional[bool] = True
    unverified_cargo_count: Optional[int] = 0
    has_return_leg: Optional[bool] = False
    has_perishables: Optional[bool] = False
    ice_handling_supported: Optional[bool] = False
    current_checkpoint: Optional[str] = None
    checkpoint_count: Optional[int] = 0
    cargo_category: Optional[str] = "Independent / General Cargo"
    dedicated_sub_category: Optional[str] = None
    is_dedicated: Optional[bool] = False
    seal_number: Optional[str] = None
    seal_status: Optional[str] = None
    last_weigh_in_kg: Optional[float] = None
    weight_compliant: Optional[bool] = None
    cooling_type: Optional[str] = None
    target_temp_c: Optional[float] = None
    # State Machine lifecycle fields
    inspection_status: Optional[str] = "not_started"
    inspection_completed: Optional[bool] = False
    max_inspections: Optional[int] = 1
    inspections_remaining: Optional[int] = 0
    checkpoints: Optional[list[dict]] = []
    goods_area_status: Optional[str] = "not_started"
    goods_area_reached_at: Optional[str] = None
    goods_area_confirmed_at: Optional[str] = None
    return_started_at: Optional[str] = None

    class Config:
        from_attributes = True


class TripInspectionStartRequest(BaseModel):
    officer_name: Optional[str] = None
    station_name: Optional[str] = None


class TripInspectionCompleteRequest(BaseModel):
    officer_name: Optional[str] = "Officer"
    seal_number: Optional[str] = None
    seal_status: Optional[str] = "verified_intact"
    measured_weight_kg: Optional[float] = None
    cargo_condition: Optional[str] = "Good"
    notes: Optional[str] = "Inspection confirmed and stamped."


class TripGoodsAreaReachRequest(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    notes: Optional[str] = None


class TripGoodsAreaConfirmRequest(BaseModel):
    confirmed_by: Optional[str] = "Driver"
    notes: Optional[str] = None


class TripReturnStartRequest(BaseModel):
    notes: Optional[str] = None


class TripStateMachineResponse(BaseModel):
    trip_id: int
    inspection_status: str
    inspection_completed: bool
    can_start_inspection: bool
    goods_area_status: str
    trip_started: bool
    vehicle_travelling: bool
    vehicle_reaches_goods_area: bool
    goods_area_confirmed: bool
    return_trip_enabled: bool
    return_trip_started: bool
    goods_area_reached_at: Optional[str] = None
    goods_area_confirmed_at: Optional[str] = None
    return_started_at: Optional[str] = None
    distance_km: Optional[float] = None
    max_inspections: Optional[int] = 1
    checkpoint_count: Optional[int] = 0
    inspections_remaining: Optional[int] = 0
    message: Optional[str] = None



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
    trip_id: Optional[int] = None
    trip_date: Optional[str] = None
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
    is_perishable: Optional[bool] = False
    cargo_type: Optional[str] = "General"
    ice_handling_required: Optional[bool] = False
    current_temp_c: Optional[float] = None
    loading_status: Optional[str] = "pending"
    loaded_at: Optional[str] = None
    loaded_by: Optional[str] = None
    unloaded_at: Optional[str] = None
    unloaded_by: Optional[str] = None
    ice_boxes_count: Optional[int] = 0
    ice_added: Optional[bool] = False
    ice_added_stage: Optional[str] = None
    ice_added_at: Optional[str] = None
    ice_unavailable_at_pickup: Optional[bool] = False
    cargo_category: Optional[str] = "Independent / General Cargo"
    dedicated_sub_category: Optional[str] = None
    is_dedicated: Optional[bool] = False
    commodity: Optional[str] = None
    seal_number: Optional[str] = None
    seal_status: Optional[str] = None
    verified_weight_kg: Optional[float] = None
    weight_compliant: Optional[bool] = None
    cooling_type: Optional[str] = None
    target_temp_c: Optional[float] = None
    ice_surcharge: Optional[float] = 0.0


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
    is_perishable: Optional[bool] = False
    cargo_type: Optional[str] = "General"
    ice_handling_required: Optional[bool] = False
    ice_surcharge: Optional[float] = 0.0
    current_temp_c: Optional[float] = None
    loading_status: Optional[str] = "pending"
    loaded_at: Optional[str] = None
    loaded_by: Optional[str] = None
    unloaded_at: Optional[str] = None
    unloaded_by: Optional[str] = None
    ice_boxes_count: Optional[int] = 0
    ice_added: Optional[bool] = False
    ice_added_stage: Optional[str] = None
    ice_added_at: Optional[str] = None
    ice_unavailable_at_pickup: Optional[bool] = False
    current_checkpoint: Optional[str] = None
    checkpoint_count: Optional[int] = 0
    max_inspections: Optional[int] = 1
    inspections_remaining: Optional[int] = 0
    checkpoints: Optional[list[dict]] = []

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
    is_ice_requested: Optional[bool] = False
    trip_cargo_category: Optional[str] = None


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


# ==================================================
# MULTI-STOP ROUTE OPTIMIZATION & PRIM'S MST SCHEMAS
# ==================================================

class WaypointStopSchema(BaseModel):
    id: Optional[str] = None
    name: str
    lat: float
    lng: float
    type: str = "pickup"  # "origin", "pickup", "delivery", "destination"
    weight_kg: float = 0.0
    booking_id: Optional[str] = None


class OptimizeRouteRequest(BaseModel):
    trip_id: Optional[int] = None
    vehicle_capacity_kg: Optional[float] = 1000.0
    origin: WaypointStopSchema
    destination: WaypointStopSchema
    intermediate_stops: list[WaypointStopSchema] = []
    max_detour_km: Optional[float] = 1.0


class MstEdgeSchema(BaseModel):
    from_node: str
    to_node: str
    distance_km: float


class OrderedStopSchema(BaseModel):
    sequence: int
    id: Optional[str] = None
    name: str
    lat: float
    lng: float
    type: str
    weight_kg: float
    booking_id: Optional[str] = None
    distance_from_prev_km: float = 0.0
    duration_from_prev_mins: float = 0.0
    cumulative_payload_kg: float = 0.0
    is_capacity_exceeded: bool = False


class OptimizeRouteResponse(BaseModel):
    success: bool
    algorithm: str = "KD-Tree Spatial Indexer + A* Goal-Directed Heuristic Optimizer"
    execution_time_ms: float = 0.0
    total_distance_km: float
    total_duration_mins: float
    ordered_stops: list[OrderedStopSchema]
    mst_total_weight_km: float = 0.0
    mst_edges: list[MstEdgeSchema] = []
    max_payload_kg: float
    is_valid_route: bool
    notes: Optional[str] = None


# ==================================================
# LOGISTICS OPERATIONS & COLD-CHAIN SCHEMAS
# ==================================================

class LogisticsRegisterRequest(BaseModel):
    name: str
    phone_number: str
    password: str
    station: str
    station_lat: Optional[float] = None
    station_lng: Optional[float] = None
    id_proof_doc: Optional[str] = None


class LogisticsLoginCredentialsRequest(BaseModel):
    phone_number: str
    password: str


class LogisticsLoginRequest(BaseModel):
    name: Optional[str] = None
    phone_number: str
    password: Optional[str] = None
    station: Optional[str] = "Nashik Agri-Corridor Hub"
    station_lat: Optional[float] = None
    station_lng: Optional[float] = None
    id_proof_doc: Optional[str] = None


class LogisticsProfileResponse(BaseModel):
    id: int
    name: str
    phone_number: str
    user_type: str = "logistics"
    station: str
    station_lat: Optional[float] = None
    station_lng: Optional[float] = None
    id_proof_doc: Optional[str] = None
    id_proof_doc_url: Optional[str] = None
    is_verified: bool = True
    token: Optional[str] = None


class LogisticsCheckpointCreate(BaseModel):
    trip_id: int
    checkpoint_name: str
    officer_name: str
    officer_phone: Optional[str] = None
    cargo_seal_intact: bool = True
    seal_number: Optional[str] = None
    seal_status: Optional[str] = "Verified & Intact"
    measured_weight_kg: Optional[float] = None
    declared_weight_kg: Optional[float] = None
    weight_discrepancy_kg: Optional[float] = None
    weight_compliant: Optional[bool] = None
    safety_parameters_status: Optional[str] = "Compliant"
    cooling_status: Optional[str] = None
    checkpoint_type: Optional[str] = "Highway Toll Plaza"
    cargo_condition: str = "Good"
    ice_status: str = "Adequate"
    temp_celsius: Optional[float] = None
    notes: Optional[str] = None
    proof_image_url: Optional[str] = None
    action_taken: Optional[str] = None


class LoadingEventRequest(BaseModel):
    request_id: str
    officer_name: str
    loading_type: str = "pickup"  # "pickup" (loading) or "drop" (unloading)
    verified_weight_kg: Optional[float] = None
    seal_number: Optional[str] = None
    seal_status: Optional[str] = "Sealed & Intact"
    ice_boxes_added: Optional[int] = 0
    ice_unavailable_at_pickup: Optional[bool] = False
    temp_celsius: Optional[float] = None
    notes: Optional[str] = None


class IceHandlingRequest(BaseModel):
    request_id: Optional[str] = None
    trip_id: Optional[int] = None
    officer_name: str
    ice_kg_added: float = 5.0
    ice_type: str = "Crushed Ice"  # "Crushed Ice", "Gel Packs", "Dry Ice"
    temp_before: Optional[float] = None
    temp_after: Optional[float] = None
    notes: Optional[str] = None
    stage: Optional[str] = None  # "pickup", "checkpoint"
    checkpoint_name: Optional[str] = None