from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas

from database import get_db
from auth.dependencies import require_roles, get_current_user


router = APIRouter(
    prefix="/api/requests",
    tags=["Requests"]
)


# ==================================================
# CREATE REQUEST
# USER ONLY
# ==================================================

@router.post(
    "",
    response_model=schemas.RequestResponse
)
def create_request(
    req: schemas.RequestCreate,
    db: Session = Depends(get_db),

    current_user=Depends(
        require_roles("user")
    )
):

    db_req = models.RequestModel(
        **req.model_dump(),
        status="pending",
        user_id=current_user.id
    )

    db.add(db_req)
    db.commit()
    db.refresh(db_req)

    return db_req


# ==================================================
# GET MY REQUESTS
# USER ONLY
# ==================================================

@router.get(
    "/my",
    response_model=list[schemas.RequestResponse]
)
def get_my_requests(
    db: Session = Depends(get_db),

    current_user=Depends(
        require_roles("user")
    )
):

    return (
        db.query(models.RequestModel)
        .filter(
            models.RequestModel.user_id
            == current_user.id
        )
        .all()
    )


# ==================================================
# GET INCOMING REQUESTS
# DRIVER ONLY - sees requests for their trips
# ==================================================

@router.get(
    "/incoming",
    response_model=list[schemas.RequestResponse]
)
def get_incoming_requests(
    db: Session = Depends(get_db),

    current_user=Depends(
        require_roles("user", "driver", "admin")
    )
):
    """
    Returns requests sent to the current driver's published
    trips. A driver matches by the owner name stored on the
    request against their profile's full_name.
    """
    from models import UserProfile, TripModel

    profile = (
        db.query(UserProfile)
        .filter(
            UserProfile.user_id
            == current_user.id
        )
        .first()
    )

    if not profile or not profile.full_name:
        return []

    # Find all trips published by this driver
    my_trips = (
        db.query(TripModel)
        .filter(
            TripModel.owner == profile.full_name
        )
        .all()
    )

    if not my_trips:
        return []

    # Collect owners to match
    owner_names = {t.owner for t in my_trips}

    return (
        db.query(models.RequestModel)
        .filter(
            models.RequestModel.owner.in_(owner_names)
        )
        .all()
    )


# ==================================================
# CANCEL MY REQUEST
# USER ONLY
# ==================================================

@router.delete("/{request_id}")
def cancel_request(
    request_id: str,

    db: Session = Depends(get_db),

    current_user=Depends(
        require_roles("user")
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

    if request.status != "pending":

        raise HTTPException(
            status_code=400,
            detail="Only pending requests can be cancelled"
        )

    request.status = "cancelled"

    db.commit()

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

    return (
        db.query(models.RequestModel)
        .all()
    )


# ==================================================
# UPDATE REQUEST STATUS
# DRIVER + ADMIN
# ==================================================

@router.put("/{request_id}/status")
def update_request_status(
    request_id: str,
    status: str,

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
        "completed",
        "cancelled"
    ]

    if status not in allowed_statuses:

        raise HTTPException(
            status_code=400,
            detail="Invalid request status"
        )

    request.status = status

    db.commit()
    db.refresh(request)

    return request