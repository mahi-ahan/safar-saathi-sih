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


def send_local_gateway_whatsapp(phone: str, message: str, media_path: Optional[str] = None) -> bool:
    """
    Sends 100% automated WhatsApp message via the local WhatsApp server microservice (port 3001).
    Works for ALL WhatsApp numbers with zero fees and unlimited volume. Supports image attachments.
    """
    local_port = os.getenv("WHATSAPP_SERVER_PORT", "3001")
    url = f"http://127.0.0.1:{local_port}/send-message"

    target = clean_phone_number(phone)
    if not target:
        return False

    payload = {
        "phone": target,
        "message": message
    }

    if media_path:
        clean_path = str(media_path).strip()
        # Strip domain if full localhost URL was passed e.g. http://localhost:8000/uploads/...
        if "://" in clean_path:
            parts = clean_path.split("://", 1)[1]
            if "/" in parts:
                clean_path = "/" + parts.split("/", 1)[1]
        
        if clean_path.startswith("/") or clean_path.startswith("\\"):
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            abs_path = os.path.normpath(os.path.join(base_dir, clean_path.lstrip("/\\")))
            if os.path.exists(abs_path):
                payload["media_path"] = abs_path
            else:
                alt_path = os.path.normpath(os.path.join(base_dir, "static", clean_path.lstrip("/\\")))
                if os.path.exists(alt_path):
                    payload["media_path"] = alt_path
                else:
                    logger.warning(f"[Dispatcher] Notice: Media file not found on disk at '{abs_path}' or '{alt_path}'")
        elif os.path.exists(clean_path):
            payload["media_path"] = os.path.abspath(clean_path)

    try:
        res = requests.post(url, json=payload, timeout=12)
        data = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
        logger.info(f"[LocalGateway] Sent to {target} | Status: {res.status_code} | Resp: {data}")
        return res.status_code == 200 and data.get("success") is True
    except Exception as e:
        logger.debug(f"[LocalGateway] Local WhatsApp server not reachable: {e}")
        return False


def send_automated_ultramsg_whatsapp(phone: str, message: str) -> bool:
    """
    Sends 100% automated WhatsApp message via UltraMsg gateway to ANY Indian mobile number.
    Requires ULTRAMSG_INSTANCE_ID and ULTRAMSG_TOKEN in .env / environment.
    """
    instance_id = os.getenv("ULTRAMSG_INSTANCE_ID", "").strip()
    token = os.getenv("ULTRAMSG_TOKEN", "").strip()

    if not instance_id or not token:
        return False

    target = clean_phone_number(phone)
    if not target:
        return False

    url = f"https://api.ultramsg.com/{instance_id}/messages/chat"
    payload = {
        "token": token,
        "to": target,
        "body": message,
        "priority": 10
    }

    try:
        res = requests.post(url, json=payload, timeout=10)
        data = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
        logger.info(f"[UltraMsg] Sent to {target} | Status: {res.status_code} | Resp: {data}")
        return res.status_code == 200 and data.get("sent") == "true"
    except Exception as e:
        logger.error(f"[UltraMsg] Failed to send automated WhatsApp to {target}: {e}")
        return False


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
    1. Attempts Unlimited Local WhatsApp Gateway (:3001) with optional media/photo attachment
    2. Attempts UltraMsg Cloud WhatsApp
    3. Attempts Fast2SMS
    """
    if not phone or not message:
        return

    logger.info(f"[Dispatcher] Dispatching automated notification to {phone} (media: {media_path})...")
    
    # 1. Primary: Unlimited Local WhatsApp Gateway
    if send_local_gateway_whatsapp(phone, message, media_path=media_path):
        logger.info(f"[Dispatcher] Automated WhatsApp delivered via Local Gateway to {phone}")
        return

    # 2. Fallback: UltraMsg Cloud WhatsApp
    if send_automated_ultramsg_whatsapp(phone, message):
        logger.info(f"[Dispatcher] Automated WhatsApp delivered via UltraMsg to {phone}")
        return

    # 3. Fallback: Fast2SMS
    sms_text = fallback_sms or message[:160]
    if send_automated_fast2sms(phone, sms_text):
        logger.info(f"[Dispatcher] Automated SMS delivered via Fast2SMS to {phone}")
        return

    logger.info(f"[Dispatcher] Logged notification for {phone}: {message[:80]}...")
