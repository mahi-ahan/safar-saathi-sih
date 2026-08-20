from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas

from database import get_db
from auth.dependencies import require_roles


router = APIRouter(
    prefix="/api/trips",
    tags=["Trips"]
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
    Returns all published trips. Excludes completed trips by default.
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

    return query.all()


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

    return query.all()


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
    return trip


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

    return db_trip


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
    return trip


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
    Updates trip status (e.g. 'in_transit', 'completed', 'scheduled').
    """
    trip = db.query(models.TripModel).filter(models.TripModel.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    trip.status = status
    if status == "in_transit":
        trip.is_live = True
    elif status in ("completed", "cancelled"):
        trip.is_live = False

    db.commit()
    db.refresh(trip)
    return trip