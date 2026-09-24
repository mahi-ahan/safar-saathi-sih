/**
 * Safar-Saathi Deterministic Trip & Vehicle State Machine
 *
 * Strict Rules Enforced:
 * 1. Inspection must NOT start automatically.
 * 2. Only ONE inspection session per trip.
 * 3. Return trip locked until outbound journey reaches & confirms Goods Area arrival.
 * 4. Goods Area confirmation sequence:
 *    Trip Started -> Vehicle Travelling -> Vehicle Reaches Goods Area -> Mark/Confirm Reached -> Return Trip Enabled -> Return Trip Started.
 * 5. No fake or auto-completed states.
 * 6. Per-trip state isolation (keyed by unique tripId/vehicleId).
 * 7. Duplicate actions strictly prevented (one-way terminal transitions).
 */

export const INSPECTION_STATES = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

export const GOODS_AREA_STATES = {
  NOT_STARTED: 'not_started',
  TRAVELLING: 'travelling',
  REACHED: 'reached',
  CONFIRMED: 'confirmed',
  RETURN_ENABLED: 'return_enabled',
  RETURN_STARTED: 'return_started'
};

const STORAGE_PREFIX = 'ss_trip_state_';

/**
 * Retrieves the isolated state for a specific tripId / vehicle ID.
 * Merges localStorage with any authoritative backend fields provided in initialTrip.
 */
export function getTripStateMachine(tripId, initialTrip = null) {
  if (!tripId) {
    return {
      tripId: null,
      inspection_status: INSPECTION_STATES.NOT_STARTED,
      inspection_completed: false,
      goods_area_status: GOODS_AREA_STATES.NOT_STARTED,
      goods_area_reached_at: null,
      goods_area_confirmed_at: null,
      return_started_at: null
    };
  }

  let stored = null;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${tripId}`);
      if (raw) stored = JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse trip state from localStorage', e);
    }
  }

  // Authoritative fallback precedence: backend fields > localStorage > initial defaults
  const inspection_status =
    initialTrip?.inspection_status ||
    stored?.inspection_status ||
    (initialTrip?.inspection_completed ? INSPECTION_STATES.COMPLETED : INSPECTION_STATES.NOT_STARTED);

  const inspection_completed =
    Boolean(initialTrip?.inspection_completed) ||
    inspection_status === INSPECTION_STATES.COMPLETED ||
    Boolean(stored?.inspection_completed);

  const goods_area_status =
    initialTrip?.goods_area_status ||
    stored?.goods_area_status ||
    (initialTrip?.status === 'in_transit' || initialTrip?.is_live ? GOODS_AREA_STATES.TRAVELLING : GOODS_AREA_STATES.NOT_STARTED);

  const state = {
    tripId,
    inspection_status: inspection_completed ? INSPECTION_STATES.COMPLETED : inspection_status,
    inspection_completed,
    goods_area_status,
    goods_area_reached_at: initialTrip?.goods_area_reached_at || stored?.goods_area_reached_at || null,
    goods_area_confirmed_at: initialTrip?.goods_area_confirmed_at || stored?.goods_area_confirmed_at || null,
    return_started_at: initialTrip?.return_started_at || stored?.return_started_at || null
  };

  return state;
}

/**
 * Persists updated state for a specific tripId / vehicle ID.
 */
export function saveTripStateMachine(tripId, updatedFields) {
  if (!tripId || typeof window === 'undefined' || !window.localStorage) return;
  try {
    const existing = getTripStateMachine(tripId);
    const merged = { ...existing, ...updatedFields };
    window.localStorage.setItem(`${STORAGE_PREFIX}${tripId}`, JSON.stringify(merged));
  } catch (e) {
    console.warn('Failed to persist trip state', e);
  }
}

// ---------------------------------------------------------------------------
// Transition Condition Validators (Rules 1, 2, 3, 4, 7)
// ---------------------------------------------------------------------------

export function canStartInspection(state) {
  if (!state) return false;
  // Strictly disallow if already completed or currently in progress
  if (state.inspection_completed || state.inspection_status === INSPECTION_STATES.COMPLETED) {
    return false;
  }
  return state.inspection_status === INSPECTION_STATES.NOT_STARTED;
}

export function canCompleteInspection(state) {
  if (!state) return false;
  if (state.inspection_completed || state.inspection_status === INSPECTION_STATES.COMPLETED) {
    return false;
  }
  return state.inspection_status === INSPECTION_STATES.IN_PROGRESS;
}

export function canReachGoodsArea(state) {
  if (!state) return false;
  return (
    state.goods_area_status === GOODS_AREA_STATES.NOT_STARTED ||
    state.goods_area_status === GOODS_AREA_STATES.TRAVELLING
  );
}

export function canConfirmGoodsArea(state) {
  if (!state) return false;
  // Rule 4 & 7: Only transition when status is strictly REACHED. Once confirmed, never allow duplicate confirmation.
  return state.goods_area_status === GOODS_AREA_STATES.REACHED;
}

export function canStartReturnTrip(state) {
  if (!state) return false;
  // Rule 3, 4 & 7: Return trip unlocked ONLY after Goods Area arrival is confirmed. Cannot trigger again if already started.
  if (state.goods_area_status === GOODS_AREA_STATES.RETURN_STARTED) {
    return false;
  }
  return (
    state.goods_area_status === GOODS_AREA_STATES.CONFIRMED ||
    state.goods_area_status === GOODS_AREA_STATES.RETURN_ENABLED
  );
}

// ---------------------------------------------------------------------------
// State Machine Action Handlers
// ---------------------------------------------------------------------------

/**
 * Rule 1 & 2: Starts inspection only upon explicit click.
 */
export async function actionStartInspection(tripId, token = null) {
  const current = getTripStateMachine(tripId);
  if (!canStartInspection(current)) {
    throw new Error('Inspection has already been started or completed for this trip.');
  }

  const newState = {
    ...current,
    inspection_status: INSPECTION_STATES.IN_PROGRESS
  };
  saveTripStateMachine(tripId, newState);

  // Sync to backend if numeric backend trip
  if (Number.isInteger(Number(tripId)) && Number(tripId) > 0) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`http://localhost:8000/api/trips/${tripId}/inspection/start`, {
        method: 'POST',
        headers
      });
    } catch (e) {
      console.warn('Backend inspection start sync failed (working offline)', e);
    }
  }

  return newState;
}

/**
 * Rule 2 & 7: Completes the inspection session and locks it permanently.
 */
export async function actionCompleteInspection(tripId, payload = {}, token = null) {
  const current = getTripStateMachine(tripId);
  if (!canCompleteInspection(current)) {
    throw new Error('Cannot complete inspection. No inspection session currently in progress.');
  }

  const newState = {
    ...current,
    inspection_status: INSPECTION_STATES.COMPLETED,
    inspection_completed: true
  };
  saveTripStateMachine(tripId, newState);

  if (Number.isInteger(Number(tripId)) && Number(tripId) > 0) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`http://localhost:8000/api/trips/${tripId}/inspection/complete`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('Backend inspection complete sync failed', e);
    }
  }

  return newState;
}

/**
 * Step 3: Vehicle physically reaches the Goods Area.
 */
export async function actionReachGoodsArea(tripId, token = null) {
  const current = getTripStateMachine(tripId);
  if (!canReachGoodsArea(current)) return current;

  const now = new Date().toISOString();
  const newState = {
    ...current,
    goods_area_status: GOODS_AREA_STATES.REACHED,
    goods_area_reached_at: now
  };
  saveTripStateMachine(tripId, newState);

  if (Number.isInteger(Number(tripId)) && Number(tripId) > 0) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`http://localhost:8000/api/trips/${tripId}/goods-area/reach`, {
        method: 'POST',
        headers
      });
    } catch (e) {
      console.warn('Backend reach sync failed', e);
    }
  }

  return newState;
}

/**
 * Step 4 & 7: Mark/Confirm Reached.
 * Unlocks the return trip. Cannot be called more than once.
 */
export async function actionConfirmGoodsArea(tripId, token = null) {
  const current = getTripStateMachine(tripId);
  if (!canConfirmGoodsArea(current)) {
    throw new Error('Cannot confirm Goods Area arrival. Vehicle must reach Goods Area first, and duplicate confirmations are rejected.');
  }

  const now = new Date().toISOString();
  const newState = {
    ...current,
    goods_area_status: GOODS_AREA_STATES.CONFIRMED,
    goods_area_confirmed_at: now
  };
  saveTripStateMachine(tripId, newState);

  if (Number.isInteger(Number(tripId)) && Number(tripId) > 0) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`http://localhost:8000/api/trips/${tripId}/goods-area/confirm`, {
        method: 'POST',
        headers
      });
    } catch (e) {
      console.warn('Backend confirm sync failed', e);
    }
  }

  return newState;
}

/**
 * Step 6 & 7: Starts the return journey.
 * Permitted only after Goods Area is confirmed.
 */
export async function actionStartReturnTrip(tripId, token = null) {
  const current = getTripStateMachine(tripId);
  if (!canStartReturnTrip(current)) {
    throw new Error('Return trip is locked. Outbound trip must reach and confirm Goods Area arrival first.');
  }

  const now = new Date().toISOString();
  const newState = {
    ...current,
    goods_area_status: GOODS_AREA_STATES.RETURN_STARTED,
    return_started_at: now
  };
  saveTripStateMachine(tripId, newState);

  if (Number.isInteger(Number(tripId)) && Number(tripId) > 0) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`http://localhost:8000/api/trips/${tripId}/return-trip/start`, {
        method: 'POST',
        headers
      });
    } catch (e) {
      console.warn('Backend return start sync failed', e);
    }
  }

  return newState;
}
