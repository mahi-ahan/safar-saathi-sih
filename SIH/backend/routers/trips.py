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
    db: Session = Depends(get_db),
):
    """
    Returns all published trips. Public endpoint so anyone
    can browse available vehicles without logging in.
    """
    query = db.query(models.TripModel)

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