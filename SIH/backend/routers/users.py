from fastapi import APIRouter, Depends

from auth.dependencies import require_roles


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/profile")
def get_profile(
    current_user=Depends(
        require_roles("user")
    )
):
    return {
        "message": "User profile",
        "username": current_user.username,
        "role": current_user.role.value
    }