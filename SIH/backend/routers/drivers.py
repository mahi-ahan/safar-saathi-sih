from fastapi import APIRouter, Depends

from auth.dependencies import require_roles


router = APIRouter(
    prefix="/drivers",
    tags=["Drivers"]
)


@router.get("/profile")
def get_driver_profile(
    current_user=Depends(
        require_roles("driver")
    )
):
    return {
        "message": "Driver profile",
        "username": current_user.username,
        "role": current_user.role.value
    }