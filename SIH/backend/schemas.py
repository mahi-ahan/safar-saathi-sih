
from pydantic import BaseModel, EmailStr, Field

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
    full_name: str | None = None
    gender: str | None = "Other"
    aadhaar_doc: str | None = None
    license_doc: str | None = None


class ProfileUpdateSchema(BaseModel):
    phone_number: str | None = None
    user_type: str | None = None
    full_name: str | None = None
    gender: str | None = None
    aadhaar_doc: str | None = None
    license_doc: str | None = None



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
    state: str | None = ""
    from_loc: str | None = ""
    to_loc: str | None = ""
    date: str | None = ""
    vehicle: str | None = "Mini Truck"
    owner: str | None = ""
    verified: bool | None = True
    pct: int | None = 0
    total_kg: int | None = 1000
    price_per_kg: float | None = 0.0
    total_driver_amount: float | None = 0.0
    distance_km: float | None = 150.0
    pickup: str | None = ""
    lat: float | None = 0.0
    lng: float | None = 0.0
    dest_lat: float | None = 0.0
    dest_lng: float | None = 0.0
    pickup_lat: float | None = 0.0
    pickup_lng: float | None = 0.0
    status: str | None = "scheduled"
    is_live: bool | None = False
    speed: float | None = 0.0
    pickup_cargo_image_url: str | None = None
    delivery_proof_image_url: str | None = None
    lang: str | None = "hi"
    return_trip_id: int | None = None
    is_return_leg: bool | None = False
    return_discount_pct: int | None = 0
    has_perishables: bool | None = False
    ice_handling_supported: bool | None = False
    current_checkpoint: str | None = None
    checkpoint_count: int | None = 0
    cargo_category: str | None = "Independent / General Cargo"
    dedicated_sub_category: str | None = None
    is_dedicated: bool | None = False
    seal_number: str | None = None
    seal_status: str | None = None
    last_weigh_in_kg: float | None = None
    weight_compliant: bool | None = None
    cooling_type: str | None = None
    target_temp_c: float | None = None


class TripResponse(TripCreate):
    id: int
    total_booked_kg: float | None = 0.0
    available_space_kg: float | None = 0.0
    space_used_percentage: float | None = 0.0
    total_kg_km: float | None = 0.0
    passenger_count: int | None = 0
    slots_total: int | None = 5
    slots_filled: int | None = 0
    partners: list[dict] | None = []
    pickup_cargo_image_url: str | None = None
    delivery_proof_image_url: str | None = None
    driver_phone: str | None = None
    is_booking_open: bool | None = True
    booking_lock_reason: str | None = None
    outbound_trip_status: str | None = None
    can_start_trip: bool | None = True
    start_lock_reason: str | None = None
    is_load_verified: bool | None = True
    unverified_cargo_count: int | None = 0
    has_return_leg: bool | None = False
    has_perishables: bool | None = False
    ice_handling_supported: bool | None = False
    current_checkpoint: str | None = None
    checkpoint_count: int | None = 0
    cargo_category: str | None = "Independent / General Cargo"
    dedicated_sub_category: str | None = None
    is_dedicated: bool | None = False
    seal_number: str | None = None
    seal_status: str | None = None
    last_weigh_in_kg: float | None = None
    weight_compliant: bool | None = None
    cooling_type: str | None = None
    target_temp_c: float | None = None
    # State Machine lifecycle fields
    inspection_status: str | None = "not_started"
    inspection_completed: bool | None = False
    max_inspections: int | None = 1
    inspections_remaining: int | None = 0
    next_inspection_point: str | None = None
    next_inspection_lat: float | None = None
    next_inspection_lng: float | None = None
    is_unload_allowed: bool | None = False
    unload_lock_reason: str | None = None
    designated_checkpoints: list[dict] | None = []
    checkpoints: list[dict] | None = []
    goods_area_status: str | None = "not_started"
    goods_area_reached_at: str | None = None
    goods_area_confirmed_at: str | None = None
    return_started_at: str | None = None

    class Config:
        from_attributes = True


class TripInspectionStartRequest(BaseModel):
    officer_name: str | None = None
    station_name: str | None = None


class TripInspectionCompleteRequest(BaseModel):
    officer_name: str | None = "Officer"
    seal_number: str | None = None
    seal_status: str | None = "verified_intact"
    measured_weight_kg: float | None = None
    cargo_condition: str | None = "Good"
    notes: str | None = "Inspection confirmed and stamped."


class TripGoodsAreaReachRequest(BaseModel):
    lat: float | None = None
    lng: float | None = None
    notes: str | None = None


class TripGoodsAreaConfirmRequest(BaseModel):
    confirmed_by: str | None = "Driver"
    notes: str | None = None


class TripReturnStartRequest(BaseModel):
    notes: str | None = None


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
    goods_area_reached_at: str | None = None
    goods_area_confirmed_at: str | None = None
    return_started_at: str | None = None
    distance_km: float | None = None
    max_inspections: int | None = 1
    checkpoint_count: int | None = 0
    inspections_remaining: int | None = 0
    message: str | None = None



class TripLocationUpdate(BaseModel):
    lat: float
    lng: float
    speed: float | None = 0.0
    status: str | None = "in_transit"
    is_live: bool | None = True



# ==================================================
# REQUEST SCHEMAS
# ==================================================

class RequestCreate(BaseModel):
    id: str
    trip_id: int | None = None
    trip_date: str | None = None
    route: str | None = ""
    vehicle: str | None = ""
    owner: str | None = ""
    farmer_name: str | None = ""
    farmer_phone: str | None = None
    kg: int | None = 0
    goods_weight_kg: int | None = None
    distance_km: float | None = 150.0
    pickup_place: str | None = None
    delivery_date: str | None = None
    pickup_lat: float | None = 0.0
    pickup_lng: float | None = 0.0
    delivery_lat: float | None = 0.0
    delivery_lng: float | None = 0.0
    pickup_cargo_image_url: str | None = None
    delivery_proof_image_url: str | None = None
    lang: str | None = "hi"
    is_perishable: bool | None = False
    cargo_type: str | None = "General"
    ice_handling_required: bool | None = False
    current_temp_c: float | None = None
    loading_status: str | None = "pending"
    loaded_at: str | None = None
    loaded_by: str | None = None
    unloaded_at: str | None = None
    unloaded_by: str | None = None
    ice_boxes_count: int | None = 0
    ice_added: bool | None = False
    ice_added_stage: str | None = None
    ice_added_at: str | None = None
    ice_unavailable_at_pickup: bool | None = False
    cargo_category: str | None = "Independent / General Cargo"
    dedicated_sub_category: str | None = None
    is_dedicated: bool | None = False
    commodity: str | None = None
    seal_number: str | None = None
    seal_status: str | None = None
    verified_weight_kg: float | None = None
    weight_compliant: bool | None = None
    cooling_type: str | None = None
    target_temp_c: float | None = None
    ice_surcharge: float | None = 0.0


class RequestResponse(RequestCreate):
    status: str | None = "pending"
    goods_weight_kg: int | None = None
    distance_km: float | None = 150.0
    kg_km: float | None = 0.0
    total_trip_kg_km: float | None = 0.0
    share_pct: float | None = 0.0
    per_person_share: float | None = 0.0
    total_driver_amount: float | None = 0.0
    total_payload_kg: float | None = 0.0
    pickup_date: str | None = None
    pickup_time: str | None = None
    pickup_place: str | None = None
    delivery_date: str | None = None
    pickup_lat: float | None = 0.0
    pickup_lng: float | None = 0.0
    delivery_lat: float | None = 0.0
    delivery_lng: float | None = 0.0
    pickup_cargo_image_url: str | None = None
    delivery_proof_image_url: str | None = None
    farmer_phone: str | None = None
    driver_phone: str | None = None
    reason: str | None = None
    rating: int | None = None
    feedback: str | None = None
    is_perishable: bool | None = False
    cargo_type: str | None = "General"
    ice_handling_required: bool | None = False
    ice_surcharge: float | None = 0.0
    current_temp_c: float | None = None
    loading_status: str | None = "pending"
    loaded_at: str | None = None
    loaded_by: str | None = None
    unloaded_at: str | None = None
    unloaded_by: str | None = None
    ice_boxes_count: int | None = 0
    ice_added: bool | None = False
    ice_added_stage: str | None = None
    ice_added_at: str | None = None
    ice_unavailable_at_pickup: bool | None = False
    current_checkpoint: str | None = None
    checkpoint_count: int | None = 0
    max_inspections: int | None = 1
    inspections_remaining: int | None = 0
    checkpoints: list[dict] | None = []

    class Config:
        from_attributes = True



class ConfirmCompletionRequest(BaseModel):
    rating: int | None = 5
    feedback: str | None = None



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
    full_name: str | None = None
    gender: str | None = None
    aadhaar_doc: str | None = None
    license_doc: str | None = None


class ProfileUpdateSchema(BaseModel):
    full_name: str | None = None
    phone_number: str | None = None
    gender: str | None = None
    aadhaar_doc: str | None = None
    license_doc: str | None = None


class UserProfileResponse(BaseModel):
    id: int
    phone_number: str | None = None
    user_type: str | None = None
    full_name: str | None = None
    gender: str | None = None
    aadhaar_doc: str | None = None
    license_doc: str | None = None
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
    vehicle_model: str | None = "Mini Truck"
    goods_weight_kg: float | None = None
    custom_price: float | None = None


class CalculateFareResponse(BaseModel):
    fairMinPrice: float
    fairMaxPrice: float
    recommendedPrice: float
    source: str
    breakdown: dict
    isExorbitant: bool = False
    warningMessage: str | None = None


# ==================================================
# USER PTL PARTIAL LOAD COST DISTRIBUTION SCHEMAS
# ==================================================

class PtlSharerInfo(BaseModel):
    id: str | None = None
    farmer_name: str | None = "Co-sharing Partner"
    pickup_loc: str | None = ""
    delivery_loc: str | None = ""
    segment_distance_km: float = 150.0
    goods_weight_kg: float = 100.0


class CalculatePtlFareRequest(BaseModel):
    trip_id: int | None = None
    total_driver_amount: float
    total_vehicle_capacity_kg: float | None = 1000.0
    driver_full_distance_km: float | None = 150.0
    user_pickup_loc: str
    user_delivery_loc: str
    user_segment_distance_km: float
    user_weight_kg: float
    other_sharers: list[PtlSharerInfo] | None = []
    is_ice_requested: bool | None = False
    trip_cargo_category: str | None = None


class CalculatePtlFareResponse(BaseModel):
    is_shared: bool
    sharers_count: int
    user_final_price: float
    total_vehicle_price: float
    pricing_rule_applied: str
    source: str
    breakdown: dict
    voice_announcement_text: dict
    warning: str | None = None


class RequestStatusUpdate(BaseModel):
    status: str | None = None
    reason: str | None = None
    lang: str | None = "hi"


# ==================================================
# MULTI-STOP ROUTE OPTIMIZATION & PRIM'S MST SCHEMAS
# ==================================================

class WaypointStopSchema(BaseModel):
    id: str | None = None
    name: str
    lat: float
    lng: float
    type: str = "pickup"  # "origin", "pickup", "delivery", "destination"
    weight_kg: float = 0.0
    booking_id: str | None = None


class OptimizeRouteRequest(BaseModel):
    trip_id: int | None = None
    vehicle_capacity_kg: float | None = 1000.0
    origin: WaypointStopSchema
    destination: WaypointStopSchema
    intermediate_stops: list[WaypointStopSchema] = []
    max_detour_km: float | None = 1.0


class MstEdgeSchema(BaseModel):
    from_node: str
    to_node: str
    distance_km: float


class OrderedStopSchema(BaseModel):
    sequence: int
    id: str | None = None
    name: str
    lat: float
    lng: float
    type: str
    weight_kg: float
    booking_id: str | None = None
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
    notes: str | None = None


# ==================================================
# LOGISTICS OPERATIONS & COLD-CHAIN SCHEMAS
# ==================================================

class LogisticsRegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    name: str
    phone_number: str
    password: str
    station: str
    station_lat: float | None = None
    station_lng: float | None = None
    id_proof_doc: str | None = None


class LogisticsLoginCredentialsRequest(BaseModel):
    username_or_phone: str | None = None
    phone_number: str | None = None
    username: str | None = None
    password: str


class LogisticsLoginRequest(BaseModel):
    username: str | None = None
    name: str | None = None
    phone_number: str
    password: str | None = None
    station: str | None = "Nashik Agri-Corridor Hub"
    station_lat: float | None = None
    station_lng: float | None = None
    id_proof_doc: str | None = None


class LogisticsProfileResponse(BaseModel):
    id: int
    username: str | None = None
    name: str
    phone_number: str
    user_type: str = "logistics"
    station: str
    station_lat: float | None = None
    station_lng: float | None = None
    id_proof_doc: str | None = None
    id_proof_doc_url: str | None = None
    is_verified: bool = True
    token: str | None = None


class LogisticsCheckpointCreate(BaseModel):
    trip_id: int
    checkpoint_name: str
    officer_name: str
    officer_phone: str | None = None
    officer_station: str | None = None
    officer_station_lat: float | None = None
    officer_station_lng: float | None = None
    cargo_seal_intact: bool = True
    seal_number: str | None = None
    seal_status: str | None = "Verified & Intact"
    measured_weight_kg: float | None = None
    declared_weight_kg: float | None = None
    weight_discrepancy_kg: float | None = None
    weight_compliant: bool | None = None
    safety_parameters_status: str | None = "Compliant"
    cooling_status: str | None = None
    checkpoint_type: str | None = "Highway Toll Plaza"
    cargo_condition: str = "Good"
    ice_status: str = "Adequate"
    temp_celsius: float | None = None
    notes: str | None = None
    proof_image_url: str | None = None
    action_taken: str | None = None


class LoadingEventRequest(BaseModel):
    request_id: str
    officer_name: str
    loading_type: str = "pickup"  # "pickup" (loading) or "drop" (unloading)
    officer_phone: str | None = None
    officer_station: str | None = None
    officer_station_lat: float | None = None
    officer_station_lng: float | None = None
    verified_weight_kg: float | None = None
    seal_number: str | None = None
    seal_status: str | None = "Sealed & Intact"
    ice_boxes_added: int | None = 0
    ice_unavailable_at_pickup: bool | None = False
    temp_celsius: float | None = None
    notes: str | None = None
    delivery_proof_image_url: str | None = None  # Photo proof captured at final unload


class IceHandlingRequest(BaseModel):
    request_id: str | None = None
    trip_id: int | None = None
    officer_name: str
    officer_phone: str | None = None
    officer_station: str | None = None
    ice_kg_added: float = 5.0
    ice_type: str = "Crushed Ice"  # "Crushed Ice", "Gel Packs", "Dry Ice"
    temp_before: float | None = None
    temp_after: float | None = None
    notes: str | None = None
    stage: str | None = None  # "pickup", "checkpoint"
    checkpoint_name: str | None = None


class StationSwitchRequest(BaseModel):
    officer_name: str | None = None
    officer_phone: str | None = None
    new_station: str
    station_lat: float | None = None
    station_lng: float | None = None
