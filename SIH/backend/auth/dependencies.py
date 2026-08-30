from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User
from auth.security import (
    SECRET_KEY,
    ALGORITHM,
    oauth2_scheme,
    oauth2_scheme_optional,
    get_current_user,
    get_optional_current_user,
    resolve_user_from_token
)


# --------------------------------------------------
# AUTHORIZATION
# --------------------------------------------------

def require_roles(*required_roles):

    def role_checker(
        current_user=Depends(get_current_user)
    ):

        if current_user.role.value not in required_roles:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission"
            )

        return current_user

    return role_checker
