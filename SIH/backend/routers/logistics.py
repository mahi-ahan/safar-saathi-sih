import os
import uuid
import shutil
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func

import models
import schemas
from database import get_db
from auth.security import (
    create_access_token,
    hash_password,
    verify_password,
    validate_password_strength,
    validate_username_format
)
from auth.dependencies import get_optional_current_user
from routers.trips import calculate_haversine_km, distance_to_segment_km
from services.dispatcher import dispatch_automated_alert, resolve_user_contact_and_lang
import services.messages as msgs
import re

router = APIRouter(
    prefix="/api/logistics",
    tags=["Logistics Operations"]
)

# Upload directory setup
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
LOGISTICS_UPLOAD_DIR = os.path.join(UPLOAD_DIR, "logistics")
os.makedirs(LOGISTICS_UPLOAD_DIR, exist_ok=True)

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

# -------------------------------------------------------------
# INDIAN GEOGRAPHIC REFERENCE & CORRIDOR RESOLUTION
# Prevents state/country leakage and matches start, end, or midway corridor
# -------------------------------------------------------------
INDIAN_STATES_AND_COUNTRIES = [
    'india', 'in', 'bharat',
    'uttar pradesh', 'uttarakhand', 'madhya pradesh', 'himachal pradesh',
    'andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh',
    'goa', 'gujarat', 'haryana', 'jharkhand', 'karnataka', 'kerala',
    'maharashtra', 'manipur', 'meghalaya', 'mizoram', 'nagaland', 'odisha', 'orissa',
    'punjab', 'rajasthan', 'sikkim', 'tamil nadu', 'telangana', 'tripura',
    'west bengal', 'chandigarh', 'puducherry', 'jammu', 'kashmir', 'ladakh',
    'up', 'mp', 'ap', 'uk', 'wb', 'tn', 'od', 'dl', 'mh', 'gj', 'rj', 'pb', 'hr', 'br', 'jh'
]

GENERIC_STATION_STOPWORDS = {
    'hub', 'checkpoint', 'toll', 'plaza', 'highway', 'mandi', 'corridor', 'station',
    'gate', 'road', 'transit', 'nh', 'the', 'and', 'center', 'centre', 'municipal',
    'corporation', 'district', 'city', 'junction', 'terminal', 'logistics', 'field',
    'office', 'officer', 'post', 'posting', 'halt', 'point', 'zone', 'sector', 'division',
    'ground', 'new', 'old', 'greater', 'east', 'west', 'north', 'south', 'central'
}

INDIAN_CITIES_COORDS = {
    'lucknow': (26.8467, 80.9462),
    'kanpur': (26.4499, 80.3319),
    'delhi': (28.6139, 77.2090),
    'noida': (28.5355, 77.3910),
    'ghaziabad': (28.6692, 77.4538),
    'agra': (27.1767, 78.0081),
    'varanasi': (25.3176, 82.9739),
    'prayagraj': (25.4358, 81.8463),
    'allahabad': (25.4358, 81.8463),
    'gorakhpur': (26.7606, 83.3732),
    'ayodhya': (26.7922, 82.1998),
    'bareilly': (28.3670, 79.4304),
    'aligarh': (27.8974, 78.0880),
    'moradabad': (28.8386, 78.7733),
    'meerut': (28.9845, 77.7064),
    'jhansi': (25.4484, 78.5685),
    'mathura': (27.4924, 77.6737),
    # Odisha
    'bhubaneswar': (20.2961, 85.8245),
    'cuttack': (20.4625, 85.8828),
    'puri': (19.8135, 85.8312),
    'konark': (19.9074, 86.1420),
    'pipili': (20.1165, 85.8312),
    'khordha': (20.1812, 85.6179),
    'trisulia': (20.4285, 85.8456),
    'madhupatna': (20.4485, 85.8920),
    'rasulgarh': (20.3015, 85.8562),
    'jajpur': (20.8492, 86.3364),
    'berhampur': (19.3149, 84.7941),
    'rourkela': (22.2604, 84.8536),
    'sambalpur': (21.4669, 83.9812),
    'balasore': (21.4934, 86.9135),
    'bhadrak': (21.0544, 86.4954),
    # Bihar
    'patna': (25.5941, 85.1376),
    'barauni': (25.4740, 85.9750),
    'begusarai': (25.4182, 86.1272),
    'mokama': (25.3958, 85.9221),
    'gaya': (24.7914, 85.0002),
    'bhagalpur': (25.2425, 86.9842),
    'muzaffarpur': (26.1209, 85.3647),
    # Maharashtra
    'mumbai': (19.0760, 72.8777),
    'pune': (18.5204, 73.8567),
    'vashi': (19.0771, 72.9986),
    'kamshet': (18.7562, 73.5591),
    'lonavala': (18.7557, 73.4091),
    'thane': (19.2183, 72.9781),
    'nagpur': (21.1458, 79.0882),
    'nashik': (19.9975, 73.7898),
    # Jharkhand
    'jamshedpur': (22.8046, 86.2029),
    'ranchi': (23.3441, 85.3096),
    # West Bengal
    'kolkata': (22.5726, 88.3639),
    'howrah': (22.5958, 88.2636),
    # Other Metros & Major Logistics Nodes
    'bengaluru': (12.9716, 77.5946),
    'bangalore': (12.9716, 77.5946),
    'hyderabad': (17.3850, 78.4867),
    'chennai': (13.0827, 80.2707),
    'ahmedabad': (23.0225, 72.5714),
    'surat': (21.1702, 72.8311),
    'vadodara': (22.3072, 73.1812),
    'rajkot': (22.3039, 70.8022),
    'jaipur': (26.9124, 75.7873),
    'jodhpur': (26.2389, 73.0243),
    'chandigarh': (30.7333, 76.7794),
    'ludhiana': (30.9010, 75.8573),
    'amritsar': (31.6340, 74.8723),
    'jalandhar': (31.3260, 75.5762),
    'khanna': (30.7046, 76.2163),
    'bhopal': (23.2599, 77.4126),
    'indore': (22.7196, 75.8577),
    'gwalior': (26.2183, 78.1828),
    'raipur': (21.2514, 81.6296),
    'dehradun': (30.3165, 78.0322),
    'haridwar': (29.9457, 78.1642)
}

CITY_TO_STATE = {
    'patna': 'bihar', 'barauni': 'bihar', 'begusarai': 'bihar', 'gaya': 'bihar',
    'bhagalpur': 'bihar', 'muzaffarpur': 'bihar', 'mokama': 'bihar',
    'bhubaneswar': 'odisha', 'cuttack': 'odisha', 'puri': 'odisha', 'pipili': 'odisha',
    'khordha': 'odisha', 'berhampur': 'odisha', 'rourkela': 'odisha', 'sambalpur': 'odisha',
    'balasore': 'odisha', 'bhadrak': 'odisha', 'konark': 'odisha', 'jajpur': 'odisha',
    'trisulia': 'odisha', 'madhupatna': 'odisha', 'rasulgarh': 'odisha',
    'pune': 'maharashtra', 'mumbai': 'maharashtra', 'nagpur': 'maharashtra', 'nashik': 'maharashtra',
    'vashi': 'maharashtra', 'kamshet': 'maharashtra', 'lonavala': 'maharashtra', 'thane': 'maharashtra',
    'delhi': 'delhi', 'noida': 'uttar pradesh', 'ghaziabad': 'uttar pradesh',
    'lucknow': 'uttar pradesh', 'kanpur': 'uttar pradesh', 'agra': 'uttar pradesh', 'varanasi': 'uttar pradesh',
    'jamshedpur': 'jharkhand', 'ranchi': 'jharkhand',
    'kolkata': 'west bengal', 'howrah': 'west bengal',
    'bengaluru': 'karnataka', 'bangalore': 'karnataka',
    'hyderabad': 'telangana',
    'chennai': 'tamil nadu',
    'ahmedabad': 'gujarat', 'surat': 'gujarat',
    'jaipur': 'rajasthan', 'jodhpur': 'rajasthan',
    'chandigarh': 'chandigarh', 'ludhiana': 'punjab', 'amritsar': 'punjab'
}

CANONICAL_INDIAN_STATES = {
    'andhra pradesh': 'andhra pradesh', 'arunachal pradesh': 'arunachal pradesh',
    'assam': 'assam', 'bihar': 'bihar', 'chhattisgarh': 'chhattisgarh',
    'goa': 'goa', 'gujarat': 'gujarat', 'haryana': 'haryana',
    'himachal pradesh': 'himachal pradesh', 'jharkhand': 'jharkhand',
    'karnataka': 'karnataka', 'kerala': 'kerala', 'madhya pradesh': 'madhya pradesh',
    'maharashtra': 'maharashtra', 'manipur': 'manipur', 'meghalaya': 'meghalaya',
    'mizoram': 'mizoram', 'nagaland': 'nagaland', 'odisha': 'odisha', 'orissa': 'odisha',
    'punjab': 'punjab', 'rajasthan': 'rajasthan', 'sikkim': 'sikkim',
    'tamil nadu': 'tamil nadu', 'telangana': 'telangana', 'tripura': 'tripura',
    'uttar pradesh': 'uttar pradesh', 'uttarakhand': 'uttarakhand', 'west bengal': 'west bengal',
    'delhi': 'delhi', 'chandigarh': 'chandigarh', 'puducherry': 'puducherry',
    'jammu': 'jammu and kashmir', 'kashmir': 'jammu and kashmir', 'ladakh': 'ladakh'
}


def extract_state_from_location(text: Optional[str]) -> Optional[str]:
    """
    Extracts canonical state from location string or city tokens.
    """
    if not text:
        return None
    lower = text.lower()
    for st_key in sorted(CANONICAL_INDIAN_STATES.keys(), key=len, reverse=True):
        if re.search(rf'\b{re.escape(st_key)}\b', lower):
            return CANONICAL_INDIAN_STATES[st_key]
    tokens = extract_city_tokens(text)
    for tok in tokens:
        if tok in CITY_TO_STATE:
            return CITY_TO_STATE[tok]
    return None


def extract_city_tokens(raw_text: str) -> set[str]:
    """
    Extracts distinct locality / city tokens from place names, stripping state and country names.
    Ensures broad terms like 'Uttar Pradesh' or 'India' never match cross-city trips.
    """
    if not raw_text:
        return set()
    cleaned = raw_text.lower()
    for state in sorted(INDIAN_STATES_AND_COUNTRIES, key=len, reverse=True):
        cleaned = re.sub(rf'\b{re.escape(state)}\b', ' ', cleaned)
    cleaned = re.sub(r'[\(\)\[\]\{\},;/|\n\-_]+', ' ', cleaned)
    words = [w for w in cleaned.split() if len(w) >= 3 and w not in GENERIC_STATION_STOPWORDS]
    return set(words)


def resolve_coords(text: str, lat: Optional[float] = None, lng: Optional[float] = None) -> Optional[tuple[float, float]]:
    """
    Resolves (lat, lng).
    Prioritizes known city coordinates from declared text so browser GPS / device coordinates
    do not misplace trips in other states or distant cities.
    """
    tokens = extract_city_tokens(text)
    for tok in tokens:
        if tok in INDIAN_CITIES_COORDS:
            return INDIAN_CITIES_COORDS[tok]
    if lat is not None and lng is not None and (lat != 0.0 or lng != 0.0):
        return (float(lat), float(lng))
    return None


def extract_delivery_destination(route: Optional[str], trip_to_loc: Optional[str] = None) -> str:
    """
    Extracts explicit destination city / terminal from request route (e.g. 'Howrah → Bhubaneswar')
    or linked trip's to_loc.
    """
    if route:
        if "→" in route:
            parts = route.split("→")
            if len(parts) >= 2 and parts[1].strip():
                return parts[1].strip()
        if "->" in route:
            parts = route.split("->")
            if len(parts) >= 2 and parts[1].strip():
                return parts[1].strip()
    if trip_to_loc and str(trip_to_loc).strip():
        return str(trip_to_loc).strip()
    return route or "Destination Delivery Terminal"


def calculate_trip_distance_km(trip) -> float:

    """
    Computes precise route distance in km for a trip using its geocoded pickup & dest coordinates,
    falling back to known city locations or the trip.distance_km field.
    """
    o_lat = trip.pickup_lat if (getattr(trip, "pickup_lat", None) and trip.pickup_lat != 0.0) else (getattr(trip, "lat", 0.0) or 0.0)
    o_lng = trip.pickup_lng if (getattr(trip, "pickup_lng", None) and trip.pickup_lng != 0.0) else (getattr(trip, "lng", 0.0) or 0.0)
    d_lat = getattr(trip, "dest_lat", 0.0) or 0.0
    d_lng = getattr(trip, "dest_lng", 0.0) or 0.0

    o_co = resolve_coords(getattr(trip, "from_loc", ""), o_lat, o_lng)
    d_co = resolve_coords(getattr(trip, "to_loc", ""), d_lat, d_lng)

    if o_co and d_co:
        dist = calculate_haversine_km(o_co[0], o_co[1], d_co[0], d_co[1])
        if dist > 0.0:
            return round(dist, 1)

    return round(float(getattr(trip, "distance_km", 150.0) or 150.0), 1)


def get_max_inspections_for_distance(distance_km: float) -> int:
    """
    Determines maximum inspection checkpoints allowed along a trip corridor.
    Ensures at least 2 checkpoints for standard inter-city trips so multiple downstream
    logistics officers have inspection opportunities, scaling with route length.
    """
    if distance_km <= 50.0:
        return 1
    elif distance_km <= 150.0:
        return 2
    elif distance_km <= 350.0:
        return 3
    elif distance_km <= 700.0:
        return 4
    else:
        return min(8, max(5, int(round(distance_km / 200.0))))


KNOWN_ROUTE_CHECKPOINTS = {
    # Patna <-> Barauni (NH-31)
    ('patna', 'barauni'): [
        {"checkpoint_name": "Mokama Highway Toll & Weighbridge Checkpoint", "lat": 25.3958, "lng": 85.9221, "checkpoint_type": "Highway Toll Plaza"},
        {"checkpoint_name": "Barauni Industrial Entry Checkpoint", "lat": 25.4740, "lng": 85.9750, "checkpoint_type": "Logistics Scale Hub"}
    ],
    ('barauni', 'patna'): [
        {"checkpoint_name": "Mokama Highway Toll & Weighbridge Checkpoint", "lat": 25.3958, "lng": 85.9221, "checkpoint_type": "Highway Toll Plaza"},
        {"checkpoint_name": "Didarganj Toll Plaza (Patna Bypass)", "lat": 25.5680, "lng": 85.2400, "checkpoint_type": "State Border Toll"}
    ],
    # Bhubaneswar <-> Jamshedpur (NH-16 / NH-20)
    ('bhubaneswar', 'jamshedpur'): [
        {"checkpoint_name": "Cuttack NH-16 Transit Checkpoint", "lat": 20.4625, "lng": 85.8828, "checkpoint_type": "Logistics Hub Checkpoint"},
        {"checkpoint_name": "Jajpur Panikoili Toll Plaza", "lat": 20.8492, "lng": 86.3364, "checkpoint_type": "Highway Toll Plaza"},
        {"checkpoint_name": "Balasore Sergarh Toll Gate", "lat": 21.4934, "lng": 86.9135, "checkpoint_type": "Interstate Inspection Post"}
    ],
    ('jamshedpur', 'bhubaneswar'): [
        {"checkpoint_name": "Balasore Sergarh Toll Gate", "lat": 21.4934, "lng": 86.9135, "checkpoint_type": "Interstate Inspection Post"},
        {"checkpoint_name": "Jajpur Panikoili Toll Plaza", "lat": 20.8492, "lng": 86.3364, "checkpoint_type": "Highway Toll Plaza"},
        {"checkpoint_name": "Cuttack NH-16 Transit Checkpoint", "lat": 20.4625, "lng": 85.8828, "checkpoint_type": "Logistics Hub Checkpoint"}
    ],
    # Pune <-> Mumbai (Mumbai-Pune Expressway)
    ('pune', 'mumbai'): [
        {"checkpoint_name": "Kamshet Expressway Toll Plaza", "lat": 18.7562, "lng": 73.5591, "checkpoint_type": "Expressway Weighbridge"},
        {"checkpoint_name": "Vashi Toll & Scale Checkpoint", "lat": 19.0771, "lng": 72.9986, "checkpoint_type": "Highway Toll Plaza"}
    ],
    ('mumbai', 'pune'): [
        {"checkpoint_name": "Vashi Toll & Scale Checkpoint", "lat": 19.0771, "lng": 72.9986, "checkpoint_type": "Highway Toll Plaza"},
        {"checkpoint_name": "Kamshet Expressway Toll Plaza", "lat": 18.7562, "lng": 73.5591, "checkpoint_type": "Expressway Weighbridge"}
    ],
    # Bhubaneswar <-> Puri (NH-316)
    ('bhubaneswar', 'puri'): [
        {"checkpoint_name": "Pipili Toll Plaza & Cold-Chain Checkpoint", "lat": 20.1165, "lng": 85.8312, "checkpoint_type": "Highway Toll Plaza"},
        {"checkpoint_name": "Puri Malatipatpur Inspection Gate", "lat": 19.8350, "lng": 85.8450, "checkpoint_type": "Mandi Transit Post"}
    ],
    ('puri', 'bhubaneswar'): [
        {"checkpoint_name": "Pipili Toll Plaza & Cold-Chain Checkpoint", "lat": 20.1165, "lng": 85.8312, "checkpoint_type": "Highway Toll Plaza"},
        {"checkpoint_name": "Uttara Chhak Logistics Station", "lat": 20.2150, "lng": 85.8500, "checkpoint_type": "City Entry Checkpoint"}
    ],
    # Bhubaneswar <-> Cuttack
    ('bhubaneswar', 'cuttack'): [
        {"checkpoint_name": "Trisulia Toll & Weighbridge Checkpoint", "lat": 20.4285, "lng": 85.8456, "checkpoint_type": "Highway Toll Plaza"},
        {"checkpoint_name": "Madhupatna Logistics Transit Hub", "lat": 20.4485, "lng": 85.8920, "checkpoint_type": "Inspection Station"}
    ],
    ('cuttack', 'bhubaneswar'): [
        {"checkpoint_name": "Trisulia Toll & Weighbridge Checkpoint", "lat": 20.4285, "lng": 85.8456, "checkpoint_type": "Highway Toll Plaza"},
        {"checkpoint_name": "Rasulgarh National Highway Checkpoint", "lat": 20.3015, "lng": 85.8562, "checkpoint_type": "Inspection Station"}
    ],
    # Bhubaneswar <-> Konark
    ('bhubaneswar', 'konark'): [
        {"checkpoint_name": "Nimapada Mandi Highway Checkpoint", "lat": 20.0620, "lng": 86.0150, "checkpoint_type": "Mandi Highway Post"},
        {"checkpoint_name": "Konark Marine Drive Inspection Post", "lat": 19.9074, "lng": 86.1420, "checkpoint_type": "Coastal Transit Gate"}
    ],
    ('konark', 'bhubaneswar'): [
        {"checkpoint_name": "Nimapada Mandi Highway Checkpoint", "lat": 20.0620, "lng": 86.0150, "checkpoint_type": "Mandi Highway Post"},
        {"checkpoint_name": "Uttara Chhak Logistics Station", "lat": 20.2150, "lng": 85.8500, "checkpoint_type": "City Entry Checkpoint"}
    ],
    # Howrah <-> Bhubaneswar (NH-16 ~460 km, 4 distinct corridor checkup hubs)
    ('howrah', 'bhubaneswar'): [
        {"checkpoint_name": "Kharagpur NH-16 Highway Toll & Weighbridge Hub", "station_city": "Kharagpur", "lat": 22.3400, "lng": 87.3200, "checkpoint_type": "Highway Toll Plaza"},
        {"checkpoint_name": "Balasore Sergarh Highway Inspection Post", "station_city": "Balasore", "lat": 21.4934, "lng": 86.9135, "checkpoint_type": "Interstate Inspection Post"},
        {"checkpoint_name": "Bhadrak Charampa Transit Checkpoint", "station_city": "Bhadrak", "lat": 21.0574, "lng": 86.4950, "checkpoint_type": "Logistics Scale Hub"},
        {"checkpoint_name": "Cuttack Manguli Toll & Transit Hub", "station_city": "Cuttack", "lat": 20.5285, "lng": 85.9080, "checkpoint_type": "Highway Toll Plaza"}
    ],
    ('bhubaneswar', 'howrah'): [
        {"checkpoint_name": "Cuttack Manguli Toll & Transit Hub", "station_city": "Cuttack", "lat": 20.5285, "lng": 85.9080, "checkpoint_type": "Highway Toll Plaza"},
        {"checkpoint_name": "Bhadrak Charampa Transit Checkpoint", "station_city": "Bhadrak", "lat": 21.0574, "lng": 86.4950, "checkpoint_type": "Logistics Scale Hub"},
        {"checkpoint_name": "Balasore Sergarh Highway Inspection Post", "station_city": "Balasore", "lat": 21.4934, "lng": 86.9135, "checkpoint_type": "Interstate Inspection Post"},
        {"checkpoint_name": "Kharagpur NH-16 Highway Toll & Weighbridge Hub", "station_city": "Kharagpur", "lat": 22.3400, "lng": 87.3200, "checkpoint_type": "Highway Toll Plaza"}
    ],
    ('kolkata', 'bhubaneswar'): [
        {"checkpoint_name": "Kharagpur NH-16 Highway Toll & Weighbridge Hub", "station_city": "Kharagpur", "lat": 22.3400, "lng": 87.3200, "checkpoint_type": "Highway Toll Plaza"},
        {"checkpoint_name": "Balasore Sergarh Highway Inspection Post", "station_city": "Balasore", "lat": 21.4934, "lng": 86.9135, "checkpoint_type": "Interstate Inspection Post"},
        {"checkpoint_name": "Bhadrak Charampa Transit Checkpoint", "station_city": "Bhadrak", "lat": 21.0574, "lng": 86.4950, "checkpoint_type": "Logistics Scale Hub"},
        {"checkpoint_name": "Cuttack Manguli Toll & Transit Hub", "station_city": "Cuttack", "lat": 20.5285, "lng": 85.9080, "checkpoint_type": "Highway Toll Plaza"}
    ],
    ('bhubaneswar', 'kolkata'): [
        {"checkpoint_name": "Cuttack Manguli Toll & Transit Hub", "station_city": "Cuttack", "lat": 20.5285, "lng": 85.9080, "checkpoint_type": "Highway Toll Plaza"},
        {"checkpoint_name": "Bhadrak Charampa Transit Checkpoint", "station_city": "Bhadrak", "lat": 21.0574, "lng": 86.4950, "checkpoint_type": "Logistics Scale Hub"},
        {"checkpoint_name": "Balasore Sergarh Highway Inspection Post", "station_city": "Balasore", "lat": 21.4934, "lng": 86.9135, "checkpoint_type": "Interstate Inspection Post"},
        {"checkpoint_name": "Kharagpur NH-16 Highway Toll & Weighbridge Hub", "station_city": "Kharagpur", "lat": 22.3400, "lng": 87.3200, "checkpoint_type": "Highway Toll Plaza"}
    ]
}


def is_officer_station_authorized_for_target(
    officer_station: Optional[str],
    target_location: Optional[str],
    checkpoint_obj: Optional[dict] = None
) -> bool:
    """
    Strict station authorization gate:
    Only the logistics officer of a specific location can perform:
    1. Checkpoint Inspections at that checkpoint station
    2. Certified loading & ice supply at that pickup dock
    3. Unloading & handover verification at that drop delivery destination
    """
    if not officer_station or not target_location:
        return False
    
    s_clean = officer_station.strip().lower()
    t_clean = target_location.strip().lower()
    
    # 1. Exact string match
    if s_clean == t_clean:
        return True
    
    # 2. Checkpoint point numbering match (e.g. "point #2", "#2", "halt #2")
    p_off = re.search(r'#(\d+)|point\s*(\d+)|halt\s*(\d+)', s_clean)
    p_tgt = re.search(r'#(\d+)|point\s*(\d+)|halt\s*(\d+)', t_clean)
    if p_tgt:
        tgt_num = p_tgt.group(1) or p_tgt.group(2) or p_tgt.group(3)
        if p_off:
            off_num = p_off.group(1) or p_off.group(2) or p_off.group(3)
            return off_num == tgt_num
        # Disallow matching target "point #2" to origin/destination city token unless officer also has that point number
        # e.g. target is "Howrah - Bhubaneswar Point #2" and officer is "Howrah" -> REJECT!
        if 'point' in t_clean or '#' in t_clean:
            # Check if officer station explicitly contains point #
            return False
    
    # 3. Check station_city from checkpoint metadata if provided
    if checkpoint_obj and checkpoint_obj.get("station_city"):
        city_clean = checkpoint_obj["station_city"].strip().lower()
        if city_clean and city_clean in s_clean:
            return True

    # 4. Token-based city / location intersection
    s_toks = extract_city_tokens(officer_station)
    t_toks = extract_city_tokens(target_location)

    if s_toks and t_toks and s_toks.intersection(t_toks):
        return True

    # 5. Distinctive substring match (>= 4 chars)
    for st in s_toks:
        if len(st) >= 4 and st in t_clean:
            return True
    for tt in t_toks:
        if len(tt) >= 4 and tt in s_clean:
            return True

    return False


def get_route_designated_checkpoints(from_loc: str, to_loc: str, distance_km: float) -> list[dict]:
    """
    Returns sequential designated checkpoint waypoints along the route corridor.
    """
    f_tokens = extract_city_tokens(from_loc)
    t_tokens = extract_city_tokens(to_loc)
    
    for f_tok in f_tokens:
        for t_tok in t_tokens:
            if (f_tok, t_tok) in KNOWN_ROUTE_CHECKPOINTS:
                return KNOWN_ROUTE_CHECKPOINTS[(f_tok, t_tok)]
    
    max_insp = get_max_inspections_for_distance(distance_km)
    o_coords = resolve_coords(from_loc)
    d_coords = resolve_coords(to_loc)
    
    from_city = from_loc.split(',')[0].strip() if from_loc else "Origin"
    to_city = to_loc.split(',')[0].strip() if to_loc else "Destination"
    
    waypoints = []
    for i in range(1, max_insp + 1):
        frac = i / (max_insp + 1)
        w_lat = None
        w_lng = None
        if o_coords and d_coords:
            w_lat = round(o_coords[0] + (d_coords[0] - o_coords[0]) * frac, 4)
            w_lng = round(o_coords[1] + (d_coords[1] - o_coords[1]) * frac, 4)
        waypoints.append({
            "checkpoint_name": f"{from_city} - {to_city} Highway Inspection Point #{i}",
            "station_city": f"Point #{i}",
            "lat": w_lat,
            "lng": w_lng,
            "checkpoint_type": "Highway Toll Plaza" if i % 2 == 1 else "Logistics Weighbridge Station"
        })
    return waypoints


def get_trip_inspection_progression(trip, actual_checkpoints: list, distance_km: float) -> dict:
    """
    Computes strict inspection progression for a trip:
    - Lists designated sequence of checkpoints along the corridor
    - Identifies the exact NEXT INSPECTION POINT
    - Evaluates whether destination unloading is unlocked (requires all corridor inspections completed)
    """
    designated = get_route_designated_checkpoints(getattr(trip, "from_loc", "") or "", getattr(trip, "to_loc", "") or "", distance_km)
    base_max = get_max_inspections_for_distance(distance_km)
    max_insp = max(base_max, len(designated))
    count_done = len(actual_checkpoints)
    
    if count_done < max_insp:
        next_wp = designated[count_done] if count_done < len(designated) else {
            "checkpoint_name": f"{getattr(trip, 'to_loc', 'Destination').split(',')[0].strip()} Pre-Drop Highway Inspection Plaza",
            "lat": None,
            "lng": None
        }
        return {
            "max_inspections": max_insp,
            "count_done": count_done,
            "inspections_remaining": max_insp - count_done,
            "inspection_completed": False,
            "inspection_status": "in_progress" if count_done > 0 else "not_started",
            "next_inspection_point": next_wp["checkpoint_name"],
            "next_inspection_lat": next_wp.get("lat"),
            "next_inspection_lng": next_wp.get("lng"),
            "designated_checkpoints": designated,
            "is_unload_allowed": False,
            "unload_lock_reason": f"Transit Incomplete: {max_insp - count_done} required checkpoint inspection(s) remaining along corridor before unloading can be verified (Next: {next_wp['checkpoint_name']})."
        }
    else:
        return {
            "max_inspections": max_insp,
            "count_done": count_done,
            "inspections_remaining": 0,
            "inspection_completed": True,
            "inspection_status": "completed",
            "next_inspection_point": "All Highway Inspections Completed (Cleared for Destination Unloading)",
            "next_inspection_lat": None,
            "next_inspection_lng": None,
            "designated_checkpoints": designated,
            "is_unload_allowed": True,
            "unload_lock_reason": None
        }


def trip_matches_officer_station(
    t,
    station_tokens: set[str],
    s_coords: Optional[tuple[float, float]],
    station_state: Optional[str] = None,
    trip_checkpoints: Optional[list] = None,
    trip_requests: Optional[list] = None,
    officer_station_raw: Optional[str] = None
) -> bool:

    """
    Strict matching rule:
    Only shows trips that are:
    1. At the Start of journey (Origin city matches or within <= 15km)
    2. At the End of journey (Destination city matches or within <= 15km)
    3. In the Mid of journey (Passes through station corridor, or has a scheduled checkpoint / booked cargo halt at station)
    Strictly forbids cross-state pollution when origin and destination are in another state.
    """
    origin_state = extract_state_from_location(t.from_loc) or extract_state_from_location(t.state)
    dest_state = extract_state_from_location(t.to_loc)

    # 0. STRICT CROSS-STATE REJECTION:
    # If the trip is entirely within State A, and the officer's station is in State B, REJECT!
    if station_state and origin_state and dest_state:
        if origin_state == dest_state and origin_state != station_state:
            return False

    from_tokens = extract_city_tokens(t.from_loc)
    to_tokens = extract_city_tokens(t.to_loc)

    # 1. Start of the journey (Origin terminal)
    if station_tokens and station_tokens.intersection(from_tokens):
        return True

    o_lat = t.pickup_lat if (t.pickup_lat and t.pickup_lat != 0.0) else (t.lat or 0.0)
    o_lng = t.pickup_lng if (t.pickup_lng and t.pickup_lng != 0.0) else (t.lng or 0.0)
    o_coords = resolve_coords(t.from_loc, o_lat, o_lng)

    # Terminal radius <= 15 km: ensures adjacent separate cities (e.g. Bhubaneswar & Cuttack, 21km apart) don't bleed into each other
    if s_coords and o_coords:
        if calculate_haversine_km(s_coords[0], s_coords[1], o_coords[0], o_coords[1]) <= 15.0:
            if not station_state or not origin_state or station_state == origin_state:
                return True

    # 2. End of the journey (Destination terminal)
    if station_tokens and station_tokens.intersection(to_tokens):
        return True

    d_lat = t.dest_lat or 0.0
    d_lng = t.dest_lng or 0.0
    d_coords = resolve_coords(t.to_loc, d_lat, d_lng)

    if s_coords and d_coords:
        if calculate_haversine_km(s_coords[0], s_coords[1], d_coords[0], d_coords[1]) <= 15.0:
            if not station_state or not dest_state or station_state == dest_state:
                return True

    # 3. Intermediate Stop / Mandi / Checkpoint at Station
    if t.current_checkpoint:
        cp_tokens = extract_city_tokens(t.current_checkpoint)
        if station_tokens and station_tokens.intersection(cp_tokens):
            cp_state = extract_state_from_location(t.current_checkpoint)
            if not station_state or not cp_state or cp_state == station_state:
                return True

    if trip_checkpoints:
        for cp in trip_checkpoints:
            cp_name = getattr(cp, 'checkpoint_name', '')
            cp_tokens = extract_city_tokens(cp_name)
            if station_tokens and station_tokens.intersection(cp_tokens):
                cp_state = extract_state_from_location(cp_name)
                if not station_state or not cp_state or cp_state == station_state:
                    return True

    # 4. Booked Cargo with Pickup or Drop at Station
    if trip_requests:
        for r in trip_requests:
            r_pickup = getattr(r, 'pickup_place', '') or ''
            r_delivery = getattr(r, 'delivery_place', '') or getattr(r, 'route', '') or ''
            r_p_state = extract_state_from_location(r_pickup)
            r_d_state = extract_state_from_location(r_delivery)

            if not station_state or r_p_state == station_state or r_d_state == station_state:
                r_pickup_tokens = extract_city_tokens(r_pickup)
                r_drop_tokens = extract_city_tokens(r_delivery)
                if station_tokens and (station_tokens.intersection(r_pickup_tokens) or station_tokens.intersection(r_drop_tokens)):
                    return True
                if s_coords:
                    r_plat = getattr(r, 'pickup_lat', 0.0) or 0.0
                    r_plng = getattr(r, 'pickup_lng', 0.0) or 0.0
                    if r_plat != 0.0 and r_plng != 0.0 and calculate_haversine_km(s_coords[0], s_coords[1], r_plat, r_plng) <= 15.0:
                        return True
                    r_dlat = getattr(r, 'delivery_lat', 0.0) or 0.0
                    r_dlng = getattr(r, 'delivery_lng', 0.0) or 0.0
                    if r_dlat != 0.0 and r_dlng != 0.0 and calculate_haversine_km(s_coords[0], s_coords[1], r_dlat, r_dlng) <= 15.0:
                        return True

    # 5. Mid of journey (Geographic transit corridor via officer station)
    if s_coords and o_coords and d_coords:
        d_OD = calculate_haversine_km(o_coords[0], o_coords[1], d_coords[0], d_coords[1])
        # Only meaningful for trips between distinct geographical areas (>= 25 km)
        if d_OD >= 25.0:
            d_OS = calculate_haversine_km(o_coords[0], o_coords[1], s_coords[0], s_coords[1])
            d_SD = calculate_haversine_km(s_coords[0], s_coords[1], d_coords[0], d_coords[1])

            # Station must strictly lie between Origin and Destination
            if d_OS < d_OD + 15.0 and d_SD < d_OD + 15.0:
                detour = (d_OS + d_SD) - d_OD
                crosstrack = distance_to_segment_km(s_coords[0], s_coords[1], o_coords[0], o_coords[1], d_coords[0], d_coords[1])

                # Must be on the highway transit corridor
                if (detour <= 25.0 and crosstrack <= 25.0) or (detour <= min(35.0, d_OD * 0.06) and crosstrack <= 35.0):
                    return True

    # 6. Designated Highway Route Corridor Checkpoints
    if officer_station_raw:

        trip_dist = calculate_trip_distance_km(t)
        des_cps = get_route_designated_checkpoints(t.from_loc or "", t.to_loc or "", trip_dist)
        for des in des_cps:
            des_name = des.get("checkpoint_name", "")
            des_city = des.get("station_city", "")
            if is_officer_station_authorized_for_target(officer_station_raw, des_name, des):
                return True
            if des_city and station_tokens and des_city.lower() in [s.lower() for s in station_tokens]:
                return True

    return False



def check_officer_password(plain_password: str, stored_password: Optional[str]) -> bool:
    if not stored_password or not plain_password:
        return False
    try:
        if verify_password(plain_password, stored_password):
            return True
    except Exception:
        pass
    return plain_password == stored_password


# =========================================================
# 1. LOGISTICS OFFICER AUTHENTICATION & REGISTRATION
# =========================================================

@router.post("/auth/register")
def logistics_register(
    payload: schemas.LogisticsRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Registers a new field logistics officer with security password, unique username, and posting station.
    """
    # 1. Validate Username
    username_err = validate_username_format(payload.username)
    if username_err:
        raise HTTPException(status_code=400, detail=username_err)

    clean_username = payload.username.strip()
    # Check if username is already taken by any user (case-insensitive)
    existing_username = (
        db.query(models.User)
        .filter(func.lower(models.User.username) == clean_username.lower())
        .first()
    )
    if existing_username:
        raise HTTPException(
            status_code=400,
            detail=f"Officer username '{clean_username}' is already taken. Please choose another unique username."
        )

    # 2. Validate Full Name
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Officer full name is required.")

    # 3. Validate Mobile Number
    clean_phone = payload.phone_number.strip().replace(" ", "").replace("-", "").replace("+91", "")
    if clean_phone.startswith("0") and len(clean_phone) == 11:
        clean_phone = clean_phone[1:]
    if len(clean_phone) != 10 or not clean_phone.isdigit():
        raise HTTPException(status_code=400, detail="Please provide a valid 10-digit mobile number.")

    # Check if this mobile number is already registered to ANY user profile
    existing_phone_user = (
        db.query(models.UserProfile)
        .filter(models.UserProfile.phone_number == clean_phone)
        .first()
    )
    if existing_phone_user:
        raise HTTPException(
            status_code=400,
            detail=f"Mobile number {clean_phone} is already linked to an existing account. Each mobile number can only belong to one user account. Please sign in or use another number."
        )

    # 4. Validate Password Rules
    pw_err = validate_password_strength(payload.password)
    if pw_err:
        raise HTTPException(status_code=400, detail=pw_err)

    # 5. Validate Station
    station_name = payload.station.strip() if payload.station else ""
    if not station_name:
        raise HTTPException(status_code=400, detail="Location of posting / assigned station is required.")

    # 6. Create New User and Logistics Profile
    hashed_pw = hash_password(payload.password.strip())
    user = models.User(
        username=clean_username,
        email=f"{clean_username.lower()}@safarsaathi.com",
        password=hashed_pw,
        role=models.UserRole.USER
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    profile = models.UserProfile(
        user_id=user.id,
        full_name=clean_name,
        phone_number=clean_phone,
        user_type="logistics",
        assigned_station=station_name,
        station_lat=payload.station_lat,
        station_lng=payload.station_lng,
        id_proof_doc=payload.id_proof_doc,
        is_verified=True,
        preferred_lang="hi"
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    access_token = create_access_token(data={"sub": str(user.id), "role": "logistics"})
    id_proof_url = f"{BASE_URL}/uploads/{profile.id_proof_doc}" if profile.id_proof_doc else None

    return {
        "status": "success",
        "message": f"Officer {clean_name} (@{clean_username}) registered successfully. Posting station active at {station_name}!",
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": "logistics",
        "officer": {
            "id": user.id,
            "username": user.username,
            "name": profile.full_name,
            "phone_number": profile.phone_number,
            "station": profile.assigned_station,
            "station_lat": getattr(profile, "station_lat", None),
            "station_lng": getattr(profile, "station_lng", None),
            "id_proof_doc": profile.id_proof_doc,
            "id_proof_doc_url": id_proof_url,
            "is_verified": profile.is_verified
        }
    }


@router.post("/auth/login")
def logistics_login(
    payload: schemas.LogisticsLoginCredentialsRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticates a field logistics officer using their unique Username OR 10-digit mobile and password.
    """
    raw_identifier = (payload.username_or_phone or payload.username or payload.phone_number or "").strip()
    if not raw_identifier:
        raise HTTPException(status_code=400, detail="Please enter your registered officer username or 10-digit mobile number.")

    if not payload.password or not payload.password.strip():
        raise HTTPException(status_code=400, detail="Please enter your officer password.")

    clean_digits = raw_identifier.replace(" ", "").replace("-", "").replace("+91", "")
    if clean_digits.startswith("0") and len(clean_digits) == 11:
        clean_digits = clean_digits[1:]

    user = None

    # Scenario A: Input appears to be a 10-digit mobile number
    if clean_digits.isdigit() and len(clean_digits) == 10:
        # Search specifically for logistics officers with this phone
        officers_with_phone = (
            db.query(models.User)
            .join(models.UserProfile, models.User.id == models.UserProfile.user_id)
            .filter(models.UserProfile.phone_number == clean_digits, models.UserProfile.user_type == "logistics")
            .all()
        )

        if len(officers_with_phone) == 1:
            user = officers_with_phone[0]
        elif len(officers_with_phone) > 1:
            # Handle legacy duplicate phone numbers safely:
            # Check which account matches the password
            pw_matches = [u for u in officers_with_phone if check_officer_password(payload.password.strip(), u.password)]
            if len(pw_matches) == 1:
                user = pw_matches[0]
            elif len(pw_matches) > 1:
                raise HTTPException(
                    status_code=400,
                    detail="Multiple accounts share this mobile number. Please log in using your unique Officer Username."
                )
            else:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid credentials. Incorrect password for this officer account."
                )
        else:
            # Maybe the identifier is a 10-digit username (e.g. badge number)
            user_by_name = (
                db.query(models.User)
                .filter(func.lower(models.User.username) == raw_identifier.lower())
                .first()
            )
            if user_by_name:
                user = user_by_name
            else:
                # Check if this phone number is registered under a different user_type
                non_logistics = (
                    db.query(models.UserProfile)
                    .filter(models.UserProfile.phone_number == clean_digits)
                    .first()
                )
                if non_logistics and non_logistics.user_type != "logistics":
                    raise HTTPException(
                        status_code=403,
                        detail=f"This mobile number is registered as a {non_logistics.user_type.capitalize()} account. Only Logistics Officers can access this portal."
                    )
                raise HTTPException(
                    status_code=401,
                    detail="No officer account found with this mobile number. Please register first."
                )

    # Scenario B: Input is a username
    if not user:
        user = (
            db.query(models.User)
            .filter(func.lower(models.User.username) == raw_identifier.lower())
            .first()
        )
        if not user:
            raise HTTPException(
                status_code=401,
                detail="No officer account found with this username. Please check your credentials or register."
            )

    # Verify password
    if not check_officer_password(payload.password.strip(), user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials. Incorrect password for this officer account."
        )

    profile = user.profile
    if not profile:
        profile = models.UserProfile(
            user_id=user.id,
            full_name=user.username,
            phone_number=clean_digits if (clean_digits.isdigit() and len(clean_digits) == 10) else None,
            user_type="logistics"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    elif profile.user_type and profile.user_type != "logistics":
        raise HTTPException(
            status_code=403,
            detail=f"This account is registered as a {profile.user_type.capitalize()}. Logistics Desk requires an authorized logistics officer account."
        )

    access_token = create_access_token(data={"sub": str(user.id), "role": "logistics"})
    id_proof_url = f"{BASE_URL}/uploads/{profile.id_proof_doc}" if profile.id_proof_doc else None

    return {
        "status": "success",
        "message": f"Welcome back, Officer {profile.full_name} (@{user.username})! Station {profile.assigned_station or 'Hub'} opened.",
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": "logistics",
        "officer": {
            "id": user.id,
            "username": user.username,
            "name": profile.full_name,
            "phone_number": profile.phone_number,
            "station": profile.assigned_station or "Corridor Hub",
            "station_lat": getattr(profile, "station_lat", None),
            "station_lng": getattr(profile, "station_lng", None),
            "id_proof_doc": profile.id_proof_doc,
            "id_proof_doc_url": id_proof_url,
            "is_verified": profile.is_verified
        }
    }


@router.post("/auth/login-or-register")
def logistics_login_or_register(
    payload: schemas.LogisticsLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Direct login or registration for field logistics personnel (backwards compatible).
    """
    clean_phone = payload.phone_number.strip().replace(" ", "").replace("-", "").replace("+91", "")
    if clean_phone.startswith("0") and len(clean_phone) == 11:
        clean_phone = clean_phone[1:]
    if len(clean_phone) < 10:
        raise HTTPException(status_code=400, detail="Please provide a valid 10-digit mobile number.")

    clean_name = (payload.name or "").strip() or f"Officer_{clean_phone[-4:]}"

    # Search existing user by phone or username
    user = (
        db.query(models.User)
        .join(models.UserProfile, models.User.id == models.UserProfile.user_id)
        .filter(models.UserProfile.phone_number == clean_phone)
        .first()
    )

    if not user:
        if payload.password:
            pw_err = validate_password_strength(payload.password)
            if pw_err:
                raise HTTPException(status_code=400, detail=pw_err)

        hashed_pw = hash_password(payload.password.strip()) if payload.password else hash_password("OfficerPass@2026")
        suggested_username = (payload.username or "").strip()
        if suggested_username:
            username_err = validate_username_format(suggested_username)
            if username_err:
                raise HTTPException(status_code=400, detail=username_err)
            unique_username = suggested_username
        else:
            unique_username = f"logistics_{clean_name.replace(' ', '_').lower()}_{clean_phone[-4:]}_{uuid.uuid4().hex[:4]}"

        # Ensure username uniqueness
        existing_u = db.query(models.User).filter(func.lower(models.User.username) == unique_username.lower()).first()
        if existing_u:
            unique_username = f"{unique_username}_{uuid.uuid4().hex[:4]}"

        user = models.User(
            username=unique_username,
            email=f"{unique_username}@safarsaathi.com",
            password=hashed_pw,
            role=models.UserRole.USER
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        profile = models.UserProfile(
            user_id=user.id,
            full_name=clean_name,
            phone_number=clean_phone,
            user_type="logistics",
            assigned_station=payload.station or "Corridor Hub",
            station_lat=payload.station_lat,
            station_lng=payload.station_lng,
            id_proof_doc=payload.id_proof_doc,
            is_verified=True,
            preferred_lang="hi"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    else:
        if payload.password and not check_officer_password(payload.password.strip(), user.password):
            raise HTTPException(status_code=401, detail="Invalid credentials. Incorrect password/PIN.")

        profile = user.profile
        if not profile:
            profile = models.UserProfile(user_id=user.id)
            db.add(profile)

        if payload.name:
            profile.full_name = clean_name
        profile.phone_number = clean_phone
        profile.user_type = "logistics"
        if payload.station:
            profile.assigned_station = payload.station
        if payload.station_lat is not None:
            profile.station_lat = payload.station_lat
        if payload.station_lng is not None:
            profile.station_lng = payload.station_lng
        if payload.id_proof_doc:
            profile.id_proof_doc = payload.id_proof_doc
        profile.is_verified = True
        db.commit()
        db.refresh(profile)

    access_token = create_access_token(data={"sub": str(user.id), "role": "logistics"})
    id_proof_url = f"{BASE_URL}/uploads/{profile.id_proof_doc}" if profile.id_proof_doc else None

    return {
        "status": "success",
        "message": f"Welcome Officer {clean_name}! Logistics station active.",
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": "logistics",
        "officer": {
            "id": user.id,
            "username": user.username,
            "name": profile.full_name,
            "phone_number": profile.phone_number,
            "station": profile.assigned_station or "Corridor Hub",
            "station_lat": getattr(profile, "station_lat", None),
            "station_lng": getattr(profile, "station_lng", None),
            "id_proof_doc": profile.id_proof_doc,
            "id_proof_doc_url": id_proof_url,
            "is_verified": profile.is_verified
        }
    }


@router.post("/upload-id")
def upload_logistics_id_proof(file: UploadFile = File(...)):
    """
    Uploads ID Proof (Aadhaar / Government ID / Logistics Employee Badge).
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="ID document file is required.")

    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = {".jpg", ".jpeg", ".png", ".pdf", ".webp"}
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="Allowed ID formats: JPG, PNG, PDF, WEBP.")

    unique_filename = f"logistics_id_{uuid.uuid4().hex[:8]}{ext}"
    target_path = os.path.join(LOGISTICS_UPLOAD_DIR, unique_filename)

    try:
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to persist ID file: {str(e)}")

    doc_rel_url = f"logistics/{unique_filename}"
    full_url = f"{BASE_URL}/uploads/{doc_rel_url}"

    return {
        "status": "success",
        "filename": doc_rel_url,
        "url": full_url
    }


@router.post("/switch-station")
def switch_officer_station(
    payload: schemas.StationSwitchRequest,
    current_user: Optional[models.User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Station switching is permanently disabled.
    Each logistics officer is assigned to a single fixed posting jurisdiction.
    To operate at another station, an officer account for that specific location must be used.
    """
    raise HTTPException(
        status_code=403,
        detail="Station switching is not permitted. Each officer account is strictly bound to its assigned posting location. Please log in with the account designated for that station."
    )


# =========================================================
# 2. CROSS-CONNECTED TRIPS & SHIPMENTS UNIFIED FEED
# =========================================================


@router.get("/trips-and-shipments")
def get_logistics_trips_and_shipments(
    route_search: Optional[str] = None,
    state_filter: Optional[str] = None,
    officer_station: Optional[str] = None,
    officer_lat: Optional[float] = None,
    officer_lng: Optional[float] = None,
    current_user: Optional[models.User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Consolidates data across both journeys:
    1. 'Offer a Trip' / Driver data (vehicle type, driver contact, route, capacity, live status)
    2. 'Find a Vehicle' / Shipper bookings (cargo type, weight, perishability, ice requirements, pickup/drop coords)
    3. Checkpoint inspection history (seals, weighbridge compliance, cold-chain)
    4. Strict regional filtering by officer's posting station location & coordinates:
       - Only trips starting at the station
       - Only trips ending at the station
       - Only trips in the mid of journey passing through the station corridor or with stops at the station
    """
    all_trips = (
        db.query(models.TripModel)
        .order_by(models.TripModel.id.desc())
        .all()
    )

    all_requests = (
        db.query(models.RequestModel)
        .order_by(models.RequestModel.id.desc())
        .all()
    )

    all_checkpoints = (
        db.query(models.LogisticsCheckpointModel)
        .order_by(models.LogisticsCheckpointModel.id.asc())
        .all()
    )


    # -------------------------------------------------------------
    # LOCATION-BASED FILTERING FOR OFFICER'S ASSIGNED STATION
    # If officer_station is provided (or resolved from authenticated officer session),
    # filter trips and shipments so only data starting, ending, or passing
    # through this station's corridor is shown.
    # -------------------------------------------------------------
    if not officer_station and current_user and current_user.profile and current_user.profile.assigned_station:
        officer_station = current_user.profile.assigned_station
        if getattr(current_user.profile, "station_lat", None) is not None:
            officer_lat = current_user.profile.station_lat
        if getattr(current_user.profile, "station_lng", None) is not None:
            officer_lng = current_user.profile.station_lng

    has_station_filter = bool(
        officer_station
        and officer_station.strip()
        and officer_station.strip().lower() not in ["all", "all india", "national", "undefined", "null"]
    )

    if has_station_filter:
        station_tokens = extract_city_tokens(officer_station)
        s_coords = resolve_coords(officer_station, officer_lat, officer_lng)
        station_state = extract_state_from_location(officer_station)

        checkpoints_by_trip_obj = {}
        for cp in all_checkpoints:
            checkpoints_by_trip_obj.setdefault(cp.trip_id, []).append(cp)

        requests_by_trip_obj = {}
        for r in all_requests:
            if r.trip_id:
                requests_by_trip_obj.setdefault(r.trip_id, []).append(r)

        all_trips = [
            t for t in all_trips
            if trip_matches_officer_station(
                t=t,
                station_tokens=station_tokens,
                s_coords=s_coords,
                station_state=station_state,
                trip_checkpoints=checkpoints_by_trip_obj.get(t.id, []),
                trip_requests=requests_by_trip_obj.get(t.id, []),
                officer_station_raw=officer_station
            )
        ]

        valid_trip_ids = {t.id for t in all_trips}

        def request_matches_station(r):
            if r.trip_id:
                return r.trip_id in valid_trip_ids
            r_pickup = r.pickup_place or ""
            r_route = r.route or ""
            r_p_state = extract_state_from_location(r_pickup)
            r_d_state = extract_state_from_location(r_route)
            if station_state and ((r_p_state and r_p_state != station_state) and (r_d_state and r_d_state != station_state)):
                return False
            r_pick_tokens = extract_city_tokens(r_pickup)
            r_route_tokens = extract_city_tokens(r_route)
            if station_tokens and (station_tokens.intersection(r_pick_tokens) or station_tokens.intersection(r_route_tokens)):
                return True
            if s_coords:
                r_plat = r.pickup_lat or 0.0
                r_plng = r.pickup_lng or 0.0
                if r_plat != 0.0 and r_plng != 0.0 and calculate_haversine_km(s_coords[0], s_coords[1], r_plat, r_plng) <= 15.0:
                    return True
                r_dlat = r.delivery_lat or 0.0
                r_dlng = r.delivery_lng or 0.0
                if r_dlat != 0.0 and r_dlng != 0.0 and calculate_haversine_km(s_coords[0], s_coords[1], r_dlat, r_dlng) <= 15.0:
                    return True
            return False

        def checkpoint_matches_station(cp):
            if cp.trip_id:
                return cp.trip_id in valid_trip_ids
            cp_tokens = extract_city_tokens(cp.checkpoint_name or "")
            if station_tokens and station_tokens.intersection(cp_tokens):
                return True
            return False

        all_requests = [r for r in all_requests if request_matches_station(r)]
        all_checkpoints = [cp for cp in all_checkpoints if checkpoint_matches_station(cp)]

    # Compute dynamic corridors across India from live database trips
    corridor_stats = {}
    for t in all_trips:
        from_city = t.from_loc.split(',')[0].strip() if t.from_loc else "Origin Hub"
        to_city = t.to_loc.split(',')[0].strip() if t.to_loc else "Destination Hub"
        c_key = f"{from_city} → {to_city}"
        
        # Determine state
        state_name = "India"
        if t.state and str(t.state).strip():
            state_name = t.state.split(',')[0].strip()
        elif t.from_loc and ',' in t.from_loc:
            parts = [p.strip() for p in t.from_loc.split(',') if p.strip()]
            if len(parts) >= 2 and parts[-1].lower() == "india":
                state_name = parts[-2]
            elif len(parts) >= 1:
                state_name = parts[-1]

        if c_key not in corridor_stats:
            corridor_stats[c_key] = {
                "route": c_key,
                "from_city": from_city,
                "to_city": to_city,
                "state": state_name,
                "trips_count": 0,
                "active_trips_count": 0,
                "shipments_count": 0,
                "has_perishables": False,
                "trip_ids": []
            }
        corridor_stats[c_key]["trips_count"] += 1
        corridor_stats[c_key]["trip_ids"].append(t.id)
        if t.status in ["in_transit", "scheduled"] or t.is_live:
            corridor_stats[c_key]["active_trips_count"] += 1
        if t.has_perishables:
            corridor_stats[c_key]["has_perishables"] = True

    for r in all_requests:
        if r.trip_id and r.status not in ["pending", "cancelled", "cancelled_by_driver", "rejected"]:
            for c_val in corridor_stats.values():
                if r.trip_id in c_val["trip_ids"]:
                    c_val["shipments_count"] += 1
                    if r.is_perishable:
                        c_val["has_perishables"] = True

    # Group checkpoints by trip_id
    checkpoints_by_trip = {}
    for cp in all_checkpoints:
        checkpoints_by_trip.setdefault(cp.trip_id, []).append({
            "id": cp.id,
            "trip_id": cp.trip_id,
            "checkpoint_name": cp.checkpoint_name,
            "checkpoint_type": getattr(cp, "checkpoint_type", "Highway Toll Plaza") or "Highway Toll Plaza",
            "officer_name": cp.officer_name,
            "officer_phone": cp.officer_phone,
            "timestamp": cp.timestamp,
            "cargo_seal_intact": cp.cargo_seal_intact,
            "seal_number": getattr(cp, "seal_number", None),
            "seal_status": getattr(cp, "seal_status", "Verified & Intact") or "Verified & Intact",
            "measured_weight_kg": getattr(cp, "measured_weight_kg", None),
            "declared_weight_kg": getattr(cp, "declared_weight_kg", None),
            "weight_discrepancy_kg": getattr(cp, "weight_discrepancy_kg", None),
            "weight_compliant": getattr(cp, "weight_compliant", True),
            "safety_parameters_status": getattr(cp, "safety_parameters_status", "Compliant") or "Compliant",
            "cooling_status": getattr(cp, "cooling_status", None),
            "cargo_condition": cp.cargo_condition,
            "ice_status": cp.ice_status,
            "temp_celsius": cp.temp_celsius,
            "notes": cp.notes,
            "proof_image_url": cp.proof_image_url,
            "action_taken": cp.action_taken
        })

    # Group requests by trip_id (only accepted / confirmed cargo bookings)
    requests_by_trip = {}
    for r in all_requests:
        # Ignore unaccepted bookings (pending driver acceptance), cancelled, or rejected requests
        if not r.trip_id or r.status in ["pending", "cancelled", "cancelled_by_driver", "rejected"]:
            continue
        if r.status not in ["accepted", "in_transit", "moving", "started", "pending_passenger_confirmation", "delivered", "completed"]:
            continue
        t_obj = next((t for t in all_trips if t.id == r.trip_id), None)
        deliv_place_val = extract_delivery_destination(r.route, t_obj.to_loc if t_obj else None)
        req_dict = {

            "id": r.id,
            "trip_id": r.trip_id,
            "farmer_name": r.farmer_name or "Shipper",
            "farmer_phone": (db.query(models.UserProfile.phone_number).filter(models.UserProfile.user_id == r.user_id).scalar() if r.user_id else None),
            "cargo_type": r.cargo_type or "Fresh Agricultural Produce",
            "cargo_category": getattr(r, "cargo_category", "general") or "general",
            "dedicated_sub_category": getattr(r, "dedicated_sub_category", None),
            "is_dedicated": bool(getattr(r, "is_dedicated", False)),
            "goods_weight_kg": r.goods_weight_kg if r.goods_weight_kg is not None else (r.kg or 0),
            "status": r.status,
            "is_perishable": bool(r.is_perishable),
            "ice_handling_required": bool(r.ice_handling_required),
            "cooling_type": getattr(r, "cooling_type", None),
            "target_temp_c": getattr(r, "target_temp_c", None),
            "current_temp_c": r.current_temp_c if r.current_temp_c is not None else (4.0 if r.is_perishable else None),
            "loading_status": r.loading_status or "pending",
            "loaded_at": r.loaded_at,
            "loaded_by": r.loaded_by,
            "unloaded_at": r.unloaded_at,
            "unloaded_by": r.unloaded_by,
            "ice_boxes_count": r.ice_boxes_count or 0,
            "ice_added": bool(getattr(r, "ice_added", False)),
            "ice_added_stage": getattr(r, "ice_added_stage", None),
            "ice_added_at": getattr(r, "ice_added_at", None),
            "ice_unavailable_at_pickup": bool(getattr(r, "ice_unavailable_at_pickup", False)),
            "seal_number": getattr(r, "seal_number", None),
            "seal_status": getattr(r, "seal_status", "Pending") or "Pending",
            "verified_weight_kg": getattr(r, "verified_weight_kg", None),
            "weight_compliant": getattr(r, "weight_compliant", True),
            "pickup_place": r.pickup_place or (t_obj.pickup if t_obj else "Pickup Point"),
            "delivery_place": deliv_place_val,
            "pickup_lat": r.pickup_lat or 0.0,
            "pickup_lng": r.pickup_lng or 0.0,
            "delivery_date": r.delivery_date,
            "delivery_lat": r.delivery_lat or 0.0,
            "delivery_lng": r.delivery_lng or 0.0,
            "route": r.route,
            "pickup_cargo_image_url": r.pickup_cargo_image_url,
            "delivery_proof_image_url": r.delivery_proof_image_url
        }

        if r.trip_id:
            requests_by_trip.setdefault(r.trip_id, []).append(req_dict)

    # Filter trips if route_search or state_filter is requested
    filtered_trips = all_trips
    if route_search and route_search.strip():
        term = route_search.strip().lower()
        filtered_trips = [
            t for t in filtered_trips
            if (t.from_loc and term in t.from_loc.lower()) or
               (t.to_loc and term in t.to_loc.lower()) or
               (t.state and term in t.state.lower()) or
               (t.owner and term in t.owner.lower()) or
               (t.vehicle and term in t.vehicle.lower()) or
               f"{t.from_loc} {t.to_loc}".lower().find(term) != -1
        ]
    if state_filter and state_filter.strip() and state_filter.lower() != "all":
        st_term = state_filter.strip().lower()
        filtered_trips = [
            t for t in filtered_trips
            if (t.state and st_term in t.state.lower()) or
               (t.from_loc and st_term in t.from_loc.lower())
        ]

    # Format trip summaries
    trip_list = []
    total_perishables = 0
    pending_loadings = 0
    pending_unloadings = 0

    prog_by_trip_id = {}
    for t in filtered_trips:
        trip_reqs = requests_by_trip.get(t.id, [])
        trip_cps = checkpoints_by_trip.get(t.id, [])

        trip_dist = calculate_trip_distance_km(t)
        prog = get_trip_inspection_progression(t, trip_cps, trip_dist)
        prog_by_trip_id[t.id] = prog

        max_insp = prog["max_inspections"]
        actual_checkpoints_count = prog["count_done"]
        is_insp_completed = prog["inspection_completed"]
        insp_status = prog["inspection_status"]

        trip_is_perishable = (getattr(t, "cargo_category", "") == "Perishable Goods") or bool(getattr(t, "has_perishables", False))
        has_ice_shipments = any(bool(r.get("ice_handling_required")) for r in trip_reqs)
        trip_has_perishables = trip_is_perishable or any(r["is_perishable"] for r in trip_reqs)
        total_booked_kg = sum(r["goods_weight_kg"] for r in trip_reqs if r["status"] not in ["cancelled", "rejected", "cancelled_by_driver"])

        active_cargo = [r for r in trip_reqs if r["status"] not in ["cancelled", "rejected", "cancelled_by_driver"]]
        unverified_cargo = [r for r in active_cargo if r.get("loading_status", "pending") != "loaded"]
        has_cargo = len(active_cargo) > 0
        is_load_verified = has_cargo and len(unverified_cargo) == 0
        unverified_cargo_count = len(unverified_cargo)
        verified_cargo_count = len([r for r in active_cargo if r.get("loading_status") == "loaded"])

        trip_started = bool(t and ((t.status in ["in_transit", "moving", "started", "pending_passenger_confirmation", "completed"]) or bool(getattr(t, "is_live", False))))

        # Only count pending loadings & unloadings for active, non-cancelled, non-completed trips
        if t.status not in ["cancelled", "cancelled_by_driver", "completed"]:
            for r in trip_reqs:
                if r["status"] in ["cancelled", "cancelled_by_driver", "rejected"]:
                    continue
                if r["is_perishable"]:
                    total_perishables += 1
                if r["loading_status"] == "pending" and r["status"] in ["accepted", "scheduled", "in_transit"]:
                    pending_loadings += 1
                elif r["loading_status"] == "loaded" and r["status"] in ["in_transit", "accepted"] and trip_started:
                    pending_unloadings += 1

        trip_list.append({
            "id": t.id,
            "state": t.state,
            "from_loc": t.from_loc,
            "to_loc": t.to_loc,
            "date": t.date,
            "vehicle": t.vehicle,
            "owner": t.owner,
            "driver_phone": t.driver_phone,
            "status": t.status,
            "is_live": bool(t.is_live),
            "speed": t.speed,
            "distance_km": trip_dist,
            "route_distance_km": trip_dist,
            "max_inspections": max_insp,
            "inspections_remaining": prog["inspections_remaining"],
            "next_inspection_point": prog["next_inspection_point"],
            "next_inspection_lat": prog.get("next_inspection_lat"),
            "next_inspection_lng": prog.get("next_inspection_lng"),
            "is_unload_allowed": prog["is_unload_allowed"],
            "unload_lock_reason": prog["unload_lock_reason"],
            "designated_checkpoints": prog["designated_checkpoints"],
            "total_kg": t.total_kg or 1000,
            "total_booked_kg": total_booked_kg,
            "available_space_kg": max(0, (t.total_kg or 1000) - total_booked_kg),
            "lat": t.lat,
            "lng": t.lng,
            "pickup": t.pickup,
            "cargo_category": getattr(t, "cargo_category", "general") or "general",
            "dedicated_sub_category": getattr(t, "dedicated_sub_category", None),
            "is_dedicated": bool(getattr(t, "is_dedicated", False)),
            "seal_number": getattr(t, "seal_number", None),
            "seal_status": getattr(t, "seal_status", "Pending") or "Pending",
            "last_weigh_in_kg": getattr(t, "last_weigh_in_kg", None),
            "weight_compliant": getattr(t, "weight_compliant", True),
            "cooling_type": getattr(t, "cooling_type", None),
            "target_temp_c": getattr(t, "target_temp_c", None),
            "has_perishables": trip_is_perishable,
            "has_ice_shipments": has_ice_shipments,
            "ice_handling_supported": bool(trip_is_perishable and t.ice_handling_supported),
            "is_return_leg": bool(getattr(t, "is_return_leg", False)),
            "return_trip_id": getattr(t, "return_trip_id", None),
            "inspection_status": insp_status,
            "inspection_completed": is_insp_completed,
            "checkpoint_count": actual_checkpoints_count,
            "current_checkpoint": t.current_checkpoint or (trip_cps[0]["checkpoint_name"] if trip_cps else "Departure Hub"),
            "checkpoints": trip_cps,
            "bookings": trip_reqs,
            "is_load_verified": is_load_verified,
            "unverified_cargo_count": unverified_cargo_count,
            "verified_cargo_count": verified_cargo_count,
            "total_cargo_count": len(active_cargo),
            "can_start_trip": is_load_verified
        })

    # Flat list of active cargo shipments (excludes unaccepted pending requests, cancelled requests, and deactivated trips)
    flat_shipments = []
    active_filtered_trip_ids = {t.id for t in filtered_trips if t.status not in ["cancelled", "cancelled_by_driver"]}
    for r in all_requests:
        if not r.trip_id or r.trip_id not in active_filtered_trip_ids:
            continue
        # CRITICAL FIX: Before driver accepts the booking/trip, do NOT include in logistics flat_shipments!
        # Shipper user info, cargo handling, and ice options must NEVER appear for pending requests.
        if r.status in ["pending", "cancelled", "cancelled_by_driver", "rejected"]:
            continue
        if r.status not in ["accepted", "in_transit", "moving", "started", "pending_passenger_confirmation", "delivered", "completed"]:
            continue
        t = next((trip for trip in all_trips if trip.id == r.trip_id), None)
        if not t or t.status in ["cancelled", "cancelled_by_driver"]:
            continue
        r_trip_started = bool(t and ((t.status in ["in_transit", "moving", "started", "pending_passenger_confirmation", "completed"]) or bool(getattr(t, "is_live", False))))
        t_prog = prog_by_trip_id.get(t.id)
        if not t_prog:
            t_cps = checkpoints_by_trip.get(t.id, [])
            t_dist = calculate_trip_distance_km(t)
            t_prog = get_trip_inspection_progression(t, t_cps, t_dist)

        flat_shipments.append({
            "id": r.id,
            "trip_id": r.trip_id,
            "driver_name": t.owner if t else (r.owner or "Assigned Transporter"),
            "driver_phone": t.driver_phone if t else None,
            "vehicle": t.vehicle if t else "Truck",
            "trip_status": t.status if t else "scheduled",
            "trip_started": r_trip_started,
            "is_live": bool(getattr(t, "is_live", False)) if t else False,
            "goods_area_status": getattr(t, "goods_area_status", None) if t else None,
            "parent_trip_next_inspection_point": t_prog["next_inspection_point"],
            "parent_trip_is_unload_allowed": t_prog["is_unload_allowed"],
            "parent_trip_inspections_remaining": t_prog["inspections_remaining"],
            "parent_trip_max_inspections": t_prog["max_inspections"],
            "parent_trip_designated_checkpoints": t_prog["designated_checkpoints"],
            "parent_trip_inspection_completed": t_prog["inspection_completed"],
            "next_inspection_point": t_prog["next_inspection_point"],
            "is_unload_allowed": t_prog["is_unload_allowed"],
            "inspections_remaining": t_prog["inspections_remaining"],
            "max_inspections": t_prog["max_inspections"],
            "designated_checkpoints": t_prog["designated_checkpoints"],
            "inspection_completed": t_prog["inspection_completed"],
            "unload_lock_reason": t_prog["unload_lock_reason"],
            "farmer_name": r.farmer_name or "Shipper",
            "farmer_phone": (db.query(models.UserProfile.phone_number).filter(models.UserProfile.user_id == r.user_id).scalar() if r.user_id else None),
            "cargo_type": r.cargo_type or "Perishable Fresh Produce",
            "cargo_category": getattr(r, "cargo_category", "general") or "general",
            "dedicated_sub_category": getattr(r, "dedicated_sub_category", None),
            "is_dedicated": bool(getattr(r, "is_dedicated", False)),
            "goods_weight_kg": r.goods_weight_kg if r.goods_weight_kg is not None else (r.kg or 0),
            "status": r.status,
            "is_perishable": bool(r.is_perishable),
            "ice_handling_required": bool(r.ice_handling_required),
            "cooling_type": getattr(r, "cooling_type", None),
            "target_temp_c": getattr(r, "target_temp_c", None),
            "current_temp_c": r.current_temp_c if r.current_temp_c is not None else (3.8 if r.is_perishable else None),
            "loading_status": r.loading_status or "pending",
            "loaded_at": r.loaded_at,
            "loaded_by": r.loaded_by,
            "unloaded_at": r.unloaded_at,
            "unloaded_by": r.unloaded_by,
            "ice_boxes_count": r.ice_boxes_count or 0,
            "ice_added": bool(getattr(r, "ice_added", False)),
            "ice_added_stage": getattr(r, "ice_added_stage", None),
            "ice_added_at": getattr(r, "ice_added_at", None),
            "ice_unavailable_at_pickup": bool(getattr(r, "ice_unavailable_at_pickup", False)),
            "seal_number": getattr(r, "seal_number", None),
            "seal_status": getattr(r, "seal_status", "Pending") or "Pending",
            "verified_weight_kg": getattr(r, "verified_weight_kg", None),
            "weight_compliant": getattr(r, "weight_compliant", True),
            "pickup_place": r.pickup_place or (t.pickup if t else "Pickup Station"),
            "delivery_place": extract_delivery_destination(r.route, t.to_loc if t else None),
            "delivery_date": r.delivery_date or (t.date if t else None),
            "route": r.route or (f"{t.from_loc} → {t.to_loc}" if t else "Route In Transit"),

            "pickup_cargo_image_url": r.pickup_cargo_image_url,
            "delivery_proof_image_url": r.delivery_proof_image_url
        })

    return {
        "trips": trip_list,
        "shipments": flat_shipments,
        "corridors": list(corridor_stats.values()),
        "metrics": {
            "total_trips": len(filtered_trips),
            "active_transit_trips": sum(1 for t in filtered_trips if t.status in ["in_transit", "scheduled"] or t.is_live),
            "total_cargo_shipments": len(flat_shipments),
            "perishable_shipments": total_perishables,
            "pending_loadings": pending_loadings,
            "pending_unloadings": pending_unloadings,
            "inspections_today": len(all_checkpoints)
        }
    }


# =========================================================
# 3. TRANSIT STOP CHECKPOINT INSPECTION LOGGING
# =========================================================

@router.post("/checkpoint-check")
def log_checkpoint_inspection(
    payload: schemas.LogisticsCheckpointCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Invoked each time the shipment stops at a highway toll, transit checkpoint, or hub.
    Verifies cargo security seal tag, weighbridge scale compliance, cold-chain temperature, and safety.
    Instantly pushes verified status to both Driver and connected Senders.
    """
    trip = db.query(models.TripModel).filter(models.TripModel.id == payload.trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail=f"Trip ID {payload.trip_id} not found.")

    # RULE: Inspection cannot be performed on completed or cancelled trips
    if trip.status in ["completed", "cancelled", "cancelled_by_driver"]:
        raise HTTPException(
            status_code=400,
            detail=f"Inspection cannot be performed. This trip is already {trip.status.replace('_', ' ')}."
        )

    # RULE: Inspection stop can ONLY be performed after the driver has started the trip
    if trip.status not in ["in_transit", "moving", "started"] and not bool(getattr(trip, "is_live", False)):
        if bool(getattr(trip, "is_return_leg", False)):
            raise HTTPException(
                status_code=400,
                detail="Return trip has not started yet. Inspection stops can only be performed after the driver starts the return trip."
            )
        raise HTTPException(
            status_code=400,
            detail="Trip has not started yet. Inspection stops can only be performed after the driver starts the trip."
        )

    # RULE 2: Distance-based inspection capacity
    trip_dist = calculate_trip_distance_km(trip)
    existing_checkpoints = db.query(models.LogisticsCheckpointModel).filter(
        models.LogisticsCheckpointModel.trip_id == payload.trip_id
    ).all()
    prog = get_trip_inspection_progression(trip, existing_checkpoints, trip_dist)
    max_insp = prog["max_inspections"]
    current_count = len(existing_checkpoints)

    if current_count >= max_insp:
        raise HTTPException(
            status_code=400,
            detail=f"All {max_insp} allowed inspection(s) for this {round(trip_dist)} km trip have already been completed."
        )

    # RULE 3: Strict Checkpoint Station Location Gate:
    # Only the logistics officer stationed at this specific checkpoint location can perform this inspection!
    expected_next_cp = prog["next_inspection_point"]
    target_cp = payload.checkpoint_name or expected_next_cp
    officer_station = (payload.officer_station or "").strip()
    
    if officer_station:
        des_cp = next((d for d in prog.get("designated_checkpoints", []) if (d.get("checkpoint_name") or "").lower() == target_cp.lower()), None)
        if not is_officer_station_authorized_for_target(officer_station, target_cp, des_cp):
            raise HTTPException(
                status_code=403,
                detail=(
                    f"Station Mismatch: Halt #{current_count + 1} ('{target_cp}') can only be inspected "
                    f"by the logistics officer stationed at this checkpoint location. "
                    f"Officer {payload.officer_name} is stationed at '{officer_station}'."
                )
            )

    # RULE 4: Exactly ONE inspection permitted per logistics station / checkpoint point on a trip
    # Downstream logistics officers coming afterwards at their respective locations are permitted to inspect!
    clean_payload_name = (payload.checkpoint_name or "").strip().lower()
    for cp in existing_checkpoints:
        clean_cp_name = (cp.checkpoint_name or "").strip().lower()
        if clean_cp_name and clean_payload_name and clean_cp_name == clean_payload_name:
            rem = max(0, max_insp - len(existing_checkpoints))
            raise HTTPException(
                status_code=400,
                detail=(
                    f"An inspection for this trip has already been conducted at checkpoint '{cp.checkpoint_name}'. "
                    f"Only 1 inspection is permitted per logistics station. "
                    f"Remaining inspections ({rem} halt{'s' if rem != 1 else ''} left) must be performed at downstream checkpoints along the route."
                )
            )

    timestamp_str = datetime.now().strftime("%Y-%m-%d %I:%M %p")

    # Weighbridge calculation
    declared_wt = payload.declared_weight_kg
    if declared_wt is None:
        reqs = db.query(models.RequestModel).filter(
            models.RequestModel.trip_id == payload.trip_id,
            models.RequestModel.status.in_(["accepted", "in_transit", "scheduled"])
        ).all()
        declared_wt = sum(float(r.goods_weight_kg or r.kg or 0) for r in reqs)
        if declared_wt == 0:
            declared_wt = float(trip.total_kg or 1000)

    measured_wt = payload.measured_weight_kg
    discrepancy = None
    is_compliant = True
    if measured_wt is not None:
        discrepancy = round(measured_wt - declared_wt, 2)
        tolerance = max(25.0, declared_wt * 0.08)
        is_compliant = abs(discrepancy) <= tolerance
    if payload.weight_compliant is not None:
        is_compliant = payload.weight_compliant

    resolved_seal_num = payload.seal_number or trip.seal_number or f"SEAL-{trip.id}-{int(datetime.now().timestamp()) % 10000}"
    resolved_seal_status = payload.seal_status or ("Verified & Intact" if payload.cargo_seal_intact else "Tampered / Broken")

    checkpoint = models.LogisticsCheckpointModel(
        trip_id=payload.trip_id,
        checkpoint_name=payload.checkpoint_name,
        checkpoint_type=payload.checkpoint_type or "Highway Toll Plaza",
        officer_name=payload.officer_name,
        officer_phone=payload.officer_phone,
        timestamp=timestamp_str,
        cargo_seal_intact=payload.cargo_seal_intact,
        seal_number=resolved_seal_num,
        seal_status=resolved_seal_status,
        measured_weight_kg=measured_wt,
        declared_weight_kg=declared_wt,
        weight_discrepancy_kg=discrepancy,
        weight_compliant=is_compliant,
        safety_parameters_status=payload.safety_parameters_status or "Compliant",
        cooling_status=payload.cooling_status,
        cargo_condition=payload.cargo_condition,
        ice_status=payload.ice_status,
        temp_celsius=payload.temp_celsius,
        notes=payload.notes,
        proof_image_url=payload.proof_image_url,
        action_taken=payload.action_taken
    )
    db.add(checkpoint)

    # Update trip status and active security indicators
    new_count = current_count + 1
    new_existing = existing_checkpoints + [checkpoint]
    new_prog = get_trip_inspection_progression(trip, new_existing, trip_dist)

    trip.current_checkpoint = payload.checkpoint_name
    trip.checkpoint_count = new_count
    trip.inspection_completed = new_prog["inspection_completed"]
    trip.inspection_status = new_prog["inspection_status"]
    trip.seal_number = resolved_seal_num
    trip.seal_status = resolved_seal_status
    if measured_wt is not None:
        trip.last_weigh_in_kg = measured_wt
    trip.weight_compliant = is_compliant
    db.commit()
    db.refresh(checkpoint)

    # Multi-party sync: Update associated bookings
    req_updates = {
        "seal_status": resolved_seal_status,
        "weight_compliant": is_compliant
    }
    if resolved_seal_num:
        req_updates["seal_number"] = resolved_seal_num
    if payload.temp_celsius is not None:
        req_updates["current_temp_c"] = payload.temp_celsius

    db.query(models.RequestModel).filter(
        models.RequestModel.trip_id == payload.trip_id
    ).update(req_updates, synchronize_session=False)
    db.commit()

    # Nearest Inspection Point Fallback:
    # If ice was unavailable at pickup, add/fulfill ice at this first inspection point
    if current_count == 0:
        deferred_reqs = db.query(models.RequestModel).filter(
            models.RequestModel.trip_id == payload.trip_id,
            models.RequestModel.is_perishable == True,
            models.RequestModel.ice_handling_required == True,
            models.RequestModel.ice_added == False
        ).all()
        for dr in deferred_reqs:
            dr.ice_added = True
            dr.ice_added_stage = "checkpoint"
            dr.ice_added_at = timestamp_str
            dr.ice_unavailable_at_pickup = False
            dr.ice_boxes_count = max(1, (dr.ice_boxes_count or 0) + 1)
        if deferred_reqs:
            db.commit()

    # Dispatch automated WhatsApp & SMS quality alert to driver and connected shippers
    if background_tasks:
        try:
            d_phone, d_lang = resolve_user_contact_and_lang(db, user_id=trip.user_id, username_or_name=trip.owner)
            if d_phone:
                d_msg = msgs.msg_checkpoint_verified(
                    user_name=trip.owner or "Driver",
                    checkpoint_name=payload.checkpoint_name,
                    officer_name=payload.officer_name,
                    condition=f"{payload.cargo_condition} (Seal: {resolved_seal_status}, Weight: {'Compliant' if is_compliant else 'Overweight'})",
                    temp_c=payload.temp_celsius,
                    lang=d_lang
                )
                background_tasks.add_task(dispatch_automated_alert, d_phone, d_msg)

            connected_reqs = db.query(models.RequestModel).filter(
                models.RequestModel.trip_id == payload.trip_id,
                models.RequestModel.status.in_(["accepted", "in_transit", "scheduled"])
            ).all()
            for cr in connected_reqs:
                s_phone, s_lang = resolve_user_contact_and_lang(db, user_id=cr.user_id, username_or_name=cr.farmer_name)
                if s_phone:
                    s_msg = msgs.msg_checkpoint_verified(
                        user_name=cr.farmer_name or "Shipper",
                        checkpoint_name=payload.checkpoint_name,
                        officer_name=payload.officer_name,
                        condition=f"{payload.cargo_condition} (Seal: {resolved_seal_status}, Weight: {'Compliant' if is_compliant else 'Discrepancy'})",
                        temp_c=payload.temp_celsius,
                        lang=s_lang
                    )
                    background_tasks.add_task(dispatch_automated_alert, s_phone, s_msg)
        except Exception as e:
            print(f"Logistics dispatch notice: {e}")

    return {
        "status": "success",
        "message": f"Checkpoint inspection logged at {payload.checkpoint_name}. Halt {new_count}/{max_insp} recorded. Seal: {resolved_seal_status}, Weight: {'Compliant' if is_compliant else 'Flagged'}.",
        "checkpoint_id": checkpoint.id,
        "checkpoint_count": new_count,
        "max_inspections": max_insp,
        "inspections_remaining": new_prog["inspections_remaining"],
        "inspection_completed": new_prog["inspection_completed"],
        "next_inspection_point": new_prog["next_inspection_point"],
        "is_unload_allowed": new_prog["is_unload_allowed"],
        "seal_number": resolved_seal_num,
        "seal_status": resolved_seal_status,
        "weight_compliant": is_compliant,
        "discrepancy_kg": round(float(discrepancy), 2) if discrepancy is not None else 0.0,
        "timestamp": timestamp_str
    }


# =========================================================
# 4. LOADING (PICKUP) & UNLOADING (DROP) ASSISTANCE
# =========================================================

@router.post("/loading-event")
def record_loading_event(
    payload: schemas.LoadingEventRequest,
    db: Session = Depends(get_db)
):
    """
    Supervises cargo handling:
    - 'pickup' (Loading Role): Scales weight verification, security seal application, ice packing.
    - 'drop' (Unloading Role): Unloading verification, seal integrity check before cutting, handover.
    """
    req = db.query(models.RequestModel).filter(models.RequestModel.id == payload.request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail=f"Cargo booking ID {payload.request_id} not found.")

    if req.status in ["cancelled", "cancelled_by_driver", "rejected"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot record loading or unloading. This cargo booking has been {req.status.replace('_', ' ')}."
        )

    if req.trip_id:
        trip = db.query(models.TripModel).filter(models.TripModel.id == req.trip_id).first()
        if trip and trip.status in ["cancelled", "cancelled_by_driver"]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot record loading or unloading. The associated trip #{trip.id} has been {trip.status.replace('_', ' ')}."
            )

    timestamp_str = datetime.now().strftime("%Y-%m-%d %I:%M %p")
    officer_station = (payload.officer_station or "").strip()

    if payload.loading_type == "pickup":
        # Location Gate: Only the logistics officer stationed at this pickup dock can verify and load!
        if officer_station and req.pickup_place:
            if not is_officer_station_authorized_for_target(officer_station, req.pickup_place):
                raise HTTPException(
                    status_code=403,
                    detail=(
                        f"Station Mismatch: Pickup loading and certified weigh-in for cargo #{req.id} "
                        f"can only be performed by the officer stationed at '{req.pickup_place}'. "
                        f"Officer {payload.officer_name} is stationed at '{officer_station}'."
                    )
                )

        req.loading_status = "loaded"
        req.loaded_at = timestamp_str
        req.loaded_by = payload.officer_name
        if payload.verified_weight_kg:
            req.goods_weight_kg = int(payload.verified_weight_kg)
            req.kg = int(payload.verified_weight_kg)
            req.verified_weight_kg = float(payload.verified_weight_kg)
        if payload.seal_number:
            req.seal_number = payload.seal_number
            req.seal_status = payload.seal_status or "Sealed & Intact"
            # Update trip seal as well
            if req.trip_id:
                trip = db.query(models.TripModel).filter(models.TripModel.id == req.trip_id).first()
                if trip:
                    trip.seal_number = payload.seal_number
                    trip.seal_status = payload.seal_status or "Sealed & Intact"

        # PERISHABLE & ICE RULES:
        # Addition of ice box or ice should ONLY show/apply if the user selected a perishable good which needed ice.
        # Ice can be added only once at the starting point (pickup).
        # If ice is not available at pickup, flag for nearest inspection point addition.
        if req.is_perishable and req.ice_handling_required:
            if payload.ice_boxes_added and int(payload.ice_boxes_added) > 0 and not payload.ice_unavailable_at_pickup:
                req.ice_boxes_count = int(payload.ice_boxes_added)
                req.ice_added = True
                req.ice_added_stage = "pickup"
                req.ice_added_at = timestamp_str
                req.ice_unavailable_at_pickup = False
            else:
                req.ice_boxes_count = 0
                req.ice_added = False
                req.ice_unavailable_at_pickup = True
        else:
            req.ice_boxes_count = 0
            req.ice_added = False
            req.ice_unavailable_at_pickup = False

        if payload.temp_celsius is not None:
            req.current_temp_c = payload.temp_celsius

        msg = f"Cargo verified with security seal {req.seal_number or 'applied'} and loaded by Officer {payload.officer_name}."
        if req.is_perishable and req.ice_handling_required:
            if req.ice_added:
                msg += f" (Supplied {req.ice_boxes_count} cold-chain ice boxes at pickup dock)."
            else:
                msg += " (Ice unavailable at pickup dock; deferred to nearest highway inspection checkpoint)."
    else:
        # Validation 1: Cargo must already be loaded at pickup
        if req.loading_status != "loaded":
            raise HTTPException(
                status_code=400,
                detail="Cannot perform drop unloading before cargo has been loaded onto the vehicle at pickup."
            )

        # Validation 2: The trip must have actually started and completed all corridor inspections
        if req.trip_id:
            trip = db.query(models.TripModel).filter(models.TripModel.id == req.trip_id).first()
            if trip:
                trip_started = bool((trip.status in ["in_transit", "moving", "started", "pending_passenger_confirmation", "completed"]) or bool(getattr(trip, "is_live", False)))
                if not trip_started:
                    raise HTTPException(
                        status_code=400,
                        detail="Trip has not started yet. Unloading can only be performed after the driver departs and the trip is underway."
                    )

                # Validation 3: All required highway checkpoint inspections along the corridor must be completed!
                trip_cps = db.query(models.LogisticsCheckpointModel).filter(
                    models.LogisticsCheckpointModel.trip_id == trip.id
                ).all()
                trip_dist = calculate_trip_distance_km(trip)
                prog = get_trip_inspection_progression(trip, trip_cps, trip_dist)
                if not prog["is_unload_allowed"]:
                    raise HTTPException(
                        status_code=400,
                        detail=prog["unload_lock_reason"] or f"Unloading locked: {prog['inspections_remaining']} required highway inspection(s) remaining along the corridor."
                    )

        # Validation 4: Location Gate - Only the officer stationed at this delivery place can supervise unload and handover!
        target_delivery = extract_delivery_destination(req.route, trip.to_loc if trip else None)
        if officer_station and target_delivery:
            if not is_officer_station_authorized_for_target(officer_station, target_delivery):
                raise HTTPException(
                    status_code=403,
                    detail=(
                        f"Station Mismatch: Final delivery unloading and consignee handover for cargo #{req.id} "
                        f"can only be supervised by the officer stationed at destination '{target_delivery}'. "
                        f"Officer {payload.officer_name} is stationed at '{officer_station}'."
                    )
                )


        req.loading_status = "unloaded"
        req.unloaded_at = timestamp_str
        req.unloaded_by = payload.officer_name
        req.seal_status = "Unsealed & Verified at Destination"
        req.status = "completed"
        if payload.temp_celsius is not None:
            req.current_temp_c = payload.temp_celsius
        # Save delivery proof image captured by logistics officer at destination
        if payload.delivery_proof_image_url:
            req.delivery_proof_image_url = payload.delivery_proof_image_url

        # Mark parent trip completed if all active cargo shipments are unloaded
        if req.trip_id and trip:
            other_active_reqs = db.query(models.RequestModel).filter(
                models.RequestModel.trip_id == trip.id,
                models.RequestModel.id != req.id,
                ~models.RequestModel.status.in_(["cancelled", "cancelled_by_driver", "rejected"])
            ).all()
            if all(r.loading_status == "unloaded" or r.status in ["completed", "delivered"] for r in other_active_reqs):
                trip.status = "completed"
                trip.is_live = False
                trip.speed = 0.0

        msg = f"Cargo safely unsealed, verified, and handed over to consignee by Officer {payload.officer_name}."

    if payload.notes:
        existing_feedback = req.feedback or ""
        req.feedback = f"{existing_feedback} | Logistics: {payload.notes}".strip(" |")

    db.commit()
    db.refresh(req)

    return {
        "status": "success",
        "message": msg,
        "loading_status": req.loading_status,
        "seal_number": req.seal_number,
        "seal_status": req.seal_status,
        "timestamp": timestamp_str,
        "cargo_id": req.id,
        "current_temp_c": req.current_temp_c,
        "ice_added": req.ice_added,
        "ice_boxes_count": req.ice_boxes_count,
        "ice_unavailable_at_pickup": req.ice_unavailable_at_pickup,
        "delivery_proof_image_url": req.delivery_proof_image_url
    }


# =========================================================
# 5. PERISHABILITY & COLD-CHAIN ICE HANDLING
# =========================================================

@router.post("/ice-handling")
def record_ice_handling(
    payload: schemas.IceHandlingRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Manages ice replenishment under strict lifecycle invariants:
    1. Applicable ONLY if the user selected a perishable good which needed ice.
    2. Ice can be added ONLY ONCE.
    3. Addition of ice is available at the time of pickup (starting point).
       After pickup, addition of ice is locked and NOT available,
       UNLESS ice was unavailable at pickup, in which case it is added at the nearest inspection point.
    """
    updated_items = 0
    new_temp = payload.temp_after if payload.temp_after is not None else 2.5
    timestamp_str = datetime.now().strftime("%Y-%m-%d %I:%M %p")

    targets = []
    if payload.request_id:
        r = db.query(models.RequestModel).filter(models.RequestModel.id == payload.request_id).first()
        if r:
            targets.append(r)
    elif payload.trip_id:
        targets = db.query(models.RequestModel).filter(
            models.RequestModel.trip_id == payload.trip_id,
            models.RequestModel.is_perishable == True,
            models.RequestModel.ice_handling_required == True
        ).all()

    if not targets:
        raise HTTPException(status_code=404, detail="No perishable shipments requiring ice found.")

    for req in targets:
        # Rule 1: Must be perishable good which needed ice
        if not (req.is_perishable and req.ice_handling_required):
            raise HTTPException(
                status_code=400,
                detail=f"Ice addition is not available for '{req.cargo_type or 'this cargo'}'. Only perishable goods requiring ice support ice addition."
            )

        # Rule 2: Ice can be added ONLY ONCE
        if getattr(req, "ice_added", False):
            raise HTTPException(
                status_code=400,
                detail=f"Ice has already been supplied for this shipment at {req.ice_added_stage or 'starting point'} ({req.ice_added_at or ''}). Ice can only be added once."
            )

        # Rule 3: Available at pickup; after pickup, only at nearest inspection point if unavailable at pickup
        is_at_pickup = (req.loading_status == "pending")
        ice_missed_at_pickup = getattr(req, "ice_unavailable_at_pickup", False) or (getattr(req, "ice_boxes_count", 0) == 0)

        officer_station = (payload.officer_station or "").strip()
        if is_at_pickup and officer_station and req.pickup_place:
            if not is_officer_station_authorized_for_target(officer_station, req.pickup_place):
                raise HTTPException(
                    status_code=403,
                    detail=f"Station Mismatch: Ice addition at pickup dock must be supplied by the officer stationed at '{req.pickup_place}'. Your station is '{officer_station}'."
                )

        trip = db.query(models.TripModel).filter(models.TripModel.id == req.trip_id).first() if req.trip_id else None
        checkpoint_count = getattr(trip, "checkpoint_count", 0) if trip else 0

        if not is_at_pickup:
            if not ice_missed_at_pickup:
                raise HTTPException(
                    status_code=400,
                    detail="Addition of ice is not available after pickup. Ice can only be added once at the starting point."
                )
            if checkpoint_count > 1 and payload.stage != "checkpoint":
                raise HTTPException(
                    status_code=400,
                    detail="The nearest inspection point has already passed. Ice addition is no longer available."
                )

        req.current_temp_c = new_temp
        req.is_perishable = True
        req.ice_handling_required = True
        boxes_to_add = int(payload.ice_kg_added / 5) if payload.ice_kg_added >= 5 else 1
        req.ice_boxes_count = max(1, (req.ice_boxes_count or 0) + boxes_to_add)
        req.ice_added = True
        req.ice_added_stage = "pickup" if is_at_pickup else "checkpoint"
        req.ice_added_at = timestamp_str
        req.ice_unavailable_at_pickup = False
        updated_items += 1

        if background_tasks:
            try:
                s_phone, s_lang = resolve_user_contact_and_lang(db, user_id=req.user_id, username_or_name=req.farmer_name)
                if s_phone:
                    ice_msg = msgs.msg_ice_replenished(
                        shipper_name=req.farmer_name or "Shipper",
                        commodity=req.cargo_type or "Perishable Goods",
                        ice_kg=payload.ice_kg_added,
                        ice_type=payload.ice_type,
                        temp_c=new_temp,
                        lang=s_lang
                    )
                    background_tasks.add_task(dispatch_automated_alert, s_phone, ice_msg)
            except Exception as e:
                print(f"Ice dispatch notice: {e}")

    db.commit()

    return {
        "status": "success",
        "message": f"Successfully added {payload.ice_kg_added}kg of {payload.ice_type}. Temperature stabilized at {new_temp}°C (One-time addition logged).",
        "ice_kg_added": payload.ice_kg_added,
        "ice_type": payload.ice_type,
        "core_temperature_celsius": new_temp,
        "safe_preservation_window_hours": 8.0 if payload.ice_type == "Dry Ice" else 5.5,
        "spoilage_risk": "Low (Optimally Chilled)" if new_temp <= 4.0 else "Moderate",
        "updated_shipments_count": updated_items
    }
