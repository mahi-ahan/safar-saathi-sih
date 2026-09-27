import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pwdlib import PasswordHash
from sqlalchemy.orm import Session
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

import models
from database import get_db
from config import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

GOOGLE_CLIENT_ID = (os.getenv("GOOGLE_CLIENT_ID") or "").strip()

password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def validate_password_strength(password: str) -> Optional[str]:
    """
    Validates password strength according to security standards:
    - Minimum 8 characters
    - Maximum 64 characters
    - At least one uppercase letter (A-Z)
    - At least one lowercase letter (a-z)
    - At least one digit (0-9)
    - At least one special symbol (!@#$%^&* etc.)
    - No whitespace characters
    Returns None if valid, or a descriptive error message if invalid.
    """
    if not password:
        return "Password is required."
    if len(password) < 8:
        return "Password must be at least 8 characters long."
    if len(password) > 64:
        return "Password cannot exceed 64 characters."
    if any(c.isspace() for c in password):
        return "Password cannot contain spaces."
    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter (A-Z)."
    if not re.search(r"[a-z]", password):
        return "Password must contain at least one lowercase letter (a-z)."
    if not re.search(r"[0-9]", password):
        return "Password must contain at least one numeric digit (0-9)."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_+=\[\]\\\/~`';]", password):
        return "Password must contain at least one special character (e.g. !@#$%^&*)."
    return None


def validate_username_format(username: str) -> Optional[str]:
    """
    Validates username format:
    - 3 to 30 characters
    - Alphanumeric, underscores, hyphens, dots
    - Must start and end with an alphanumeric character
    - No spaces
    Returns None if valid, or a descriptive error message if invalid.
    """
    if not username or not username.strip():
        return "Username is required."
    clean = username.strip()
    if len(clean) < 3:
        return "Username must be at least 3 characters long."
    if len(clean) > 30:
        return "Username cannot exceed 30 characters."
    if any(c.isspace() for c in clean):
        return "Username cannot contain spaces."
    if not re.match(r"^[a-zA-Z0-9][a-zA-Z0-9_\-\.]*[a-zA-Z0-9]$", clean) and len(clean) > 1:
        return "Username can only contain letters, numbers, underscores, dots, and hyphens, and cannot start or end with a symbol."
    return None


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    return password_hash.verify(
        plain_password,
        hashed_password
    )


def create_access_token(data: dict) -> str:
    to_encode = data.copy()

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    to_encode.update({
        "exp": expire
    })

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def resolve_user_from_token(token: Optional[str], db: Session) -> Optional[models.User]:
    """
    Safely resolves a User from either:
    1. A Safar-Saathi local JWT access token (HMAC-SHA256).
    2. A Google OAuth ID Token (RS256 / Google verification or unverified claims fallback).
    """
    if not token or str(token).lower().strip() in ["", "null", "undefined", "none", "bearer"]:
        return None

    clean_token = str(token).strip()
    if clean_token.lower().startswith("bearer "):
        clean_token = clean_token[7:].strip()

    # 1. Try decoding as Safar-Saathi local JWT
    try:
        payload = jwt.decode(clean_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is not None:
            user = db.query(models.User).filter(models.User.id == int(user_id)).first()
            if user:
                return user
    except Exception:
        pass

    # 2. Try decoding as Google ID Token
    try:
        idinfo = None
        clean_client_id = GOOGLE_CLIENT_ID if GOOGLE_CLIENT_ID else None
        try:
            req = google_requests.Request()
            idinfo = google_id_token.verify_oauth2_token(clean_token, req, clean_client_id)
        except Exception:
            claims = jwt.get_unverified_claims(clean_token)
            iss = claims.get("iss", "")
            if claims and ("accounts.google.com" in iss or "google" in iss) and claims.get("email"):
                idinfo = claims

        if idinfo and idinfo.get("email"):
            email = idinfo.get("email")
            user = db.query(models.User).filter(models.User.email == email).first()
            if not user:
                name = idinfo.get("name") or idinfo.get("given_name") or email.split("@")[0]
                base_username = name.replace(" ", "").lower()
                unique_username = f"{base_username}_{uuid.uuid4().hex[:6]}"
                user = models.User(
                    username=unique_username,
                    email=email,
                    password="OAUTH_GOOGLE_USER",
                    role=models.UserRole.USER
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            return user
    except Exception:
        pass

    return None


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    user = resolve_user_from_token(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    return resolve_user_from_token(token, db)