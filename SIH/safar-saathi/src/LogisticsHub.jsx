import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Truck,
  ShieldCheck,
  Package,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Snowflake,
  Thermometer,
  ClipboardCheck,
  RefreshCw,
  Camera,
  Upload,
  UserCheck,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Filter,
  Search,
  Check,
  X,
  Phone,
  Layers,
  FileText,
  Lock,
  Key,
  Crosshair,
  Compass,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  ShieldAlert,
  User,
  AtSign
} from 'lucide-react';
import { useLang } from './lib';
import { TTSButton } from './tts';
import { LocationAutocomplete, geocodeIndianLocation } from './ui';
import Maps from './maps';

const API_BASE = "http://localhost:8000";

export function isOfficerAuthorizedForTarget(officerStation, targetLocation, checkpointObj) {
  if (!officerStation || !targetLocation) return false;
  const sClean = officerStation.trim().toLowerCase();
  const tClean = targetLocation.trim().toLowerCase();

  // 1. Exact string match
  if (sClean === tClean) return true;

  // 2. Checkpoint point numbering match (e.g. "point #2", "#2", "halt #2")
  const pOff = sClean.match(/#(\d+)|point\s*(\d+)|halt\s*(\d+)/i);
  const pTgt = tClean.match(/#(\d+)|point\s*(\d+)|halt\s*(\d+)/i);

  if (pTgt) {
    const tgtNum = pTgt[1] || pTgt[2] || pTgt[3];
    if (pOff) {
      const offNum = pOff[1] || pOff[2] || pOff[3];
      return offNum === tgtNum;
    }
    // If target has point #2 and officer does not have point number, reject!
    if (tClean.includes('point') || tClean.includes('#')) {
      if (checkpointObj && checkpointObj.station_city) {
        const cityClean = checkpointObj.station_city.trim().toLowerCase();
        if (cityClean && sClean.includes(cityClean)) return true;
      }
      return false;
    }
  }

  // 3. station_city from checkpoint metadata if provided
  if (checkpointObj && checkpointObj.station_city) {
    const cityClean = checkpointObj.station_city.trim().toLowerCase();
    if (cityClean && sClean.includes(cityClean)) return true;
  }

  // 4. Token-based city / location intersection
  const extractTokens = (str) => {
    if (!str) return [];
    return str
      .toLowerCase()
      .replace(/[(),;/|\-_]+/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !['toll', 'plaza', 'checkpoint', 'point', 'post', 'station', 'gate', 'highway', 'road', 'expressway', 'hub', 'mandi', 'wharf', 'terminal', 'entry', 'exit', 'sector', 'municipal', 'corporation'].includes(w));
  };

  const sToks = extractTokens(officerStation);
  const tToks = extractTokens(targetLocation);

  if (sToks.some(st => tToks.includes(st))) return true;

  // 5. Distinctive substring match (>= 4 chars)
  for (const st of sToks) {
    if (st.length >= 4 && tClean.includes(st)) return true;
  }
  for (const tt of tToks) {
    if (tt.length >= 4 && sClean.includes(tt)) return true;
  }

  return false;
}

export default function LogisticsHub() {
  const { lang, t } = useLang();

  // Officer Profile State
  const [officer, setOfficer] = useState(() => {
    try {
      const saved = localStorage.getItem("logistics_officer");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Auth Tab: 'login' | 'register'
  const [authTab, setAuthTab] = useState('login');

  // Returning Officer Login Form State (Supports Officer Username OR 10-digit mobile + password)
  const [loginForm, setLoginForm] = useState({
    username_or_phone: '',
    password: ''
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // New Officer Registration Form State (With unique username, phone uniqueness & strict password validation)
  const [registerForm, setRegisterForm] = useState({
    username: '',
    name: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    station: '',
    station_lat: null,
    station_lng: null,
    id_proof_doc: null,
    id_preview: null
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Real-time location auto-fetching states for posting station
  const [locationFetchStatus, setLocationFetchStatus] = useState('idle'); // 'idle' | 'fetching' | 'resolved' | 'unresolved'
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const stationDebounceTimer = useRef(null);

  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authError, setAuthError] = useState('');

  // Real-time Password Rules Evaluator
  const passwordRules = useMemo(() => {
    const pwd = registerForm.password || '';
    return {
      minLength: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\\/~`';]/.test(pwd),
      noSpaces: pwd.length > 0 && !/\s/.test(pwd),
    };
  }, [registerForm.password]);

  const isPasswordValid = useMemo(() => {
    return (
      passwordRules.minLength &&
      passwordRules.hasUpper &&
      passwordRules.hasLower &&
      passwordRules.hasNumber &&
      passwordRules.hasSpecial &&
      passwordRules.noSpaces
    );
  }, [passwordRules]);

  const passwordStrength = useMemo(() => {
    const pwd = registerForm.password || '';
    if (!pwd) return { score: 0, label: 'None', color: 'bg-slate-200', text: 'text-slate-400', width: 'w-0' };
    const passed = [
      passwordRules.minLength,
      passwordRules.hasUpper,
      passwordRules.hasLower,
      passwordRules.hasNumber,
      passwordRules.hasSpecial,
      passwordRules.noSpaces
    ].filter(Boolean).length;

    if (passed <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600', width: 'w-1/4' };
    if (passed <= 4) return { score: 2, label: 'Moderate', color: 'bg-amber-500', text: 'text-amber-600', width: 'w-2/4' };
    if (passed === 5) return { score: 3, label: 'Good', color: 'bg-teal-500', text: 'text-teal-600', width: 'w-3/4' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-600', text: 'text-emerald-700', width: 'w-full' };
  }, [registerForm.password, passwordRules]);

  // Username validation helper
  const isUsernameValid = useMemo(() => {
    const u = registerForm.username.trim();
    if (u.length < 3 || u.length > 30) return false;
    return /^[a-zA-Z0-9][a-zA-Z0-9_\-\.]*[a-zA-Z0-9]$/.test(u);
  }, [registerForm.username]);

  // Main Data States (Fetched dynamically from PostgreSQL)
  const [trips, setTrips] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [corridors, setCorridors] = useState([]);
  const [selectedCorridor, setSelectedCorridor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState({
    total_trips: 0,
    active_transit_trips: 0,
    total_cargo_shipments: 0,
    perishable_shipments: 0,
    pending_loadings: 0,
    pending_unloadings: 0,
    inspections_today: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('checkpoints'); // 'checkpoints' | 'loading' | 'coldchain' | 'manifest'
  const [checkpointQueueFilter, setCheckpointQueueFilter] = useState('my_station'); // 'my_station' | 'all' | 'inspected'
  const [loadingQueueFilter, setLoadingQueueFilter] = useState('my_station'); // 'my_station' | 'all'

  // Modals & Action States
  const [checkpointModal, setCheckpointModal] = useState({
    isOpen: false,
    trip: null,
    checkpoint_name: '',
    checkpoint_type: 'Highway Toll Plaza',
    seal_number: '',
    seal_status: 'Verified & Intact',
    measured_weight_kg: '',
    declared_weight_kg: '',
    weight_compliant: true,
    safety_parameters_status: 'Compliant - Tarpaulin & Lashing Secure',
    cooling_status: 'Optimal Core Temp',
    cargo_seal_intact: true,
    cargo_condition: 'Intact & Good',
    ice_status: 'Adequate',
    temp_celsius: 3.5,
    notes: '',
    action_taken: 'Checkpoint seal and weigh-in inspection completed.',
    proof_image: null,
    submitting: false
  });

  const [loadingModal, setLoadingModal] = useState({
    isOpen: false,
    shipment: null,
    loading_type: 'pickup', // 'pickup' | 'drop'
    verified_weight_kg: '',
    seal_number: '',
    seal_status: 'Sealed & Intact',
    ice_boxes_added: 2,
    temp_celsius: 3.8,
    notes: '',
    delivery_proof_image_url: null,  // URL after upload (for drop type)
    proof_preview: null,             // Local preview blob URL
    proof_uploading: false,
    submitting: false
  });

  const [iceModal, setIceModal] = useState({
    isOpen: false,
    shipment: null,
    ice_kg_added: 10,
    ice_type: 'Crushed Flake Ice',
    temp_before: 5.5,
    temp_after: 2.0,
    notes: 'Preserved with food-grade sanitized crushed ice.',
    submitting: false
  });

  const [corridorMapModal, setCorridorMapModal] = useState({ isOpen: false, trip: null });
  const [selectedMapTripId, setSelectedMapTripId] = useState(null);

  const [notificationBanner, setNotificationBanner] = useState(null);

  const showBanner = (msg, type = 'success') => {
    setNotificationBanner({ msg, type });
    setTimeout(() => setNotificationBanner(null), 4000);
  };

  // Station transfer is permanently disabled per business rules (Single Location Policy)
  const handleSwitchStation = () => {
    showBanner("🔒 Station switching disabled. Each officer account is strictly bound to its assigned posting jurisdiction. Please log in with the account designated for that station.", "error");
  };



  // Fetch Unified Trips, Shipments, Corridors & Metrics Dynamically
  // Filtered strictly to officer's assigned station when authenticated!
  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCorridor) {
        params.set("route_search", selectedCorridor);
      } else if (searchQuery.trim()) {
        params.set("route_search", searchQuery.trim());
      }

      // Location-restricted feed for authorized officer's posting station
      const stationName = officer?.station || officer?.assigned_station;
      if (stationName) {
        params.set("officer_station", stationName);
      }
      const lat = officer?.station_lat ?? officer?.lat;
      const lng = officer?.station_lng ?? officer?.lng;
      if (lat != null && lat !== 0) {
        params.set("officer_lat", lat);
      }
      if (lng != null && lng !== 0) {
        params.set("officer_lng", lng);
      }

      const token = localStorage.getItem("access_token");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const url = `${API_BASE}/api/logistics/trips-and-shipments${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setTrips(data.trips || []);
        setShipments(data.shipments || []);
        if (data.corridors) setCorridors(data.corridors);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error("Failed to load logistics feed", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCorridor, searchQuery, officer?.station, officer?.assigned_station, officer?.station_lat, officer?.station_lng, officer?.lat, officer?.lng]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle typing posting location with real-time dynamic auto-fetching & geocoding
  const handleStationInputChange = (val) => {
    setRegisterForm(prev => ({
      ...prev,
      station: val,
      station_lat: null,
      station_lng: null
    }));
    setAuthError('');

    if (!val || val.trim().length < 2) {
      setLocationFetchStatus('idle');
      return;
    }

    setLocationFetchStatus('fetching');
    if (stationDebounceTimer.current) {
      clearTimeout(stationDebounceTimer.current);
    }

    stationDebounceTimer.current = setTimeout(async () => {
      try {
        const resolved = await geocodeIndianLocation(val);
        if (resolved && resolved.lat && resolved.lng) {
          setRegisterForm(prev => ({
            ...prev,
            station_lat: resolved.lat,
            station_lng: resolved.lng
          }));
          setLocationFetchStatus('resolved');
        } else {
          setLocationFetchStatus('unresolved');
        }
      } catch (err) {
        console.error("Geocoding station error", err);
        setLocationFetchStatus('unresolved');
      }
    }, 400);
  };

  // Handle selection from LocationAutocomplete dropdown
  const handleSelectStation = (item) => {
    if (item && item.lat && item.lng) {
      setRegisterForm(prev => ({
        ...prev,
        station: item.name,
        station_lat: item.lat,
        station_lng: item.lng
      }));
      setLocationFetchStatus('resolved');
    } else if (item) {
      setRegisterForm(prev => ({
        ...prev,
        station: item.name
      }));
    }
  };

  // One-click GPS Auto-Detect of current posting location
  const handleDetectGPSLocation = () => {
    if (!navigator.geolocation) {
      showBanner("Geolocation is not supported by your browser.", "error");
      return;
    }
    setIsLocatingGps(true);
    setLocationFetchStatus('fetching');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`);
          let stationName = `Station Hub (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const locality = addr.city || addr.town || addr.village || addr.suburb || addr.county || addr.state_district || "Hub";
            const state = addr.state || "India";
            stationName = `${locality} Logistics Checkpoint (${state})`;
          }
          setRegisterForm(prev => ({
            ...prev,
            station: stationName,
            station_lat: lat,
            station_lng: lng
          }));
          setLocationFetchStatus('resolved');
          showBanner(`📍 GPS Location Fetched: ${stationName}`);
        } catch (e) {
          const fallbackName = `Ground Checkpoint (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          setRegisterForm(prev => ({
            ...prev,
            station: fallbackName,
            station_lat: lat,
            station_lng: lng
          }));
          setLocationFetchStatus('resolved');
          showBanner(`📍 GPS Coordinates Locked (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        } finally {
          setIsLocatingGps(false);
        }
      },
      (err) => {
        setIsLocatingGps(false);
        setLocationFetchStatus('unresolved');
        showBanner("Could not fetch GPS. Please type your posting station name.", "error");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // ID File Upload Handler
  const handleIdUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local Preview
    const previewUrl = URL.createObjectURL(file);
    setRegisterForm(prev => ({ ...prev, id_preview: previewUrl }));

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/api/logistics/upload-id`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.filename) {
        setRegisterForm(prev => ({ ...prev, id_proof_doc: data.filename }));
        showBanner("✔ ID Proof document uploaded and verified.");
      } else {
        showBanner("Failed to upload ID document.", "error");
      }
    } catch (err) {
      console.error("ID upload error", err);
      showBanner("Could not upload ID document to server.", "error");
    }
  };

  // Officer Login Submit (Validates Username OR 10-Digit Mobile + Password)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const idVal = (loginForm.username_or_phone || '').trim();
    if (!idVal) {
      setAuthError('Please enter your officer username or registered 10-digit mobile number.');
      return;
    }
    if (!loginForm.password || loginForm.password.trim().length === 0) {
      setAuthError('Please enter your officer password.');
      return;
    }

    setIsSubmittingAuth(true);
    try {
      const res = await fetch(`${API_BASE}/api/logistics/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username_or_phone: idVal,
          phone_number: idVal,
          password: loginForm.password.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.officer) {
        localStorage.setItem("logistics_officer", JSON.stringify(data.officer));
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
        }
        localStorage.setItem("user_type", "logistics");
        setOfficer(data.officer);
        showBanner(`Welcome back, Officer ${data.officer.name} (@${data.officer.username || 'officer'})! Station ${data.officer.station || 'Hub'} activated.`);
      } else {
        setAuthError(data.detail || 'Login failed. Please verify your officer username/mobile and password.');
      }
    } catch (err) {
      console.error("Login error", err);
      setAuthError('Network error connecting to logistics authentication server.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Officer Registration Submit (With unique username, phone uniqueness & strict password validation)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    const cleanUsername = registerForm.username.trim().toLowerCase();
    if (!cleanUsername) {
      setAuthError('Please choose a unique officer username.');
      return;
    }
    if (cleanUsername.length < 3) {
      setAuthError('Username must be at least 3 characters long.');
      return;
    }
    if (cleanUsername.length > 30) {
      setAuthError('Username cannot exceed 30 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_\-\.]*[a-zA-Z0-9]$/.test(cleanUsername)) {
      setAuthError('Username can only contain letters, numbers, underscores, and hyphens (cannot start or end with a symbol).');
      return;
    }

    const cleanName = registerForm.name.trim();
    if (!cleanName) {
      setAuthError('Please enter your official officer name.');
      return;
    }

    const cleanPhone = registerForm.phone_number.trim().replace(/[\s\-\+]/g, '').replace(/^91/, '');
    if (cleanPhone.length !== 10 || !/^\d{10}$/.test(cleanPhone)) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!isPasswordValid) {
      setAuthError('Password does not satisfy security requirements. Please check all rules below.');
      return;
    }

    if (registerForm.password !== registerForm.confirm_password) {
      setAuthError('Passwords do not match. Please verify your confirmation password.');
      return;
    }

    const cleanStation = registerForm.station.trim();
    if (!cleanStation) {
      setAuthError('Please enter your location of posting / assigned station.');
      return;
    }

    setIsSubmittingAuth(true);
    try {
      // Ensure coordinates are resolved if not already
      let lat = registerForm.station_lat;
      let lng = registerForm.station_lng;
      if (lat == null || lng == null) {
        const resolved = await geocodeIndianLocation(cleanStation);
        if (resolved && resolved.lat && resolved.lng) {
          lat = resolved.lat;
          lng = resolved.lng;
        }
      }

      const res = await fetch(`${API_BASE}/api/logistics/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUsername,
          name: cleanName,
          phone_number: cleanPhone,
          password: registerForm.password.trim(),
          station: cleanStation,
          station_lat: lat,
          station_lng: lng,
          id_proof_doc: registerForm.id_proof_doc
        })
      });

      const data = await res.json();
      if (res.ok && data.officer) {
        localStorage.setItem("logistics_officer", JSON.stringify(data.officer));
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
        }
        localStorage.setItem("user_type", "logistics");
        setOfficer(data.officer);
        showBanner(`Account created! Officer ${data.officer.name} (@${data.officer.username}) assigned to station ${data.officer.station}.`);
      } else {
        setAuthError(data.detail || 'Registration failed. Mobile number or username may already be in use.');
      }
    } catch (err) {
      console.error("Register error", err);
      setAuthError('Network error connecting to logistics registration server.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Officer Logout (Requires credentials on re-login)
  const handleLogoutOfficer = () => {
    const prevIdentifier = officer?.username || officer?.phone_number || '';
    localStorage.removeItem("logistics_officer");
    localStorage.removeItem("access_token");
    setOfficer(null);
    setAuthTab('login');
    setLoginForm({
      username_or_phone: prevIdentifier,
      password: ''
    });
    showBanner("Logged out. Please enter credentials to sign back in.");
  };

  // Submit Checkpoint Inspection
  const handleSubmitCheckpoint = async (e) => {
    e.preventDefault();
    if (!checkpointModal.trip) return;

    const isFinished = checkpointModal.trip.status === 'completed' || checkpointModal.trip.status === 'delivered' || checkpointModal.trip.status === 'cancelled' || checkpointModal.trip.status === 'cancelled_by_driver';
    if (isFinished) {
      showBanner(
        checkpointModal.trip.status === 'completed' || checkpointModal.trip.status === 'delivered'
          ? "✔ Trip is already completed. No further highway inspections can be conducted."
          : "⚠ Trip has been cancelled! Inspections cannot be conducted for cancelled trips.",
        "error"
      );
      return;
    }

    const isStarted = checkpointModal.trip.status === 'in_transit' || checkpointModal.trip.status === 'moving' || checkpointModal.trip.status === 'started' || Boolean(checkpointModal.trip.is_live);
    if (!isStarted) {
      showBanner(
        checkpointModal.trip.is_return_leg
          ? "⚠ Return trip has not started yet! Inspection stops can only be performed after the driver starts the return trip."
          : "⚠ Trip has not started yet! Inspection stops can only be performed after the driver starts the trip.",
        "error"
      );
      return;
    }

    const cleanModalCpName = (checkpointModal.checkpoint_name || '').trim().toLowerCase();
    const alreadyDone = checkpointModal.trip.checkpoints && checkpointModal.trip.checkpoints.some(cp => {
      const cpName = (cp.checkpoint_name || '').trim().toLowerCase();
      return cpName === cleanModalCpName;
    });

    if (alreadyDone) {
      showBanner(`⚠ Checkpoint "${checkpointModal.checkpoint_name}" has already been stamped for this trip. Downstream checkup officers at subsequent locations can proceed with remaining inspections.`, "error");
      return;
    }

    const distKm = Math.round(Number(checkpointModal.trip.route_distance_km || checkpointModal.trip.distance_km || 150));
    const maxInsp = Number(checkpointModal.trip.max_inspections || (distKm <= 100 ? 1 : distKm <= 300 ? 2 : distKm <= 500 ? 3 : distKm <= 1000 ? 4 : 5));
    const completedCount = Number(checkpointModal.trip.checkpoint_count || (checkpointModal.trip.checkpoints ? checkpointModal.trip.checkpoints.length : 0) || 0);
    if (checkpointModal.trip.inspections_remaining === 0 || completedCount >= maxInsp) {
      showBanner(`✔ All ${maxInsp} corridor checkpoint inspections have already been completed for this journey. Unloading is unlocked at destination!`, "error");
      return;
    }

    setCheckpointModal(prev => ({ ...prev, submitting: true }));
    try {
      const res = await fetch(`${API_BASE}/api/logistics/checkpoint-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_id: checkpointModal.trip.id,
          checkpoint_name: checkpointModal.checkpoint_name,
          checkpoint_type: checkpointModal.checkpoint_type,
          officer_name: officer?.name || 'Field Officer',
          officer_phone: officer?.phone_number || '9876543210',
          officer_station: officer?.station || checkpointModal.officer_station,
          officer_station_lat: officer?.station_lat,
          officer_station_lng: officer?.station_lng,
          cargo_seal_intact: checkpointModal.cargo_seal_intact,
          seal_number: checkpointModal.seal_number,
          seal_status: checkpointModal.seal_status,
          measured_weight_kg: checkpointModal.measured_weight_kg ? Number(checkpointModal.measured_weight_kg) : null,
          declared_weight_kg: checkpointModal.declared_weight_kg ? Number(checkpointModal.declared_weight_kg) : null,
          weight_compliant: checkpointModal.weight_compliant,
          safety_parameters_status: checkpointModal.safety_parameters_status,
          cooling_status: checkpointModal.cooling_status,
          cargo_condition: checkpointModal.cargo_condition,
          ice_status: checkpointModal.ice_status,
          temp_celsius: checkpointModal.temp_celsius !== null && checkpointModal.temp_celsius !== '' ? Number(checkpointModal.temp_celsius) : null,
          notes: checkpointModal.notes,
          action_taken: checkpointModal.action_taken
        })
      });

      const data = await res.json();
      if (res.ok) {
        showBanner(`🛑 Checkpoint inspection logged at ${checkpointModal.checkpoint_name}! Seal: ${checkpointModal.seal_status}`);
        setCheckpointModal({ isOpen: false, trip: null, submitting: false });
        fetchData();
      } else {
        showBanner(data.detail || "Failed to log checkpoint.", "error");
      }
    } catch (err) {
      console.error("Checkpoint check error", err);
      showBanner("Could not log checkpoint to backend.", "error");
    } finally {
      setCheckpointModal(prev => ({ ...prev, submitting: false }));
    }
  };

  // Submit Loading / Unloading Supervision
  const handleSubmitLoading = async (e) => {
    e.preventDefault();
    if (!loadingModal.shipment) return;

    const parentTrip = trips.find(t => t.id === loadingModal.shipment?.trip_id);
    const tripStatus = loadingModal.shipment?.trip_status || parentTrip?.status;
    if (['cancelled', 'cancelled_by_driver'].includes(tripStatus)) {
      showBanner("Cannot perform loading or unloading. This trip has been deactivated or cancelled.", "error");
      return;
    }
    if (['cancelled', 'cancelled_by_driver', 'rejected'].includes(loadingModal.shipment?.status)) {
      showBanner("Cannot perform loading or unloading on a cancelled cargo request.", "error");
      return;
    }

    if (loadingModal.loading_type === 'drop') {
      const isTripStarted = Boolean(
        loadingModal.shipment?.trip_started ||
        (parentTrip && (['in_transit', 'moving', 'started', 'pending_passenger_confirmation', 'completed'].includes(parentTrip.status) || parentTrip.is_live)) ||
        (['in_transit', 'moving', 'started', 'pending_passenger_confirmation', 'completed'].includes(loadingModal.shipment?.trip_status) || loadingModal.shipment?.is_live)
      );
      if (!isTripStarted) {
        showBanner("Trip has not started yet. Unloading can only be performed after trip departure.", "error");
        return;
      }

      const isUnloadPermitted = (loadingModal.shipment?.is_unload_allowed !== undefined ? loadingModal.shipment.is_unload_allowed : (parentTrip?.is_unload_allowed !== undefined ? parentTrip.is_unload_allowed : true)) && (parentTrip?.inspections_remaining ?? (loadingModal.shipment?.inspections_remaining ?? 0)) === 0;
      if (!isUnloadPermitted) {
        const nextHalt = parentTrip?.next_inspection_point || loadingModal.shipment?.next_inspection_point || 'Highway Checkpoint';
        const rem = parentTrip?.inspections_remaining ?? (loadingModal.shipment?.inspections_remaining ?? 1);
        showBanner(`🚫 Unloading Locked! This vehicle has ${rem} pending inspection halt(s). Next required checkup: ${nextHalt}. Unloading only unlocks once all highway checkpoint inspections are completed.`, "error");
        return;
      }
    }

    setLoadingModal(prev => ({ ...prev, submitting: true }));
    try {
      const isPerishWithIce = Boolean(loadingModal.shipment?.is_perishable && loadingModal.shipment?.ice_handling_required);
      const isIceAvail = loadingModal.ice_available_at_pickup !== false;
      const res = await fetch(`${API_BASE}/api/logistics/loading-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: loadingModal.shipment.id,
          officer_name: officer?.name || 'Field Officer',
          loading_type: loadingModal.loading_type,
          officer_station: officer?.station || loadingModal.officer_station,
          officer_station_lat: officer?.station_lat,
          officer_station_lng: officer?.station_lng,
          verified_weight_kg: loadingModal.verified_weight_kg ? Number(loadingModal.verified_weight_kg) : loadingModal.shipment.goods_weight_kg,
          seal_number: loadingModal.seal_number,
          seal_status: loadingModal.seal_status,
          ice_boxes_added: (isPerishWithIce && isIceAvail) ? (Number(loadingModal.ice_boxes_added) || 0) : 0,
          ice_unavailable_at_pickup: isPerishWithIce && !isIceAvail,
          temp_celsius: Number(loadingModal.temp_celsius) || 3.5,
          notes: loadingModal.notes,
          delivery_proof_image_url: loadingModal.delivery_proof_image_url || null
        })
      });

      const data = await res.json();
      if (res.ok) {
        showBanner(`📦 ${loadingModal.loading_type === 'pickup' ? `Loading verified with Seal ${loadingModal.seal_number || 'applied'}!` : 'Unloading confirmed at delivery point!'}`);
        setLoadingModal({ isOpen: false, shipment: null, submitting: false });
        fetchData();
      } else {
        showBanner(data.detail || "Failed to record loading event.", "error");
      }
    } catch (err) {
      console.error("Loading event error", err);
      showBanner("Could not record loading event.", "error");
    } finally {
      setLoadingModal(prev => ({ ...prev, submitting: false }));
    }
  };

  // Submit Ice Handling / Replenishment
  const handleSubmitIce = async (e) => {
    e.preventDefault();
    if (!iceModal.shipment) return;

    setIceModal(prev => ({ ...prev, submitting: true }));
    try {
      const res = await fetch(`${API_BASE}/api/logistics/ice-handling`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: iceModal.shipment.id,
          officer_name: officer?.name || 'Cold-Chain Officer',
          officer_phone: officer?.phone_number || '9876543210',
          officer_station: officer?.station,
          ice_kg_added: Number(iceModal.ice_kg_added) || 5.0,
          ice_type: iceModal.ice_type,
          temp_before: Number(iceModal.temp_before),
          temp_after: Number(iceModal.temp_after),
          notes: iceModal.notes,
          stage: iceModal.stage || 'pickup',
          checkpoint_name: officer?.station || 'Station Checkpoint'
        })
      });

      const data = await res.json();
      if (res.ok) {
        showBanner(`❄️ ${iceModal.ice_kg_added}kg ${iceModal.ice_type} supplied! (One-time policy fulfilled).`);
        setIceModal({ isOpen: false, shipment: null, submitting: false });
        fetchData();
      } else {
        showBanner(data.detail || "Failed to record ice addition.", "error");
      }
    } catch (err) {
      console.error("Ice handling error", err);
      showBanner("Could not record ice addition.", "error");
    } finally {
      setIceModal(prev => ({ ...prev, submitting: false }));
    }
  };

  // Filtered lists
  const activeLoadingShipments = useMemo(() => {
    return shipments.filter(s => {
      if (!s.trip_id) return false;
      // Before driver accepts, request is 'pending' - hide from logistics cargo handling queue
      if (['pending', 'cancelled', 'cancelled_by_driver', 'rejected'].includes(s.status)) return false;
      if (['cancelled', 'cancelled_by_driver'].includes(s.trip_status)) return false;
      const parentTrip = trips.find(t => t.id === s.trip_id);
      if (parentTrip && ['cancelled', 'cancelled_by_driver'].includes(parentTrip.status)) return false;
      return true;
    });
  }, [shipments, trips]);

  // Tab 2 Local Station Cargo (Pickup Dock OR Drop Delivery Market matches officer station)
  const myStationShipments = useMemo(() => {
    if (!officer?.station) return activeLoadingShipments;
    return activeLoadingShipments.filter(s => {
      const parentTrip = trips.find(t => t.id === s.trip_id);
      const effPickup = s.pickup_place || (s.route?.includes('→') ? s.route.split('→')[0]?.trim() : (s.route?.includes('->') ? s.route.split('->')[0]?.trim() : parentTrip?.from_loc)) || '';
      const effDrop = s.delivery_place || s.drop_place || (s.route?.includes('→') ? s.route.split('→')[1]?.trim() : (s.route?.includes('->') ? s.route.split('->')[1]?.trim() : parentTrip?.to_loc)) || '';
      
      const isPickupHere = isOfficerAuthorizedForTarget(officer.station, effPickup);
      const isDropHere = isOfficerAuthorizedForTarget(officer.station, effDrop);
      return isPickupHere || isDropHere;
    });
  }, [activeLoadingShipments, officer?.station, trips]);

  const displayedLoadingShipments = useMemo(() => {
    if (loadingQueueFilter === 'my_station') {
      return myStationShipments;
    }
    return activeLoadingShipments;
  }, [loadingQueueFilter, myStationShipments, activeLoadingShipments]);

  // Helper to determine if a trip is currently arriving / pending inspection at this officer's station
  const isTripPendingAtOfficerStation = useCallback((trip) => {
    if (!officer?.station || !trip) return false;
    if (['completed', 'delivered', 'cancelled', 'cancelled_by_driver'].includes(trip.status)) return false;
    
    // Check if trip is active or underway
    const isStarted = trip.status === 'in_transit' || trip.status === 'moving' || trip.status === 'started' || trip.is_live;
    
    // If not started yet, check if origin pickup matches officer station
    if (!isStarted) {
      return isOfficerAuthorizedForTarget(officer.station, trip.from_loc);
    }

    // Check if next highway checkpoint matches officer station
    const desCp = trip.designated_checkpoints?.find(d => (d.checkpoint_name || '').toLowerCase() === (trip.next_inspection_point || '').toLowerCase());
    const isAtNextCheckpoint = isOfficerAuthorizedForTarget(officer.station, trip.next_inspection_point, desCp);
    if (isAtNextCheckpoint && !trip.inspection_completed) return true;

    // If all corridor inspections are completed and officer is stationed at destination terminal:
    if ((trip.inspections_remaining === 0 || trip.inspection_completed) && isStarted) {
      return isOfficerAuthorizedForTarget(officer.station, trip.to_loc);
    }

    return false;
  }, [officer?.station]);

  // Helper to determine if trip was already inspected at this station
  const isTripInspectedAtOfficerStation = useCallback((trip) => {
    if (!officer?.station || !trip?.checkpoints) return false;
    return trip.checkpoints.some(cp => {
      const cpName = cp.checkpoint_name || '';
      return isOfficerAuthorizedForTarget(officer.station, cpName);
    });
  }, [officer?.station]);

  // Tab 1 Filtered Lists:
  const localArrivingTrips = useMemo(() => {
    return trips.filter(t => isTripPendingAtOfficerStation(t));
  }, [trips, isTripPendingAtOfficerStation]);

  const inspectedHereTrips = useMemo(() => {
    return trips.filter(t => isTripInspectedAtOfficerStation(t));
  }, [trips, isTripInspectedAtOfficerStation]);

  const displayedTrips = useMemo(() => {
    if (checkpointQueueFilter === 'my_station') {
      return localArrivingTrips;
    }
    if (checkpointQueueFilter === 'inspected') {
      return inspectedHereTrips;
    }
    return trips;
  }, [checkpointQueueFilter, localArrivingTrips, inspectedHereTrips, trips]);

  const perishableShipments = useMemo(() => {
    return shipments.filter(s => {
      if (!s.trip_id) return false;
      // Before driver accepts, request is 'pending' - hide from ice queue
      if (['pending', 'cancelled', 'cancelled_by_driver', 'rejected'].includes(s.status)) return false;
      if (['cancelled', 'cancelled_by_driver'].includes(s.trip_status)) return false;
      const parentTrip = trips.find(t => t.id === s.trip_id);
      if (parentTrip && ['cancelled', 'cancelled_by_driver'].includes(parentTrip.status)) return false;
      return s.is_perishable && s.ice_handling_required;
    });
  }, [shipments, trips]);

  // Tab 4 Confirmed Manifest Cargo Ledger (Excludes unaccepted/pending requests)
  const confirmedLedgerShipments = useMemo(() => {
    return shipments.filter(s => {
      if (!s.trip_id) return false;
      if (['pending', 'cancelled', 'cancelled_by_driver', 'rejected'].includes(s.status)) return false;
      return true;
    });
  }, [shipments]);

  return (
    <div className="w-full min-h-screen bg-[#F4F6F5] text-slate-800 pb-20">
      {/* NOTIFICATION TOAST */}
      {notificationBanner && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-semibold text-white animate-bounce ${
          notificationBanner.type === 'error' ? 'bg-rose-600' : 'bg-emerald-700'
        }`}>
          <span>{notificationBanner.type === 'error' ? '⚠' : '✨'}</span>
          <span>{notificationBanner.msg}</span>
        </div>
      )}

      {/* HEADER BANNER */}
      <section className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white pt-10 pb-8 px-4 sm:px-6 shadow-md border-b border-emerald-700/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                Ground Logistics & Cold-Chain Wing
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-semibold flex items-center gap-1">
                <Snowflake size={13} className="text-cyan-300" />
                Active Ice-Handling Protocol
              </span>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight flex items-center gap-3">
              <span>Logistics Operations & Checkpoint Portal</span>
              <TTSButton textToRead="Safar-Saathi Logistics Operations and Checkpoint Portal. Field inspection at every transit stop, loading at pickup, unloading at drop, and cold-chain ice preservation." />
            </h1>
            <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
              Inspect cargo stability at every highway halt, supervise verified loading and unloading, and manage active ice replenishment for perishables.
            </p>
          </div>

          {/* OFFICER PROFILE CARD OR LOGIN PROMPT */}
          {officer ? (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-4 shadow-lg min-w-[280px]">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center text-xl font-bold shadow">
                👮‍♂️
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-bold text-sm text-white truncate">{officer.name}</p>
                  {officer.username && (
                    <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.5 rounded font-mono font-semibold">
                      @{officer.username}
                    </span>
                  )}
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                </div>
                <p className="text-xs text-emerald-200 font-mono truncate">{officer.station}</p>
                <p className="text-[11px] text-emerald-300/80 font-mono">📱 {officer.phone_number}</p>
              </div>
              <button
                onClick={handleLogoutOfficer}
                className="text-xs text-red-300 hover:text-red-100 bg-red-950/40 hover:bg-red-900/60 px-2.5 py-1.5 rounded-lg border border-red-500/30 transition cursor-pointer"
                title="Switch Officer"
              >
                Exit
              </button>
            </div>
          ) : (
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-3.5 text-center sm:text-left">
              <p className="text-xs font-semibold text-amber-200">Field Officer Login Pending</p>
              <p className="text-[11px] text-emerald-100/70">Verify ID proof to record official inspections.</p>
            </div>
          )}
        </div>
      </section>

      {/* OFFICER ONBOARDING / LOGIN CARD (IF NOT AUTHENTICATED) */}
      {/* ACTIVE POSTING STATION LOCK BANNER (WHEN AUTHENTICATED) */}
      {officer && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-4 mb-6">
          <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-emerald-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-start sm:items-center gap-4 relative z-10">
              <div className="w-13 h-13 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center text-2xl shadow-inner shrink-0">
                📍
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10.5px] font-mono font-bold uppercase tracking-wider">
                    Assigned Posting Jurisdiction
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 text-[10.5px] font-semibold flex items-center gap-1">
                    <ShieldCheck size={12} className="text-cyan-300" />
                    Strict Station Lock Active
                  </span>
                </div>
                <h3 className="font-display font-extrabold text-xl sm:text-2xl text-white flex items-center gap-2 flex-wrap">
                  <span>{officer.station}</span>
                  {officer.station_lat != null && officer.station_lng != null && (
                    <span className="text-xs font-mono font-normal text-emerald-300 bg-emerald-900/60 px-2.5 py-0.5 rounded-md border border-emerald-500/40">
                      {officer.station_lat.toFixed(4)}°N, {officer.station_lng.toFixed(4)}°E
                    </span>
                  )}
                </h3>
                <p className="text-emerald-100/80 text-xs sm:text-sm mt-1 leading-relaxed max-w-2xl">
                  🔒 <strong>Location Guard:</strong> Showing only vehicles, cargo shipments, and checkpoint events that originate from, terminate at, or pass within this station's corridor.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end shrink-0 relative z-10 flex-wrap">
              <button
                type="button"
                onClick={fetchData}
                className="px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span>Refresh Radar</span>
              </button>
              <button
                type="button"
                onClick={handleLogoutOfficer}
                className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Exit Station</span>
              </button>
            </div>

          </div>
        </section>
      )}

      {/* OFFICER ONBOARDING / LOGIN CARD (IF NOT AUTHENTICATED) */}
      {!officer && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-4 mb-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500"></div>

            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
              <div className="max-w-xl">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-200 inline-block mb-2">
                  Field Logistics Protocol
                </span>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-800">
                  Logistics Field Officer Gateway & Station Control
                </h2>
                <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                  Field logistics officers supervise certified loading at pickup, inspect tamper-evident seals and weighbridge scales at highway halts, and replenish coolant for cold-chain perishables across designated transit stations.
                </p>

                <div className="mt-5 space-y-2.5">
                  <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 text-xs text-emerald-900 flex items-start gap-2.5">
                    <span className="text-base">📍</span>
                    <div>
                      <strong>Location-Restricted Ground Portal:</strong>
                      <p className="text-emerald-800/90 mt-0.5">When you register or sign in with your posting station, the portal strictly displays only cargo and transit data within your station corridor.</p>
                    </div>
                  </div>
                  <div className="p-3 bg-sky-50/80 rounded-2xl border border-sky-200/80 text-xs text-sky-900 flex items-start gap-2.5">
                    <span className="text-base">🔐</span>
                    <div>
                      <strong>Credential-Protected Station Login:</strong>
                      <p className="text-sky-800/90 mt-0.5">Registered officers must enter their 10-digit mobile number and secure password/PIN each time they access the station.</p>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
                    <span className="text-base">🌐</span>
                    <div>
                      <strong>Real-Time Dynamic Location Auto-Fetch:</strong>
                      <p className="text-amber-800/90 mt-0.5">As you write your posting station, exact GPS coordinates are fetched automatically or resolved via instant GPS sensor.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* TABBED AUTH FORM CONTAINER */}
              <div className="w-full lg:w-[420px] bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-inner">
                {/* TABS: LOGIN vs REGISTER */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/80 rounded-2xl mb-5">
                  <button
                    type="button"
                    onClick={() => { setAuthTab('login'); setAuthError(''); }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      authTab === 'login'
                        ? 'bg-white text-emerald-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LogIn size={15} />
                    <span>Officer Login</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setAuthTab('register'); setAuthError(''); }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      authTab === 'register'
                        ? 'bg-white text-emerald-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserPlus size={15} />
                    <span>Register New Officer</span>
                  </button>
                </div>

                {authError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0 text-rose-500" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* TAB 1: RETURNING OFFICER LOGIN */}
                {authTab === 'login' && (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Officer Username or 10-Digit Mobile Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="e.g. officer_rajesh or 9876543210"
                          value={loginForm.username_or_phone}
                          onChange={e => setLoginForm(p => ({ ...p, username_or_phone: e.target.value }))}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-emerald-600 bg-white"
                        />
                        <User size={15} className="absolute left-3 top-3 text-slate-400" />
                      </div>
                      <p className="text-[10.5px] text-slate-500 mt-1">
                        Enter your unique officer handle (@username) or registered 10-digit mobile number.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Officer Password
                      </label>
                      <div className="relative">
                        <input
                          type={showLoginPassword ? "text" : "password"}
                          required
                          placeholder="Enter your security password"
                          value={loginForm.password}
                          onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                          className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-emerald-600 bg-white"
                        />
                        <Lock size={15} className="absolute left-3 top-3 text-slate-400" />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingAuth}
                      className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      <LogIn size={16} />
                      <span>{isSubmittingAuth ? 'Verifying Credentials...' : 'Sign In to Station Portal'}</span>
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => { setAuthTab('register'); setAuthError(''); }}
                        className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold underline cursor-pointer"
                      >
                        New officer at this post? Register station account →
                      </button>
                    </div>
                  </form>
                )}

                {/* TAB 2: REGISTER NEW OFFICER */}
                {authTab === 'register' && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                    {/* 1. Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Officer Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Officer Rajesh Mohanty"
                        value={registerForm.name}
                        onChange={e => setRegisterForm(p => ({ ...p, name: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-emerald-600 bg-white"
                      />
                    </div>

                    {/* 2. Unique Username / Officer ID */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Unique Officer Username
                        </label>
                        {registerForm.username && (
                          <span className={`text-[10px] font-bold ${isUsernameValid ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {isUsernameValid ? '✔ Valid format' : 'Min 3 chars (letters, digits, _)'}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          minLength={3}
                          maxLength={30}
                          placeholder="e.g. officer_rajesh"
                          value={registerForm.username}
                          onChange={e => setRegisterForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '') }))}
                          className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-emerald-600 bg-white"
                        />
                        <AtSign size={15} className="absolute left-2.5 top-3 text-slate-400" />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Unique identifier for officer login and official checkpoint inspection sign-offs.
                      </p>
                    </div>

                    {/* 3. 10-Digit Mobile Number with 1-Account Binding */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          10-Digit Mobile Number
                        </label>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-mono font-medium">
                          1 account per mobile
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-500 select-none">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="9876543210"
                          value={registerForm.phone_number}
                          onChange={e => setRegisterForm(p => ({ ...p, phone_number: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                          className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-emerald-600 bg-white"
                        />
                        <Phone size={14} className="absolute right-3 top-3 text-slate-400" />
                      </div>
                    </div>

                    {/* 4. Set Password with Real-Time Strength & Rules Checklist */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Create Security Password
                        </label>
                        {registerForm.password && (
                          <span className={`text-[10.5px] font-bold ${passwordStrength.text}`}>
                            Strength: {passwordStrength.label}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showRegisterPassword ? "text" : "password"}
                          required
                          placeholder="Create strong security password"
                          value={registerForm.password}
                          onChange={e => setRegisterForm(p => ({ ...p, password: e.target.value }))}
                          className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-emerald-600 bg-white"
                        />
                        <Lock size={15} className="absolute left-3 top-3 text-slate-400" />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      {/* Dynamic Strength Bar */}
                      {registerForm.password && (
                        <div className="mt-1.5 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full ${passwordStrength.color} transition-all duration-300 ${passwordStrength.width}`}></div>
                        </div>
                      )}

                      {/* Password Rules Checklist */}
                      <div className="mt-2 p-2.5 bg-slate-100/90 rounded-xl border border-slate-200 text-[10.5px] space-y-1">
                        <p className="font-bold text-slate-600 mb-1">Password Requirements:</p>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                          <div className={`flex items-center gap-1.5 ${passwordRules.minLength ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                            <span>{passwordRules.minLength ? '✔' : '○'}</span>
                            <span>Min. 8 characters</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${passwordRules.hasUpper ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                            <span>{passwordRules.hasUpper ? '✔' : '○'}</span>
                            <span>Uppercase (A-Z)</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${passwordRules.hasLower ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                            <span>{passwordRules.hasLower ? '✔' : '○'}</span>
                            <span>Lowercase (a-z)</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${passwordRules.hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                            <span>{passwordRules.hasNumber ? '✔' : '○'}</span>
                            <span>Number (0-9)</span>
                          </div>
                          <div className={`flex items-center gap-1.5 col-span-2 ${passwordRules.hasSpecial ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                            <span>{passwordRules.hasSpecial ? '✔' : '○'}</span>
                            <span>Special symbol (!@#$%^&*)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 5. Confirm Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Confirm Password
                        </label>
                        {registerForm.confirm_password && (
                          <span className={`text-[10px] font-bold ${registerForm.password === registerForm.confirm_password ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {registerForm.password === registerForm.confirm_password ? '✔ Passwords match' : '✖ Passwords do not match'}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          placeholder="Re-enter password to confirm"
                          value={registerForm.confirm_password}
                          onChange={e => setRegisterForm(p => ({ ...p, confirm_password: e.target.value }))}
                          className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-emerald-600 bg-white"
                        />
                        <Key size={15} className="absolute left-3 top-3 text-slate-400" />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* LOCATION OF POSTING WITH REAL-TIME LOCATION AUTO-FETCH */}
                    <div className="p-3 bg-white rounded-2xl border border-emerald-200/80 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-emerald-950">
                          Location of Posting / Checkpoint Station
                        </label>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-mono font-semibold">
                          Live Auto-Fetch
                        </span>
                      </div>

                      <LocationAutocomplete
                        value={registerForm.station}
                        placeholder="Search posting location in India (e.g. Bhubaneswar Checkpoint)..."
                        onChange={handleStationInputChange}
                        onSelectLocation={handleSelectStation}
                        required
                        className="text-xs"
                      />

                      {/* GPS Quick Detect Button */}
                      <button
                        type="button"
                        onClick={handleDetectGPSLocation}
                        disabled={isLocatingGps}
                        className="w-full py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Crosshair size={13} className={isLocatingGps ? "animate-spin text-emerald-600" : "text-emerald-700"} />
                        <span>{isLocatingGps ? "Detecting GPS Location..." : "Auto-Detect My Current GPS Posting Location"}</span>
                      </button>

                      {/* Location Fetching Feedback */}
                      {locationFetchStatus === 'fetching' && (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center gap-1.5">
                          <RefreshCw size={12} className="animate-spin text-amber-600" />
                          <span>Fetching posting coordinates...</span>
                        </div>
                      )}

                      {registerForm.station_lat != null && registerForm.station_lng != null && (
                        <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-xl text-[11px] text-emerald-900 flex items-start gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Location Verified & Locked:</span>
                            <div className="text-[10.5px] font-mono text-emerald-800">
                              Lat: {registerForm.station_lat.toFixed(4)}°N, Lng: {registerForm.station_lng.toFixed(4)}°E
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ID Proof Upload (Govt ID / Logistics Badge)
                      </label>
                      <label className="w-full px-3 py-2 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl bg-emerald-50/50 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition">
                        <Upload size={14} />
                        <span>{registerForm.id_proof_doc ? 'Document Attached ✔' : 'Choose Badge / ID File (< 5MB)'}</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleIdUpload}
                          className="hidden"
                        />
                      </label>
                      {registerForm.id_preview && (
                        <div className="mt-2 relative w-16 h-12 rounded-lg overflow-hidden border border-slate-300 shadow-sm">
                          <img src={registerForm.id_preview} alt="ID preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingAuth}
                      className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      <UserCheck size={16} />
                      <span>{isSubmittingAuth ? 'Creating Account & Locking Station...' : 'Create Account & Open Station'}</span>
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => { setAuthTab('login'); setAuthError(''); }}
                        className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold underline cursor-pointer"
                      >
                        Already have an officer account? Sign In →
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* INDIA-WIDE INTERACTIVE ROUTE SEARCH & CORRIDOR RADAR */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 mb-2">
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                  <span>{officer?.station ? `📍 ${officer.station} Corridor Radar` : 'Pan-India Transit Corridors & Highway Route Search'}</span>
                </h2>
                {officer?.station && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wide uppercase">
                    Assigned Jurisdiction
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {officer?.station
                  ? `Showing live trips, checkpoints, and cold-chain cargo belonging strictly to your ${officer.station} operational area.`
                  : 'Filter live trucks, highway checkpoints, and cold-chain shipments across Indian national corridors or focus on a specific localized mandi route.'}
              </p>
            </div>

            {/* Quick Search Input */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search city, state, or route (e.g. Bhubaneswar, Puri, NH-16)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-emerald-600 font-medium transition"
              />
              <Search size={15} className="absolute left-3 top-3 text-slate-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs p-0.5 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Corridor Selection Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
            <button
              type="button"
              onClick={() => setSelectedCorridor('')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                !selectedCorridor
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{officer?.station ? `📍 ${officer.station.split(',')[0].trim()} Station Radar` : '🇮🇳 All Corridors'}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${!selectedCorridor ? 'bg-emerald-950 text-emerald-200' : 'bg-slate-200 text-slate-600'}`}>
                {metrics.active_transit_trips} trips
              </span>
            </button>

            {corridors.map((c, idx) => {
              const isSelected = selectedCorridor === c.corridor_key;
              return (
                <button
                  key={c.corridor_key || idx}
                  type="button"
                  onClick={() => setSelectedCorridor(isSelected ? '' : c.corridor_key)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 border ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="font-bold text-slate-900">{c.route_name}</span>
                  <span className="text-[10px] text-slate-500">({c.state})</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                    {c.trip_count} {c.trip_count === 1 ? 'trip' : 'trips'}
                  </span>
                  {c.cargo_count > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono text-[10px] font-bold">
                      {c.cargo_count} cargo
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {(selectedCorridor || searchQuery) && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-emerald-800">Filtered Radar View:</span>
                <span>Showing results for <strong>{selectedCorridor || searchQuery}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedCorridor(''); setSearchQuery(''); }}
                className="text-emerald-700 hover:text-emerald-900 font-semibold underline text-[11px] cursor-pointer"
              >
                {officer?.station ? `Clear Filter (Reset to ${officer.station.split(',')[0]} Radar)` : 'Clear Filter (View All India)'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4 QUICK METRIC OVERVIEW CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveTab('checkpoints')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              activeTab === 'checkpoints' ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20' : 'bg-white/80 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Vehicles In Transit</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg">
                🚛
              </div>
            </div>
            <p className="font-display font-extrabold text-2xl text-slate-800 mt-2">{metrics.active_transit_trips}</p>
            <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Ready for checkpoint check</p>
          </div>

          <div
            onClick={() => setActiveTab('coldchain')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              activeTab === 'coldchain' ? 'bg-cyan-50/50 border-cyan-500 ring-2 ring-cyan-500/20' : 'bg-white/80 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-cyan-800 uppercase">Cold-Chain Watch</span>
              <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center text-lg animate-pulse">
                ❄️
              </div>
            </div>
            <p className="font-display font-extrabold text-2xl text-cyan-900 mt-2">{perishableShipments.length}</p>
            <p className="text-[11px] text-cyan-700 font-medium mt-0.5">Perishable ice monitoring</p>
          </div>

          <div
            onClick={() => setActiveTab('loading')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              activeTab === 'loading' ? 'bg-amber-50/50 border-amber-500 ring-2 ring-amber-500/20' : 'bg-white/80 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-amber-800 uppercase">Load / Unload Queue</span>
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg">
                📦
              </div>
            </div>
            <p className="font-display font-extrabold text-2xl text-amber-900 mt-2">
              {metrics.pending_loadings + metrics.pending_unloadings}
            </p>
            <p className="text-[11px] text-amber-800 font-medium mt-0.5">
              {metrics.pending_loadings} pickup · {metrics.pending_unloadings} drop
            </p>
          </div>

          <div
            onClick={() => setActiveTab('manifest')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              activeTab === 'manifest' ? 'bg-white border-purple-600 ring-2 ring-purple-500/20' : 'bg-white/80 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Total Corridor Cargo</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-lg">
                📋
              </div>
            </div>
            <p className="font-display font-extrabold text-2xl text-slate-800 mt-2">{confirmedLedgerShipments.length}</p>
            <p className="text-[11px] text-purple-700 font-medium mt-0.5">{metrics.inspections_today} inspections today</p>
          </div>
        </div>
      </section>

      {/* NAVIGATION TABS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-6">
        <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl w-full sm:w-max overflow-x-auto">
          <button
            onClick={() => setActiveTab('checkpoints')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'checkpoints' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin size={15} />
            <span>1. Transit Stops & Checkpoints ({trips.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('loading')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'loading' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck size={15} />
            <span>2. Loading (Pickup) & Unloading (Drop) ({activeLoadingShipments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('coldchain')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'coldchain' ? 'bg-white text-cyan-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Snowflake size={15} className="text-cyan-600" />
            <span>3. Perishables & Ice Handling ({perishableShipments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('manifest')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'manifest' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={15} />
            <span>4. Cross-Connected Manifest ({confirmedLedgerShipments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('corridor_map')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'corridor_map' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass size={15} className="text-emerald-700" />
            <span>5. Corridor Radar Map</span>
          </button>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ============================================================== */}
        {/* TAB 1: SHIPMENT STOPS & TRANSIT CHECKPOINTS */}
        {/* ============================================================== */}
        {activeTab === 'checkpoints' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="font-display font-bold text-xl text-slate-800 flex items-center gap-2 flex-wrap">
                    <span>🛑 Highway Transit Stops & Live Inspection Desk</span>
                    {officer?.station && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                        📍 {officer.station} Station Trips Only
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {officer?.station
                      ? `Filtered strictly to trips starting, ending, or passing through ${officer.station}. Inspect security seals, weighbridge scales, and cold chain safety.`
                      : 'Every time a vehicle halts at a toll plaza, weigh-station, or highway hub, inspect security seals, cargo stability, and core temperature.'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMapTripId(trips.length > 0 ? trips[0].id : null);
                      setCorridorMapModal({ isOpen: true, trip: trips[0] || null });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shadow-xs"
                  >
                    <Compass size={14} />
                    <span>🗺️ Open Corridor Map</span>
                  </button>
                  <button
                    onClick={fetchData}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                  >
                    <RefreshCw size={14} />
                    <span>Refresh Radar</span>
                  </button>
                </div>
              </div>

              {/* Checkpoint Queue Filter Tabs */}
              <div className="flex items-center gap-2 mb-4 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 w-fit flex-wrap">
                <button
                  type="button"
                  onClick={() => setCheckpointQueueFilter('my_station')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    checkpointQueueFilter === 'my_station'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🎯 Arriving at My Station ({localArrivingTrips.length})</span>
                  {localArrivingTrips.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setCheckpointQueueFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    checkpointQueueFilter === 'all'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🛣️ All Corridor Vehicles ({trips.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCheckpointQueueFilter('inspected')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    checkpointQueueFilter === 'inspected'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>✔ Inspected at My Station ({inspectedHereTrips.length})</span>
                </button>
              </div>

              {displayedTrips.length === 0 ? (
                checkpointQueueFilter === 'my_station' ? (
                  <div className="text-center py-10 bg-slate-50/80 rounded-2xl border border-dashed border-slate-300 p-6">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3 text-xl shadow-2xs">
                      🛑
                    </div>
                    <h3 className="font-display font-bold text-slate-800 text-base">
                      No Vehicles Currently Queued at {officer?.station || 'Your Station'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      All vehicles along this corridor are either currently en-route in earlier sections or have already been inspected and cleared downstream.
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2.5 flex-wrap">
                      {inspectedHereTrips.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setCheckpointQueueFilter('inspected')}
                          className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-200 transition cursor-pointer"
                        >
                          ✔ View Inspected at My Station ({inspectedHereTrips.length})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setCheckpointQueueFilter('all')}
                        className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        🛣️ View All Corridor Vehicles ({trips.length})
                      </button>
                    </div>
                  </div>
                ) : checkpointQueueFilter === 'inspected' ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 p-6 text-slate-500">
                    <p className="text-sm font-semibold">No checkpoint inspections recorded yet from {officer?.station || 'your station'}.</p>
                    <button
                      type="button"
                      onClick={() => setCheckpointQueueFilter('all')}
                      className="mt-3 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                    >
                      View All Corridor Vehicles ({trips.length})
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Truck size={36} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">No vehicles currently active in transit.</p>
                  </div>
                )
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {displayedTrips.map(trip => {
                    const desCp = trip.designated_checkpoints?.find(d => (d.checkpoint_name || '').toLowerCase() === (trip.next_inspection_point || '').toLowerCase());
                    const isOfficerStationedAtHalt = isOfficerAuthorizedForTarget(officer?.station, trip.next_inspection_point, desCp);

                    return (
                      <div
                        key={trip.id}
                        className={`rounded-2xl border p-4 transition shadow-2xs flex flex-col justify-between ${
                          isOfficerStationedAtHalt && !trip.inspection_completed
                            ? 'bg-emerald-50/30 border-emerald-400 ring-2 ring-emerald-500/80 shadow-md'
                            : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <div>
                          {/* Active Station Queue Banner if Arrived Here */}
                          {isOfficerStationedAtHalt && !trip.inspection_completed && (
                            <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white px-3.5 py-1.5 rounded-t-xl -mt-4 -mx-4 mb-3 flex items-center justify-between text-xs font-bold shadow-xs">
                              <span className="flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                                </span>
                                <span>📍 VEHICLE AT YOUR CHECKPOINT: Ready for Inspection</span>
                              </span>
                              <span className="bg-white/20 text-emerald-50 px-2 py-0.5 rounded text-[10.5px] font-mono">
                                Halt #{Math.min(trip.max_inspections || 4, (trip.checkpoint_count || trip.checkpoints?.length || 0) + 1)}
                              </span>
                            </div>
                          )}
                        {/* Top Trip Header */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display font-bold text-base text-slate-900">
                                {trip.from_loc.split(',')[0]} → {trip.to_loc.split(',')[0]}
                              </span>
                              {trip.status === 'completed' || trip.status === 'delivered' ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-xs flex items-center gap-1">
                                  <span>✔</span>
                                  <span>Completed</span>
                                </span>
                              ) : trip.status === 'pending_passenger_confirmation' ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white shadow-xs flex items-center gap-1">
                                  <span>✔</span>
                                  <span>Delivered</span>
                                </span>
                              ) : trip.status === 'cancelled' || trip.status === 'cancelled_by_driver' ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                                  Cancelled
                                </span>
                              ) : (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  trip.status === 'in_transit' || trip.status === 'moving' || trip.status === 'started' ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {trip.status?.replace('_', ' ') || 'Scheduled'}
                                </span>
                              )}
                              {trip.is_return_leg && (
                                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-bold text-[10px] border border-indigo-200 flex items-center gap-1">
                                  <span>🔄</span>
                                  <span>Return Backhaul</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Driver: <strong>{trip.owner}</strong> {trip.driver_phone && `(📱 ${trip.driver_phone})`}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100/70 text-emerald-800 text-xs font-mono font-bold">
                              {trip.vehicle}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Load: <strong>{trip.total_booked_kg || 0}</strong> / {trip.total_kg} kg
                            </p>
                          </div>
                        </div>

                        {/* Cargo Category & Security Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          {trip.is_dedicated ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold text-[10.5px] border border-purple-200 flex items-center gap-1">
                              🔒 Dedicated: {trip.dedicated_sub_category || 'Isolated Cargo'}
                            </span>
                          ) : trip.cargo_category === 'Perishable Goods' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-900 font-bold text-[10.5px] border border-cyan-200 flex items-center gap-1">
                              ❄️ Perishable ({trip.cooling_type || 'Cold-Chain'})
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10.5px] border border-slate-200 flex items-center gap-1">
                              <span>📦 Independent Cargo</span>
                              {trip.bookings && trip.bookings.some(b => b.ice_handling_required) && (
                                <span className="ml-1 text-[9px] bg-cyan-100 text-cyan-800 px-1.5 py-0.2 rounded font-mono">
                                  🧊 1 Ice Shipment
                                </span>
                              )}
                            </span>
                          )}

                          {trip.seal_number && (
                            <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold border flex items-center gap-1 ${
                              trip.seal_status === 'tampered_broken'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            }`}>
                              🔐 Seal #{trip.seal_number} ({trip.seal_status === 'verified_intact' ? 'Intact' : trip.seal_status?.replace('_', ' ') || 'Logged'})
                            </span>
                          )}

                          {trip.last_weigh_in_kg && (
                            <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold border ${
                              trip.weight_compliant !== false ? 'bg-teal-50 text-teal-800 border-teal-300' : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}>
                              ⚖ {trip.last_weigh_in_kg} kg ({trip.weight_compliant !== false ? 'Compliant' : 'Discrepancy'})
                            </span>
                          )}

                          {trip.total_cargo_count > 0 && (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border flex items-center gap-1 ${
                              trip.is_load_verified
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}>
                              {trip.is_load_verified
                                ? `✔ Load Verified & Sealed (${trip.verified_cargo_count}/${trip.total_cargo_count})`
                                : `⏳ Load Unverified (${trip.unverified_cargo_count} pending in Tab 2)`}
                            </span>
                          )}
                        </div>

                        {/* Current Checkpoint Badge */}
                        <div className="rounded-xl bg-white p-3 border border-slate-200 mb-3 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 flex items-center gap-1">
                              <MapPin size={13} className="text-emerald-700" />
                              Latest Checkpoint:
                            </span>
                            <span className="font-bold text-slate-800">{trip.current_checkpoint || 'Departure Station'}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                            <span>Inspections: <strong className="text-emerald-700 font-mono">{trip.checkpoint_count || trip.checkpoints?.length || 0} / {trip.max_inspections || (Math.round(trip.route_distance_km || trip.distance_km || 150) <= 100 ? 1 : Math.round(trip.route_distance_km || trip.distance_km || 150) <= 300 ? 2 : Math.round(trip.route_distance_km || trip.distance_km || 150) <= 500 ? 3 : 4)} completed</strong></span>
                            <span>Scale Compliance: <strong className={trip.weight_compliant !== false ? 'text-emerald-700' : 'text-rose-700'}>{trip.weight_compliant !== false ? '✔ Passed' : '⚠ Flagged'}</strong></span>
                          </div>
                        </div>

                        {/* Next Inspection Point Banner */}
                        <div className="rounded-xl bg-amber-50/90 border border-amber-300 p-2.5 mb-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-amber-950">
                            <span className="text-sm">🛑</span>
                            <span>Next Inspection Point:</span>
                            <span className="font-mono text-amber-900 bg-white/80 px-2 py-0.5 rounded border border-amber-200">
                              {trip.next_inspection_point || (trip.inspections_remaining === 0 ? '✔ All Checkpoints Completed' : 'Highway Inspection Station')}
                            </span>
                          </div>
                          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            {trip.inspections_remaining !== undefined ? `${trip.inspections_remaining} Halts Left` : 'Required'}
                          </span>
                        </div>

                        {/* Designated Corridor Checkpoints Waypoints */}
                        {trip.designated_checkpoints && trip.designated_checkpoints.length > 0 && (
                          <div className="mb-3 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">Highway Inspection Corridor:</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {trip.designated_checkpoints.map((dcp, i) => {
                                const dcpName = (typeof dcp === 'string' ? dcp : (dcp?.checkpoint_name || dcp?.name || '')).trim();
                                const dcpLower = dcpName.toLowerCase();
                                const isDone = Boolean(dcpLower && trip.checkpoints && trip.checkpoints.some(c => {
                                  const cName = (c?.checkpoint_name || '').toLowerCase();
                                  return cName && (cName.includes(dcpLower) || dcpLower.includes(cName));
                                }));
                                const nextPointStr = (trip.next_inspection_point || '').toLowerCase();
                                const isNext = !isDone && Boolean(dcpLower && nextPointStr && (nextPointStr.includes(dcpLower) || dcpLower.includes(nextPointStr)));
                                return (
                                  <span key={i} className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border flex items-center gap-1 ${
                                    isDone ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                    isNext ? 'bg-amber-100 text-amber-900 border-amber-400 animate-pulse ring-1 ring-amber-400' :
                                    'bg-white text-slate-500 border-slate-200'
                                  }`}>
                                    <span>{isDone ? '🛡️' : isNext ? '🛑' : '⏳'}</span>
                                    <span>{dcpName || `Halt #${i + 1}`}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Recent Checkpoint Log history (if any) */}
                        {trip.checkpoints && trip.checkpoints.length > 0 && (
                          <div className="mb-3 space-y-1.5">
                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Stop Inspection Logs ({trip.checkpoints.length}):</p>
                            {trip.checkpoints.map((cp, idx) => (
                              <div key={idx} className="text-[11px] bg-emerald-50/70 border border-emerald-200/60 rounded-lg p-2 text-emerald-950 flex items-center justify-between">
                                <div>
                                  <span className="font-bold">Halt #{idx + 1}: {cp.checkpoint_name}</span>
                                  <span className="text-slate-500 ml-1">({cp.timestamp})</span>
                                  <p className="text-[10px] text-slate-600 mt-0.5">
                                    Seal: {cp.seal_number ? `#${cp.seal_number} ` : ''}({cp.cargo_seal_intact ? '✔ Intact' : '⚠ Broken'}) · Weigh: {cp.measured_weight_kg ? `${cp.measured_weight_kg}kg` : 'N/A'}
                                  </p>
                                </div>
                                {cp.temp_celsius !== null && (
                                  <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-900 font-mono font-bold text-[10.5px]">
                                    {cp.temp_celsius}°C
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Button: Dynamic Distance-Based Inspection Capacity */}
                      <div className="pt-2">
                        {trip.status === 'completed' || trip.status === 'delivered' ? (
                          <div className="space-y-1.5">
                            <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-2.5 text-center text-xs text-emerald-900 flex items-center justify-center gap-1.5 font-bold">
                              <CheckCircle2 size={16} className="text-emerald-600" />
                              <span>Trip Completed — Cargo safely delivered. Inspection Locked.</span>
                            </div>
                            <button
                              disabled
                              className="w-full py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-default flex items-center justify-center gap-1.5 select-none"
                              title="This trip has been completed and delivered."
                            >
                              <CheckCircle2 size={15} className="text-white" />
                              <span>✔ This Trip is Completed (Delivered)</span>
                            </button>
                          </div>
                        ) : trip.status === 'pending_passenger_confirmation' ? (
                          <div className="space-y-1.5">
                            <div className="rounded-xl bg-blue-50 border border-blue-300 p-2.5 text-center text-xs text-blue-900 flex items-center justify-center gap-1.5 font-bold">
                              <CheckCircle2 size={16} className="text-blue-600" />
                              <span>Delivery completed with verified proof. Awaiting final signoff.</span>
                            </div>
                            <button
                              disabled
                              className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-default flex items-center justify-center gap-1.5 select-none"
                              title="Delivery proof uploaded. Trip completed."
                            >
                              <CheckCircle2 size={15} className="text-white" />
                              <span>✔ This Trip is Completed (Delivered)</span>
                            </button>
                          </div>
                        ) : (trip.status === 'cancelled' || trip.status === 'cancelled_by_driver' || trip.status === 'cancelled_by_user') ? (
                          <div className="space-y-1.5">
                            <div className="rounded-xl bg-rose-50 border border-rose-200/90 p-2.5 text-center text-xs text-rose-900 flex items-center justify-center gap-1.5 font-medium">
                              <span>🛑</span>
                              <span>Trip Cancelled — Inspection Unavailable. This trip was cancelled and cannot be inspected.</span>
                            </div>
                            <button
                              disabled
                              className="w-full py-2.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl border border-slate-200 cursor-not-allowed flex items-center justify-center gap-1.5 opacity-80 select-none"
                              title="Trip was cancelled. Inspection is disabled."
                            >
                              <ShieldAlert size={15} className="text-slate-400" />
                              <span>Trip Cancelled (Inspection Unavailable)</span>
                            </button>
                          </div>
                        ) : (!trip.status || (trip.status !== 'in_transit' && trip.status !== 'moving' && trip.status !== 'started' && !trip.is_live)) ? (
                          <div className="space-y-1.5">
                            <div className="rounded-xl bg-amber-50 border border-amber-200/90 p-2.5 text-center text-xs text-amber-900 flex items-center justify-center gap-1.5 font-medium">
                              <span>⏳</span>
                              <span>
                                {trip.is_return_leg
                                  ? "Return trip has not started yet. Inspection stops unlock only after driver starts return leg."
                                  : (!trip.is_load_verified && trip.total_cargo_count > 0)
                                    ? `Load verification pending (${trip.unverified_cargo_count} shipment(s) unverified). Driver cannot start trip until cargo is verified and sealed in Tab 2.`
                                    : "Trip has not started yet. Inspection stops unlock only after driver departs."}
                              </span>
                            </div>
                            <button
                              disabled
                              className="w-full py-2.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl border border-slate-200 cursor-not-allowed flex items-center justify-center gap-1.5 opacity-80 select-none"
                              title={(!trip.is_load_verified && trip.total_cargo_count > 0) ? "Trip start blocked: Load verification pending" : (trip.is_return_leg ? "Return trip has not started yet." : "Trip has not started yet.")}
                            >
                              <ShieldAlert size={15} className="text-amber-500" />
                              <span>{(!trip.is_load_verified && trip.total_cargo_count > 0) ? "Start Blocked: Load Verification Pending" : "Trip Not Started Yet"}</span>
                            </button>
                          </div>
                        ) : (() => {
                          const distKm = Math.round(Number(trip.route_distance_km || trip.distance_km || 150));
                          const maxInsp = Number(trip.max_inspections || (distKm <= 100 ? 1 : distKm <= 300 ? 2 : distKm <= 500 ? 3 : distKm <= 1000 ? 4 : 5));
                          const countDone = Number(trip.checkpoint_count || (trip.checkpoints ? trip.checkpoints.length : 0) || 0);
                          const isFullyInspected = countDone >= maxInsp;
                          const nextHaltNumber = Math.min(maxInsp, countDone + 1);

                          const offStationClean = (officer?.station || officer?.assigned_station || '').trim().toLowerCase();
                          const alreadyInspectedHere = Boolean(
                            offStationClean &&
                            trip.checkpoints &&
                            trip.checkpoints.some(cp => {
                              const cpClean = (cp.checkpoint_name || '').trim().toLowerCase();
                              return cpClean === offStationClean;
                            })
                          );

                          if (isFullyInspected) {
                            return (
                              <div className="space-y-2">
                                <button
                                  disabled
                                  className="w-full py-2.5 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 cursor-not-allowed flex items-center justify-center gap-1.5 opacity-90 select-none shadow-xs"
                                  title={`All ${maxInsp} allowed inspections for this ${distKm} km journey have been completed.`}
                                >
                                  <ShieldCheck size={15} className="text-emerald-600" />
                                  <span>✔ All Highway Checkpoints Inspected ({countDone}/{maxInsp} Done)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedMapTripId(trip.id);
                                    setCorridorMapModal({ isOpen: true, trip });
                                  }}
                                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Compass size={14} className="text-emerald-700" />
                                  <span>🗺️ View Corridor Radar Map & Checkpoints</span>
                                </button>
                              </div>
                            );
                          }

                          if (alreadyInspectedHere) {
                            return (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] text-slate-600 px-0.5 font-medium">
                                  <span>Inspected at this Station (Halt {countDone} of {maxInsp})</span>
                                  <span className="font-bold text-amber-700 font-mono">{maxInsp - countDone} remaining</span>
                                </div>
                                <button
                                  disabled
                                  className="w-full py-2.5 bg-amber-50 text-amber-900 font-bold text-xs rounded-xl border border-amber-300 cursor-not-allowed flex items-center justify-center gap-1.5 opacity-95 select-none shadow-xs"
                                  title="An inspection has already been recorded for this trip from your station. Only 1 inspection is allowed per station. Downstream officers at subsequent checkpoints will perform remaining inspections."
                                >
                                  <CheckCircle2 size={15} className="text-amber-600" />
                                  <span>✔ Station Inspected (1 Per Station Limit) · Next Halt Downstream</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedMapTripId(trip.id);
                                    setCorridorMapModal({ isOpen: true, trip });
                                  }}
                                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Compass size={14} className="text-emerald-700" />
                                  <span>🗺️ View Corridor Radar Map & Checkpoints</span>
                                </button>
                              </div>
                            );
                          }

                          const desCp = trip.designated_checkpoints?.find(d => (d.checkpoint_name || '').toLowerCase() === (trip.next_inspection_point || '').toLowerCase());
                          const isOfficerStationedAtHalt = isOfficerAuthorizedForTarget(officer?.station, trip.next_inspection_point, desCp);

                          if (!isOfficerStationedAtHalt) {
                            return (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-[11px] text-slate-600 px-0.5 font-medium">
                                  <span>Inspection Halt <strong>{nextHaltNumber} of {maxInsp}</strong></span>
                                  <span className="font-bold text-amber-700 font-mono">Restricted to Halt #{nextHaltNumber}</span>
                                </div>
                                <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 text-xs shadow-xs space-y-1">
                                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                                    <Lock size={14} className="text-amber-700 shrink-0" />
                                    <span>🔒 Checkpoint Inspection Restricted</span>
                                  </div>
                                  <p className="text-[11px] text-amber-800 leading-tight">
                                    Assigned Station: <strong>{trip.next_inspection_point}</strong>
                                  </p>
                                  <p className="text-[11px] text-amber-700">
                                    Your Station: <span className="font-mono font-semibold">{officer?.station || 'Unassigned'}</span> · Only the officer account stationed at this checkpoint location can perform this inspection.
                                  </p>
                                </div>
                                <button
                                  disabled
                                  className="w-full py-2.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl border border-slate-300 cursor-not-allowed flex items-center justify-center gap-1.5 opacity-80 select-none shadow-xs"
                                  title={`Inspection restricted to ${trip.next_inspection_point}. Officer stationed at this location must log in to stamp this checkpoint.`}
                                >
                                  <Lock size={14} />
                                  <span>🔒 Locked · Awaiting Officer at Halt #{nextHaltNumber}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedMapTripId(trip.id);
                                    setCorridorMapModal({ isOpen: true, trip });
                                  }}
                                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer mt-0.5"
                                >
                                  <Compass size={14} className="text-emerald-700" />
                                  <span>🗺️ View Corridor Radar Map & Checkpoints</span>
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[11px] text-slate-600 px-0.5 font-medium">
                                <span>Inspection Halt <strong>{nextHaltNumber} of {maxInsp}</strong> ({distKm} km route)</span>
                                <span className="font-bold text-emerald-800 font-mono">{maxInsp - countDone} remaining</span>
                              </div>

                              <button
                                onClick={() => setCheckpointModal({
                                  isOpen: true,
                                  trip,
                                  checkpoint_name: trip.next_inspection_point || officer?.station || `${trip.from_loc.split(',')[0]} - ${trip.to_loc.split(',')[0]} NH Toll Plaza`,
                                  checkpoint_type: 'Highway Toll Plaza',
                                  cargo_seal_intact: trip.seal_status !== 'tampered_broken',
                                  seal_number: trip.seal_number || `SL-${Math.floor(10000 + Math.random() * 90000)}`,
                                  seal_status: trip.seal_status || 'verified_intact',
                                  measured_weight_kg: trip.last_weigh_in_kg || trip.total_booked_kg || trip.total_kg || 450,
                                  declared_weight_kg: trip.total_booked_kg || trip.total_kg || 450,
                                  weight_compliant: trip.weight_compliant !== false,
                                  safety_parameters_status: trip.safety_parameters_status || 'Passed All Safety Checks',
                                  cooling_status: (trip.cargo_category === 'Perishable Goods' || (trip.bookings && trip.bookings.some(b => b.ice_handling_required))) ? 'Optimal Range' : 'Not Applicable',
                                  temp_celsius: (trip.cargo_category === 'Perishable Goods' || (trip.bookings && trip.bookings.some(b => b.ice_handling_required))) ? 3.5 : '',
                                  cargo_condition: 'Intact & Good',
                                  ice_status: (trip.cargo_category === 'Perishable Goods' || (trip.bookings && trip.bookings.some(b => b.ice_handling_required))) ? 'Adequate' : 'Not Applicable',
                                  notes: `Halt ${nextHaltNumber}/${maxInsp}: Cargo security seal verified; weighbridge scale compliance inspected.`,
                                  action_taken: `Halt ${nextHaltNumber}/${maxInsp} seal verified & weighbridge stamped.`,
                                  proof_image: null,
                                  submitting: false
                                })}
                                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <ShieldCheck size={15} />
                                <span>{countDone === 0 ? `Log Checkpoint Inspection (1/${maxInsp})` : `Log Next Checkpoint Inspection (${nextHaltNumber}/${maxInsp})`}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMapTripId(trip.id);
                                  setCorridorMapModal({ isOpen: true, trip });
                                }}
                                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                              >
                                <Compass size={14} className="text-emerald-700" />
                                <span>🗺️ View Corridor Radar Map & Checkpoints</span>
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: LOADING (PICKUP) & UNLOADING (DROP) ASSISTANCE */}
        {/* ============================================================== */}
        {activeTab === 'loading' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="mb-5 pb-4 border-b border-slate-100">
                <h2 className="font-display font-bold text-xl text-slate-800 flex items-center gap-2 flex-wrap">
                  <span>📦 Loading (Pickup) & Unloading (Drop) Ground Management</span>
                  {officer?.station && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                      📍 {officer.station} Area Cargo Only
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {officer?.station
                    ? `Physical support for cargo shipments in ${officer.station}: Weighed loading & cold-packing at local pickup, and receipt condition verification at local drop.`
                    : 'Logistics team provides physical support at both ends: Weighed loading & cold-packing at the farm/hub (Pickup), and receipt condition verification at the market/destination (Drop).'}
                </p>
              </div>

              {/* Ground Operations Queue Filter Tabs */}
              <div className="flex items-center gap-2 mb-4 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 w-fit flex-wrap">
                <button
                  type="button"
                  onClick={() => setLoadingQueueFilter('my_station')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    loadingQueueFilter === 'my_station'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>📍 My Station Operations ({myStationShipments.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoadingQueueFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    loadingQueueFilter === 'all'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>📦 All Corridor Shipments ({activeLoadingShipments.length})</span>
                </button>
              </div>

              {displayedLoadingShipments.length === 0 ? (
                loadingQueueFilter === 'my_station' ? (
                  <div className="bg-gradient-to-br from-amber-50/90 to-orange-50/60 border border-amber-200 rounded-3xl p-6 text-center shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3 text-2xl shadow-xs">
                      🛣️
                    </div>
                    <h3 className="font-display font-bold text-amber-950 text-base">
                      Highway Inspection Checkpoint ({officer?.station || 'Your Station'})
                    </h3>
                    <p className="text-xs text-amber-800 mt-1.5 max-w-lg mx-auto leading-relaxed">
                      <strong>{officer?.station || 'This station'}</strong> is an intermediate highway transit checkpoint along the corridor. Through-corridor cargo is inspected at highway halts in <strong>Tab 1 (Highway Transit Stops)</strong>. Physical pickup loading occurs at origin docks (Pickup) and consignee unloading occurs at destination markets (Drop).
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
                      <button
                        onClick={() => setActiveTab('checkpoints')}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <ShieldCheck size={14} />
                        <span>🛑 Go to Tab 1: Inspect Transit Vehicles</span>
                      </button>
                      <button
                        onClick={() => setLoadingQueueFilter('all')}
                        className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Package size={14} />
                        <span>📦 View All Corridor Shipments ({activeLoadingShipments.length})</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Truck size={36} className="mx-auto mb-2 opacity-40 text-emerald-600" />
                    <p className="text-sm font-semibold">No active cargo shipments currently pending loading or unloading.</p>
                    <p className="text-xs text-slate-400 mt-1">Cargo from deactivated or cancelled trips is excluded from ground handling.</p>
                  </div>
                )
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {displayedLoadingShipments.map(s => {
                    const parentTrip = trips.find(t => t.id === s.trip_id);
                    const effectivePickupPlace = s.pickup_place || (s.route?.includes('→') ? s.route.split('→')[0]?.trim() : (s.route?.includes('->') ? s.route.split('->')[0]?.trim() : parentTrip?.from_loc)) || 'Origin Pickup Dock';
                    const effectiveDeliveryPlace = s.delivery_place || s.drop_place || (s.route?.includes('→') ? s.route.split('→')[1]?.trim() : (s.route?.includes('->') ? s.route.split('->')[1]?.trim() : parentTrip?.to_loc)) || 'Destination Market';
                    const pickupCityName = effectivePickupPlace.split(',')?.[0]?.trim() || 'Pickup';
                    const dropCityName = effectiveDeliveryPlace.split(',')?.[0]?.trim() || 'Destination';

                    const isDeliveredTrip = s.trip_status === 'completed' || s.trip_status === 'delivered' || s.status === 'completed' || s.status === 'delivered' || parentTrip?.status === 'completed';
                    const isLoaded = s.loading_status === 'loaded' && !isDeliveredTrip;
                    const isUnloaded = s.loading_status === 'unloaded' || isDeliveredTrip;
                    const isTripStarted = Boolean(
                      s.trip_started ||
                      (parentTrip && (['in_transit', 'moving', 'started', 'pending_passenger_confirmation', 'completed'].includes(parentTrip.status) || parentTrip.is_live)) ||
                      (['in_transit', 'moving', 'started', 'pending_passenger_confirmation', 'completed'].includes(s.trip_status) || s.is_live)
                    );
                    const isUnloadAllowed = (s.is_unload_allowed !== undefined ? s.is_unload_allowed : (parentTrip?.is_unload_allowed !== undefined ? parentTrip.is_unload_allowed : true)) && (parentTrip?.inspections_remaining ?? (s.inspections_remaining ?? 0)) === 0;
                    const nextInspectionHalt = parentTrip?.next_inspection_point || s.next_inspection_point || 'Highway Checkpoint';
                    const remainingHalts = parentTrip?.inspections_remaining ?? (s.inspections_remaining ?? 0);

                    return (
                      <div
                        key={s.id}
                        className="bg-slate-50 rounded-2xl border border-slate-200 p-4 hover:border-slate-300 transition flex flex-col justify-between"
                      >
                        <div>
                          {/* Status Strip */}
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              isUnloaded ? 'bg-purple-100 text-purple-800' :
                              isLoaded ? (isTripStarted ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800') :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {isUnloaded 
                                ? '✔ Fully Unloaded & Handed Over' 
                                : isLoaded 
                                  ? (isTripStarted ? '🚚 Loaded · In Transit to Drop' : '📦 Loaded · Awaiting Trip Departure') 
                                  : '⏳ Pending Pickup Loading'}
                            </span>

                            {s.is_perishable && (
                              <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-900 text-[10px] font-bold flex items-center gap-1">
                                <Snowflake size={11} /> Perishable
                              </span>
                            )}
                          </div>

                          {/* Shipper & Commodity */}
                          <h3 className="font-display font-bold text-base text-slate-900">
                            {s.cargo_type} · {s.goods_weight_kg} kg
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Shipper: <strong>{s.farmer_name}</strong> {s.farmer_phone && `(${s.farmer_phone})`}
                          </p>
                          <p className="text-xs text-slate-500">
                            Transporter: <strong>{s.driver_name}</strong> ({s.vehicle})
                          </p>

                          {/* Location Details */}
                          <div className="mt-3 rounded-xl bg-white p-3 border border-slate-200 text-xs space-y-1.5">
                            <div className="flex items-start gap-1.5">
                              <span className="text-emerald-700 font-bold shrink-0">📍 Specific Pickup Dock:</span>
                              <span className="text-slate-700 truncate font-medium">{effectivePickupPlace}</span>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <span className="text-purple-700 font-bold shrink-0">🏁 Final Delivery Market:</span>
                              <span className="text-slate-700 truncate font-medium">{effectiveDeliveryPlace}</span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                              <span className="text-amber-800 font-bold flex items-center gap-1">
                                <span>🛑</span> Next Inspection Point:
                              </span>
                              <span className="font-mono font-bold text-amber-950">
                                {nextInspectionHalt}
                              </span>
                            </div>
                            {s.is_perishable && (
                              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-cyan-900">
                                <span className="font-medium flex items-center gap-1">
                                  <span>🧊</span> Request Ice Status:
                                </span>
                                <span className="font-bold">
                                  {s.ice_added
                                    ? `✔ Added (${s.ice_boxes_count || 2} boxes at ${s.ice_added_stage || 'pickup'})`
                                    : s.ice_unavailable_at_pickup
                                    ? '⚠ Unavailable at pickup dock'
                                    : 'Pending addition at pickup dock'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Loading / Unloading timestamps */}
                          <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                            {s.loaded_at && (
                              <p>✔ Loaded at: <strong className="text-slate-700">{s.loaded_at}</strong> by {s.loaded_by || 'Field Team'}</p>
                            )}
                            {s.unloaded_at && (
                              <p>✔ Unloaded at: <strong className="text-slate-700">{s.unloaded_at}</strong> by {s.unloaded_by || 'Delivery Agent'}</p>
                            )}
                          </div>

                          {/* Delivery Proof Image */}
                          {s.delivery_proof_image_url && (
                            <div className="mt-2.5 p-2.5 bg-violet-50 border border-violet-200 rounded-xl space-y-1.5">
                              <p className="text-[11px] font-bold text-violet-900">📸 Delivery Proof Photo</p>
                              <a
                                href={`${API_BASE}${s.delivery_proof_image_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img
                                  src={`${API_BASE}${s.delivery_proof_image_url}`}
                                  alt="Delivery proof"
                                  className="w-full max-h-32 object-cover rounded-lg border border-violet-300 hover:opacity-90 transition cursor-zoom-in"
                                />
                              </a>
                              <p className="text-[10px] text-violet-600 text-center">Tap to view full image</p>
                            </div>
                          )}


                          {!isLoaded && !isUnloaded && (
                            <div className="mt-2.5 p-2 bg-amber-50/90 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center gap-1.5 font-medium">
                              <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                              <span>Trip start is locked until this cargo is weighed and sealed.</span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="pt-3 border-t border-slate-200 mt-3 flex items-center gap-2">
                          {!isLoaded && !isUnloaded && (() => {
                            const isOfficerAtPickup = isOfficerAuthorizedForTarget(officer?.station, effectivePickupPlace);
                            if (!isOfficerAtPickup) {
                              return (
                                <div className="flex-1 space-y-1.5">
                                  <div className="rounded-xl bg-amber-50 border border-amber-300 py-1.5 px-2.5 text-center text-[11px] text-amber-950 flex flex-col items-center justify-center gap-0.5">
                                    <div className="flex items-center gap-1 font-bold text-amber-900">
                                      <Lock size={13} className="text-amber-700" />
                                      <span>Loading Locked: Station Mismatch</span>
                                    </div>
                                    <span className="text-[10px] text-amber-800">
                                      Pickup Dock: <strong>{effectivePickupPlace}</strong> · Officer at: <span className="font-mono">{officer?.station || 'Other'}</span>
                                    </span>
                                  </div>
                                  <button
                                    disabled
                                    className="w-full py-2 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl border border-slate-200 cursor-not-allowed flex items-center justify-center gap-1 opacity-80"
                                    title={`Only the logistics officer stationed at ${effectivePickupPlace} can verify and load this cargo.`}
                                  >
                                    <Lock size={13} className="text-amber-600" />
                                    <span>🔒 Loading Locked (Only {pickupCityName} Officer)</span>
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <button
                                onClick={() => setLoadingModal({
                                  isOpen: true,
                                  shipment: { ...s, pickup_place: effectivePickupPlace, delivery_place: effectiveDeliveryPlace },
                                  loading_type: 'pickup',
                                  seal_number: s.seal_number || `SL-${Math.floor(10000 + Math.random() * 90000)}`,
                                  seal_status: 'verified_intact',
                                  verified_weight_kg: s.goods_weight_kg,
                                  ice_available_at_pickup: Boolean(s.is_perishable && s.ice_handling_required),
                                  ice_boxes_added: (s.is_perishable && s.ice_handling_required) ? 2 : (s.is_perishable ? 2 : 0),
                                  temp_celsius: s.current_temp_c || 3.8,
                                  notes: 'Weighed on electronic tare scale and stacked safely. Security seal tag affixed.',
                                  submitting: false
                                })}
                                className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                              >
                                <span>📥 Verify & Load at Pickup</span>
                              </button>
                            );
                          })()}

                          {isLoaded && !isUnloaded && (
                            !isTripStarted ? (
                              <div className="flex-1 space-y-1.5">
                                <div className="rounded-xl bg-amber-50 border border-amber-200/90 py-1.5 px-2.5 text-center text-[11px] text-amber-900 flex items-center justify-center gap-1.5 font-medium">
                                  <span>⏳</span>
                                  <span>Trip has not started yet. Unloading unlocks once driver departs.</span>
                                </div>
                                <button
                                  disabled
                                  className="w-full py-2 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl border border-slate-200 cursor-not-allowed flex items-center justify-center gap-1.5 opacity-80 select-none"
                                  title="Trip has not started yet. Unloading at drop destination unlocks only after the driver departs."
                                >
                                  <Lock size={13} className="text-amber-500" />
                                  <span>Unloading Locked (Trip Not Started)</span>
                                </button>
                              </div>
                            ) : !isUnloadAllowed ? (
                              <div className="flex-1 space-y-1.5">
                                <div className="rounded-xl bg-rose-50 border border-rose-300 py-1.5 px-2.5 text-center text-[11px] text-rose-950 flex flex-col items-center justify-center gap-1 font-medium shadow-2xs">
                                  <div className="flex items-center gap-1 text-rose-900 font-bold">
                                    <ShieldAlert size={14} className="text-rose-600" />
                                    <span>Unloading Locked: Checkpoints Incomplete</span>
                                  </div>
                                  <div className="text-[10.5px] text-rose-800 leading-tight">
                                    🛑 Next Required Checkpoint: <strong className="text-rose-950 underline">{nextInspectionHalt}</strong>
                                    {remainingHalts > 0 && <span className="font-mono"> ({remainingHalts} halt{remainingHalts > 1 ? 's' : ''} left)</span>}
                                  </div>
                                </div>
                                <button
                                  disabled
                                  className="w-full py-2 bg-rose-50/80 text-rose-700 font-bold text-xs rounded-xl border border-rose-300 cursor-not-allowed flex items-center justify-center gap-1.5 opacity-85 select-none"
                                  title={`Unloading locked until all highway checkpoint inspections are completed. Next halt: ${nextInspectionHalt}`}
                                >
                                  <Lock size={13} className="text-rose-600" />
                                  <span>🔒 Unload Locked ({remainingHalts} Checkpoint{remainingHalts > 1 ? 's' : ''} Left)</span>
                                </button>
                              </div>
                            ) : (() => {
                              const isOfficerAtDrop = isOfficerAuthorizedForTarget(officer?.station, effectiveDeliveryPlace);
                              if (!isOfficerAtDrop) {
                                return (
                                  <div className="flex-1 space-y-1.5">
                                    <div className="rounded-xl bg-amber-50 border border-amber-300 py-1.5 px-2.5 text-center text-[11px] text-amber-950 flex flex-col items-center justify-center gap-0.5 shadow-2xs">
                                      <div className="flex items-center gap-1 text-amber-900 font-bold">
                                        <Lock size={13} className="text-amber-700" />
                                        <span>Unload Locked: Station Mismatch</span>
                                      </div>
                                      <div className="text-[10.5px] text-amber-800 leading-tight">
                                        Destination: <strong>{effectiveDeliveryPlace}</strong>
                                        <div className="text-[10px] text-amber-700">Corridor cleared! But handover is restricted to destination officer.</div>
                                      </div>
                                    </div>
                                    <button
                                      disabled
                                      className="w-full py-2 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl border border-slate-300 cursor-not-allowed flex items-center justify-center gap-1.5 opacity-85 select-none"
                                      title={`All highway inspections completed! Final unloading and consignee handover can only be performed by the officer stationed at ${effectiveDeliveryPlace}.`}
                                    >
                                      <Lock size={13} className="text-amber-600" />
                                      <span>🔒 Unload Locked (Only {dropCityName} Officer)</span>
                                    </button>
                                  </div>
                                );
                              }

                              return (
                                <button
                                  onClick={() => setLoadingModal({
                                    isOpen: true,
                                    shipment: { ...s, delivery_place: effectiveDeliveryPlace, pickup_place: effectivePickupPlace },
                                    loading_type: 'drop',
                                    seal_number: s.seal_number || parentTrip?.seal_number || '',
                                    seal_status: 'unsealed_at_destination',
                                    verified_weight_kg: s.goods_weight_kg,
                                    ice_boxes_added: 0,
                                    temp_celsius: s.current_temp_c || 4.0,
                                    notes: 'Security seal tag verified before unsealing. Received in good condition.',
                                    submitting: false
                                  })}
                                  className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                                >
                                  <Package size={15} />
                                  <span>📤 Supervise Unload & Handover</span>
                                </button>
                              );
                            })()
                          )}


                          {isUnloaded && (
                            <div className="w-full py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center text-xs font-semibold">
                              ✔ Handover Complete & Signoff Archived
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: PERISHABLES & COLD-CHAIN ICE HANDLING */}
        {/* ============================================================== */}
        {activeTab === 'coldchain' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="font-display font-bold text-xl text-slate-800 flex items-center gap-2 flex-wrap">
                    <Snowflake className="text-cyan-600" size={24} />
                    <span>Perishable Goods Spoilage Defense & Ice Station</span>
                    {officer?.station && (
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[11px] font-bold border border-cyan-200">
                        📍 {officer.station} Cold-Chain
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {officer?.station
                      ? `Continuous temperature logging and ice replenishment for perishable shipments traversing ${officer.station}.`
                      : 'Continuous temperature logging, crushed ice / dry-ice replenishment, and shelf-life preservation window extension.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                    🟢 Optimal 0-4°C
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                    🟡 Warning 4-8°C
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                    🔴 Critical &gt;8°C
                  </span>
                </div>
              </div>

              {perishableShipments.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Snowflake size={36} className="mx-auto mb-2 opacity-40 text-cyan-500" />
                  <p className="text-sm font-semibold">No perishable goods currently registered in transit.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {perishableShipments.map(s => {
                    const parentTrip = trips.find(t => t.id === s.trip_id);
                    const temp = s.current_temp_c !== null && s.current_temp_c !== undefined ? s.current_temp_c : 3.8;
                    const isOptimal = temp <= 4.0;
                    const isWarning = temp > 4.0 && temp <= 8.0;
                    const isCritical = temp > 8.0;

                    const isAtPickup = (s.loading_status === 'pending');
                    const isLoaded = (s.loading_status === 'loaded');
                    const hasIceAlready = Boolean(s.ice_added) || (Number(s.ice_boxes_count) > 0 && !s.ice_unavailable_at_pickup);
                    const missedIceAtPickup = isLoaded && (!hasIceAlready || Boolean(s.ice_unavailable_at_pickup));

                    return (
                      <div
                        key={s.id}
                        className={`rounded-2xl border p-4 transition shadow-xs flex flex-col justify-between ${
                          isCritical ? 'bg-rose-50/70 border-rose-300' :
                          isWarning ? 'bg-amber-50/70 border-amber-300' :
                          'bg-cyan-50/40 border-cyan-200'
                        }`}
                      >
                        <div>
                          {/* Top Row */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-white/80 border text-slate-700">
                                  ❄️ Cold-Chain Perishable
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-300">
                                  Request #{s.id}
                                </span>
                                {isAtPickup ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                                    ⏳ At Pickup (Starting Point)
                                  </span>
                                ) : hasIceAlready ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                                    ✔ Ice Supplied ({s.ice_added_stage === 'checkpoint' ? 'Nearest Checkpoint' : 'Pickup'})
                                  </span>
                                ) : missedIceAtPickup ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-900 border border-rose-300 animate-pulse">
                                    🚨 Ice Missed at Pickup — Needed at Checkpoint
                                  </span>
                                ) : null}
                              </div>
                              <h3 className="font-display font-bold text-lg text-slate-900 mt-1">
                                {s.cargo_type} ({s.goods_weight_kg} kg)
                              </h3>
                              <p className="text-xs text-slate-600">
                                Farmer: <strong>{s.farmer_name}</strong> · Vehicle: <strong>{s.vehicle}</strong> ({s.driver_name})
                              </p>
                            </div>

                            {/* Big Temp Gauge */}
                            <div className="text-right">
                              <div className={`px-3 py-1.5 rounded-xl font-mono font-extrabold text-base border inline-flex items-center gap-1 shadow-xs ${
                                isCritical ? 'bg-rose-600 text-white border-rose-700 animate-pulse' :
                                isWarning ? 'bg-amber-500 text-white border-amber-600' :
                                'bg-emerald-600 text-white border-emerald-700'
                              }`}>
                                <Thermometer size={16} />
                                <span>{temp}°C</span>
                              </div>
                              <p className="text-[10px] font-semibold mt-1 text-slate-600">
                                {isOptimal ? '🟢 Safe Chilled' : isWarning ? '🟡 Add Ice Soon' : '🔴 Spoilage Alert!'}
                              </p>
                            </div>
                          </div>

                          {/* Ice Metrics Box */}
                          <div className="mt-3 bg-white/90 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Ice Preservation Timer:</span>
                              <span className="font-mono font-bold text-slate-800">
                                {hasIceAlready ? (isOptimal ? '~6h 30m safe' : isWarning ? '~1h 45m remaining' : 'MELTED') : 'Not Preserved (Awaiting Ice)'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Ice Boxes / Coolant on board:</span>
                              <span className={`font-bold ${hasIceAlready ? 'text-emerald-800' : missedIceAtPickup ? 'text-rose-700 font-bold' : 'text-slate-800'}`}>
                                {hasIceAlready
                                  ? `${s.ice_boxes_count || 2} boxes (Supplied once at ${s.ice_added_stage || 'pickup'})`
                                  : missedIceAtPickup
                                  ? '0 boxes (Missed at pickup dock)'
                                  : 'Pending starting point addition'}
                              </span>
                            </div>
                            <div className="flex items-start justify-between pt-1 border-t border-slate-100 text-[11px]">
                              <span className="text-emerald-700 font-bold shrink-0">📍 Specific Pickup Dock:</span>
                              <span className="text-slate-800 font-semibold truncate max-w-[200px]">{s.pickup_place}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-amber-800 font-bold flex items-center gap-1">
                                <span>🛑</span> Next Highway Inspection:
                              </span>
                              <span className="font-mono font-bold text-amber-950">
                                {parentTrip?.next_inspection_point || s.next_inspection_point || 'Highway Checkpoint'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span>Corridor Route:</span>
                              <span className="text-slate-700 font-medium truncate max-w-[200px]">{s.route || s.pickup_place}</span>
                            </div>
                          </div>
                        </div>

                        {/* Ice Action - Strictly Available at Pickup, or at Nearest Checkpoint if missed at Pickup */}
                        <div className="pt-3 mt-3 border-t border-slate-200/80">
                          {isAtPickup ? (() => {
                            const isOfficerAtPickupForIce = isOfficerAuthorizedForTarget(officer?.station, s.pickup_place);
                            if (!isOfficerAtPickupForIce) {
                              return (
                                <div className="space-y-1.5">
                                  <div className="rounded-xl bg-amber-50 border border-amber-300 py-1.5 px-2.5 text-center text-[11px] text-amber-950 flex flex-col items-center justify-center gap-0.5">
                                    <div className="flex items-center gap-1 font-bold text-amber-900">
                                      <Lock size={13} className="text-amber-700" />
                                      <span>Ice Supply Restricted to Pickup Station</span>
                                    </div>
                                    <span className="text-[10px] text-amber-800">
                                      Pickup Dock: <strong>{s.pickup_place}</strong> · Officer at: <span className="font-mono">{officer?.station || 'Other'}</span>
                                    </span>
                                  </div>
                                  <button
                                    disabled
                                    className="w-full py-2 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl border border-slate-200 cursor-not-allowed flex items-center justify-center gap-1 opacity-80"
                                  >
                                    <Lock size={13} className="text-cyan-700" />
                                    <span>🔒 Ice Locked (Only {s.pickup_place?.split(',')?.[0]} Officer)</span>
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <button
                                onClick={() => setIceModal({
                                  isOpen: true,
                                  shipment: s,
                                  stage: 'pickup',
                                  ice_kg_added: 10,
                                  ice_type: 'Crushed Flake Ice',
                                  temp_before: temp,
                                  temp_after: Math.max(1.5, temp - 3.0),
                                  notes: 'Supplied ice boxes once at starting pickup point.',
                                  submitting: false
                                })}
                                className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Snowflake size={15} />
                                <span>🧊 Add Ice Box at Pickup Dock (Starting Point)</span>
                              </button>
                            );
                          })() : hasIceAlready ? (
                            <div className="w-full py-2 px-3 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs flex items-center justify-between gap-1.5">
                              <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                                <Lock size={13} className="text-slate-400" />
                                <span>Ice Added Once ({s.ice_added_stage === 'checkpoint' ? 'Nearest Checkpoint' : 'Pickup Dock'})</span>
                              </span>
                              <span className="text-[10px] uppercase font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Locked (1x Fulfilled)
                              </span>
                            </div>
                          ) : missedIceAtPickup ? (() => {
                            const targetNearestHalt = parentTrip?.next_inspection_point || s.next_inspection_point;
                            const desCpHalt = parentTrip?.designated_checkpoints?.find(d => (d.checkpoint_name || '').toLowerCase() === (targetNearestHalt || '').toLowerCase());
                            const isOfficerAtNearestHalt = isOfficerAuthorizedForTarget(officer?.station, targetNearestHalt, desCpHalt);

                            if (!isOfficerAtNearestHalt) {
                              return (
                                <div className="space-y-1.5">
                                  <div className="rounded-xl bg-amber-50 border border-amber-300 py-1.5 px-2.5 text-center text-[11px] text-amber-950 flex flex-col items-center justify-center gap-0.5 shadow-2xs">
                                    <div className="flex items-center gap-1 text-amber-900 font-bold">
                                      <Lock size={13} className="text-amber-700" />
                                      <span>Nearest Checkpoint Ice Locked</span>
                                    </div>
                                    <div className="text-[10.5px] text-amber-800 leading-tight">
                                      Next Halt: <strong>{targetNearestHalt}</strong>
                                      <div className="text-[10px] text-amber-700">Only the officer stationed at this checkpoint can fulfill emergency ice.</div>
                                    </div>
                                  </div>
                                  <button
                                    disabled
                                    className="w-full py-2.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl border border-slate-300 cursor-not-allowed flex items-center justify-center gap-1.5 opacity-85 select-none"
                                  >
                                    <Lock size={14} className="text-cyan-600" />
                                    <span>🔒 Ice Locked (Awaiting Officer at {targetNearestHalt?.split(' - ')?.[1] || 'Halt'})</span>
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <button
                                onClick={() => setIceModal({
                                  isOpen: true,
                                  shipment: s,
                                  stage: 'checkpoint',
                                  ice_kg_added: 10,
                                  ice_type: 'Crushed Flake Ice',
                                  temp_before: temp,
                                  temp_after: Math.max(1.5, temp - 3.0),
                                  notes: 'Ice was unavailable at pickup; supplied at nearest highway inspection point.',
                                  submitting: false
                                })}
                                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                              >
                                <Snowflake size={15} />
                                <span>❄️ Add Ice Box at Nearest Inspection Point</span>
                              </button>
                            );
                          })() : (

                            <div className="w-full py-2 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl text-xs text-center">
                              Ice Addition Complete
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: CROSS-CONNECTED MANIFEST (TRIP + CARGO MERGED) */}
        {/* ============================================================== */}
        {activeTab === 'manifest' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm overflow-hidden">
              <div className="mb-5 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display font-bold text-xl text-slate-800 flex items-center gap-2 flex-wrap">
                    <span>📋 Unified Logistics Manifest (Driver + Shipper Data Connected)</span>
                    {officer?.station && (
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold border border-purple-200">
                        📍 {officer.station} Jurisdiction
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {officer?.station
                      ? `Consolidated manifest board of all trips and cargo bookings active within the ${officer.station} operational sector.`
                      : 'Connects driver vehicle specifications and route plans with shipper cargo requests, weights, and perishability requirements.'}
                  </p>
                </div>
              </div>

              {confirmedLedgerShipments.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-sm">No cargo records found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase font-mono text-[10.5px] border-b border-slate-200">
                        <th className="py-3 px-4">Booking ID</th>
                        <th className="py-3 px-4">Category & Purpose</th>
                        <th className="py-3 px-4">Commodity</th>
                        <th className="py-3 px-4">Weight</th>
                        <th className="py-3 px-4">Security Seal</th>
                        <th className="py-3 px-4">Cold-Chain</th>
                        <th className="py-3 px-4">Shipper (Sender)</th>
                        <th className="py-3 px-4">Transporter (Driver)</th>
                        <th className="py-3 px-4">Route</th>
                        <th className="py-3 px-4">Handling Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {confirmedLedgerShipments.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">#{s.id.slice(-6)}</td>
                          <td className="py-3 px-4">
                            {s.is_dedicated ? (
                              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold text-[10px] border border-purple-200 block w-max">
                                🔒 Dedicated: {s.dedicated_sub_category || 'Isolated'}
                              </span>
                            ) : s.cargo_category === 'Perishable Goods' || s.is_perishable ? (
                              <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-900 font-bold text-[10px] border border-cyan-200 block w-max">
                                ❄️ Perishable ({s.cooling_type || 'Ice Box'})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[10px] border border-slate-200 block w-max">
                                📦 Independent
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{s.cargo_type}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">{s.goods_weight_kg} kg</td>
                          <td className="py-3 px-4">
                            {s.seal_number ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-mono font-bold text-[10.5px] border border-emerald-300">
                                🔐 #{s.seal_number}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px] font-mono">Pending Tag</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {s.is_perishable ? (
                              <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-900 font-bold text-[10px] inline-flex items-center gap-1">
                                <Snowflake size={10} /> {s.current_temp_c !== null ? `${s.current_temp_c}°C` : 'Ice Prep'}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Ambient</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-800">{s.farmer_name}</p>
                            {s.farmer_phone && <p className="text-[10px] text-slate-500 font-mono">📱 {s.farmer_phone}</p>}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-800">{s.driver_name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{s.vehicle}</p>
                          </td>
                          <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{s.route}</td>
                          <td className="py-3 px-4">
                            {(() => {
                              const parentTrip = trips.find(t => t.id === s.trip_id);
                              const isTripStarted = Boolean(
                                s.trip_started ||
                                (parentTrip && (['in_transit', 'moving', 'started', 'pending_passenger_confirmation', 'completed'].includes(parentTrip.status) || parentTrip.is_live)) ||
                                (['in_transit', 'moving', 'started', 'pending_passenger_confirmation', 'completed'].includes(s.trip_status) || s.is_live)
                              );
                              const isTripCompleted = s.trip_status === 'completed' || s.status === 'completed' || parentTrip?.status === 'completed';

                              return (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isTripCompleted ? 'bg-emerald-100 text-emerald-800' :
                                  s.loading_status === 'unloaded' ? 'bg-purple-100 text-purple-800' :
                                  s.loading_status === 'loaded' ? (isTripStarted ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800') :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {isTripCompleted
                                    ? '✔ COMPLETED'
                                    : (s.loading_status === 'loaded' && !isTripStarted
                                      ? 'LOADED (AWAITING DEPARTURE)'
                                      : (s.loading_status || 'Pending').toUpperCase())}
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: CORRIDOR RADAR MAP */}
        {/* ============================================================== */}
        {activeTab === 'corridor_map' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="font-display font-bold text-xl text-slate-800 flex items-center gap-2">
                    <Compass className="text-emerald-700" size={24} />
                    <span>Highway Logistics Corridor & Radar Map</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Visualizing highway corridors, certified checkpoints (🛡️), next required halts (🛑), and individual shipper pickup docks (📦 / 🧊).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600">Select Corridor Route:</label>
                  <select
                    value={selectedMapTripId || ''}
                    onChange={e => setSelectedMapTripId(Number(e.target.value) || null)}
                    className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-emerald-600"
                  >
                    <option value="">All Active Corridors ({trips.length})</option>
                    {trips.map(t => (
                      <option key={t.id} value={t.id}>
                        #{t.id} {t.from_loc?.split(',')[0]} → {t.to_loc?.split(',')[0]} ({t.driver_name || t.owner})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-300 shadow-inner h-[620px] relative bg-slate-100">
                <Maps
                  mode="logistics"
                  trips={trips}
                  selectedTripId={selectedMapTripId}
                  onTripSelect={t => setSelectedMapTripId(t.id)}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                  <span className="text-base">🛡️</span>
                  <div>
                    <p className="font-bold text-emerald-950">Certified Checkpoint</p>
                    <p className="text-[11px] text-emerald-700">Seal & tare scale verified</p>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                  <span className="text-base">🛑</span>
                  <div>
                    <p className="font-bold text-amber-950">Next Inspection Point</p>
                    <p className="text-[11px] text-amber-700">Required before unload</p>
                  </div>
                </div>
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center gap-2">
                  <span className="text-base">🧊</span>
                  <div>
                    <p className="font-bold text-sky-950">Cold-Chain Pickup Dock</p>
                    <p className="text-[11px] text-sky-700">Per-request ice boxes</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                  <span className="text-base">📦</span>
                  <div>
                    <p className="font-bold text-slate-950">General Cargo Dock</p>
                    <p className="text-[11px] text-slate-700">Individual pickup point</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ============================================================== */}
      {/* MODAL 1: CHECKPOINT STOP INSPECTION MODAL */}
      {/* ============================================================== */}
      {checkpointModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛑</span>
                <h3 className="font-display font-bold text-lg text-slate-900">
                  Log Transit Stop Inspection
                </h3>
              </div>
              <button
                onClick={() => setCheckpointModal(p => ({ ...p, isOpen: false }))}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitCheckpoint} className="space-y-3.5 max-h-[80vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Checkpoint / Toll Plaza Location
                  </label>
                  <input
                    type="text"
                    required
                    value={checkpointModal.checkpoint_name}
                    onChange={e => setCheckpointModal(p => ({ ...p, checkpoint_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Checkpoint Station Type
                  </label>
                  <select
                    value={checkpointModal.checkpoint_type || 'Highway Toll Plaza'}
                    onChange={e => setCheckpointModal(p => ({ ...p, checkpoint_type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-emerald-600"
                  >
                    <option value="Highway Toll Plaza">Highway Toll Plaza</option>
                    <option value="Weighbridge Station">Weighbridge Scale Station</option>
                    <option value="Mandi Gate Checkpoint">Mandi Gate Checkpoint</option>
                    <option value="Border Transit Hub">State Border Transit Hub</option>
                    <option value="Cold Storage Terminal">Cold Storage Logistics Terminal</option>
                  </select>
                </div>
              </div>

              {/* SECURITY SEAL VERIFICATION CARD */}
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-700" />
                    Cargo Security Seal Inspection
                  </span>
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-800">ISO 17712</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Security Seal Tag #
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SL-94021"
                      value={checkpointModal.seal_number || ''}
                      onChange={e => setCheckpointModal(p => ({ ...p, seal_number: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-white focus:outline-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Seal Integrity Status
                    </label>
                    <select
                      value={checkpointModal.seal_status || 'verified_intact'}
                      onChange={e => {
                        const val = e.target.value;
                        setCheckpointModal(p => ({
                          ...p,
                          seal_status: val,
                          cargo_seal_intact: val === 'verified_intact'
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:outline-emerald-600"
                    >
                      <option value="verified_intact">✔ Intact & Locked</option>
                      <option value="tampered_broken">⚠ Tampered / Broken</option>
                      <option value="resealed_new_tag">🔄 Re-sealed (New Tag)</option>
                      <option value="unsealed_at_destination">🔓 Unsealed (At Drop)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* WEIGHBRIDGE & SCALE COMPLIANCE CARD */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    ⚖ Weighbridge Scale Compliance
                  </span>
                  {(() => {
                    const diff = (Number(checkpointModal.measured_weight_kg) || 0) - (Number(checkpointModal.declared_weight_kg) || 0);
                    const isOk = Math.abs(diff) <= 25;
                    return (
                      <span className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isOk ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {diff === 0 ? 'Exact Match (0 kg)' : `${diff > 0 ? '+' : ''}${diff} kg discrepancy (${isOk ? 'Compliant' : 'Flagged'})`}
                      </span>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Measured Gross / Cargo (kg)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 450"
                      value={checkpointModal.measured_weight_kg ?? ''}
                      onChange={e => {
                        const val = e.target.value;
                        const diff = Math.abs((Number(val) || 0) - (Number(checkpointModal.declared_weight_kg) || 0));
                        setCheckpointModal(p => ({
                          ...p,
                          measured_weight_kg: val,
                          weight_compliant: diff <= 25
                        }));
                      }}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-white focus:outline-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Declared Manifest (kg)
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={checkpointModal.declared_weight_kg ?? ''}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-100 text-slate-600"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkpointModal.weight_compliant !== false}
                      onChange={e => setCheckpointModal(p => ({ ...p, weight_compliant: e.target.checked }))}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Weighbridge Certified: Weight within legal highway tolerance</span>
                  </label>
                </div>
              </div>

              {/* SAFETY PARAMETERS & LOAD CONDITION */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vehicle Safety & Lashing
                  </label>
                  <select
                    value={checkpointModal.safety_parameters_status || 'Passed All Safety Checks'}
                    onChange={e => setCheckpointModal(p => ({ ...p, safety_parameters_status: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Passed All Safety Checks">✔ All Safety Checks Passed</option>
                    <option value="Minor Warning (Straps Adjusted)">Minor Warning (Straps)</option>
                    <option value="Safety Violation (Exceeding Limit)">⚠ Safety Violation (Overload)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cargo Stability
                  </label>
                  <select
                    value={checkpointModal.cargo_condition}
                    onChange={e => setCheckpointModal(p => ({ ...p, cargo_condition: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Intact & Good">Intact & Good</option>
                    <option value="Minor Shift">Minor Shift</option>
                    <option value="Damage Reported">Damage Reported</option>
                  </select>
                </div>
              </div>

              {/* COLD CHAIN INSPECTION (ONLY IF PERISHABLE TRIP OR SHIPMENT REQUIRES ICE) */}
              {(checkpointModal.trip?.cargo_category === 'Perishable Goods' || (checkpointModal.trip?.bookings && checkpointModal.trip.bookings.some(b => b.ice_handling_required))) && (
                <div className="grid grid-cols-2 gap-3 bg-cyan-50/60 p-2.5 rounded-xl border border-cyan-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ice / Cooling Status
                    </label>
                    <select
                      value={checkpointModal.ice_status}
                      onChange={e => setCheckpointModal(p => ({ ...p, ice_status: e.target.value }))}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    >
                      <option value="Adequate">Adequate Ice</option>
                      <option value="Melting - Re-iced">Melting - Re-iced</option>
                      <option value="Dry Ice Replaced">Dry Ice Replaced</option>
                      <option value="Not Applicable">Not Applicable</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Core Temp (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 3.5"
                      value={checkpointModal.temp_celsius ?? ''}
                      onChange={e => setCheckpointModal(p => ({ ...p, temp_celsius: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Officer Action Taken & Notes
                </label>
                <textarea
                  rows={2}
                  value={checkpointModal.action_taken}
                  onChange={e => setCheckpointModal(p => ({ ...p, action_taken: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={checkpointModal.submitting}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                >
                  {checkpointModal.submitting ? 'Recording Inspection...' : 'Confirm & Stamp Checkpoint'}
                </button>
                <button
                  type="button"
                  onClick={() => setCheckpointModal(p => ({ ...p, isOpen: false }))}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: LOADING & UNLOADING ASSISTANCE MODAL */}
      {/* ============================================================== */}
      {loadingModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📦</span>
                <h3 className="font-display font-bold text-lg text-slate-900">
                  {loadingModal.loading_type === 'pickup' ? 'Supervise Pickup Loading' : 'Supervise Drop Unloading'}
                </h3>
              </div>
              <button
                onClick={() => setLoadingModal(p => ({ ...p, isOpen: false }))}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitLoading} className="space-y-3.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <p className="text-slate-600">Commodity: <strong className="text-slate-900">{loadingModal.shipment?.cargo_type}</strong></p>
                <p className="text-slate-600">Shipper: <strong className="text-slate-900">{loadingModal.shipment?.farmer_name}</strong></p>
                {loadingModal.shipment?.is_dedicated && (
                  <p className="text-purple-700 font-bold">🔒 Dedicated: {loadingModal.shipment?.dedicated_sub_category || 'Isolated'}</p>
                )}
              </div>

              {loadingModal.loading_type === 'drop' && (() => {
                const parentTrip = trips.find(t => t.id === loadingModal.shipment?.trip_id);
                const isTripStarted = Boolean(
                  loadingModal.shipment?.trip_started ||
                  (parentTrip && (['in_transit', 'moving', 'started', 'pending_passenger_confirmation', 'completed'].includes(parentTrip.status) || parentTrip.is_live)) ||
                  (['in_transit', 'moving', 'started', 'pending_passenger_confirmation', 'completed'].includes(loadingModal.shipment?.trip_status) || loadingModal.shipment?.is_live)
                );
                if (!isTripStarted) {
                  return (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                      <Lock size={15} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Trip Not Started Yet</p>
                        <p className="text-[11px] mt-0.5">The transport vehicle has not departed from the pickup origin. Drop unloading can only be supervised once the trip begins.</p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* SECURITY SEAL INPUT / VERIFICATION */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                <label className="block text-xs font-bold text-emerald-950">
                  {loadingModal.loading_type === 'pickup' ? 'Attach Security Seal Tag #' : 'Verify Security Seal Tag #'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SL-90214"
                  value={loadingModal.seal_number || ''}
                  onChange={e => setLoadingModal(p => ({ ...p, seal_number: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-white focus:outline-emerald-600"
                />
                <p className="text-[11px] text-slate-500">
                  {loadingModal.loading_type === 'pickup'
                    ? 'Affix numbered tamper-evident seal before truck leaves loading dock.'
                    : 'Inspect seal tag intactness before cutting seal to unload cargo.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Scale Weighed Cargo (kg)
                </label>
                <input
                  type="number"
                  required
                  value={loadingModal.verified_weight_kg}
                  onChange={e => setLoadingModal(p => ({ ...p, verified_weight_kg: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                />
              </div>

              {loadingModal.loading_type === 'pickup' && (
                loadingModal.shipment?.is_perishable && loadingModal.shipment?.ice_handling_required ? (
                  <div className="p-3 bg-cyan-50/80 border border-cyan-300 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-cyan-950 flex items-center gap-1.5">
                        <Snowflake size={14} className="text-cyan-700" />
                        <span>Cold-Chain Ice Box Addition (Starting Point)</span>
                      </label>
                      <span className="text-[10px] font-mono font-bold bg-cyan-200 text-cyan-900 px-2 py-0.5 rounded-full">
                        Pickup Only
                      </span>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={loadingModal.ice_available_at_pickup !== false}
                        onChange={e => {
                          const avail = e.target.checked;
                          setLoadingModal(p => ({
                            ...p,
                            ice_available_at_pickup: avail,
                            ice_boxes_added: avail ? (p.ice_boxes_added || 2) : 0
                          }));
                        }}
                        className="rounded text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="font-semibold text-slate-800">Ice is available & supplied now at pickup</span>
                    </label>

                    {loadingModal.ice_available_at_pickup !== false ? (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Number of Ice Boxes / Gel Packs Added:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={loadingModal.ice_boxes_added || 2}
                          onChange={e => setLoadingModal(p => ({ ...p, ice_boxes_added: Number(e.target.value) }))}
                          className="w-full px-3 py-1.5 rounded-lg border border-cyan-300 text-xs font-mono font-bold bg-white"
                        />
                        <p className="text-[10.5px] text-cyan-800 mt-1">
                          ✔ Ice can only be added once at this starting point. After pickup, addition will not be available.
                        </p>
                      </div>
                    ) : (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-snug">
                        ⚠ <strong>Ice not available at pickup:</strong> Flagged for mandatory addition at the <strong>nearest inspection checkpoint</strong> along the highway corridor.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-100 rounded-xl text-[11px] text-slate-600 border border-slate-200">
                    📦 <strong>Standard Non-Ice Cargo:</strong> This shipment does not require ice coolant boxes.
                  </div>
                )
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Temperature Reading (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={loadingModal.temp_celsius}
                  onChange={e => setLoadingModal(p => ({ ...p, temp_celsius: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Inspection Observations / Signoff Notes
                </label>
                <textarea
                  rows={2}
                  value={loadingModal.notes}
                  onChange={e => setLoadingModal(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {loadingModal.loading_type === 'drop' && (() => {
                const parentTrip = trips.find(t => t.id === loadingModal.shipment?.trip_id);
                const isUnloadPermitted = (loadingModal.shipment?.is_unload_allowed !== undefined ? loadingModal.shipment.is_unload_allowed : (parentTrip?.is_unload_allowed !== undefined ? parentTrip.is_unload_allowed : true)) && (parentTrip?.inspections_remaining ?? (loadingModal.shipment?.inspections_remaining ?? 0)) === 0;
                if (!isUnloadPermitted) {
                  const nextHalt = parentTrip?.next_inspection_point || loadingModal.shipment?.next_inspection_point || 'Highway Checkpoint';
                  const rem = parentTrip?.inspections_remaining ?? (loadingModal.shipment?.inspections_remaining ?? 1);
                  return (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-900 flex items-center gap-2 font-medium">
                      <ShieldAlert size={16} className="text-rose-600 shrink-0" />
                      <span>Unloading locked: {rem} checkpoint inspection(s) remaining. Next required checkup: <strong>{nextHalt}</strong>.</span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* DELIVERY PROOF PHOTO — only for drop/unload */}
              {loadingModal.loading_type === 'drop' && (
                <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-violet-900">
                    📸 Delivery Proof Photo <span className="text-rose-600">*</span>
                  </label>
                  <p className="text-[11px] text-violet-700">Capture or upload a photo confirming cargo handover to the consignee at the final destination.</p>
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="delivery-proof-upload"
                      className="flex-1 cursor-pointer py-2 px-3 rounded-xl border-2 border-dashed border-violet-300 hover:border-violet-500 bg-white text-center text-xs font-semibold text-violet-700 hover:text-violet-900 transition"
                    >
                      {loadingModal.proof_uploading
                        ? '⏳ Uploading…'
                        : loadingModal.delivery_proof_image_url
                        ? '✅ Photo Uploaded – Replace?'
                        : '📷 Tap to capture / upload photo'}
                      <input
                        id="delivery-proof-upload"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          // Show preview immediately
                          const previewUrl = URL.createObjectURL(file);
                          setLoadingModal(p => ({ ...p, proof_preview: previewUrl, proof_uploading: true }));
                          try {
                            const fd = new FormData();
                            fd.append('file', file);
                            const uploadRes = await fetch(`${API_BASE}/api/requests/upload-delivery-proof`, {
                              method: 'POST',
                              body: fd
                            });
                            const uploadData = await uploadRes.json();
                            if (uploadRes.ok && uploadData.delivery_proof_image_url) {
                              setLoadingModal(p => ({
                                ...p,
                                delivery_proof_image_url: uploadData.delivery_proof_image_url,
                                proof_uploading: false
                              }));
                            } else {
                              showBanner(uploadData.detail || 'Photo upload failed.', 'error');
                              setLoadingModal(p => ({ ...p, proof_uploading: false, proof_preview: null }));
                            }
                          } catch {
                            showBanner('Could not upload proof photo.', 'error');
                            setLoadingModal(p => ({ ...p, proof_uploading: false, proof_preview: null }));
                          }
                        }}
                      />
                    </label>
                    {loadingModal.proof_preview && (
                      <img
                        src={loadingModal.proof_preview}
                        alt="Delivery proof preview"
                        className="h-14 w-14 rounded-xl object-cover border-2 border-violet-400 shadow-md flex-shrink-0"
                      />
                    )}
                  </div>
                  {!loadingModal.delivery_proof_image_url && !loadingModal.proof_uploading && (
                    <p className="text-[10.5px] text-rose-600 font-semibold">⚠ Photo is required to complete the handover.</p>
                  )}
                </div>
              )}


              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={loadingModal.submitting || loadingModal.proof_uploading || (loadingModal.loading_type === 'drop' && !(() => {
                    const parentTrip = trips.find(t => t.id === loadingModal.shipment?.trip_id);
                    const isTripStarted = Boolean(
                      loadingModal.shipment?.trip_started ||
                      (parentTrip && (['in_transit', 'moving', 'started', 'pending_passenger_confirmation', 'completed'].includes(parentTrip.status) || parentTrip.is_live)) ||
                      (['in_transit', 'moving', 'started', 'pending_passenger_confirmation', 'completed'].includes(loadingModal.shipment?.trip_status) || loadingModal.shipment?.is_live)
                    );
                    const isUnloadPermitted = (loadingModal.shipment?.is_unload_allowed !== undefined ? loadingModal.shipment.is_unload_allowed : (parentTrip?.is_unload_allowed !== undefined ? parentTrip.is_unload_allowed : true)) && (parentTrip?.inspections_remaining ?? (loadingModal.shipment?.inspections_remaining ?? 0)) === 0;
                    const hasProofPhoto = Boolean(loadingModal.delivery_proof_image_url);
                    return isTripStarted && isUnloadPermitted && hasProofPhoto;
                  })())}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                >
                  {loadingModal.submitting ? 'Submitting...' : 'Sign & Complete Action'}
                </button>
                <button
                  type="button"
                  onClick={() => setLoadingModal(p => ({ ...p, isOpen: false }))}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: ICE REPLENISHMENT MODAL */}
      {/* ============================================================== */}
      {iceModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-cyan-200 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-100 mb-4">
              <div className="flex items-center gap-2">
                <Snowflake className="text-cyan-600" size={22} />
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 leading-tight">
                    {iceModal.stage === 'pickup' ? '🧊 Add Ice Box at Starting Point (Pickup)' : '❄️ Add Ice Box at Nearest Checkpoint'}
                  </h3>
                  <span className="text-[10px] font-mono uppercase font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    {iceModal.stage === 'pickup' ? 'One-Time Starting Point Addition' : 'Deferred Pickup Fallback'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIceModal(p => ({ ...p, isOpen: false }))}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className={`p-2.5 rounded-xl border text-xs mb-3 ${
              iceModal.stage === 'pickup'
                ? 'bg-cyan-50 border-cyan-200 text-cyan-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              {iceModal.stage === 'pickup' ? (
                <p>✔ <strong>Pickup Policy:</strong> Ice is added once at this starting point. After the vehicle departs pickup, addition of ice will no longer be available.</p>
              ) : (
                <p>⚠ <strong>Checkpoint Fallback:</strong> Ice was unavailable at pickup. Fulfilling the single-addition ice requirement at this nearest inspection point.</p>
              )}
            </div>

            <form onSubmit={handleSubmitIce} className="space-y-3.5">
              <div>
                <p className="text-xs text-slate-600">Commodity: <strong>{iceModal.shipment?.cargo_type}</strong></p>
                <p className="text-xs text-slate-600">Weight: <strong>{iceModal.shipment?.goods_weight_kg} kg</strong></p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ice Type
                  </label>
                  <select
                    value={iceModal.ice_type}
                    onChange={e => setIceModal(p => ({ ...p, ice_type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Crushed Flake Ice">Crushed Flake Ice</option>
                    <option value="Frozen Gel Packs">Frozen Gel Packs</option>
                    <option value="Dry Ice">Dry Ice (-78°C)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ice Added (kg)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.5"
                    value={iceModal.ice_kg_added}
                    onChange={e => setIceModal(p => ({ ...p, ice_kg_added: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Temp Before (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={iceModal.temp_before}
                    onChange={e => setIceModal(p => ({ ...p, temp_before: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stabilized Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={iceModal.temp_after}
                    onChange={e => setIceModal(p => ({ ...p, temp_after: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-cyan-400 bg-cyan-50/50 text-xs font-mono font-bold text-cyan-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preservation Notes
                </label>
                <textarea
                  rows={2}
                  value={iceModal.notes}
                  onChange={e => setIceModal(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={iceModal.submitting}
                  className="flex-1 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                >
                  {iceModal.submitting ? 'Applying Ice...' : (iceModal.stage === 'pickup' ? 'Confirm Ice Addition at Pickup' : 'Confirm Ice Addition at Checkpoint')}
                </button>
                <button
                  type="button"
                  onClick={() => setIceModal(p => ({ ...p, isOpen: false }))}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: CORRIDOR RADAR MAP MODAL */}
      {/* ============================================================== */}
      {corridorMapModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-scaleIn">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base flex items-center gap-2">
                  <Compass className="text-emerald-400" size={18} />
                  <span>Highway Logistics Radar & Checkpoint Map</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {corridorMapModal.trip 
                    ? `Trip #${corridorMapModal.trip.id}: ${corridorMapModal.trip.from_loc || corridorMapModal.trip.from} → ${corridorMapModal.trip.to_loc || corridorMapModal.trip.to} · Next Halt: ${corridorMapModal.trip.next_inspection_point || 'None'}`
                    : 'Select a corridor trip to inspect live routes, checkpoints & pickup docks'}
                </p>
              </div>
              <button
                onClick={() => setCorridorMapModal({ isOpen: false, trip: null })}
                className="p-1.5 rounded-full hover:bg-white/20 transition cursor-pointer text-slate-300 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Sub-header / route switcher */}
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Corridor Route:</span>
                <select
                  value={selectedMapTripId || corridorMapModal.trip?.id || ''}
                  onChange={e => {
                    const chosenId = Number(e.target.value);
                    setSelectedMapTripId(chosenId);
                    const found = trips.find(t => t.id === chosenId);
                    if (found) setCorridorMapModal(p => ({ ...p, trip: found }));
                  }}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 font-medium focus:outline-emerald-600"
                >
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>
                      #{t.id} {t.from_loc?.split(',')[0]} → {t.to_loc?.split(',')[0]} ({t.driver_name || t.owner})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  <span>🛡️</span> {corridorMapModal.trip?.checkpoint_count || corridorMapModal.trip?.checkpoints?.length || 0} Inspected
                </span>
                <span className="flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  <span>🛑</span> Next: <strong>{corridorMapModal.trip?.next_inspection_point || 'Checkpoint'}</strong>
                </span>
                <span className={`px-2 py-0.5 rounded-lg font-bold border text-[11px] ${
                  corridorMapModal.trip?.is_unload_allowed
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border-rose-300'
                }`}>
                  {corridorMapModal.trip?.is_unload_allowed ? '✔ Unload Permitted' : `🔒 Unload Locked (${corridorMapModal.trip?.inspections_remaining ?? 1} Checkpoint(s) Left)`}
                </span>
              </div>
            </div>

            <div className="p-2 flex-1 min-h-[480px] bg-slate-100 relative">
              <Maps
                mode="logistics"
                trips={corridorMapModal.trip ? [corridorMapModal.trip] : trips}
                selectedTripId={selectedMapTripId || corridorMapModal.trip?.id}
                onTripSelect={t => {
                  setSelectedMapTripId(t.id);
                  setCorridorMapModal(p => ({ ...p, trip: t }));
                }}
              />
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10.5px]">🛡️ Verified Checkpoints</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10.5px]">🛑 Next Inspection Point</span>
                <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold text-[10.5px]">🧊 Cold-Chain Docks</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10.5px]">📦 General Cargo Docks</span>
              </div>
              <button
                onClick={() => setCorridorMapModal({ isOpen: false, trip: null })}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Radar Map
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

