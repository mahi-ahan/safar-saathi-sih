import os
import uuid
import shutil
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth.security import create_access_token, hash_password, verify_password
from routers.trips import calculate_haversine_km
from services.dispatcher import dispatch_automated_alert, resolve_user_contact_and_lang
import services.messages as msgs

router = APIRouter(
    prefix="/api/logistics",
    tags=["Logistics Operations"]
)

# Upload directory setup
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
LOGISTICS_UPLOAD_DIR = os.path.join(UPLOAD_DIR, "logistics")
os.makedirs(LOGISTICS_UPLOAD_DIR, exist_ok=True)

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


def check_officer_password(plain_password: str, stored_password: Optional[str]) -> bool:
    if not stored_password:
        return True
    try:
        if verify_password(plain_password, stored_password):
            return True
    except Exception:
        pass
    return plain_password == stored_password


# =========================================================
# 1. LOGISTICS OFFICER AUTHENTICATION & REGISTRATION
# =========================================================

@router.post("/auth/register")
def logistics_register(
    payload: schemas.LogisticsRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Registers a new field logistics officer with security password/PIN and posting station.
    """
    clean_phone = payload.phone_number.strip().replace(" ", "").replace("-", "")
    if len(clean_phone) < 10:
        raise HTTPException(status_code=400, detail="Please provide a valid 10-digit mobile number.")

    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Officer full name is required.")

    if not payload.password or len(payload.password.strip()) < 4:
        raise HTTPException(status_code=400, detail="Please set a security password/PIN with at least 4 characters.")

    station_name = payload.station.strip() if payload.station else ""
    if not station_name:
        raise HTTPException(status_code=400, detail="Location of posting / assigned station is required.")

    # Search existing user by phone
    user = (
        db.query(models.User)
        .join(models.UserProfile, models.User.id == models.UserProfile.user_id)
        .filter(models.UserProfile.phone_number == clean_phone)
        .first()
    )

    hashed_pw = hash_password(payload.password.strip())

    if not user:
        unique_username = f"logistics_{clean_name.replace(' ', '_').lower()}_{clean_phone[-4:]}_{uuid.uuid4().hex[:4]}"
        user = models.User(
            username=unique_username,
            email=f"{unique_username}@safarsaathi.com",
            password=hashed_pw,
            role=models.UserRole.USER
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        profile = models.UserProfile(
            user_id=user.id,
            full_name=clean_name,
            phone_number=clean_phone,
            user_type="logistics",
            assigned_station=station_name,
            station_lat=payload.station_lat,
            station_lng=payload.station_lng,
            id_proof_doc=payload.id_proof_doc,
            is_verified=True,
            preferred_lang="hi"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    else:
        user.password = hashed_pw
        profile = user.profile
        if not profile:
            profile = models.UserProfile(user_id=user.id)
            db.add(profile)

        profile.full_name = clean_name
        profile.phone_number = clean_phone
        profile.user_type = "logistics"
        profile.assigned_station = station_name
        if payload.station_lat is not None:
            profile.station_lat = payload.station_lat
        if payload.station_lng is not None:
            profile.station_lng = payload.station_lng
        if payload.id_proof_doc:
            profile.id_proof_doc = payload.id_proof_doc
        profile.is_verified = True
        db.commit()
        db.refresh(profile)

    access_token = create_access_token(data={"sub": str(user.id), "role": "logistics"})
    id_proof_url = f"{BASE_URL}/uploads/{profile.id_proof_doc}" if profile.id_proof_doc else None

    return {
        "status": "success",
        "message": f"Officer {clean_name} registered successfully. Posting station active at {station_name}!",
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": "logistics",
        "officer": {
            "id": user.id,
            "name": profile.full_name,
            "phone_number": profile.phone_number,
            "station": profile.assigned_station,
            "station_lat": getattr(profile, "station_lat", None),
            "station_lng": getattr(profile, "station_lng", None),
            "id_proof_doc": profile.id_proof_doc,
            "id_proof_doc_url": id_proof_url,
            "is_verified": profile.is_verified
        }
    }


@router.post("/auth/login")
def logistics_login(
    payload: schemas.LogisticsLoginCredentialsRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticates a field logistics officer using their 10-digit mobile and password/PIN.
    """
    clean_phone = payload.phone_number.strip().replace(" ", "").replace("-", "")
    if len(clean_phone) < 10:
        raise HTTPException(status_code=400, detail="Please enter your registered 10-digit mobile number.")

    if not payload.password:
        raise HTTPException(status_code=400, detail="Please enter your password or security PIN.")

    user = (
        db.query(models.User)
        .join(models.UserProfile, models.User.id == models.UserProfile.user_id)
        .filter(models.UserProfile.phone_number == clean_phone)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="No officer account found with this mobile number. Please register first."
        )

    if not check_officer_password(payload.password.strip(), user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials. Incorrect password/PIN for this officer account."
        )

    profile = user.profile
    if not profile:
        profile = models.UserProfile(user_id=user.id, full_name=user.username, phone_number=clean_phone, user_type="logistics")
        db.add(profile)
        db.commit()
        db.refresh(profile)

    access_token = create_access_token(data={"sub": str(user.id), "role": "logistics"})
    id_proof_url = f"{BASE_URL}/uploads/{profile.id_proof_doc}" if profile.id_proof_doc else None

    return {
        "status": "success",
        "message": f"Welcome back, Officer {profile.full_name}! Station {profile.assigned_station or 'Hub'} opened.",
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": "logistics",
        "officer": {
            "id": user.id,
            "name": profile.full_name,
            "phone_number": profile.phone_number,
            "station": profile.assigned_station or "Corridor Hub",
            "station_lat": getattr(profile, "station_lat", None),
            "station_lng": getattr(profile, "station_lng", None),
            "id_proof_doc": profile.id_proof_doc,
            "id_proof_doc_url": id_proof_url,
            "is_verified": profile.is_verified
        }
    }


@router.post("/auth/login-or-register")
def logistics_login_or_register(
    payload: schemas.LogisticsLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Direct login or registration for field logistics personnel (backwards compatible).
    """
    clean_phone = payload.phone_number.strip().replace(" ", "").replace("-", "")
    if len(clean_phone) < 10:
        raise HTTPException(status_code=400, detail="Please provide a valid 10-digit mobile number.")

    clean_name = (payload.name or "").strip() or f"Officer_{clean_phone[-4:]}"

    # Search existing user by phone or username
    user = (
        db.query(models.User)
        .join(models.UserProfile, models.User.id == models.UserProfile.user_id)
        .filter(models.UserProfile.phone_number == clean_phone)
        .first()
    )

    hashed_pw = hash_password(payload.password.strip()) if payload.password else "LOGISTICS_FIELD_AGENT"

    if not user:
        unique_username = f"logistics_{clean_name.replace(' ', '_').lower()}_{clean_phone[-4:]}_{uuid.uuid4().hex[:4]}"
        user = models.User(
            username=unique_username,
            email=f"{unique_username}@safarsaathi.com",
            password=hashed_pw,
            role=models.UserRole.USER
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        profile = models.UserProfile(
            user_id=user.id,
            full_name=clean_name,
            phone_number=clean_phone,
            user_type="logistics",
            assigned_station=payload.station or "Corridor Hub",
            station_lat=payload.station_lat,
            station_lng=payload.station_lng,
            id_proof_doc=payload.id_proof_doc,
            is_verified=True,
            preferred_lang="hi"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    else:
        if payload.password and not check_officer_password(payload.password.strip(), user.password):
            raise HTTPException(status_code=401, detail="Invalid credentials. Incorrect password/PIN.")

        profile = user.profile
        if not profile:
            profile = models.UserProfile(user_id=user.id)
            db.add(profile)

        if payload.name:
            profile.full_name = clean_name
        profile.phone_number = clean_phone
        profile.user_type = "logistics"
        if payload.station:
            profile.assigned_station = payload.station
        if payload.station_lat is not None:
            profile.station_lat = payload.station_lat
        if payload.station_lng is not None:
            profile.station_lng = payload.station_lng
        if payload.id_proof_doc:
            profile.id_proof_doc = payload.id_proof_doc
        profile.is_verified = True
        db.commit()
        db.refresh(profile)

    access_token = create_access_token(data={"sub": str(user.id), "role": "logistics"})
    id_proof_url = f"{BASE_URL}/uploads/{profile.id_proof_doc}" if profile.id_proof_doc else None

    return {
        "status": "success",
        "message": f"Welcome Officer {clean_name}! Logistics station active.",
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": "logistics",
        "officer": {
            "id": user.id,
            "name": profile.full_name,
            "phone_number": profile.phone_number,
            "station": profile.assigned_station or "Corridor Hub",
            "station_lat": getattr(profile, "station_lat", None),
            "station_lng": getattr(profile, "station_lng", None),
            "id_proof_doc": profile.id_proof_doc,
            "id_proof_doc_url": id_proof_url,
            "is_verified": profile.is_verified
        }
    }


@router.post("/upload-id")
def upload_logistics_id_proof(file: UploadFile = File(...)):
    """
    Uploads ID Proof (Aadhaar / Government ID / Logistics Employee Badge).
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="ID document file is required.")

    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = {".jpg", ".jpeg", ".png", ".pdf", ".webp"}
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="Allowed ID formats: JPG, PNG, PDF, WEBP.")

    unique_filename = f"logistics_id_{uuid.uuid4().hex[:8]}{ext}"
    target_path = os.path.join(LOGISTICS_UPLOAD_DIR, unique_filename)

    try:
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to persist ID file: {str(e)}")

    doc_rel_url = f"logistics/{unique_filename}"
    full_url = f"{BASE_URL}/uploads/{doc_rel_url}"

    return {
        "status": "success",
        "filename": doc_rel_url,
        "url": full_url
    }


# =========================================================
# 2. CROSS-CONNECTED TRIPS & SHIPMENTS UNIFIED FEED
# =========================================================

@router.get("/trips-and-shipments")
def get_logistics_trips_and_shipments(
    route_search: Optional[str] = None,
    state_filter: Optional[str] = None,
    officer_station: Optional[str] = None,
    officer_lat: Optional[float] = None,
    officer_lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """
    Consolidates data across both journeys:
    1. 'Offer a Trip' / Driver data (vehicle type, driver contact, route, capacity, live status)
    2. 'Find a Vehicle' / Shipper bookings (cargo type, weight, perishability, ice requirements, pickup/drop coords)
    3. Checkpoint inspection history (seals, weighbridge compliance, cold-chain)
    4. Strict regional filtering by officer's posting station location & coordinates.
    """
    all_trips = (
        db.query(models.TripModel)
        .order_by(models.TripModel.id.desc())
        .all()
    )

    all_requests = (
        db.query(models.RequestModel)
        .order_by(models.RequestModel.id.desc())
        .all()
    )

    all_checkpoints = (
        db.query(models.LogisticsCheckpointModel)
        .order_by(models.LogisticsCheckpointModel.id.desc())
        .all()
    )

    # -------------------------------------------------------------
    # LOCATION-BASED FILTERING FOR OFFICER'S ASSIGNED STATION
    # If officer_station is provided, filter all trips and shipments
    # so that ONLY data relevant to their assigned location appears.
    # -------------------------------------------------------------
    has_station_filter = bool(
        officer_station
        and officer_station.strip()
        and officer_station.strip().lower() not in ["all", "all india", "national", "undefined", "null"]
    )

    if has_station_filter:
        s_clean = officer_station.strip().lower()
        import re
        generic_words = {"hub", "checkpoint", "toll", "plaza", "highway", "mandi", "corridor", "station", "gate", "road", "transit", "nh", "the", "and", "center", "centre"}
        station_tokens = [w for w in re.split(r'[\s,\-_/]+', s_clean) if len(w) >= 3 and w not in generic_words]

        has_coords = bool(officer_lat is not None and officer_lng is not None and (officer_lat != 0.0 or officer_lng != 0.0))

        def trip_is_at_station(t):
            t_from = (t.from_loc or "").lower()
            t_to = (t.to_loc or "").lower()
            t_state = (t.state or "").lower()
            t_cp = (t.current_checkpoint or "").lower()
            combined_text = f"{t_from} {t_to} {t_state} {t_cp}"

            # 1. Textual token match (e.g. "bhubaneswar", "odisha", "cuttack")
            if any(tok in combined_text for tok in station_tokens):
                return True

            # 2. Geospatial proximity & corridor intersection
            if has_coords:
                o_lat = t.pickup_lat if (t.pickup_lat and t.pickup_lat != 0.0) else (t.lat or 0.0)
                o_lng = t.pickup_lng if (t.pickup_lng and t.pickup_lng != 0.0) else (t.lng or 0.0)
                d_lat = t.dest_lat or 0.0
                d_lng = t.dest_lng or 0.0

                if o_lat != 0.0 and o_lng != 0.0:
                    if calculate_haversine_km(officer_lat, officer_lng, o_lat, o_lng) <= 120.0:
                        return True

                if d_lat != 0.0 and d_lng != 0.0:
                    if calculate_haversine_km(officer_lat, officer_lng, d_lat, d_lng) <= 120.0:
                        return True

                if o_lat != 0.0 and o_lng != 0.0 and d_lat != 0.0 and d_lng != 0.0:
                    direct_dist = calculate_haversine_km(o_lat, o_lng, d_lat, d_lng)
                    dist_to_o = calculate_haversine_km(officer_lat, officer_lng, o_lat, o_lng)
                    dist_to_d = calculate_haversine_km(officer_lat, officer_lng, d_lat, d_lng)
                    detour_km = (dist_to_o + dist_to_d) - direct_dist
                    if detour_km <= 80.0:
                        return True

            return False

        all_trips = [t for t in all_trips if trip_is_at_station(t)]
        valid_trip_ids = {t.id for t in all_trips}
        all_requests = [
            r for r in all_requests
            if (r.trip_id in valid_trip_ids) or
               (r.pickup_place and any(tok in r.pickup_place.lower() for tok in station_tokens)) or
               (r.route and any(tok in r.route.lower() for tok in station_tokens))
        ]
        all_checkpoints = [
            cp for cp in all_checkpoints
            if (cp.trip_id in valid_trip_ids) or
               (cp.checkpoint_name and any(tok in cp.checkpoint_name.lower() for tok in station_tokens))
        ]

    # Compute dynamic corridors across India from live database trips
    corridor_stats = {}
    for t in all_trips:
        from_city = t.from_loc.split(',')[0].strip() if t.from_loc else "Origin Hub"
        to_city = t.to_loc.split(',')[0].strip() if t.to_loc else "Destination Hub"
        c_key = f"{from_city} → {to_city}"
        
        # Determine state
        state_name = "India"
        if t.state and str(t.state).strip():
            state_name = t.state.split(',')[0].strip()
        elif t.from_loc and ',' in t.from_loc:
            parts = [p.strip() for p in t.from_loc.split(',') if p.strip()]
            if len(parts) >= 2 and parts[-1].lower() == "india":
                state_name = parts[-2]
            elif len(parts) >= 1:
                state_name = parts[-1]

        if c_key not in corridor_stats:
            corridor_stats[c_key] = {
                "route": c_key,
                "from_city": from_city,
                "to_city": to_city,
                "state": state_name,
                "trips_count": 0,
                "active_trips_count": 0,
                "shipments_count": 0,
                "has_perishables": False,
                "trip_ids": []
            }
        corridor_stats[c_key]["trips_count"] += 1
        corridor_stats[c_key]["trip_ids"].append(t.id)
        if t.status in ["in_transit", "scheduled"] or t.is_live:
            corridor_stats[c_key]["active_trips_count"] += 1
        if t.has_perishables:
            corridor_stats[c_key]["has_perishables"] = True

    for r in all_requests:
        if r.trip_id:
            for c_val in corridor_stats.values():
                if r.trip_id in c_val["trip_ids"]:
                    c_val["shipments_count"] += 1
                    if r.is_perishable:
                        c_val["has_perishables"] = True

    # Group checkpoints by trip_id
    checkpoints_by_trip = {}
    for cp in all_checkpoints:
        checkpoints_by_trip.setdefault(cp.trip_id, []).append({
            "id": cp.id,
            "trip_id": cp.trip_id,
            "checkpoint_name": cp.checkpoint_name,
            "checkpoint_type": getattr(cp, "checkpoint_type", "Highway Toll Plaza") or "Highway Toll Plaza",
            "officer_name": cp.officer_name,
            "officer_phone": cp.officer_phone,
            "timestamp": cp.timestamp,
            "cargo_seal_intact": cp.cargo_seal_intact,
            "seal_number": getattr(cp, "seal_number", None),
            "seal_status": getattr(cp, "seal_status", "Verified & Intact") or "Verified & Intact",
            "measured_weight_kg": getattr(cp, "measured_weight_kg", None),
            "declared_weight_kg": getattr(cp, "declared_weight_kg", None),
            "weight_discrepancy_kg": getattr(cp, "weight_discrepancy_kg", None),
            "weight_compliant": getattr(cp, "weight_compliant", True),
            "safety_parameters_status": getattr(cp, "safety_parameters_status", "Compliant") or "Compliant",
            "cooling_status": getattr(cp, "cooling_status", None),
            "cargo_condition": cp.cargo_condition,
            "ice_status": cp.ice_status,
            "temp_celsius": cp.temp_celsius,
            "notes": cp.notes,
            "proof_image_url": cp.proof_image_url,
            "action_taken": cp.action_taken
        })

    # Group requests by trip_id
    requests_by_trip = {}
    for r in all_requests:
        req_dict = {
            "id": r.id,
            "trip_id": r.trip_id,
            "farmer_name": r.farmer_name or "Shipper",
            "farmer_phone": (db.query(models.UserProfile.phone_number).filter(models.UserProfile.user_id == r.user_id).scalar() if r.user_id else None),
            "cargo_type": r.cargo_type or "Fresh Agricultural Produce",
            "cargo_category": getattr(r, "cargo_category", "general") or "general",
            "dedicated_sub_category": getattr(r, "dedicated_sub_category", None),
            "is_dedicated": bool(getattr(r, "is_dedicated", False)),
            "goods_weight_kg": r.goods_weight_kg if r.goods_weight_kg is not None else (r.kg or 0),
            "status": r.status,
            "is_perishable": bool(r.is_perishable),
            "ice_handling_required": bool(r.ice_handling_required),
            "cooling_type": getattr(r, "cooling_type", None),
            "target_temp_c": getattr(r, "target_temp_c", None),
            "current_temp_c": r.current_temp_c if r.current_temp_c is not None else (4.0 if r.is_perishable else None),
            "loading_status": r.loading_status or "pending",
            "loaded_at": r.loaded_at,
            "loaded_by": r.loaded_by,
            "unloaded_at": r.unloaded_at,
            "unloaded_by": r.unloaded_by,
            "ice_boxes_count": r.ice_boxes_count or 0,
            "seal_number": getattr(r, "seal_number", None),
            "seal_status": getattr(r, "seal_status", "Pending") or "Pending",
            "verified_weight_kg": getattr(r, "verified_weight_kg", None),
            "weight_compliant": getattr(r, "weight_compliant", True),
            "pickup_place": r.pickup_place or "Pickup Point",
            "pickup_lat": r.pickup_lat or 0.0,
            "pickup_lng": r.pickup_lng or 0.0,
            "delivery_date": r.delivery_date,
            "delivery_lat": r.delivery_lat or 0.0,
            "delivery_lng": r.delivery_lng or 0.0,
            "route": r.route,
            "pickup_cargo_image_url": r.pickup_cargo_image_url,
            "delivery_proof_image_url": r.delivery_proof_image_url
        }
        if r.trip_id:
            requests_by_trip.setdefault(r.trip_id, []).append(req_dict)

    # Filter trips if route_search or state_filter is requested
    filtered_trips = all_trips
    if route_search and route_search.strip():
        term = route_search.strip().lower()
        filtered_trips = [
            t for t in filtered_trips
            if (t.from_loc and term in t.from_loc.lower()) or
               (t.to_loc and term in t.to_loc.lower()) or
               (t.state and term in t.state.lower()) or
               (t.owner and term in t.owner.lower()) or
               (t.vehicle and term in t.vehicle.lower()) or
               f"{t.from_loc} {t.to_loc}".lower().find(term) != -1
        ]
    if state_filter and state_filter.strip() and state_filter.lower() != "all":
        st_term = state_filter.strip().lower()
        filtered_trips = [
            t for t in filtered_trips
            if (t.state and st_term in t.state.lower()) or
               (t.from_loc and st_term in t.from_loc.lower())
        ]

    # Format trip summaries
    trip_list = []
    total_perishables = 0
    pending_loadings = 0
    pending_unloadings = 0

    for t in filtered_trips:
        trip_reqs = requests_by_trip.get(t.id, [])
        trip_cps = checkpoints_by_trip.get(t.id, [])

        trip_has_perishables = any(r["is_perishable"] for r in trip_reqs) or bool(getattr(t, "has_perishables", False))
        total_booked_kg = sum(r["goods_weight_kg"] for r in trip_reqs if r["status"] not in ["cancelled", "rejected"])

        for r in trip_reqs:
            if r["is_perishable"]:
                total_perishables += 1
            if r["loading_status"] == "pending" and r["status"] in ["accepted", "scheduled", "in_transit"]:
                pending_loadings += 1
            elif r["loading_status"] == "loaded" and r["status"] in ["in_transit", "accepted"]:
                pending_unloadings += 1

        trip_list.append({
            "id": t.id,
            "state": t.state,
            "from_loc": t.from_loc,
            "to_loc": t.to_loc,
            "date": t.date,
            "vehicle": t.vehicle,
            "owner": t.owner,
            "driver_phone": t.driver_phone,
            "status": t.status,
            "is_live": bool(t.is_live),
            "speed": t.speed,
            "total_kg": t.total_kg or 1000,
            "total_booked_kg": total_booked_kg,
            "available_space_kg": max(0, (t.total_kg or 1000) - total_booked_kg),
            "lat": t.lat,
            "lng": t.lng,
            "pickup": t.pickup,
            "cargo_category": getattr(t, "cargo_category", "general") or "general",
            "dedicated_sub_category": getattr(t, "dedicated_sub_category", None),
            "is_dedicated": bool(getattr(t, "is_dedicated", False)),
            "seal_number": getattr(t, "seal_number", None),
            "seal_status": getattr(t, "seal_status", "Pending") or "Pending",
            "last_weigh_in_kg": getattr(t, "last_weigh_in_kg", None),
            "weight_compliant": getattr(t, "weight_compliant", True),
            "cooling_type": getattr(t, "cooling_type", None),
            "target_temp_c": getattr(t, "target_temp_c", None),
            "has_perishables": trip_has_perishables,
            "ice_handling_supported": bool(t.ice_handling_supported),
            "current_checkpoint": t.current_checkpoint or (trip_cps[0]["checkpoint_name"] if trip_cps else "Departure Hub"),
            "checkpoints": trip_cps,
            "bookings": trip_reqs
        })

    # Flat list of all cargo shipments with full details
    flat_shipments = []
    filtered_trip_ids = {t.id for t in filtered_trips}
    for r in all_requests:
        if r.trip_id and r.trip_id not in filtered_trip_ids:
            continue
        t = next((trip for trip in all_trips if trip.id == r.trip_id), None)
        flat_shipments.append({
            "id": r.id,
            "trip_id": r.trip_id,
            "driver_name": t.owner if t else (r.owner or "Assigned Transporter"),
            "driver_phone": t.driver_phone if t else None,
            "vehicle": t.vehicle if t else "Truck",
            "trip_status": t.status if t else "scheduled",
            "farmer_name": r.farmer_name or "Shipper",
            "farmer_phone": (db.query(models.UserProfile.phone_number).filter(models.UserProfile.user_id == r.user_id).scalar() if r.user_id else None),
            "cargo_type": r.cargo_type or "Perishable Fresh Produce",
            "cargo_category": getattr(r, "cargo_category", "general") or "general",
            "dedicated_sub_category": getattr(r, "dedicated_sub_category", None),
            "is_dedicated": bool(getattr(r, "is_dedicated", False)),
            "goods_weight_kg": r.goods_weight_kg if r.goods_weight_kg is not None else (r.kg or 0),
            "status": r.status,
            "is_perishable": bool(r.is_perishable),
            "ice_handling_required": bool(r.ice_handling_required),
            "cooling_type": getattr(r, "cooling_type", None),
            "target_temp_c": getattr(r, "target_temp_c", None),
            "current_temp_c": r.current_temp_c if r.current_temp_c is not None else (3.8 if r.is_perishable else None),
            "loading_status": r.loading_status or "pending",
            "loaded_at": r.loaded_at,
            "loaded_by": r.loaded_by,
            "unloaded_at": r.unloaded_at,
            "unloaded_by": r.unloaded_by,
            "ice_boxes_count": r.ice_boxes_count or 0,
            "seal_number": getattr(r, "seal_number", None),
            "seal_status": getattr(r, "seal_status", "Pending") or "Pending",
            "verified_weight_kg": getattr(r, "verified_weight_kg", None),
            "weight_compliant": getattr(r, "weight_compliant", True),
            "pickup_place": r.pickup_place or (t.pickup if t else "Pickup Station"),
            "delivery_date": r.delivery_date or (t.date if t else None),
            "route": r.route or (f"{t.from_loc} → {t.to_loc}" if t else "Route In Transit"),
            "pickup_cargo_image_url": r.pickup_cargo_image_url,
            "delivery_proof_image_url": r.delivery_proof_image_url
        })

    return {
        "trips": trip_list,
        "shipments": flat_shipments,
        "corridors": list(corridor_stats.values()),
        "metrics": {
            "total_trips": len(filtered_trips),
            "active_transit_trips": sum(1 for t in filtered_trips if t.status in ["in_transit", "scheduled"] or t.is_live),
            "total_cargo_shipments": len(flat_shipments),
            "perishable_shipments": total_perishables,
            "pending_loadings": pending_loadings,
            "pending_unloadings": pending_unloadings,
            "inspections_today": len(all_checkpoints)
        }
    }


# =========================================================
# 3. TRANSIT STOP CHECKPOINT INSPECTION LOGGING
# =========================================================

@router.post("/checkpoint-check")
def log_checkpoint_inspection(
    payload: schemas.LogisticsCheckpointCreate,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """
    Invoked each time the shipment stops at a highway toll, transit checkpoint, or hub.
    Verifies cargo security seal tag, weighbridge scale compliance, cold-chain temperature, and safety.
    Instantly pushes verified status to both Driver and connected Senders.
    """
    trip = db.query(models.TripModel).filter(models.TripModel.id == payload.trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail=f"Trip ID {payload.trip_id} not found.")

    # RULE 2: Exactly ONE inspection per trip
    if trip.inspection_completed or getattr(trip, "inspection_status", None) == "completed" or (trip.checkpoint_count or 0) >= 1:
        raise HTTPException(
            status_code=400,
            detail="Inspection has already been completed for this trip. Only ONE inspection session is permitted per trip."
        )

    timestamp_str = datetime.now().strftime("%Y-%m-%d %I:%M %p")

    # Weighbridge calculation
    declared_wt = payload.declared_weight_kg
    if declared_wt is None:
        reqs = db.query(models.RequestModel).filter(
            models.RequestModel.trip_id == payload.trip_id,
            models.RequestModel.status.in_(["accepted", "in_transit", "scheduled"])
        ).all()
        declared_wt = sum(float(r.goods_weight_kg or r.kg or 0) for r in reqs)
        if declared_wt == 0:
            declared_wt = float(trip.total_kg or 1000)

    measured_wt = payload.measured_weight_kg
    discrepancy = None
    is_compliant = True
    if measured_wt is not None:
        discrepancy = round(measured_wt - declared_wt, 2)
        tolerance = max(25.0, declared_wt * 0.08)
        is_compliant = abs(discrepancy) <= tolerance
    if payload.weight_compliant is not None:
        is_compliant = payload.weight_compliant

    resolved_seal_num = payload.seal_number or trip.seal_number or f"SEAL-{trip.id}-{int(datetime.now().timestamp()) % 10000}"
    resolved_seal_status = payload.seal_status or ("Verified & Intact" if payload.cargo_seal_intact else "Tampered / Broken")

    checkpoint = models.LogisticsCheckpointModel(
        trip_id=payload.trip_id,
        checkpoint_name=payload.checkpoint_name,
        checkpoint_type=payload.checkpoint_type or "Highway Toll Plaza",
        officer_name=payload.officer_name,
        officer_phone=payload.officer_phone,
        timestamp=timestamp_str,
        cargo_seal_intact=payload.cargo_seal_intact,
        seal_number=resolved_seal_num,
        seal_status=resolved_seal_status,
        measured_weight_kg=measured_wt,
        declared_weight_kg=declared_wt,
        weight_discrepancy_kg=discrepancy,
        weight_compliant=is_compliant,
        safety_parameters_status=payload.safety_parameters_status or "Compliant",
        cooling_status=payload.cooling_status,
        cargo_condition=payload.cargo_condition,
        ice_status=payload.ice_status,
        temp_celsius=payload.temp_celsius,
        notes=payload.notes,
        proof_image_url=payload.proof_image_url,
        action_taken=payload.action_taken
    )
    db.add(checkpoint)

    # Update trip status and active security indicators
    trip.current_checkpoint = payload.checkpoint_name
    trip.checkpoint_count = (trip.checkpoint_count or 0) + 1
    trip.inspection_completed = True
    trip.inspection_status = "completed"
    trip.seal_number = resolved_seal_num
    trip.seal_status = resolved_seal_status
    if measured_wt is not None:
        trip.last_weigh_in_kg = measured_wt
    trip.weight_compliant = is_compliant
    db.commit()
    db.refresh(checkpoint)

    # Multi-party sync: Update associated bookings
    req_updates = {
        "seal_status": resolved_seal_status,
        "weight_compliant": is_compliant
    }
    if resolved_seal_num:
        req_updates["seal_number"] = resolved_seal_num
    if payload.temp_celsius is not None:
        req_updates["current_temp_c"] = payload.temp_celsius

    db.query(models.RequestModel).filter(
        models.RequestModel.trip_id == payload.trip_id
    ).update(req_updates, synchronize_session=False)
    db.commit()

    # Dispatch automated WhatsApp & SMS quality alert to driver and connected shippers
    if background_tasks:
        try:
            d_phone, d_lang = resolve_user_contact_and_lang(db, user_id=trip.user_id, username_or_name=trip.owner)
            if d_phone:
                d_msg = msgs.msg_checkpoint_verified(
                    user_name=trip.owner or "Driver",
                    checkpoint_name=payload.checkpoint_name,
                    officer_name=payload.officer_name,
                    condition=f"{payload.cargo_condition} (Seal: {resolved_seal_status}, Weight: {'Compliant' if is_compliant else 'Overweight'})",
                    temp_c=payload.temp_celsius,
                    lang=d_lang
                )
                background_tasks.add_task(dispatch_automated_alert, d_phone, d_msg)

            connected_reqs = db.query(models.RequestModel).filter(
                models.RequestModel.trip_id == payload.trip_id,
                models.RequestModel.status.in_(["accepted", "in_transit", "scheduled"])
            ).all()
            for cr in connected_reqs:
                s_phone, s_lang = resolve_user_contact_and_lang(db, user_id=cr.user_id, username_or_name=cr.farmer_name)
                if s_phone:
                    s_msg = msgs.msg_checkpoint_verified(
                        user_name=cr.farmer_name or "Shipper",
                        checkpoint_name=payload.checkpoint_name,
                        officer_name=payload.officer_name,
                        condition=f"{payload.cargo_condition} (Seal: {resolved_seal_status}, Weight: {'Compliant' if is_compliant else 'Discrepancy'})",
                        temp_c=payload.temp_celsius,
                        lang=s_lang
                    )
                    background_tasks.add_task(dispatch_automated_alert, s_phone, s_msg)
        except Exception as e:
            print(f"Logistics dispatch notice: {e}")

    return {
        "status": "success",
        "message": f"Checkpoint inspection logged at {payload.checkpoint_name}. Seal: {resolved_seal_status}, Weight: {'Compliant' if is_compliant else 'Flagged'}.",
        "checkpoint_id": checkpoint.id,
        "seal_number": resolved_seal_num,
        "seal_status": resolved_seal_status,
        "weight_compliant": is_compliant,
        "discrepancy_kg": round(float(discrepancy), 2),
        "timestamp": timestamp_str
    }


# =========================================================
# 4. LOADING (PICKUP) & UNLOADING (DROP) ASSISTANCE
# =========================================================

@router.post("/loading-event")
def record_loading_event(
    payload: schemas.LoadingEventRequest,
    db: Session = Depends(get_db)
):
    """
    Supervises cargo handling:
    - 'pickup' (Loading Role): Scales weight verification, security seal application, ice packing.
    - 'drop' (Unloading Role): Unloading verification, seal integrity check before cutting, handover.
    """
    req = db.query(models.RequestModel).filter(models.RequestModel.id == payload.request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail=f"Cargo booking ID {payload.request_id} not found.")

    timestamp_str = datetime.now().strftime("%Y-%m-%d %I:%M %p")

    if payload.loading_type == "pickup":
        req.loading_status = "loaded"
        req.loaded_at = timestamp_str
        req.loaded_by = payload.officer_name
        if payload.verified_weight_kg:
            req.goods_weight_kg = int(payload.verified_weight_kg)
            req.kg = int(payload.verified_weight_kg)
            req.verified_weight_kg = float(payload.verified_weight_kg)
        if payload.seal_number:
            req.seal_number = payload.seal_number
            req.seal_status = payload.seal_status or "Sealed & Intact"
            # Update trip seal as well
            if req.trip_id:
                trip = db.query(models.TripModel).filter(models.TripModel.id == req.trip_id).first()
                if trip:
                    trip.seal_number = payload.seal_number
                    trip.seal_status = payload.seal_status or "Sealed & Intact"
        if payload.ice_boxes_added:
            req.ice_boxes_count = (req.ice_boxes_count or 0) + int(payload.ice_boxes_added)
        if payload.temp_celsius is not None:
            req.current_temp_c = payload.temp_celsius

        msg = f"Cargo verified with security seal {req.seal_number or 'applied'} and loaded by Officer {payload.officer_name}."
    else:
        req.loading_status = "unloaded"
        req.unloaded_at = timestamp_str
        req.unloaded_by = payload.officer_name
        req.seal_status = "Unsealed & Verified at Destination"
        if payload.temp_celsius is not None:
            req.current_temp_c = payload.temp_celsius

        msg = f"Cargo safely unsealed, verified, and handed over to consignee by Officer {payload.officer_name}."

    if payload.notes:
        existing_feedback = req.feedback or ""
        req.feedback = f"{existing_feedback} | Logistics: {payload.notes}".strip(" |")

    db.commit()
    db.refresh(req)

    return {
        "status": "success",
        "message": msg,
        "loading_status": req.loading_status,
        "seal_number": req.seal_number,
        "seal_status": req.seal_status,
        "timestamp": timestamp_str,
        "cargo_id": req.id,
        "current_temp_c": req.current_temp_c
    }


# =========================================================
# 5. PERISHABILITY & COLD-CHAIN ICE HANDLING
# =========================================================

@router.post("/ice-handling")
def record_ice_handling(
    payload: schemas.IceHandlingRequest,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """
    Manages ice replenishment for perishable commodities (Milk, Fish, Berries, Greens):
    Records ice type (Crushed ice, Gel pack, Dry ice), kg added, and re-checks core temperature.
    """
    updated_items = 0
    new_temp = payload.temp_after if payload.temp_after is not None else 2.5

    if payload.request_id:
        req = db.query(models.RequestModel).filter(models.RequestModel.id == payload.request_id).first()
        if req:
            req.current_temp_c = new_temp
            req.is_perishable = True
            req.ice_handling_required = True
            req.ice_boxes_count = (req.ice_boxes_count or 0) + 1
            updated_items = 1

            if background_tasks:
                try:
                    s_phone, s_lang = resolve_user_contact_and_lang(db, user_id=req.user_id, username_or_name=req.farmer_name)
                    if s_phone:
                        ice_msg = msgs.msg_ice_replenished(
                            shipper_name=req.farmer_name or "Shipper",
                            commodity=req.cargo_type or "Perishable Goods",
                            ice_kg=payload.ice_kg_added,
                            ice_type=payload.ice_type,
                            temp_c=new_temp,
                            lang=s_lang
                        )
                        background_tasks.add_task(dispatch_automated_alert, s_phone, ice_msg)
                except Exception as e:
                    print(f"Ice dispatch notice: {e}")

    elif payload.trip_id:
        reqs = db.query(models.RequestModel).filter(
            models.RequestModel.trip_id == payload.trip_id,
            models.RequestModel.is_perishable == True
        ).all()
        for r in reqs:
            r.current_temp_c = new_temp
            r.ice_handling_required = True
            updated_items += 1

            if background_tasks:
                try:
                    s_phone, s_lang = resolve_user_contact_and_lang(db, user_id=r.user_id, username_or_name=r.farmer_name)
                    if s_phone:
                        ice_msg = msgs.msg_ice_replenished(
                            shipper_name=r.farmer_name or "Shipper",
                            commodity=r.cargo_type or "Perishable Goods",
                            ice_kg=payload.ice_kg_added,
                            ice_type=payload.ice_type,
                            temp_c=new_temp,
                            lang=s_lang
                        )
                        background_tasks.add_task(dispatch_automated_alert, s_phone, ice_msg)
                except Exception as e:
                    print(f"Ice dispatch notice: {e}")

    db.commit()

    return {
        "status": "success",
        "message": f"Successfully replenished {payload.ice_kg_added}kg of {payload.ice_type}. Temperature stabilized at {new_temp}°C.",
        "ice_kg_added": payload.ice_kg_added,
        "ice_type": payload.ice_type,
        "core_temperature_celsius": new_temp,
        "safe_preservation_window_hours": 8.0 if payload.ice_type == "Dry Ice" else 5.5,
        "spoilage_risk": "Low (Optimally Chilled)" if new_temp <= 4.0 else "Moderate",
        "updated_shipments_count": updated_items
    }
