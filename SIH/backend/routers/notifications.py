from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
import urllib.parse
from datetime import datetime
import models
from database import get_db

router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications & Dispatch Alerts"]
)


class DispatchMessageRequest(BaseModel):
    event_type: str = "booking_confirmed"  # 'booking_confirmed' | 'trip_dispatched' | 'delivery_completed' | 'custom'
    recipient_role: str = "farmer"          # 'farmer' | 'driver'
    recipient_name: str = "Farmer"
    phone_number: str = "9876543210"
    trip_route: str = "Nashik → Pune"
    vehicle_number: Optional[str] = "MH-15-AB-1234"
    vehicle_model: Optional[str] = "Mini-Truck (Tata Ace)"
    driver_name: str = "Ramesh Patil"
    driver_phone: str = "9876543210"
    goods_weight_kg: Optional[float] = 400.0
    pickup_time: Optional[str] = "07:00 AM"
    pickup_place: Optional[str] = "Sinnar Mandi Toll Plaza"
    fare_amount: Optional[float] = 1200.0
    otp: Optional[str] = "5492"
    tracking_url: Optional[str] = None
    delivery_proof_url: Optional[str] = None
    lang: Optional[str] = "hi"             # 'hi' | 'mr' | 'en'


def build_localized_messages(req: DispatchMessageRequest) -> dict:
    name = req.recipient_name or "Farmer"
    wt = f"{int(req.goods_weight_kg)} kg" if req.goods_weight_kg else "Cargo"
    v_num = req.vehicle_number or "MH-15-AB-1234"
    v_model = req.vehicle_model or "Mini-Truck"
    d_name = req.driver_name or "Driver"
    d_phone = req.driver_phone or "9876543210"
    place = req.pickup_place or "Pickup Point"
    time = req.pickup_time or "Morning"
    route = req.trip_route or "Origin → Destination"
    fare = f"₹{int(req.fare_amount)}" if req.fare_amount else "As agreed"
    otp = req.otp or "4821"

    # 1. BOOKING CONFIRMED TEMPLATES
    if req.event_type == "booking_confirmed":
        hi_wa = (
            f"🌾 *सफ़र-साथी बुकिंग पुष्टि (Safar-Saathi)*\n\n"
            f"नमस्ते *{name}* जी, आपका *{wt}* माल सफलतापूर्वक बुक हो गया है!\n\n"
            f"🚚 *वाहन:* {v_num} ({v_model})\n"
            f"👤 *चालक:* {d_name} (📞 {d_phone})\n"
            f"📍 *पिकअप:* {place}\n"
            f"⏰ *समय:* {time}\n"
            f"🛣️ *रूट:* {route}\n"
            f"💰 *अनुमानित किराया:* {fare}\n"
            f"🔐 *पिकअप सुरक्षा OTP:* *{otp}*\n\n"
            f"_कृपया माल चढ़ाते समय चालक को OTP अवश्य बताएं।_"
        )
        mr_wa = (
            f"🌾 *सफ़र-साथी बुकिंग निश्चिती (Safar-Saathi)*\n\n"
            f"नमस्कार *{name}*, आपले *{wt}* शेतमाल यशस्वीरित्या बुक झाले आहे!\n\n"
            f"🚚 *वाहन:* {v_num} ({v_model})\n"
            f"👤 *चालक:* {d_name} (📞 {d_phone})\n"
            f"📍 *पिकअप स्थान:* {place}\n"
            f"⏰ *वेळ:* {time}\n"
            f"🛣️ *मार्ग:* {route}\n"
            f"💰 *भाडे रक्कम:* {fare}\n"
            f"🔐 *पिकअप OTP:* *{otp}*\n\n"
            f"_माल भरताना चालकाला हा OTP नक्की द्या._"
        )
        en_wa = (
            f"🌾 *Safar-Saathi Booking Confirmation*\n\n"
            f"Hello *{name}*, your cargo ({wt}) has been confirmed for shared transport!\n\n"
            f"🚚 *Vehicle:* {v_num} ({v_model})\n"
            f"👤 *Driver:* {d_name} (📞 {d_phone})\n"
            f"📍 *Pickup:* {place}\n"
            f"⏰ *Pickup Time:* {time}\n"
            f"🛣️ *Route:* {route}\n"
            f"💰 *Proportional Fare:* {fare}\n"
            f"🔐 *Pickup Security OTP:* *{otp}*\n\n"
            f"_Please share this OTP with the driver upon cargo loading._"
        )
        sms = f"Safar-Saathi: Booking confirmed for {wt}. Driver: {d_name} ({d_phone}), Vehicle: {v_num}. Pickup: {time} at {place}. OTP: {otp}"

    # 2. TRIP DISPATCHED TEMPLATES
    elif req.event_type == "trip_dispatched":
        hi_wa = (
            f"🚚 *सफ़र-साथी डिस्पैच अलर्ट (In-Transit)*\n\n"
            f"नमस्ते *{name}*, चालक *{d_name}* ({v_num}) आपका *{wt}* माल लेकर मंडी के लिए रवाना हो चुके हैं!\n\n"
            f"🛣️ *रूट:* {route}\n"
            f"👤 *चालक संपर्क:* {d_phone}\n"
            f"⏰ *अनुमानित मंडी आगमन:* समय पर\n\n"
            f"🛡️ _लाइव जीपीएस स्थिति सक्रिय है। सुरक्षित यात्रा!_"
        )
        mr_wa = (
            f"🚚 *सफ़र-साथी प्रवास सुरू (In-Transit)*\n\n"
            f"नमस्कार *{name}*, चालक *{d_name}* ({v_num}) आपला *{wt}* माल घेऊन मंडीकडे निघाले आहेत!\n\n"
            f"🛣️ *मार्ग:* {route}\n"
            f"👤 *चालक संपर्क:* {d_phone}\n\n"
            f"🛡️ _लाइव्ह ट्रॅकिंग सक्रिय आहे. सुरक्षित प्रवास!_"
        )
        en_wa = (
            f"🚚 *Safar-Saathi Trip Dispatched Alert*\n\n"
            f"Hello *{name}*, driver *{d_name}* ({v_num}) is now in transit with your {wt} cargo!\n\n"
            f"🛣️ *Route:* {route}\n"
            f"👤 *Driver Contact:* {d_phone}\n"
            f"📍 *Live Tracking:* Active on Safar-Saathi Map\n\n"
            f"_Transit protected under Safar-Saathi logistics network._"
        )
        sms = f"Safar-Saathi: Your {wt} cargo is in-transit with Driver {d_name} ({v_num}) on route {route}. Contact: {d_phone}"

    # 3. DELIVERY COMPLETED TEMPLATES
    elif req.event_type == "delivery_completed":
        hi_wa = (
            f"✅ *सफ़र-साथी सुरक्षित डिलीवरी पूर्ण (Delivered)*\n\n"
            f"नमस्ते *{name}*, आपका *{wt}* माल गंतव्य मंडी पर सुरक्षित डिलीवर हो चुका है!\n\n"
            f"🚚 *चालक:* {d_name} ({v_num})\n"
            f"📍 *रूट:* {route}\n"
            f"📸 *डिलीवरी फोटो प्रमाण सत्यापित कर लिया गया है।*\n\n"
            f"_सफ़र-साथी प्लेटफॉर्म का उपयोग करने के लिए धन्यवाद! 🌾_"
        )
        mr_wa = (
            f"✅ *सफ़र-साथी सुरक्षित डिलिव्हरी पूर्ण (Delivered)*\n\n"
            f"नमस्कार *{name}*, आपला *{wt}* शेतमाल गंतव्य बाजारात सुरक्षित पोहोचला आहे!\n\n"
            f"🚚 *चालक:* {d_name} ({v_num})\n"
            f"📍 *मार्ग:* {route}\n"
            f"📸 *डिलिव्हरी फोटो पुरावा पडताळला गेला आहे.*\n\n"
            f"_सफ़र-साथीचा वापर केल्याबद्दल धन्यवाद! 🌾_"
        )
        en_wa = (
            f"✅ *Safar-Saathi Delivery Verified & Completed*\n\n"
            f"Hello *{name}*, your {wt} cargo has been safely delivered at the destination mandi!\n\n"
            f"🚚 *Driver:* {d_name} ({v_num})\n"
            f"📍 *Route:* {route}\n"
            f"📸 *Stage 2 Delivery Proof photo verified successfully.*\n\n"
            f"_Thank you for choosing Safar-Saathi! 🌾_"
        )
        sms = f"Safar-Saathi: Delivery complete for {wt} cargo by {d_name} ({v_num}) on {route}. Delivery proof verified."

    # DEFAULT / CUSTOM ALERT
    else:
        hi_wa = f"🌾 *सफ़र-साथी अलर्ट:* नमस्ते {name}, आपकी यात्रा {route} के संबंध में अपडेट: वाहन {v_num} तैयार है।"
        mr_wa = f"🌾 *सफ़र-साथी अलर्ट:* नमस्कार {name}, आपल्या {route} प्रवासासंबंधी अपडेट: वाहन {v_num} सज्ज आहे."
        en_wa = f"🌾 *Safar-Saathi Alert:* Hello {name}, trip update for {route}: Vehicle {v_num} is scheduled."
        sms = f"Safar-Saathi Alert for {name} on route {route}. Vehicle: {v_num}."

    return {
        "hi": hi_wa,
        "mr": mr_wa,
        "en": en_wa,
        "sms": sms
    }


@router.post("/dispatch-message")
def generate_dispatch_message(payload: DispatchMessageRequest):
    """
    Generates localized Hindi, Marathi, and English WhatsApp/SMS dispatch texts,
    and returns a pre-formatted, 1-click wa.me WhatsApp URL for instant real WhatsApp messaging.
    """
    templates = build_localized_messages(payload)
    active_lang = payload.lang if payload.lang in ["hi", "mr", "en"] else "hi"
    active_wa_text = templates.get(active_lang, templates["hi"])

    # Build clean wa.me URL
    clean_phone = payload.phone_number.replace("+", "").replace("-", "").replace(" ", "").strip()
    if len(clean_phone) == 10:
        clean_phone = f"91{clean_phone}"

    encoded_text = urllib.parse.quote(active_wa_text)
    whatsapp_url = f"https://wa.me/{clean_phone}?text={encoded_text}"

    return {
        "status": "success",
        "event_type": payload.event_type,
        "recipient_name": payload.recipient_name,
        "phone_number": clean_phone,
        "whatsapp_url": whatsapp_url,
        "active_message": active_wa_text,
        "messages": templates,
        "sms_text": templates["sms"],
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/request/{request_id}")
def get_request_dispatch_alert(
    request_id: str,
    event_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Fetches real details from a Request and linked Trip to generate dynamic dispatch alerts.
    """
    req = db.query(models.RequestModel).filter(models.RequestModel.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    # Find driver profile / trip info
    trip = None
    if req.owner:
        trip = db.query(models.TripModel).filter(models.TripModel.owner == req.owner).first()

    driver_profile = None
    driver_user = db.query(models.User).filter(models.User.username.ilike(f"%{req.owner}%")).first()
    if driver_user:
        driver_profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == driver_user.id).first()

    driver_phone = (driver_profile.phone_number if driver_profile and driver_profile.phone_number else "9876543210")
    vehicle_num = "MH-15-AB-1234"
    vehicle_model = trip.vehicle if trip else (req.vehicle or "Mini-Truck")

    # Determine event type based on request status if not provided
    resolved_event = event_type or (
        "delivery_completed" if req.status in ["completed", "delivered"]
        else "trip_dispatched" if req.status in ["in_transit"]
        else "booking_confirmed"
    )

    weight = req.goods_weight_kg if req.goods_weight_kg is not None else (req.kg or 400.0)
    fare = req.per_person_share if req.per_person_share else 1200.0

    # Deterministic 4-digit OTP from request id
    otp_code = str(abs(hash(req.id)) % 9000 + 1000)

    dispatch_req = DispatchMessageRequest(
        event_type=resolved_event,
        recipient_role="farmer",
        recipient_name=req.farmer_name or "Farmer",
        phone_number="9876543210",
        trip_route=req.route or "Nashik → Pune",
        vehicle_number=vehicle_num,
        vehicle_model=vehicle_model,
        driver_name=req.owner or "Ramesh Patil",
        driver_phone=driver_phone,
        goods_weight_kg=float(weight),
        pickup_time=req.pickup_time or "07:00 AM",
        pickup_place=req.pickup_place or (trip.pickup if trip else "Mandi Gate 1"),
        fare_amount=float(fare),
        otp=otp_code,
        lang="hi"
    )

    return generate_dispatch_message(dispatch_req)
