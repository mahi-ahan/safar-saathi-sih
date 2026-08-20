from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas

from database import get_db
from auth.dependencies import require_roles


import math

router = APIRouter(
    prefix="/api/trips",
    tags=["Trips"]
)


def calculate_haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes precise geodesic distance (in km) between two coordinate points
    with a road network detour multiplier (1.25x).
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
    return round(max(5.0, R * c * 1.25), 2)


def recalculate_trip_cost_shares(trip: models.TripModel, db: Session):
    """
    Dynamically recalculates proportional cost shares for all active passengers on a trip
    using the Ton-Kilometer / Kg-Km principle with exact geographic distance:
    
    Formula:
      Passenger Workload (kg·km) = Passenger Goods Weight (kg) * Exact Travel Distance (km)
      Total Cumulative Workload (kg·km) = sum(w_i * d_i for all active passengers)
      Passenger Share = (Passenger Workload / Total Cumulative Workload) * Total Driver Amount
    """
    route_str = f"{trip.from_loc} → {trip.to_loc}"
    active_requests = db.query(models.RequestModel).filter(
        models.RequestModel.owner == trip.owner,
        models.RequestModel.route == route_str,
        models.RequestModel.status.in_(["pending", "accepted", "in_transit", "pending_passenger_confirmation", "completed", "assigned"])
    ).all()

    total_driver_amount = trip.total_driver_amount if (trip.total_driver_amount and trip.total_driver_amount > 0) else float(trip.price_per_kg * trip.total_kg)
    trip_default_dist = trip.distance_km if (trip.distance_km and trip.distance_km > 0) else 150.0

    total_payload = sum(req.goods_weight_kg if req.goods_weight_kg is not None else (req.kg or 0) for req in active_requests)

    # 1. Compute each active passenger's exact distance and kg·km workload
    total_kg_km = 0.0
    for req in active_requests:
        req_weight = float(req.goods_weight_kg if req.goods_weight_kg is not None else (req.kg or 0))
        
        # Calculate exact distance from locked-in pickup & delivery coordinates if available
        exact_dist = calculate_haversine_km(req.pickup_lat, req.pickup_lng, req.delivery_lat, req.delivery_lng)
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
    available_space = max(0, trip.total_kg - total_payload)
    space_used_pct = min(100, round((total_payload / trip.total_kg) * 100)) if trip.total_kg > 0 else 0
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
    route_str = f"{trip.from_loc} → {trip.to_loc}"
    active_requests = db.query(models.RequestModel).filter(
        models.RequestModel.owner == trip.owner,
        models.RequestModel.route == route_str,
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
    return schemas.TripResponse(
        id=trip.id,
        state=trip.state,
        from_loc=trip.from_loc,
        to_loc=trip.to_loc,
        date=trip.date,
        vehicle=trip.vehicle,
        owner=trip.owner,
        verified=trip.verified,
        pct=space_used_pct,
        space_used_percentage=space_used_pct,
        total_kg=trip.total_kg,
        available_space_kg=available_space,
        price_per_kg=trip.price_per_kg,
        total_driver_amount=trip.total_driver_amount,
        distance_km=trip.distance_km or 150.0,
        pickup=trip.pickup,
        lat=trip.lat,
        lng=trip.lng,
        dest_lat=trip.dest_lat or 0.0,
        dest_lng=trip.dest_lng or 0.0,
        pickup_lat=trip.pickup_lat or trip.lat or 0.0,
        pickup_lng=trip.pickup_lng or trip.lng or 0.0,
        status=trip.status,
        is_live=trip.is_live,
        speed=trip.speed,
        total_booked_kg=total_payload,
        total_kg_km=total_kg_km,
        passenger_count=count
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
    db_trip = models.TripModel(
        **trip.model_dump()
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


# --------------------------------------------------
# DRIVER MARKS TRIP AS COMPLETE (TWO-WAY CONFIRMATION STEP 1)
# --------------------------------------------------

@router.put(
    "/{trip_id}/complete",
    response_model=schemas.TripResponse
)
def driver_complete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("user", "driver", "admin"))
):
    """
    Driver initiates trip completion.
    1. Checks exact count of active bookings (status in 'accepted', 'in_transit', 'assigned', 'pending_passenger_confirmation', 'completed').
    2. If no active booked passengers exist or all active bookings are already confirmed, marks trip as 'completed'.
    3. Otherwise transitions active unconfirmed bookings to 'pending_passenger_confirmation' and sets trip status to 'pending_passenger_confirmation'.
    """
    trip = db.query(models.TripModel).filter(models.TripModel.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    trip.is_live = False

    route_str = f"{trip.from_loc} → {trip.to_loc}"
    active_requests = db.query(models.RequestModel).filter(
        models.RequestModel.owner == trip.owner,
        models.RequestModel.route == route_str,
        models.RequestModel.status.in_(["accepted", "in_transit", "assigned", "pending_passenger_confirmation", "completed"])
    ).all()

    unconfirmed_requests = [r for r in active_requests if r.status != "completed"]

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

