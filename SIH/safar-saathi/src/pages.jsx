import { API_BASE } from './apiConfig';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import {
  Camera,
  CheckCircle2,
  Upload,
  MapPin,
  Truck,
  Users,
  IndianRupee,
  MessageSquare,
  Route,
  Package,
  Search,
  X,
  Send,
  ShieldCheck,
  ArrowLeft,
  Info,
  Volume2,
  VolumeX,
  Play,
  Share2,
  Lock
} from 'lucide-react'

import { useLang, VEHICLE_CAPACITY_SPECS, getVehicleCapacitySpec } from './lib'
import { TTSButton, speakText, stopSpeech } from './tts'
import { AuthModal, AUTH_ROLE_TEXTS, GOOGLE_CLIENT_ID } from './AuthModal'
import { sendBookingToDriverWhatsApp, sendAcceptanceToFarmerWhatsApp, sendDeliveryCompleteWhatsApp } from './whatsapp'
export { LoginPage } from './LoginPage'

import {
  Btn,
  Chip,
  SackGauge,
  Field,
  inputCls,
  Reveal,
  useToast,
  checkSize,
  LocationAutocomplete,
  geocodeIndianLocation,
  isPointAlongRoute,
  haversineDistance,
  calculateHighwayTortuosityKm,
  isPassengerOnRoute,
  isDirectionAligned,
  isPickupBeforeDropAlongRoute,
  getOptimizedMultiStopTrip,
  calculateRouteAwarePrice,
  calculateStrictFare,
  getOsrmDistanceKm,
  AiPriceGuardrail,
  PtlUserPricingCard,
  ComponentErrorBoundary,
  distanceToSegmentKm,
  getCorridorMatchDetails
} from './ui'

import Maps from './maps'
import { useLocation, useNavigate } from 'react-router-dom'

/* =========================================================
   HOME
========================================================= */

export function Home() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [authModal, setAuthModal] = useState({ isOpen: false, intent: 'find' })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const heroRef = useRef(null)

  const sliderImages = [
    '/slide1.png',
    '/slide2.jpg',
    '/slide3.jpg',
    '/slide4.jpg'
  ]

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % sliderImages.length)
  }, [sliderImages.length])

  useEffect(() => {
    if (isHovered) return
    const timer = setInterval(() => {
      handleNext()
    }, 5000)
    return () => clearInterval(timer)
  }, [handleNext, isHovered])

  useEffect(() => {
    const handleScroll = () => {
      const el = heroRef.current
      if (!el) return

      const scrollY = window.scrollY
      const maxScroll = 400
      const progress = Math.min(scrollY / maxScroll, 1)

      const opacityVal = 1 - progress
      const blurVal = progress * 6
      const translateYVal = progress * 30

      el.style.opacity = opacityVal.toString()
      el.style.filter = `blur(${blurVal}px)`
      el.style.transform = `translateY(${translateYVal}px)`

      if (progress >= 1) {
        el.style.visibility = 'hidden'
        el.style.pointerEvents = 'none'
      } else {
        el.style.visibility = 'visible'
        el.style.pointerEvents = progress > 0.85 ? 'none' : 'auto'
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const steps = [
    [
      25,
      MapPin,
      t('how.step1.title', '1. Search Route'),
      t('how.step1.desc', 'Vehicle owners publish their route, travel date and available cargo space.')
    ],
    [
      50,
      Search,
      t('how.step2.title', '2. Request space'),
      t('how.step2.desc', 'People can search for suitable vehicles and request space for their goods.')
    ],
    [
      75,
      Package,
      t('how.step3.title', '3. Confirm the goods'),
      t('how.step3.desc', 'Enter the goods category, quantity and pickup details before sending your request.')
    ],
    [
      100,
      CheckCircle2,
      t('how.step4.title', '4. Complete delivery'),
      t('how.step4.desc', 'The trip is completed after the goods reach their destination.')
    ]
  ]

  return (
    <div className="w-full min-h-screen bg-[#F5F7F6] relative overflow-hidden pb-16">
      {/* Subtle cool background gradients/blurred shapes */}
      <div className="absolute top-[-100px] left-1/4 w-[600px] h-[600px] rounded-full bg-green/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-100px] w-[500px] h-[500px] rounded-full bg-indigo/5 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] left-[-100px] w-[450px] h-[450px] rounded-full bg-green/5 blur-[110px] pointer-events-none"></div>

      <section className="max-w-7xl mx-auto px-4 pt-8 sm:pt-12 relative z-10">
        {/* HERO SLIDESHOW CONTAINER */}
        <div
          ref={heroRef}
          className="relative w-full aspect-[16/9] min-h-[380px] md:min-h-0 rounded-3xl overflow-hidden shadow-2xl border border-green/10 transition-all duration-300 ease-out"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* 1. BACKGROUND SLIDESHOW LAYER */}
          <div className="absolute inset-0 z-0 select-none">
            {sliderImages.map((src, index) => {
              const isActive = index === currentIndex
              return (
                <div
                  key={src}
                  className={`absolute inset-0 transition-all duration-[1200ms] ease-in-out ${
                    isActive
                      ? 'opacity-100 scale-100 translate-x-0'
                      : 'opacity-0 scale-105 translate-x-4 pointer-events-none'
                  }`}
                >
                  <img
                    src={src}
                    alt="Safar Saathi Background"
                    className="w-full h-full object-cover"
                  />
                </div>
              )
            })}
          </div>

          {/* 2. GRADIENT OVERLAY (dark green/black transparent gradient, strongest on left behind text) */}
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/85 via-black/55 to-transparent"></div>
          {/* Subtle green tint overlay */}
          <div className="absolute inset-0 z-10 bg-green-deep/20 mix-blend-multiply"></div>

          {/* 3. FIXED FOREGROUND TEXT & BUTTONS LAYER */}
          <div className="absolute inset-0 z-20 flex items-center px-6 sm:px-12 md:px-16 pointer-events-none">
            <div className="max-w-xl text-left pointer-events-auto text-white">
              <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white drop-shadow-md leading-tight">
                Safar-Saathi
                <br />

                <span className="text-2xl sm:text-3.5xl text-gold-light font-bold">
                  सफ़र-साथी
                </span>
              </h1>

              <p className="mt-4 text-sm sm:text-base text-cream/90 font-medium max-w-md drop-shadow">
                {t('hero.sub', 'Find available vehicle space and move your goods easily without booking an entire vehicle.')}
                <br />

                <span className="text-xs text-cream/70 font-normal">
                  {t('hero.sub2', 'Send goods · Offer space · Share the journey')}
                </span>
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                {/* Find a Vehicle Button */}
                <button
                  onClick={() => navigate('/find')}
                  className="bg-green-deep text-cream px-6 py-3.5 rounded-xl font-semibold hover:bg-green border border-green-light/20 transition-all shadow-lg hover:-translate-y-0.5 cursor-pointer"
                >
                  {t('cta.find', 'Find a Vehicle')}
                </button>

                {/* Offer a Trip Button */}
                <button
                  onClick={() => navigate('/offer')}
                  className="bg-gold text-green-deep px-6 py-3.5 rounded-xl font-semibold hover:bg-gold-light transition-all shadow-lg hover:-translate-y-0.5 cursor-pointer"
                >
                  {t('cta.offer', 'Offer a Trip')}
                </button>

                {/* Logistics Operations Button */}
                <button
                  onClick={() => navigate('/logistics')}
                  className="bg-emerald-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-emerald-500 border border-emerald-400/30 transition-all shadow-lg hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
                >
                  <span>🛡️</span>
                  <span>{t('cta.logistics', 'Logistics Operations')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="max-w-7xl mx-auto mt-12 sm:mt-20">
          <Reveal>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-green-deep">
              {t('how.title', 'How It Works')}

              <span className="text-base font-body font-normal text-green-soft">
                {' '} / {t('how.sub', 'Simple transport in 4 steps')}
              </span>
            </h2>
          </Reveal>

          <div className="grid sm:grid-cols-4 gap-4 mt-6">
            {steps.map(([fill, Icon, h, d], i) => (
              <Reveal
                key={i}
                d={i * 90}
              >
                <div className="spot rounded-2xl bg-paper p-5 border border-gold/20 h-full">
                  <SackGauge
                    fill={fill}
                    Icon={Icon}
                  />

                  <h3 className="font-display font-bold text-lg text-green-deep mt-4">
                    {h}
                  </h3>

                  <p className="text-xs text-green-soft mt-1 leading-relaxed">
                    {d}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* LOGISTICS & COLD-CHAIN PILLAR SPOTLIGHT */}
        <div className="max-w-7xl mx-auto mt-12 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl text-left">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-mono font-bold uppercase tracking-wider inline-block mb-2">
              🛡️ Ground Quality & Cold-Chain Protocol
            </span>
            <h3 className="font-display font-bold text-2xl text-white">
              Every Transit Halt Checked. Perishables Kept Chilled.
            </h3>
            <p className="text-emerald-100/80 text-xs sm:text-sm mt-2 leading-relaxed">
              Verified ground logistics officers inspect cargo security seals at every highway halt, verify tare weight at loading (pickup), replenish crushed ice for perishable goods, and supervise certified unloading at delivery (drop).
            </p>
          </div>
          <button
            onClick={() => navigate('/logistics')}
            className="px-6 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg hover:-translate-y-0.5 transition flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>Enter Logistics Desk</span>
            <span>→</span>
          </button>
        </div>
      </section>

      {/* FROSTED-GLASS AUTH POPUP MODAL */}
      <AuthModal
        isOpen={authModal.isOpen}
        intent={authModal.intent}
        onClose={() => setAuthModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}


/* =========================================================
   FIND VEHICLES
========================================================= */


const CARGO_CATEGORIES = [
  'Independent / General Cargo',
  'Perishable Goods',
  'Dedicated / Isolated Cargo'
];

const DEDICATED_PURPOSE_SUB_CATEGORIES = [
  'Pharmaceuticals & Vaccines',
  'Pure Vegetarian Food / FMCG',
  'Non-Veg / Meat, Poultry & Seafood',
  'Sensitive Electronics & Instruments',
  'Fragile Glassware & Ceramics',
  'Chemicals & Hazardous Goods (HazMat)',
  'Heavy Machinery & Industrial Tools',
  'Exclusive Single-Client Private Load'
];

const PERISHABLE_COOLING_TYPES = [
  'Crushed Flake Ice Boxes (Logistics Provided)',
  'Dry-Ice & Gel Packs (Sub-Zero Cold Chain)',
  'Refrigerated Chiller (0°C to 4°C)',
  'Ventilated Ambient (Fresh Produce)'
];

const GOODS_CATEGORIES = [
  'Agricultural Produce / Grains',
  'Fruits & Vegetables',
  'Dairy & Perishables',
  'Pharmaceuticals & Medical',
  'Textiles & Garments',
  'Hardware & Construction',
  'Electronics & Hardware',
  'General Merchandise'
];

export function FindVehicles() {
  const { lang, t } = useLang()
  const [toast, notify] = useToast()
  const navigate = useNavigate()

  const [profile, setProfile] = useState({ full_name: '', email: '', phone_number: '', gender: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', phone_number: '', gender: 'Male' });
  const [trips, setTrips] = useState([]);
  const [f, setF] = useState({
    state: '',
    veh: '',
    cargoCategory: '',
    sort: 'free',
    ver: false,
    pickupSearch: ''
  })

  const mapContainerRef = useRef(null)
  const [mapFocusMode, setMapFocusMode] = useState(null)
  const [selectedTripId, setSelectedTripId] = useState(null)
  const [requestOpen, setRequestOpen] = useState(null)
  const [requests, setRequests] = useState({})
  const [myRequests, setMyRequests] = useState([])
  const [shipperMapModal, setShipperMapModal] = useState({ isOpen: false, req: null, trip: null })
  const [expandedInspections, setExpandedInspections] = useState({})
  const [submittingTripId, setSubmittingTripId] = useState(null)
  const [cancellationModal, setCancellationModal] = useState({
    isOpen: false,
    title: 'The driver has cancelled this ride.',
    message: 'The driver has cancelled this ride. Your active booking and route tracking have been stopped.',
    driverName: '',
    route: ''
  })
  const [completionModal, setCompletionModal] = useState({
    isOpen: false,
    requestId: null,
    tripOwner: '',
    route: '',
    weight: 0,
    distance: 0,
    kgKm: 0,
    totalKgKm: 0,
    share: 0,
    totalAmount: 0,
    sharePct: 0,
    rating: 5,
    feedback: ''
  })

  // State refs to detect status transitions during polling
  const prevRequestsMapRef = useRef({})
  const prevTripsMapRef = useRef({})
  const activeSelectedTripRef = useRef(null)
  const activeRequestOpenRef = useRef(null)

  useEffect(() => {
    activeSelectedTripRef.current = selectedTripId
  }, [selectedTripId])

  useEffect(() => {
    activeRequestOpenRef.current = requestOpen
  }, [requestOpen])

  const handleFocusLocation = (trip, type) => {
    setSelectedTripId(trip.id);
    const targetLat = type === 'pickup' ? (trip.pickup_lat || trip.lat) : trip.lat;
    const targetLng = type === 'pickup' ? (trip.pickup_lng || trip.lng) : trip.lng;
    const targetName = type === 'pickup' ? (trip.pickup || trip.from) : trip.owner;

    setMapFocusMode({
      type,
      tripId: trip.id,
      lat: targetLat,
      lng: targetLng,
      name: targetName
    });

    if (type === 'pickup') {
      notify(`📍 Focusing Pickup Location: ${targetName}`);
    } else {
      notify(`🚛 Tracking Live Driver (${targetName})`);
    }

    if (mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const fetchTripsAndRequests = useCallback(async () => {
    // 1. Fetch all trips
    try {
      const tripsRes = await fetch(`${API_BASE}/api/trips`);
      const tripsData = await tripsRes.json();
      if (tripsRes.ok && Array.isArray(tripsData)) {
        const mappedTrips = tripsData.map(trip => ({
          id: trip.id,
          state: trip.state,
          from: trip.from_loc,
          to: trip.to_loc,
          date: trip.date,
          vehicle: trip.vehicle,
          owner: trip.owner,
          verified: trip.verified,
          pct: trip.space_used_percentage !== undefined ? trip.space_used_percentage : (trip.pct || 0),
          space_used_percentage: trip.space_used_percentage !== undefined ? trip.space_used_percentage : (trip.pct || 0),
          totalKg: trip.total_kg,
          available_space_kg: trip.available_space_kg !== undefined ? trip.available_space_kg : Math.max(0, trip.total_kg - (trip.total_booked_kg || 0)),
          pricePerKg: trip.price_per_kg,
          total_driver_amount: trip.total_driver_amount || (trip.price_per_kg * trip.total_kg) || 0,
          distance_km: trip.distance_km || 150,
          dest_lat: trip.dest_lat || 0,
          dest_lng: trip.dest_lng || 0,
          pickup_lat: trip.pickup_lat || trip.lat || 0,
          pickup_lng: trip.pickup_lng || trip.lng || 0,
          total_booked_kg: trip.total_booked_kg || 0,
          total_kg_km: trip.total_kg_km || 0,
          passenger_count: trip.passenger_count || 0,
          slots_total: trip.slots_total || 5,
          slots_filled: trip.slots_filled !== undefined ? trip.slots_filled : (trip.passenger_count || 0),
          partners: trip.partners || [],
          pickup: trip.pickup,
          lat: trip.lat,
          lng: trip.lng,
          status: trip.status || 'scheduled',
          is_live: trip.is_live || false,
          speed: trip.speed || 0,
          is_return_leg: Boolean(trip.is_return_leg),
          return_discount_pct: trip.return_discount_pct || 0,
          return_trip_id: trip.return_trip_id || null,
          is_booking_open: trip.is_booking_open !== false,
          booking_lock_reason: trip.booking_lock_reason || null,
          outbound_trip_status: trip.outbound_trip_status || null,
          can_start_trip: trip.can_start_trip !== false,
          start_lock_reason: trip.start_lock_reason || null,
          cargo_category: trip.cargo_category || 'Independent / General Cargo',
          dedicated_sub_category: trip.dedicated_sub_category || null,
          is_dedicated: Boolean(trip.is_dedicated),
          seal_number: trip.seal_number || null,
          seal_status: trip.seal_status || null,
          cooling_type: trip.cooling_type || null,
          last_weigh_in_kg: trip.last_weigh_in_kg || null,
          weight_compliant: trip.weight_compliant,
          has_perishables: Boolean(trip.has_perishables),
          ice_handling_supported: trip.ice_handling_supported !== false,
          current_checkpoint: trip.current_checkpoint || null,
          checkpoint_count: trip.checkpoint_count || (trip.checkpoints ? trip.checkpoints.length : 0),
          max_inspections: trip.max_inspections || 1,
          inspections_remaining: trip.inspections_remaining || 0,
          checkpoints: trip.checkpoints || []
        }));


        // Check if currently selected/tracked trip was cancelled by driver
        mappedTrips.forEach(trip => {
          const prevTrip = prevTripsMapRef.current[trip.id];
          if (
            trip.status === 'cancelled_by_driver' &&
            prevTrip &&
            prevTrip.status !== 'cancelled_by_driver'
          ) {
            const currentSelected = activeSelectedTripRef.current;
            const currentOpen = activeRequestOpenRef.current;
            if (currentSelected === trip.id || currentOpen === trip.id) {
              setSelectedTripId(null);
              setRequestOpen(null);
              setCancellationModal({
                isOpen: true,
                title: 'The driver has cancelled this ride.',
                message: `The driver (${trip.owner}) has cancelled this trip (${trip.from} → ${trip.to}). All active route rendering and tracking have been stopped.`,
                driverName: trip.owner,
                route: `${trip.from} → ${trip.to}`
              });
              notify('⚠️ The driver has cancelled this ride.');
            }
          }
          prevTripsMapRef.current[trip.id] = trip;
        });

        setTrips(mappedTrips);
      }
    } catch (err) {
      console.error("Failed to fetch trips", err);
    }

    // 2. Fetch my requests
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const myReqRes = await fetch(`${API_BASE}/api/requests/my`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const myReqData = await myReqRes.json();
        if (myReqRes.ok && Array.isArray(myReqData)) {
          myReqData.forEach(req => {
            const prevReq = prevRequestsMapRef.current[req.id];
            // Detect driver cancellation
            if (
              req.status === 'cancelled_by_driver' &&
              prevReq &&
              prevReq.status !== 'cancelled_by_driver'
            ) {
              setSelectedTripId(null);
              setRequestOpen(null);
              setCancellationModal({
                isOpen: true,
                title: 'The driver has cancelled this ride.',
                message: `The driver (${req.owner}) has cancelled your transport booking for route ${req.route}. Your booking and live route tracking have been stopped.`,
                driverName: req.owner,
                route: req.route
              });
              notify('⚠️ The driver has cancelled this ride.');
            }

            // Detect driver marked ride complete (Two-Way Confirmation Step 1)
            if (
              req.status === 'pending_passenger_confirmation' &&
              prevReq &&
              prevReq.status !== 'pending_passenger_confirmation'
            ) {
              setCompletionModal({
                isOpen: true,
                requestId: req.id,
                tripOwner: req.owner || 'Driver',
                route: req.route || '',
                weight: req.goods_weight_kg || req.kg || 0,
                distance: req.distance_km || 150,
                kgKm: req.kg_km || ((req.goods_weight_kg || req.kg || 0) * (req.distance_km || 150)),
                totalKgKm: req.total_trip_kg_km || 0,
                share: req.per_person_share || 0,
                totalAmount: req.total_driver_amount || 0,
                sharePct: req.share_pct || 0,
                rating: 5,
                feedback: ''
              });
              notify('🎉 Driver marked ride as complete! Please confirm delivery & rate.');
            }

            prevRequestsMapRef.current[req.id] = req;
          });
          setMyRequests(myReqData);
        }
      } catch (err) {
        console.error("Failed to fetch my requests", err);
      }
    }
  }, []);

  // Fetch logged-in user profile details AND available trips + requests with live polling
  useEffect(() => {
    const fetchInitialData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/auth/status`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.authenticated !== false) {
          setProfile(data);
        } else {
          localStorage.removeItem("access_token");
        }
      } catch (err) {
        console.error("Failed to fetch user status", err);
      }

      await fetchTripsAndRequests();
    };

    fetchInitialData();

    // 2.5-second live polling interval to capture real-time driver coordinates, instant capacity updates & cancellation alerts
    const interval = setInterval(fetchTripsAndRequests, 2500);
    return () => clearInterval(interval);
  }, [fetchTripsAndRequests]);


  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("login_intent");
    localStorage.removeItem("role");
    localStorage.removeItem("user_type");
    sessionStorage.clear();
    stopSpeech();
    navigate('/login');
  };

  const handleSwitchToDriver = () => {
    localStorage.removeItem("access_token");
    localStorage.setItem("login_intent", "offer");
    sessionStorage.clear();
    stopSpeech();
    navigate('/login', { state: { intent: 'offer' } });
  };

  const list = trips
    .filter(trip => {
      // Completed, cancelled, or pending confirmation trips MUST NEVER appear in Explore Available Vehicles
      if (trip.status === 'completed' || trip.status === 'cancelled' || trip.status === 'cancelled_by_driver' || trip.status === 'pending_passenger_confirmation') {
        return false;
      }

      return (
        (!f.state || trip.state === f.state) &&
        (!f.veh || getVehicleCapacitySpec(trip.vehicle).name === getVehicleCapacitySpec(f.veh).name) &&
        (!f.ver || trip.verified) &&
        (!f.cargoCategory || (f.cargoCategory === 'Perishable Goods' ? (trip.cargo_category === 'Perishable Goods' || trip.has_perishables) : (f.cargoCategory === 'Dedicated / Isolated Cargo' ? trip.is_dedicated : !trip.is_dedicated))) &&
        (!f.pickupSearch ||
          (trip.pickup || '').toLowerCase().includes(f.pickupSearch.toLowerCase()) ||
          (trip.from || '').toLowerCase().includes(f.pickupSearch.toLowerCase()) ||
          (trip.to || '').toLowerCase().includes(f.pickupSearch.toLowerCase())
        )
      );
    })
    .sort((a, b) =>
      f.sort === 'date'
        ? a.date.localeCompare(b.date)
        : (
          b.totalKg *
          (1 - b.pct / 100)
        ) -
        (
          a.totalKg *
          (1 - a.pct / 100)
        )
    )



  const fly = id => {
    const trip = trips.find(x => x.id === id)

    if (!trip) return

    setSelectedTripId(id)

    notify(
      `📍 Pickup: ${trip.pickup}`
    )
  }


  const openRequest = trip => {
    const nextOpen = requestOpen === trip.id ? null : trip.id;
    setRequestOpen(nextOpen);
    if (nextOpen) {
      setSelectedTripId(trip.id);
    }

    const tripCargoCategory = trip.cargo_category || (trip.is_dedicated ? 'Dedicated / Isolated Cargo' : (trip.has_perishables ? 'Perishable Goods' : 'Independent / General Cargo'));
    const isPerishable = tripCargoCategory === 'Perishable Goods';
    const isDedicated = tripCargoCategory === 'Dedicated / Isolated Cargo' || Boolean(trip.is_dedicated);

    setRequests(prev => ({
      ...prev,
      [trip.id]: {
        ...(prev[trip.id] || {}),
        cargo_category: tripCargoCategory,
        dedicated_sub_category: trip.dedicated_sub_category || (isDedicated ? 'Pharmaceuticals & Vaccines' : null),
        cooling_type: trip.cooling_type || (isPerishable ? 'Crushed Flake Ice Boxes (Logistics Provided)' : null),
        is_perishable: prev[trip.id]?.is_perishable !== undefined ? prev[trip.id].is_perishable : isPerishable,
        is_dedicated: isDedicated,
        ice_handling_required: prev[trip.id]?.ice_handling_required !== undefined ? prev[trip.id].ice_handling_required : (isPerishable && (trip.ice_handling_supported !== false)),
        commodity_name: prev[trip.id]?.commodity_name || '',
        category: prev[trip.id]?.category || 'Agricultural Produce / Grains',
        weight: prev[trip.id]?.weight || '',
        pickupLocation: prev[trip.id]?.pickupLocation || '',
        deliveryLocation: prev[trip.id]?.deliveryLocation || '',
        description: prev[trip.id]?.description || '',
        photo: prev[trip.id]?.photo || null
      }
    }));
  };


  const updateRequest = (
    id,
    key,
    value
  ) => {
    setRequests(prev => ({
      ...prev,

      [id]: {
        ...prev[id],
        [key]: value
      }
    }))
  }


  const submitRequest = async trip => {
    if (submittingTripId === trip.id) return;
    setSubmittingTripId(trip.id);

    const r = requests[trip.id]

    const free = Math.round(
      trip.totalKg *
      (1 - trip.pct / 100)
    )

    if (
      !r?.weight ||
      !r?.pickupLocation ||
      !r?.deliveryLocation
    ) {
      notify(
        '⚠ Please fill in the required weight and pickup/delivery locations.'
      )
      setSubmittingTripId(null);
      return
    }

    // MANDATORY CARGO PROOF VALIDATION (STAGE 1)
    if (!r?.pickup_cargo_image_url) {
      notify(
        '⚠ Mandatory: Please upload a photo of your cargo to authenticate this booking request.'
      )
      setSubmittingTripId(null);
      return
    }

    if (+r.weight > free) {
      notify(
        `⚠ Maximum available space is ${free} kg.`
      )
      setSubmittingTripId(null);
      return
    }

    // Resolve Coordinates (Ensure both pickup and delivery have verified GPS coordinates)
    let pickupCoords = r.pickupCoords;
    if (!pickupCoords || !pickupCoords.lat || !pickupCoords.lng) {
      notify("🔍 Resolving pickup location coordinates...");
      const resolved = await geocodeIndianLocation(r.pickupLocation);
      if (resolved && resolved.lat && resolved.lng) {
        pickupCoords = { lat: resolved.lat, lng: resolved.lng };
        updateRequest(trip.id, 'pickupCoords', pickupCoords);
      }
    }

    let deliveryCoords = r.deliveryCoords;
    if (!deliveryCoords || !deliveryCoords.lat || !deliveryCoords.lng) {
      notify("🔍 Resolving delivery location coordinates...");
      const resolved = await geocodeIndianLocation(r.deliveryLocation);
      if (resolved && resolved.lat && resolved.lng) {
        deliveryCoords = { lat: resolved.lat, lng: resolved.lng };
        updateRequest(trip.id, 'deliveryCoords', deliveryCoords);
      }
    }

    if (!pickupCoords || !deliveryCoords) {
      notify("❌ Please select a verified Indian location from the suggestions dropdown for both pickup and delivery.");
      setSubmittingTripId(null);
      return;
    }

    // High-Precision Route Corridor Validation
    const tripStart = { lat: trip.pickup_lat || trip.lat || 0, lng: trip.pickup_lng || trip.lng || 0 };
    const tripDest = { lat: trip.dest_lat || trip.destLat || 0, lng: trip.dest_lng || trip.destLng || 0 };
    const driverRoute = [tripStart, tripDest].filter(c => c.lat !== 0 || c.lng !== 0);

    // Calculate travel distance between user pickup and delivery locations instantly (0ms)
    let estimatedDist = trip.distance_km || 150;
    if (pickupCoords && deliveryCoords) {
      const direct = haversineDistance(pickupCoords.lat, pickupCoords.lng, deliveryCoords.lat, deliveryCoords.lng);
      estimatedDist = Math.max(5, calculateHighwayTortuosityKm(direct));
    }

    // Actually POST the request to the backend so it
    // persists and can be seen by the vehicle owner
    const token = localStorage.getItem("access_token");
    const reqHeaders = {
      "Content-Type": "application/json"
    };
    if (token && token !== "null" && token !== "undefined") {
      reqHeaders["Authorization"] = `Bearer ${token}`;
    }
    // Build a unique request ID to avoid primary-key collisions
    // when multiple senders request the same trip.
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      const activeLang = typeof localStorage !== 'undefined' ? localStorage.getItem("ss_lang") || lang || "hi" : lang || "hi";
      const res = await fetch(`${API_BASE}/api/requests`, {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify({
          id: requestId,
          trip_id: trip.id,
          trip_date: trip.date,
          route: `${trip.from} → ${trip.to}`,
          vehicle: trip.vehicle,
          owner: trip.owner,
          farmer_name: profile.full_name || 'User',
          kg: Number(r.weight),
          goods_weight_kg: Number(r.weight),
          distance_km: estimatedDist,
          pickup_place: r.pickupLocation,
          delivery_date: r.deliveryLocation,
          pickup_lat: r.pickupCoords?.lat || 0,
          pickup_lng: r.pickupCoords?.lng || 0,
          delivery_lat: r.deliveryCoords?.lat || 0,
          delivery_lng: r.deliveryCoords?.lng || 0,
          pickup_cargo_image_url: r.pickup_cargo_image_url,
          lang: activeLang,
          cargo_category: trip.cargo_category || 'Independent / General Cargo',
          dedicated_sub_category: (trip.cargo_category === 'Dedicated / Isolated Cargo' || trip.is_dedicated) ? (trip.dedicated_sub_category || 'Pharmaceuticals & Vaccines') : null,
          is_dedicated: trip.cargo_category === 'Dedicated / Isolated Cargo' || Boolean(trip.is_dedicated),
          cooling_type: (trip.cargo_category === 'Perishable Goods' || trip.has_perishables) ? (trip.cooling_type || 'Crushed Flake Ice Boxes (Logistics Provided)') : null,
          is_perishable: Boolean(r.is_perishable || trip.cargo_category === 'Perishable Goods' || trip.has_perishables),
          cargo_type: r.commodity_name || (trip.cargo_category === 'Dedicated / Isolated Cargo' ? `${trip.dedicated_sub_category}` : 'General Goods'),
          ice_handling_required: Boolean(r.ice_handling_required),
          ice_surcharge: (trip.cargo_category !== 'Perishable Goods' && Boolean(r.ice_handling_required)) ? 75 : 0,
          current_temp_c: Boolean(r.ice_handling_required) ? 3.8 : null,
          loading_status: 'pending',
          ice_boxes_count: 0
        })
      });

      if (res.ok) {
        notify(
          `✔ Transport request sent to ${trip.owner} with verified cargo proof!`
        );
        const created = await res.json();
        
        setMyRequests(prev => {
          const filtered = prev.filter(req => req.id !== (created.id || requestId) && !(req.owner === trip.owner && req.route === `${trip.from} → ${trip.to}`));
          return [
            {
              id: created.id || requestId,
              status: created.status || 'pending',
              route: `${trip.from} → ${trip.to}`,
              vehicle: trip.vehicle,
              owner: trip.owner,
              farmer_name: profile.full_name || 'User',
              kg: Number(r.weight),
              goods_weight_kg: Number(r.weight),
              distance_km: estimatedDist,
              pickup_lat: r.pickupCoords?.lat || 0,
              pickup_lng: r.pickupCoords?.lng || 0,
              delivery_lat: r.deliveryCoords?.lat || 0,
              delivery_lng: r.deliveryCoords?.lng || 0,
              pickup_cargo_image_url: created.pickup_cargo_image_url || r.pickup_cargo_image_url,
              delivery_proof_image_url: created.delivery_proof_image_url || null,
              kg_km: created.kg_km || (Number(r.weight) * estimatedDist),
              per_person_share: created.per_person_share || 0,
              total_driver_amount: created.total_driver_amount || trip.total_driver_amount,
              total_trip_kg_km: created.total_trip_kg_km || 0,
              share_pct: created.share_pct || 0
            },
            ...filtered
          ];
        });
        setRequestOpen(null);
        fetchTripsAndRequests();
      } else {
        const data = await res.json();
        notify(data.detail || "Failed to send request.");
      }

    } catch (err) {
      console.error("Failed to send request", err);
      notify("Could not connect to backend.");
    } finally {
      setSubmittingTripId(null);
    }
  }




  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'my_bookings' | 'map' | 'profile'
  const [myBookingFilter, setMyBookingFilter] = useState('all'); // 'all' | 'pending' | 'accepted' | 'pending_conf' | 'completed'

  const activeVehiclesCount = list.length;
  const liveVehiclesCount = list.filter(t => t.status === 'in_transit' || t.is_live).length;
  const myActiveBookingsCount = myRequests.filter(r => r.status === 'pending' || r.status === 'accepted' || r.status === 'in_transit' || r.status === 'pending_passenger_confirmation').length;
  const myPendingConfCount = myRequests.filter(r => r.status === 'pending_passenger_confirmation').length;
  const totalAvailableKgAcrossTrips = list.reduce((acc, t) => acc + (t.available_space_kg !== undefined ? t.available_space_kg : Math.max(0, t.totalKg - (t.total_booked_kg || 0))), 0);
  const verifiedDriversCount = list.filter(t => t.verified).length;

  const filteredMyRequests = useMemo(() => {
    let filtered = myRequests.filter(req => {
      if (myBookingFilter === 'pending') return req.status === 'pending';
      if (myBookingFilter === 'accepted') return req.status === 'accepted' || req.status === 'in_transit';
      if (myBookingFilter === 'pending_conf') return req.status === 'pending_passenger_confirmation';
      if (myBookingFilter === 'completed') return req.status === 'completed';
      return true;
    });

    return filtered.sort((a, b) => {
      // Prioritize action required first
      if (a.status === 'pending_passenger_confirmation' && b.status !== 'pending_passenger_confirmation') return -1;
      if (b.status === 'pending_passenger_confirmation' && a.status !== 'pending_passenger_confirmation') return 1;
      // Sort newest / latest completed at the top
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  }, [myRequests, myBookingFilter]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {toast}

      {/* HEADER WITH LOGOUT & SENDER PROFILE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-gold/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-green-deep/10 text-green-deep text-xs font-mono font-bold uppercase tracking-wider">
              Cargo Marketplace & Logistics Hub
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1">
              <CheckCircle2 size={13} /> {t('profile.sender_role', 'Sender Active')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-green-deep mt-1">
              {t('find.title', 'Find a Vehicle')}
            </h1>
            <TTSButton textToRead={`${t('find.title', 'Find a Vehicle')}. ${t('find.subtitle', 'Browse available cargo space, calculate fair Ton-Km fares, and track shipments live.')}`} />
          </div>
          <p className="text-sm text-green-soft mt-1">
            {t('find.subtitle', 'Browse available cargo space, calculate fair Ton-Km fares, and track shipments live.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="hidden sm:block text-right">
            <p className="font-bold text-xs text-green-deep">{profile.full_name || t('profile.sender_role', 'Sender')}</p>
            <p className="text-[11px] text-green-soft font-mono">{profile.email}</p>
          </div>
          <button
            onClick={handleSwitchToDriver}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl shadow-sm transition duration-200 text-xs flex items-center gap-1 cursor-pointer"
            title="Switch to Driver Google Account"
          >
            <span>🔄</span>
            <span>Switch to Driver Hub</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-sm transition duration-200 text-xs cursor-pointer"
          >
            {t('nav_logout', 'Logout')}
          </button>
        </div>
      </div>

      {/* 4-CARD QUICK METRICS OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          onClick={() => setActiveTab('explore')}
          className="rounded-2xl bg-paper border border-gold/30 p-4 shadow-sm hover:border-green-deep/40 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] font-mono text-green-soft uppercase tracking-wide">{t('metric.active_trucks', 'Available Trucks')}</p>
            <p className="font-display font-bold text-2xl text-green-deep mt-0.5">{activeVehiclesCount}</p>
            <p className="text-[11px] text-green-soft mt-0.5">{liveVehiclesCount} {t('metric.live_transit', 'Live In-Transit')}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-green-50 border border-green-200 text-green-700 flex items-center justify-center text-xl shadow-inner">
            🚛
          </div>
        </div>

        <div
          onClick={() => setActiveTab('my_bookings')}
          className="rounded-2xl bg-paper border border-gold/30 p-4 shadow-sm hover:border-green-deep/40 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] font-mono text-green-soft uppercase tracking-wide">{t('metric.my_bookings', 'My Cargo Bookings')}</p>
            <p className="font-display font-bold text-2xl text-green-deep mt-0.5">{myRequests.length}</p>
            <p className={`text-[11px] font-semibold mt-0.5 ${myPendingConfCount > 0 ? 'text-amber-700 font-bold animate-pulse' : 'text-green-soft'}`}>
              {myPendingConfCount > 0 ? `⚡ ${myPendingConfCount} Action Required` : `${myActiveBookingsCount} Active Bookings`}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl border shadow-inner ${myPendingConfCount > 0 ? 'bg-amber-50 border-amber-300 text-amber-700 animate-pulse' : 'bg-cream border-gold/30 text-green-deep'}`}>
            📦
          </div>
        </div>

        <div
          onClick={() => setActiveTab('explore')}
          className="rounded-2xl bg-paper border border-gold/30 p-4 shadow-sm hover:border-green-deep/40 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] font-mono text-green-soft uppercase tracking-wide">{t('card.space_free', 'Free Cargo Space')}</p>
            <p className="font-display font-bold text-2xl text-green-deep mt-0.5">{totalAvailableKgAcrossTrips.toLocaleString('en-IN')} <span className="text-xs font-mono font-normal">kg</span></p>
            <p className="text-[11px] text-green-soft mt-0.5">Across marketplace</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gold/10 border border-gold/30 text-soil flex items-center justify-center text-xl font-bold shadow-inner">
            ⚖
          </div>
        </div>

        <div
          onClick={() => setActiveTab('explore')}
          className="rounded-2xl bg-paper border border-gold/30 p-4 shadow-sm hover:border-green-deep/40 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] font-mono text-green-soft uppercase tracking-wide">{t('metric.verified_drivers', 'Verified Transporters')}</p>
            <p className="font-display font-bold text-2xl text-green-deep mt-0.5">{verifiedDriversCount}</p>
            <p className="text-[11px] text-green-soft mt-0.5">🛡️ Govt. ID Confirmed</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-green-50 border border-green-300 text-green-700 flex items-center justify-center text-xl shadow-inner">
            🛡️
          </div>
        </div>
      </div>

      {/* MODERN TAB NAVIGATION BAR */}
      <div className="flex items-center gap-2 border-b border-gold/30 mb-6 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setActiveTab('explore')}
          className={`px-5 py-3 rounded-2xl font-display font-bold text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeTab === 'explore'
              ? 'bg-green-deep text-cream shadow-md'
              : 'text-green-deep hover:bg-gold/10'
            }`}
        >
          <Truck size={17} />
          <span>{t('tab.explore', 'Explore Available Vehicles')}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${activeTab === 'explore' ? 'bg-cream text-green-deep' : 'bg-green-deep/10 text-green-deep'}`}>
            {activeVehiclesCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('my_bookings')}
          className={`px-5 py-3 rounded-2xl font-display font-bold text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeTab === 'my_bookings'
              ? 'bg-green-deep text-cream shadow-md'
              : 'text-green-deep hover:bg-gold/10'
            }`}
        >
          <Package size={17} />
          <span>{t('tab.my_bookings', 'My Bookings & Shipments')}</span>
          {myPendingConfCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500 text-white animate-pulse">
              {myPendingConfCount} confirm
            </span>
          ) : (
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${activeTab === 'my_bookings' ? 'bg-cream text-green-deep' : 'bg-green-deep/10 text-green-deep'}`}>
              {myRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`px-5 py-3 rounded-2xl font-display font-bold text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeTab === 'map'
              ? 'bg-green-deep text-cream shadow-md'
              : 'text-green-deep hover:bg-gold/10'
            }`}
        >
          <Route size={17} />
          <span>{t('tab.map', 'Live Map Radar')}</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-3 rounded-2xl font-display font-bold text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeTab === 'profile'
              ? 'bg-green-deep text-cream shadow-md'
              : 'text-green-deep hover:bg-gold/10'
            }`}
        >
          <Users size={17} />
          <span>{t('tab.profile', 'Sender Profile')}</span>
        </button>
      </div>

      {/* =========================================================
         TAB 1: EXPLORE AVAILABLE VEHICLES
      ========================================================= */}
      {activeTab === 'explore' && (
        <div className="space-y-6 animate-[fadeIn_0.25s_ease]">
          {/* SEARCH & FILTERS CONTAINER */}
          <div className="bg-paper border border-gold/30 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="relative">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-green-soft"
              />
              <input
                value={f.pickupSearch}
                onChange={e => setF({ ...f, pickupSearch: e.target.value })}
                placeholder={t('find.searchPlaceholder', 'Search by pickup location, origin city, destination, or route in India...')}
                className="w-full rounded-2xl border border-gold/40 bg-cream/30 pl-11 pr-4 py-3 outline-none focus:border-green-deep text-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              <select
                className={`${inputCls} py-2 text-xs`}
                value={f.cargoCategory}
                onChange={e => setF({ ...f, cargoCategory: e.target.value })}
              >
                <option value="">All Cargo Categories</option>
                <option value="Independent / General Cargo">📦 Independent / General</option>
                <option value="Perishable Goods">❄️ Perishable Goods</option>
                <option value="Dedicated / Isolated Cargo">🔒 Dedicated / Isolated</option>
              </select>

              <select
                className={`${inputCls} py-2 text-xs`}
                value={f.state}
                onChange={e => setF({ ...f, state: e.target.value })}
              >
                <option value="">{t('find.allStates', 'All States')}</option>
                <option>Uttar Pradesh</option>
                <option>Maharashtra</option>
                <option>Delhi</option>
                <option>Karnataka</option>
                <option>Gujarat</option>
                <option>Rajasthan</option>
                <option>Tamil Nadu</option>
                <option>Odisha</option>
              </select>

              <select
                className={`${inputCls} py-2 text-xs`}
                value={f.veh}
                onChange={e => setF({ ...f, veh: e.target.value })}
              >
                <option value="">{t('find.allVehicles', 'All Vehicle Types')}</option>
                <option value="Two-Wheeler">🛵 Two-Wheeler (Bike / Scooter)</option>
                <option value="Three-Wheeler/Auto">🛺 Three-Wheeler/Auto (Rickshaw)</option>
                <option value="Mini-Truck">🛻 Mini-Truck (Tata Ace / Pickup)</option>
                <option value="Heavy-Truck">🚛 Heavy-Truck (HCV / Lorry)</option>
              </select>

              <select
                className={`${inputCls} py-2 text-xs`}
                value={f.sort}
                onChange={e => setF({ ...f, sort: e.target.value })}
              >
                <option value="free">{t('find.sortFree', 'Most Free Space (kg)')}</option>
                <option value="date">{t('find.sortDate', 'Earliest Date')}</option>
              </select>

              <label className="flex items-center gap-2 rounded-xl border border-gold/40 px-3 py-2 text-xs font-semibold cursor-pointer bg-cream/40 select-none">
                <input
                  type="checkbox"
                  className="accent-green-deep w-4 h-4 rounded cursor-pointer"
                  checked={f.ver}
                  onChange={e => setF({ ...f, ver: e.target.checked })}
                >
                </input>
                <span>{t('find.verifiedOnly', '🛡️ Verified Only')}</span>
              </label>
            </div>
          </div>

          {/* MAIN GRID: VEHICLES LIST + STICKY MAP */}
          <div className="grid lg:grid-cols-5 gap-6 items-start">
            {/* LEFT: VEHICLE CARDS (3 COLUMNS) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              {list.length > 0 ? (
                list.map(trip => {
                  const free = trip.available_space_kg !== undefined
                    ? trip.available_space_kg
                    : Math.max(0, trip.totalKg - (trip.total_booked_kg || 0));
                  const usedPct = trip.space_used_percentage !== undefined
                    ? trip.space_used_percentage
                    : (trip.pct || 0);
                  const bookedKg = trip.total_booked_kg || 0;

                  const r = requests[trip.id] || {};
                  // Only treat ACTIVE non-cancelled requests as blocking in Explore
                  const myReq = myRequests.find(
                    req =>
                      req.owner === trip.owner &&
                      req.route === `${trip.from} → ${trip.to}` &&
                      ['pending', 'accepted', 'assigned', 'in_transit', 'pending_passenger_confirmation'].includes(req.status)
                  );
                  const isTripLive = trip.status === 'in_transit' || trip.is_live;

                  return (
                    <div
                      key={trip.id}
                      className={`rounded-2xl border p-5 transition-all shadow-sm flex flex-col justify-between ${isTripLive
                          ? 'bg-paper border-green-400/80 shadow-md ring-1 ring-green-400/40'
                          : 'bg-paper border-gold/30 hover:border-gold'
                        }`}
                    >
                      <div>
                        {/* CARD TOP ROW */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="font-display font-bold text-lg text-green-deep flex items-center gap-1.5">
                              <span>{trip.from}</span>
                              <span className="text-gold">→</span>
                              <span>{trip.to}</span>
                            </p>
                            <p className="text-xs text-green-soft font-mono mt-0.5">
                              📅 {trip.date} · 🚛 {trip.vehicle} · 📍 {trip.state}
                            </p>

                            {/* CARGO SPECIALIZATION & SECURITY SEAL BADGES */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {trip.is_dedicated ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold text-[10.5px] border border-purple-200 flex items-center gap-1">
                                  🔒 Dedicated: {trip.dedicated_sub_category || 'Isolated'}
                                </span>
                              ) : trip.cargo_category === 'Perishable Goods' ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-900 font-bold text-[10.5px] border border-cyan-200 flex items-center gap-1">
                                  ❄️ Perishable ({trip.cooling_type || 'Ice Ready'})
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10.5px] border border-slate-200">
                                  📦 Independent Cargo
                                </span>
                              )}

                              {trip.seal_number && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-mono font-bold text-[10.5px] border border-emerald-300 flex items-center gap-1">
                                  🔐 Seal #{trip.seal_number} ({trip.seal_status === 'verified_intact' ? 'Intact' : trip.seal_status || 'Applied'})
                                </span>
                              )}

                              {trip.last_weigh_in_kg && (
                                <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-mono font-bold text-[10.5px] border border-teal-300">
                                  ⚖ Weighed: {trip.last_weigh_in_kg} kg
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap shrink-0">
                            <TTSButton
                              textToRead={`${trip.from} to ${trip.to}. Vehicle ${trip.vehicle}. Available free capacity ${free} kilograms. Departure date ${trip.date}. Total load fare rupees ${trip.total_driver_amount || trip.totalDriverAmount || (trip.pricePerKg * trip.totalKg) || 0}.`}
                              size={13}
                            />
                            {trip.is_return_leg && (
                              <span className="bg-indigo-700 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                <span>🔄</span>
                                <span>Return Backhaul · {trip.return_discount_pct || 20}% OFF</span>
                              </span>
                            )}
                            {isTripLive && (
                              <span className="animate-pulse bg-green-600 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                                {t('card.live_badge', '🔴 LIVE IN-TRANSIT')}
                              </span>
                            )}
                            <Chip tone={trip.verified ? 'indigo' : 'brick'}>
                              {trip.verified ? t('card.verified', '✔ Verified Driver') : t('card.unverified', '⏳ Unverified')}
                            </Chip>
                          </div>
                        </div>

                        {/* LIVE DRIVER BROADCAST BANNER */}
                        {isTripLive && (
                          <div className="mb-3 rounded-xl bg-green-50 border border-green-300 p-2.5 flex items-center justify-between">
                            <div className="text-xs text-green-900 font-medium flex items-center gap-1.5">
                              <span>📡 Driver is live on route!</span>
                            </div>
                            <button
                              onClick={() => handleFocusLocation(trip, 'live_driver')}
                              className="px-3 py-1 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                              <span>📍 {t('card.track_live', 'Track Live')}</span>
                            </button>
                          </div>
                        )}

                        {/* LIVE CAPACITY SLOTS & CO-SHARING PARTNERS */}
                        <div className="bg-cream rounded-xl border border-gold/20 p-3 mb-3 space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-semibold text-green-deep">
                            <span className="flex items-center gap-1.5">
                              <span>🎯 {t('card.capacity_slots', 'Capacity Slots')}:</span>
                              <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-gold/30 text-green-deep font-bold">
                                {trip.slots_filled || 0} of {trip.slots_total || 5} {t('card.slots_booked', 'slots booked')}
                              </span>
                            </span>
                            <span className={free <= 0 ? 'text-red-600 font-bold' : 'text-green-700 font-bold'}>
                              {free <= 0 ? t('card.full', '❌ Full Capacity') : `✔ ${free} kg ${t('card.space_free', 'space free')}`}
                            </span>
                          </div>
                          {/* Visual Slots Track */}
                          <div className="grid grid-cols-5 gap-1.5">
                            {Array.from({ length: trip.slots_total || 5 }).map((_, idx) => {
                              const isFilled = idx < (trip.slots_filled || 0);
                              return (
                                <div
                                  key={idx}
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    isFilled ? 'bg-green-600 shadow-sm' : 'bg-gray-200/80 border border-dashed border-gray-300'
                                  }`}
                                  title={isFilled ? `Slot ${idx + 1}: Booked` : `Slot ${idx + 1}: Available`}
                                />
                              );
                            })}
                          </div>

                          {/* Co-Sharing Partner List / Badges */}
                          <div className="pt-1.5 border-t border-gold/15 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                            <div className="flex items-center gap-1 text-green-deep font-medium">
                              <span>👥</span>
                              <span className="font-semibold text-[11.5px]">{t('card.co_sharing', 'Co-Sharing Partners')}:</span>
                            </div>

                            {trip.partners && trip.partners.length > 0 ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {trip.partners.slice(0, 3).map((p, pIdx) => (
                                  <span
                                    key={pIdx}
                                    className="bg-white/90 text-green-deep border border-gold/30 px-2 py-0.5 rounded-lg text-[10.5px] font-semibold flex items-center gap-1 shadow-2xs"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    <span>{p.farmer_name} ({p.goods_weight_kg}kg)</span>
                                  </span>
                                ))}
                                {trip.partners.length > 3 && (
                                  <span className="text-[10px] text-green-soft font-semibold">
                                    +{trip.partners.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-green-soft text-[10.5px] italic">
                                {t('card.first_partner', '✨ Be the first partner! Next bookings will discount your trip.')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* FARE & TON-KM SPLIT CARD */}
                        <div className="rounded-xl bg-gold/10 border border-gold/25 p-3 mb-3">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <div>
                              <p className="text-[10.5px] font-mono text-green-soft uppercase">{t('card.total_fare', 'Total Vehicle Load Fare')}</p>
                              <p className="font-display font-bold text-lg text-green-deep mt-0.5">
                                ₹{(trip.total_driver_amount || trip.totalDriverAmount || (trip.pricePerKg * trip.totalKg) || 0).toLocaleString('en-IN')}
                              </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-lg bg-green-deep/10 text-green-deep font-semibold text-[11px]">
                              {t('card.ton_km_split', '⚖ Ton-Km Fair Split')}
                            </span>
                          </div>
                          <p className="text-[11px] text-green-soft mt-1">
                            {t('card.fair_pricing_note', 'Fair pricing: You pay strictly for your cargo weight (kg) × travel distance (km).')}
                          </p>
                        </div>

                        {/* PICKUP LOCATION */}
                        <div className="rounded-xl bg-cream border border-gold/20 p-3 mb-2 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 min-w-0">
                            <MapPin size={16} className="text-brick shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-green-deep">{t('card.pickup_loc', 'Pickup Location:')}</p>
                              <p className="text-xs text-green-soft truncate">{trip.pickup || trip.from}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleFocusLocation(trip, 'pickup')}
                            className="px-2.5 py-1 text-[11px] rounded-lg border border-green-deep/40 text-green-deep hover:bg-green-deep hover:text-cream transition flex items-center gap-1 font-medium cursor-pointer shrink-0"
                          >
                            <span>📦 {t('card.view_map', 'View on Map')}</span>
                          </button>
                        </div>
                      </div>

                      {/* CARD ACTIONS & BOOKING STATUS */}
                      <div className="pt-3 border-t border-gold/20 mt-2">
                        {myReq ? (
                          <div className="rounded-xl bg-green-deep/5 border border-green-deep/20 p-3 space-y-2.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 size={16} className="text-green-600" />
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${myReq.status === 'pending'
                                    ? 'bg-gold/20 text-soil'
                                    : myReq.status === 'accepted'
                                      ? 'bg-green-deep/10 text-green-deep'
                                      : myReq.status === 'pending_passenger_confirmation'
                                        ? 'bg-amber-500 text-white animate-pulse'
                                        : myReq.status === 'completed'
                                          ? 'bg-green-700 text-white'
                                          : 'bg-red-100 text-red-700'
                                  }`}>
                                  {myReq.status === 'pending_passenger_confirmation' ? t('status_action_required', 'CONFIRMATION REQUIRED') : (myReq.status || 'PENDING').toUpperCase()}
                                </span>
                              </div>

                              <div className="bg-white rounded-lg p-2 border border-gold/20 text-xs flex items-center justify-between">
                                <span className="text-green-soft">{t('request.weight', 'Weight')}: <strong>{myReq.goods_weight_kg || myReq.kg} kg</strong> · {t('pricing.calc_segment', 'Fare Share')}:</span>
                                <span className="font-bold text-green-deep font-display text-sm ml-2">₹{myReq.per_person_share || 0}</span>
                              </div>
                            </div>

                            {/* PROOF IMAGES ROW */}
                            <div className="pt-2 border-t border-gold/15 space-y-2">
                              {myReq.pickup_cargo_image_url && (
                                <div className="flex items-center gap-2">
                                  <a
                                    href={`${API_BASE}${myReq.pickup_cargo_image_url}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition shadow-2xs"
                                  >
                                    <span>📦 My Cargo Photo</span>
                                    <span className="text-[10px]">🔍</span>
                                  </a>
                                </div>
                              )}
                              {(myReq.delivery_proof_image_url || trip.delivery_proof_image_url) && (
                                <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 p-3 shadow-xs">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                                      <span>📸</span>
                                      <span>Stage 2 Delivery Photo Proof</span>
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                                      <span>✔</span>
                                      <span>Verified at Drop-off</span>
                                    </span>
                                  </div>
                                  <a
                                    href={`${API_BASE}${myReq.delivery_proof_image_url || trip.delivery_proof_image_url}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block rounded-xl overflow-hidden border-2 border-white shadow group relative max-h-48 bg-slate-900"
                                  >
                                    <img
                                      src={`${API_BASE}${myReq.delivery_proof_image_url || trip.delivery_proof_image_url}`}
                                      alt="Delivery Proof Photo"
                                      className="w-full h-40 object-cover group-hover:scale-105 transition duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-semibold text-xs gap-1.5">
                                      <span>🔍 Click to View Full Resolution Photo</span>
                                    </div>
                                  </a>
                                </div>
                              )}
                            </div>

                            {myReq.status === 'pending_passenger_confirmation' && (
                              <button
                                onClick={() => {
                                  setCompletionModal({
                                    isOpen: true,
                                    requestId: myReq.id,
                                    tripOwner: trip.owner,
                                    route: `${trip.from} → ${trip.to}`,
                                    weight: myReq.goods_weight_kg || myReq.kg,
                                    distance: myReq.distance_km || 150,
                                    kgKm: myReq.kg_km || ((myReq.goods_weight_kg || myReq.kg || 0) * (myReq.distance_km || 150)),
                                    totalKgKm: myReq.total_trip_kg_km || 0,
                                    share: myReq.per_person_share || 0,
                                    totalAmount: trip.total_driver_amount || (trip.pricePerKg * trip.totalKg) || 0,
                                    sharePct: myReq.share_pct || 0,
                                    deliveryProofUrl: myReq.delivery_proof_image_url || trip.delivery_proof_image_url || null,
                                    rating: 5,
                                    feedback: ''
                                  });
                                }}
                                className="w-full py-2.5 bg-green-deep hover:bg-green text-cream font-bold text-xs rounded-xl shadow transition cursor-pointer"
                              >
                                🎉 {t('card.confirm_delivery', 'Confirm Delivery & Rate')}
                              </button>
                            )}

                              {['pending', 'accepted'].includes(myReq.status) && (
                                <div className="flex justify-end pt-1">
                                  <button
                                    onClick={async () => {
                                      if (!window.confirm(t('confirm_cancel', 'Are you sure you want to cancel this booking?'))) return;
                                      const token = localStorage.getItem("access_token");
                                      try {
                                        const res = await fetch(`${API_BASE}/api/requests/${myReq.id}`, {
                                          method: "DELETE",
                                          headers: { "Authorization": `Bearer ${token}` }
                                        });
                                        if (res.ok) {
                                          notify("✖ Request cancelled.");
                                          fetchTripsAndRequests();
                                        }
                                      } catch (err) {
                                        notify("Could not connect to backend.");
                                      }
                                    }}
                                    className="text-[11px] text-red-600 hover:underline font-semibold cursor-pointer"
                                  >
                                    {t('card.cancel_booking', 'Cancel Booking')}
                                  </button>
                                </div>
                              )}
                            </div>
                        ) : trip.is_return_leg && !trip.is_booking_open ? (
                          <div className="space-y-2">
                            <div className="rounded-xl bg-amber-50 border border-amber-300 p-2.5 text-xs text-amber-900 flex items-start gap-2">
                              <span className="text-base shrink-0">🔒</span>
                              <div>
                                <p className="font-bold text-amber-950 text-xs">Return Leg Booking Locked</p>
                                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                                  {trip.booking_lock_reason || "Booking for this return backhaul trip will automatically open once the driver starts the outbound journey."}
                                </p>
                              </div>
                            </div>
                            <button
                              disabled
                              className="w-full py-2.5 bg-gray-100 text-gray-500 font-semibold text-xs rounded-xl border border-dashed border-gray-300 flex items-center justify-center gap-1.5 cursor-not-allowed select-none opacity-80"
                              title={trip.booking_lock_reason || "Booking opens once driver starts outbound trip"}
                            >
                              <span>🔒</span>
                              <span>Booking Opens When Driver Starts Outbound Journey</span>
                            </button>
                          </div>
                        ) : (
                          <div>
                            <button
                              onClick={() => openRequest(trip)}
                              className="w-full py-2.5 bg-green-deep hover:bg-green text-cream font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Package size={15} />
                              <span>{requestOpen === trip.id ? t('card.close_form', 'Close Booking Form') : t('card.request_space', 'Request Cargo Space')}</span>
                            </button>
                          </div>
                        )}

                        {/* IN-LINE EXPANDABLE REQUEST FORM */}
                        {requestOpen === trip.id && (
                          <div className="mt-4 rounded-2xl border border-gold/30 bg-cream/40 p-4 space-y-3 animate-[fadeIn_.25s_ease]">
                            <div className="flex items-center justify-between pb-2 border-b border-gold/20">
                              <h4 className="font-display font-bold text-sm text-green-deep">
                                {t('card.request_space', 'Request Space')} ({trip.from} → {trip.to})
                              </h4>
                              <button onClick={() => setRequestOpen(null)} className="text-gray-500 hover:text-gray-800 cursor-pointer">
                                <X size={16} />
                              </button>
                            </div>

                            {/* CARGO SPECIALIZATION & CLASSIFICATION (PRE-DECIDED BY TRIP OFFERER) */}
                            <div className="rounded-2xl border border-emerald-300/80 bg-white p-3.5 space-y-3 shadow-2xs">
                              <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                  <span>🏷️</span>
                                  <span>{t('form.cargo_type_header', 'Vehicle Cargo Type (Decided by Trip Offerer)')}</span>
                                </span>
                                <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  🔒 Fixed by Transporter
                                </span>
                              </div>

                              {/* PRE-DECIDED CARGO BADGE & DETAILS */}
                              {trip.is_dedicated || trip.cargo_category === 'Dedicated / Isolated Cargo' ? (
                                <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl space-y-1.5 animate-[fadeIn_0.2s_ease]">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                                      <span>🔒</span>
                                      <span>Dedicated / Isolated Cargo (Private Single-Client Vehicle)</span>
                                    </span>
                                    <span className="text-[10px] font-mono uppercase font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                                      Exclusive Run
                                    </span>
                                  </div>
                                  <div className="text-xs text-purple-900 bg-white/80 p-2 rounded-lg border border-purple-200/80 flex items-center gap-1.5">
                                    <span className="font-semibold text-purple-950">Mandatory Sub-Category:</span>
                                    <span className="font-bold text-purple-800">{trip.dedicated_sub_category || 'Pharmaceuticals & Vaccines'}</span>
                                  </div>
                                  <p className="text-[11px] text-purple-800">
                                    ✔ Exclusive Vehicle Allocation: Reserved exclusively for this dedicated cargo category. Cargo will NOT be mixed with other clients' goods.
                                  </p>
                                </div>
                              ) : trip.cargo_category === 'Perishable Goods' ? (
                                <div className="p-3 bg-cyan-50/80 border border-cyan-200 rounded-xl space-y-1.5 animate-[fadeIn_0.2s_ease]">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-cyan-950 flex items-center gap-1.5">
                                      <span>❄️</span>
                                      <span>Perishable Goods (Cold-Chain Highway Monitored)</span>
                                    </span>
                                    <span className="text-[10px] font-mono uppercase font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-full">
                                      Cold-Chain
                                    </span>
                                  </div>
                                  <div className="text-xs text-cyan-900 bg-white/80 p-2 rounded-lg border border-cyan-200/80 flex items-center gap-1.5">
                                    <span className="font-semibold text-cyan-950">Preservation Facility:</span>
                                    <span className="font-bold text-cyan-800">{trip.cooling_type || 'Crushed Flake Ice Boxes (Logistics Provided)'}</span>
                                  </div>
                                  <p className="text-[11px] text-cyan-800">
                                    ✔ Ground logistics officers inspect cold storage, record temperature, and replenish coolant at designated highway checkpoints.
                                  </p>
                                </div>
                              ) : (
                                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1.5 animate-[fadeIn_0.2s_ease]">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                      <span>📦</span>
                                      <span>Independent / General Cargo (Shared Multi-Purpose Cargo Space)</span>
                                    </span>
                                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                      Shared Pool
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-emerald-800">
                                    ✔ Multi-shipper shared cargo space with dynamic fair Ton-Km pricing split. Suitable for dry goods, agricultural produce, packaged merchandise, and general freight.
                                  </p>
                                </div>
                              )}

                              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                                <Field label="Commodity / Cargo Item Details">
                                  <input
                                    type="text"
                                    required
                                    placeholder={
                                      trip.is_dedicated || trip.cargo_category === 'Dedicated / Isolated Cargo'
                                        ? `e.g. ${trip.dedicated_sub_category || 'Dedicated Cargo'} (Batch details & packing)`
                                        : (trip.cargo_category === 'Perishable Goods' || trip.has_perishables)
                                        ? "e.g. Tomatoes (40 crates), Amul Butter, Fresh Fish"
                                        : "e.g. Wheat Sacks, Cotton textiles, General merchandise"
                                    }
                                    className={`${inputCls} py-1.5 text-xs`}
                                    value={r.commodity_name || ''}
                                    onChange={e => updateRequest(trip.id, 'commodity_name', e.target.value)}
                                  />
                                </Field>

                                <Field label={t('form.goods_weight', 'Goods Weight (kg)')}>
                                  <input
                                    type="number"
                                    min="1"
                                    max={free}
                                    className={`${inputCls} py-1.5 text-xs font-mono font-bold`}
                                    value={r.weight || ''}
                                    placeholder={`Max ${free} kg`}
                                    onChange={e => updateRequest(trip.id, 'weight', e.target.value)}
                                  />
                                </Field>
                              </div>

                              {/* PERISHABLE & ICE REQUIREMENT SELECTION */}
                              <div className="pt-2.5 border-t border-slate-100">
                                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                                  <span className="flex items-center gap-1.5">
                                    <span>❄️</span>
                                    <span>Cargo Preservation & Cold-Chain Ice Option</span>
                                  </span>
                                  {r.ice_handling_required && (
                                    <span className="text-[10px] font-mono font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full border border-cyan-200">
                                      {(trip.cargo_category === 'Perishable Goods' || trip.has_perishables)
                                        ? '🧊 Cold-Chain Included (₹0 Extra)'
                                        : '🧊 Ice Added Once at Pickup (+₹75)'}
                                    </span>
                                  )}
                                </label>

                                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                                  <label className={`p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition ${
                                    r.ice_handling_required
                                      ? 'bg-cyan-50/90 border-cyan-400 text-cyan-950 ring-1 ring-cyan-400 shadow-xs'
                                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                  }`}>
                                    <input
                                      type="radio"
                                      name={`ice_req_${trip.id}`}
                                      checked={Boolean(r.ice_handling_required)}
                                      onChange={() => {
                                        updateRequest(trip.id, 'ice_handling_required', true);
                                        updateRequest(trip.id, 'is_perishable', true);
                                      }}
                                      className="mt-0.5 text-cyan-600 focus:ring-cyan-500"
                                    />
                                    <div>
                                      <p className="font-bold text-xs flex items-center justify-between gap-1 text-cyan-900">
                                        <span>🧊 Perishable — Needs Ice Box</span>
                                        {(trip.cargo_category === 'Perishable Goods' || trip.has_perishables) ? (
                                          <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-mono">₹0 Included</span>
                                        ) : (
                                          <span className="text-[9.5px] font-bold text-cyan-900 bg-cyan-200 px-1.5 py-0.2 rounded font-mono">+₹75 Surcharge</span>
                                        )}
                                      </p>
                                      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                                        {(trip.cargo_category === 'Perishable Goods' || trip.has_perishables)
                                          ? "Cold-chain vehicle with temperature monitoring. Ice coolant boxes included in base vehicle fare."
                                          : "Temperature-sensitive goods on independent cargo. 1 insulated food-grade ice box supplied at pickup (+₹75 fee)."}
                                      </p>
                                    </div>
                                  </label>

                                  <label className={`p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition ${
                                    !r.ice_handling_required
                                      ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 ring-1 ring-emerald-400 shadow-xs'
                                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                  }`}>
                                    <input
                                      type="radio"
                                      name={`ice_req_${trip.id}`}
                                      checked={!r.ice_handling_required}
                                      onChange={() => {
                                        updateRequest(trip.id, 'ice_handling_required', false);
                                      }}
                                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <div>
                                      <p className="font-bold text-xs flex items-center justify-between gap-1 text-slate-800">
                                        <span>📦 Dry / Ambient Goods</span>
                                        <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-mono">₹0 Extra</span>
                                      </p>
                                      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                                        Grains, dry pulses, onions, potatoes, general goods. Ambient shared cargo space with standard Ton-Km fare.
                                      </p>
                                    </div>
                                  </label>
                                </div>
                              </div>
                            </div>

                            {/* DYNAMIC ROUTE CORRIDOR & SEGMENT PRICING PREVIEW */}
                            {(() => {
                              const driverRoute = [
                                { lat: trip.pickup_lat || trip.lat || 0, lng: trip.pickup_lng || trip.lng || 0 },
                                { lat: trip.dest_lat || trip.destLat || 0, lng: trip.dest_lng || trip.destLng || 0 }
                              ].filter(c => c.lat !== 0 || c.lng !== 0);

                              const hasPickup = Boolean(r.pickupCoords?.lat && r.pickupCoords?.lng);
                              const hasDelivery = Boolean(r.deliveryCoords?.lat && r.deliveryCoords?.lng);
                              const isPickupOnRoute = !hasPickup || driverRoute.length < 2 || isPassengerOnRoute(r.pickupCoords, driverRoute, 3.8);
                              const isDeliveryOnRoute = !hasDelivery || driverRoute.length < 2 || isPassengerOnRoute(r.deliveryCoords, driverRoute, 3.8);
                              const isDirectionOk = !hasPickup || !hasDelivery || driverRoute.length < 2 || isDirectionAligned(driverRoute[0], driverRoute[1], r.pickupCoords, r.deliveryCoords);
                              const isSequenceOk = !hasPickup || !hasDelivery || driverRoute.length < 2 || isPickupBeforeDropAlongRoute(r.pickupCoords, r.deliveryCoords, driverRoute);
                              const isRouteValid = isPickupOnRoute && isDeliveryOnRoute && isDirectionOk && isSequenceOk;

                              const pMatch = hasPickup ? getCorridorMatchDetails(r.pickupCoords, driverRoute) : null;
                              const dMatch = hasDelivery ? getCorridorMatchDetails(r.deliveryCoords, driverRoute) : null;
                              const isMicroDetour = (pMatch?.tier === 'micro_detour' || dMatch?.tier === 'micro_detour');
                              const maxDetourVal = Math.max(pMatch?.detourKm || 0, dMatch?.detourKm || 0);

                              const weightNum = Number(r.weight || 0);
                              const tripCap = trip.totalKg || 1000;
                              const tripTotalFare = trip.total_driver_amount || (trip.pricePerKg * tripCap) || 3000;
                              const baseRatePerKg = trip.pricePerKg || (tripTotalFare / tripCap) || 12;

                              // Upfront Maximum Estimated Solo Fare (Worst-case ceiling before pooling discount)
                              const maxSoloFare = weightNum > 0
                                ? Math.max(50, Math.round(((weightNum / tripCap) * tripTotalFare) + 20))
                                : Math.round(baseRatePerKg * 10 + 20);

                              // Segment distance and dynamic fare once pickup/delivery coordinates are chosen
                              const hasCoords = hasPickup && hasDelivery;
                              const segDist = hasCoords
                                ? Math.max(5, calculateHighwayTortuosityKm(haversineDistance(r.pickupCoords.lat, r.pickupCoords.lng, r.deliveryCoords.lat, r.deliveryCoords.lng)))
                                : 0;

                              const estimatedFare = hasCoords ? calculateRouteAwarePrice(segDist, { ...trip, weight: weightNum }, 20) : null;

                              return (
                                <div className="space-y-2.5">
                                  {/* PROXIMITY CORRIDOR ALERT */}
                                  {(hasPickup || hasDelivery) && (
                                    <div className={`rounded-xl p-2.5 text-xs font-semibold flex items-center justify-between border ${
                                      isRouteValid
                                        ? isMicroDetour
                                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                                          : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                        : 'bg-red-50 text-red-800 border-red-300 animate-pulse'
                                    }`}>
                                      <span className="flex items-center gap-1.5">
                                        <span>{isRouteValid ? (isMicroDetour ? '📍' : '✔') : '❌'}</span>
                                        <span>
                                          {isRouteValid
                                            ? isMicroDetour
                                              ? `Smart Elastic Corridor Match (${maxDetourVal.toFixed(1)} km Micro-Detour Accepted)`
                                              : t('corridor.valid', 'Direct Highway Corridor Match (NH 316)')
                                            : t('corridor.invalid', "Route Mismatch: Selected location is outside the vehicle's transit corridor (> 3.8 km)")}
                                        </span>
                                      </span>
                                      <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full ${
                                        isRouteValid
                                          ? isMicroDetour
                                            ? 'bg-amber-200 text-amber-900 font-bold'
                                            : 'bg-emerald-200 text-emerald-900 font-bold'
                                          : 'bg-white/70 text-red-700'
                                      }`}>
                                        {isRouteValid ? (isMicroDetour ? 'Micro-Detour' : 'Direct Route') : t('corridor.off_route', 'Off-Route')}
                                      </span>
                                    </div>
                                  )}

                                  {/* AI-FIRST USER PARTIAL LOAD COST DISTRIBUTION & FULL-PRICE RULE */}
                                  {weightNum > 0 && (
                                    <ComponentErrorBoundary>
                                      <PtlUserPricingCard
                                        trip={trip}
                                        pickupLoc={r.pickupLocation || trip.from}
                                        deliveryLoc={r.deliveryLocation || trip.to}
                                        pickupCoords={r.pickupCoords}
                                        deliveryCoords={r.deliveryCoords}
                                        weightKg={weightNum}
                                        isIceRequested={Boolean(r.ice_handling_required)}
                                        isTripPerishable={trip.cargo_category === 'Perishable Goods' || Boolean(trip.has_perishables)}
                                        activeLang={typeof localStorage !== 'undefined' ? localStorage.getItem('ss_lang') || 'en' : 'en'}
                                        onPriceCalculated={(calculatedPrice, isShared, breakdown) => {
                                          // Callback hook for calculated price
                                        }}
                                      />
                                    </ComponentErrorBoundary>
                                  )}
                                </div>
                              );
                            })()}

                            <div className="grid sm:grid-cols-2 gap-3">
                              <Field label={t('form.pickup_loc', 'Your Pickup Location')}>
                                <LocationAutocomplete
                                  value={r.pickupLocation || ''}
                                  placeholder={t('form.pickup_placeholder', 'Search pickup city/hub...')}
                                  onChange={val => updateRequest(trip.id, 'pickupLocation', val)}
                                  onSelectLocation={loc => {
                                    if (loc) {
                                      updateRequest(trip.id, 'pickupLocation', loc.name);
                                      updateRequest(trip.id, 'pickupCoords', { lat: loc.lat, lng: loc.lng });
                                    } else {
                                      updateRequest(trip.id, 'pickupCoords', null);
                                    }
                                  }}
                                />
                              </Field>

                              <Field label={t('form.delivery_loc', 'Delivery Location')}>
                                <LocationAutocomplete
                                  value={r.deliveryLocation || ''}
                                  placeholder={t('form.delivery_placeholder', 'Search delivery city/hub...')}
                                  onChange={val => updateRequest(trip.id, 'deliveryLocation', val)}
                                  onSelectLocation={loc => {
                                    if (loc) {
                                      updateRequest(trip.id, 'deliveryLocation', loc.name);
                                      updateRequest(trip.id, 'deliveryCoords', { lat: loc.lat, lng: loc.lng });
                                    } else {
                                      updateRequest(trip.id, 'deliveryCoords', null);
                                    }
                                  }}
                                />
                              </Field>
                            </div>



                            <Field label="📸 Cargo Photo Proof (Mandatory Verification)">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-gold/50 hover:border-green-deep rounded-xl bg-white/80 hover:bg-gold/5 cursor-pointer transition text-xs font-semibold text-green-deep shadow-2xs">
                                    <Upload size={15} className="text-gold shrink-0" />
                                    <span>{r.pickup_cargo_image_url ? '✔ Change Cargo Photo' : 'Upload Cargo Photo (JPG/PNG/WEBP)'}</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const token = localStorage.getItem("access_token");
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        try {
                                          notify("Uploading cargo proof photo...");
                                          const uploadHeaders = {};
                                          if (token && token !== "null" && token !== "undefined") {
                                            uploadHeaders["Authorization"] = `Bearer ${token}`;
                                          }
                                          const res = await fetch(`${API_BASE}/api/requests/upload-cargo-image`, {
                                            method: "POST",
                                            headers: uploadHeaders,
                                            body: formData
                                          });
                                          const data = await res.json();
                                          if (res.ok && data.pickup_cargo_image_url) {
                                            updateRequest(trip.id, 'pickup_cargo_image_url', data.pickup_cargo_image_url);
                                            notify("✔ Cargo photo verified & attached!");
                                          } else {
                                            notify(data.detail || "Failed to upload cargo photo.");
                                          }
                                        } catch (err) {
                                          notify("Could not upload cargo photo.");
                                        }
                                      }}
                                    />
                                  </label>
                                  {r.pickup_cargo_image_url && (
                                    <a
                                      href={`${API_BASE}${r.pickup_cargo_image_url}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="w-12 h-12 rounded-xl overflow-hidden border-2 border-emerald-500 shrink-0 block hover:opacity-90 shadow-sm"
                                      title="Click to preview uploaded cargo photo"
                                    >
                                      <img
                                        src={`${API_BASE}${r.pickup_cargo_image_url}`}
                                        alt="Cargo Proof"
                                        className="w-full h-full object-cover"
                                      />
                                    </a>
                                  )}
                                </div>
                                {r.pickup_cargo_image_url ? (
                                  <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                                    <span>✔</span>
                                    <span>Verified Cargo Photo Attached (Ready for Driver Inspection)</span>
                                  </p>
                                ) : (
                                  <p className="text-[11px] text-amber-700 font-medium">
                                    ⚠ Required: Please upload a clear photo of your agricultural/commercial goods.
                                  </p>
                                )}
                              </div>
                            </Field>

                            <Field label={t('form.description', 'Description (Optional)')}>
                              <input
                                className={`${inputCls} py-1.5 text-xs`}
                                value={r.description || ''}
                                placeholder={t('form.desc_placeholder', 'Special handling requirements, fragile goods...')}
                                onChange={e => updateRequest(trip.id, 'description', e.target.value)}
                              />
                            </Field>

                            <button
                              disabled={submittingTripId === trip.id}
                              onClick={() => submitRequest(trip)}
                              className={`w-full py-2.5 rounded-xl text-cream font-bold text-xs shadow transition flex items-center justify-center gap-1.5 ${
                                submittingTripId === trip.id
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-green-deep hover:bg-green cursor-pointer'
                              }`}
                            >
                              {submittingTripId === trip.id ? (
                                <>
                                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                  <span>{t('form.sending', 'Sending Request...')}</span>
                                </>
                              ) : (
                                <>
                                  <Send size={14} />
                                  <span>{t('form.submit_booking', 'Submit Cargo Booking')}</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-paper border border-dashed border-gold/40 rounded-3xl p-10 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-cream mx-auto flex items-center justify-center text-3xl">
                    🚛
                  </div>
                  <h4 className="font-display font-bold text-lg text-green-deep">
                    No vehicles found matching your criteria
                  </h4>
                  <p className="text-xs text-green-soft max-w-md mx-auto">
                    Try adjusting your search location or clearing filters to view available trucks across India.
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT: INTERACTIVE ROUTE MAP (2 COLUMNS) */}
            <div className="lg:col-span-2 lg:sticky lg:top-24 space-y-3">
              <div ref={mapContainerRef} className="rounded-3xl overflow-hidden border border-gold/30 shadow-md bg-paper scroll-mt-24">
                <div>
                  <Maps
                    mode="findVehicle"
                    trips={list}
                    selectedTripId={requestOpen || selectedTripId}
                    activeRequest={requestOpen && requests[requestOpen] ? requests[requestOpen] : (selectedTripId && requests[selectedTripId] ? requests[selectedTripId] : null)}
                    focusMode={mapFocusMode}
                    onTripSelect={trip => setSelectedTripId(trip.id)}
                  />
                </div>

                <div className="bg-paper border-t border-gold/20 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-green-deep">Interactive Corridor Map</p>
                    <p className="text-[11px] text-green-soft">
                      {requestOpen ? 'Showing travel route for selected vehicle' : 'Click "View on Map" to inspect locations'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('map')}
                    className="px-3 py-1.5 bg-green-deep hover:bg-green text-cream text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>Expand</span>
                    <span>↗</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
         TAB 2: MY BOOKINGS & SHIPMENTS
      ========================================================= */}
      {activeTab === 'my_bookings' && (
        <div className="space-y-5 animate-[fadeIn_0.25s_ease]">
          {/* HEADER & FILTERS */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-paper border border-gold/30 rounded-2xl p-4 shadow-sm">
            <div>
              <h3 className="font-display font-bold text-lg text-green-deep flex items-center gap-2">
                <Package size={20} className="text-green-deep" />
                My Cargo Shipments ({myRequests.length})
              </h3>
              <p className="text-xs text-green-soft mt-0.5">
                Track your requested and active shipments, view proportional fares, and confirm deliveries.
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                ['all', `All (${myRequests.length})`],
                ['pending', `Pending (${myRequests.filter(r => r.status === 'pending').length})`],
                ['accepted', `In-Transit (${myRequests.filter(r => r.status === 'accepted' || r.status === 'in_transit').length})`],
                ['pending_conf', `Action Required (${myPendingConfCount})`],
                ['completed', `Completed (${myRequests.filter(r => r.status === 'completed').length})`]
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setMyBookingFilter(key)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${myBookingFilter === key
                      ? 'bg-green-deep text-cream shadow-sm'
                      : 'bg-cream text-green-soft hover:bg-gold/10 border border-gold/20'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* CATEGORIZED COMPLETED SHIPMENTS BANNER */}
          {myBookingFilter === 'completed' && filteredMyRequests.length > 0 && (
            <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cream border border-emerald-300 p-4 shadow-2xs flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-xl shadow-xs">
                  🏁
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-emerald-950 flex items-center gap-2">
                    <span>Verified Completed Deliveries</span>
                    <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-mono font-bold">
                      Latest at Top
                    </span>
                  </h4>
                  <p className="text-[11px] text-emerald-800">
                    All fulfilled shipments with photo proof of delivery, shipper ratings, and verified fair Ton-Km fares.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-700 text-white font-mono font-bold text-xs rounded-full shadow-2xs">
                {filteredMyRequests.length} Delivered
              </span>
            </div>
          )}

          {/* BOOKINGS CARD GRID */}
          {filteredMyRequests.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">
              {filteredMyRequests.map((req, idx) => {
                const isPending = req.status === 'pending';
                const isAccepted = req.status === 'accepted' || req.status === 'in_transit';
                const isWaitingConf = req.status === 'pending_passenger_confirmation';
                const isCompleted = req.status === 'completed';
                const isCancelled = req.status === 'cancelled_by_driver' || req.status === 'cancelled';
                const isTopCompleted = isCompleted && idx === 0 && myBookingFilter === 'completed';

                return (
                  <div
                    key={req.id}
                    className={`rounded-2xl border p-5 transition-all shadow-sm flex flex-col justify-between ${isTopCompleted
                        ? 'bg-gradient-to-br from-emerald-50/90 via-cream to-white border-emerald-400 shadow-md ring-2 ring-emerald-500/30'
                        : isWaitingConf
                          ? 'bg-amber-50/80 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                          : isAccepted
                            ? 'bg-green-50/60 border-green-300'
                            : isCompleted
                              ? 'bg-emerald-50/50 border-emerald-300'
                              : isCancelled
                                ? 'bg-red-50/40 border-red-200 opacity-75'
                                : 'bg-paper border-gold/30'
                      }`}
                  >
                    <div>
                      {/* HEADER */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-display font-bold text-base text-green-deep">
                              {req.route || 'Cargo Route'}
                            </p>
                            {isTopCompleted && (
                              <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full shadow-2xs">
                                ✨ Latest
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-green-soft mt-0.5">
                            👤 Transporter: <strong>{req.owner || 'Captain'}</strong> · 🚚 {req.vehicle || 'Truck'}
                          </p>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 flex items-center gap-1 ${isPending
                            ? 'bg-gold/20 text-soil'
                            : isAccepted
                              ? 'bg-green-600 text-white'
                              : isWaitingConf
                                ? 'bg-amber-500 text-white animate-pulse'
                                : isTopCompleted
                                  ? 'bg-emerald-700 text-white shadow-2xs'
                                  : isCompleted
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-red-500 text-white'
                          }`}>
                          {isWaitingConf
                            ? 'CONFIRMATION REQUIRED'
                            : isTopCompleted
                              ? '✨ LATEST COMPLETED'
                              : (req.status ? req.status.toUpperCase() : 'PENDING')
                          }
                        </span>
                      </div>

                      {/* SPECS & CARGO SPECIALIZATION */}
                      <div className="bg-cream rounded-xl border border-gold/20 p-3 space-y-2 text-xs mb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-green-soft">⚖ Cargo Weight:</span>
                          <span className="font-bold text-green-deep">{req.goods_weight_kg || req.kg} kg</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-green-soft">🛣 Estimated Distance:</span>
                          <span className="font-bold text-green-deep">{req.distance_km || 150} km</span>
                        </div>
                        {req.pickup_place && (
                          <div className="flex justify-between items-start pt-1 border-t border-gold/15">
                            <span className="text-green-soft shrink-0">📍 Pickup:</span>
                            <span className="font-medium text-green-deep text-right truncate max-w-[200px]">{req.pickup_place}</span>
                          </div>
                        )}

                        {/* CARGO SPECIALIZATION BADGES */}
                        <div className="pt-2 border-t border-gold/15 space-y-1.5">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="text-green-soft">Category:</span>
                            {req.cargo_category === 'Dedicated / Isolated Cargo' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                                <span>🔒 Dedicated Private</span>
                                {req.dedicated_sub_category && <span>· {req.dedicated_sub_category}</span>}
                              </span>
                            ) : req.cargo_category === 'Perishable Goods' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-900 border border-cyan-300">
                                <span>❄ Perishable</span>
                                {req.cooling_type && <span>· {req.cooling_type}</span>}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                <span>📦 General Shared</span>
                              </span>
                            )}
                          </div>

                          {req.commodity && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-green-soft">Commodity:</span>
                              <span className="font-semibold text-green-deep">{req.commodity}</span>
                            </div>
                          )}

                          {/* SECURITY SEAL BADGE */}
                          <div className="flex items-center justify-between text-[11px] pt-1">
                            <span className="text-green-soft flex items-center gap-1">
                              <span>🔐</span>
                              <span>Security Seal:</span>
                            </span>
                            {req.seal_number ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10.5px] font-bold border ${
                                req.seal_status === 'tampered_broken'
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : req.seal_status === 'verified_intact'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-blue-100 text-blue-800 border-blue-300'
                              }`}>
                                <span>#{req.seal_number}</span>
                                <span>({req.seal_status ? req.seal_status.replace('_', ' ').toUpperCase() : 'APPLIED'})</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-700 italic bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Pending Hub Seal Assignment
                              </span>
                            )}
                          </div>

                          {/* WEIGHBRIDGE & CHECKPOINT INSPECTION TIMELINE */}
                          {(() => {
                            const cps = req.checkpoints || [];
                            const maxInsp = req.max_inspections || 1;
                            const countDone = req.checkpoint_count || cps.length || 0;
                            const isExpanded = Boolean(expandedInspections[req.id]);

                            return (
                              <div className="rounded-xl border border-emerald-300/80 bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-white p-3 space-y-2 mt-2 text-xs shadow-2xs">
                                {/* Header */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                                    <span className="text-sm">🛡️</span>
                                    <span>Route Checkpoint Inspections</span>
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                    isCancelled
                                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                      : isCompleted || countDone >= maxInsp
                                      ? 'bg-emerald-600 text-white shadow-2xs'
                                      : countDone > 0
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    {isCancelled
                                      ? '🛑 Trip Cancelled'
                                      : isCompleted
                                      ? '✔ Trip Completed'
                                      : countDone >= maxInsp
                                      ? `✔ All ${maxInsp} Halts Certified`
                                      : countDone > 0
                                        ? `Halt ${countDone} of ${maxInsp} Completed`
                                        : `0/${maxInsp} Inspected (Scheduled)`}
                                  </span>
                                </div>

                                {/* Scale Weigh-in summary if available */}
                                {(req.verified_weight_kg || req.last_weigh_in_kg) && (
                                  <div className="flex items-center justify-between text-[11px] bg-white/90 p-2 rounded-lg border border-emerald-200/70">
                                    <span className="text-green-soft font-medium">⚖ Last Verified Weight:</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-green-deep">{req.verified_weight_kg || req.last_weigh_in_kg} kg</span>
                                      {req.weight_compliant === false ? (
                                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                                          ⚠️ Discrepancy
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                                          ✅ Scale Verified
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Checkpoints List */}
                                {cps.length > 0 ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[11px] text-emerald-900 bg-white/80 px-2.5 py-1.5 rounded-lg border border-emerald-200/60">
                                      <span className="truncate max-w-[200px]">
                                        Latest Stop: <strong>{cps[cps.length - 1].checkpoint_name}</strong>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setExpandedInspections(p => ({ ...p, [req.id]: !p[req.id] }))}
                                        className="font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-0.5 cursor-pointer ml-1 shrink-0"
                                      >
                                        <span>{isExpanded ? 'Hide All Halts ▴' : `View All (${cps.length}) ▾`}</span>
                                      </button>
                                    </div>

                                    {/* Timeline of all inspection stops */}
                                    {isExpanded ? (
                                      <div className="space-y-2 pt-1 border-t border-emerald-200/60">
                                        {cps.map((cp, cIdx) => (
                                          <div key={cp.id || cIdx} className="bg-white rounded-lg p-2.5 border border-emerald-200 shadow-2xs space-y-1.5">
                                            <div className="flex items-center justify-between gap-1 flex-wrap">
                                              <span className="font-bold text-emerald-900 text-[11px] flex items-center gap-1.5">
                                                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] flex items-center justify-center font-bold">{cIdx + 1}</span>
                                                <span>{cp.checkpoint_name}</span>
                                              </span>
                                              <span className="text-[10px] text-slate-500 font-mono">{cp.timestamp || 'Verified'}</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-1 text-[10.5px] pt-1 border-t border-slate-100">
                                              <div className="text-slate-600">
                                                Officer: <strong className="text-slate-800">{cp.officer_name || 'Field Officer'}</strong>
                                              </div>
                                              <div className="text-right">
                                                Seal: <span className="font-mono font-bold text-emerald-700">#{cp.seal_number || req.seal_number || 'Applied'}</span>
                                              </div>
                                            </div>

                                            <div className="flex items-center justify-between text-[10px] bg-slate-50 px-2 py-1 rounded">
                                              <span>
                                                ⚖ Scale: <strong>{cp.measured_weight_kg ? `${cp.measured_weight_kg} kg` : `${req.goods_weight_kg || req.kg} kg`}</strong>
                                                {cp.weight_compliant !== false ? (
                                                  <span className="ml-1 text-emerald-700 font-bold">✔ Compliant</span>
                                                ) : (
                                                  <span className="ml-1 text-rose-600 font-bold">⚠️ Discrepancy</span>
                                                )}
                                              </span>
                                              {cp.temp_celsius !== null && cp.temp_celsius !== undefined && (
                                                <span className="font-mono font-bold text-cyan-800">
                                                  ❄ {cp.temp_celsius}°C
                                                </span>
                                              )}
                                            </div>

                                            {cp.notes && (
                                              <p className="text-[10px] text-slate-600 italic bg-amber-50/70 p-1.5 rounded border border-amber-200/50">
                                                "{cp.notes}"
                                              </p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-[10.5px] text-emerald-800 italic">
                                        Cargo security verified at {cps[cps.length - 1].checkpoint_name} by Officer {cps[cps.length - 1].officer_name || 'In-Charge'}. Click "View All" to inspect the full highway halt audit.
                                      </p>
                                    )}

                                    {!isCompleted && !isCancelled && (
                                      <div className="text-[11px] text-amber-900 font-semibold flex items-center justify-between bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 mt-2">
                                        <span className="flex items-center gap-1">
                                          <span>🛑</span> Next Inspection Point:
                                        </span>
                                        <span className="font-mono font-bold text-amber-950">
                                          {req.next_inspection_point || (countDone >= maxInsp ? '✔ Completed' : 'En-route Highway Checkpoint')}
                                        </span>
                                      </div>
                                    )}

                                    {!isCompleted && !isCancelled && countDone < maxInsp && (
                                      <div className="text-[10.5px] text-emerald-800 font-medium flex items-center gap-1.5 bg-emerald-100/60 px-2.5 py-1.5 rounded-lg border border-emerald-200/50">
                                        <span>📍</span>
                                        <span>Next inspection halt ({countDone + 1} of {maxInsp}) will be conducted at a downstream checkpoint along the route.</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-[10.5px] text-slate-600 bg-white/80 p-2.5 rounded-lg border border-emerald-100 space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <span>{isCompleted ? '✅' : isCancelled ? '🛑' : '⏳'}</span>
                                      <span>
                                        {isCompleted
                                          ? 'Trip completed: Inspection cycle closed.'
                                          : isCancelled
                                            ? 'Trip cancelled: Inspection unavailable.'
                                            : req.status === 'in_transit' || req.status === 'accepted'
                                              ? `In transit: Ground officers will inspect cargo and record seals at ${maxInsp} highway checkpoint${maxInsp > 1 ? 's' : ''} along the corridor.`
                                              : `Inspection scheduled: Will be verified once the transporter starts transit.`}
                                      </span>
                                    </div>
                                    {!isCompleted && !isCancelled && (
                                      <div className="text-[11px] text-amber-900 font-semibold flex items-center justify-between bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                        <span className="flex items-center gap-1">
                                          <span>🛑</span> Next Halt:
                                        </span>
                                        <span className="font-mono font-bold text-amber-950">
                                          {req.next_inspection_point || 'Highway Checkpoint'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* TON-KM DYNAMIC SHARE HIGHLIGHT */}
                      <div className="rounded-xl bg-gold/10 border border-gold/30 p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-green-deep">Your Ton-Km Fare:</span>
                          <span className="font-display font-bold text-lg text-green-deep">
                            ₹{(req.per_person_share || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10.5px] text-green-soft">
                          <span>
                            Workload: {req.kg_km || ((req.goods_weight_kg || req.kg || 0) * (req.distance_km || 150))} kg·km ({req.share_pct || 100}% of pool)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                                const currentLang = localStorage.getItem('ss_lang') || 'en';
                                const isHindi = currentLang === 'hi' || currentLang === 'bho';
                                const text = isHindi
                                  ? `आपके ${req.distance_km || 150} किलोमीटर सफर और ${req.goods_weight_kg || req.kg} किलोग्राम भार के लिए आपका हिस्सा ₹${(req.per_person_share || 0).toLocaleString('en-IN')} है।`
                                  : `Your calculated share is ₹${(req.per_person_share || 0).toLocaleString('en-IN')} for ${req.distance_km || 150} kilometers and ${req.goods_weight_kg || req.kg} kilograms.`;
                                window.speechSynthesis.cancel();
                                const u = new SpeechSynthesisUtterance(text);
                                u.lang = isHindi ? 'hi-IN' : 'en-IN';
                                u.rate = 1.0;
                                window.speechSynthesis.speak(u);
                              }
                            }}
                            className="text-soil hover:text-green-deep flex items-center gap-1 font-semibold cursor-pointer bg-white/60 px-2 py-0.5 rounded-md border border-gold/20 hover:bg-white"
                          >
                            <span>🔊</span>
                            <span>Hear Fare</span>
                          </button>
                        </div>
                      </div>

                      {/* VIEW CORRIDOR RADAR MAP BUTTON */}
                      <button
                        type="button"
                        onClick={() => {
                          const matchedTrip = trips.find(t => t.id === req.trip_id) || {
                            id: req.trip_id,
                            from_loc: req.pickup_place || req.route?.split('→')[0],
                            to_loc: req.route?.split('→')[1] || req.route,
                            from: req.pickup_place || req.route?.split('→')[0],
                            to: req.route?.split('→')[1] || req.route,
                            lat: req.lat,
                            lng: req.lng,
                            pickup_lat: req.pickup_lat,
                            pickup_lng: req.pickup_lng,
                            dest_lat: req.dest_lat,
                            dest_lng: req.dest_lng,
                            checkpoints: req.checkpoints,
                            checkpoint_count: req.checkpoint_count,
                            max_inspections: req.max_inspections,
                            next_inspection_point: req.next_inspection_point,
                            next_inspection_lat: req.next_inspection_lat,
                            next_inspection_lng: req.next_inspection_lng,
                            is_unload_allowed: req.is_unload_allowed,
                            designated_checkpoints: req.designated_checkpoints,
                            vehicle: req.vehicle,
                            owner: req.owner,
                            status: req.status
                          };
                          setShipperMapModal({ isOpen: true, req, trip: matchedTrip });
                        }}
                        className="w-full mb-3 py-2 px-3 bg-green-deep hover:bg-green text-cream font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>🗺️</span>
                        <span>View Corridor Radar Map & Checkpoints</span>
                      </button>

                      {/* PROOF IMAGES (CARGO & DELIVERY) */}
                      {(req.pickup_cargo_image_url || req.delivery_proof_image_url) && (
                        <div className="space-y-2 mb-3">
                          {req.delivery_proof_image_url && (
                            <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 p-3 shadow-xs">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                                  <span>📸</span>
                                  <span>Stage 2 Delivery Photo Proof</span>
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                                  <span>✔</span>
                                  <span>Verified at Drop-off</span>
                                </span>
                              </div>
                              <a
                                href={`${API_BASE}${req.delivery_proof_image_url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="block rounded-xl overflow-hidden border-2 border-white shadow group relative max-h-44 bg-slate-900"
                              >
                                <img
                                  src={`${API_BASE}${req.delivery_proof_image_url}`}
                                  alt="Delivery Proof Photo"
                                  className="w-full h-36 object-cover group-hover:scale-105 transition duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-semibold text-xs gap-1.5">
                                  <span>🔍 Click to View Full Resolution Photo</span>
                                </div>
                              </a>
                            </div>
                          )}

                          {req.pickup_cargo_image_url && (
                            <div className="flex items-center gap-2">
                              <a
                                href={`${API_BASE}${req.pickup_cargo_image_url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition shadow-2xs"
                              >
                                <span>📦 My Cargo Photo</span>
                                <span className="text-[10px]">🔍</span>
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* RATING DISPLAY IF COMPLETED */}
                      {req.rating && (
                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs mb-3">
                          <p className="font-bold text-amber-800">
                            ⭐ You Rated: {req.rating}/5
                          </p>
                          {req.feedback && (
                            <p className="text-amber-900 mt-0.5 italic text-[11px]">
                              "{req.feedback}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="pt-3 border-t border-gold/20 mt-2">
                      {isWaitingConf && (
                        <button
                          onClick={() => {
                            setCompletionModal({
                              isOpen: true,
                              requestId: req.id,
                              tripOwner: req.owner || 'Driver',
                              route: req.route || '',
                              weight: req.goods_weight_kg || req.kg || 0,
                              distance: req.distance_km || 150,
                              kgKm: req.kg_km || ((req.goods_weight_kg || req.kg || 0) * (req.distance_km || 150)),
                              totalKgKm: req.total_trip_kg_km || 0,
                              share: req.per_person_share || 0,
                              totalAmount: req.total_driver_amount || 0,
                              sharePct: req.share_pct || 0,
                              deliveryProofUrl: req.delivery_proof_image_url || null,
                              rating: 5,
                              feedback: ''
                            });
                          }}
                          className="w-full py-2.5 bg-green-deep hover:bg-green text-cream font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>🎉 Review Fare & Confirm Delivery</span>
                        </button>
                      )}

                      {isAccepted && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-green-700 font-semibold flex items-center gap-1">
                              <span>✔</span>
                              <span>Transporter Accepted (In Transit)</span>
                            </p>
                            <button
                              onClick={async () => {
                                if (!window.confirm("Are you sure you want to cancel this booking?")) return;
                                const token = localStorage.getItem("access_token");
                                try {
                                  const res = await fetch(`${API_BASE}/api/requests/${req.id}`, {
                                    method: "DELETE",
                                    headers: { "Authorization": `Bearer ${token}` }
                                  });
                                  if (res.ok) {
                                    notify("✖ Booking cancelled.");
                                    fetchTripsAndRequests();
                                  }
                                } catch (err) {
                                  notify("Could not connect to backend.");
                                }
                              }}
                              className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-[11px] rounded-lg transition cursor-pointer"
                            >
                              Cancel Booking
                            </button>
                          </div>
                          {req.trip_id && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTripId(req.trip_id);
                                setRequestOpen(req.trip_id);
                                window.scrollTo({ top: 400, behavior: 'smooth' });
                              }}
                              className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>🗺️ Track Live Route & Checkpoint Halts</span>
                            </button>
                          )}
                        </div>
                      )}

                      {isPending && (
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-amber-800 font-medium">
                            ⏳ Waiting for transporter acceptance.
                          </p>
                          <button
                            onClick={async () => {
                              const token = localStorage.getItem("access_token");
                              try {
                                const res = await fetch(`${API_BASE}/api/requests/${req.id}`, {
                                  method: "DELETE",
                                  headers: { "Authorization": `Bearer ${token}` }
                                });
                                if (res.ok) {
                                  notify("✖ Request cancelled.");
                                  fetchTripsAndRequests();
                                }
                              } catch (err) {
                                notify("Could not connect to backend.");
                              }
                            }}
                            className="text-xs text-red-600 hover:underline font-medium cursor-pointer"
                          >
                            Cancel Request
                          </button>
                        </div>
                      )}

                      {isCompleted && (
                        <p className="text-xs text-emerald-800 font-medium flex items-center gap-1">
                          <span>✔</span>
                          <span>Delivery successfully confirmed and completed.</span>
                        </p>
                      )}

                      {isCancelled && (
                        <p className="text-xs text-red-600 font-medium">
                          ✖ Ride cancelled.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-paper border border-dashed border-gold/40 rounded-3xl p-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-cream mx-auto flex items-center justify-center text-3xl">
                📦
              </div>
              <h4 className="font-display font-bold text-lg text-green-deep">
                No cargo shipments found
              </h4>
              <p className="text-xs text-green-soft max-w-md mx-auto">
                {myBookingFilter === 'all'
                  ? "You haven't requested space on any vehicles yet. Explore available trucks and book cargo space."
                  : `No bookings found matching "${myBookingFilter}".`}
              </p>
              <button
                onClick={() => setActiveTab('explore')}
                className="px-5 py-2.5 bg-green-deep hover:bg-green text-cream font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>🔍</span>
                <span>Explore Available Trucks</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
         TAB 3: LIVE MAP RADAR
      ========================================================= */}
      {activeTab === 'map' && (
        <div className="space-y-4 animate-[fadeIn_0.25s_ease]">
          <div className="rounded-3xl overflow-hidden border border-gold/30 shadow-md bg-paper">
            <div className="h-[600px]">
              <Maps
                mode="findVehicle"
                trips={list}
                selectedTripId={selectedTripId}
                activeRequest={selectedTripId && requests[selectedTripId] ? requests[selectedTripId] : null}
                focusMode={mapFocusMode}
                onTripSelect={trip => setSelectedTripId(trip.id)}
              />
            </div>
            <div className="bg-paper border-t border-gold/20 p-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-sm text-green-deep">Live Transporter Radar</h4>
                <p className="text-xs text-green-soft">Explore road corridors, active live drivers (🚛), and pickup centers (📦).</p>
              </div>
              <button
                onClick={() => navigate('/maps')}
                className="px-4 py-2 bg-green-deep hover:bg-green text-cream text-xs font-semibold rounded-xl shadow-sm transition"
              >
                Full Route Radar ↗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
         TAB 4: SENDER PROFILE
      ========================================================= */}
      {activeTab === 'profile' && (
        <div className="max-w-3xl mx-auto space-y-6 animate-[fadeIn_0.25s_ease]">
          <div className="rounded-3xl bg-paper border border-gold/30 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-gold/20">
              <div>
                <p className="text-xs font-mono text-green-soft uppercase tracking-wide">Connected Profile</p>
                <h3 className="font-display font-bold text-2xl text-green-deep mt-0.5">{profile.full_name || 'Sender'}</h3>
                <p className="text-xs text-green-soft mt-1">Email: {profile.email} · Phone: {profile.phone_number || 'N/A'}</p>
                {profile.gender && <p className="text-xs text-green-soft mt-0.5 font-medium">Gender: {profile.gender}</p>}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setEditForm({
                      full_name: profile.full_name || '',
                      phone_number: profile.phone_number || '',
                      gender: profile.gender || 'Male'
                    });
                    setIsEditing(!isEditing);
                  }}
                  className="px-4 py-2 rounded-xl border border-green-deep text-green-deep font-semibold text-xs hover:bg-green-deep/10 transition cursor-pointer"
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </button>
                <span className="inline-block px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Sender Active
                </span>
              </div>
            </div>

            {/* IN-LINE EDITING PROFILE FORM */}
            {isEditing && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const token = localStorage.getItem("access_token");
                  try {
                    const res = await fetch(`${API_BASE}/auth/update-profile`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                      },
                      body: JSON.stringify(editForm)
                    });
                    if (res.ok) {
                      const updatedData = await res.json();
                      setProfile(prev => ({ ...prev, ...updatedData }));
                      setIsEditing(false);
                      notify("✔ Profile updated successfully!");
                    } else {
                      notify("⚠ Failed to update profile details.");
                    }
                  } catch (err) {
                    console.error(err);
                    notify("Could not update details.");
                  }
                }}
                className="mt-5 pt-4 border-t border-gold/20 space-y-4 animate-[fadeIn_0.3s_ease]"
              >
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-green-deep mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                      className={`${inputCls} py-1.5 px-3 text-xs`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-green-deep mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editForm.phone_number}
                      onChange={e => setEditForm({ ...editForm, phone_number: e.target.value })}
                      className={`${inputCls} py-1.5 px-3 text-xs`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-green-deep mb-1">Gender</label>
                    <select
                      value={editForm.gender}
                      onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                      className={`${inputCls} py-1.5 px-3 text-xs`}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-300 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-deep text-cream font-semibold text-xs rounded-xl hover:bg-green transition cursor-pointer shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DRIVER CANCELLATION ALERT MODAL */}
      {cancellationModal.isOpen && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_.2s_ease]">
          <div className="bg-white rounded-3xl border border-red-200 shadow-2xl max-w-md w-full p-6 text-center animate-[scaleIn_.25s_ease]">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-4 text-3xl shadow-inner">
              ⚠️
            </div>

            <h3 className="font-display font-bold text-xl text-green-deep mb-2">
              {cancellationModal.title}
            </h3>

            <p className="text-sm text-green-soft leading-relaxed mb-4">
              {cancellationModal.message}
            </p>

            {cancellationModal.route && (
              <div className="bg-paper rounded-xl border border-gold/30 p-3 text-xs text-green-deep font-mono mb-5 text-left">
                <p className="font-bold">📍 Route: {cancellationModal.route}</p>
                {cancellationModal.driverName && <p className="mt-1">👤 Driver: {cancellationModal.driverName}</p>}
                <p className="text-red-600 font-semibold mt-1">Status: Cancelled by Driver</p>
              </div>
            )}

            <button
              onClick={() => {
                setCancellationModal(prev => ({ ...prev, isOpen: false }));
                setSelectedTripId(null);
                setRequestOpen(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-3 px-4 rounded-xl bg-green-deep hover:bg-green text-cream font-semibold text-sm shadow-md transition cursor-pointer"
            >
              Find a New Vehicle
            </button>
          </div>
        </div>
      )}

      {/* TWO-WAY RIDE COMPLETION CONFIRMATION & RATING MODAL */}
      {completionModal.isOpen && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_.2s_ease]">
          <div className="bg-white rounded-3xl border border-gold/40 shadow-2xl max-w-md w-full p-6 animate-[scaleIn_.25s_ease] max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 mx-auto flex items-center justify-center mb-3 text-3xl shadow-inner">
                📦
              </div>

              <h3 className="font-display font-bold text-2xl text-green-deep">
                Delivery Complete!
              </h3>
              <p className="text-xs text-green-soft mt-1">
                The driver has reached the destination and marked this ride complete. Please review your fare share and confirm delivery.
              </p>
            </div>

            {/* TRIP & TON-KM PROPORTIONAL FARE DETAILS */}
            <div className="mt-5 rounded-2xl bg-paper border border-gold/30 p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-green-soft font-medium">📍 Route:</span>
                <span className="font-bold text-green-deep">{completionModal.route}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-soft font-medium">👤 Driver:</span>
                <span className="font-semibold">{completionModal.tripOwner}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-soft font-medium">⚖ Cargo Weight:</span>
                <span className="font-bold">{completionModal.weight} kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-soft font-medium">🛣 Traveled Distance:</span>
                <span className="font-bold">{completionModal.distance} km</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-soft font-medium">📊 Your Ton-Km Workload:</span>
                <span className="font-bold text-soil">{completionModal.kgKm} kg·km ({completionModal.sharePct}% pool)</span>
              </div>

              <div className="pt-2 border-t border-gold/20 flex justify-between items-center">
                <span className="text-green-deep font-semibold">Your Fair Ton-Km Cost Share:</span>
                <span className="font-display font-bold text-xl text-green-deep">
                  ₹{completionModal.share}
                </span>
              </div>
              <p className="text-[10.5px] text-green-soft/80 italic">
                Formula: ({completionModal.weight}kg × {completionModal.distance}km ÷ {completionModal.totalKgKm || completionModal.kgKm} total kg·km) × ₹{completionModal.totalAmount || completionModal.share} total vehicle load price.
              </p>
            </div>

            {/* DRIVER DELIVERY PROOF PHOTO PREVIEW */}
            {completionModal.deliveryProofUrl && (
              <div className="mt-4 rounded-2xl bg-blue-50 border border-blue-200 p-3">
                <p className="text-xs font-bold text-blue-900 mb-1.5 flex items-center gap-1">
                  <span>📸 Verified Delivery Proof Photo</span>
                </p>
                <div className="rounded-xl overflow-hidden border border-blue-300 max-h-48 bg-black/5">
                  <a href={`${API_BASE}${completionModal.deliveryProofUrl}`} target="_blank" rel="noreferrer" title="Click to view full photo">
                    <img
                      src={`${API_BASE}${completionModal.deliveryProofUrl}`}
                      alt="Driver Delivery Proof"
                      className="w-full h-44 object-cover hover:scale-105 transition duration-300 cursor-pointer"
                    />
                  </a>
                </div>
                <p className="text-[10.5px] text-blue-800 mt-1">Photo captured & uploaded by driver at drop-off location.</p>
              </div>
            )}

            {/* 5-STAR RATING SELECTOR */}
            <div className="mt-5">
              <label className="block text-xs font-semibold text-green-deep mb-2 text-center">
                Rate your experience with {completionModal.tripOwner}
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCompletionModal(prev => ({ ...prev, rating: star }))}
                    className="text-3xl transition hover:scale-125 focus:outline-none cursor-pointer"
                  >
                    {star <= completionModal.rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-center text-green-soft mt-1">
                {completionModal.rating === 5 ? '⭐⭐⭐⭐⭐ Excellent Service' : completionModal.rating === 4 ? '⭐⭐⭐⭐ Very Good' : completionModal.rating === 3 ? '⭐⭐⭐ Average' : '⭐ Needs Improvement'}
              </p>
            </div>

            {/* FEEDBACK COMMENT */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-green-deep mb-1">
                Feedback / Comments (Optional)
              </label>
              <textarea
                className="w-full rounded-xl border border-gold/40 bg-cream/30 p-2.5 text-xs outline-none focus:border-green-deep"
                rows="2"
                placeholder="How was the cargo handling, driver communication, and timeliness?"
                value={completionModal.feedback}
                onChange={e => setCompletionModal(prev => ({ ...prev, feedback: e.target.value }))}
              />
            </div>

            {/* ACTIONS */}
            <div className="mt-5">
              <button
                onClick={async () => {
                  const token = localStorage.getItem("access_token");
                  const activeLang = typeof localStorage !== 'undefined' ? localStorage.getItem("ss_lang") || lang || "hi" : lang || "hi";
                  try {
                    const res = await fetch(`${API_BASE}/api/requests/${completionModal.requestId}/confirm-completion?lang=${encodeURIComponent(activeLang)}`, {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        rating: completionModal.rating,
                        feedback: completionModal.feedback
                      })
                    });
                    if (res.ok) {
                      notify("✔ Delivery confirmed! Thank you for rating the driver.");
                      setCompletionModal(prev => ({ ...prev, isOpen: false }));
                      setSelectedTripId(null);
                      setRequestOpen(null);
                      await fetchTripsAndRequests();
                    } else {
                      const errData = await res.json().catch(() => ({}));
                      notify(errData.detail || "⚠ Failed to confirm delivery.");
                    }
                  } catch (err) {
                    console.error("Confirmation error", err);
                    notify("Could not connect to backend.");
                  }
                }}
                className="w-full py-3 rounded-xl bg-green-deep hover:bg-green text-cream font-bold text-sm shadow-md transition cursor-pointer"
              >
                Confirm Delivery & Complete Ride
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHIPPER ROUTE & CHECKPOINT RADAR MAP MODAL */}
      {shipperMapModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-scaleIn">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base flex items-center gap-2">
                  <span>🗺️</span>
                  <span>Shipper Cargo Highway Radar & Checkpoint Map</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Route: {shipperMapModal.req?.route || `${shipperMapModal.trip?.from_loc} → ${shipperMapModal.trip?.to_loc}`} · Commodity: {shipperMapModal.req?.commodity || shipperMapModal.req?.cargo_type} ({shipperMapModal.req?.goods_weight_kg || shipperMapModal.req?.kg} kg)
                </p>
              </div>
              <button
                onClick={() => setShipperMapModal({ isOpen: false, req: null, trip: null })}
                className="p-1.5 rounded-full hover:bg-white/20 transition cursor-pointer text-slate-300 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  <span>🛡️</span> Stamped Checkpoints: {shipperMapModal.trip?.checkpoint_count || shipperMapModal.trip?.checkpoints?.length || shipperMapModal.req?.checkpoints?.length || 0}
                </span>
                <span className="flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  <span>🛑</span> Next Inspection Point: <strong>{shipperMapModal.trip?.next_inspection_point || shipperMapModal.req?.next_inspection_point || 'En-route Checkpoint'}</strong>
                </span>
                <span className={`px-2 py-0.5 rounded-lg font-bold border text-[11px] ${
                  (shipperMapModal.trip?.is_unload_allowed ?? shipperMapModal.req?.is_unload_allowed)
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border-rose-300'
                }`}>
                  {(shipperMapModal.trip?.is_unload_allowed ?? shipperMapModal.req?.is_unload_allowed) ? '✔ Unload Permitted' : `🔒 Unload Locked (${shipperMapModal.trip?.inspections_remaining ?? shipperMapModal.req?.inspections_remaining ?? 1} Checkpoint(s) Left)`}
                </span>
              </div>
              <div className="text-[11px] text-slate-600">
                Transporter: <strong>{shipperMapModal.trip?.owner || shipperMapModal.req?.owner}</strong> ({shipperMapModal.trip?.vehicle || shipperMapModal.req?.vehicle})
              </div>
            </div>

            <div className="p-2 flex-1 min-h-[480px] bg-slate-100 relative">
              <Maps
                mode="findVehicle"
                trips={shipperMapModal.trip ? [shipperMapModal.trip] : []}
                selectedTripId={shipperMapModal.trip?.id}
                activeRequest={shipperMapModal.req}
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
                onClick={() => setShipperMapModal({ isOpen: false, req: null, trip: null })}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Map
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}



/* =========================================================
   OFFER A TRIP + DRIVER DELIVERY
========================================================= */

export function OfferTrip() {
  const { lang, t } = useLang()
  const [toast, notify] = useToast()
  const navigate = useNavigate()

  const [profile, setProfile] = useState({ full_name: '', email: '', phone_number: '', gender: '', aadhaar_doc: '', license_doc: '', is_verified: false });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', phone_number: '', gender: 'Male', aadhaar_doc: '', license_doc: '' });
  const [o, setO] = useState({
    from: '',
    fromCoords: null,
    to: '',
    toCoords: null,
    date: '',
    vehicle: 'Mini-Truck',
    total: 800,
    cap: 800,
    fare: 'driver',
    price: '',
    totalDriverAmount: '',
    pickup: '',
    pickupCoords: null,
    includeReturnTrip: false,
    returnDate: '',
    returnDiscountPct: 20,
    returnPickup: '',
    iceHandlingSupported: false,
    cargoCategory: 'Independent / General Cargo',
    dedicatedSubCategory: 'Pharmaceuticals & Vaccines',
    coolingType: 'Crushed Flake Ice Boxes (Logistics Provided)'
  })

  const [docs, setDocs] = useState({
    identity: null,
    license: null
  })

  const [published, setPublished] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [arrived, setArrived] = useState(false)
  const [deliveryPhoto, setDeliveryPhoto] = useState(null)
  const [done, setDone] = useState(false)
  const [incomingRequests, setIncomingRequests] = useState([])
  const [myTrips, setMyTrips] = useState([])
  const [activeLiveTripId, setActiveLiveTripId] = useState(null)
  const [proofModal, setProofModal] = useState({ isOpen: false, tripId: null, proofUrl: null, uploading: false })
  const [deliverModal, setDeliverModal] = useState({ isOpen: false, req: null, proofUrl: null, uploading: false })
  const [itineraryModal, setItineraryModal] = useState({ isOpen: false, trip: null, result: null, loading: false })
  const [driverMapModal, setDriverMapModal] = useState({ isOpen: false, trip: null })
  const liveIntervalRef = useRef(null)
  const isLiveActiveRef = useRef(false)

  // Calculated Road Distance for Vehicle Suitability Validation
  const [routeDistanceKm, setRouteDistanceKm] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const calculateDistance = async () => {
      if (o.fromCoords && o.toCoords) {
        try {
          const d = await getOsrmDistanceKm(o.fromCoords, o.toCoords);
          if (isMounted && d > 0) {
            setRouteDistanceKm(d);
            return;
          }
        } catch (e) {
          // fallback haversine
        }
        const direct = haversineDistance(o.fromCoords.lat, o.fromCoords.lng, o.toCoords.lat, o.toCoords.lng);
        if (isMounted && direct > 0) {
          setRouteDistanceKm(calculateHighwayTortuosityKm(direct));
        }
      } else {
        if (isMounted) setRouteDistanceKm(0);
      }
    };
    calculateDistance();
    return () => { isMounted = false; };
  }, [o.fromCoords, o.toCoords, o.from, o.to]);

  const currentVehSpec = useMemo(() => getVehicleCapacitySpec(o.vehicle), [o.vehicle]);
  const isCapacityExceeded = Number(o.total) > currentVehSpec.maxKg || Number(o.total) < currentVehSpec.minKg || Number(o.cap) > Number(o.total);
  const isDistanceExceeded = routeDistanceKm > 0 && currentVehSpec.maxDistanceKm !== Infinity && routeDistanceKm > currentVehSpec.maxDistanceKm;

  const fetchMyTrips = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/trips/my?include_completed=true`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMyTrips(data);
          const liveTrip = data.find(t => t.status === 'in_transit' || t.is_live);
          if (liveTrip) {
            setActiveLiveTripId(liveTrip.id);
          } else {
            setActiveLiveTripId(null);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch my trips", err);
    }
  };

  const handleEndEmptyTrip = async (tripId) => {
    const targetTrip = myTrips.find(t => t.id === tripId);
    const tripName = targetTrip ? `${targetTrip.from_loc || targetTrip.from} → ${targetTrip.to_loc || targetTrip.to}` : `#${tripId}`;
    if (!window.confirm(`End empty run for ${tripName}? Since no cargo was booked, this journey will be concluded and marked as completed.`)) {
      return;
    }
    if (liveIntervalRef.current && activeLiveTripId === tripId) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
      setActiveLiveTripId(null);
    }
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${API_BASE}/api/trips/${tripId}/end-empty`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setActiveLiveTripId(null);
        notify("🏁 Empty run ended successfully! Trip marked as completed.");
        fetchMyTrips();
      } else {
        const errData = await res.json().catch(() => ({}));
        notify(errData.detail || "⚠ Failed to end empty run.");
      }
    } catch (err) {
      console.error("Failed to end empty trip", err);
      notify("Could not connect to backend.");
    }
  };

  const cancelTrip = async (tripId) => {
    const targetTrip = myTrips.find(t => t.id === tripId);
    const activeReqs = (incomingRequests || []).filter(r => r.trip_id === tripId && ['accepted', 'in_transit', 'assigned', 'pending_passenger_confirmation'].includes(r.status));
    if (targetTrip && targetTrip.status !== 'pending' && targetTrip.status !== 'scheduled' && activeReqs.length > 0) {
      notify("⚠ Cannot cancel a trip that has already started with active cargo.");
      return;
    }
    // If this is a started empty run with no cargo, route to endEmptyTrip instead
    if (targetTrip && targetTrip.status !== 'pending' && targetTrip.status !== 'scheduled' && activeReqs.length === 0) {
      return handleEndEmptyTrip(tripId);
    }
    if (!window.confirm("Are you sure you want to cancel this scheduled trip? All connected passengers will be notified immediately.")) {
      return;
    }
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${API_BASE}/api/trips/${tripId}/cancel`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setActiveLiveTripId(null);
        notify("✖ Trip cancelled. Connected passengers have been notified.");
        fetchMyTrips();
        // Also refresh incoming requests
        const reqRes = await fetch(`${API_BASE}/api/requests/incoming`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const reqData = await reqRes.json();
        if (reqRes.ok && Array.isArray(reqData)) {
          setIncomingRequests(reqData);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        notify(errData.detail || "⚠ Failed to cancel trip.");
      }
    } catch (err) {
      console.error("Failed to cancel trip", err);
      notify("Could not connect to backend.");
    }
  };

  const startLiveTrip = async (trip) => {
    // ENFORCE LOAD VERIFICATION CHECK: Cannot start until logistics verifies cargo at pickup
    if (trip.can_start_trip === false || trip.is_load_verified === false || (trip.unverified_cargo_count && trip.unverified_cargo_count > 0)) {
      notify(`⚠ ${trip.start_lock_reason || "Cannot start trip. Cargo load must be verified, weighed, and sealed by the ground logistics officer before departure."}`);
      return;
    }

    // ENFORCE MANDATORY LOCATION PERMISSION CHECK
    if (!navigator.geolocation) {
      notify("⚠ Location services are not supported by your browser. Cannot start trip.");
      return;
    }

    notify("📡 Requesting location access...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // Location permission granted!
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const speed = position.coords.speed ? Math.round(position.coords.speed * 3.6) : 35;

        const token = localStorage.getItem("access_token");
        try {
          // Update status to in_transit
          const statusRes = await fetch(`${API_BASE}/api/trips/${trip.id}/status?status=in_transit`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` }
          });

          if (!statusRes.ok) {
            const errData = await statusRes.json().catch(() => ({}));
            notify(`⚠ ${errData.detail || "Failed to start trip on server."}`);
            return;
          }

          // Initial location push
          await fetch(`${API_BASE}/api/trips/${trip.id}/location`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              lat: lat,
              lng: lng,
              speed: speed,
              status: "in_transit",
              is_live: true
            })
          });

          isLiveActiveRef.current = true;
          setActiveLiveTripId(trip.id);
          notify("✔ Trip Started! Sharing live location with all senders.");
          fetchMyTrips();

          if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);

          let step = 0;
          liveIntervalRef.current = setInterval(() => {
            if (!isLiveActiveRef.current) return;
            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                if (!isLiveActiveRef.current) return;
                let currentLat = pos.coords.latitude;
                let currentLng = pos.coords.longitude;

                // Incremental simulation step so truck moves on map even on stationary desktop
                step += 0.0005;
                currentLat += (step * 0.02);
                currentLng += (step * 0.02);

                const currentSpeed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 40;

                try {
                  if (!isLiveActiveRef.current) return;
                  await fetch(`${API_BASE}/api/trips/${trip.id}/location`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      lat: currentLat,
                      lng: currentLng,
                      speed: currentSpeed,
                      status: "in_transit",
                      is_live: true
                    })
                  });
                } catch (e) {
                  console.error("Location sync error", e);
                }
              },
              (err) => console.warn("Periodic location sync warning", err),
              { enableHighAccuracy: true }
            );
          }, 3000);

        } catch (err) {
          console.error("Error starting live trip", err);
          notify("Could not connect to backend.");
        }
      },
      (error) => {
        // ENFORCE MANDATORY BLOCKING IF LOCATION ACCESS IS DENIED
        console.error("Location permission error:", error);
        notify("⚠ Location access is required to start the trip. Please enable location permissions in your browser.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const driverCompleteTrip = (tripId) => {
    const trip = myTrips.find(t => t.id === tripId);
    if (trip && trip.partners) {
      const pendingUnloads = trip.partners.filter(p => {
        const inc = incomingRequests.find(r => r.id === p.id);
        const lStatus = p.loading_status || inc?.loading_status || 'pending';
        return ['accepted', 'in_transit', 'pending'].includes(p.status) && lStatus !== 'unloaded';
      });
      if (pendingUnloads.length > 0) {
        notify(`⚠ Cannot complete delivery: ${pendingUnloads.length} cargo shipment(s) pending drop unload verification by the ground logistics team. Please verify unloading in Logistics Portal first.`);
        return;
      }
    }
    isLiveActiveRef.current = false;
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
    setActiveLiveTripId(null);
    setProofModal({
      isOpen: true,
      tripId: tripId,
      proofUrl: null,
      uploading: false
    });
  };

  const handleUploadDeliveryProof = async (file) => {
    if (!file) return;
    const token = localStorage.getItem("access_token");
    const formData = new FormData();
    formData.append("file", file);
    setProofModal(prev => ({ ...prev, uploading: true }));
    try {
      notify("Uploading delivery proof photo...");
      const uploadHeaders = {};
      if (token && token !== "null" && token !== "undefined") {
        uploadHeaders["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE}/api/trips/upload-delivery-proof`, {
        method: "POST",
        headers: uploadHeaders,
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.delivery_proof_image_url) {
        setProofModal(prev => ({ ...prev, proofUrl: data.delivery_proof_image_url, uploading: false }));
        notify("✔ Delivery proof photo verified!");
      } else {
        setProofModal(prev => ({ ...prev, uploading: false }));
        notify(data.detail || "Failed to upload delivery proof.");
      }
    } catch (err) {
      setProofModal(prev => ({ ...prev, uploading: false }));
      notify("Could not connect to backend to upload proof.");
    }
  };

  const confirmCompleteWithProof = async () => {
    if (!proofModal.proofUrl) {
      notify("⚠ Mandatory: Please upload a delivery proof photo before completing this trip.");
      return;
    }
    const currentTrip = myTrips.find(t => t.id === proofModal.tripId);
    if (currentTrip && currentTrip.partners) {
      const activeUnverified = currentTrip.partners.filter(p => {
        const inc = incomingRequests.find(r => r.id === p.id);
        const lStatus = p.loading_status || inc?.loading_status || 'pending';
        return ['accepted', 'in_transit', 'pending'].includes(p.status) && lStatus !== 'unloaded';
      });
      if (activeUnverified.length > 0) {
        notify(`⚠ Cannot complete delivery: ${activeUnverified.length} cargo shipment(s) are awaiting unload verification by the ground logistics team.`);
        return;
      }
    }
    isLiveActiveRef.current = false;
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
    setActiveLiveTripId(null);
    const token = localStorage.getItem("access_token");
    const headers = {};
    if (token && token !== "null" && token !== "undefined") {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const activeLang = typeof localStorage !== 'undefined' ? localStorage.getItem("ss_lang") || lang || "hi" : lang || "hi";
      const res = await fetch(`${API_BASE}/api/trips/${proofModal.tripId}/complete?delivery_proof_image_url=${encodeURIComponent(proofModal.proofUrl)}&lang=${encodeURIComponent(activeLang)}`, {
        method: "PUT",
        headers
      });
      if (res.ok) {
        setMyTrips(prev => prev.map(t => t.id === proofModal.tripId ? { ...t, status: 'pending_passenger_confirmation', is_live: false } : t));
        notify("✔ Delivery proof verified! WhatsApp delivery alerts sent with photos to all shippers.");
        setProofModal({ isOpen: false, tripId: null, proofUrl: null, uploading: false });
        
        fetchMyTrips();
        const reqRes = await fetch(`${API_BASE}/api/requests/incoming`, {
          headers
        });
        const reqData = await reqRes.json().catch(() => []);
        if (reqRes.ok && Array.isArray(reqData)) {
          setIncomingRequests(reqData);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        notify(data.detail || "⚠ Failed to initiate trip completion.");
      }
    } catch (err) {
      console.error("Failed to complete trip", err);
      notify("Could not connect to backend.");
    }
  };

  const handleUploadIndividualDeliveryProof = async (file) => {
    if (!file) return;
    const token = localStorage.getItem("access_token");
    const formData = new FormData();
    formData.append("file", file);
    setDeliverModal(prev => ({ ...prev, uploading: true }));
    try {
      notify("Uploading cargo drop-off proof photo...");
      const uploadHeaders = {};
      if (token && token !== "null" && token !== "undefined") {
        uploadHeaders["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE}/api/requests/upload-delivery-proof`, {
        method: "POST",
        headers: uploadHeaders,
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.delivery_proof_image_url) {
        setDeliverModal(prev => ({ ...prev, proofUrl: data.delivery_proof_image_url, uploading: false }));
        notify("✔ Cargo drop-off proof photo verified!");
      } else {
        setDeliverModal(prev => ({ ...prev, uploading: false }));
        notify(data.detail || "Failed to upload delivery proof.");
      }
    } catch (err) {
      setDeliverModal(prev => ({ ...prev, uploading: false }));
      notify("Could not connect to backend to upload proof.");
    }
  };

  const confirmDeliverIndividualCargo = async () => {
    if (!deliverModal.req || !deliverModal.proofUrl) {
      notify("⚠ Mandatory: Please upload a delivery proof photo before completing drop-off.");
      return;
    }
    const incReq = incomingRequests.find(r => r.id === deliverModal.req.id);
    const lStatus = deliverModal.req.loading_status || incReq?.loading_status || 'pending';
    if (lStatus !== 'unloaded') {
      notify("⚠ Cannot complete delivery: Cargo unload has not been verified yet! The logistics team must supervise and verify cargo unloading in the Logistics Portal before delivery can be completed.");
      return;
    }
    const token = localStorage.getItem("access_token");
    const headers = {};
    if (token && token !== "null" && token !== "undefined") {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const activeLang = typeof localStorage !== 'undefined' ? localStorage.getItem("ss_lang") || lang || "hi" : lang || "hi";
      const formData = new FormData();
      formData.append("delivery_proof_image_url", deliverModal.proofUrl);
      formData.append("lang", activeLang);

      const res = await fetch(`${API_BASE}/api/requests/${deliverModal.req.id}/deliver-proof`, {
        method: "POST",
        headers,
        body: formData
      });
      if (res.ok) {
        notify(`✔ Delivery proof sent to ${deliverModal.req.farmer_name || 'Shipper'} via WhatsApp! Waiting for passenger confirmation.`);
        setDeliverModal({ isOpen: false, req: null, proofUrl: null, uploading: false });
        
        fetchMyTrips();
        const reqRes = await fetch(`${API_BASE}/api/requests/incoming`, { headers });
        const reqData = await reqRes.json().catch(() => []);
        if (reqRes.ok && Array.isArray(reqData)) {
          setIncomingRequests(reqData);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        notify(data.detail || "⚠ Failed to submit individual drop-off proof.");
      }
    } catch (err) {
      console.error("Failed to deliver individual cargo", err);
      notify("Could not connect to backend.");
    }
  };

  const handleViewOptimalItinerary = async (trip) => {
    setItineraryModal({ isOpen: true, trip, result: null, loading: true });
    const token = localStorage.getItem("access_token");
    const headers = { "Content-Type": "application/json" };
    if (token && token !== "null" && token !== "undefined") {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const originLat = trip.pickup_lat || trip.lat || 20.4625;
    const originLng = trip.pickup_lng || trip.lng || 85.8828;
    const destLat = trip.dest_lat || trip.destLat || 20.2961;
    const destLng = trip.dest_lng || trip.destLng || 85.8245;

    const intermediateStops = [];
    const activePartners = trip.partners ? trip.partners.filter(p => ['accepted', 'in_transit', 'pending', 'pending_passenger_confirmation', 'completed'].includes(p.status)) : [];

    activePartners.forEach((p, pIdx) => {
      const fullReq = incomingRequests.find(r => r.id === p.id) || p;
      const pickupPlace = p.pickup_place || fullReq.pickup_place || fullReq.pickup_location || fullReq.from_loc || fullReq.from || p.from || `${trip.from_loc?.split(',')[0] || trip.from || 'Origin'} Hub`;
      const deliveryPlace = p.delivery_place || fullReq.delivery_place || fullReq.delivery_location || fullReq.dropoff_place || fullReq.to_loc || fullReq.to || p.to || `${trip.to_loc?.split(',')[0] || trip.to || 'Destination'} Hub`;

      const pLat = Number(p.pickup_lat || fullReq.pickup_lat || (originLat + (destLat - originLat) * ((pIdx + 1) / (activePartners.length + 2))));
      const pLng = Number(p.pickup_lng || fullReq.pickup_lng || (originLng + (destLng - originLng) * ((pIdx + 1) / (activePartners.length + 2))));
      const dLat = Number(p.delivery_lat || fullReq.delivery_lat || (originLat + (destLat - originLat) * ((pIdx + 1.5) / (activePartners.length + 2))));
      const dLng = Number(p.delivery_lng || fullReq.delivery_lng || (originLng + (destLng - originLng) * ((pIdx + 1.5) / (activePartners.length + 2))));
      const weight = Number(p.goods_weight_kg || fullReq.goods_weight_kg || p.kg || fullReq.kg || 0);

      // Add Pickup Stop
      intermediateStops.push({
        id: `p_${p.id}`,
        name: `${p.farmer_name || 'Shipper'} (Pickup: ${pickupPlace})`,
        lat: pLat,
        lng: pLng,
        type: 'pickup',
        weight_kg: weight,
        booking_id: String(p.id)
      });

      // Add Delivery Stop
      intermediateStops.push({
        id: `d_${p.id}`,
        name: `${p.farmer_name || 'Shipper'} (Delivery: ${deliveryPlace})`,
        lat: dLat,
        lng: dLng,
        type: 'delivery',
        weight_kg: weight,
        booking_id: String(p.id)
      });
    });

    const payload = {
      trip_id: trip.id,
      vehicle_capacity_kg: Number(trip.total_kg || 1000),
      origin: {
        id: 'origin',
        name: `${trip.from_loc || trip.from || 'Origin'} (Trip Start)`,
        lat: Number(originLat),
        lng: Number(originLng),
        type: 'origin',
        weight_kg: 0
      },
      destination: {
        id: 'dest',
        name: `${trip.to_loc || trip.to || 'Destination'} (Final Stop)`,
        lat: Number(destLat),
        lng: Number(destLng),
        type: 'destination',
        weight_kg: 0
      },
      intermediate_stops: intermediateStops,
      max_detour_km: 1.0
    };

    try {
      const res = await fetch(`${API_BASE}/api/trips/optimize-stops`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setItineraryModal({ isOpen: true, trip, result: data, loading: false });
      } else {
        notify(data.detail || data.notes || "Could not calculate optimal stop sequence.");
        setItineraryModal({ isOpen: true, trip, result: null, loading: false });
      }
    } catch (err) {
      console.error("Failed to fetch optimal stops", err);
      notify("Could not connect to route optimization engine.");
      setItineraryModal({ isOpen: false, trip: null, result: null, loading: false });
    }
  };


  // Fetch logged-in driver profile details + incoming requests + my trips
  useEffect(() => {
    const fetchStatus = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/auth/status`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.authenticated !== false) {
          setProfile(data);
          setDocs(prev => {
            const next = { ...prev };
            if (data.aadhaar_doc) {
              next.identity = { name: data.aadhaar_doc, url: data.aadhaar_doc_url || null };
            }
            if (data.license_doc) {
              next.license = { name: data.license_doc, url: data.license_doc_url || null };
            }
            return next;
          });
        }
      } catch (err) {
        console.error("Could not fetch user profile status", err);
      }

      try {
        const reqRes = await fetch(`${API_BASE}/api/requests/incoming`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const reqData = await reqRes.json();
        if (reqRes.ok && Array.isArray(reqData)) {
          setIncomingRequests(reqData);
        }
      } catch (err) {
        console.error("Failed to fetch incoming requests", err);
      }
    };
    fetchStatus();
    fetchMyTrips();
    const pollInterval = setInterval(() => {
      fetchMyTrips();
      const token = localStorage.getItem("access_token");
      if (token) {
        fetch(`${API_BASE}/api/requests/incoming`, {
          headers: { "Authorization": `Bearer ${token}` }
        }).then(r => r.json()).then(d => {
          if (Array.isArray(d)) setIncomingRequests(d);
        }).catch(() => {});
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("login_intent");
    localStorage.removeItem("role");
    localStorage.removeItem("user_type");
    sessionStorage.clear();
    stopSpeech();
    navigate('/login');
  };

  const handleSwitchToSender = () => {
    localStorage.removeItem("access_token");
    localStorage.setItem("login_intent", "find");
    sessionStorage.clear();
    stopSpeech();
    navigate('/login', { state: { intent: 'find' } });
  };

  const upDoc = async (key, file) => {
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setDocs(prev => ({
      ...prev,
      [key]: {
        name: file.name,
        url: localUrl
      }
    }));

    const token = localStorage.getItem("access_token");
    const docType = key === 'identity' ? 'aadhaar' : 'license';
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', docType);

      const res = await fetch(`${API_BASE}/auth/upload-document`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(prev => ({
          ...prev,
          aadhaar_doc: data.aadhaar_doc || prev.aadhaar_doc,
          aadhaar_doc_url: data.aadhaar_doc_url || prev.aadhaar_doc_url,
          license_doc: data.license_doc || prev.license_doc,
          license_doc_url: data.license_doc_url || prev.license_doc_url,
          is_verified: data.is_verified
        }));
        setDocs(prev => ({
          ...prev,
          [key]: {
            name: data.filename || file.name,
            url: data.url || localUrl
          }
        }));
        notify(`✔ ${docType === 'aadhaar' ? 'Aadhaar' : 'Driving Licence'} uploaded successfully!`);
      } else {
        notify("⚠ Could not save document to server. It is only previewed locally.");
      }
    } catch (err) {
      console.error("Failed to upload document", err);
      notify("⚠ Could not save document to server. It is only previewed locally.");
    }
  };

  const taken = Math.round(
    (1 - o.cap / o.total) * 100
  )

  const publishTrip = async () => {
    if (isPublishing) return;
    if (!o.from || !o.from.trim()) {
      notify('⚠ Please select a starting city/hub (From location).');
      return;
    }
    if (!o.to || !o.to.trim()) {
      notify('⚠ Please select a destination city/hub (To location).');
      return;
    }
    if (o.from.trim().toLowerCase() === o.to.trim().toLowerCase()) {
      notify('⚠ Origin and Destination locations cannot be identical.');
      return;
    }
    if (!o.date) {
      notify('⚠ Please select a valid travel departure date.');
      return;
    }
    if (!o.vehicle) {
      notify('⚠ Please select a vehicle type.');
      return;
    }
    if (!o.total || Number(o.total) <= 0) {
      notify('⚠ Please enter total vehicle capacity in kg.');
      return;
    }
    if (!o.cap || Number(o.cap) <= 0) {
      notify('⚠ Please enter available space to share in kg.');
      return;
    }
    const desiredPrice = Number(o.totalDriverAmount) || Number(o.price) || 0;
    if (desiredPrice <= 0) {
      notify('⚠ Please enter the total desired vehicle load fare (₹).');
      return;
    }
    if (!o.pickup || !o.pickup.trim()) {
      notify('⚠ Please enter pickup instructions or landmark details.');
      return;
    }

    // Check documents: either from local docs state or from profile (already uploaded)
    const hasIdentity = docs.identity || profile.aadhaar_doc;
    const hasLicense = docs.license || profile.license_doc;
    if (!hasIdentity || !hasLicense) {
      notify('⚠ Please upload required verification documents.');
      return;
    }
    const spec = getVehicleCapacitySpec(o.vehicle);
    if (Number(o.total) > spec.maxKg) {
      notify(`❌ Physical Limit Exceeded: ${o.total} kg exceeds the physical limit of ${spec.maxKg} kg for ${spec.displayName || spec.name}.`);
      return;
    }
    if (Number(o.total) < spec.minKg) {
      notify(`❌ Invalid Capacity: Minimum capacity for ${spec.displayName || spec.name} is ${spec.minKg} kg.`);
      return;
    }
    if (Number(o.cap) > Number(o.total)) {
      notify(`❌ Available capacity (${o.cap} kg) cannot exceed total vehicle capacity (${o.total} kg).`);
      return;
    }
    if (routeDistanceKm > 0 && spec.maxDistanceKm !== Infinity && routeDistanceKm > spec.maxDistanceKm) {
      notify(`❌ Distance Limit Exceeded: ${spec.displayName || spec.name} cannot be used for routes exceeding ${spec.maxDistanceKm} km (Current route is ${routeDistanceKm.toFixed(1)} km).`);
      return;
    }

    setIsPublishing(true);
    notify('🔍 Verifying locations in India...');
    try {
      let fromResolved = o.fromCoords;
      if (!fromResolved) {
        fromResolved = await geocodeIndianLocation(o.from);
      }
      if (!fromResolved) {
        notify(`❌ "${o.from}" is not a valid location in India. Please enter a valid Indian city.`);
        setIsPublishing(false);
        return;
      }

      let toResolved = o.toCoords;
      if (!toResolved) {
        toResolved = await geocodeIndianLocation(o.to);
      }
      if (!toResolved) {
        notify(`❌ "${o.to}" is not a valid location in India. Please enter a valid Indian city.`);
        setIsPublishing(false);
        return;
      }

      const tripLat = fromResolved.lat;
      const tripLng = fromResolved.lng;

      // Send trip to backend
      const token = localStorage.getItem("access_token");
      const activeLang = typeof localStorage !== 'undefined' ? localStorage.getItem("ss_lang") || lang || "hi" : lang || "hi";
      const res = await fetch(`${API_BASE}/api/trips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          state: fromResolved.state || fromResolved.shortName || o.from,
          from_loc: fromResolved.shortName ? `${fromResolved.shortName}, ${fromResolved.state || 'India'}` : o.from,
          to_loc: toResolved.shortName ? `${toResolved.shortName}, ${toResolved.state || 'India'}` : o.to,
          date: o.date,
          vehicle: o.vehicle,
          owner: profile.full_name || 'Driver',
          verified: profile.is_verified || (!!hasIdentity && !!hasLicense),
          pct: taken,
          total_kg: Number(o.total),
          price_per_kg: Number(o.price) || 0,
          total_driver_amount: desiredPrice,
          pickup: o.pickup,
          lat: tripLat,
          lng: tripLng,
          dest_lat: toResolved.lat,
          dest_lng: toResolved.lng,
          pickup_lat: tripLat,
          pickup_lng: tripLng,
          lang: activeLang,
          ice_handling_supported: o.cargoCategory === 'Perishable Goods' ? (o.iceHandlingSupported !== false) : false,
          has_perishables: o.cargoCategory === 'Perishable Goods',
          cargo_category: o.cargoCategory,
          dedicated_sub_category: o.cargoCategory === 'Dedicated / Isolated Cargo' ? o.dedicatedSubCategory : null,
          is_dedicated: o.cargoCategory === 'Dedicated / Isolated Cargo',
          cooling_type: o.cargoCategory === 'Perishable Goods' ? o.coolingType : null
        })
      });

      if (res.ok) {
        const createdTrip = await res.json();
        setPublished(true);

        // If Return Backhaul Trip option is enabled, automatically publish the reverse corridor trip!
        if (o.includeReturnTrip && createdTrip && createdTrip.id) {
          try {
            const retDiscount = Number(o.returnDiscountPct) || 20;
            const returnFare = Math.round(desiredPrice * (1 - retDiscount / 100));
            const returnRes = await fetch(`${API_BASE}/api/trips`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                state: toResolved.state || toResolved.shortName || o.to,
                from_loc: toResolved.shortName ? `${toResolved.shortName}, ${toResolved.state || 'India'}` : o.to,
                to_loc: fromResolved.shortName ? `${fromResolved.shortName}, ${fromResolved.state || 'India'}` : o.from,
                date: o.returnDate || o.date,
                vehicle: o.vehicle,
                owner: profile.full_name || 'Driver',
                verified: profile.is_verified || (!!hasIdentity && !!hasLicense),
                pct: taken,
                total_kg: Number(o.total),
                price_per_kg: Number(o.price) || 0,
                total_driver_amount: returnFare,
                pickup: o.returnPickup || `Return pickup at ${toResolved.shortName || o.to}`,
                lat: toResolved.lat,
                lng: toResolved.lng,
                dest_lat: fromResolved.lat,
                dest_lng: fromResolved.lng,
                pickup_lat: toResolved.lat,
                pickup_lng: toResolved.lng,
                lang: activeLang,
                is_return_leg: true,
                return_trip_id: createdTrip.id,
                return_discount_pct: retDiscount,
                ice_handling_supported: o.cargoCategory === 'Perishable Goods' ? (o.iceHandlingSupported !== false) : false,
                has_perishables: o.cargoCategory === 'Perishable Goods',
                cargo_category: o.cargoCategory,
                dedicated_sub_category: o.cargoCategory === 'Dedicated / Isolated Cargo' ? o.dedicatedSubCategory : null,
                is_dedicated: o.cargoCategory === 'Dedicated / Isolated Cargo',
                cooling_type: o.cargoCategory === 'Perishable Goods' ? o.coolingType : null
              })
            });
            if (returnRes.ok) {
              const createdReturnTrip = await returnRes.json();
              if (createdReturnTrip && createdReturnTrip.id) {
                setMyTrips(prev => [createdReturnTrip, createdTrip, ...prev.filter(t => t.id !== createdTrip.id && t.id !== createdReturnTrip.id)]);
              }
              notify(`✔ Outbound & Return Backhaul (${toResolved.shortName || o.to} → ${fromResolved.shortName || o.from} at ${retDiscount}% OFF) published successfully!`);
            }
          } catch (retErr) {
            console.error("Failed to publish linked return trip", retErr);
          }
        } else {
          notify(`✔ Trip published successfully: ${fromResolved.shortName || fromResolved.state || o.from} → ${toResolved.shortName || toResolved.state || o.to}`);
        }

        // Reset form state
        setO({
          from: '',
          fromCoords: null,
          to: '',
          toCoords: null,
          date: '',
          vehicle: 'Mini-Truck',
          total: 800,
          cap: 800,
          fare: 'driver',
          price: '',
          totalDriverAmount: '',
          pickup: '',
          pickupCoords: null,
          includeReturnTrip: false,
          returnDate: '',
          returnDiscountPct: 20,
          returnPickup: '',
          iceHandlingSupported: false,
          cargoCategory: 'Independent / General Cargo',
          dedicatedSubCategory: 'Pharmaceuticals & Vaccines',
          coolingType: 'Crushed Flake Ice Boxes (Logistics Provided)'
        });
        if (createdTrip && createdTrip.id) {
          setMyTrips(prev => [createdTrip, ...prev.filter(t => t.id !== createdTrip.id)]);
        }
        await fetchMyTrips();
        // Immediately redirect to published trips list
        setActiveTab('trips');
        setTripFilter('active');
      } else {
        const data = await res.json();
        notify(data.detail || "Failed to publish trip.");
      }
    } catch (err) {
      console.error("Failed to publish trip", err);
      notify("Could not connect to backend.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCreateReturnTrip = (trip) => {
    const origFrom = trip.from_loc || trip.from || '';
    const origTo = trip.to_loc || trip.to || '';
    const origAmount = Number(trip.total_driver_amount) || Number(trip.price_per_kg * trip.total_kg) || 4000;
    const discountedAmount = Math.round(origAmount * 0.8);

    setO({
      from: origTo,
      fromCoords: trip.dest_lat && trip.dest_lng ? { lat: trip.dest_lat, lng: trip.dest_lng, shortName: origTo.split(',')[0], state: trip.state } : null,
      to: origFrom,
      toCoords: trip.lat && trip.lng ? { lat: trip.lat, lng: trip.lng, shortName: origFrom.split(',')[0], state: trip.state } : null,
      date: trip.date || '',
      vehicle: trip.vehicle || 'Mini-Truck',
      total: trip.total_kg || 800,
      cap: trip.total_kg || 800,
      fare: 'driver',
      price: String(discountedAmount),
      totalDriverAmount: String(discountedAmount),
      pickup: `Return pickup at ${origTo.split(',')[0]}`,
      pickupCoords: null,
      includeReturnTrip: false,
      returnDate: '',
      returnDiscountPct: 20,
      returnPickup: '',
      iceHandlingSupported: true
    });

    setActiveTab('publish');
    notify(`✔ Return Route Loaded (${origTo.split(',')[0]} → ${origFrom.split(',')[0]}) with 20% Backhaul Discount!`);
  };

  const [activeTab, setActiveTab] = useState('trips'); // 'trips' | 'requests' | 'publish' | 'profile'
  const [requestFilter, setRequestFilter] = useState('all'); // 'all' | 'pending' | 'accepted' | 'completed'
  const [tripFilter, setTripFilter] = useState('active'); // 'active' | 'live' | 'scheduled' | 'pending' | 'completed' | 'all'

  const pendingRequestsCount = incomingRequests.filter(r => r.status === 'pending').length;
  const activeTripsCount = myTrips.filter(t => t.status === 'in_transit' || t.is_live || t.status === 'scheduled' || t.status === 'pending_passenger_confirmation').length;
  const completedTripsCount = myTrips.filter(t => t.status === 'completed').length;
  const liveTripsCount = myTrips.filter(t => t.status === 'in_transit' || t.is_live).length;
  const totalRevenuePotential = myTrips.filter(t => t.status !== 'cancelled' && t.status !== 'cancelled_by_driver').reduce((acc, t) => acc + (t.total_driver_amount || t.totalDriverAmount || (t.price_per_kg * t.total_kg) || 0), 0);

  const filteredRequests = useMemo(() => {
    let list = incomingRequests.filter(req => {
      if (requestFilter === 'pending') return req.status === 'pending';
      if (requestFilter === 'accepted') return req.status === 'accepted';
      if (requestFilter === 'completed') return req.status === 'completed' || req.status === 'pending_passenger_confirmation';
      return true;
    });

    return list.sort((a, b) => String(b.id || '').localeCompare(String(a.id || '')));
  }, [incomingRequests, requestFilter]);

  const filteredTrips = useMemo(() => {
    let list = myTrips.filter(trip => {
      if (tripFilter === 'active') return trip.status !== 'completed' && trip.status !== 'cancelled' && trip.status !== 'cancelled_by_driver';
      if (tripFilter === 'live') return trip.status === 'in_transit' || trip.is_live;
      if (tripFilter === 'scheduled') return trip.status === 'scheduled';
      if (tripFilter === 'pending') return trip.status === 'pending_passenger_confirmation';
      if (tripFilter === 'completed') return trip.status === 'completed';
      return true;
    });

    return list.sort((a, b) => {
      if (tripFilter === 'completed') {
        // Most recently completed trips at the very top
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      }
      const getPriority = (t) => {
        if (t.is_live || t.status === 'in_transit') return 4;
        if (t.status === 'pending_passenger_confirmation') return 3;
        if (t.status === 'scheduled') return 2;
        return 1;
      };
      const diff = getPriority(b) - getPriority(a);
      if (diff !== 0) return diff;
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });
  }, [myTrips, tripFilter, activeLiveTripId]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {toast}

      {/* HEADER WITH LOGOUT & DRIVER PROFILE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-gold/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-green-deep/10 text-green-deep text-xs font-mono font-bold uppercase tracking-wider">
              {t('profile.driver_role', 'Driver Operations Hub')}
            </span>
            {profile.is_verified && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 size={13} /> {t('card.verified', 'Verified')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-green-deep mt-1">
              {t('nav_offer_trip', 'Driver Trip Management Dashboard')}
            </h1>
            <TTSButton textToRead={`${t('nav_offer_trip', 'Driver Trip Management Dashboard')}. ${t('offer.subtitle', 'Share the available space in your vehicle with people who need to transport goods.')}`} />
          </div>
          <p className="text-sm text-green-soft mt-1">
            {t('offer.subtitle', 'Share the available space in your vehicle with people who need to transport goods.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="hidden sm:block text-right">
            <p className="font-bold text-xs text-green-deep">{profile.full_name || t('profile.driver_role', 'Driver')}</p>
            <p className="text-[11px] text-green-soft font-mono">{profile.email}</p>
          </div>
          <button
            onClick={handleSwitchToSender}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl shadow-sm transition duration-200 text-xs flex items-center gap-1 cursor-pointer"
            title="Switch to Sender Google Account"
          >
            <span>🔄</span>
            <span>Switch to Sender Hub</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-sm transition duration-200 text-xs cursor-pointer"
          >
            {t('nav_logout', 'Logout')}
          </button>
        </div>
      </div>

      {/* 4-CARD QUICK METRICS OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          onClick={() => { setActiveTab('trips'); setTripFilter('active'); }}
          className="rounded-2xl bg-paper border border-gold/30 p-4 shadow-sm hover:border-green-deep/40 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] font-mono text-green-soft uppercase tracking-wide">{t('metric.active_trips', 'Active Trips')}</p>
            <p className="font-display font-bold text-2xl text-green-deep mt-0.5">{activeTripsCount}</p>
            <p className="text-[11px] text-green-soft mt-0.5">{liveTripsCount} {t('metric.live_transit', 'Live In-Transit')}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-green-50 border border-green-200 text-green-700 flex items-center justify-center text-xl shadow-inner">
            🚛
          </div>
        </div>

        <div
          onClick={() => { setActiveTab('requests'); setRequestFilter(pendingRequestsCount > 0 ? 'pending' : 'all'); }}
          className="rounded-2xl bg-paper border border-gold/30 p-4 shadow-sm hover:border-green-deep/40 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] font-mono text-green-soft uppercase tracking-wide">{t('tab.driver_requests', 'Incoming Requests')}</p>
            <p className="font-display font-bold text-2xl text-green-deep mt-0.5">{incomingRequests.length}</p>
            <p className="text-[11px] font-semibold mt-0.5 text-amber-700">
              {pendingRequestsCount > 0 ? `⚡ ${pendingRequestsCount} Pending Action` : 'All caught up'}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl border shadow-inner ${pendingRequestsCount > 0 ? 'bg-amber-50 border-amber-300 text-amber-700 animate-pulse' : 'bg-cream border-gold/30 text-green-deep'}`}>
            📦
          </div>
        </div>

        <div
          onClick={() => { setActiveTab('trips'); setTripFilter('active'); }}
          className="rounded-2xl bg-paper border border-gold/30 p-4 shadow-sm hover:border-green-deep/40 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] font-mono text-green-soft uppercase tracking-wide">{t('metric.revenue_potential', 'Total Load Potential')}</p>
            <p className="font-display font-bold text-2xl text-green-deep mt-0.5">₹{totalRevenuePotential.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-green-soft mt-0.5">Across {activeTripsCount} active published trip{activeTripsCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gold/10 border border-gold/30 text-soil flex items-center justify-center text-xl font-bold shadow-inner">
            ₹
          </div>
        </div>

        <div
          onClick={() => setActiveTab('profile')}
          className="rounded-2xl bg-paper border border-gold/30 p-4 shadow-sm hover:border-green-deep/40 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] font-mono text-green-soft uppercase tracking-wide">{t('offer.ownerVerification', 'Verification')}</p>
            <p className="font-display font-bold text-lg text-green-deep mt-1">
              {profile.is_verified ? t('card.verified', 'Verified Driver') : t('find.verificationPending', 'Pending Upload')}
            </p>
            <p className="text-[11px] text-green-soft mt-0.5">
              {profile.is_verified ? '🛡️ Govt. ID Confirmed' : 'Action Required'}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl border shadow-inner ${profile.is_verified ? 'bg-green-50 border-green-300 text-green-700' : 'bg-amber-50 border-amber-300 text-amber-700'}`}>
            {profile.is_verified ? '🛡️' : '⏳'}
          </div>
        </div>
      </div>

      {/* MODERN TAB NAVIGATION BAR */}
      <div className="flex items-center gap-2 border-b border-gold/30 mb-6 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => { setActiveTab('trips'); setTripFilter('active'); }}
          className={`px-5 py-3 rounded-2xl font-display font-bold text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeTab === 'trips'
              ? 'bg-green-deep text-cream shadow-md'
              : 'text-green-deep hover:bg-gold/10'
            }`}
        >
          <Truck size={17} />
          <span>{t('tab.driver_trips', 'My Published Trips')}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${activeTab === 'trips' ? 'bg-cream text-green-deep' : 'bg-green-deep/10 text-green-deep'}`}>
            {activeTripsCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-5 py-3 rounded-2xl font-display font-bold text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeTab === 'requests'
              ? 'bg-green-deep text-cream shadow-md'
              : 'text-green-deep hover:bg-gold/10'
            }`}
        >
          <Package size={17} />
          <span>{t('tab.driver_requests', 'Incoming Requests')}</span>
          {pendingRequestsCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500 text-white animate-pulse">
              {pendingRequestsCount} new
            </span>
          ) : (
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${activeTab === 'requests' ? 'bg-cream text-green-deep' : 'bg-green-deep/10 text-green-deep'}`}>
              {incomingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('publish')}
          className={`px-5 py-3 rounded-2xl font-display font-bold text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeTab === 'publish'
              ? 'bg-green-deep text-cream shadow-md'
              : 'text-green-deep hover:bg-gold/10'
            }`}
        >
          <span>➕</span>
          <span>{t('tab.driver_publish', 'Offer New Trip')}</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-3 rounded-2xl font-display font-bold text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeTab === 'profile'
              ? 'bg-green-deep text-cream shadow-md'
              : 'text-green-deep hover:bg-gold/10'
            }`}
        >
          <ShieldCheck size={17} />
          <span>{t('tab.driver_profile', 'Driver Profile & ID')}</span>
        </button>
      </div>

      {/* =========================================================
         TAB 1: MY PUBLISHED TRIPS & LIVE LOCATION CONTROL
      ========================================================= */}
      {activeTab === 'trips' && (
        <div className="space-y-5 animate-[fadeIn_0.25s_ease]">
          {/* FILTER CONTROLS & HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-paper border border-gold/30 rounded-2xl p-4 shadow-sm">
            <div>
              <h3 className="font-display font-bold text-lg text-green-deep flex items-center gap-2">
                <Truck size={20} className="text-green-deep" />
                Published Trip Loads ({activeTripsCount})
              </h3>
              <p className="text-xs text-green-soft mt-0.5">
                Control active trips, share live GPS locations, and mark loads complete.
              </p>
            </div>

            {/* FILTER PILLS */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                ['active', `Active (${activeTripsCount})`],
                ['live', `Live (${liveTripsCount})`],
                ['scheduled', `Scheduled (${myTrips.filter(t => t.status === 'scheduled').length})`],
                ['pending', `Pending Conf. (${myTrips.filter(t => t.status === 'pending_passenger_confirmation').length})`],
                ['completed', `Completed Archive (${completedTripsCount})`],
                ['all', `All (${myTrips.length})`]
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTripFilter(key)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${tripFilter === key
                      ? 'bg-green-deep text-cream shadow-sm'
                      : 'bg-cream text-green-soft hover:bg-gold/10 border border-gold/20'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* CATEGORIZED COMPLETED TRIPS BANNER */}
          {tripFilter === 'completed' && filteredTrips.length > 0 && (
            <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cream border border-emerald-300 p-4 shadow-2xs flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-xl shadow-xs">
                  🏆
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-emerald-950 flex items-center gap-2">
                    <span>Completed Trip Runs Archive</span>
                    <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-mono font-bold">
                      Latest Completed at Top
                    </span>
                  </h4>
                  <p className="text-[11px] text-emerald-800">
                    All fulfilled runs with verified recipient drop-offs, full load revenue receipts, and passenger ratings.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-700 text-white font-mono font-bold text-xs rounded-full shadow-2xs">
                {filteredTrips.length} Completed Runs
              </span>
            </div>
          )}

          {/* TRIPS CARD GRID */}
          {filteredTrips.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">
              {filteredTrips.map((trip, idx) => {
                const activePartners = trip.partners ? trip.partners.filter(p => ['accepted', 'in_transit', 'pending', 'pending_passenger_confirmation', 'completed'].includes(p.status)) : [];
                const undeliveredPartners = activePartners.filter(p => ['accepted', 'in_transit', 'pending'].includes(p.status));
                const allPartnersDelivered = activePartners.length > 0 && undeliveredPartners.length === 0;

                const isCompleted = trip.status === 'completed' || (activePartners.length > 0 && activePartners.every(p => p.status === 'completed'));
                const isPendingConfirmation = !isCompleted && (trip.status === 'pending_passenger_confirmation' || ((trip.status === 'in_transit' || trip.is_live) && activePartners.length > 0 && undeliveredPartners.length === 0));
                const isCancelled = trip.status === 'cancelled' || trip.status === 'cancelled_by_driver';
                const isTripLive = !isCompleted && !isPendingConfirmation && !isCancelled && Boolean(trip.is_live || trip.status === 'in_transit' || activeLiveTripId === trip.id);
                const hasLinkedReturnTrip = trip.is_return_leg ||
                  Boolean(trip.has_return_leg) ||
                  Boolean(trip.return_trip_id) ||
                  myTrips.some(t =>
                    t.id !== trip.id &&
                    (t.return_trip_id === trip.id || (t.is_return_leg && (
                      (t.from === trip.to && t.to === trip.from) ||
                      (t.from_loc && trip.to_loc && t.from_loc.split(',')[0].trim().toLowerCase() === trip.to_loc.split(',')[0].trim().toLowerCase())
                    ))) &&
                    t.status !== 'cancelled' &&
                    t.status !== 'cancelled_by_driver'
                  );

                const isTopCompleted = isCompleted && idx === 0 && tripFilter === 'completed';
                const usedPct = trip.space_used_percentage !== undefined ? trip.space_used_percentage : (trip.pct || 0);
                const freeKg = trip.available_space_kg !== undefined ? trip.available_space_kg : Math.max(0, (trip.total_kg || 1000) - (trip.total_booked_kg || 0));

                const linkedOutbound = trip.return_trip_id ? myTrips.find(t => t.id === trip.return_trip_id) : null;
                const isOutboundCompleted = linkedOutbound && (
                  linkedOutbound.status === 'completed' ||
                  linkedOutbound.status === 'pending_passenger_confirmation' ||
                  ['confirmed', 'return_enabled', 'return_started', 'completed'].includes(linkedOutbound.goods_area_status) ||
                  (linkedOutbound.partners && linkedOutbound.partners.length > 0 && linkedOutbound.partners.every(p => p.status === 'completed'))
                );
                const isReturnLocked = trip.is_return_leg && !isOutboundCompleted && (trip.can_start_trip === false || (trip.return_trip_id && !['confirmed', 'return_enabled', 'return_started', 'completed'].includes(linkedOutbound?.goods_area_status)));

                return (
                  <div
                    key={trip.id}
                    className={`rounded-2xl border p-5 transition-all shadow-sm flex flex-col justify-between ${isTopCompleted
                        ? 'bg-gradient-to-br from-emerald-50/90 via-cream to-white border-emerald-400 shadow-md ring-2 ring-emerald-500/30'
                        : isTripLive
                          ? 'bg-green-50/80 border-green-400 shadow-md ring-1 ring-green-400/50'
                          : isPendingConfirmation
                            ? 'bg-amber-50/80 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                            : isCompleted
                              ? 'bg-emerald-50/50 border-emerald-300'
                              : isCancelled
                                ? 'bg-red-50/40 border-red-200 opacity-75'
                                : 'bg-paper border-gold/30 hover:border-gold'
                      }`}
                  >
                    <div>
                      {/* CARD TOP ROW */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-display font-bold text-lg text-green-deep flex items-center gap-1.5">
                              <span>{trip.from_loc || trip.from}</span>
                              <span className="text-gold">→</span>
                              <span>{trip.to_loc || trip.to}</span>
                            </p>
                            {trip.is_return_leg && (
                              <span className="text-[10px] bg-indigo-700 text-white font-bold px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                                <span>🔄</span>
                                <span>Return Backhaul ({trip.return_discount_pct || 20}% OFF)</span>
                              </span>
                            )}
                            {isTopCompleted && (
                              <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full shadow-2xs">
                                ✨ Latest Run
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-green-soft font-mono mt-0.5">
                            📅 {trip.date} · 🚛 {trip.vehicle} · ⚖ Max {trip.total_kg || trip.totalKg} kg
                          </p>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 flex items-center gap-1 ${isTripLive
                            ? 'bg-green-600 text-white animate-pulse'
                            : isPendingConfirmation
                              ? 'bg-amber-500 text-white animate-pulse'
                              : isTopCompleted
                                ? 'bg-emerald-700 text-white shadow-2xs'
                                : isCompleted
                                  ? 'bg-emerald-600 text-white'
                                  : isCancelled
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-200 text-gray-700'
                          }`}>
                          {isTripLive
                            ? '🔴 IN-TRANSIT'
                            : isPendingConfirmation
                              ? '⏳ WAITING CONFIRMATION'
                              : isTopCompleted
                                ? '✨ LATEST COMPLETED'
                                : isCompleted
                                  ? '✓ COMPLETED'
                                  : isCancelled
                                    ? '✖ CANCELLED'
                                    : (trip.status || 'SCHEDULED').toUpperCase()
                          }
                        </span>
                      </div>

                      {/* LOAD CAPACITY BAR */}
                      <div className="bg-cream rounded-xl border border-gold/20 p-3 mb-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-green-deep mb-1.5">
                          <span>📦 Space Used: {usedPct}% ({trip.total_booked_kg || 0} kg)</span>
                          <span className={freeKg <= 0 ? 'text-red-600 font-bold' : 'text-green-700 font-bold'}>
                            {freeKg <= 0 ? '❌ Full' : `✔ ${freeKg} kg free`}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${usedPct >= 90
                                ? 'bg-red-500'
                                : usedPct >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-green-600'
                              }`}
                            style={{ width: `${Math.min(100, Math.max(0, usedPct))}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* STATS ROW */}
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="rounded-xl bg-gold/10 border border-gold/25 p-2.5">
                          <p className="text-[10.5px] font-mono text-green-soft uppercase">Total Load Fare</p>
                          <p className="font-display font-bold text-base text-green-deep mt-0.5">
                            ₹{(trip.total_driver_amount || trip.totalDriverAmount || (trip.price_per_kg * trip.total_kg) || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="rounded-xl bg-cream border border-gold/20 p-2.5">
                          <p className="text-[10.5px] font-mono text-green-soft uppercase">Workload Pool</p>
                          <p className="font-display font-bold text-base text-soil mt-0.5">
                            {trip.total_kg_km || 0} <span className="text-[10px] font-normal text-green-soft">kg·km</span>
                          </p>
                        </div>
                      </div>

                      {trip.pickup && (
                        <p className="text-xs text-green-soft flex items-start gap-1.5 mb-2">
                          <MapPin size={14} className="text-brick shrink-0 mt-0.5" />
                          <span className="truncate"><strong>Pickup:</strong> {trip.pickup}</span>
                        </p>
                      )}

                      {/* GROUND LOGISTICS, SECURITY SEALS & WEIGHBRIDGE STATUS */}
                      <div className="bg-gradient-to-r from-sky-50/90 via-cream to-slate-50 border border-sky-300/80 rounded-xl p-3 mb-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {trip.cargo_category === 'Dedicated / Isolated Cargo' ? (
                              <span className="bg-purple-700 text-white font-bold px-2.5 py-0.5 rounded-full text-[10.5px] flex items-center gap-1 shadow-2xs">
                                <span>🔒 Dedicated Private:</span>
                                <span>{trip.dedicated_sub_category || 'Exclusive Cargo'}</span>
                              </span>
                            ) : trip.cargo_category === 'Perishable Goods' ? (
                              <span className="bg-cyan-700 text-white font-bold px-2.5 py-0.5 rounded-full text-[10.5px] flex items-center gap-1 shadow-2xs">
                                <span>❄️ Perishable:</span>
                                <span>{trip.cooling_type || 'Cold-Chain Monitored'}</span>
                              </span>
                            ) : (
                              <span className="bg-emerald-700 text-white font-bold px-2.5 py-0.5 rounded-full text-[10.5px] flex items-center gap-1 shadow-2xs">
                                <span>📦 General Shared Cargo Space</span>
                              </span>
                            )}

                            {((trip.cargo_category === 'Perishable Goods' && trip.ice_handling_supported) || (trip.partners && trip.partners.some(p => p.ice_handling_required))) && (
                              <span className="bg-sky-600 text-white font-semibold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
                                {trip.cargo_category === 'Perishable Goods' ? '🧊 Ice Support Active' : '🧊 On-Demand Ice (1 Shipper)'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* SECURITY SEAL & WEIGHBRIDGE TELEMETRY */}
                        <div className="pt-2 border-t border-sky-200/60 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-700">🔐 Security Seal:</span>
                            {trip.seal_number ? (
                              <span className={`font-mono font-bold px-2 py-0.5 rounded-md border text-[10.5px] ${
                                trip.seal_status === 'tampered_broken'
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : trip.seal_status === 'verified_intact'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-blue-100 text-blue-800 border-blue-300'
                              }`}>
                                #{trip.seal_number} ({trip.seal_status ? trip.seal_status.replace('_', ' ').toUpperCase() : 'APPLIED'})
                              </span>
                            ) : (
                              <span className="text-amber-800 italic bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                                Awaiting Checkpoint Seal
                              </span>
                            )}
                          </div>

                          {trip.last_weigh_in_kg && (
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-700">⚖ Scale Weigh-in:</span>
                              <span className="font-mono font-bold text-green-deep">{trip.last_weigh_in_kg} kg</span>
                              {trip.weight_compliant === false ? (
                                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                                  ⚠️ Discrepancy Flagged
                                </span>
                              ) : trip.weight_compliant === true ? (
                                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                                  ✅ Scale Compliant
                                </span>
                              ) : null}
                            </div>
                          )}

                          {trip.current_checkpoint && (
                            <div className="w-full text-slate-600 font-mono text-[10.5px] flex items-center gap-1 mt-0.5">
                              <span>🚩</span>
                              <span>Last Verified Checkpoint: <strong>{trip.current_checkpoint}</strong> ({trip.checkpoint_count || 1} inspection logs recorded)</span>
                            </div>
                          )}

                          {/* Next Inspection Point Banner */}
                          <div className="w-full bg-amber-50/90 border border-amber-300 p-2.5 rounded-xl my-2 text-xs flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold text-amber-950">
                              <span>🛑</span>
                              <span>Next Inspection Halt:</span>
                              <span className="font-mono text-amber-900 bg-white/80 px-2 py-0.5 rounded border border-amber-200">
                                {trip.next_inspection_point || (trip.inspections_remaining === 0 ? '✔ All Checkpoints Done' : 'Highway Inspection Station')}
                              </span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              {trip.inspections_remaining !== undefined ? `${trip.inspections_remaining} Checkpoints Left` : 'Checkup Required'}
                            </span>
                          </div>

                          {/* View Route & Radar Map Button */}
                          <button
                            type="button"
                            onClick={() => setDriverMapModal({ isOpen: true, trip })}
                            className="w-full my-1.5 py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>🗺️</span>
                            <span>View Route & Checkpoint Radar Map</span>
                          </button>
                        </div>
                      </div>

                      {/* CONNECTED ACCEPTED PASSENGERS / CARGO */}
                      {trip.partners && trip.partners.length > 0 && (
                        <div className="bg-emerald-50/80 border border-emerald-300/80 rounded-xl p-2.5 mb-3">
                          <p className="text-[11px] font-bold text-emerald-900 flex items-center justify-between mb-1.5">
                            <span>📦 Cargo Shippers on Route ({trip.partners.length})</span>
                            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-mono font-semibold">
                              {isTripLive
                                ? `${trip.partners.filter(p => ['accepted', 'in_transit', 'pending'].includes(p.status)).length} In-Transit`
                                : `${trip.partners.filter(p => ['accepted', 'in_transit', 'pending'].includes(p.status)).length} Booked`}
                            </span>
                          </p>
                          <div className="space-y-1.5">
                            {trip.partners.map(p => {
                              const incReq = incomingRequests.find(r => r.id === p.id);
                              const isPartnerPendingConf = p.status === 'pending_passenger_confirmation';
                              const isPartnerCompleted = p.status === 'completed';
                              const isUnloadVerified = (p.loading_status === 'unloaded') || (incReq?.loading_status === 'unloaded') || p.is_unload_verified;
                              const canDeliver = isTripLive && ['accepted', 'in_transit', 'pending'].includes(p.status) && isUnloadVerified;
                              const isWaitingUnload = isTripLive && ['accepted', 'in_transit', 'pending'].includes(p.status) && !isUnloadVerified;
                              const isAcceptedWaitingStart = !isTripLive && ['accepted', 'in_transit', 'pending'].includes(p.status);

                              return (
                                <div key={p.id} className="text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between bg-white/90 p-2 rounded-xl border border-emerald-200 shadow-2xs gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-emerald-700 font-bold truncate">👤 {p.farmer_name}</span>
                                    <span className="font-mono text-[11px] font-semibold text-emerald-900 shrink-0">{p.goods_weight_kg} kg</span>
                                    <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                                      isPartnerCompleted
                                        ? 'bg-emerald-600 text-white'
                                        : isPartnerPendingConf
                                          ? 'bg-amber-500 text-white animate-pulse'
                                          : isWaitingUnload
                                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                            : isAcceptedWaitingStart
                                              ? 'bg-blue-100 text-blue-800'
                                              : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {isPartnerPendingConf ? 'Waiting Rating' : isPartnerCompleted ? 'Delivered' : isWaitingUnload ? 'Awaiting Unload' : isAcceptedWaitingStart ? 'Accepted' : p.status}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                                    {isAcceptedWaitingStart && (
                                      <span className="text-[10px] text-green-soft font-semibold italic flex items-center gap-1">
                                        <span>⏳</span>
                                        <span>Start trip to deliver</span>
                                      </span>
                                    )}

                                    {isWaitingUnload && (
                                      <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs" title="Logistics Ground Desk must supervise and verify cargo unloading in Logistics Portal before drop-off">
                                        <span>⏳</span>
                                        <span>Unload Verification Pending</span>
                                      </span>
                                    )}

                                    {canDeliver && (
                                      <button
                                        onClick={() => {
                                          const fullReq = incomingRequests.find(r => r.id === p.id) || {
                                            id: p.id,
                                            farmer_name: p.farmer_name,
                                            goods_weight_kg: p.goods_weight_kg,
                                            loading_status: p.loading_status || incReq?.loading_status,
                                            route: p.route || `${trip.from_loc || trip.from} → ${trip.to_loc || trip.to}`,
                                            pickup_place: p.pickup_place
                                          };
                                          setDeliverModal({
                                            isOpen: true,
                                            req: fullReq,
                                            proofUrl: null,
                                            uploading: false
                                          });
                                        }}
                                        className="px-2.5 py-1 bg-green-deep hover:bg-green text-cream font-bold text-[10.5px] rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer animate-pulse"
                                        title={`Deliver ${p.farmer_name}'s cargo with drop-off proof photo`}
                                      >
                                        <span>📸</span>
                                        <span>Deliver Cargo</span>
                                      </button>
                                    )}

                                    {p.delivery_proof_image_url && (
                                      <a
                                        href={`${API_BASE}${p.delivery_proof_image_url}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-7 h-7 rounded-lg overflow-hidden border border-emerald-400 shrink-0 block hover:opacity-80 shadow-2xs"
                                        title="View Drop-off Photo Proof for this shipper"
                                      >
                                        <img src={`${API_BASE}${p.delivery_proof_image_url}`} alt="Proof" className="w-full h-full object-cover" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleViewOptimalItinerary(trip)}
                            className="w-full mt-2.5 py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>🗺️</span>
                            <span>Optimal Multi-Stop Stop Sequence & Payload</span>
                          </button>
                        </div>
                      )}

                      {/* STANDALONE DRIVER DELIVERY PROOF PHOTO PREVIEW (Only for non-pooled trips without partners list) */}
                      {trip.delivery_proof_image_url && (!trip.partners || trip.partners.length === 0) && (
                        <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 p-3 shadow-xs mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                              <span>📸</span>
                              <span>Stage 2 Delivery Photo Proof</span>
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                              <span>✔</span>
                              <span>Uploaded at Destination</span>
                            </span>
                          </div>
                          <a
                            href={`${API_BASE}${trip.delivery_proof_image_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-xl overflow-hidden border-2 border-white shadow group relative max-h-44 bg-slate-900"
                          >
                            <img
                              src={`${API_BASE}${trip.delivery_proof_image_url}`}
                              alt="Delivery Proof Photo"
                              className="w-full h-36 object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-semibold text-xs gap-1.5">
                              <span>🔍 Click to View Full Resolution Photo</span>
                            </div>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* CARD ACTIONS AREA */}
                    <div className="pt-3 border-t border-gold/20 mt-2 space-y-2">
                      {isCompleted ? (
                        <div className="w-full bg-emerald-100/80 border border-emerald-300 p-2.5 rounded-xl">
                          <div className="text-xs text-emerald-900 font-bold flex items-center justify-between">
                            <span>✔ Ride Completed & All Shippers Confirmed!</span>
                            <span className="text-sm">🎉</span>
                          </div>
                          <p className="text-[11px] text-emerald-800 mt-0.5">
                            All active booked senders have confirmed delivery and submitted ratings.
                          </p>
                        </div>
                      ) : isPendingConfirmation ? (
                        <div className="w-full space-y-1.5 bg-amber-50/90 border border-amber-300 p-3 rounded-2xl">
                          <div className="text-xs text-amber-950 font-bold flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <span>⏳</span>
                              <span>All Drop-offs Delivered ({activePartners.length > 0 ? activePartners.length : 'All'} Shippers)</span>
                            </span>
                            <span className="text-[10px] bg-amber-600 text-white px-2.5 py-0.5 rounded-full font-mono font-semibold animate-pulse">
                              Waiting Ratings
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-900 leading-relaxed">
                            Verified drop-off photos were dispatched to all recipients via WhatsApp. Waiting for passengers to verify and rate in their apps.
                          </p>
                        </div>
                      ) : isCancelled ? (
                        <div className="w-full text-xs text-red-700 bg-red-100/70 border border-red-200 p-2 rounded-xl font-semibold">
                          ✖ This trip was cancelled.
                        </div>
                      ) : !isTripLive ? (
                        <div className="space-y-2">
                          {isReturnLocked ? (
                            <div className="space-y-2">
                              <div className="rounded-xl bg-amber-50 border border-amber-300 p-2.5 text-xs text-amber-900 flex items-start gap-2">
                                <span className="text-base shrink-0">🔒</span>
                                <div>
                                  <p className="font-bold text-amber-950 text-xs">Return Leg Start Locked</p>
                                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                                    {trip.start_lock_reason || "Return trip is locked until the primary outbound journey reaches the Goods Area and confirms arrival."}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2 w-full flex-wrap">
                                <button
                                  disabled
                                  className="flex-1 min-w-[140px] py-2.5 bg-gray-100 text-gray-400 font-semibold text-xs rounded-xl border border-gray-300 flex items-center justify-center gap-1.5 cursor-not-allowed select-none opacity-80"
                                  title={trip.start_lock_reason || "Outbound run must reach & confirm Goods Area first to unlock"}
                                >
                                  <span>🔒</span>
                                  <span>Outbound Goods Area Pending</span>
                                </button>
                                {(trip.status === 'scheduled' || trip.status === 'pending' || !trip.status) && (
                                  <button
                                    onClick={() => cancelTrip(trip.id)}
                                    className="px-3.5 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                                    title="Cancel this scheduled trip"
                                  >
                                    <X size={15} />
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (trip.can_start_trip === false || trip.is_load_verified === false || (trip.unverified_cargo_count && trip.unverified_cargo_count > 0)) ? (
                            <div className="space-y-2">
                              <div className="rounded-xl bg-amber-50 border border-amber-300 p-2.5 text-xs text-amber-900 flex items-start gap-2">
                                <span className="text-base shrink-0">🔒</span>
                                <div>
                                  <p className="font-bold text-amber-950 text-xs">Trip Start Locked · Load Verification Pending</p>
                                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                                    {trip.start_lock_reason || "Assigned cargo must be verified, weighed, and sealed by the ground logistics officer at pickup before departure."}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2 w-full flex-wrap">
                                <button
                                  disabled
                                  className="flex-1 min-w-[140px] py-2.5 bg-amber-50 text-amber-800 font-semibold text-xs rounded-xl border border-amber-300 flex items-center justify-center gap-1.5 cursor-not-allowed select-none opacity-90 shadow-2xs"
                                  title={trip.start_lock_reason || "Cargo load must be verified in logistics portal before departure"}
                                >
                                  <Lock size={15} className="text-amber-600" />
                                  <span>Load Verification Pending</span>
                                </button>
                                {(trip.status === 'scheduled' || trip.status === 'pending' || !trip.status) && (
                                  <button
                                    onClick={() => cancelTrip(trip.id)}
                                    className="px-3.5 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                                    title="Cancel this scheduled trip"
                                  >
                                    <X size={15} />
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2 w-full flex-wrap">
                              <button
                                onClick={() => startLiveTrip(trip)}
                                className="flex-1 min-w-[140px] py-2.5 bg-green-deep hover:bg-green text-cream font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                                title="Start this trip and begin live GPS broadcasting"
                              >
                                <Play size={15} className="fill-current" />
                                <span>Start Trip</span>
                              </button>
                              {(trip.status === 'scheduled' || trip.status === 'pending' || !trip.status) && (
                                <button
                                  onClick={() => cancelTrip(trip.id)}
                                  className="px-3.5 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                                  title="Cancel this scheduled trip"
                                >
                                  <X size={15} />
                                  Cancel
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full space-y-2">
                          <div className="text-xs text-green-900 font-semibold bg-green-100 border border-green-300 p-2.5 rounded-xl flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-bold">
                              <span>📡</span>
                              <span>Live GPS Broadcasting Active</span>
                            </span>
                            <span className="w-2.5 h-2.5 rounded-full bg-green-600 animate-ping"></span>
                          </div>
                          <button
                            onClick={() => {
                              const trackingUrl = `${window.location.origin}/#maps`;
                              navigator.clipboard?.writeText?.(trackingUrl);
                              notify("✔ Live GPS Tracking Link copied! Share with your cargo senders.");
                            }}
                            className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                            title="Copy and share live GPS radar tracking link with cargo senders"
                          >
                            <Share2 size={14} className="text-emerald-700" />
                            <span>Share Live GPS Tracking Link</span>
                          </button>
                          {/* SEQUENCED GOODS AREA CONFIRMATION (OUTBOUND RUN) */}
                          {!trip.is_return_leg && (
                            <div className="pt-1">
                              {trip.goods_area_status === 'confirmed' || trip.goods_area_status === 'return_enabled' || trip.goods_area_status === 'return_started' ? (
                                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center justify-between font-semibold shadow-2xs">
                                  <span className="flex items-center gap-1.5">
                                    <span>✔</span>
                                    <span>Goods Area Arrival Confirmed</span>
                                  </span>
                                  <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                                    Return Unlocked
                                  </span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const token = localStorage.getItem("access_token");
                                      const res = await fetch(`${API_BASE}/api/trips/${trip.id}/goods-area/confirm`, {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${token}` }
                                      });
                                      if (res.ok) {
                                        notify("✔ Goods Area arrival confirmed! Return backhaul is now enabled.");
                                        fetchMyTrips();
                                      } else {
                                        const err = await res.json().catch(() => ({}));
                                        notify(err.detail || "Could not confirm Goods Area arrival.");
                                      }
                                    } catch (e) {
                                      notify("Connection error confirming Goods Area arrival.");
                                    }
                                  }}
                                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <span>📍</span>
                                  <span>Mark / Confirm Reached Goods Area</span>
                                </button>
                              )}
                            </div>
                          )}

                          {undeliveredPartners.length > 0 ? (
                            <div className="space-y-1.5">
                              {undeliveredPartners.some(p => {
                                const inc = incomingRequests.find(r => r.id === p.id);
                                const lStatus = p.loading_status || inc?.loading_status || 'pending';
                                return lStatus !== 'unloaded';
                              }) && (
                                <div className="p-2 bg-amber-50 border border-amber-300 rounded-xl text-center shadow-2xs">
                                  <p className="text-[11px] text-amber-900 font-semibold flex items-center justify-center gap-1.5">
                                    <span>⏳</span>
                                    <span>Unload Verification Pending: Cargo unload must be verified by ground logistics before delivery can be completed.</span>
                                  </p>
                                </div>
                              )}
                              <p className="text-[11px] text-green-soft text-center italic">
                                Deliver each cargo at its respective drop-off hub above using the "📸 Deliver Cargo" button once unloaded.
                              </p>
                            </div>
                          ) : activePartners.length > 0 ? (
                            <button
                              onClick={() => driverCompleteTrip(trip.id)}
                              className="w-full py-2.5 bg-green-deep hover:bg-green text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>🏁</span>
                              <span>Complete Ride & Request Passenger Confirmation</span>
                            </button>
                          ) : (
                            <div className="space-y-1.5">
                              <div className="p-2.5 bg-gold/10 border border-gold/30 rounded-xl text-center">
                                <p className="text-xs text-soil font-semibold">
                                  ⏳ No cargo booked yet. Senders can book while you drive.
                                </p>
                              </div>
                              <button
                                onClick={() => handleEndEmptyTrip(trip.id)}
                                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                                title="End this empty journey"
                              >
                                <span>🛑</span>
                                <span>End Empty Run</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* QUICK OFFER RETURN BACKHAUL ACTION - ONLY SHOWN IF NO RETURN TRIP HAS BEEN PUBLISHED YET */}
                      {!hasLinkedReturnTrip && !trip.is_return_leg && trip.status !== 'cancelled' && trip.status !== 'cancelled_by_driver' && (
                        <button
                          onClick={() => handleCreateReturnTrip(trip)}
                          className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 hover:border-indigo-400 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                          title="Offer return backhaul run for this route with 20% discount"
                        >
                          <span>🔄</span>
                          <span>Offer Return Backhaul Run ({trip.to_loc?.split(',')[0] || trip.to} → {trip.from_loc?.split(',')[0] || trip.from} · 20% OFF)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-paper border border-dashed border-gold/40 rounded-3xl p-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-cream mx-auto flex items-center justify-center text-3xl">
                🚛
              </div>
              <h4 className="font-display font-bold text-lg text-green-deep">
                No trips found in this category
              </h4>
              <p className="text-xs text-green-soft max-w-md mx-auto">
                {tripFilter === 'active'
                  ? "You have no active published trips right now. Share your vehicle's available space to start earning."
                  : tripFilter === 'all'
                    ? "You haven't published any trips yet. Share your vehicle's available space and start earning."
                    : `There are currently no trips matching the "${tripFilter}" filter.`}
              </p>
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                <button
                  onClick={() => setActiveTab('publish')}
                  className="px-5 py-2.5 bg-green-deep hover:bg-green text-cream font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>➕</span>
                  <span>Publish a New Trip</span>
                </button>
                {tripFilter === 'active' && completedTripsCount > 0 && (
                  <button
                    onClick={() => setTripFilter('completed')}
                    className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-semibold text-xs rounded-xl transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>🏆</span>
                    <span>View {completedTripsCount} Completed Run{completedTripsCount !== 1 ? 's' : ''} Archive</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
         TAB 2: INCOMING TRANSPORT REQUESTS
      ========================================================= */}
      {activeTab === 'requests' && (
        <div className="space-y-5 animate-[fadeIn_0.25s_ease]">
          {/* FILTER CONTROLS & HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-paper border border-gold/30 rounded-2xl p-4 shadow-sm">
            <div>
              <h3 className="font-display font-bold text-lg text-green-deep flex items-center gap-2">
                <Package size={20} className="text-green-deep" />
                Incoming Passenger Requests ({incomingRequests.length})
              </h3>
              <p className="text-xs text-green-soft mt-0.5">
                Review cargo booking requests, accept shipments, and see dynamic weight-based shares.
              </p>
            </div>

            {/* FILTER PILLS */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                ['all', `All (${incomingRequests.length})`],
                ['pending', `Pending (${pendingRequestsCount})`],
                ['accepted', `Accepted (${incomingRequests.filter(r => r.status === 'accepted').length})`],
                ['completed', `Completed (${incomingRequests.filter(r => r.status === 'completed' || r.status === 'pending_passenger_confirmation').length})`]
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setRequestFilter(key)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${requestFilter === key
                      ? 'bg-green-deep text-cream shadow-sm'
                      : 'bg-cream text-green-soft hover:bg-gold/10 border border-gold/20'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* REQUESTS CARD GRID */}
          {filteredRequests.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">
              {filteredRequests.map(req => {
                const isPending = req.status === 'pending';
                const isAccepted = req.status === 'accepted';
                const isWaitingConf = req.status === 'pending_passenger_confirmation';
                const isCompleted = req.status === 'completed';
                const isCancelled = req.status === 'cancelled_by_driver' || req.status === 'cancelled';

                const linkedTrip = myTrips.find(t => (req.trip_id && t.id === req.trip_id) || (t.partners && t.partners.some(p => p.id === req.id)));
                const isLinkedTripLive = Boolean(linkedTrip && (linkedTrip.is_live || linkedTrip.status === 'in_transit' || activeLiveTripId === linkedTrip.id));

                return (
                  <div
                    key={req.id}
                    className={`rounded-2xl border p-5 transition-all shadow-sm flex flex-col justify-between ${isPending
                        ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300/40'
                        : isAccepted
                          ? 'bg-green-50/60 border-green-300'
                          : isCompleted
                            ? 'bg-emerald-50/50 border-emerald-300'
                            : isCancelled
                              ? 'bg-red-50/40 border-red-200 opacity-75'
                              : 'bg-paper border-gold/30'
                      }`}
                  >
                    <div>
                      {/* HEADER ROW */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-display font-bold text-base text-green-deep">
                            {req.route || 'Trip Route'}
                          </p>
                          <p className="text-xs text-green-soft mt-0.5">
                            👤 <strong>{req.farmer_name}</strong> · 🚚 {req.vehicle || 'Vehicle'}
                          </p>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${isPending
                            ? 'bg-amber-500 text-white animate-pulse'
                            : isAccepted
                              ? (isLinkedTripLive ? 'bg-green-600 text-white animate-pulse' : 'bg-blue-600 text-white')
                              : isWaitingConf
                                ? 'bg-amber-600 text-white animate-pulse'
                                : isCompleted
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-red-500 text-white'
                          }`}>
                          {isWaitingConf
                            ? 'WAITING PASSENGER CONF.'
                            : isAccepted
                              ? (isLinkedTripLive ? '🟢 IN-TRANSIT' : '✔ ACCEPTED (SCHEDULED)')
                              : (req.status ? req.status.toUpperCase() : 'PENDING')
                          }
                        </span>
                      </div>

                      {/* SPECS & LOCATIONS */}
                      <div className="bg-cream rounded-xl border border-gold/20 p-3 space-y-1.5 text-xs mb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-green-soft">⚖ Cargo Weight:</span>
                          <span className="font-bold text-green-deep">{req.goods_weight_kg || req.kg} kg</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-green-soft">🛣 Travel Distance:</span>
                          <span className="font-bold text-green-deep">{req.distance_km || 150} km</span>
                        </div>
                        {req.pickup_place && (
                          <div className="flex justify-between items-start pt-1 border-t border-gold/15">
                            <span className="text-green-soft shrink-0">📍 Pickup:</span>
                            <span className="font-medium text-green-deep text-right truncate max-w-[200px]">{req.pickup_place}</span>
                          </div>
                        )}
                      </div>

                      {/* SHIPPER VERIFIED CARGO PHOTO */}
                      {req.pickup_cargo_image_url && (
                        <div className="rounded-xl bg-gold/10 border border-gold/30 p-2.5 mb-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <a
                              href={`${API_BASE}${req.pickup_cargo_image_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-12 h-12 rounded-xl overflow-hidden border border-gold/40 shrink-0 block hover:opacity-90 shadow-2xs"
                              title="Click to inspect full cargo photo"
                            >
                              <img
                                src={`${API_BASE}${req.pickup_cargo_image_url}`}
                                alt="Shipper Cargo"
                                className="w-full h-full object-cover"
                              />
                            </a>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-green-deep truncate flex items-center gap-1">
                                <span>📸 Verified Cargo Proof</span>
                              </p>
                              <p className="text-[11px] text-green-soft">Shipper goods authenticated</p>
                            </div>
                          </div>
                          <a
                            href={`${API_BASE}${req.pickup_cargo_image_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-white hover:bg-gold/10 text-green-deep font-semibold text-[11px] rounded-lg border border-gold/30 shrink-0 transition shadow-2xs"
                          >
                            View 🔍
                          </a>
                        </div>
                      )}

                      {/* TON-KM DYNAMIC SHARE HIGHLIGHT */}
                      <div className="rounded-xl bg-gold/10 border border-gold/30 p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-green-deep">Fair Ton-Km Share:</span>
                          <span className="font-display font-bold text-lg text-green-deep">
                            ₹{(req.per_person_share || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-green-soft mt-0.5">
                          Workload: {req.kg_km || ((req.goods_weight_kg || req.kg || 0) * (req.distance_km || 150))} kg·km ({req.share_pct || 100}% of pool)
                        </p>
                      </div>

                      {/* COMPLETED RATING DISPLAY */}
                      {req.rating && (
                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs mb-3">
                          <p className="font-bold text-amber-800">
                            ⭐ Passenger Rating: {req.rating}/5
                          </p>
                          {req.feedback && (
                            <p className="text-amber-900 mt-0.5 italic text-[11px]">
                              "{req.feedback}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ACTIONS */}
                    <div className="pt-3 border-t border-gold/20 mt-2">
                      {isPending && (
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              const token = localStorage.getItem("access_token");
                              const activeLang = typeof localStorage !== 'undefined' ? localStorage.getItem("ss_lang") || lang || "hi" : lang || "hi";
                              try {
                                const res = await fetch(
                                  `${API_BASE}/api/requests/${req.id}/status?status=accepted&lang=${encodeURIComponent(activeLang)}`,
                                  {
                                    method: "PUT",
                                    headers: { "Authorization": `Bearer ${token}` }
                                  }
                                );
                                if (res.ok) {
                                  notify(`✔ Accepted request from ${req.farmer_name}`);
                                  const reqRes = await fetch(
                                    `${API_BASE}/api/requests/incoming`,
                                    { headers: { "Authorization": `Bearer ${token}` } }
                                  );
                                  const reqData = await reqRes.json();
                                  if (reqRes.ok && Array.isArray(reqData)) setIncomingRequests(reqData);
                                  fetchMyTrips();
                                } else {
                                  notify("⚠ Failed to accept request.");
                                }
                              } catch (err) {
                                notify("Could not connect to backend.");
                              }
                            }}
                            className="flex-1 py-2 bg-green-deep hover:bg-green text-cream font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer"
                          >
                            Accept Request
                          </button>
                          <button
                            onClick={async () => {
                              const token = localStorage.getItem("access_token");
                              const activeLang = typeof localStorage !== 'undefined' ? localStorage.getItem("ss_lang") || lang || "hi" : lang || "hi";
                              try {
                                const res = await fetch(
                                  `${API_BASE}/api/requests/${req.id}/status?status=cancelled_by_driver&reason=${encodeURIComponent("The driver has rejected this request.")}&lang=${encodeURIComponent(activeLang)}`,
                                  {
                                    method: "PUT",
                                    headers: { "Authorization": `Bearer ${token}` }
                                  }
                                );
                                if (res.ok) {
                                  notify(`✖ Rejected request from ${req.farmer_name}`);
                                  const reqRes = await fetch(
                                    `${API_BASE}/api/requests/incoming`,
                                    { headers: { "Authorization": `Bearer ${token}` } }
                                  );
                                  const reqData = await reqRes.json();
                                  if (reqRes.ok && Array.isArray(reqData)) setIncomingRequests(reqData);
                                  fetchMyTrips();
                                } else {
                                  notify("⚠ Failed to reject request.");
                                }
                              } catch (err) {
                                notify("Could not connect to backend.");
                              }
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {isAccepted && (
                        <div className="space-y-2">
                          {isLinkedTripLive ? (
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <button
                                onClick={() => {
                                  setDeliverModal({
                                    isOpen: true,
                                    req: req,
                                    proofUrl: null,
                                    uploading: false
                                  });
                                }}
                                className="flex-1 py-2.5 bg-green-deep hover:bg-green text-cream font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                              >
                                <span>📸</span>
                                <span>Deliver Cargo & Upload Drop-off Proof</span>
                              </button>
                              <button
                                onClick={async () => {
                                  if (!window.confirm(`Are you sure you want to cancel the accepted ride for ${req.farmer_name}?`)) return;
                                  const token = localStorage.getItem("access_token");
                                  try {
                                    const res = await fetch(
                                      `${API_BASE}/api/requests/${req.id}/status?status=cancelled_by_driver&reason=${encodeURIComponent("The driver has cancelled this ride.")}`,
                                      {
                                        method: "PUT",
                                        headers: { "Authorization": `Bearer ${token}` }
                                      }
                                    );
                                    if (res.ok) {
                                      notify(`✖ Cancelled ride for ${req.farmer_name}. Passenger notified.`);
                                      const reqRes = await fetch(
                                        `${API_BASE}/api/requests/incoming`,
                                        { headers: { "Authorization": `Bearer ${token}` } }
                                      );
                                      const reqData = await reqRes.json();
                                      if (reqRes.ok && Array.isArray(reqData)) setIncomingRequests(reqData);
                                      fetchMyTrips();
                                    } else {
                                      notify("⚠ Failed to cancel request.");
                                    }
                                  } catch (err) {
                                    notify("Could not connect to backend.");
                                  }
                                }}
                                className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                                title="Cancel this cargo booking"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-xl text-xs space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2">
                                  <span className="text-base">🕒</span>
                                  <div>
                                    <p className="font-bold text-blue-950">Trip Scheduled (Waiting Departure)</p>
                                    <p className="text-[11px] text-blue-800">
                                      You accepted this cargo. Drop-off delivery unlocks once you start the trip and share live GPS.
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setActiveTab('trips');
                                    setTripFilter('all');
                                  }}
                                  className="px-3 py-1.5 bg-green-deep hover:bg-green text-cream font-bold text-xs rounded-xl shadow-xs transition shrink-0 cursor-pointer flex items-center gap-1"
                                >
                                  <span>🚀</span>
                                  <span>Go to Trips</span>
                                </button>
                              </div>
                              <div className="pt-1.5 border-t border-blue-200/60 flex justify-end">
                                <button
                                  onClick={async () => {
                                    if (!window.confirm(`Are you sure you want to cancel the accepted booking for ${req.farmer_name}?`)) return;
                                    const token = localStorage.getItem("access_token");
                                    try {
                                      const res = await fetch(
                                        `${API_BASE}/api/requests/${req.id}/status?status=cancelled_by_driver&reason=${encodeURIComponent("The driver has cancelled this ride.")}`,
                                        {
                                          method: "PUT",
                                          headers: { "Authorization": `Bearer ${token}` }
                                        }
                                      );
                                      if (res.ok) {
                                        notify(`✖ Cancelled ride for ${req.farmer_name}. Passenger notified.`);
                                        const reqRes = await fetch(
                                          `${API_BASE}/api/requests/incoming`,
                                          { headers: { "Authorization": `Bearer ${token}` } }
                                        );
                                        const reqData = await reqRes.json();
                                        if (reqRes.ok && Array.isArray(reqData)) setIncomingRequests(reqData);
                                        fetchMyTrips();
                                      } else {
                                        notify("⚠ Failed to cancel request.");
                                      }
                                    } catch (err) {
                                      notify("Could not connect to backend.");
                                    }
                                  }}
                                  className="text-[10.5px] text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                                >
                                  Cancel Accepted Booking
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {isWaitingConf && (
                        <div className="space-y-2">
                          <div className="rounded-xl bg-amber-50 border border-amber-300/80 p-2.5 flex items-center justify-between text-xs font-semibold text-amber-950">
                            <span className="flex items-center gap-1.5">
                              <span>⏳</span>
                              <span>Drop-off Photo Sent via WhatsApp (Waiting Star Rating)</span>
                            </span>
                            <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                          </div>
                          {req.delivery_proof_image_url && (
                            <div className="flex items-center justify-between bg-white/90 p-2 rounded-xl border border-amber-200 shadow-2xs gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <a
                                  href={`${API_BASE}${req.delivery_proof_image_url}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-11 h-11 rounded-lg overflow-hidden border border-amber-300 shrink-0 block hover:opacity-90 shadow-2xs"
                                >
                                  <img
                                    src={`${API_BASE}${req.delivery_proof_image_url}`}
                                    alt="Shipper Drop-off Proof"
                                    className="w-full h-full object-cover"
                                  />
                                </a>
                                <div className="min-w-0 text-[11px]">
                                  <p className="font-bold text-amber-950 truncate">Delivered Cargo Photo</p>
                                  <p className="text-amber-800 text-[10.5px] truncate">Delivered specifically to {req.farmer_name}</p>
                                </div>
                              </div>
                              <a
                                href={`${API_BASE}${req.delivery_proof_image_url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10.5px] rounded-lg transition shrink-0"
                              >
                                View 🔍
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {isCompleted && (
                        <p className="text-xs text-emerald-800 font-medium flex items-center gap-1">
                          <span>✔</span>
                          <span>Delivery confirmed and completed.</span>
                        </p>
                      )}

                      {isCancelled && (
                        <p className="text-xs text-red-600 font-medium">
                          ✖ Cancelled.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-paper border border-dashed border-gold/40 rounded-3xl p-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-cream mx-auto flex items-center justify-center text-3xl">
                📦
              </div>
              <h4 className="font-display font-bold text-lg text-green-deep">
                No requests found
              </h4>
              <p className="text-xs text-green-soft max-w-md mx-auto">
                {requestFilter === 'all'
                  ? "You don't have any incoming transport requests right now. When senders request space on your published trips, they will appear here."
                  : `There are currently no requests matching the "${requestFilter}" filter.`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
         TAB 3: OFFER A NEW TRIP FORM & PREVIEW
      ========================================================= */}
      {activeTab === 'publish' && (
        <div className="grid lg:grid-cols-2 gap-8 animate-[fadeIn_0.25s_ease]">
          {/* FORM */}
          <form
            className="flex flex-col gap-5 bg-paper border border-gold/30 rounded-3xl p-6 shadow-sm"
            onSubmit={e => e.preventDefault()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-xl text-green-deep">
                  {t('driver.publish_title', 'Publish a New Vehicle Trip')}
                </h3>
                <p className="text-xs text-green-soft mt-0.5">
                  {t('offer.subtitle', 'Fill in your route, vehicle capacity, and desired price.')}
                </p>
              </div>
              <TTSButton textToRead={`${t('driver.publish_title', 'Publish a New Vehicle Trip')}. ${t('offer.subtitle', 'Fill in your route, vehicle capacity, and desired price.')}`} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t('driver.from', 'From (Origin City/Hub)')}>
                <LocationAutocomplete
                  value={o.from}
                  placeholder={t('form.pickup_placeholder', 'Search starting city/hub in India...')}
                  onChange={val => setO(prev => ({ ...prev, from: val, fromCoords: null }))}
                  onSelectLocation={loc => {
                    if (loc) {
                      setO(prev => ({ ...prev, from: loc.name, fromCoords: { lat: loc.lat, lng: loc.lng } }));
                    } else {
                      setO(prev => ({ ...prev, fromCoords: null }));
                    }
                  }}
                />
              </Field>

              <Field label={t('driver.to', 'To (Destination City)')}>
                <LocationAutocomplete
                  value={o.to}
                  placeholder={t('form.delivery_placeholder', 'Search destination city in India...')}
                  onChange={val => setO(prev => ({ ...prev, to: val, toCoords: null }))}
                  onSelectLocation={loc => {
                    if (loc) {
                      setO(prev => ({ ...prev, to: loc.name, toCoords: { lat: loc.lat, lng: loc.lng } }));
                    } else {
                      setO(prev => ({ ...prev, toCoords: null }));
                    }
                  }}
                />
              </Field>

              <Field label={t('driver.date', 'Travel Date')}>
                <input
                  type="date"
                  className={inputCls}
                  value={o.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setO({ ...o, date: e.target.value })}
                />
              </Field>


              <Field label={t('driver.vehicle', 'Vehicle Type')}>
                <select
                  className={inputCls}
                  value={o.vehicle}
                  onChange={e => {
                    const newVeh = e.target.value;
                    const spec = getVehicleCapacitySpec(newVeh);
                    setO(prev => ({
                      ...prev,
                      vehicle: newVeh,
                      total: spec.defaultKg,
                      cap: spec.defaultKg
                    }));
                  }}
                >
                  {Object.entries(VEHICLE_CAPACITY_SPECS).map(([key, spec]) => {
                    const exceedsDist = routeDistanceKm > 0 && spec.maxDistanceKm !== Infinity && routeDistanceKm > spec.maxDistanceKm;
                    return (
                      <option key={key} value={key} disabled={exceedsDist}>
                        {spec.icon} {spec.displayName || spec.name} {exceedsDist ? `🚫 (Exceeds ${spec.maxDistanceKm}km max range)` : `(Max ${spec.maxKg.toLocaleString('en-IN')}kg · Max ${spec.maxDistanceKm === Infinity ? 'Any dist' : spec.maxDistanceKm + 'km'})`}
                      </option>
                    );
                  })}
                </select>
              </Field>
            </div>

            {/* CAPACITY RESTRICTIONS & SLIDERS */}
            <div className="bg-cream rounded-2xl border border-gold/30 p-4 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-sm font-semibold text-green-deep block">
                  {t('driver.total_kg', 'Vehicle Cargo Capacity')}: <span className="font-mono text-soil font-bold">{o.cap} kg {t('card.space_free', 'free')}</span> / {o.total} kg total
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-green-deep/10 text-green-deep border border-gold/30">
                  <span>{currentVehSpec.icon}</span>
                  <span>Limit: Max {currentVehSpec.maxKg.toLocaleString('en-IN')} kg · {currentVehSpec.maxDistanceKm === Infinity ? 'Any dist' : `${currentVehSpec.maxDistanceKm} km max`}</span>
                </span>
              </div>

              {/* TOTAL VEHICLE CAPACITY WITH HARD MAX */}
              <div className="bg-white/70 p-3.5 rounded-xl border border-gold/20 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-green-deep font-semibold">
                    {t('offer.total', 'Total Vehicle Limit')} <span className="text-[11px] text-green-soft font-normal">(Physical max: {currentVehSpec.maxKg} kg)</span>
                  </p>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={currentVehSpec.minKg}
                      max={currentVehSpec.maxKg}
                      step={currentVehSpec.step}
                      value={o.total}
                      onChange={e => {
                        const val = Number(e.target.value);
                        const clamped = Math.min(currentVehSpec.maxKg, Math.max(0, val));
                        setO(prev => ({
                          ...prev,
                          total: clamped,
                          cap: Math.min(prev.cap, clamped)
                        }));
                      }}
                      className="w-24 text-right font-mono font-bold text-xs px-2 py-1 bg-white border border-gold/40 rounded-lg outline-none focus:border-green-deep"
                    />
                    <span className="text-xs font-mono text-green-soft font-bold">kg</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={currentVehSpec.minKg}
                  max={currentVehSpec.maxKg}
                  step={currentVehSpec.step}
                  value={o.total}
                  onChange={e => {
                    const val = +e.target.value;
                    setO(prev => ({
                      ...prev,
                      total: val,
                      cap: Math.min(prev.cap, val)
                    }));
                  }}
                  className="w-full accent-soil cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-green-soft">
                  <span>Min: {currentVehSpec.minKg} kg</span>
                  <span className="text-green-deep font-bold">Default: {currentVehSpec.defaultKg} kg</span>
                  <span>Max: {currentVehSpec.maxKg} kg</span>
                </div>
              </div>

              {/* AVAILABLE SPACE TO SHARE WITH HARD CEILING */}
              <div className="bg-white/70 p-3.5 rounded-xl border border-gold/20 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-green-deep font-semibold">
                    {t('offer.shareableCapacity', 'Available Space to Share')} <span className="text-[11px] text-green-soft font-normal">(Up to {o.total} kg)</span>
                  </p>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max={o.total}
                      step={currentVehSpec.step}
                      value={o.cap}
                      onChange={e => {
                        const val = Number(e.target.value);
                        const clamped = Math.min(Number(o.total), Math.max(0, val));
                        setO(prev => ({
                          ...prev,
                          cap: clamped
                        }));
                      }}
                      className="w-24 text-right font-mono font-bold text-xs px-2 py-1 bg-white border border-gold/40 rounded-lg outline-none focus:border-green-deep"
                    />
                    <span className="text-xs font-mono text-green-soft font-bold">kg</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max={o.total}
                  step={currentVehSpec.step || 10}
                  value={o.cap}
                  onChange={e => setO(prev => ({ ...prev, cap: +e.target.value }))}
                  className="w-full accent-gold cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-green-soft">
                  <span>0 kg</span>
                  <span className="text-soil font-bold">Available: {o.cap} kg</span>
                  <span>Total Cap: {o.total} kg</span>
                </div>
              </div>

              {/* HARD PHYSICAL LIMIT WARNING IF EXCEEDED */}
              {isCapacityExceeded && (
                <div className="rounded-xl bg-red-50 border border-red-300 p-3 text-xs text-red-700 flex items-start gap-2 animate-[fadeIn_0.2s_ease]">
                  <span className="text-base shrink-0">🚫</span>
                  <div>
                    <p className="font-bold text-red-800">Physical Capacity Limit Violation</p>
                    <p className="text-[11.5px] text-red-700 mt-0.5">
                      {Number(o.total) > currentVehSpec.maxKg
                        ? `A ${currentVehSpec.displayName || currentVehSpec.name} physically cannot carry ${Number(o.total).toLocaleString('en-IN')} kg. The maximum allowed capacity is strictly ${currentVehSpec.maxKg.toLocaleString('en-IN')} kg.`
                        : Number(o.total) < currentVehSpec.minKg
                        ? `Declared capacity is below the minimum threshold of ${currentVehSpec.minKg} kg for ${currentVehSpec.displayName || currentVehSpec.name}.`
                        : `Available space (${o.cap} kg) cannot exceed total vehicle capacity (${o.total} kg).`}
                    </p>
                  </div>
                </div>
              )}

              {/* VEHICLE-ROUTE DISTANCE SUITABILITY CONSTRAINT WARNING */}
              {isDistanceExceeded && (
                <div className="rounded-xl bg-amber-50 border-2 border-amber-400 p-3 text-xs text-amber-900 flex items-start gap-2.5 animate-[fadeIn_0.2s_ease]">
                  <span className="text-lg shrink-0">🚫</span>
                  <div>
                    <p className="font-bold text-amber-950 text-xs">Vehicle-Route Distance Constraint</p>
                    <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                      <strong>{currentVehSpec.displayName || currentVehSpec.name}</strong> is designated for local trips up to <strong>{currentVehSpec.maxDistanceKm} km</strong>. Your route ({o.from || 'Origin'} → {o.to || 'Destination'}) is approx. <strong>{routeDistanceKm.toFixed(1)} km</strong>. Please select a suitable vehicle category (such as <strong>Mini-Truck</strong> or <strong>Heavy-Truck</strong>) to offer this trip.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* PRICING & TON-KM EXPLANATION */}
            <div className="rounded-2xl border border-green-deep/30 bg-green-50/40 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="text-2xl mt-0.5">⚖</div>
                <div>
                  <p className="font-bold text-sm text-green-deep">
                    {t('driver.price', 'Total Desired Vehicle Load Fare (₹)')}
                  </p>
                  <p className="text-xs text-green-soft mt-0.5">
                    {t('offer.journeyCost', 'Enter the total amount you want to earn for this full trip load.')}
                  </p>
                </div>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-green-deep">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  value={o.price}
                  placeholder="e.g. 5000"
                  className={`${inputCls} pl-9 font-semibold text-base`}
                  onChange={e =>
                    setO({
                      ...o,
                      price: e.target.value,
                      totalDriverAmount: e.target.value
                    })
                  }
                />
              </div>

              <p className="text-[11px] text-green-800 bg-white/70 rounded-lg p-2 border border-green-200">
                ⚡ <strong>{t('card.ton_km_split', 'Ton-Km Fair Split')}:</strong> The backend automatically splits this ₹{o.price || '0'} among passengers based on their individual weight (kg) × distance (km).
              </p>

              {/* AI DYNAMIC PRICING & MARKET VALIDATION GUARDRAIL */}
              <AiPriceGuardrail
                origin={o.from}
                destination={o.to}
                fromCoords={o.fromCoords}
                toCoords={o.toCoords}
                vehicleModel={o.vehicle}
                goodsWeightKg={o.total}
                customPrice={o.price}
                activeLang={typeof localStorage !== 'undefined' ? localStorage.getItem('ss_lang') || 'en' : 'en'}
                onApplyPrice={priceVal => {
                  setO(prev => ({
                    ...prev,
                    price: String(priceVal),
                    totalDriverAmount: String(priceVal)
                  }));
                  notify(`✔ Applied AI Fair Market Rate: ₹${Number(priceVal).toLocaleString('en-IN')}`);
                }}
              />
            </div>

            {/* =========================================================
               RETURN TRIP / BACKHAUL MONETIZATION ENGINE
            ========================================================= */}
            <div className="rounded-2xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50/70 via-cream to-white p-4 space-y-3 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-700 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
                    🔄
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm text-indigo-950 flex items-center gap-2">
                      <span>{t('driver.return_engine_title', 'Return Backhaul Trip Engine (वापसी फेरा / रिटर्न ट्रिप)')}</span>
                      <span className="text-[10px] bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full font-mono font-bold">
                        Zero Empty Miles
                      </span>
                    </p>
                    <p className="text-xs text-indigo-800 mt-0.5">
                      {t('driver.return_engine_sub', 'Monetize your return journey by automatically listing a discounted reverse corridor trip.')}
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={o.includeReturnTrip}
                    onChange={e => setO(prev => ({ ...prev, includeReturnTrip: e.target.checked, returnDate: prev.returnDate || prev.date }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-700"></div>
                </label>
              </div>

              {o.includeReturnTrip && (
                <div className="pt-3 border-t border-indigo-200/80 space-y-3 animate-[fadeIn_0.2s_ease]">
                  {/* REVERSED ROUTE SUMMARY */}
                  <div className="bg-white/90 p-3 rounded-xl border border-indigo-200 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-700 uppercase tracking-wide">Return Route:</span>
                      <span className="font-bold text-green-deep font-display">
                        {o.to || 'Destination City'} <span className="text-indigo-600">→</span> {o.from || 'Origin City'}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-mono font-bold text-[11px]">
                      Reverse Corridor Auto-Generated
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {/* RETURN DEPARTURE DATE */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-indigo-950 flex items-center gap-1">
                        <span>📅</span> {t('driver.return_date', 'Return Departure Date (वापसी प्रस्थान तिथि)')}
                      </label>
                      <input
                        type="date"
                        min={o.date || new Date().toISOString().split('T')[0]}
                        value={o.returnDate}
                        onChange={e => setO(prev => ({ ...prev, returnDate: e.target.value }))}
                        className={`${inputCls} bg-white`}
                      />
                    </div>

                    {/* RETURN BACKHAUL DISCOUNT SLIDER */}
                    <div className="space-y-1 bg-white/80 p-2.5 rounded-xl border border-indigo-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-indigo-950">
                          🏷️ {t('driver.return_discount', 'Backhaul Discount')}:
                        </span>
                        <span className="font-mono font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-md">
                          {o.returnDiscountPct || 20}% OFF
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="5"
                        value={o.returnDiscountPct || 20}
                        onChange={e => setO(prev => ({ ...prev, returnDiscountPct: Number(e.target.value) }))}
                        className="w-full accent-indigo-700 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-indigo-700">
                        <span>0% (Full Price)</span>
                        <span className="font-bold">20% Recommended</span>
                        <span>50% Max Saver</span>
                      </div>
                    </div>
                  </div>

                  {/* LIVE RETURN FARE EARNINGS PREVIEW */}
                  <div className="bg-indigo-950 text-white rounded-xl p-3 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div>
                      <p className="text-indigo-200 text-[11px]">Return Backhaul Fare (After {o.returnDiscountPct || 20}% Discount):</p>
                      <p className="font-display font-bold text-base text-gold">
                        ₹{Math.round((Number(o.price) || 0) * (1 - (o.returnDiscountPct || 20) / 100)).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-indigo-200 text-[11px]">Round-Trip Total Earning:</p>
                      <p className="font-display font-bold text-base text-emerald-400">
                        ₹{Math.round((Number(o.price) || 0) + (Number(o.price) || 0) * (1 - (o.returnDiscountPct || 20) / 100)).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* =========================================================
               CARGO SPECIALIZATION & DIRECT CATEGORY SELECTION
            ========================================================= */}
            <div className="bg-gradient-to-br from-cream via-white to-gold/10 border-2 border-gold/30 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-green-deep text-cream flex items-center justify-center font-bold text-lg shadow-sm">
                    🏷️
                  </div>
                  <div>
                    <p className="font-bold text-sm text-green-deep flex items-center gap-1.5">
                      <span>Cargo Specialization & Category</span>
                      <span className="text-[10px] bg-gold/20 text-soil font-bold px-2 py-0.5 rounded-full font-mono">
                        DIRECT SELECTION
                      </span>
                    </p>
                    <p className="text-xs text-green-soft">
                      Specify the dedicated handling, cold-chain, or shared cargo rules for this vehicle run.
                    </p>
                  </div>
                </div>
              </div>

              {/* DIRECT DROPDOWN FOR CARGO CATEGORY */}
              <div>
                <label className="block text-xs font-bold text-green-deep mb-1.5">
                  Vehicle Cargo Category (सामान की श्रेणी):
                </label>
                <select
                  className={`${inputCls} font-semibold`}
                  value={o.cargoCategory}
                  onChange={e => {
                    const catVal = e.target.value;
                    setO(prev => ({
                      ...prev,
                      cargoCategory: catVal,
                      iceHandlingSupported: catVal === 'Perishable Goods',
                      has_perishables: catVal === 'Perishable Goods'
                    }));
                  }}
                >
                  {CARGO_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'Dedicated / Isolated Cargo'
                        ? '🔒 Dedicated / Isolated Cargo (Private Single-Client Vehicle)'
                        : cat === 'Perishable Goods'
                        ? '❄ Perishable Goods (Cold-Chain Highway Logistics Monitored)'
                        : '📦 Independent / General Cargo (Shared Multi-Purpose Cargo Space)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* CONDITIONAL SUB-CATEGORY: DEDICATED / ISOLATED CARGO */}
              {o.cargoCategory === 'Dedicated / Isolated Cargo' && (
                <div className="bg-purple-50/90 border border-purple-300 rounded-xl p-3.5 space-y-3 animate-[fadeIn_0.2s_ease]">
                  <div className="flex items-start gap-2.5">
                    <span className="text-xl">🔒</span>
                    <div>
                      <p className="text-xs font-bold text-purple-950">
                        Dedicated Private Vehicle Mode Activated
                      </p>
                      <p className="text-[11px] text-purple-900 leading-relaxed mt-0.5">
                        This vehicle will be reserved exclusively for a single client with no co-loading, mixed cargo, or unrelated stops.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-950 mb-1">
                      Mandatory Purpose / Cargo Sub-Category (समर्पित उद्देश्य):
                    </label>
                    <select
                      className="w-full text-xs font-semibold px-3 py-2 bg-white border border-purple-300 rounded-xl text-purple-950 outline-none focus:ring-2 focus:ring-purple-400"
                      value={o.dedicatedSubCategory}
                      onChange={e => setO(prev => ({ ...prev, dedicatedSubCategory: e.target.value }))}
                    >
                      {DEDICATED_PURPOSE_SUB_CATEGORIES.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* CONDITIONAL SUB-CATEGORY: PERISHABLE GOODS */}
              {o.cargoCategory === 'Perishable Goods' && (
                <div className="bg-cyan-50/90 border border-cyan-300 rounded-xl p-3.5 space-y-3 animate-[fadeIn_0.2s_ease]">
                  <div className="flex items-start gap-2.5">
                    <span className="text-xl">❄️</span>
                    <div>
                      <p className="text-xs font-bold text-cyan-950">
                        Perishable Goods Cold-Chain Transport
                      </p>
                      <p className="text-[11px] text-cyan-900 leading-relaxed mt-0.5">
                        Highway logistics officers will inspect temperature and replenish coolant at designated route checkpoints.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-cyan-950 mb-1">
                      Cooling Facility & Preservation Method (शीतलन सुविधा):
                    </label>
                    <select
                      className="w-full text-xs font-semibold px-3 py-2 bg-white border border-cyan-300 rounded-xl text-cyan-950 outline-none focus:ring-2 focus:ring-cyan-400"
                      value={o.coolingType}
                      onChange={e => setO(prev => ({ ...prev, coolingType: e.target.value }))}
                    >
                      {PERISHABLE_COOLING_TYPES.map(cool => (
                        <option key={cool} value={cool}>{cool}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-cyan-200">
                    <span className="text-[11px] text-cyan-950 font-medium">
                      Enable Active Ice Replenishment by Logistics Officers:
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={o.iceHandlingSupported !== false}
                        onChange={e => setO(prev => ({ ...prev, iceHandlingSupported: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* CONDITIONAL SUB-CATEGORY: INDEPENDENT / GENERAL CARGO */}
              {o.cargoCategory === 'Independent / General Cargo' && (
                <div className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-950">
                  <span className="text-lg">📦</span>
                  <div>
                    <p className="font-bold">Multi-Purpose Shared Cargo Pool</p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Standard multi-shipper shared space with automatic fair Ton-Km split across all booked cargo batches.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* PICKUP INSTRUCTIONS */}
            <Field label={t('driver.pickup_landmark', 'Pickup Instructions & Landmarks for Senders (पिकअप निर्देश / लैंडमार्क)')}>
              <input
                className={inputCls}
                value={o.pickup}
                placeholder="e.g. Near Toll Plaza Gate 2, departure at 6:00 AM, please arrive 15 mins early"
                onChange={e => setO(prev => ({ ...prev, pickup: e.target.value }))}
              />
            </Field>

            {/* VERIFICATION CHECK */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${profile.is_verified || (docs.identity?.name && docs.license?.name) ? 'bg-green-50 border-green-400' : 'bg-amber-50 border-amber-300'}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {profile.is_verified || (docs.identity?.name && docs.license?.name) ? '🛡️' : '⏳'}
                </span>
                <div>
                  <p className="font-bold text-xs text-green-deep">
                    {profile.is_verified || (docs.identity?.name && docs.license?.name) ? t('card.verified', 'Driver Credentials Ready') : t('offer.ownerVerification', 'Verification Required')}
                  </p>
                  <p className="text-[11px] text-green-soft">
                    {profile.is_verified || (docs.identity?.name && docs.license?.name) ? 'Aadhaar & License uploaded' : 'Upload ID in Driver Profile tab'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="px-3 py-1 bg-cream hover:bg-gold/20 text-green-deep border border-gold/30 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {t('tab.driver_profile', 'Manage ID')}
              </button>
            </div>

            <Btn
              size="lg"
              onClick={publishTrip}
              disabled={isPublishing || isCapacityExceeded || isDistanceExceeded}
              className="w-full"
            >
              {isPublishing
                ? '⏳ Publishing Trip...'
                : isDistanceExceeded
                ? '🚫 Route Distance Exceeds Vehicle Range'
                : isCapacityExceeded
                ? '🚫 Fix Invalid Capacity to Publish'
                : 'Publish Trip Load'}
            </Btn>
          </form>

          {/* RIGHT SIDE PREVIEW */}
          <div className="lg:sticky lg:top-24 h-fit space-y-4">
            <p className="text-xs font-mono uppercase tracking-wide text-green-soft">
              Live Trip Card Preview
            </p>

            <div className="rounded-3xl border border-gold/30 bg-paper p-6 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <SackGauge fill={taken} size={50}>
                  <Truck size={20} className="text-green-deep" />
                </SackGauge>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display font-bold text-base truncate">
                      {o.from || 'Origin'} → {o.to || 'Destination'}
                    </p>
                    <Chip tone="indigo">{published ? '✔ Published' : 'Draft'}</Chip>
                  </div>
                  <p className="text-xs text-green-soft mt-1">
                    {o.date || 'Select date'} · {o.vehicle}
                  </p>
                  {/* CARGO SPECIALIZATION PREVIEW CHIP */}
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    {o.cargoCategory === 'Dedicated / Isolated Cargo' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1">
                        <span>🔒 Dedicated Private:</span>
                        <span>{o.dedicatedSubCategory}</span>
                      </span>
                    ) : o.cargoCategory === 'Perishable Goods' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-900 border border-cyan-300 flex items-center gap-1">
                        <span>❄ Perishable:</span>
                        <span>{o.coolingType}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                        📦 General Shared Cargo Space
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-cream p-3 border border-gold/20">
                  <p className="text-[11px] font-mono text-green-soft">Capacity Used</p>
                  <p className="font-display font-bold text-lg text-green-deep">{taken}%</p>
                </div>
                <div className="rounded-xl bg-cream p-3 border border-gold/20">
                  <p className="text-[11px] font-mono text-green-soft">Available Space</p>
                  <p className="font-display font-bold text-lg text-green-deep">{o.cap} kg</p>
                </div>
              </div>

              <div className="rounded-2xl border border-gold/30 bg-cream p-4">
                <p className="text-[11px] font-mono text-green-soft uppercase tracking-wide">
                  Total Desired Load Fare
                </p>
                <p className="font-display font-bold text-2xl text-green-deep mt-1">
                  {o.price ? `₹${Number(o.price).toLocaleString('en-IN')}` : 'Price not set'}
                </p>
                <p className="text-xs text-green-soft mt-1">
                  Fair Ton-Km weight-based split applied to all passengers
                </p>
              </div>

              {o.includeReturnTrip && (
                <div className="rounded-2xl border-2 border-indigo-300 bg-indigo-50/70 p-4 space-y-2 animate-[fadeIn_0.2s_ease]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                      <span>🔄</span>
                      <span>Linked Return Backhaul</span>
                    </span>
                    <span className="text-[10px] bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full font-mono font-bold">
                      {o.returnDiscountPct || 20}% OFF
                    </span>
                  </div>
                  <p className="font-display font-bold text-sm text-indigo-900 truncate">
                    {o.to || 'Destination'} → {o.from || 'Origin'}
                  </p>
                  <p className="text-[11px] text-indigo-800 font-mono">
                    📅 {o.returnDate || o.date || 'Same date'} · Fare: <strong className="text-indigo-950 font-bold">₹{Math.round((Number(o.price) || 0) * (1 - (o.returnDiscountPct || 20) / 100)).toLocaleString('en-IN')}</strong>
                  </p>
                </div>
              )}

              {published && (
                <div className="rounded-2xl bg-green-deep text-cream p-5 shadow-lg space-y-3 animate-[fadeIn_0.3s_ease]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-gold-light text-xs uppercase">Trip Active</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  </div>
                  <h4 className="font-display text-lg font-bold">
                    {o.from} → {o.to}
                  </h4>
                  <p className="text-xs text-cream/80">
                    Your trip is live on the marketplace. Senders can now book cargo space.
                  </p>
                  <button
                    onClick={() => { setActiveTab('trips'); setTripFilter('active'); }}
                    className="w-full py-2 bg-cream text-green-deep font-bold text-xs rounded-xl shadow transition"
                  >
                    View in My Published Trips
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
         TAB 4: DRIVER PROFILE & VERIFICATION DOCUMENTS
      ========================================================= */}
      {activeTab === 'profile' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-[fadeIn_0.25s_ease]">
          {/* PROFILE CARD */}
          <div className="rounded-3xl bg-paper border border-gold/30 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-gold/20">
              <div>
                <p className="text-xs font-mono text-green-soft uppercase tracking-wide">Connected Driver</p>
                <h3 className="font-display font-bold text-2xl text-green-deep mt-0.5">{profile.full_name || 'Driver'}</h3>
                <p className="text-xs text-green-soft mt-1">Email: {profile.email} · Phone: {profile.phone_number || 'N/A'}</p>
                {profile.gender && <p className="text-xs text-green-soft mt-0.5">Gender: {profile.gender}</p>}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setEditForm({
                      full_name: profile.full_name || '',
                      phone_number: profile.phone_number || '',
                      gender: profile.gender || 'Male',
                      aadhaar_doc: profile.aadhaar_doc || '',
                      license_doc: profile.license_doc || ''
                    });
                    setIsEditing(!isEditing);
                  }}
                  className="px-4 py-2 rounded-xl border border-green-deep text-green-deep font-semibold text-xs hover:bg-green-deep/10 transition cursor-pointer"
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </button>
                <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold ${profile.is_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-gold/20 text-soil'}`}>
                  {profile.is_verified ? '✔ Driver Verified' : '⏳ Verification Pending'}
                </span>
              </div>
            </div>

            {/* IN-LINE EDIT FORM */}
            {isEditing && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const token = localStorage.getItem("access_token");
                  try {
                    const res = await fetch(`${API_BASE}/auth/update-profile`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                      },
                      body: JSON.stringify(editForm)
                    });
                    if (res.ok) {
                      const updatedData = await res.json();
                      setProfile(prev => ({ ...prev, ...updatedData }));
                      setIsEditing(false);
                      notify("✔ Driver profile updated successfully!");
                    } else {
                      notify("⚠ Failed to update driver profile.");
                    }
                  } catch (err) {
                    console.error(err);
                    notify("Could not update driver details.");
                  }
                }}
                className="mt-5 pt-4 border-t border-gold/20 space-y-4 animate-[fadeIn_0.3s_ease]"
              >
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-green-deep mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                      className={`${inputCls} py-1.5 px-3 text-xs`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-green-deep mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editForm.phone_number}
                      onChange={e => setEditForm({ ...editForm, phone_number: e.target.value })}
                      className={`${inputCls} py-1.5 px-3 text-xs`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-green-deep mb-1">Gender</label>
                    <select
                      value={editForm.gender}
                      onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                      className={`${inputCls} py-1.5 px-3 text-xs`}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-300 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-deep text-cream font-semibold text-xs rounded-xl hover:bg-green transition cursor-pointer shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* UPLOAD & VERIFY DOCUMENTS */}
            <div className="mt-6">
              <h4 className="font-display font-bold text-lg text-green-deep mb-3 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-green-soft" />
                Govt. Verification Documents (Aadhaar & Driving Licence)
              </h4>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  ['identity', 'Aadhaar Card (Identity Proof)', profile.aadhaar_doc, profile.aadhaar_doc_url],
                  ['license', 'Driving License', profile.license_doc, profile.license_doc_url]
                ].map(([key, label, profileName, profileUrl]) => {
                  const docName = docs[key]?.name || profileName || '';
                  const docUrl = docs[key]?.url || profileUrl || null;
                  const isPdf = docName.toLowerCase().endsWith('.pdf');
                  const isDocVerified = !!docName;

                  return (
                    <div key={key} className="space-y-2">
                      <label
                        className={`flex items-center justify-between gap-3 border-2 border-dashed rounded-2xl px-4 py-4 cursor-pointer hover:bg-cream transition ${isDocVerified ? 'border-green-500 bg-green-50/40' : 'border-gold/50'}`}
                      >
                        <span className="font-semibold text-sm flex items-center gap-2">
                          {isDocVerified ? (
                            <CheckCircle2 size={16} className="text-green-600" />
                          ) : (
                            <Upload size={16} className="text-gold" />
                          )}
                          {label}
                        </span>

                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDocVerified ? 'bg-green-100 text-green-800' : 'text-green-soft'}`}>
                          {isDocVerified ? '✔ Uploaded' : 'Upload'}
                        </span>

                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,application/pdf"
                          onChange={e => upDoc(key, e.target.files[0])}
                        />
                      </label>

                      {docUrl && (
                        <div className="rounded-2xl border border-gold/30 overflow-hidden bg-cream/60 p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <p className="truncate max-w-[180px] font-semibold text-green-deep flex items-center gap-1.5">
                              <span>📄</span>
                              <span className="truncate">{docName}</span>
                            </p>
                            <span className="text-emerald-700 font-bold text-[11px] bg-emerald-100/80 px-2 py-0.5 rounded-full">
                              ✔ Verified
                            </span>
                          </div>

                          {isPdf ? (
                            <div className="bg-white/80 rounded-xl p-3 border border-gold/20 flex flex-col items-center justify-center text-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-lg font-bold">
                                📑
                              </div>
                              <div>
                                <p className="text-xs font-bold text-green-deep">{label}</p>
                                <p className="text-[10px] text-green-soft">PDF Document Attached</p>
                              </div>
                              <a
                                href={docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-flex items-center gap-1 px-3 py-1.5 bg-green-deep text-cream text-[11px] font-semibold rounded-lg hover:bg-green transition cursor-pointer shadow-sm"
                              >
                                <span>Open / View Document ↗</span>
                              </a>
                            </div>
                          ) : (
                            <div className="relative group bg-white/80 rounded-xl p-2 border border-gold/20 flex flex-col items-center">
                              <img src={docUrl} alt={label} className="h-32 object-contain mx-auto rounded-lg" />
                              <a
                                href={docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-xs text-green-deep font-semibold hover:underline"
                              >
                                View Full Size ↗
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INDIVIDUAL SHIPPER CARGO DROP-OFF PROOF MODAL (STAGE 2) */}
      {deliverModal.isOpen && deliverModal.req && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_.2s_ease]">
          <div className="bg-white rounded-3xl border border-gold/40 shadow-2xl max-w-md w-full p-6 animate-[scaleIn_.25s_ease] max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-3 text-3xl shadow-inner">
                📦
              </div>
              <h3 className="font-display font-bold text-2xl text-green-deep">
                Deliver Shipper Cargo
              </h3>
              <p className="text-xs text-green-soft mt-1 leading-relaxed">
                Upload a verified delivery proof photo specifically for <strong>{deliverModal.req.farmer_name}</strong> at their drop-off location.
              </p>
            </div>

            {/* SHIPPER CARGO DETAILS CARD */}
            <div className="mt-4 rounded-2xl bg-cream/70 border border-gold/30 p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-green-soft font-medium">👤 Shipper / Farmer:</span>
                <span className="font-bold text-green-deep">{deliverModal.req.farmer_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-soft font-medium">⚖ Cargo Weight:</span>
                <span className="font-bold text-green-deep">{deliverModal.req.goods_weight_kg || deliverModal.req.kg} kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-soft font-medium">🛣 Route:</span>
                <span className="font-bold text-green-deep truncate max-w-[200px]">{deliverModal.req.route || 'Cargo Route'}</span>
              </div>
              {deliverModal.req.pickup_place && (
                <div className="flex justify-between items-start pt-1 border-t border-gold/15">
                  <span className="text-green-soft shrink-0">📍 Pickup / Drop-off:</span>
                  <span className="font-medium text-green-deep text-right truncate max-w-[200px]">{deliverModal.req.pickup_place}</span>
                </div>
              )}
            </div>

            {/* UPLOAD DROPZONE */}
            <div className="mt-4 space-y-3">
              <label className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-emerald-400/70 hover:border-green-deep rounded-2xl bg-emerald-50/40 hover:bg-emerald-50 cursor-pointer transition text-center">
                <Upload size={24} className="text-emerald-600" />
                <span className="text-xs font-bold text-green-deep">
                  {deliverModal.proofUrl ? "✔ Change Drop-off Photo" : "Take or Choose Drop-off Photo (Mandatory)"}
                </span>
                <span className="text-[11px] text-green-soft">Take a photo of the delivered goods at drop-off</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleUploadIndividualDeliveryProof(e.target.files?.[0])}
                />
              </label>

              {deliverModal.proofUrl && (
                <div className="rounded-2xl border-2 border-emerald-500 overflow-hidden bg-black/5 p-2">
                  <img
                    src={`${API_BASE}${deliverModal.proofUrl}`}
                    alt="Drop-off Proof Preview"
                    className="w-full h-44 object-cover rounded-xl"
                  />
                  <p className="text-[11px] font-bold text-emerald-800 text-center mt-1.5 flex items-center justify-center gap-1">
                    <span>✔</span>
                    <span>Drop-off Photo Attached & Ready to Send to {deliverModal.req.farmer_name}</span>
                  </p>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeliverModal({ isOpen: false, req: null, proofUrl: null, uploading: false })}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!deliverModal.proofUrl || deliverModal.uploading}
                onClick={confirmDeliverIndividualCargo}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  deliverModal.proofUrl && !deliverModal.uploading
                    ? 'bg-green-deep hover:bg-green text-cream'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span>🚀</span>
                <span>{deliverModal.uploading ? 'Uploading...' : 'Confirm & Notify Shipper'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY DELIVERY PROOF PHOTO MODAL (STAGE 2) */}
      {proofModal.isOpen && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_.2s_ease]">
          <div className="bg-white rounded-3xl border border-gold/40 shadow-2xl max-w-md w-full p-6 animate-[scaleIn_.25s_ease]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 mx-auto flex items-center justify-center mb-3 text-3xl shadow-inner">
                📸
              </div>
              <h3 className="font-display font-bold text-2xl text-green-deep">
                Upload Delivery Proof
              </h3>
              <p className="text-xs text-green-soft mt-1 leading-relaxed">
                Stage 2 Verification: Transporters can upload individual drop-off photos for each recipient, or a photo below to finalize the ride.
              </p>
            </div>

            {/* CARGO SHIPPERS ON THIS TRIP LIST */}
            {(() => {
              const activeTrip = myTrips.find(t => t.id === proofModal.tripId);
              if (!activeTrip || !activeTrip.partners || activeTrip.partners.length === 0) return null;

              return (
                <div className="mt-4 text-left rounded-2xl bg-emerald-50/70 border border-emerald-300 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <span>📦</span>
                      <span>Individual Cargo Drop-offs ({activeTrip.partners.length})</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold font-mono">Individual Verification</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Upload an individual photo for each recipient upon their respective drop-off:
                  </p>
                  <div className="space-y-1.5 mt-1 max-h-40 overflow-y-auto pr-1">
                    {activeTrip.partners.map(p => {
                      const isDelivered = p.status === 'pending_passenger_confirmation' || p.status === 'completed';
                      return (
                        <div key={p.id} className="bg-white/90 p-2 rounded-xl border border-emerald-200 flex items-center justify-between text-xs gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-emerald-950 truncate">👤 {p.farmer_name}</p>
                            <p className="text-[10.5px] text-emerald-700">{p.goods_weight_kg} kg · {p.pickup_place || 'Drop-off'}</p>
                          </div>
                          {isDelivered ? (
                            <span className="text-[10.5px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 shrink-0 flex items-center gap-1">
                              <span>✔</span>
                              <span>Photo Sent</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const fullReq = incomingRequests.find(r => r.id === p.id) || {
                                  id: p.id,
                                  farmer_name: p.farmer_name,
                                  goods_weight_kg: p.goods_weight_kg,
                                  route: p.route || `${activeTrip.from_loc || activeTrip.from} → ${activeTrip.to_loc || activeTrip.to}`,
                                  pickup_place: p.pickup_place
                                };
                                setProofModal(prev => ({ ...prev, isOpen: false }));
                                setDeliverModal({
                                  isOpen: true,
                                  req: fullReq,
                                  proofUrl: null,
                                  uploading: false
                                });
                              }}
                              className="px-2.5 py-1 bg-green-deep hover:bg-green text-cream font-bold text-[10.5px] rounded-lg shadow-2xs transition shrink-0 flex items-center gap-1 cursor-pointer"
                            >
                              <span>📸</span>
                              <span>Send Drop-off Photo</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* UPLOAD DROPZONE */}
            <div className="mt-4 space-y-3">
              <label className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-gold/50 hover:border-green-deep rounded-2xl bg-cream/30 hover:bg-gold/5 cursor-pointer transition text-center">
                <Upload size={24} className="text-gold" />
                <span className="text-xs font-bold text-green-deep">
                  {proofModal.proofUrl ? "✔ Change Delivery Photo" : "Take or Choose Delivery Photo (Mandatory)"}
                </span>
                <span className="text-[11px] text-green-soft">Supports JPG, PNG, WEBP from Camera or Gallery</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleUploadDeliveryProof(e.target.files?.[0])}
                />
              </label>

              {proofModal.proofUrl && (
                <div className="rounded-2xl border-2 border-emerald-500 overflow-hidden bg-black/5 p-2">
                  <img
                    src={`${API_BASE}${proofModal.proofUrl}`}
                    alt="Delivery Proof Preview"
                    className="w-full h-44 object-cover rounded-xl"
                  />
                  <p className="text-[11px] font-bold text-emerald-800 text-center mt-1.5 flex items-center justify-center gap-1">
                    <span>✔</span>
                    <span>Delivery Proof Photo Attached & Verified</span>
                  </p>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setProofModal({ isOpen: false, tripId: null, proofUrl: null, uploading: false })}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!proofModal.proofUrl || proofModal.uploading}
                onClick={confirmCompleteWithProof}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  proofModal.proofUrl && !proofModal.uploading
                    ? 'bg-green-deep hover:bg-green text-cream'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span>🏁</span>
                <span>{proofModal.uploading ? 'Uploading...' : 'Confirm & Complete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MULTI-STOP OPTIMAL ITINERARY MODAL */}
      {itineraryModal.isOpen && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_.2s_ease]">
          <div className="bg-white rounded-3xl border border-gold/40 shadow-2xl max-w-lg w-full p-6 animate-[scaleIn_.25s_ease] max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-4 border-b border-gold/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl shadow-inner">
                  🗺️
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-green-deep">
                    Optimal Stop Itinerary
                  </h3>
                  <p className="text-xs text-green-soft">
                    AI Sequenced multi-stop route with strict &lt; 1 km detour limit
                  </p>
                </div>
              </div>
              <button
                onClick={() => setItineraryModal({ isOpen: false, trip: null, result: null, loading: false })}
                className="w-8 h-8 rounded-full bg-cream hover:bg-gold/20 text-green-deep flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {itineraryModal.loading ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-semibold text-green-deep">
                  Computing Traveling Salesperson stop order via OSRM...
                </p>
              </div>
            ) : itineraryModal.result ? (
              <div className="space-y-4 text-xs">
                {/* METRICS SUMMARY */}
                <div className="grid grid-cols-3 gap-2 bg-emerald-50/80 border border-emerald-300 p-3 rounded-2xl">
                  <div>
                    <p className="text-[10px] font-mono uppercase text-emerald-800">Total Distance</p>
                    <p className="font-display font-bold text-base text-emerald-950">
                      {itineraryModal.result.total_distance_km} km
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase text-emerald-800">Total Duration</p>
                    <p className="font-display font-bold text-base text-emerald-950">
                      ~{itineraryModal.result.total_duration_mins} mins
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase text-emerald-800">Peak Payload</p>
                    <p className="font-display font-bold text-base text-emerald-950">
                      {itineraryModal.result.max_payload_kg} kg
                    </p>
                  </div>
                </div>

                {/* STOP BY STOP SEQUENCE */}
                <div className="space-y-2">
                  <p className="font-bold text-green-deep text-xs flex items-center justify-between">
                    <span>📍 Ordered Stop Sequence ({itineraryModal.result.ordered_stops?.length || 0} stops):</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                      ✔ &lt; 1 km Corridor Validated
                    </span>
                  </p>

                  <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-300">
                    {itineraryModal.result.ordered_stops?.map((stop, sIdx) => {
                      const isOrigin = stop.type === 'origin';
                      const isDest = stop.type === 'destination';
                      const isPickup = stop.type === 'pickup';

                      return (
                        <div key={sIdx} className="relative bg-cream/70 border border-gold/30 rounded-xl p-3 shadow-2xs">
                          {/* Pin dot */}
                          <div className={`absolute -left-6 top-3 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-xs ${
                            isOrigin ? 'bg-blue-600' : isDest ? 'bg-red-600' : isPickup ? 'bg-emerald-600' : 'bg-amber-600'
                          }`}>
                            {stop.sequence}
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-green-deep text-xs">
                                {stop.name}
                              </p>
                              <p className="text-[11px] text-green-soft">
                                {isOrigin ? '🚀 Starting Trip Origin' : isDest ? '🏁 Final Trip Destination' : isPickup ? `📦 Cargo Pickup (+${stop.weight_kg} kg)` : `🚚 Cargo Delivery (-${stop.weight_kg} kg)`}
                              </p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                              isOrigin ? 'bg-blue-100 text-blue-800' : isDest ? 'bg-red-100 text-red-800' : isPickup ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {stop.type}
                            </span>
                          </div>

                          {stop.distance_from_prev_km > 0 && (
                            <div className="mt-2 pt-1.5 border-t border-gold/15 flex items-center justify-between text-[10.5px] text-green-soft">
                              <span>Leg Distance: <strong>{stop.distance_from_prev_km} km</strong> (~{stop.duration_from_prev_mins}m)</span>
                              <span>Truck Load: <strong className={stop.is_capacity_exceeded ? 'text-red-600' : 'text-emerald-800'}>{stop.cumulative_payload_kg} kg</strong></span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* NOTES / VALIDATION */}
                {itineraryModal.result.notes && (
                  <p className="text-[11px] text-green-soft italic bg-paper p-2.5 rounded-xl border border-gold/20">
                    ℹ {itineraryModal.result.notes}
                  </p>
                )}

                {/* ACTION BUTTONS */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setItineraryModal({ isOpen: false, trip: null, result: null, loading: false });
                      navigate('/maps');
                    }}
                    className="flex-1 py-2.5 bg-green-deep hover:bg-green text-cream font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>📡</span>
                    <span>Open Live Radar Map</span>
                  </button>
                  <button
                    onClick={() => setItineraryModal({ isOpen: false, trip: null, result: null, loading: false })}
                    className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-green-soft">
                Could not load itinerary.
              </div>
            )}
          </div>
        </div>
      )}

      {/* DRIVER ROUTE & CHECKPOINT RADAR MAP MODAL */}
      {driverMapModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-scaleIn">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base flex items-center gap-2">
                  <span>🗺️</span>
                  <span>Trip Corridor & Highway Checkpoint Map</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {driverMapModal.trip?.from_loc || driverMapModal.trip?.from} → {driverMapModal.trip?.to_loc || driverMapModal.trip?.to} · Vehicle: {driverMapModal.trip?.vehicle}
                </p>
              </div>
              <button
                onClick={() => setDriverMapModal({ isOpen: false, trip: null })}
                className="p-1.5 rounded-full hover:bg-white/20 transition cursor-pointer text-slate-300 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  <span>🛡️</span> Stamped Stops: {driverMapModal.trip?.checkpoint_count || driverMapModal.trip?.checkpoints?.length || 0}
                </span>
                <span className="flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  <span>🛑</span> Next Inspection Point: <strong>{driverMapModal.trip?.next_inspection_point || 'En-route Checkpoint'}</strong>
                </span>
                <span className={`px-2 py-0.5 rounded-lg font-bold border text-[11px] ${
                  driverMapModal.trip?.is_unload_allowed
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border-rose-300'
                }`}>
                  {driverMapModal.trip?.is_unload_allowed ? '✔ Unload Permitted' : `🔒 Unload Locked (${driverMapModal.trip?.inspections_remaining ?? 1} Checkpoint(s) Left)`}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Weight: {driverMapModal.trip?.last_weigh_in_kg || driverMapModal.trip?.total_booked_kg || 0} kg
              </div>
            </div>

            <div className="p-2 flex-1 min-h-[480px] bg-slate-100 relative">
              <Maps
                mode="driver"
                trips={driverMapModal.trip ? [driverMapModal.trip] : []}
                selectedTripId={driverMapModal.trip?.id}
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
                onClick={() => setDriverMapModal({ isOpen: false, trip: null })}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Map
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export { default as ProfileSetupPage } from './ProfileSetupPage';


