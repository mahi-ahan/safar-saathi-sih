from fastapi import Depends, HTTPException, status

from auth.security import (
    get_current_user,
    get_optional_current_user,
)

__all__ = ["require_roles", "get_current_user", "get_optional_current_user"]

# --------------------------------------------------
# AUTHORIZATION
# --------------------------------------------------

def require_roles(*required_roles):

    def role_checker(
        current_user=Depends(get_current_user)
    ):

        user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        if user_role not in required_roles:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission"
            )

        return current_user

    return role_checker
