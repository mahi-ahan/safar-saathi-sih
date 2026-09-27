from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
from auth.dependencies import require_roles
from database import get_db

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)


# ==================================================
# ADMIN DASHBOARD
# ==================================================

@router.get("/dashboard")
def admin_dashboard(
    current_user=Depends(
        require_roles("admin")
    )
):
    role_val = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    return {
        "message": "Welcome to Admin Dashboard",
        "username": current_user.username,
        "role": role_val
    }


# ==================================================
# GET ALL USERS
# ==================================================

@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("admin")
    )
):

    users = db.query(models.User).all()

    return users


# ==================================================
# GET ALL DRIVERS
# ==================================================

@router.get("/drivers")
def get_all_drivers(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("admin")
    )
):

    drivers = (
        db.query(models.User)
        .filter(
            models.User.role == models.UserRole.DRIVER
        )
        .all()
    )

    return drivers


# ==================================================
# GET ALL TRIPS
# ==================================================

@router.get("/trips")
def get_all_trips(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("admin")
    )
):

    trips = db.query(
        models.TripModel
    ).all()

    return trips


# ==================================================
# DELETE TRIP
# ==================================================

@router.delete("/trips/{trip_id}")
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("admin")
    )
):

    trip = (
        db.query(models.TripModel)
        .filter(
            models.TripModel.id == trip_id
        )
        .first()
    )

    if not trip:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    db.delete(trip)
    db.commit()

    return {
        "message": "Trip deleted successfully"
    }


# ==================================================
# GET ALL REQUESTS
# ==================================================

@router.get("/requests")
def get_all_requests(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("admin")
    )
):

    requests = db.query(
        models.RequestModel
    ).all()

    return requests
