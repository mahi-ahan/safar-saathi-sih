from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
import shutil
import math
import models
import schemas
from database import get_db
from auth.dependencies import require_roles, get_current_user, get_optional_current_user
from routers.trips import (
    recalculate_trip_cost_shares,
    calculate_haversine_km,
    check_and_finalize_trip_completion,
    is_passenger_on_route,
    calculate_route_aware_price
)

router = APIRouter(
    prefix="/api/requests",
    tags=["Requests"]
)

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"}
ALLOWED_IMAGE_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/pjpeg"}


def save_uploaded_image(file: UploadFile, subfolder: str = "cargo") -> str:
    """
    Validates and saves an uploaded image to the static storage folder.
    Returns relative URL path (/uploads/{subfolder}/{filename}).
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Image file is missing. A valid image is required."
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

    unique_filename = f"{uuid.uuid4().hex}{ext if ext in ALLOWED_IMAGE_EXTENSIONS else '.jpg'}"
    target_path = os.path.join(base_upload_dir, unique_filename)

    try:
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        if os.path.getsize(target_path) == 0:
            os.remove(target_path)
            raise HTTPException(status_code=400, detail="Uploaded image file is empty.")
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(target_path):
            os.remove(target_path)
        raise HTTPException(status_code=500, detail=f"Failed to persist image: {str(e)}")

    return f"/uploads/{subfolder}/{unique_filename}"



def serialize_request_with_cost(req: models.RequestModel, db: Session) -> schemas.RequestResponse:
    """
    Serializes a RequestModel with real-time distance-and-weight (Ton-Km) proportional cost share,
    trip payload metadata, and verified image proof links.
    """
    weight = req.goods_weight_kg if req.goods_weight_kg is not None else (req.kg or 0)
    
    # Locate linked trip
    trip = None
    if req.owner and req.route:
        all_trips = db.query(models.TripModel).filter(models.TripModel.owner == req.owner).all()
        for t in all_trips:
            if f"{t.from_loc} → {t.to_loc}" == req.route:
                trip = t
                break

    trip_default_dist = trip.distance_km if (trip and trip.distance_km and trip.distance_km > 0) else 150.0
    
    exact_dist = calculate_haversine_km(req.pickup_lat or 0.0, req.pickup_lng or 0.0, req.delivery_lat or 0.0, req.delivery_lng or 0.0)
    if exact_dist > 0:
        dist = exact_dist
    else:
        dist = float(req.distance_km if (req.distance_km and req.distance_km > 0) else trip_default_dist)
        
    req.distance_km = dist
    req.kg_km = round(float(weight) * float(dist), 2)

    total_driver_amount = 0.0
    total_payload = weight
    total_kg_km = req.kg_km
    share = req.per_person_share or 0.0

    if trip:
        total_driver_amount = trip.total_driver_amount if (trip.total_driver_amount and trip.total_driver_amount > 0) else float((trip.price_per_kg or 0) * (trip.total_kg or 1000))
        total_payload, total_kg_km, *rest = recalculate_trip_cost_shares(trip, db)
        if total_kg_km > 0 and total_driver_amount > 0:
            share = round((req.kg_km / total_kg_km) * total_driver_amount, 2)
            req.per_person_share = share
            
    share_pct = round((req.kg_km / total_kg_km) * 100.0, 1) if (total_kg_km and total_kg_km > 0) else 0.0

    return schemas.RequestResponse(
        id=req.id,
        status=req.status or "pending",
        route=req.route,
        vehicle=req.vehicle,
        owner=req.owner,
        farmer_name=req.farmer_name,
        kg=req.kg,
        goods_weight_kg=weight,
        distance_km=dist,
        kg_km=req.kg_km,
        per_person_share=share,
        total_driver_amount=total_driver_amount,
        total_trip_kg_km=total_kg_km,
        share_pct=share_pct,
        pickup_date=req.pickup_date,
        pickup_time=req.pickup_time,
        pickup_place=req.pickup_place,
        delivery_date=req.delivery_date,
        pickup_lat=req.pickup_lat or 0.0,
        pickup_lng=req.pickup_lng or 0.0,
        delivery_lat=req.delivery_lat or 0.0,
        delivery_lng=req.delivery_lng or 0.0,
        pickup_cargo_image_url=req.pickup_cargo_image_url,
        delivery_proof_image_url=req.delivery_proof_image_url,
        reason=req.reason,
        rating=req.rating,
        feedback=req.feedback
    )


# ==================================================
# UPLOAD CARGO IMAGE PROOF (STAGE 1 UPLOAD ENDPOINT)
# ==================================================

@router.post("/upload-cargo-image")
def upload_cargo_image(
    file: UploadFile = File(...)
):
    """
    Accepts and verifies a mandatory cargo image proof from the shipper.
    Returns the persisted static image URL.
    """
    image_url = save_uploaded_image(file, subfolder="cargo")
    return {
        "pickup_cargo_image_url": image_url,
        "filename": file.filename,
        "status": "success",
        "message": "Cargo proof photo verified and uploaded successfully."
    }


# ==================================================
# CREATE REQUEST WITH MANDATORY CARGO PROOF (STAGE 1)
# ==================================================

@router.post(
    "",
    response_model=schemas.RequestResponse
)
def create_request(
    req: schemas.RequestCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_current_user)
):
    # STAGE 1: MANDATORY CARGO PROOF VALIDATION
    if not req.pickup_cargo_image_url or not str(req.pickup_cargo_image_url).strip():
        raise HTTPException(
            status_code=400,
            detail="Mandatory Cargo Proof Required: Shipper must provide a verified cargo photo (JPEG, PNG, WEBP) to authenticate the booking request."
        )

    weight = req.goods_weight_kg if req.goods_weight_kg is not None else req.kg
    
    # 1. Locate linked trip
    trip = None
    if req.owner and req.route:
        all_trips = db.query(models.TripModel).filter(models.TripModel.owner == req.owner).all()
        for t in all_trips:
            if f"{t.from_loc} → {t.to_loc}" == req.route:
                trip = t
                break

    # 2. Strict Route Proximity Check (5 km start/dest buffer & intermediate corridor check)
    if trip:
        driver_start_lat = trip.pickup_lat if (trip.pickup_lat and trip.pickup_lat != 0.0) else trip.lat
        driver_start_lng = trip.pickup_lng if (trip.pickup_lng and trip.pickup_lng != 0.0) else trip.lng
        driver_dest_lat = trip.dest_lat
        driver_dest_lng = trip.dest_lng

        driver_route_coords = []
        if driver_start_lat and driver_start_lng and (driver_start_lat != 0.0 or driver_start_lng != 0.0):
            driver_route_coords.append((float(driver_start_lat), float(driver_start_lng)))
        if driver_dest_lat and driver_dest_lng and (driver_dest_lat != 0.0 or driver_dest_lng != 0.0):
            driver_route_coords.append((float(driver_dest_lat), float(driver_dest_lng)))

        if len(driver_route_coords) >= 2:
            # Verify Passenger Pickup
            if req.pickup_lat and req.pickup_lng and (req.pickup_lat != 0.0 or req.pickup_lng != 0.0):
                if not is_passenger_on_route((float(req.pickup_lat), float(req.pickup_lng)), driver_route_coords):
                    raise HTTPException(
                        status_code=400,
                        detail="Route Mismatch: Requested pickup location is not along the driver's route corridor."
                    )
            # Verify Passenger Dropoff
            if req.delivery_lat and req.delivery_lng and (req.delivery_lat != 0.0 or req.delivery_lng != 0.0):
                if not is_passenger_on_route((float(req.delivery_lat), float(req.delivery_lng)), driver_route_coords):
                    raise HTTPException(
                        status_code=400,
                        detail="Route Mismatch: Requested drop-off location is not along the driver's route corridor."
                    )

    # 3. Calculate exact on-route passenger distance & route-aware segment pricing
    exact_dist = calculate_haversine_km(req.pickup_lat or 0.0, req.pickup_lng or 0.0, req.delivery_lat or 0.0, req.delivery_lng or 0.0)
    if exact_dist > 0:
        dist = exact_dist
    else:
        trip_default_dist = trip.distance_km if (trip and trip.distance_km and trip.distance_km > 0) else 150.0
        dist = req.distance_km if (req.distance_km and req.distance_km > 0) else trip_default_dist

    initial_share = calculate_route_aware_price(dist, trip=trip, service_fee=20.0, weight_kg=weight)

    user_id_val = current_user.id if current_user else None

    try:
        db_req = models.RequestModel(
            id=req.id,
            route=req.route,
            vehicle=req.vehicle,
            owner=req.owner,
            farmer_name=req.farmer_name,
            kg=req.kg,
            goods_weight_kg=weight,
            distance_km=dist,
            kg_km=round(float(weight) * float(dist), 2),
            per_person_share=initial_share,
            pickup_place=req.pickup_place,
            delivery_date=req.delivery_date,
            pickup_lat=req.pickup_lat or 0.0,
            pickup_lng=req.pickup_lng or 0.0,
            delivery_lat=req.delivery_lat or 0.0,
            delivery_lng=req.delivery_lng or 0.0,
            pickup_cargo_image_url=str(req.pickup_cargo_image_url).strip(),
            delivery_proof_image_url=None,
            status="pending",
            user_id=user_id_val
        )

        db.add(db_req)
        db.commit()
        db.refresh(db_req)

        # Recalculate trip cost shares & capacity for linked trip
        if trip:
            recalculate_trip_cost_shares(trip, db)

        return serialize_request_with_cost(db_req, db)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create cargo booking request: {str(e)}"
        )


# ==================================================
# CREATE REQUEST VIA MULTIPART FORM (DIRECT PROOF ATTACHMENT)
# ==================================================

@router.post(
    "/create-with-proof",
    response_model=schemas.RequestResponse
)
def create_request_with_proof(
    id: str = Form(...),
    route: str = Form(...),
    vehicle: str = Form(""),
    owner: str = Form(...),
    farmer_name: str = Form("Shipper"),
    kg: int = Form(0),
    goods_weight_kg: Optional[int] = Form(None),
    distance_km: float = Form(150.0),
    pickup_place: Optional[str] = Form(None),
    delivery_date: Optional[str] = Form(None),
    pickup_lat: float = Form(0.0),
    pickup_lng: float = Form(0.0),
    delivery_lat: float = Form(0.0),
    delivery_lng: float = Form(0.0),
    cargo_image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("user", "driver", "admin"))
):
    """
    Direct multipart endpoint: accepts cargo image file upload + booking form fields in a single atomic transaction.
    """
    image_url = save_uploaded_image(cargo_image, subfolder="cargo")
    
    req_data = schemas.RequestCreate(
        id=id,
        route=route,
        vehicle=vehicle,
        owner=owner,
        farmer_name=farmer_name,
        kg=kg,
        goods_weight_kg=goods_weight_kg if goods_weight_kg is not None else kg,
        distance_km=distance_km,
        pickup_place=pickup_place,
        delivery_date=delivery_date,
        pickup_lat=pickup_lat,
        pickup_lng=pickup_lng,
        delivery_lat=delivery_lat,
        delivery_lng=delivery_lng,
        pickup_cargo_image_url=image_url
    )
    return create_request(req_data, db, current_user)




# ==================================================
# GET MY REQUESTS
# ==================================================

@router.get(
    "/my",
    response_model=list[schemas.RequestResponse]
)
def get_my_requests(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_current_user)
):
    if not current_user:
        requests = db.query(models.RequestModel).all()
        return [serialize_request_with_cost(r, db) for r in requests]

    requests = (
        db.query(models.RequestModel)
        .filter(
            models.RequestModel.user_id
            == current_user.id
        )
        .all()
    )
    return [serialize_request_with_cost(r, db) for r in requests]



# ==================================================
# GET INCOMING REQUESTS
# ==================================================

@router.get(
    "/incoming",
    response_model=list[schemas.RequestResponse]
)
def get_incoming_requests(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_current_user)
):
    """
    Returns requests sent to the current driver's published
    trips with real-time calculated cost shares.
    """
    from models import UserProfile, TripModel

    if not current_user:
        requests = db.query(models.RequestModel).all()
        return [serialize_request_with_cost(r, db) for r in requests]

    profile = (
        db.query(UserProfile)
        .filter(
            UserProfile.user_id
            == current_user.id
        )
        .first()
    )

    driver_identifiers = {current_user.username}
    if profile and profile.full_name:
        driver_identifiers.add(profile.full_name)

    # Find all trips published by this driver
    my_trips = (
        db.query(TripModel)
        .filter(
            TripModel.owner.in_(driver_identifiers)
        )
        .all()
    )

    if not my_trips:
        return []

    # Collect owners to match
    owner_names = {t.owner for t in my_trips} | driver_identifiers

    requests = (
        db.query(models.RequestModel)
        .filter(
            models.RequestModel.owner.in_(owner_names)
        )
        .all()
    )
    return [serialize_request_with_cost(r, db) for r in requests]


# ==================================================
# CANCEL MY REQUEST
# USER ONLY
# ==================================================

@router.delete("/{request_id}")
def cancel_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("user", "driver", "admin")
    )
):
    request = (
        db.query(models.RequestModel)
        .filter(
            models.RequestModel.id == request_id
        )
        .first()
    )

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    # Make sure the user owns this request
    if request.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot cancel this request"
        )

    if request.status not in ["pending", "accepted", "assigned"]:
        raise HTTPException(
            status_code=400,
            detail="This request cannot be cancelled in its current state"
        )

    request.status = "cancelled"
    db.commit()

    # Recalculate remaining passengers' shares and check completion for linked trip
    all_trips = db.query(models.TripModel).filter(models.TripModel.owner == request.owner).all()
    for t in all_trips:
        if f"{t.from_loc} → {t.to_loc}" == request.route:
            check_and_finalize_trip_completion(t, db)
            recalculate_trip_cost_shares(t, db)
            break

    return {
        "message": "Request cancelled successfully"
    }


# ==================================================
# GET ALL REQUESTS
# ADMIN ONLY
# ==================================================

@router.get(
    "/all",
    response_model=list[schemas.RequestResponse]
)
def get_all_requests(
    db: Session = Depends(get_db),

    current_user=Depends(
        require_roles("admin")
    )
):
    requests = (
        db.query(models.RequestModel)
        .all()
    )
    return [serialize_request_with_cost(r, db) for r in requests]


# ==================================================
# UPDATE REQUEST STATUS
# DRIVER + ADMIN
# ==================================================

@router.put("/{request_id}/status")
def update_request_status(
    request_id: str,
    status: str,
    reason: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "user",
            "driver",
            "admin"
        )
    )
):
    request = (
        db.query(models.RequestModel)
        .filter(
            models.RequestModel.id == request_id
        )
        .first()
    )

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    allowed_statuses = [
        "pending",
        "accepted",
        "assigned",
        "in_transit",
        "pending_passenger_confirmation",
        "completed",
        "cancelled",
        "cancelled_by_driver"
    ]

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid request status"
        )

    request.status = status
    if reason:
        request.reason = reason
    elif status == "cancelled_by_driver":
        request.reason = "The driver has cancelled this ride."

    db.commit()
    db.refresh(request)

    # Recalculate trip cost shares and check completion
    all_trips = db.query(models.TripModel).filter(models.TripModel.owner == request.owner).all()
    for t in all_trips:
        if f"{t.from_loc} → {t.to_loc}" == request.route:
            check_and_finalize_trip_completion(t, db)
            recalculate_trip_cost_shares(t, db)
            break

    return serialize_request_with_cost(request, db)


# ==================================================
# PASSENGER CONFIRMS RIDE COMPLETION & RATES (TWO-WAY STEP 2)
# ==================================================

@router.put(
    "/{request_id}/confirm-completion",
    response_model=schemas.RequestResponse
)
@router.post(
    "/{request_id}/confirm-completion",
    response_model=schemas.RequestResponse
)
def confirm_request_completion(
    request_id: str,
    payload: Optional[schemas.ConfirmCompletionRequest] = None,
    rating: Optional[int] = None,
    feedback: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Passenger confirms receipt of goods / trip completion, submits rating (1-5) and feedback.
    Officially marks the request as 'completed' and closes the trip if all active booked passengers have confirmed.
    """
    request = (
        db.query(models.RequestModel)
        .filter(
            models.RequestModel.id == request_id
        )
        .first()
    )

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    final_rating = payload.rating if (payload and payload.rating is not None) else rating
    final_feedback = payload.feedback if (payload and payload.feedback is not None) else feedback

    request.status = "completed"
    if final_rating is not None:
        request.rating = max(1, min(5, int(final_rating)))
    if final_feedback is not None:
        request.feedback = str(final_feedback).strip()

    db.commit()

    # Check and finalize linked trip if all active booked passengers are confirmed
    all_trips = db.query(models.TripModel).filter(models.TripModel.owner == request.owner).all()
    for t in all_trips:
        if f"{t.from_loc} → {t.to_loc}" == request.route:
            check_and_finalize_trip_completion(t, db)
            recalculate_trip_cost_shares(t, db)
            break

    db.refresh(request)
    return serialize_request_with_cost(request, db)


# ==================================================
# CANCEL REQUEST BY DRIVER
# DRIVER + ADMIN
# ==================================================

@router.put("/{request_id}/driver-cancel")
def driver_cancel_request(
    request_id: str,
    reason: str | None = "The driver has cancelled this ride.",
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("driver", "admin")
    )
):
    request = (
        db.query(models.RequestModel)
        .filter(
            models.RequestModel.id == request_id
        )
        .first()
    )

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    request.status = "cancelled_by_driver"
    request.reason = reason or "The driver has cancelled this ride."

    db.commit()

    # Recalculate remaining passengers' shares and check completion for linked trip
    all_trips = db.query(models.TripModel).filter(models.TripModel.owner == request.owner).all()
    for t in all_trips:
        if f"{t.from_loc} → {t.to_loc}" == request.route:
            check_and_finalize_trip_completion(t, db)
            recalculate_trip_cost_shares(t, db)
            break

    db.refresh(request)
    return serialize_request_with_cost(request, db)

