from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
import shutil
import math
import models
import schemas

from database import get_db
from auth.dependencies import require_roles

router = APIRouter(
    prefix="/api/trips",
    tags=["Trips"]
)

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"}
ALLOWED_IMAGE_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/pjpeg"}


def save_uploaded_delivery_proof(file: UploadFile, subfolder: str = "delivery_proofs") -> str:
    """
    Validates and saves a driver's delivery proof photo to static storage.
    Returns relative URL path (/uploads/{subfolder}/{filename}).
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Delivery proof image file is missing. A valid image is required."
        )

    ext = os.path.splitext(file.filename)[1].lower()
    content_type = (file.content_type or "").lower()

    if ext not in ALLOWED_IMAGE_EXTENSIONS and content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image format '{ext or content_type}'. Allowed formats: JPG, JPEG, PNG, WEBP, AVIF."
        )

    base_upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", subfolder)
    os.makedirs(base_upload_dir, exist_ok=True)

    unique_filename = f"proof_{uuid.uuid4().hex}{ext if ext in ALLOWED_IMAGE_EXTENSIONS else '.jpg'}"
    target_path = os.path.join(base_upload_dir, unique_filename)

    try:
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        if os.path.getsize(target_path) == 0:
            os.remove(target_path)
            raise HTTPException(status_code=400, detail="Uploaded delivery proof image file is empty.")
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(target_path):
            os.remove(target_path)
        raise HTTPException(status_code=500, detail=f"Failed to persist delivery proof image: {str(e)}")

    return f"/uploads/{subfolder}/{unique_filename}"


def calculate_highway_tortuosity_km(straight_line_km: float) -> float:
    """
    Applies an automatic National Highway (NH) Road Curvature / Tortuosity Multiplier:
    - If straight-line geodesic distance > 50 km: applies a 1.28x multiplier (1.25x - 1.30x) to realistically estimate actual winding NH road network distance.
    - If straight-line geodesic distance <= 50 km: applies a 1.10x local/urban grid multiplier.
    """
    d = max(1.0, float(straight_line_km or 0.0))
    if d > 50.0:
        return round(d * 1.28, 2)
    else:
        return round(d * 1.10, 2)


def calculate_haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes precise geodesic distance (in km) between two coordinate points
    with automatic National Highway (NH) Tortuosity Multiplier applied.
    """
    if not lat1 or not lon1 or not lat2 or not lon2:
        return 0.0
    if (lat1 == 0.0 and lon1 == 0.0) or (lat2 == 0.0 and lon2 == 0.0):
        return 0.0
    R = 6371.0  # Earth radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    geodesic_straight = R * c
    return round(max(5.0, calculate_highway_tortuosity_km(geodesic_straight)), 2)


def distance_to_segment_km(p_lat: float, p_lng: float, a_lat: float, a_lng: float, b_lat: float, b_lng: float) -> float:
    """
    Computes precise geodesic cross-track / perpendicular distance (in km) from coordinate point P to line segment AB.
    """
    R = 6371.0  # Earth radius in km
    phi_0 = math.radians((a_lat + b_lat + p_lat) / 3.0)
    
    x_a = R * math.radians(a_lng) * math.cos(phi_0)
    y_a = R * math.radians(a_lat)
    
    x_b = R * math.radians(b_lng) * math.cos(phi_0)
    y_b = R * math.radians(b_lat)
    
    x_p = R * math.radians(p_lng) * math.cos(phi_0)
    y_p = R * math.radians(p_lat)
    
    dx = x_b - x_a
    dy = y_b - y_a
    l2 = dx * dx + dy * dy
    
    if l2 == 0:
        return math.hypot(x_p - x_a, y_p - y_a)
        
    t = max(0.0, min(1.0, ((x_p - x_a) * dx + (y_p - y_a) * dy) / l2))
    proj_x = x_a + t * dx
    proj_y = y_a + t * dy
    
    return math.hypot(x_p - proj_x, y_p - proj_y)


def is_passenger_on_route(passenger_coords: tuple[float, float], driver_route_coords: list[tuple[float, float]], threshold_km: float = 5.0) -> bool:
    """
    Validates passenger coordinates against the vehicle's route geometry:
    1. Start Point: Allow a buffer up to 5 km from the trip's starting point.
    2. Destination: Pinpoint within 5 km of destination stop.
    3. In-Between / Intermediate Route: Full leverage for passengers to select pickup/drop-off
       points anywhere in between as long as they lie along the vehicle's path.
    """
    if not passenger_coords or len(passenger_coords) < 2:
        return True
    p_lat, p_lng = float(passenger_coords[0]), float(passenger_coords[1])
    if (p_lat == 0.0 and p_lng == 0.0) or not driver_route_coords or len(driver_route_coords) < 2:
        return True

    origin_lat, origin_lng = float(driver_route_coords[0][0]), float(driver_route_coords[0][1])
    dest_lat, dest_lng = float(driver_route_coords[-1][0]), float(driver_route_coords[-1][1])

    # 1. Start Point buffer (up to 5 km from starting point)
    dist_to_origin = calculate_haversine_km(p_lat, p_lng, origin_lat, origin_lng)
    if dist_to_origin <= 5.0:
        return True

    # 2. Destination Point buffer (up to 5 km from destination stop)
    dist_to_dest = calculate_haversine_km(p_lat, p_lng, dest_lat, dest_lng)
    if dist_to_dest <= 5.0:
        return True

    # 3. Intermediate route corridor check (full leverage anywhere along vehicle path)
    direct_dist = calculate_haversine_km(origin_lat, origin_lng, dest_lat, dest_lng)
    dist_via_point = dist_to_origin + dist_to_dest
    max_allowed_detour = (direct_dist * 1.25) + 15.0

    if dist_via_point <= max_allowed_detour and dist_to_origin <= (direct_dist + 15.0) and dist_to_dest <= (direct_dist + 15.0):
        return True

    # 4. Check detailed segment polyline if provided
    min_dist = float("inf")
    for i in range(len(driver_route_coords) - 1):
        a_lat, a_lng = float(driver_route_coords[i][0]), float(driver_route_coords[i][1])
        b_lat, b_lng = float(driver_route_coords[i + 1][0]), float(driver_route_coords[i + 1][1])
        if (a_lat == 0.0 and a_lng == 0.0) or (b_lat == 0.0 and b_lng == 0.0):
            continue
        d = distance_to_segment_km(p_lat, p_lng, a_lat, a_lng, b_lat, b_lng)
        if d < min_dist:
            min_dist = d

    return min_dist <= threshold_km


def calculate_strict_fare(
    distance_km: float = 0.0,
    weight_kg: float = 0.0,
    base_price: float = 60000.0,
    price_per_km: float = 15.0,
    weight_rate: float = 1.5,
    market_ceiling: float = 85000.0,
    max_price: float = 95000.0
) -> float:
    """
    Strict Linear Fare Calculation:
    Final Price = (Base Rate) + (Distance_km * Price_per_km) + (Weight_Surcharge)
    """
    dist = max(0.0, float(distance_km or 0.0))
    weight = max(0.0, float(weight_kg or 0.0))
    base_rate = max(0.0, float(base_price or 60000.0))

    distance_cost = dist * price_per_km
    weight_surcharge = weight * weight_rate
    raw_subtotal = base_rate + distance_cost + weight_surcharge

    final_price = raw_subtotal
    if raw_subtotal > market_ceiling:
        excess = raw_subtotal - market_ceiling
        discount_applied = excess * 0.60
        final_price = raw_subtotal - discount_applied

    final_price = min(final_price, max_price)
    return round(max(0.0, final_price), 2)


def calculate_route_aware_price(passenger_dist_km: float, trip: models.TripModel | None = None, service_fee: float = 20.0, weight_kg: float = 0.0) -> float:
    """
    Calculates cost using strict linear pricing and market ceiling protection.
    """
    dist = max(0.0, float(passenger_dist_km or 0.0))
    weight = max(0.0, float(weight_kg or 0.0))
    base_rate = float(trip.total_driver_amount) if (trip and trip.total_driver_amount and trip.total_driver_amount > 0) else 60000.0
    return calculate_strict_fare(distance_km=dist, weight_kg=weight, base_price=base_rate)


def get_trip_route_patterns(trip: models.TripModel) -> list[str]:
    return [
        f"{trip.from_loc} → {trip.to_loc}",
        f"{trip.from_loc} -> {trip.to_loc}",
        f"{trip.from_loc} - {trip.to_loc}"
    ]


def recalculate_trip_cost_shares(trip: models.TripModel, db: Session):
    """
    Dynamically recalculates proportional cost shares for all active passengers on a trip
    Computes real-time dynamic ton-km proportional cost share for each active booking:
    Formula: Individual Share = (Person's kg * Person's km / Total active kg-km) * Total Vehicle Trip Price
    """
    route_patterns = get_trip_route_patterns(trip)
    active_requests = db.query(models.RequestModel).filter(
        models.RequestModel.owner == trip.owner,
        models.RequestModel.route.in_(route_patterns),
        models.RequestModel.status.in_(["pending", "accepted", "in_transit", "pending_passenger_confirmation", "completed", "assigned"])
    ).all()

    total_driver_amount = trip.total_driver_amount if (trip.total_driver_amount and trip.total_driver_amount > 0) else float((trip.price_per_kg or 0) * (trip.total_kg or 1000))
    trip_default_dist = trip.distance_km if (trip.distance_km and trip.distance_km > 0) else 150.0

    total_payload = sum(req.goods_weight_kg if req.goods_weight_kg is not None else (req.kg or 0) for req in active_requests)

    # 1. Compute each active passenger's exact distance and kg·km workload
    total_kg_km = 0.0
    for req in active_requests:
        req_weight = float(req.goods_weight_kg if req.goods_weight_kg is not None else (req.kg or 0))
        
        # Calculate exact distance from locked-in pickup & delivery coordinates if available
        exact_dist = calculate_haversine_km(req.pickup_lat or 0.0, req.pickup_lng or 0.0, req.delivery_lat or 0.0, req.delivery_lng or 0.0)
        if exact_dist > 0:
            req_dist = exact_dist
        else:
            req_dist = float(req.distance_km if (req.distance_km and req.distance_km > 0) else trip_default_dist)
        
        req.distance_km = req_dist
        req_workload = round(req_weight * req_dist, 2)
        req.kg_km = req_workload
        total_kg_km += req_workload

    # 2. Proportionally distribute total driver fare among active passengers based on their kg·km share
    for req in active_requests:
        if total_kg_km > 0 and total_driver_amount > 0:
            share = round((req.kg_km / total_kg_km) * total_driver_amount, 2)
        else:
            share = 0.0
        req.per_person_share = share

    # 3. Calculate dynamic used percentage and available capacity in kg
    trip_capacity = trip.total_kg if (trip.total_kg and trip.total_kg > 0) else 1000
    available_space = max(0, trip_capacity - total_payload)
    space_used_pct = min(100, round((total_payload / trip_capacity) * 100)) if trip_capacity > 0 else 0
    trip.pct = space_used_pct

    db.commit()
    return total_payload, total_kg_km, available_space, space_used_pct, len(active_requests)


def check_and_finalize_trip_completion(trip: models.TripModel, db: Session) -> bool:
    """
    Validates and finalizes trip completion based on exact active bookings count:
    1. Queries all active booked requests for this trip.
       (Excludes empty capacity slots, cancelled, cancelled_by_driver, and rejected requests).
       Active statuses: 'accepted', 'in_transit', 'pending_passenger_confirmation', 'completed', 'assigned'.
    2. Counts the exact number of active booked passengers: total_active.
    3. Counts how many of those active passengers have submitted confirmation: confirmed_count (req.status == 'completed').
    4. If total_active == 0 OR confirmed_count == total_active:
       - Transitions trip.status = 'completed'
       - Sets trip.is_live = False
       - Commits to db
       - Returns True (finalized)
    5. If there are still active unconfirmed passengers and trip is in 'pending_passenger_confirmation', returns False.
    """
    route_patterns = get_trip_route_patterns(trip)
    active_requests = db.query(models.RequestModel).filter(
        models.RequestModel.owner == trip.owner,
        models.RequestModel.route.in_(route_patterns),
        models.RequestModel.status.in_(["accepted", "in_transit", "pending_passenger_confirmation", "completed", "assigned"])
    ).all()

    total_active = len(active_requests)
    confirmed_count = sum(1 for req in active_requests if req.status == "completed")

    if total_active == 0 or confirmed_count == total_active:
        if trip.status != "completed":
            trip.status = "completed"
            trip.is_live = False
            db.commit()
            db.refresh(trip)
        return True

    return False


def serialize_trip_with_meta(trip: models.TripModel, db: Session) -> schemas.TripResponse:
    # Auto-finalize if trip was pending confirmation and all active bookings are now confirmed
    if trip.status == "pending_passenger_confirmation":
        check_and_finalize_trip_completion(trip, db)

    total_payload, total_kg_km, available_space, space_used_pct, count = recalculate_trip_cost_shares(trip, db)

    route_patterns = get_trip_route_patterns(trip)
    active_requests = db.query(models.RequestModel).filter(
        models.RequestModel.owner == trip.owner,
        models.RequestModel.route.in_(route_patterns),
        models.RequestModel.status.in_(["pending", "accepted", "in_transit", "pending_passenger_confirmation", "completed", "assigned"])
    ).all()

    partners = [
        {
            "id": r.id,
            "farmer_name": r.farmer_name or "Cargo Partner",
            "goods_weight_kg": r.goods_weight_kg if r.goods_weight_kg is not None else (r.kg or 0),
            "status": r.status,
            "pickup_place": r.pickup_place or r.route,
            "pickup_cargo_image_url": r.pickup_cargo_image_url,
            "delivery_proof_image_url": r.delivery_proof_image_url
        }
        for r in active_requests
    ]

    total_capacity = trip.total_kg or 1000
    slots_total = max(5, int(total_capacity / 200))
    slots_filled = min(slots_total, len(active_requests))

    return schemas.TripResponse(
        id=trip.id,
        state=trip.state or "",
        from_loc=trip.from_loc or "",
        to_loc=trip.to_loc or "",
        date=trip.date or "",
        vehicle=trip.vehicle or "",
        owner=trip.owner or "",
        verified=bool(trip.verified),
        pct=space_used_pct or 0,
        space_used_percentage=space_used_pct or 0,
        total_kg=trip.total_kg or 0,
        available_space_kg=available_space or 0,
        price_per_kg=trip.price_per_kg or 0,
        total_driver_amount=trip.total_driver_amount or 0.0,
        distance_km=trip.distance_km or 150.0,
        pickup=trip.pickup or "",
        lat=trip.lat or 0.0,
        lng=trip.lng or 0.0,
        dest_lat=trip.dest_lat or 0.0,
        dest_lng=trip.dest_lng or 0.0,
        pickup_lat=trip.pickup_lat or trip.lat or 0.0,
        pickup_lng=trip.pickup_lng or trip.lng or 0.0,
        status=trip.status or "scheduled",
        is_live=bool(trip.is_live),
        speed=trip.speed or 0.0,
        pickup_cargo_image_url=trip.pickup_cargo_image_url,
        delivery_proof_image_url=trip.delivery_proof_image_url,
        total_booked_kg=total_payload or 0,
        total_kg_km=total_kg_km or 0.0,
        passenger_count=count or 0,
        slots_total=slots_total,
        slots_filled=slots_filled,
        partners=partners
    )






# --------------------------------------------------
# GET ALL TRIPS (Public - no auth required)
# --------------------------------------------------

@router.get(
    "",
    response_model=list[schemas.TripResponse]
)
def get_trips(
    state: str | None = None,
    vehicle: str | None = None,
    include_completed: bool = False,
    db: Session = Depends(get_db),
):
    """
    Returns all published trips with real-time pooled payload calculations.
    """
    query = db.query(models.TripModel)

    if not include_completed:
        query = query.filter(models.TripModel.status != "completed")

    if state:
        query = query.filter(
            models.TripModel.state == state
        )

    if vehicle:
        query = query.filter(
            models.TripModel.vehicle == vehicle
        )

    trips = query.all()
    return [serialize_trip_with_meta(t, db) for t in trips]


# --------------------------------------------------
# GET MY TRIPS (DRIVER ONLY)
# --------------------------------------------------

@router.get(
    "/my",
    response_model=list[schemas.TripResponse]
)
def get_my_trips(
    include_completed: bool = False,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("user", "driver", "admin"))
):
    """
    Returns active trips published by the currently logged-in driver.
    """
    profile = db.query(models.UserProfile).filter(
        models.UserProfile.user_id == current_user.id
    ).first()

    owner_name = profile.full_name if (profile and profile.full_name) else current_user.username

    query = db.query(models.TripModel).filter(
        models.TripModel.owner == owner_name
    )

    if not include_completed:
        query = query.filter(models.TripModel.status != "completed")

    trips = query.all()
    return [serialize_trip_with_meta(t, db) for t in trips]


# --------------------------------------------------
# GET SINGLE TRIP BY ID
# --------------------------------------------------

@router.get(
    "/{trip_id}",
    response_model=schemas.TripResponse
)
def get_trip_by_id(
    trip_id: int,
    db: Session = Depends(get_db)
):
    trip = db.query(models.TripModel).filter(models.TripModel.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return serialize_trip_with_meta(trip, db)


# --------------------------------------------------
# CREATE TRIP
# DRIVER + USER + ADMIN
# --------------------------------------------------

@router.post(
    "",
    response_model=schemas.TripResponse
)
def create_trip(
    trip: schemas.TripCreate,
    db: Session = Depends(get_db),

    current_user=Depends(
        require_roles(
            "user",
            "driver",
            "admin"
        )
    )
):
    # BULLETPROOF PHYSICAL CAPACITY ENFORCEMENT
    limits = schemas.get_vehicle_capacity_limits(trip.vehicle)
    declared_kg = trip.total_kg if trip.total_kg is not None else limits["default_kg"]

    if declared_kg > limits["max_kg"]:
        raise HTTPException(
            status_code=400,
            detail=f"Physical Capacity Exceeded: '{trip.vehicle}' cannot hold {declared_kg} kg. The maximum physical capacity for {limits['name']} is strictly {limits['max_kg']} kg."
        )

    if declared_kg < limits["min_kg"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid Capacity: '{trip.vehicle}' capacity of {declared_kg} kg is below the minimum threshold of {limits['min_kg']} kg."
        )

    # VEHICLE-ROUTE DISTANCE SUITABILITY ENFORCEMENT
    trip_dist = float(trip.distance_km or 0.0)
    max_dist = limits.get("max_distance_km", float("inf"))
    if trip_dist > 0 and max_dist != float("inf") and trip_dist > max_dist:
        raise HTTPException(
            status_code=400,
            detail=f"Route Distance Suitability Violation: '{trip.vehicle}' is limited to a maximum route distance of {max_dist:.0f} km (attempted {trip_dist:.1f} km). For long-distance freight, please select a suitable vehicle category like Mini-Truck or Heavy-Truck."
        )

    trip_data = trip.model_dump()
    trip_data["total_kg"] = declared_kg

    db_trip = models.TripModel(
        **trip_data
    )

    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)

    return serialize_trip_with_meta(db_trip, db)


# --------------------------------------------------
# UPDATE TRIP LIVE LOCATION (DRIVER ONLY)
# --------------------------------------------------

@router.put(
    "/{trip_id}/location",
    response_model=schemas.TripResponse
)
def update_trip_location(
    trip_id: int,
    loc_data: schemas.TripLocationUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("user", "driver", "admin"))
):
    """
    Updates the live GPS location (lat, lng, speed, status, is_live) of an active trip.
    """
    trip = db.query(models.TripModel).filter(models.TripModel.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    trip.lat = loc_data.lat
    trip.lng = loc_data.lng
    if loc_data.speed is not None:
        trip.speed = loc_data.speed
    if loc_data.status is not None:
        trip.status = loc_data.status
    if loc_data.is_live is not None:
        trip.is_live = loc_data.is_live

    db.commit()
    db.refresh(trip)
    return serialize_trip_with_meta(trip, db)


# --------------------------------------------------
# UPDATE TRIP STATUS (e.g., START / COMPLETE TRIP)
# --------------------------------------------------

@router.put(
    "/{trip_id}/status",
    response_model=schemas.TripResponse
)
def update_trip_status(
    trip_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("user", "driver", "admin"))
):
    """
    Updates trip status (e.g. 'in_transit', 'pending_passenger_confirmation', 'completed', 'scheduled', 'cancelled_by_driver').
    """
    trip = db.query(models.TripModel).filter(models.TripModel.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if status in ("cancelled", "cancelled_by_driver") and trip.status not in ["pending", "scheduled"]:
        raise HTTPException(status_code=400, detail="Cannot cancel a trip that has already started.")

    trip.status = status
    if status == "in_transit":
        trip.is_live = True
    elif status in ("completed", "cancelled", "cancelled_by_driver", "pending_passenger_confirmation"):
        trip.is_live = False

    route_str = f"{trip.from_loc} → {trip.to_loc}"

    # If status becomes pending_passenger_confirmation, cascade to active requests
    if status == "pending_passenger_confirmation":
        requests_to_update = db.query(models.RequestModel).filter(
            models.RequestModel.owner == trip.owner,
            models.RequestModel.route == route_str,
            models.RequestModel.status.in_(["accepted", "in_transit", "assigned"])
        ).all()
        for req in requests_to_update:
            req.status = "pending_passenger_confirmation"

    # If the trip is cancelled by the driver, update all associated active requests
    elif status in ("cancelled", "cancelled_by_driver"):
        requests_to_cancel = db.query(models.RequestModel).filter(
            models.RequestModel.owner == trip.owner,
            models.RequestModel.route == route_str,
            models.RequestModel.status.in_(["pending", "accepted", "in_transit", "assigned", "pending_passenger_confirmation"])
        ).all()
        for req in requests_to_cancel:
            req.status = "cancelled_by_driver"
            req.reason = "The driver has cancelled this ride."

    # If the trip is confirmed completed, mark all pending confirmation requests completed
    elif status == "completed":
        requests_to_complete = db.query(models.RequestModel).filter(
            models.RequestModel.owner == trip.owner,
            models.RequestModel.route == route_str,
            models.RequestModel.status.in_(["accepted", "in_transit", "pending_passenger_confirmation"])
        ).all()
        for req in requests_to_complete:
            req.status = "completed"

    db.commit()
    db.refresh(trip)
    return serialize_trip_with_meta(trip, db)


# ==================================================
# UPLOAD DELIVERY PROOF PHOTO (STAGE 2 UPLOAD ENDPOINT)
# ==================================================

@router.post("/upload-delivery-proof")
def upload_delivery_proof(
    file: UploadFile = File(...)
):
    """
    Accepts and verifies a mandatory delivery proof photo from the transporter.
    Returns the persisted static delivery proof image URL.
    """
    image_url = save_uploaded_delivery_proof(file, subfolder="delivery_proofs")
    return {
        "delivery_proof_image_url": image_url,
        "filename": file.filename,
        "status": "success",
        "message": "Delivery proof photo verified and uploaded successfully."
    }


# --------------------------------------------------
# DRIVER MARKS TRIP AS COMPLETE WITH MANDATORY DELIVERY PROOF (STAGE 2)
# --------------------------------------------------

@router.put(
    "/{trip_id}/complete",
    response_model=schemas.TripResponse
)
@router.post(
    "/{trip_id}/complete",
    response_model=schemas.TripResponse
)
def driver_complete_trip(
    trip_id: int,
    delivery_proof_image_url: Optional[str] = None,
    delivery_proof_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Driver initiates trip completion with MANDATORY delivery proof verification (Stage 2).
    1. Validates that the trip is currently active (not already completed or cancelled).
    2. Enforces mandatory delivery proof photo (either as direct UploadFile or pre-uploaded image URL).
    3. Persists proof image URL on the trip and all connected passenger requests.
    4. Transitions unconfirmed bookings to 'pending_passenger_confirmation' (or 'completed' if no active passengers).
    """
    trip = db.query(models.TripModel).filter(models.TripModel.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # VALIDATE ACTIVE STATUS BEFORE COMPLETION
    if trip.status in ["cancelled", "cancelled_by_driver"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot complete trip. Trip is currently cancelled ({trip.status})."
        )

    if trip.status == "completed":
        raise HTTPException(
            status_code=400,
            detail="This trip has already been completed and finalized."
        )

    # STAGE 2: MANDATORY DELIVERY PROOF VALIDATION
    final_proof_url = None

    if delivery_proof_image is not None and delivery_proof_image.filename:
        final_proof_url = save_uploaded_delivery_proof(delivery_proof_image, subfolder="delivery_proofs")
    elif delivery_proof_image_url and str(delivery_proof_image_url).strip():
        final_proof_url = str(delivery_proof_image_url).strip()

    if not final_proof_url:
        raise HTTPException(
            status_code=400,
            detail="Mandatory Delivery Proof Required: Transporter must upload a verified cargo delivery proof photo (JPEG, PNG, WEBP) to complete the ride."
        )

    try:
        trip.is_live = False
        trip.delivery_proof_image_url = final_proof_url

        route_patterns = get_trip_route_patterns(trip)
        active_requests = db.query(models.RequestModel).filter(
            models.RequestModel.owner == trip.owner,
            models.RequestModel.route.in_(route_patterns),
            models.RequestModel.status.in_(["accepted", "in_transit", "assigned", "pending_passenger_confirmation", "completed"])
        ).all()

        unconfirmed_requests = [r for r in active_requests if r.status != "completed"]

        # Stamp delivery proof image on all linked active passenger requests
        for req in active_requests:
            req.delivery_proof_image_url = final_proof_url

        if len(active_requests) == 0 or len(unconfirmed_requests) == 0:
            # No active passengers or all active passengers already confirmed
            trip.status = "completed"
        else:
            trip.status = "pending_passenger_confirmation"
            for req in unconfirmed_requests:
                req.status = "pending_passenger_confirmation"

        db.commit()
        db.refresh(trip)
        return serialize_trip_with_meta(trip, db)
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to finalize trip completion: {str(e)}"
        )


# --------------------------------------------------
# PASSENGER CONFIRMS TRIP COMPLETION (TWO-WAY CONFIRMATION STEP 2)
# --------------------------------------------------

@router.put(
    "/{trip_id}/confirm-completion",
    response_model=schemas.TripResponse
)
def confirm_trip_completion(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("user", "driver", "admin"))
):
    """
    Confirms and finalizes the trip as 'completed'.
    """
    trip = db.query(models.TripModel).filter(models.TripModel.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    trip.status = "completed"
    trip.is_live = False

    route_str = f"{trip.from_loc} → {trip.to_loc}"
    requests_to_complete = db.query(models.RequestModel).filter(
        models.RequestModel.owner == trip.owner,
        models.RequestModel.route == route_str,
        models.RequestModel.status.in_(["accepted", "in_transit", "pending_passenger_confirmation"])
    ).all()

    for req in requests_to_complete:
        req.status = "completed"

    db.commit()
    db.refresh(trip)
    return serialize_trip_with_meta(trip, db)



# --------------------------------------------------
# CANCEL TRIP (DRIVER ONLY)
# --------------------------------------------------

@router.put(
    "/{trip_id}/cancel",
    response_model=schemas.TripResponse
)
def cancel_trip(
    trip_id: int,
    reason: str | None = "The driver has cancelled this ride.",
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("user", "driver", "admin"))
):
    """
    Cancels an active or scheduled trip by the driver.
    Sets trip status to 'cancelled_by_driver', stops live tracking,
    and updates all connected passenger requests to 'cancelled_by_driver'.
    """
    trip = db.query(models.TripModel).filter(models.TripModel.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip.status not in ["pending", "scheduled"]:
        raise HTTPException(status_code=400, detail="Cannot cancel a trip that has already started.")

    trip.status = "cancelled_by_driver"
    trip.is_live = False

    # Cascade cancellation to all associated passenger requests for this trip
    route_str = f"{trip.from_loc} → {trip.to_loc}"
    requests_to_cancel = db.query(models.RequestModel).filter(
        models.RequestModel.owner == trip.owner,
        models.RequestModel.route == route_str,
        models.RequestModel.status.in_(["pending", "accepted", "in_transit", "assigned", "pending_passenger_confirmation"])
    ).all()

    for req in requests_to_cancel:
        req.status = "cancelled_by_driver"
        req.reason = reason or "The driver has cancelled this ride."

    db.commit()
    db.refresh(trip)
    return serialize_trip_with_meta(trip, db)

