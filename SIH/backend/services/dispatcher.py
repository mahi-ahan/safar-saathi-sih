import os
import requests
import logging
from typing import Optional

logger = logging.getLogger("dispatcher")

def clean_phone_number(phone: str) -> str:
    """Sanitizes phone number to standard Indian format."""
    if not phone:
        return ""
    digits = "".join(filter(str.isdigit, str(phone)))
    if len(digits) == 10:
        return f"91{digits}"
    if len(digits) == 12 and digits.startswith("91"):
        return digits
    if len(digits) > 10:
        return f"91{digits[-10:]}"
    return digits


def resolve_user_contact_and_lang(
    db,
    user_id: Optional[int] = None,
    username_or_name: Optional[str] = None,
    default_lang: str = "hi"
) -> tuple[str, str]:
    """
    Bulletproof multi-layered resolver for user/driver WhatsApp phone number and preferred language.
    1. Looks up UserProfile by user_id
    2. Cleans name string (removes vehicle labels/parens like 'Ramesh (Mini-Truck)')
    3. Looks up TripModel FIRST to get the driver's exact trip phone or linked user profile phone
    4. Looks up UserProfile/User by clean name or username (bidirectional search)
    5. Falls back to DEFAULT_DRIVER_PHONE / test phone so messages never drop.
    """
    import models
    phone = None
    lang = default_lang or "hi"

    # 1. Search by user_id
    if user_id:
        p = db.query(models.UserProfile).filter(models.UserProfile.user_id == user_id).first()
        if p:
            if p.phone_number:
                phone = p.phone_number
            if p.preferred_lang:
                lang = p.preferred_lang

    clean_name = ""
    if username_or_name:
        # Strip parens, vehicle labels, route tags e.g. "Ramesh Patil (Mini-Truck)" -> "Ramesh Patil"
        clean_name = str(username_or_name).split("(")[0].split("-")[0].strip()

    # 2. Check TripModel FIRST for linked user_id or driver_phone (Specific trip driver takes priority)
    if not phone and (username_or_name or clean_name):
        search_terms = [t for t in [username_or_name, clean_name] if t]
        for term in search_terms:
            trip = db.query(models.TripModel).filter(
                (models.TripModel.owner == term) |
                (models.TripModel.owner.ilike(f"%{term}%"))
            ).order_by(models.TripModel.id.desc()).first()
            if trip:
                if getattr(trip, "user_id", None):
                    driver_p = db.query(models.UserProfile).filter(models.UserProfile.user_id == trip.user_id).first()
                    if driver_p and driver_p.phone_number:
                        phone = driver_p.phone_number
                        if driver_p.preferred_lang:
                            lang = driver_p.preferred_lang
                if not phone and getattr(trip, "driver_phone", None):
                    phone = trip.driver_phone
                if phone:
                    break

    # 3. Search UserProfile / User by name or clean_name
    if not phone and (username_or_name or clean_name):
        query_terms = [t for t in [username_or_name, clean_name] if t]
        for term in query_terms:
            p = (
                db.query(models.UserProfile)
                .join(models.User, models.UserProfile.user_id == models.User.id)
                .filter(
                    (models.UserProfile.full_name == term) |
                    (models.User.username == term) |
                    (models.User.email == term) |
                    (models.User.username.ilike(f"%{term}%")) |
                    (models.UserProfile.full_name.ilike(f"%{term}%"))
                )
                .first()
            )
            if p and p.phone_number:
                phone = p.phone_number
                if p.preferred_lang:
                    lang = p.preferred_lang
                break

    # 4. Search User table directly by username or email
    if not phone and (username_or_name or clean_name):
        search_terms = [t for t in [username_or_name, clean_name] if t]
        for term in search_terms:
            u = db.query(models.User).filter(
                (models.User.username == term) |
                (models.User.email == term) |
                (models.User.username.ilike(f"%{term}%"))
            ).first()
            if u and u.profile and u.profile.phone_number:
                phone = u.profile.phone_number
                if u.profile.preferred_lang:
                    lang = u.profile.preferred_lang
                break

    # 5. Safe fallback to active WhatsApp test phone or ENV override
    if not phone:
        phone = os.getenv("DEFAULT_DRIVER_PHONE", "9608959215")

    return phone, lang


def send_automated_fast2sms(phone: str, message: str) -> bool:
    """
    Sends 100% automated SMS to ANY Indian phone number via Fast2SMS free gateway.
    Requires FAST2SMS_API_KEY in .env / environment.
    """
    api_key = os.getenv("FAST2SMS_API_KEY", "").strip()
    if not api_key:
        return False

    target = clean_phone_number(phone)
    if target.startswith("91") and len(target) == 12:
        target = target[2:]  # Fast2SMS expects 10-digit Indian number

    url = "https://www.fast2sms.com/dev/bulkV2"
    headers = {
        "authorization": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "route": "q",
        "message": message,
        "language": "unicode",
        "flash": 0,
        "numbers": target
    }

    try:
        res = requests.post(url, headers=headers, json=payload, timeout=10)
        data = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
        logger.info(f"[Fast2SMS] Sent to {target} | Status: {res.status_code} | Resp: {data}")
        return res.status_code == 200 and data.get("return") is True
    except Exception as e:
        logger.error(f"[Fast2SMS] Failed to send automated SMS to {target}: {e}")
        return False


def dispatch_automated_alert(phone: str, message: str, fallback_sms: Optional[str] = None, media_path: Optional[str] = None):
    """
    Unified background dispatcher:
    Attempts Fast2SMS or logs notification.
    """
    if not phone or not message:
        return

    logger.info(f"[Dispatcher] Dispatching automated notification to {phone} (media: {media_path})...")
    
    # 1. Fast2SMS
    sms_text = fallback_sms or message[:160]
    if send_automated_fast2sms(phone, sms_text):
        logger.info(f"[Dispatcher] Automated SMS delivered via Fast2SMS to {phone}")
        return

    logger.info(f"[Dispatcher] Logged notification for {phone}: {message[:80]}...")

