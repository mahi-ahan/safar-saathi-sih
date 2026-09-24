# models.py
from database import Base  # <--- MAKE SURE THIS LINE IS AT THE TOP
from sqlalchemy import Boolean, Column, Float, Integer, String, ForeignKey


class TripModel(Base):
  __tablename__ = "trips"

  id = Column(Integer, primary_key=True, index=True)
  user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
  driver_phone = Column(String, nullable=True)
  state = Column(String, index=True)
  from_loc = Column(String, index=True)
  to_loc = Column(String, index=True)
  date = Column(String)
  vehicle = Column(String)
  owner = Column(String)
  verified = Column(Boolean, default=False)
  pct = Column(Integer, default=0)
  total_kg = Column(Integer, default=1000)
  price_per_kg = Column(Integer, default=0)
  total_driver_amount = Column(Float, default=0.0)
  distance_km = Column(Float, default=150.0)
  pickup = Column(String)
  lat = Column(Float, default=0.0)
  lng = Column(Float, default=0.0)
  dest_lat = Column(Float, nullable=True, default=0.0)
  dest_lng = Column(Float, nullable=True, default=0.0)
  pickup_lat = Column(Float, nullable=True, default=0.0)
  pickup_lng = Column(Float, nullable=True, default=0.0)
  status = Column(String, default="scheduled")
  is_live = Column(Boolean, default=False)
  speed = Column(Float, default=0.0)
  delivery_proof_image_url = Column(String, nullable=True)
  preferred_lang = Column(String, default="hi")
  return_trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True, index=True)
  is_return_leg = Column(Boolean, default=False)
  return_discount_pct = Column(Integer, default=0)
  has_perishables = Column(Boolean, default=False)
  ice_handling_supported = Column(Boolean, default=True)
  current_checkpoint = Column(String, nullable=True)
  checkpoint_count = Column(Integer, default=0)
  cargo_category = Column(String, default="general")
  dedicated_sub_category = Column(String, nullable=True)
  is_dedicated = Column(Boolean, default=False)
  seal_number = Column(String, nullable=True)
  seal_status = Column(String, default="Pending")
  last_weigh_in_kg = Column(Float, nullable=True)
  weight_compliant = Column(Boolean, default=True)
  cooling_type = Column(String, nullable=True)
  target_temp_c = Column(Float, nullable=True)
  # State Machine lifecycle fields
  inspection_status = Column(String, default="not_started")  # not_started, in_progress, completed
  inspection_completed = Column(Boolean, default=False)
  goods_area_status = Column(String, default="not_started")  # not_started, travelling, reached, confirmed, return_enabled, return_started
  goods_area_reached_at = Column(String, nullable=True)
  goods_area_confirmed_at = Column(String, nullable=True)
  return_started_at = Column(String, nullable=True)


class RequestModel(Base):
  __tablename__ = "requests"

  id = Column(String, primary_key=True, index=True)
  trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True, index=True)
  trip_date = Column(String, nullable=True)
  status = Column(String, default="pending")
  route = Column(String)
  vehicle = Column(String)
  owner = Column(String)
  farmer_name = Column(String)
  kg = Column(Integer)
  goods_weight_kg = Column(Integer, nullable=True)
  distance_km = Column(Float, default=150.0)
  kg_km = Column(Float, default=0.0)
  per_person_share = Column(Float, default=0.0)
  user_id = Column(Integer, nullable=True)
  pickup_date = Column(String, nullable=True)
  pickup_time = Column(String, nullable=True)
  pickup_place = Column(String, nullable=True)
  delivery_date = Column(String, nullable=True)
  pickup_lat = Column(Float, nullable=True, default=0.0)
  pickup_lng = Column(Float, nullable=True, default=0.0)
  delivery_lat = Column(Float, nullable=True, default=0.0)
  delivery_lng = Column(Float, nullable=True, default=0.0)
  pickup_cargo_image_url = Column(String, nullable=True)
  delivery_proof_image_url = Column(String, nullable=True)
  reason = Column(String, nullable=True)
  rating = Column(Integer, nullable=True)
  feedback = Column(String, nullable=True)
  preferred_lang = Column(String, default="hi")
  is_perishable = Column(Boolean, default=False)
  cargo_type = Column(String, nullable=True)
  ice_handling_required = Column(Boolean, default=False)
  current_temp_c = Column(Float, nullable=True)
  loading_status = Column(String, default="pending")  # pending, loaded, unloaded
  loaded_at = Column(String, nullable=True)
  loaded_by = Column(String, nullable=True)
  unloaded_at = Column(String, nullable=True)
  unloaded_by = Column(String, nullable=True)
  ice_boxes_count = Column(Integer, default=0)
  cargo_category = Column(String, default="general")
  dedicated_sub_category = Column(String, nullable=True)
  is_dedicated = Column(Boolean, default=False)
  seal_number = Column(String, nullable=True)
  seal_status = Column(String, default="Pending")
  verified_weight_kg = Column(Float, nullable=True)
  weight_compliant = Column(Boolean, default=True)
  cooling_type = Column(String, nullable=True)
  target_temp_c = Column(Float, nullable=True)


class LogisticsCheckpointModel(Base):
  __tablename__ = "logistics_checkpoints"

  id = Column(Integer, primary_key=True, index=True)
  trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True, index=True)
  checkpoint_name = Column(String, index=True)
  officer_name = Column(String)
  officer_phone = Column(String, nullable=True)
  timestamp = Column(String)
  cargo_seal_intact = Column(Boolean, default=True)
  cargo_condition = Column(String, default="Good")
  ice_status = Column(String, default="Adequate")
  temp_celsius = Column(Float, nullable=True)
  notes = Column(String, nullable=True)
  proof_image_url = Column(String, nullable=True)
  action_taken = Column(String, nullable=True)
  seal_number = Column(String, nullable=True)
  seal_status = Column(String, default="Verified & Intact")
  measured_weight_kg = Column(Float, nullable=True)
  declared_weight_kg = Column(Float, nullable=True)
  weight_discrepancy_kg = Column(Float, nullable=True)
  weight_compliant = Column(Boolean, default=True)
  safety_parameters_status = Column(String, default="Compliant")
  cooling_status = Column(String, nullable=True)
  checkpoint_type = Column(String, default="Highway Toll Plaza")


class RoutePricingCache(Base):
    __tablename__ = "route_pricing_cache"

    id = Column(Integer, primary_key=True, index=True)
    origin = Column(String, index=True)
    destination = Column(String, index=True)
    distance_km = Column(Float, default=0.0)
    vehicle_model = Column(String, index=True)
    fair_min_price = Column(Float, default=0.0)
    fair_max_price = Column(Float, default=0.0)
    breakdown_json = Column(String, nullable=True)
    created_at = Column(String, nullable=True)


class PtlCostDistributionCache(Base):
    __tablename__ = "ptl_cost_distribution_cache"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, index=True, nullable=True)
    is_shared = Column(Boolean, default=False)
    sharers_count = Column(Integer, default=1)
    user_pickup_loc = Column(String, nullable=True)
    user_delivery_loc = Column(String, nullable=True)
    user_segment_distance_km = Column(Float, default=0.0)
    user_weight_kg = Column(Float, default=0.0)
    total_vehicle_price = Column(Float, default=0.0)
    user_final_price = Column(Float, default=0.0)
    distribution_details_json = Column(String, nullable=True)
    created_at = Column(String, nullable=True)



from enum import Enum

from sqlalchemy import Column, Integer, String, Enum as SQLEnum, ForeignKey
from database import Base
from sqlalchemy.orm import relationship


class UserRole(str, Enum):
    USER = "user"
    DRIVER = "driver"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )
    email = Column(String, unique=True, index=True)
    password = Column(
        String,
        nullable=True
    )

    role = Column(
        SQLEnum(UserRole),
        nullable=False,
        default=UserRole.USER
    )
    profile = relationship("UserProfile", back_populates="user", uselist=False)


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    phone_number = Column(String, nullable=True)
    user_type = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    aadhaar_doc = Column(String, nullable=True)
    license_doc = Column(String, nullable=True)
    id_proof_doc = Column(String, nullable=True)
    assigned_station = Column(String, nullable=True)
    station_lat = Column(Float, nullable=True)
    station_lng = Column(Float, nullable=True)
    is_verified = Column(Boolean, default=False)
    preferred_lang = Column(String, default="hi")

    user = relationship("User", back_populates="profile")