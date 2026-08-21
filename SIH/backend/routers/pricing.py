from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import os
import json
import re
import logging
from datetime import datetime
from typing import Optional

import models
import schemas
from database import get_db

from dotenv import load_dotenv
load_dotenv()

logger = logging.getLogger("pricing_engine")

router = APIRouter(
    prefix="/api",
    tags=["Pricing & AI Validation"]
)


def get_gemini_api_key() -> Optional[str]:
    """Retrieves GEMINI_API_KEY securely from environment variables."""
    load_dotenv(override=True)
    key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("VITE_GEMINI_API_KEY")
    if not key or key.strip() == "" or "your_api_key" in key.lower():
        return None
    return key.strip()


def sanitize_json_response(raw_text: str) -> dict:
    """Extracts and parses JSON from LLM response text."""
    clean = raw_text.strip()
    # Remove markdown codeblocks if present
    clean = re.sub(r"^```(?:json)?\s*", "", clean, flags=re.MULTILINE)
    clean = re.sub(r"\s*```$", "", clean, flags=re.MULTILINE)
    clean = clean.strip()
    
    # Try finding the outer JSON object { ... }
    match = re.search(r"\{.*\}", clean, re.DOTALL)
    if match:
        clean = match.group(0)
        
    return json.loads(clean)


def calculate_algorithmic_fallback(
    distance_km: float,
    vehicle_model: str,
    goods_weight_kg: Optional[float] = None
) -> dict:
    """
    Computes a reliable, market-tested baseline logistics fare for Indian transport
    when neither Gemini API nor historical database records are reachable.
    """
    dist = max(5.0, float(distance_km or 10.0))
    vehicle = (vehicle_model or "Mini Truck").lower()
    
    # Vehicle specifications: (efficiency km/L diesel, base price per km, fixed loading/driver allowance)
    if "bike" in vehicle or "scooter" in vehicle:
        efficiency = 40.0
        rate_per_km = 8.0
        base_allowance = 150.0
    elif "auto" in vehicle or "rickshaw" in vehicle:
        efficiency = 25.0
        rate_per_km = 12.0
        base_allowance = 300.0
    elif "pickup" in vehicle or "supro" in vehicle or "bolero" in vehicle:
        efficiency = 13.0
        rate_per_km = 18.0
        base_allowance = 800.0
    elif "tata ace" in vehicle or "mini truck" in vehicle or "van" in vehicle:
        efficiency = 15.0
        rate_per_km = 16.0
        base_allowance = 700.0
    elif "tempo" in vehicle:
        efficiency = 10.0
        rate_per_km = 22.0
        base_allowance = 1000.0
    elif "truck" in vehicle:
        efficiency = 4.5
        rate_per_km = 38.0
        base_allowance = 2500.0
    else:
        efficiency = 12.0
        rate_per_km = 18.0
        base_allowance = 800.0

    diesel_rate_inr = 92.0
    fuel_cost = round((dist / efficiency) * diesel_rate_inr)
    toll_estimate = round(dist * 1.6) if dist > 40 else 0
    driver_allowance = round(base_allowance + (dist * 2.0))
    maintenance = round(dist * 2.5)

    subtotal = fuel_cost + toll_estimate + driver_allowance + maintenance
    fair_min = round(subtotal * 0.90)
    fair_max = round(subtotal * 1.30)
    recommended = round(subtotal * 1.05)

    return {
        "fairMinPrice": float(fair_min),
        "fairMaxPrice": float(fair_max),
        "recommendedPrice": float(recommended),
        "breakdown": {
            "fuelCost": float(fuel_cost),
            "tollEstimate": float(toll_estimate),
            "driverAllowance": float(driver_allowance),
            "vehicleMaintenance": float(maintenance),
            "marketRatePerKm": float(rate_per_km),
            "notes": f"Estimated via rule-based logistics engine (Diesel @ ₹{diesel_rate_inr}/L, {efficiency} km/L efficiency)."
        }
    }


def call_gemini_pricing_officer(
    api_key: str,
    origin: str,
    destination: str,
    distance_km: float,
    vehicle_model: str,
    goods_weight_kg: Optional[float] = None
) -> dict:
    """
    Primary Engine: Calls Google Gemini API using Google Gen AI SDK or fallback REST invocation
    to act as an expert Indian logistics pricing officer.
    """
    prompt = f"""You are an expert Indian logistics, transport, and freight pricing officer for Safar Saathi (a smart rural & intercity cargo sharing platform in India).
Calculate the realistic, fair market rate for this vehicle load based on real Indian road logistics economics (current diesel prices ₹88-95/L, NHAI/State highway tolls, vehicle fuel efficiency, driver allowance, and cargo market rates).

Trip Parameters:
- Origin: {origin}
- Destination: {destination}
- Road Distance: {distance_km} km
- Vehicle Model/Type: {vehicle_model} (e.g., Tata Ace, Mahindra Supro, Pickup, Mini Truck, 10-Wheeler Truck)
- Cargo Weight: {goods_weight_kg if goods_weight_kg else 'Full/Partial Load'} kg

Return ONLY a valid JSON object (no markdown, no backticks, no comments) with this exact schema:
{{
  "fairMinPrice": <number in INR, minimum viable operator price>,
  "fairMaxPrice": <number in INR, upper competitive market ceiling>,
  "recommendedPrice": <number in INR, recommended competitive price>,
  "breakdown": {{
    "fuelCost": <number in INR>,
    "tollEstimate": <number in INR>,
    "driverAllowance": <number in INR>,
    "vehicleMaintenance": <number in INR>,
    "marketRatePerKm": <number in INR>,
    "notes": "<1-2 sentence explanation of mileage, toll calculation, and rate basis in India>"
  }}
}}"""

    # 1. Attempt using official google-genai SDK
    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
                response_mime_type="application/json",
            )
        )
        if response and response.text:
            parsed = sanitize_json_response(response.text)
            if "fairMinPrice" in parsed and "fairMaxPrice" in parsed:
                return parsed
    except Exception as sdk_err:
        logger.warning(f"Google Gen AI SDK invocation warning: {sdk_err}. Trying direct REST fallback...")

    # 2. Resilient Direct REST API Fallback
    import requests
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
    }
    
    res = requests.post(url, json=payload, timeout=12)
    if res.status_code != 200:
        # Also try gemini-1.5-flash if 2.5-flash has specific quota constraints
        url_v15 = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        res = requests.post(url_v15, json=payload, timeout=12)
        if res.status_code != 200:
            raise Exception(f"Gemini API returned HTTP {res.status_code}: {res.text}")

    res_data = res.json()
    candidates = res_data.get("candidates", [])
    if not candidates:
        raise Exception("No candidates returned from Gemini API")

    text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    parsed = sanitize_json_response(text)
    if "fairMinPrice" not in parsed or "fairMaxPrice" not in parsed:
        raise Exception("Invalid JSON structure returned by Gemini")
    return parsed


@router.post("/calculate-fare", response_model=schemas.CalculateFareResponse)
@router.post("/pricing/calculate-fare", response_model=schemas.CalculateFareResponse)
def calculate_fare(
    req: schemas.CalculateFareRequest,
    db: Session = Depends(get_db)
):
    """
    AI-First Dynamic Pricing & Market Validation Route:
    1. Primary Engine: ALWAYS attempts Google Gemini AI first using GEMINI_API_KEY.
    2. Caches successful AI results into PostgreSQL database.
    3. Fallback Engine: IF and ONLY IF the AI call fails, queries PostgreSQL historical cache.
    4. Evaluates whether driver's custom price is exorbitant and attaches warning guidance.
    """
    api_key = get_gemini_api_key()
    origin_clean = req.origin.strip() if req.origin else "Origin"
    dest_clean = req.destination.strip() if req.destination else "Destination"
    vehicle_clean = req.vehicle_model.strip() if req.vehicle_model else "Mini Truck"
    dist = max(1.0, float(req.distance_km or 10.0))
    weight = float(req.goods_weight_kg) if req.goods_weight_kg is not None else None

    result = None
    source = "gemini_ai"

    # =========================================================
    # STEP 1: PRIMARY ENGINE - GOOGLE GEMINI AI
    # =========================================================
    if api_key:
        try:
            logger.info(f"Initiating AI Pricing Officer for {origin_clean} -> {dest_clean} ({dist} km, {vehicle_clean})")
            ai_data = call_gemini_pricing_officer(
                api_key=api_key,
                origin=origin_clean,
                destination=dest_clean,
                distance_km=dist,
                vehicle_model=vehicle_clean,
                goods_weight_kg=weight
            )
            
            fair_min = float(ai_data.get("fairMinPrice", 0.0))
            fair_max = float(ai_data.get("fairMaxPrice", 0.0))
            recommended = float(ai_data.get("recommendedPrice", (fair_min + fair_max) / 2))
            breakdown = ai_data.get("breakdown", {})

            if fair_min > 0 and fair_max >= fair_min:
                result = {
                    "fairMinPrice": fair_min,
                    "fairMaxPrice": fair_max,
                    "recommendedPrice": recommended,
                    "breakdown": breakdown
                }
                source = "gemini_ai"

                # Persist / Cache successful AI calculation into PostgreSQL
                try:
                    cache_entry = models.RoutePricingCache(
                        origin=origin_clean,
                        destination=dest_clean,
                        distance_km=dist,
                        vehicle_model=vehicle_clean,
                        fair_min_price=fair_min,
                        fair_max_price=fair_max,
                        breakdown_json=json.dumps(breakdown),
                        created_at=datetime.utcnow().isoformat()
                    )
                    db.add(cache_entry)
                    db.commit()
                except Exception as db_save_err:
                    logger.warning(f"Notice: Failed to cache pricing record in PostgreSQL: {db_save_err}")
                    db.rollback()

        except Exception as ai_err:
            logger.error(f"Gemini AI calculation failed or timed out: {ai_err}. Triggering Fallback Engine...")
            result = None

    # =========================================================
    # STEP 2: FALLBACK ENGINE (PostgreSQL Historical Cache)
    # Triggered ONLY IF Gemini AI failed / unavailable
    # =========================================================
    if result is None:
        try:
            # Look up historical cache in PostgreSQL matching origin & destination
            cached_record = db.query(models.RoutePricingCache).filter(
                models.RoutePricingCache.origin.ilike(f"%{origin_clean[:8]}%"),
                models.RoutePricingCache.destination.ilike(f"%{dest_clean[:8]}%")
            ).order_by(models.RoutePricingCache.id.desc()).first()

            # If not exact match, search within ±30% distance range for similar vehicle
            if not cached_record:
                cached_record = db.query(models.RoutePricingCache).filter(
                    models.RoutePricingCache.vehicle_model.ilike(f"%{vehicle_clean[:6]}%"),
                    models.RoutePricingCache.distance_km.between(dist * 0.7, dist * 1.3)
                ).order_by(models.RoutePricingCache.id.desc()).first()

            if cached_record:
                logger.info(f"Retrieved historical pricing from PostgreSQL cache (Record ID: {cached_record.id})")
                cached_breakdown = {}
                if cached_record.breakdown_json:
                    try:
                        cached_breakdown = json.loads(cached_record.breakdown_json)
                    except Exception:
                        pass

                # Scale proportionally if distance differs
                scale_ratio = (dist / cached_record.distance_km) if cached_record.distance_km > 0 else 1.0
                fair_min = round(cached_record.fair_min_price * scale_ratio)
                fair_max = round(cached_record.fair_max_price * scale_ratio)
                recommended = round(((fair_min + fair_max) / 2))

                result = {
                    "fairMinPrice": float(fair_min),
                    "fairMaxPrice": float(fair_max),
                    "recommendedPrice": float(recommended),
                    "breakdown": cached_breakdown or {
                        "notes": f"Historical route price retrieved from Safar Saathi database (approx. {cached_record.distance_km} km record)."
                    }
                }
                source = "database_cache_fallback"
        except Exception as db_query_err:
            logger.warning(f"Database historical search error: {db_query_err}")

    # =========================================================
    # STEP 3: SECONDARY FALLBACK (Algorithmic Logistics Engine)
    # =========================================================
    if result is None:
        logger.info(f"Generating rule-based fallback logistics estimation for {dist} km...")
        result = calculate_algorithmic_fallback(
            distance_km=dist,
            vehicle_model=vehicle_clean,
            goods_weight_kg=weight
        )
        source = "rule_based_fallback"

    # =========================================================
    # STEP 4: PRICE GUARDRAIL & EXORBITANCE VALIDATION
    # =========================================================
    fair_min = result["fairMinPrice"]
    fair_max = result["fairMaxPrice"]
    recommended = result["recommendedPrice"]
    breakdown = result["breakdown"]

    is_exorbitant = False
    warning_msg = None

    if req.custom_price is not None and req.custom_price > 0:
        custom_p = float(req.custom_price)
        # Check if driver's price is >25% higher than fairMaxPrice OR exceeds by more than ₹5,000
        if custom_p > (fair_max * 1.25) or (custom_p > fair_max + 5000):
            is_exorbitant = True
            diff_pct = round(((custom_p - fair_max) / fair_max) * 100)
            warning_msg = (
                f"Warning: Your entered price of ₹{custom_p:,.0f} is {diff_pct}% higher than the competitive "
                f"market rate (₹{fair_min:,.0f} - ₹{fair_max:,.0f}). Exorbitant rates may result in zero booking requests."
            )

    return schemas.CalculateFareResponse(
        fairMinPrice=fair_min,
        fairMaxPrice=fair_max,
        recommendedPrice=recommended,
        source=source,
        breakdown=breakdown,
        isExorbitant=is_exorbitant,
        warningMessage=warning_msg
    )


# =========================================================
# USER PARTIAL LOAD (PTL) COST DISTRIBUTION & FULL-PRICE RULE
# =========================================================

def generate_multilingual_ptl_voice_announcements(
    is_shared: bool,
    user_price: float,
    total_vehicle_price: float,
    savings: float,
    segment_km: float,
    weight_kg: float
) -> dict:
    """Generates crystal-clear spoken announcements for all supported Indian languages."""
    p_str = f"{user_price:,.0f}"
    tot_str = f"{total_vehicle_price:,.0f}"
    sav_str = f"{savings:,.0f}"
    dist_str = f"{segment_km:.1f}"

    if not is_shared:
        return {
            "en": f"Solo booking rate: Full vehicle load price is ₹{tot_str}. This price will automatically decrease as more partners join your route.",
            "hi": f"एकल बुकिंग दर: कुल वाहन लोड किराया ₹{tot_str} है। आपके मार्ग पर अन्य सह-साझेदार जुड़ने पर यह किराया अपने आप कम हो जाएगा।",
            "mr": f"एकल बुकिंग दर: एकूण वाहन भाडे ₹{tot_str} आहे. इतर भागीदार जोडल्यास हे भाडे आपोआप कमी होईल.",
            "bn": f"একক বুকিং রেট: মোট গাড়ির লোড ভাড়া ₹{tot_str}। আপনার রুটে অন্যান্য অংশীদার যোগ দিলে এই ভাড়া স্বয়ংক্রিয়ভাবে হ্রাস পাবে।",
            "te": f"సింగిల్ బుకింగ్ ధర: మొత్తం వాహన చార్జీ ₹{tot_str}. ఇతర భాగస్వాములు చేరినప్పుడు ఈ ధర స్వయంచాలకంగా తగ్గుతుంది.",
            "ta": f"தனிநபர் முன்பதிவு கட்டணம்: மொத்த வாகன கட்டணம் ₹{tot_str}. பிற கூட்டாளர்கள் இணையும்போது இக்கட்டணம் தானாகவே குறையும்.",
            "kn": f"ಏಕವ್ಯಕ್ತಿ ಬುಕಿಂಗ್ ದರ: ಒಟ್ಟು ವಾಹನ ಬಾಡಿಗೆ ₹{tot_str}. ಇತರ ಪಾಲುದಾರರು ಸೇರಿದಂತೆ ಈ ಬಾಡಿಗೆ ಕಡಿಮೆಯಾಗುತ್ತದೆ.",
            "ml": f"സിംഗിൾ ബുക്കിംഗ് നിരക്ക്: ആകെ വാടക ₹{tot_str}. കൂടുതൽ പങ്കാളികൾ ചേരുമ്പോൾ ഈ നിരക്ക് കുറയും.",
            "or": f"ଏକକ ବୁକିଂ ଦର: ମୋଟ ଯାନବାହନ ଭଡ଼ା ₹{tot_str}. ଅନ୍ୟ ସହ-ଭାଗୀଦାର ଯୋଡ଼ିହେଲେ ଭଡ଼ା କମିଯିବ.",
            "pa": f"ਇਕੱਲੀ ਬੁਕਿੰਗ ਦਰ: ਕੁੱਲ ਗੱਡੀ ਦਾ ਭਾੜਾ ₹{tot_str} ਹੈ। ਹੋਰ ਭਾਈਵਾਲ ਜੁੜਨ 'ਤੇ ਇਹ ਭਾੜਾ ਆਪਣੇ ਆਪ ਘੱਟ ਜਾਵੇਗਾ।",
            "gu": f"સિંગલ બુકિંગ દર: કુલ વાહન લોડ ભાડું ₹{tot_str} છે. અન્ય ભાગીદારો જોડાતા આ ભાડું આપોઆપ ઘટશે.",
            "ur": f"سولو بکنگ ریٹ: گاڑی کا کل کرایہ ₹{tot_str} ہے۔ مزید پارٹنرز شامل ہونے پر یہ کرایہ خود بخود کم ہو جائے گا۔",
            "bho": f"एकल बुकिंग दर: कुल गाड़ी लोड किराया ₹{tot_str} बा। रउआ रूट पर अउरी पार्टनर जुड़ला पर ई किराया अपने आप कम हो जाई।"
        }
    else:
        return {
            "en": f"Shared partial load fare confirmed: Your distributed share is ₹{p_str}, saving you ₹{sav_str} based on your {dist_str} kilometer travel distance.",
            "hi": f"साझा आंशिक लोड किराया पुष्ट: आपकी {dist_str} किमी यात्रा दूरी के आधार पर आपका हिस्सा ₹{p_str} है, जिससे आपकी ₹{sav_str} की बचत हुई है।",
            "mr": f"सामायिक आंशिक लोड भाडे निश्चित: तुमच्या {dist_str} किमी प्रवासाच्या आधारे तुमचा वाटा ₹{p_str} आहे, ज्यामुळे तुमची ₹{sav_str} बचत झाली आहे.",
            "bn": f"শেয়ার্ড আংশিক লোড ভাড়া নিশ্চিত: আপনার {dist_str} কিমি ভ্রমণ দূরত্বের ভিত্তিতে আপনার ভাগ ₹{p_str}, যার ফলে আপনার ₹{sav_str} সাশ্রয় হয়েছে।",
            "te": f"షేర్డ్ పాక్షిక లోడ్ ఛార్జీ నిర్ధారించబడింది: మీ {dist_str} కిమీ ప్రయాణ దూరం ఆధారంగా మీ వాటా ₹{p_str}, మీకు ₹{sav_str} ఆదా అవుతుంది.",
            "ta": f"பகிர்வு பகுதி சுமை கட்டணம் உறுதி செய்யப்பட்டது: உங்கள் {dist_str} கிமீ பயண தூரத்தின் அடிப்படையில் உங்கள் பங்கு ₹{p_str}, உங்களுக்கு ₹{sav_str} மிச்சமாகும்.",
            "kn": f"ಹಂಚಿಕೆಯ ಭಾಗಶಃ ಲೋಡ್ ಬಾಡಿಗೆ ದೃಢಪಟ್ಟಿದೆ: ನಿಮ್ಮ {dist_str} ಕಿಮೀ ಪ್ರಯಾಣ ದೂರದ ಆಧಾರದ ಮೇಲೆ ನಿಮ್ಮ ಪಾಲು ₹{p_str}, ನಿಮಗೆ ₹{sav_str} ಉಳಿತಾಯವಾಗಿದೆ.",
            "ml": f"പങ്കുവെച്ച ഭാഗിക ലോഡ് വാടക ഉറപ്പിച്ചു: നിങ്ങളുടെ {dist_str} കിമീ യാത്രാ ദൂരത്തെ അടിസ്ഥാനമാക്കി നിങ്ങളുടെ വിഹിതം ₹{p_str} ആണ്, ₹{sav_str} ലാഭിക്കാം.",
            "or": f"ଅଂଶୀଦାର ଆଂଶିକ ଲୋଡ୍ ଭଡ଼ା ନିଶ୍ଚିତ: ଆପଣଙ୍କ {dist_str} କିମି ଯାତ୍ରା ଆଧାରରେ ଆପଣଙ୍କ ଅଂଶ ₹{p_str}, ଯାହା ଆପଣଙ୍କୁ ₹{sav_str} ସଞ୍ଚୟ କରାଇଛି.",
            "pa": f"ਸਾਂਝਾ ਅੰਸ਼ਕ ਲੋਡ ਭਾੜਾ ਪੱਕਾ: ਤੁਹਾਡੇ {dist_str} ਕਿਲੋਮੀਟਰ ਸਫ਼ਰ ਦੇ ਆਧਾਰ 'ਤੇ ਤੁਹਾਡਾ ਹਿੱਸਾ ₹{p_str} ਹੈ, ਜਿਸ ਨਾਲ ਤੁਹਾਡੀ ₹{sav_str} ਦੀ ਬਚਤ ਹੋਈ ਹੈ।",
            "gu": f"શેર્ડ આંશિક લોડ ભાડું કન્ફર્મ: તમારા {dist_str} કિમી પ્રવાસના આધારે તમારો હિસ્સો ₹{p_str} છે, જેનાથી ₹{sav_str} ની બચત થઈ છે.",
            "ur": f"مشترکہ لوڈ کرایہ کی تصدیق: آپ کے {dist_str} کلومیٹر سفر کے فاصلے کی بنیاد پر آپ کا حصہ ₹{p_str} ہے، جس سے آپ کے ₹{sav_str} کی بچت ہوئی۔",
            "bho": f"साझा आंशिक लोड किराया तय: रउआ {dist_str} किमी दूरी के हिसाब से रउआ हिस्सा ₹{p_str} बा, जेसे ₹{sav_str} के बचत भईल बा।"
        }


def call_gemini_ptl_distribution(
    api_key: str,
    req: schemas.CalculatePtlFareRequest
) -> dict:
    """
    Calls Google Gemini AI (@google/genai) to act as a mathematical freight auditor
    and distribute vehicle cost proportionally based on each sender's specific sub-route distance and weight.
    """
    user_dist = max(1.0, float(req.user_segment_distance_km or 10.0))
    user_wt = max(1.0, float(req.user_weight_kg or 10.0))
    user_workload = round(user_wt * user_dist, 2)

    sharers_summary = [
        f"- SENDER (Current User): Route '{req.user_pickup_loc}' to '{req.user_delivery_loc}' | Sub-route Distance: {user_dist} km | Weight: {user_wt} kg | Workload: {user_workload} kg·km"
    ]
    
    total_workload = user_workload
    for idx, s in enumerate(req.other_sharers, 1):
        s_dist = max(1.0, float(s.segment_distance_km or 10.0))
        s_wt = max(1.0, float(s.goods_weight_kg or 10.0))
        s_workload = round(s_wt * s_dist, 2)
        total_workload += s_workload
        sharers_summary.append(
            f"- SENDER {idx} ({s.farmer_name}): Route '{s.pickup_loc}' to '{s.delivery_loc}' | Sub-route Distance: {s_dist} km | Weight: {s_wt} kg | Workload: {s_workload} kg·km"
        )

    prompt = f"""You are a master mathematical logistics cost accountant and PTL (Partial Truckload) freight auditor for Safar Saathi in India.
Perform a strict, fair, and proportional cost allocation for a shared vehicle trip.

Vehicle Charter Load Fare: ₹{req.total_driver_amount}
Vehicle Capacity: {req.total_vehicle_capacity_kg} kg
Total Driver Route Distance: {req.driver_full_distance_km} km

All Active Load Sharers & Their Exact Pickup-to-Destination Sub-Routes:
{chr(10).join(sharers_summary)}

Total Cumulative Workload: {total_workload:.2f} kg·km

Rules:
1. Distribute the total vehicle price (₹{req.total_driver_amount}) strictly based on each sender's sub-route Ton-Km / Kg-Km workload proportion:
   User Share = (User Workload / Total Cumulative Workload) * Total Vehicle Fare.
2. Ensure mathematical integrity: sum of shares must not exceed total vehicle fare.
3. Apply a minimum safety floor of ₹50.

Return ONLY a valid JSON object matching this schema:
{{
  "userFinalPrice": <number in INR, rounded to nearest integer>,
  "workloadSharePct": <number, percentage of total workload>,
  "savingsComparedToSolo": <number in INR, total vehicle price minus user final price>,
  "breakdown": {{
    "userSegmentKm": {user_dist},
    "userWeightKg": {user_wt},
    "userWorkloadKgKm": {user_workload},
    "totalWorkloadKgKm": {total_workload},
    "effectiveRatePerKgKm": <number in INR>,
    "explanation": "<brief 1-2 sentence mathematical explanation of the sub-route distance based distribution>"
  }}
}}"""

    # 1. Attempt using official google-genai SDK
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
                response_mime_type="application/json"
            )
        )
        if response and response.text:
            parsed = sanitize_json_response(response.text)
            if "userFinalPrice" in parsed:
                return parsed
    except Exception as sdk_err:
        logger.warning(f"Google Gen AI SDK PTL invocation notice: {sdk_err}. Trying direct REST fallback...")

    # 2. Resilient Direct REST API Fallback
    import requests
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"}
    }
    res = requests.post(url, json=payload, timeout=12)
    if res.status_code == 200:
        res_data = res.json()
        candidates = res_data.get("candidates", [])
        if candidates:
            text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            return sanitize_json_response(text)

    raise Exception("Gemini PTL calculation returned non-200 status")


@router.post("/calculate-ptl-fare", response_model=schemas.CalculatePtlFareResponse)
def calculate_ptl_fare(
    req: schemas.CalculatePtlFareRequest,
    db: Session = Depends(get_db)
):
    """
    AI-First User/Sender Partial Load (PTL) Cost Distribution & Full-Price Rule:
    1. Unshared Full-Price Rule: If NO other cargo sharers are present, the single user must pay the full driver base price.
    2. Shared Distribution Rule: If multiple cargo sharers ARE present, Gemini AI proportionally distributes costs strictly based on each sender's specific sub-route distance (pickup to destination) and weight workload.
    3. Caches calculations in PostgreSQL `ptl_cost_distribution_cache`.
    4. Database Historical Fallback: Triggered ONLY IF Gemini AI fails/rate-limited.
    5. Returns dynamic multilingual voice announcement text for all website languages.
    """
    user_dist = max(1.0, float(req.user_segment_distance_km or 10.0))
    user_wt = max(1.0, float(req.user_weight_kg or 10.0))
    tot_price = max(100.0, float(req.total_driver_amount or 3000.0))
    other_sharers = req.other_sharers or []
    is_shared = len(other_sharers) > 0
    sharers_count = len(other_sharers) + 1

    # =========================================================
    # RULE 1: THE FULL-PRICE RULE (UNSHARED SOLO BOOKING)
    # =========================================================
    if not is_shared:
        user_final_price = tot_price
        savings = 0.0
        breakdown = {
            "userSegmentKm": user_dist,
            "userWeightKg": user_wt,
            "totalVehiclePrice": tot_price,
            "status": "Solo Booking: 100% capacity reserved for single sender.",
            "notes": "Full vehicle base price applies until other co-sharing partners join along the route."
        }
        voice_texts = generate_multilingual_ptl_voice_announcements(
            is_shared=False,
            user_price=user_final_price,
            total_vehicle_price=tot_price,
            savings=savings,
            segment_km=user_dist,
            weight_kg=user_wt
        )
        return schemas.CalculatePtlFareResponse(
            is_shared=False,
            sharers_count=1,
            user_final_price=user_final_price,
            total_vehicle_price=tot_price,
            pricing_rule_applied="UNSHARED_FULL_PRICE",
            source="unshared_full_price_rule",
            breakdown=breakdown,
            voice_announcement_text=voice_texts,
            warning=None
        )

    # =========================================================
    # RULE 2: THE DISTRIBUTION RULE (SHARED PTL - GEMINI AI PRIMARY)
    # =========================================================
    api_key = get_gemini_api_key()
    ai_result = None
    source = "gemini_ai"

    if api_key:
        try:
            logger.info(f"Invoking Gemini AI PTL Distribution Officer for {sharers_count} sharers...")
            ai_data = call_gemini_ptl_distribution(api_key=api_key, req=req)
            if "userFinalPrice" in ai_data:
                u_price = float(ai_data["userFinalPrice"])
                ai_result = {
                    "userFinalPrice": u_price,
                    "savingsComparedToSolo": float(ai_data.get("savingsComparedToSolo", max(0.0, tot_price - u_price))),
                    "breakdown": ai_data.get("breakdown", {})
                }
                source = "gemini_ai"

                # Cache in PostgreSQL database
                try:
                    cache_entry = models.PtlCostDistributionCache(
                        trip_id=req.trip_id,
                        is_shared=True,
                        sharers_count=sharers_count,
                        user_pickup_loc=req.user_pickup_loc,
                        user_delivery_loc=req.user_delivery_loc,
                        user_segment_distance_km=user_dist,
                        user_weight_kg=user_wt,
                        total_vehicle_price=tot_price,
                        user_final_price=u_price,
                        distribution_details_json=json.dumps(ai_result["breakdown"]),
                        created_at=datetime.utcnow().isoformat()
                    )
                    db.add(cache_entry)
                    db.commit()
                except Exception as db_err:
                    logger.warning(f"PostgreSQL PTL cache notice: {db_err}")
                    db.rollback()

        except Exception as ai_err:
            logger.error(f"Gemini AI PTL calculation failed: {ai_err}. Triggering Fallback Engine...")
            ai_result = None

    # =========================================================
    # STEP 3: DATABASE HISTORICAL CACHE FALLBACK
    # Triggered ONLY IF Gemini AI failed or unavailable
    # =========================================================
    if ai_result is None:
        try:
            cached = db.query(models.PtlCostDistributionCache).filter(
                models.PtlCostDistributionCache.trip_id == req.trip_id,
                models.PtlCostDistributionCache.is_shared == True,
                models.PtlCostDistributionCache.sharers_count == sharers_count
            ).order_by(models.PtlCostDistributionCache.id.desc()).first()

            if cached:
                logger.info(f"Retrieved PTL distribution from PostgreSQL cache (ID: {cached.id})")
                ai_result = {
                    "userFinalPrice": cached.user_final_price,
                    "savingsComparedToSolo": max(0.0, tot_price - cached.user_final_price),
                    "breakdown": json.loads(cached.distribution_details_json) if cached.distribution_details_json else {}
                }
                source = "database_cache_fallback"
        except Exception as db_q_err:
            logger.warning(f"DB fallback query error: {db_q_err}")

    # =========================================================
    # STEP 4: SECONDARY FALLBACK (Local Ton-Km Mathematical Engine)
    # =========================================================
    if ai_result is None:
        logger.info("Computing exact Ton-Km proportional sub-route mathematical distribution...")
        user_workload = user_wt * user_dist
        other_workload = sum(max(1.0, float(s.goods_weight_kg or 10.0)) * max(1.0, float(s.segment_distance_km or 10.0)) for s in other_sharers)
        total_workload = max(1.0, user_workload + other_workload)
        workload_ratio = user_workload / total_workload
        u_price = round(max(50.0, workload_ratio * tot_price))
        savings = max(0.0, tot_price - u_price)

        ai_result = {
            "userFinalPrice": float(u_price),
            "savingsComparedToSolo": float(savings),
            "breakdown": {
                "userSegmentKm": user_dist,
                "userWeightKg": user_wt,
                "userWorkloadKgKm": round(user_workload, 2),
                "totalWorkloadKgKm": round(total_workload, 2),
                "workloadSharePct": round(workload_ratio * 100, 1),
                "explanation": f"Calculated strictly on user's {user_dist} km sub-route representing {round(workload_ratio * 100, 1)}% of total vehicle cargo distance workload."
            }
        }
        source = "local_ptl_engine"

    final_user_price = ai_result["userFinalPrice"]
    final_savings = ai_result.get("savingsComparedToSolo", max(0.0, tot_price - final_user_price))
    breakdown_data = ai_result.get("breakdown", {})

    voice_texts = generate_multilingual_ptl_voice_announcements(
        is_shared=True,
        user_price=final_user_price,
        total_vehicle_price=tot_price,
        savings=final_savings,
        segment_km=user_dist,
        weight_kg=user_wt
    )

    return schemas.CalculatePtlFareResponse(
        is_shared=True,
        sharers_count=sharers_count,
        user_final_price=final_user_price,
        total_vehicle_price=tot_price,
        pricing_rule_applied="AI_PTL_SEGMENT_DISTRIBUTED",
        source=source,
        breakdown=breakdown_data,
        voice_announcement_text=voice_texts,
        warning=None
    )
