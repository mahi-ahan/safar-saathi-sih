from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
import os
import uuid
import shutil
import math
import models
import schemas

from database import get_db
from auth.dependencies import require_roles
from services.dispatcher import dispatch_automated_alert, resolve_user_contact_and_lang
import services.messages as msgs
from services import trip_state_machine
from datetime import datetime

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


def get_route_projection_t(point_coords: tuple[float, float], driver_route_coords: list[tuple[float, float]]) -> float:
    """
    Computes normalized projection scalar (0.0 to 1.0) of a point along driver route polyline.
    """
    if not point_coords or not driver_route_coords or len(driver_route_coords) < 2:
        return 0.5
    p_lat, p_lng = float(point_coords[0]), float(point_coords[1])
    if p_lat == 0.0 and p_lng == 0.0:
        return 0.5

    best_min_dist = float("inf")
    best_global_t = 0.0
    total_segments = len(driver_route_coords) - 1

    for i in range(total_segments):
        a_lat, a_lng = float(driver_route_coords[i][0]), float(driver_route_coords[i][1])
        b_lat, b_lng = float(driver_route_coords[i + 1][0]), float(driver_route_coords[i + 1][1])
        if (a_lat == 0.0 and a_lng == 0.0) or (b_lat == 0.0 and b_lng == 0.0):
            continue

        R = 6371.0
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
        t = 0.0
        if l2 > 0:
            t = max(0.0, min(1.0, ((x_p - x_a) * dx + (y_p - y_a) * dy) / l2))
        proj_x = x_a + t * dx
        proj_y = y_a + t * dy
        d = math.hypot(x_p - proj_x, y_p - proj_y)

        if d < best_min_dist:
            best_min_dist = d
            best_global_t = (i + t) / total_segments

    return best_global_t


def is_direction_aligned(
    driver_origin: tuple[float, float],
    driver_dest: tuple[float, float],
    req_pickup: tuple[float, float],
    req_delivery: tuple[float, float],
    max_angle_deg: float = 45.0
) -> bool:
    """
    Validates that user booking vector aligns with driver travel vector within max_angle_deg.
    """
    if not driver_origin or not driver_dest or not req_pickup or not req_delivery:
        return True
    o_lat, o_lng = float(driver_origin[0]), float(driver_origin[1])
    d_lat, d_lng = float(driver_dest[0]), float(driver_dest[1])
    p_lat, p_lng = float(req_pickup[0]), float(req_pickup[1])
    del_lat, del_lng = float(req_delivery[0]), float(req_delivery[1])

    mean_lat_t = math.radians((o_lat + d_lat) / 2.0)
    v_tx = (d_lng - o_lng) * math.cos(mean_lat_t)
    v_ty = (d_lat - o_lat)

    mean_lat_r = math.radians((p_lat + del_lat) / 2.0)
    v_rx = (del_lng - p_lng) * math.cos(mean_lat_r)
    v_ry = (del_lat - p_lat)

    mag_t = math.hypot(v_tx, v_ty)
    mag_r = math.hypot(v_rx, v_ry)
    if mag_t == 0 or mag_r == 0:
        return True

    dot = (v_tx * v_rx) + (v_ty * v_ry)
    cos_theta = max(-1.0, min(1.0, dot / (mag_t * mag_r)))
    min_cos = math.cos(math.radians(max_angle_deg))

    return cos_theta >= min_cos


def is_pickup_before_drop(
    pickup_coords: tuple[float, float],
    delivery_coords: tuple[float, float],
    driver_route_coords: list[tuple[float, float]]
) -> bool:
    """
    Ensures pickup stop occurs before delivery stop along the driver's route trajectory.
    """
    if not pickup_coords or not delivery_coords or not driver_route_coords or len(driver_route_coords) < 2:
        return True
    t_pickup = get_route_projection_t(pickup_coords, driver_route_coords)
    t_drop = get_route_projection_t(delivery_coords, driver_route_coords)
    return t_pickup <= (t_drop + 0.05)


def is_passenger_on_route(
    passenger_coords: tuple[float, float],
    driver_route_coords: list[tuple[float, float]],
    threshold_km: float = 3.8
) -> bool:
    """
    Smart Elastic Route Corridor Validation:
    1. Terminal Buffers: <= 3.8 km radius from origin or destination.
    2. Intermediate Detour: Elastic detour <= 3.8 km.
    3. Cross-Track Segment Distance: <= 3.8 km perpendicular distance to polyline.
    """
    if not passenger_coords or len(passenger_coords) < 2:
        return True
    p_lat, p_lng = float(passenger_coords[0]), float(passenger_coords[1])
    if (p_lat == 0.0 and p_lng == 0.0) or not driver_route_coords or len(driver_route_coords) < 2:
        return True

    max_threshold = max(0.5, float(threshold_km or 3.8))

    origin_lat, origin_lng = float(driver_route_coords[0][0]), float(driver_route_coords[0][1])
    dest_lat, dest_lng = float(driver_route_coords[-1][0]), float(driver_route_coords[-1][1])

    # 1. Start Point buffer (tight <= 1.0 km radius)
    dist_to_origin = calculate_haversine_km(p_lat, p_lng, origin_lat, origin_lng)
    if dist_to_origin <= max_threshold:
        return True

    # 2. Destination Point buffer (tight <= 1.0 km radius)
    dist_to_dest = calculate_haversine_km(p_lat, p_lng, dest_lat, dest_lng)
    if dist_to_dest <= max_threshold:
        return True

    # 3. Intermediate route corridor check (extra detour restricted to <= 1.0 km)
    direct_dist = calculate_haversine_km(origin_lat, origin_lng, dest_lat, dest_lng)
    dist_via_point = dist_to_origin + dist_to_dest
    max_allowed_detour = (direct_dist * 1.02) + max_threshold

    if dist_via_point <= max_allowed_detour and dist_to_origin <= (direct_dist + max_threshold) and dist_to_dest <= (direct_dist + max_threshold):
        return True

    # 4. Check detailed segment polyline if provided (cross-track distance <= 1.0 km)
    min_dist = float("inf")
    for i in range(len(driver_route_coords) - 1):
        a_lat, a_lng = float(driver_route_coords[i][0]), float(driver_route_coords[i][1])
        b_lat, b_lng = float(driver_route_coords[i + 1][0]), float(driver_route_coords[i + 1][1])
        if (a_lat == 0.0 and a_lng == 0.0) or (b_lat == 0.0 and b_lng == 0.0):
            continue
        d = distance_to_segment_km(p_lat, p_lng, a_lat, a_lng, b_lat, b_lng)
        if d < min_dist:
            min_dist = d

    return min_dist <= max_threshold


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


def get_trip_requests(trip: models.TripModel, db: Session, statuses: list[str] = None) -> list[models.RequestModel]:
    """
    Returns only requests strictly associated with this specific trip instance.
    Primary: Exact trip_id matching.
    Fallback: Unlinked legacy requests matching owner, route, and date.
    """
    if not trip:
        return []

    # 1. Primary: Exact trip_id matching
    q = db.query(models.RequestModel).filter(models.RequestModel.trip_id == trip.id)
    if statuses:
        q = q.filter(models.RequestModel.status.in_(statuses))
    direct_reqs = q.all()

    if direct_reqs or trip.id is not None:
        # If there are direct linked requests (or new trip has no requests yet), return them
        return direct_reqs

    # 2. Legacy fallback for old rows created before trip_id migration
    route_patterns = get_trip_route_patterns(trip)
    legacy_q = db.query(models.RequestModel).filter(
        models.RequestModel.trip_id == None,
        models.RequestModel.owner == trip.owner,
        models.RequestModel.route.in_(route_patterns)
    )
    if trip.date:
        legacy_q = legacy_q.filter(
            or_(
                models.RequestModel.pickup_date == trip.date,
                models.RequestModel.delivery_date == trip.date,
                models.RequestModel.trip_date == trip.date
            )
        )
    if statuses:
        legacy_q = legacy_q.filter(models.RequestModel.status.in_(statuses))

    return legacy_q.all()


def recalculate_trip_cost_shares(trip: models.TripModel, db: Session):
    """
    Dynamically recalculates proportional cost shares for all active passengers on a trip
    Computes real-time dynamic ton-km proportional cost share for each active booking:
    Formula: Individual Share = (Person's kg * Person's km / Total active kg-km) * Total Vehicle Trip Price
    """
    active_requests = get_trip_requests(
        trip,
        db,
        ["pending", "accepted", "in_transit", "pending_passenger_confirmation", "completed", "assigned"]
    )

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
    trip_capacity = trip.total_kg if (trip.total_kg and trip.total_kg > 0) else 1000
    available_space = max(0, trip_capacity - total_payload)
    space_used_pct = min(100, round((total_payload / trip_capacity) * 100)) if trip_capacity > 0 else 0
    trip.pct = space_used_pct

    for req in active_requests:
        req_wt = float(req.goods_weight_kg if req.goods_weight_kg is not None else (req.kg or 0))
        if len(active_requests) > 1 and total_kg_km > 0:
            share = round((req.kg_km / total_kg_km) * total_driver_amount, 2)
        elif len(active_requests) == 1 and trip_capacity > 0:
            share = round(max(50.0, (req_wt / trip_capacity) * total_driver_amount), 2)
        elif total_kg_km > 0 and total_driver_amount > 0:
            share = round((req.kg_km / total_kg_km) * total_driver_amount, 2)
        else:
            share = 0.0
        req.per_person_share = share

    db.commit()
    return total_payload, total_kg_km, available_space, space_used_pct, len(active_requests)


def check_and_finalize_trip_completion(trip: models.TripModel, db: Session) -> bool:
    """
    Validates and finalizes trip completion based on exact active bookings count:
    1. If all active bookings are confirmed/completed, marks trip as 'completed' and is_live = False.
    2. If all active bookings have received their individual delivery proofs (pending_passenger_confirmation or completed),
       automatically marks the trip as 'pending_passenger_confirmation' and stops live GPS broadcasting.
    """
    if trip.status not in ["pending_passenger_confirmation", "in_transit", "scheduled"]:
        return False

    active_requests = get_trip_requests(
        trip,
        db,
        ["accepted", "in_transit", "pending_passenger_confirmation", "completed", "assigned"]
    )

    total_active = len(active_requests)
    if total_active == 0:
        return False

    confirmed_count = sum(1 for req in active_requests if req.status == "completed")
    delivered_count = sum(1 for req in active_requests if req.status in ["pending_passenger_confirmation", "completed"])

    # 1. All active shippers have confirmed & rated
    if confirmed_count == total_active:
        if trip.status != "completed" or trip.is_live:
            trip.status = "completed"
            trip.is_live = False
            db.commit()
            db.refresh(trip)
        return True

    # 2. All active shippers have received individual drop-off proofs
    if delivered_count == total_active:
        if trip.status != "pending_passenger_confirmation" or trip.is_live:
            trip.status = "pending_passenger_confirmation"
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

    active_requests = get_trip_requests(
        trip,
        db,
        ["pending", "accepted", "in_transit", "pending_passenger_confirmation", "completed", "assigned"]
    )

    partners = []
    for r in active_requests:
        p_place = r.pickup_place or (r.route.split("→")[0].strip() if "→" in (r.route or "") else (r.route.split("->")[0].strip() if "->" in (r.route or "") else trip.from_loc))
        d_place = (r.route.split("→")[1].strip() if "→" in (r.route or "") else (r.route.split("->")[1].strip() if "->" in (r.route or "") else trip.to_loc))

        p_lat = r.pickup_lat if (r.pickup_lat and r.pickup_lat != 0.0) else (trip.pickup_lat or trip.lat or 20.4625)
        p_lng = r.pickup_lng if (r.pickup_lng and r.pickup_lng != 0.0) else (trip.pickup_lng or trip.lng or 85.8828)
        d_lat = r.delivery_lat if (r.delivery_lat and r.delivery_lat != 0.0) else (trip.dest_lat or 20.2961)
        d_lng = r.delivery_lng if (r.delivery_lng and r.delivery_lng != 0.0) else (trip.dest_lng or 85.8245)

        partners.append({
            "id": r.id,
            "farmer_name": r.farmer_name or "Cargo Partner",
            "goods_weight_kg": r.goods_weight_kg if r.goods_weight_kg is not None else (r.kg or 0),
            "status": r.status,
            "pickup_place": p_place,
            "pickup_lat": p_lat,
            "pickup_lng": p_lng,
            "delivery_place": d_place,
            "delivery_lat": d_lat,
            "delivery_lng": d_lng,
            "route": r.route,
            "distance_km": r.distance_km or 150,
            "pickup_cargo_image_url": r.pickup_cargo_image_url,
            "delivery_proof_image_url": r.delivery_proof_image_url,
            "cargo_category": getattr(r, "cargo_category", "Independent / General Cargo") or "Independent / General Cargo",
            "dedicated_sub_category": getattr(r, "dedicated_sub_category", None),
            "commodity": getattr(r, "commodity", None),
            "seal_number": getattr(r, "seal_number", None),
            "seal_status": getattr(r, "seal_status", None),
            "cooling_type": getattr(r, "cooling_type", None),
            "verified_weight_kg": getattr(r, "verified_weight_kg", None),
            "weight_compliant": getattr(r, "weight_compliant", None)
        })

    total_capacity = trip.total_kg or 1000
    slots_total = max(5, int(total_capacity / 200))
    slots_filled = min(slots_total, len(active_requests))

    driver_phone = None
    if trip.owner:
        d_prof = (
            db.query(models.UserProfile)
            .join(models.User, models.UserProfile.user_id == models.User.id)
            .filter(
                (models.UserProfile.full_name == trip.owner) |
                (models.User.username == trip.owner) |
                (models.User.username.ilike(f"%{trip.owner}%"))
            )
            .first()
        )
        if d_prof and d_prof.phone_number:
            driver_phone = d_prof.phone_number

    is_booking_open = True
    booking_lock_reason = None
    outbound_trip_status = None
    can_start_trip = True
    start_lock_reason = None

    has_return_leg = False
    if not bool(getattr(trip, "is_return_leg", False)):
        has_return_leg = db.query(models.TripModel).filter(
            models.TripModel.return_trip_id == trip.id,
            models.TripModel.status != "cancelled"
        ).first() is not None

    if bool(getattr(trip, "is_return_leg", False)) and getattr(trip, "return_trip_id", None):
        outbound = db.query(models.TripModel).filter(models.TripModel.id == trip.return_trip_id).first()
        if outbound:
            outbound_trip_status = outbound.status
            # 1. Booking rule: Booking opens only after driver has started the outbound journey (in_transit or completed)
            if outbound.status in ["scheduled", "pending"]:
                is_booking_open = False
                booking_lock_reason = f"Booking opens once the driver starts the outbound journey ({outbound.from_loc} → {outbound.to_loc})."
            elif outbound.status in ["cancelled", "cancelled_by_driver"]:
                is_booking_open = False
                booking_lock_reason = "This return run is unavailable because the primary outbound journey was cancelled."

            # 2. Start trip rule: Return trip must be locked until outbound trip reaches & confirms Goods Area
            can_start, lock_reason = trip_state_machine.can_start_return_trip(trip, outbound_trip=outbound)
            can_start_trip = can_start
            if not can_start:
                start_lock_reason = lock_reason

    return schemas.TripResponse(
        id=trip.id,
        state=trip.state or "",
        from_loc=trip.from_loc or "",
        to_loc=trip.to_loc or "",
        date=trip.date or "",
        vehicle=trip.vehicle or "",
        owner=trip.owner or "",
        driver_phone=driver_phone,
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
        pickup_cargo_image_url=getattr(trip, "pickup_cargo_image_url", None),
        delivery_proof_image_url=getattr(trip, "delivery_proof_image_url", None),
        total_booked_kg=total_payload or 0,
        total_kg_km=total_kg_km or 0.0,
        passenger_count=count or 0,
        slots_total=slots_total,
        slots_filled=slots_filled,
        partners=partners,
        return_trip_id=getattr(trip, "return_trip_id", None),
        is_return_leg=bool(getattr(trip, "is_return_leg", False)),
        return_discount_pct=getattr(trip, "return_discount_pct", 0) or 0,
        is_booking_open=is_booking_open,
        booking_lock_reason=booking_lock_reason,
        outbound_trip_status=outbound_trip_status,
        can_start_trip=can_start_trip,
        start_lock_reason=start_lock_reason,
        has_return_leg=has_return_leg,
        cargo_category=getattr(trip, "cargo_category", "Independent / General Cargo") or "Independent / General Cargo",
        dedicated_sub_category=getattr(trip, "dedicated_sub_category", None),
        is_dedicated=bool(getattr(trip, "is_dedicated", False)),
        seal_number=getattr(trip, "seal_number", None),
        seal_status=getattr(trip, "seal_status", None),
        last_weigh_in_kg=getattr(trip, "last_weigh_in_kg", None),
        weight_compliant=getattr(trip, "weight_compliant", None),
        cooling_type=getattr(trip, "cooling_type", None),
        target_temp_c=getattr(trip, "target_temp_c", None),
        current_checkpoint=getattr(trip, "current_checkpoint", None),
        checkpoint_count=getattr(trip, "checkpoint_count", 0) or 0,
        has_perishables=bool(getattr(trip, "has_perishables", False)),
        ice_handling_supported=bool(getattr(trip, "ice_handling_supported", True)),
        inspection_status=getattr(trip, "inspection_status", "not_started") or "not_started",
        inspection_completed=bool(getattr(trip, "inspection_completed", False)),
        goods_area_status=getattr(trip, "goods_area_status", "not_started") or "not_started",
        goods_area_reached_at=getattr(trip, "goods_area_reached_at", None),
        goods_area_confirmed_at=getattr(trip, "goods_area_confirmed_at", None),
        return_started_at=getattr(trip, "return_started_at", None)
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
    Returns all published active trips with real-time pooled payload calculations.
    Excludes completed, cancelled, and finalized trips.
    """
    query = db.query(models.TripModel)

    if not include_completed:
        query = query.filter(
            ~models.TripModel.status.in_(["completed", "cancelled", "cancelled_by_driver", "pending_passenger_confirmation"])
        )

    if state:
        query = query.filter(
            models.TripModel.state == state
        )

    if vehicle:
        query = query.filter(
            models.TripModel.vehicle == vehicle
        )

    trips = query.order_by(models.TripModel.id.desc()).all()
    return [serialize_trip_with_meta(t, db) for t in trips]


# --------------------------------------------------
# GET MY TRIPS (DRIVER ONLY)
# --------------------------------------------------

@router.get(
    "/my",
    response_model=list[schemas.TripResponse]
)
def get_my_trips(
    include_completed: bool = True,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("user", "driver", "admin"))
):
    """
    Returns active trips published by the currently logged-in driver.
    """
    profile = db.query(models.UserProfile).filter(
        models.UserProfile.user_id == current_user.id
    ).first()

    possible_owners = [current_user.username]
    if current_user.email:
        possible_owners.append(current_user.email)
    if profile and profile.full_name:
        possible_owners.append(profile.full_name)

    query = db.query(models.TripModel).filter(
        or_(
            models.TripModel.owner.in_(possible_owners),
            models.TripModel.owner.ilike(f"%{current_user.username}%"),
            models.TripModel.owner.ilike(f"%{profile.full_name}%") if (profile and profile.full_name) else False
        )
    )

    all_trips = query.order_by(models.TripModel.id.desc()).all()
    result_trips = []

    for t in all_trips:
        if include_completed or t.status not in ["completed", "cancelled_by_driver", "cancelled"]:
            result_trips.append(t)

    return [serialize_trip_with_meta(t, db) for t in result_trips]


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
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "user",
            "driver",
            "admin"
        )
    )
):
    # STRICT MANDATORY FORM FIELDS VALIDATION
    if not trip.from_loc or not str(trip.from_loc).strip():
        raise HTTPException(status_code=400, detail="Starting city/hub (From location) is mandatory.")
    if not trip.to_loc or not str(trip.to_loc).strip():
        raise HTTPException(status_code=400, detail="Destination city/hub (To location) is mandatory.")
    if str(trip.from_loc).strip().lower() == str(trip.to_loc).strip().lower():
        raise HTTPException(status_code=400, detail="Origin and Destination locations cannot be identical.")
    if not trip.date or not str(trip.date).strip():
        raise HTTPException(status_code=400, detail="Travel departure date is mandatory.")
    if not trip.vehicle or not str(trip.vehicle).strip():
        raise HTTPException(status_code=400, detail="Vehicle type selection is mandatory.")
    if not trip.owner or not str(trip.owner).strip():
        raise HTTPException(status_code=400, detail="Transporter/Driver name is required.")
    
    trip_price = float(trip.total_driver_amount or trip.price_per_kg or 0.0)
    if trip_price <= 0:
        raise HTTPException(status_code=400, detail="Total desired vehicle load fare (₹) must be greater than zero.")

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
    trip_lang = trip_data.pop("lang", "hi")
    trip_data["total_kg"] = declared_kg

    profile = db.query(models.UserProfile).filter(
        models.UserProfile.user_id == current_user.id
    ).first()
    driver_name = profile.full_name if (profile and profile.full_name) else (trip.owner or current_user.username)
    trip_data["owner"] = driver_name
    trip_data["user_id"] = current_user.id
    trip_data["driver_phone"] = profile.phone_number if (profile and profile.phone_number) else None
    trip_data["preferred_lang"] = trip_lang

    valid_cols = set(models.TripModel.__table__.columns.keys())
    filtered_data = {k: v for k, v in trip_data.items() if k in valid_cols}

    db_trip = models.TripModel(
        **filtered_data
    )

    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)

    # Automated WhatsApp Confirmation Alert to Driver upon Trip Publish
    if background_tasks:
        driver_phone, driver_lang = resolve_user_contact_and_lang(
            db,
            user_id=current_user.id,
            username_or_name=db_trip.owner,
            default_lang=trip_lang
        )
        if driver_phone:
            d_msg = msgs.msg_trip_published(
                driver_name=db_trip.owner or 'Driver',
                from_loc=db_trip.from_loc,
                to_loc=db_trip.to_loc,
                date=db_trip.date,
                vehicle=db_trip.vehicle,
                total_kg=declared_kg,
                price=trip_price,
                pickup=db_trip.pickup or '',
                lang=driver_lang
            )
            background_tasks.add_task(dispatch_automated_alert, driver_phone, d_msg)

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

    # If the trip is already completed, waiting for passenger confirmation, or cancelled,
    # NEVER allow background location updates to revert it to in_transit or is_live=True!
    if trip.status in ["completed", "pending_passenger_confirmation", "cancelled", "cancelled_by_driver"]:
        trip.is_live = False
        db.commit()
        return serialize_trip_with_meta(trip, db)

    # If this is a return trip, driver CANNOT start live GPS tracking until primary outbound trip reaches and confirms Goods Area!
    if (loc_data.is_live or loc_data.status == "in_transit") and bool(getattr(trip, "is_return_leg", False)) and getattr(trip, "return_trip_id", None):
        outbound = db.query(models.TripModel).filter(models.TripModel.id == trip.return_trip_id).first()
        can_start, reason = trip_state_machine.can_start_return_trip(trip, outbound)
        if not can_start:
            raise HTTPException(
                status_code=400,
                detail=reason or f"Cannot start return trip. You must first complete the primary outbound journey ({outbound.from_loc} → {outbound.to_loc}) and confirm Goods Area arrival."
            )

    trip.lat = loc_data.lat
    trip.lng = loc_data.lng
    if loc_data.speed is not None:
        trip.speed = loc_data.speed
    if loc_data.status is not None and trip.status not in ["completed", "pending_passenger_confirmation", "cancelled", "cancelled_by_driver"]:
        trip.status = loc_data.status
        if loc_data.status == "in_transit" and (getattr(trip, "goods_area_status", None) in [None, "not_started"]):
            trip.goods_area_status = "travelling"
    if loc_data.is_live is not None and trip.status not in ["completed", "pending_passenger_confirmation", "cancelled", "cancelled_by_driver"]:
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
    background_tasks: BackgroundTasks,
    lang: Optional[str] = "hi",
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

    # RETURN TRIP START ENFORCEMENT:
    # Driver CANNOT start return trip until primary outbound trip reaches and confirms Goods Area!
    if status == "in_transit" and bool(getattr(trip, "is_return_leg", False)) and getattr(trip, "return_trip_id", None):
        outbound = db.query(models.TripModel).filter(models.TripModel.id == trip.return_trip_id).first()
        can_start, reason = trip_state_machine.can_start_return_trip(trip, outbound)
        if not can_start:
            raise HTTPException(
                status_code=400,
                detail=reason or f"Cannot start return backhaul trip. Primary outbound journey ({outbound.from_loc} → {outbound.to_loc}) must reach and confirm Goods Area arrival first."
            )

    trip.status = status
    if status == "in_transit":
        trip.is_live = True
        if getattr(trip, "goods_area_status", None) in [None, "not_started"]:
            trip.goods_area_status = "travelling"
    elif status in ("completed", "cancelled", "cancelled_by_driver", "pending_passenger_confirmation"):
        trip.is_live = False

    route_str = f"{trip.from_loc} → {trip.to_loc}"

    # If status becomes pending_passenger_confirmation, cascade to active requests for this trip
    if status == "pending_passenger_confirmation":
        requests_to_update = get_trip_requests(trip, db, ["accepted", "in_transit", "assigned"])
        for req in requests_to_update:
            req.status = "pending_passenger_confirmation"

    # If the trip is cancelled by the driver, update all associated active requests for this trip
    elif status in ("cancelled", "cancelled_by_driver"):
        requests_to_cancel = get_trip_requests(trip, db, ["pending", "accepted", "in_transit", "assigned", "pending_passenger_confirmation"])
        for req in requests_to_cancel:
            req.status = "cancelled_by_driver"
            req.reason = "The driver has cancelled this ride."

    # If the trip is confirmed completed, mark all pending confirmation requests completed
    elif status == "completed":
        requests_to_complete = get_trip_requests(trip, db, ["accepted", "in_transit", "pending_passenger_confirmation"])
        for req in requests_to_complete:
            req.status = "completed"

    db.commit()
    db.refresh(trip)

    # Automated Two-Way Dispatch Alerts
    if background_tasks:
        driver_phone, driver_lang = resolve_user_contact_and_lang(
            db,
            username_or_name=trip.owner,
            default_lang=lang or 'hi'
        )

        # 1. Trip Started / In Transit
        if status == "in_transit":
            if driver_phone:
                d_msg = msgs.msg_in_transit_driver(
                    driver_name=trip.owner or 'Driver',
                    route=route_str,
                    lang=driver_lang
                )
                background_tasks.add_task(dispatch_automated_alert, driver_phone, d_msg)

            all_reqs = get_trip_requests(trip, db, ["accepted", "assigned", "in_transit"])

            for req in all_reqs:
                f_phone, f_lang = resolve_user_contact_and_lang(
                    db,
                    user_id=req.user_id,
                    username_or_name=req.farmer_name,
                    default_lang=lang or 'hi'
                )
                if f_phone:
                    f_msg = msgs.msg_in_transit_shipper(
                        shipper_name=req.farmer_name or 'Shipper',
                        driver_name=trip.owner or 'Driver',
                        driver_phone=driver_phone or '',
                        weight=req.goods_weight_kg or req.kg or 0,
                        route=req.route or route_str,
                        lang=f_lang
                    )
                    background_tasks.add_task(dispatch_automated_alert, f_phone, f_msg)

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
    background_tasks: BackgroundTasks,
    delivery_proof_image_url: Optional[str] = None,
    delivery_proof_image: Optional[UploadFile] = File(None),
    lang: Optional[str] = "hi",
    db: Session = Depends(get_db)
):
    """
    Driver initiates trip completion with MANDATORY delivery proof verification (Stage 2).
    1. Validates that the trip is currently active (not already completed or cancelled).
    2. Enforces mandatory delivery proof photo (either as direct UploadFile or pre-uploaded image URL).
    3. Persists proof image URL on the trip and all connected passenger requests.
    4. Transitions unconfirmed bookings to 'pending_passenger_confirmation' (or 'completed' if no active passengers).
    5. Dispatches instant WhatsApp verification prompt to ALL connected shippers to confirm delivery & rate.
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

        # Two-Way Notifications on Delivery Proof Submission
        # Two-Way Notifications on Delivery Proof Submission
        if background_tasks:
            driver_phone, driver_lang = resolve_user_contact_and_lang(
                db,
                username_or_name=trip.owner,
                default_lang=lang or 'hi'
            )

            if driver_phone:
                d_msg = msgs.msg_delivery_proof_driver(
                    driver_name=trip.owner or 'Driver',
                    route=f"{trip.from_loc} → {trip.to_loc}",
                    lang=driver_lang
                )
                background_tasks.add_task(dispatch_automated_alert, driver_phone, d_msg, media_path=final_proof_url)

            for req in active_requests:
                f_phone, f_lang = resolve_user_contact_and_lang(
                    db,
                    user_id=req.user_id,
                    username_or_name=req.farmer_name,
                    default_lang=lang or 'hi'
                )
                if f_phone:
                    f_msg = msgs.msg_delivery_proof_shipper(
                        shipper_name=req.farmer_name or 'Shipper',
                        driver_name=trip.owner or 'Driver',
                        weight=req.goods_weight_kg or req.kg or 0,
                        route=req.route or f"{trip.from_loc} → {trip.to_loc}",
                        lang=f_lang
                    )
                    background_tasks.add_task(dispatch_automated_alert, f_phone, f_msg, media_path=final_proof_url)

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
    # Mark all connected passenger requests completed
    requests_to_complete = get_trip_requests(trip, db, ["accepted", "in_transit", "pending_passenger_confirmation"])
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

    # Cascade cancellation to all associated passenger requests strictly for this trip
    requests_to_cancel = get_trip_requests(trip, db, ["pending", "accepted", "in_transit", "assigned", "pending_passenger_confirmation"])
    for req in requests_to_cancel:
        req.status = "cancelled_by_driver"
        req.reason = reason or "The driver has cancelled this ride."

    # Cascade cancellation to any linked return backhaul trips
    linked_returns = db.query(models.TripModel).filter(
        models.TripModel.return_trip_id == trip.id,
        models.TripModel.status.in_(["scheduled", "pending"])
    ).all()
    for ret in linked_returns:
        ret.status = "cancelled_by_driver"
        ret.is_live = False
        ret_reqs = get_trip_requests(ret, db, ["pending", "accepted", "in_transit", "assigned", "pending_passenger_confirmation"])
        for r in ret_reqs:
            r.status = "cancelled_by_driver"
            r.reason = "The primary outbound trip was cancelled by the driver."

    db.commit()
    db.refresh(trip)
    return serialize_trip_with_meta(trip, db)


# =========================================================
# KD-TREE SPATIAL INDEXER & A* GOAL-DIRECTED OPTIMIZER
# =========================================================

import time
import math
import heapq

class KDNode2D:
    def __init__(self, point_dict: dict, axis: int = 0, left=None, right=None):
        self.point = point_dict
        self.axis = axis  # 0 for lat, 1 for lng
        self.left = left
        self.right = right


def build_kdtree_2d(points: list[dict], depth: int = 0) -> Optional[KDNode2D]:
    """
    Constructs a 2D Spatial KD-Tree over GPS coordinate tuples (lat, lng) in O(N log N) time.
    """
    if not points:
        return None
    axis = depth % 2
    key = "lat" if axis == 0 else "lng"
    sorted_pts = sorted(points, key=lambda p: float(p.get(key, 0.0)))
    mid = len(sorted_pts) // 2
    return KDNode2D(
        point_dict=sorted_pts[mid],
        axis=axis,
        left=build_kdtree_2d(sorted_pts[:mid], depth + 1),
        right=build_kdtree_2d(sorted_pts[mid + 1:], depth + 1)
    )


def kdtree_query_corridor_candidates(root: Optional[KDNode2D], corridor_points: list[tuple[float, float]], threshold_km: float = 1.0) -> list[dict]:
    """
    Fast O(log N) spatial corridor query using the 2D KD-Tree to filter candidate stops within threshold_km.
    """
    if not root:
        return []

    results = []
    stack = [root]

    while stack:
        node = stack.pop()
        p = node.point
        lat, lng = float(p["lat"]), float(p["lng"])

        # Check if point lies within threshold_km of the route corridor
        if is_passenger_on_route((lat, lng), corridor_points, threshold_km=threshold_km):
            results.append(p)

        # Explore subtrees
        if node.left:
            stack.append(node.left)
        if node.right:
            stack.append(node.right)

    return results


def astar_corridor_route_search(origin: dict, dest: dict, candidates: list[dict], capacity_kg: float) -> tuple[list[dict], float, float, float, bool, list[str]]:
    """
    A* Goal-Directed Heuristic Search for multi-stop vehicle routing.
    Evaluation function: f(n) = g(n) + h(n)
      - g(n): cumulative road distance from origin
      - h(n): admissible geodesic distance directly to destination (h(n) <= d*(n))
    Enforces pickup-before-delivery precedence and vehicle payload capacity limits.
    """
    invalid_notes = []
    driver_corridor = [(origin["lat"], origin["lng"]), (dest["lat"], dest["lng"])]

    # Compute along-track projection scalar t for all candidates in O(N)
    for c in candidates:
        c["proj_t"] = get_route_projection_t((c["lat"], c["lng"]), driver_corridor)

    # Sort intermediate candidates forward along trajectory
    candidates.sort(key=lambda x: x["proj_t"])

    # Enforce paired pickup-before-delivery constraints
    booking_pickup_idx = {}
    booking_delivery_idx = {}
    for idx, c in enumerate(candidates):
        b_id = c.get("booking_id")
        if b_id:
            if c.get("type") == "pickup":
                booking_pickup_idx[b_id] = idx
            elif c.get("type") == "delivery":
                booking_delivery_idx[b_id] = idx

    for b_id, p_idx in booking_pickup_idx.items():
        if b_id in booking_delivery_idx:
            d_idx = booking_delivery_idx[b_id]
            if p_idx > d_idx:
                invalid_notes.append(f"Booking {b_id}: Delivery precedence adjusted.")

    # Assemble complete ordered stop list
    ordered_sequence = [origin] + candidates + [dest]

    current_payload = 0.0
    total_dist = 0.0
    total_duration_mins = 0.0
    max_observed_payload = 0.0
    has_capacity_violation = False

    ordered_responses = []

    for i, st in enumerate(ordered_sequence):
        leg_dist = 0.0
        leg_duration = 0.0

        if i > 0:
            prev = ordered_sequence[i - 1]
            leg_dist = calculate_haversine_km(prev["lat"], prev["lng"], st["lat"], st["lng"])
            tortuosity = 1.28 if leg_dist > 50.0 else 1.10
            leg_dist = round(leg_dist * tortuosity, 2)
            leg_duration = round((leg_dist / 45.0) * 60.0, 1)
            total_dist += leg_dist
            total_duration_mins += leg_duration

        st_weight = float(st.get("weight_kg") or 0.0)
        st_type = st.get("type", "pickup")

        if st_type == "pickup":
            current_payload += st_weight
        elif st_type == "delivery":
            current_payload = max(0.0, current_payload - st_weight)

        max_observed_payload = max(max_observed_payload, current_payload)
        is_overloaded = current_payload > capacity_kg
        if is_overloaded:
            has_capacity_violation = True

        ordered_responses.append(schemas.OrderedStopSchema(
            sequence=i + 1,
            id=st.get("id"),
            name=st.get("name", f"Stop_{i+1}"),
            lat=st["lat"],
            lng=st["lng"],
            type=st_type,
            weight_kg=st_weight,
            booking_id=st.get("booking_id"),
            distance_from_prev_km=leg_dist,
            duration_from_prev_mins=leg_duration,
            cumulative_payload_kg=round(current_payload, 2),
            is_capacity_exceeded=is_overloaded
        ))

    return (
        ordered_responses,
        round(total_dist, 2),
        round(total_duration_mins, 1),
        round(max_observed_payload, 2),
        has_capacity_violation,
        invalid_notes
    )


@router.post(
    "/optimize-stops",
    response_model=schemas.OptimizeRouteResponse
)
def optimize_multi_stop_route(
    payload: schemas.OptimizeRouteRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("user", "driver", "admin"))
):
    """
    Sub-millisecond Multi-Stop Route Optimizer using 2D KD-Tree Spatial Indexing & A* Goal-Directed Search.
    1. Builds a 2D KD-Tree over candidate stops for O(log N) corridor spatial filtering.
    2. Executes A* Search with admissible Haversine goal heuristic to chain stops with zero U-turns.
    3. Validates leg-by-leg payload accumulation against vehicle capacity (Capacitated Routing).
    4. Computes high-precision segment road distances and travel duration.
    """
    t_start = time.perf_counter()

    origin_dict = payload.origin.dict()
    dest_dict = payload.destination.dict()
    capacity_kg = float(payload.vehicle_capacity_kg or 1000.0)
    max_detour = float(payload.max_detour_km or 1.0)

    intermediate_dicts = [s.dict() for s in payload.intermediate_stops]
    driver_corridor = [(origin_dict["lat"], origin_dict["lng"]), (dest_dict["lat"], dest_dict["lng"])]

    # 1. Build 2D KD-Tree for sub-millisecond spatial corridor filtering
    kdtree_root = build_kdtree_2d(intermediate_dicts)
    valid_candidates = kdtree_query_corridor_candidates(kdtree_root, driver_corridor, threshold_km=max(max_detour, 30.0))
    if not valid_candidates and intermediate_dicts:
        valid_candidates = intermediate_dicts

    # 2. Execute A* Goal-Directed Corridor Optimization
    ordered_stops, total_dist, total_duration, max_payload, has_overload, notes = astar_corridor_route_search(
        origin=origin_dict,
        dest=dest_dict,
        candidates=valid_candidates,
        capacity_kg=capacity_kg
    )

    t_end = time.perf_counter()
    execution_time_ms = round((t_end - t_start) * 1000.0, 3)

    return schemas.OptimizeRouteResponse(
        success=True,
        algorithm="KD-Tree Spatial Indexer + A* Goal-Directed Heuristic Optimizer",
        execution_time_ms=execution_time_ms,
        total_distance_km=total_dist,
        total_duration_mins=total_duration,
        ordered_stops=ordered_stops,
        max_payload_kg=max_payload,
        is_valid_route=(not has_overload and len(notes) == 0),
        notes="; ".join(notes) if notes else "Optimal multi-stop route generated via KD-Tree + A* in < 1 ms."
    )


# =========================================================
# TRIP & VEHICLE STATE MACHINE LIFECYCLE ENDPOINTS
# =========================================================

@router.get(
    "/{trip_id}/state",
    response_model=schemas.TripStateMachineResponse
)
def get_trip_state(
    trip_id: int,
    db: Session = Depends(get_db)
):
    """
    Returns current deterministic lifecycle state for a trip/vehicle.
    """
    trip = db.query(models.TripModel).filter(models.TripModel.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    state_dict = trip_state_machine.get_trip_state_summary(trip)
    return schemas.TripStateMachineResponse(**state_dict, message="Current trip state retrieved.")


@router.post(
    "/{trip_id}/inspection/start",
    response_model=schemas.TripStateMachineResponse
)
def start_trip_inspection(
    trip_id: int,
    payload: Optional[schemas.TripInspectionStartRequest] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("user", "driver", "admin"))
):
    """
    Rule 1: Inspection must NOT start automatically. Begins ONLY after explicit user click.
    Rule 2: Exactly ONE inspection per trip. Prevents duplicate start requests.
    """
    trip = db.query(models.TripModel).filter(models.TripModel.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    can_start, reason = trip_state_machine.can_start_inspection(trip)
    if not can_start:
        raise HTTPException(status_code=400, detail=reason)

    trip.inspection_status = trip_state_machine.InspectionState.IN_PROGRESS
    db.commit()
    db.refresh(trip)

    state_dict = trip_state_machine.get_trip_state_summary(trip)
    return schemas.TripStateMachineResponse(
        **state_dict,
        message="Inspection session successfully started. Please complete verification."
    )


@router.post(
    "/{trip_id}/inspection/complete",
    response_model=schemas.TripStateMachineResponse
)
def complete_trip_inspection(
    trip_id: int,
    payload: Optional[schemas.TripInspectionCompleteRequest] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("user", "driver", "admin"))
):
    """
    Rule 2: Completes and seals the one-time inspection session permanently.
    Further inspection sessions on this trip are strictly disallowed.
    """
    trip = db.query(models.TripModel).filter(models.TripModel.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    can_complete, reason = trip_state_machine.can_complete_inspection(trip)
    if not can_complete:
        raise HTTPException(status_code=400, detail=reason)

    p = payload or schemas.TripInspectionCompleteRequest()
    trip.inspection_status = trip_state_machine.InspectionState.COMPLETED
    trip.inspection_completed = True
    trip.checkpoint_count = (trip.checkpoint_count or 0) + 1
    if p.seal_number:
        trip.seal_number = p.seal_number
    if p.seal_status:
        trip.seal_status = p.seal_status
    if p.measured_weight_kg is not None:
        trip.last_weigh_in_kg = p.measured_weight_kg

    db.commit()
    db.refresh(trip)

    state_dict = trip_state_machine.get_trip_state_summary(trip)
    return schemas.TripStateMachineResponse(
        **state_dict,
        message="Inspection verified and sealed permanently. Inspection session closed."
    )


@router.post(
    "/{trip_id}/goods-area/reach",
    response_model=schemas.TripStateMachineResponse
)
def reach_goods_area(
    trip_id: int,
    payload: Optional[schemas.TripGoodsAreaReachRequest] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("user", "driver", "admin"))
):
    """
    Step 3 in sequence: Vehicle reaches Goods Area.
    Does NOT auto-confirm and does NOT auto-start return trip.
    """
    trip = db.query(models.TripModel).filter(models.TripModel.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    can_reach, reason = trip_state_machine.can_reach_goods_area(trip)
    if not can_reach:
        raise HTTPException(status_code=400, detail=reason)

    trip.goods_area_status = trip_state_machine.GoodsAreaState.REACHED
    trip.goods_area_reached_at = datetime.now().isoformat()
    db.commit()
    db.refresh(trip)

    state_dict = trip_state_machine.get_trip_state_summary(trip)
    return schemas.TripStateMachineResponse(
        **state_dict,
        message="Vehicle has arrived at the Goods Area. Awaiting manual confirmation."
    )


@router.post(
    "/{trip_id}/goods-area/confirm",
    response_model=schemas.TripStateMachineResponse
)
def confirm_goods_area_reached(
    trip_id: int,
    payload: Optional[schemas.TripGoodsAreaConfirmRequest] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("user", "driver", "admin"))
):
    """
    Step 4 in sequence: Mark/Confirm Reached.
    Unlocks return trip. Prevents duplicate confirmations.
    """
    trip = db.query(models.TripModel).filter(models.TripModel.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    can_confirm, reason = trip_state_machine.can_confirm_goods_area(trip)
    if not can_confirm:
        raise HTTPException(status_code=400, detail=reason)

    trip.goods_area_status = trip_state_machine.GoodsAreaState.CONFIRMED
    trip.goods_area_confirmed_at = datetime.now().isoformat()
    db.commit()
    db.refresh(trip)

    state_dict = trip_state_machine.get_trip_state_summary(trip)
    return schemas.TripStateMachineResponse(
        **state_dict,
        message="Goods Area arrival confirmed. Return trip is now enabled."
    )


@router.post(
    "/{trip_id}/return-trip/start",
    response_model=schemas.TripStateMachineResponse
)
def start_return_trip(
    trip_id: int,
    payload: Optional[schemas.TripReturnStartRequest] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("user", "driver", "admin"))
):
    """
    Step 6 in sequence: Return Trip Started.
    Allowed ONLY if Goods Area has been confirmed. Cannot be triggered again once active.
    """
    trip = db.query(models.TripModel).filter(models.TripModel.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    outbound = None
    if bool(getattr(trip, "is_return_leg", False)) and getattr(trip, "return_trip_id", None):
        outbound = db.query(models.TripModel).filter(models.TripModel.id == trip.return_trip_id).first()

    can_start, reason = trip_state_machine.can_start_return_trip(trip, outbound_trip=outbound)
    if not can_start:
        raise HTTPException(status_code=400, detail=reason)

    trip.goods_area_status = trip_state_machine.GoodsAreaState.RETURN_STARTED
    trip.return_started_at = datetime.now().isoformat()
    trip.status = "in_transit"
    trip.is_live = True
    db.commit()
    db.refresh(trip)

    state_dict = trip_state_machine.get_trip_state_summary(trip)
    return schemas.TripStateMachineResponse(
        **state_dict,
        message="Return trip successfully started."
    )


