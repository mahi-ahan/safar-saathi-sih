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
    role_val = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    return {
        "message": "User profile",
        "username": current_user.username,
        "role": role_val
    }