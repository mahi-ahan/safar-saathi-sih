"""
Trip & Vehicle State Machine Service.

Enforces strict lifecycle invariants:
1. Inspection must NOT start automatically.
2. Only ONE inspection per trip.
3. Return trip must be locked until outbound trip reaches Goods Area.
4. Goods Area confirmation sequence:
   Trip Started -> Vehicle Travelling -> Vehicle Reaches Goods Area -> Mark/Confirm Reached -> Return Trip Enabled -> Return Trip Started.
5. No fake or auto-completed states.
6. Per-trip state isolation.
7. Prevention of duplicate actions.
"""



class InspectionState:
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class GoodsAreaState:
    NOT_STARTED = "not_started"
    TRAVELLING = "travelling"
    REACHED = "reached"
    CONFIRMED = "confirmed"
    RETURN_ENABLED = "return_enabled"
    RETURN_STARTED = "return_started"


# ---------------------------------------------------------------------------
# Inspection Validation
# ---------------------------------------------------------------------------

def can_start_inspection(trip) -> tuple[bool, str | None]:
    """
    Inspection can ONLY start after the trip has been started by the driver.
    Inspection must NOT start automatically and cannot exceed distance-based capacity.
    """
    trip_status = getattr(trip, "status", "scheduled")
    is_live = bool(getattr(trip, "is_live", False))

    # Block inspection for completed or cancelled trips
    if trip_status in ["completed", "cancelled", "cancelled_by_driver"]:
        return False, f"Inspection cannot be started. This trip is already {trip_status.replace('_', ' ')}."

    if trip_status not in ["in_transit", "moving", "started"] and not is_live:
        if bool(getattr(trip, "is_return_leg", False)):
            return False, "Return trip has not started yet. Inspection stops can only be performed after the driver starts the return trip."
        return False, "Trip has not started yet. Inspection stops can only be performed after the driver starts the trip."

    # Distance-based inspection capacity check
    from routers.logistics import calculate_trip_distance_km, get_max_inspections_for_distance
    try:
        trip_dist = calculate_trip_distance_km(trip)
    except Exception:
        trip_dist = float(getattr(trip, "distance_km", 150.0) or 150.0)
    max_insp = get_max_inspections_for_distance(trip_dist)
    curr_count = getattr(trip, "checkpoint_count", 0) or 0

    if curr_count >= max_insp:
        return False, f"All {max_insp} allowed inspection(s) for this {round(trip_dist)} km trip have already been completed."

    if getattr(trip, "inspection_status", None) == InspectionState.IN_PROGRESS:
        return False, "An inspection session is already in progress for this trip. Duplicate start requests are prohibited."

    return True, None


def can_complete_inspection(trip) -> tuple[bool, str | None]:
    """
    Inspection can only be completed if the trip has started and an active session is in progress.
    """
    trip_status = getattr(trip, "status", "scheduled")
    is_live = bool(getattr(trip, "is_live", False))

    # Block inspection for completed or cancelled trips
    if trip_status in ["completed", "cancelled", "cancelled_by_driver"]:
        return False, f"Inspection cannot be completed. This trip is already {trip_status.replace('_', ' ')}."

    if trip_status not in ["in_transit", "moving", "started"] and not is_live:
        if bool(getattr(trip, "is_return_leg", False)):
            return False, "Return trip has not started yet. Inspection stops can only be performed after the driver starts the return trip."
        return False, "Trip has not started yet. Inspection stops can only be performed after the driver starts the trip."

    from routers.logistics import calculate_trip_distance_km, get_max_inspections_for_distance
    try:
        trip_dist = calculate_trip_distance_km(trip)
    except Exception:
        trip_dist = float(getattr(trip, "distance_km", 150.0) or 150.0)
    max_insp = get_max_inspections_for_distance(trip_dist)
    curr_count = getattr(trip, "checkpoint_count", 0) or 0

    if curr_count >= max_insp:
        return False, f"All {max_insp} allowed inspection(s) for this {round(trip_dist)} km trip have already been confirmed."

    current_status = getattr(trip, "inspection_status", InspectionState.NOT_STARTED)
    if current_status != InspectionState.IN_PROGRESS:
        return False, "Inspection cannot be completed because it has not been started yet. Click 'Start Inspection' first."

    return True, None


# ---------------------------------------------------------------------------
# Goods Area & Return Trip Validation
# ---------------------------------------------------------------------------

def can_reach_goods_area(trip) -> tuple[bool, str | None]:
    """
    Vehicle reaches Goods Area only after it has started and is travelling.
    """
    current_status = getattr(trip, "goods_area_status", GoodsAreaState.NOT_STARTED) or GoodsAreaState.NOT_STARTED

    if current_status in [GoodsAreaState.REACHED, GoodsAreaState.CONFIRMED, GoodsAreaState.RETURN_ENABLED, GoodsAreaState.RETURN_STARTED]:
        return False, "Vehicle has already reached the Goods Area."

    trip_status = getattr(trip, "status", "scheduled")
    if trip_status not in ["in_transit", "moving", "started"]:
        # If the trip status is scheduled, it hasn't begun travelling
        return False, "Vehicle must be in-transit before reaching the Goods Area."

    return True, None


def can_confirm_goods_area(trip) -> tuple[bool, str | None]:
    """
    Goods Area confirmation must occur only AFTER the vehicle has reached the Goods Area.
    Cannot be confirmed more than once (prevents duplicates).
    """
    current_status = getattr(trip, "goods_area_status", GoodsAreaState.NOT_STARTED) or GoodsAreaState.NOT_STARTED

    if current_status in [GoodsAreaState.CONFIRMED, GoodsAreaState.RETURN_ENABLED, GoodsAreaState.RETURN_STARTED]:
        return False, "Goods Area arrival has already been confirmed. Duplicate confirmations are rejected."

    if current_status != GoodsAreaState.REACHED:
        return False, "Cannot confirm Goods Area arrival before the vehicle actually arrives at the Goods Area."

    return True, None


def can_start_return_trip(trip, outbound_trip=None) -> tuple[bool, str | None]:
    """
    Return trip can start ONLY after the specific vehicle has actually reached
    the Goods Area AND had its arrival confirmed.
    """
    # Case A: Return leg linked to a primary outbound trip
    if bool(getattr(trip, "is_return_leg", False)) and outbound_trip:
        outbound_ga_status = getattr(outbound_trip, "goods_area_status", GoodsAreaState.NOT_STARTED) or GoodsAreaState.NOT_STARTED
        outbound_status = getattr(outbound_trip, "status", None)

        # Outbound is reached & confirmed if goods_area_status is confirmed/enabled OR outbound trip status is completed/pending_passenger_confirmation
        is_ga_confirmed = (
            outbound_ga_status in [GoodsAreaState.CONFIRMED, GoodsAreaState.RETURN_ENABLED, GoodsAreaState.RETURN_STARTED] or
            outbound_status in ["completed", "pending_passenger_confirmation"]
        )
        if not is_ga_confirmed:
            return False, f"Return trip is locked. Outbound journey ({outbound_trip.from_loc} → {outbound_trip.to_loc}) must reach the Goods Area and be confirmed before the return run can start."

        # Check if this return leg itself has already started
        if getattr(trip, "status", None) in ["in_transit", "completed"]:
            return False, "Return trip has already been started."
        return True, None

    # Case B: Single trip managing its own round-trip / return lifecycle directly
    current_status = getattr(trip, "goods_area_status", GoodsAreaState.NOT_STARTED) or GoodsAreaState.NOT_STARTED
    if current_status == GoodsAreaState.RETURN_STARTED:
        return False, "Return trip has already been started for this vehicle. Duplicate start requests are prohibited."

    if current_status not in [GoodsAreaState.CONFIRMED, GoodsAreaState.RETURN_ENABLED] and getattr(trip, "status", None) != "completed":
        return False, "Return trip is locked. You must first reach the Goods Area and mark arrival as confirmed before starting the return journey."

    return True, None


def get_trip_state_summary(trip) -> dict:
    """
    Returns the comprehensive state machine summary for a trip.
    """
    from routers.logistics import calculate_trip_distance_km, get_max_inspections_for_distance
    try:
        trip_dist = calculate_trip_distance_km(trip)
    except Exception:
        trip_dist = float(getattr(trip, "distance_km", 150.0) or 150.0)
    max_insp = get_max_inspections_for_distance(trip_dist)
    curr_count = getattr(trip, "checkpoint_count", 0) or 0
    insp_completed = curr_count >= max_insp
    insp_status = InspectionState.COMPLETED if insp_completed else (getattr(trip, "inspection_status", InspectionState.NOT_STARTED) or InspectionState.NOT_STARTED)
    if insp_status == InspectionState.COMPLETED and not insp_completed:
        insp_status = InspectionState.IN_PROGRESS if curr_count > 0 else InspectionState.NOT_STARTED

    ga_status = getattr(trip, "goods_area_status", GoodsAreaState.NOT_STARTED) or GoodsAreaState.NOT_STARTED

    # Sequence derived flags
    trip_started = getattr(trip, "status", "scheduled") in ["in_transit", "moving", "started", "completed"] or ga_status != GoodsAreaState.NOT_STARTED
    vehicle_travelling = getattr(trip, "status", "scheduled") in ["in_transit", "moving"] and ga_status in [GoodsAreaState.NOT_STARTED, GoodsAreaState.TRAVELLING]
    vehicle_reached = ga_status in [GoodsAreaState.REACHED, GoodsAreaState.CONFIRMED, GoodsAreaState.RETURN_ENABLED, GoodsAreaState.RETURN_STARTED]
    goods_area_confirmed = ga_status in [GoodsAreaState.CONFIRMED, GoodsAreaState.RETURN_ENABLED, GoodsAreaState.RETURN_STARTED]
    return_trip_enabled = ga_status in [GoodsAreaState.CONFIRMED, GoodsAreaState.RETURN_ENABLED, GoodsAreaState.RETURN_STARTED]
    return_trip_started = ga_status == GoodsAreaState.RETURN_STARTED

    can_start_insp, _ = can_start_inspection(trip)

    return {
        "trip_id": getattr(trip, "id", None),
        "distance_km": trip_dist,
        "max_inspections": max_insp,
        "checkpoint_count": curr_count,
        "inspections_remaining": max(0, max_insp - curr_count),
        "inspection_status": insp_status,
        "inspection_completed": insp_completed,
        "can_start_inspection": can_start_insp,
        "goods_area_status": ga_status,
        "trip_started": trip_started,
        "vehicle_travelling": vehicle_travelling,
        "vehicle_reaches_goods_area": vehicle_reached,
        "goods_area_confirmed": goods_area_confirmed,
        "return_trip_enabled": return_trip_enabled,
        "return_trip_started": return_trip_started,
        "goods_area_reached_at": getattr(trip, "goods_area_reached_at", None),
        "goods_area_confirmed_at": getattr(trip, "goods_area_confirmed_at", None),
        "return_started_at": getattr(trip, "return_started_at", None),
    }
