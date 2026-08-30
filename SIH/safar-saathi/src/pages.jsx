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
  VolumeX
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
  calculateRouteAwarePrice,
  calculateStrictFare,
  getOsrmDistanceKm,
  AiPriceGuardrail,
  PtlUserPricingCard,
  ComponentErrorBoundary,
  distanceToSegmentKm
} from './ui'

import Maps from './Maps'
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


const GOODS_CATEGORIES = [
  'Parcel / Package',
  'Furniture',
  'Household Goods',
  'Business / Commercial Goods',
  'Construction Materials',
  'Agricultural Products',
  'Industrial Goods',
  'Vehicle / Equipment',
  'Personal Items',
  'Other'
]

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
      notify(`🚛 Tracking Live Driver (${targetName}) · Speed: ${trip.speed || 35} km/h`);
    }

    if (mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const fetchTripsAndRequests = useCallback(async () => {
    // 1. Fetch all trips
    try {
      const tripsRes = await fetch("http://localhost:8000/api/trips");
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
          speed: trip.speed || 0
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
        const myReqRes = await fetch("http://localhost:8000/api/requests/my", {
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
        const res = await fetch("http://localhost:8000/auth/status", {
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

    if (!requests[trip.id]) {
      setRequests(prev => ({
        ...prev,

        [trip.id]: {
          category: '',
          weight: '',
          pickupLocation: '',
          deliveryLocation: '',
          description: '',
          photo: null
        }
      }))
    }
  }


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
      !r?.category ||
      !r?.weight ||
      !r?.pickupLocation ||
      !r?.deliveryLocation
    ) {
      notify(
        '⚠ Please fill all required request details.'
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

    // Intercity Route Corridor Validation (5 km start/dest buffer + intermediate stop leverage)
    const tripStart = { lat: trip.pickup_lat || trip.lat || 0, lng: trip.pickup_lng || trip.lng || 0 };
    const tripDest = { lat: trip.dest_lat || trip.destLat || 0, lng: trip.dest_lng || trip.destLng || 0 };
    const driverRoute = [tripStart, tripDest].filter(c => c.lat !== 0 || c.lng !== 0);

    if (driverRoute.length >= 2) {
      const isPickupOnRoute = isPassengerOnRoute(pickupCoords, driverRoute);
      if (!isPickupOnRoute) {
        notify(`❌ Route Mismatch: Requested pickup (${r.pickupLocation}) is not along the driver's route (${trip.from} → ${trip.to}). Booking blocked.`);
        setSubmittingTripId(null);
        return;
      }

      const isDeliveryOnRoute = isPassengerOnRoute(deliveryCoords, driverRoute);
      if (!isDeliveryOnRoute) {
        notify(`❌ Route Mismatch: Requested drop-off (${r.deliveryLocation}) is not along the driver's route (${trip.from} → ${trip.to}). Booking blocked.`);
        setSubmittingTripId(null);
        return;
      }
    }

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
      const res = await fetch("http://localhost:8000/api/requests", {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify({
          id: requestId,
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
          lang: activeLang
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

  const filteredMyRequests = myRequests.filter(req => {
    if (myBookingFilter === 'pending') return req.status === 'pending';
    if (myBookingFilter === 'accepted') return req.status === 'accepted' || req.status === 'in_transit';
    if (myBookingFilter === 'pending_conf') return req.status === 'pending_passenger_confirmation';
    if (myBookingFilter === 'completed') return req.status === 'completed';
    return true;
  });

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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
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
                          </div>

                          <div className="flex items-center gap-2 flex-wrap shrink-0">
                            <TTSButton
                              textToRead={`${trip.from} to ${trip.to}. Vehicle ${trip.vehicle}. Available free capacity ${free} kilograms. Departure date ${trip.date}. Total load fare rupees ${trip.total_driver_amount || trip.totalDriverAmount || (trip.pricePerKg * trip.totalKg) || 0}.`}
                              size={13}
                            />
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
                              <span>📡 Driver is live on route! Speed: {trip.speed || 35} km/h</span>
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
                                    href={`http://localhost:8000${myReq.pickup_cargo_image_url}`}
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
                                    href={`http://localhost:8000${myReq.delivery_proof_image_url || trip.delivery_proof_image_url}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block rounded-xl overflow-hidden border-2 border-white shadow group relative max-h-48 bg-slate-900"
                                  >
                                    <img
                                      src={`http://localhost:8000${myReq.delivery_proof_image_url || trip.delivery_proof_image_url}`}
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
                                        const res = await fetch(`http://localhost:8000/api/requests/${myReq.id}`, {
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

                            <div className="grid sm:grid-cols-2 gap-3">
                              <Field label={t('form.goods_category', 'Goods Category')}>
                                <select
                                  className={`${inputCls} py-1.5 text-xs`}
                                  value={r.category || ''}
                                  onChange={e => updateRequest(trip.id, 'category', e.target.value)}
                                >
                                  <option value="">{t('form.select_category', 'Select goods category')}</option>
                                  {GOODS_CATEGORIES.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                  ))}
                                </select>
                              </Field>

                              <Field label={t('form.goods_weight', 'Goods Weight (kg)')}>
                                <input
                                  type="number"
                                  min="1"
                                  max={free}
                                  className={`${inputCls} py-1.5 text-xs`}
                                  value={r.weight || ''}
                                  placeholder={`Max ${free} kg`}
                                  onChange={e => updateRequest(trip.id, 'weight', e.target.value)}
                                />
                              </Field>
                            </div>

                            {/* DYNAMIC ROUTE CORRIDOR & SEGMENT PRICING PREVIEW */}
                            {(() => {
                              const driverRoute = [
                                { lat: trip.pickup_lat || trip.lat || 0, lng: trip.pickup_lng || trip.lng || 0 },
                                { lat: trip.dest_lat || trip.destLat || 0, lng: trip.dest_lng || trip.destLng || 0 }
                              ].filter(c => c.lat !== 0 || c.lng !== 0);

                              const hasPickup = Boolean(r.pickupCoords?.lat && r.pickupCoords?.lng);
                              const hasDelivery = Boolean(r.deliveryCoords?.lat && r.deliveryCoords?.lng);
                              const isPickupOnRoute = !hasPickup || driverRoute.length < 2 || isPassengerOnRoute(r.pickupCoords, driverRoute);
                              const isDeliveryOnRoute = !hasDelivery || driverRoute.length < 2 || isPassengerOnRoute(r.deliveryCoords, driverRoute);
                              const isRouteValid = isPickupOnRoute && isDeliveryOnRoute;

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
                                        ? 'bg-green-50 text-green-800 border-green-300'
                                        : 'bg-red-50 text-red-800 border-red-300 animate-pulse'
                                    }`}>
                                      <span className="flex items-center gap-1.5">
                                        <span>{isRouteValid ? '✔' : '❌'}</span>
                                        <span>
                                          {isRouteValid
                                            ? t('corridor.valid', 'Route Corridor Validated (Start, destination, or valid intermediate stop)')
                                            : t('corridor.invalid', "Route Mismatch: Selected location is outside the vehicle's transit corridor")}
                                        </span>
                                      </span>
                                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/70">
                                        {isRouteValid ? t('corridor.valid_stop', 'Valid Stop') : t('corridor.off_route', 'Off-Route')}
                                      </span>
                                    </div>
                                  )}

                                  {/* AI-FIRST USER PARTIAL LOAD COST DISTRIBUTION & FULL-PRICE RULE */}
                                  {weightNum > 0 && (
                                    <ComponentErrorBoundary>
                                      <PtlUserPricingCard
                                        trip={trip}
                                        pickupLoc={r.pickup_place || trip.from}
                                        deliveryLoc={r.delivery_place || trip.to}
                                        pickupCoords={r.pickupCoords}
                                        deliveryCoords={r.deliveryCoords}
                                        weightKg={weightNum}
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
                                          const res = await fetch("http://localhost:8000/api/requests/upload-cargo-image", {
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
                                      href={`http://localhost:8000${r.pickup_cargo_image_url}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="w-12 h-12 rounded-xl overflow-hidden border-2 border-emerald-500 shrink-0 block hover:opacity-90 shadow-sm"
                                      title="Click to preview uploaded cargo photo"
                                    >
                                      <img
                                        src={`http://localhost:8000${r.pickup_cargo_image_url}`}
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

          {/* BOOKINGS CARD GRID */}
          {filteredMyRequests.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">
              {filteredMyRequests.map(req => {
                const isPending = req.status === 'pending';
                const isAccepted = req.status === 'accepted' || req.status === 'in_transit';
                const isWaitingConf = req.status === 'pending_passenger_confirmation';
                const isCompleted = req.status === 'completed';
                const isCancelled = req.status === 'cancelled_by_driver' || req.status === 'cancelled';

                return (
                  <div
                    key={req.id}
                    className={`rounded-2xl border p-5 transition-all shadow-sm flex flex-col justify-between ${isWaitingConf
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
                          <p className="font-display font-bold text-base text-green-deep">
                            {req.route || 'Cargo Route'}
                          </p>
                          <p className="text-xs text-green-soft mt-0.5">
                            👤 Transporter: <strong>{req.owner || 'Captain'}</strong> · 🚚 {req.vehicle || 'Truck'}
                          </p>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${isPending
                            ? 'bg-gold/20 text-soil'
                            : isAccepted
                              ? 'bg-green-600 text-white'
                              : isWaitingConf
                                ? 'bg-amber-500 text-white animate-pulse'
                                : isCompleted
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-red-500 text-white'
                          }`}>
                          {isWaitingConf
                            ? 'CONFIRMATION REQUIRED'
                            : (req.status ? req.status.toUpperCase() : 'PENDING')
                          }
                        </span>
                      </div>

                      {/* SPECS */}
                      <div className="bg-cream rounded-xl border border-gold/20 p-3 space-y-1.5 text-xs mb-3">
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
                                href={`http://localhost:8000${req.delivery_proof_image_url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="block rounded-xl overflow-hidden border-2 border-white shadow group relative max-h-44 bg-slate-900"
                              >
                                <img
                                  src={`http://localhost:8000${req.delivery_proof_image_url}`}
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
                                href={`http://localhost:8000${req.pickup_cargo_image_url}`}
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
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-green-700 font-semibold flex items-center gap-1">
                            <span>✔</span>
                            <span>Transporter Accepted</span>
                          </p>
                          <button
                            onClick={async () => {
                              if (!window.confirm("Are you sure you want to cancel this booking?")) return;
                              const token = localStorage.getItem("access_token");
                              try {
                                const res = await fetch(`http://localhost:8000/api/requests/${req.id}`, {
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
                            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                          >
                            Cancel Booking
                          </button>
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
                                const res = await fetch(`http://localhost:8000/api/requests/${req.id}`, {
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
                    const res = await fetch("http://localhost:8000/auth/update-profile", {
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
                  <a href={`http://localhost:8000${completionModal.deliveryProofUrl}`} target="_blank" rel="noreferrer" title="Click to view full photo">
                    <img
                      src={`http://localhost:8000${completionModal.deliveryProofUrl}`}
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
                    const res = await fetch(`http://localhost:8000/api/requests/${completionModal.requestId}/confirm-completion?lang=${encodeURIComponent(activeLang)}`, {
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
                      notify("⚠ Failed to confirm delivery.");
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
    pickupCoords: null
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
      const res = await fetch("http://localhost:8000/api/trips/my", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Remove completed and cancelled trips from "My Published Trips"
        const activeTrips = data.filter(t => t.status !== 'completed' && t.status !== 'cancelled' && t.status !== 'cancelled_by_driver');
        setMyTrips(activeTrips);
        const liveTrip = activeTrips.find(t => t.status === 'in_transit' || t.is_live);
        if (liveTrip) {
          setActiveLiveTripId(liveTrip.id);
        } else {
          setActiveLiveTripId(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch my trips", err);
    }
  };

  const cancelTrip = async (tripId) => {
    const targetTrip = myTrips.find(t => t.id === tripId);
    if (targetTrip && targetTrip.status !== 'pending' && targetTrip.status !== 'scheduled') {
      notify("⚠ Cannot cancel a trip that has already started.");
      return;
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
      const res = await fetch(`http://localhost:8000/api/trips/${tripId}/cancel`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setActiveLiveTripId(null);
        notify("✖ Trip cancelled. Connected passengers have been notified.");
        fetchMyTrips();
        // Also refresh incoming requests
        const reqRes = await fetch("http://localhost:8000/api/requests/incoming", {
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
          const statusRes = await fetch(`http://localhost:8000/api/trips/${trip.id}/status?status=in_transit`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` }
          });

          if (!statusRes.ok) {
            notify("⚠ Failed to start trip on server.");
            return;
          }

          // Initial location push
          await fetch(`http://localhost:8000/api/trips/${trip.id}/location`, {
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
                  await fetch(`http://localhost:8000/api/trips/${trip.id}/location`, {
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
      const res = await fetch("http://localhost:8000/api/trips/upload-delivery-proof", {
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
      const res = await fetch(`http://localhost:8000/api/trips/${proofModal.tripId}/complete?delivery_proof_image_url=${encodeURIComponent(proofModal.proofUrl)}&lang=${encodeURIComponent(activeLang)}`, {
        method: "PUT",
        headers
      });
      if (res.ok) {
        setMyTrips(prev => prev.map(t => t.id === proofModal.tripId ? { ...t, status: 'pending_passenger_confirmation', is_live: false } : t));
        notify("✔ Delivery proof verified! Trip marked complete, waiting for passenger confirmation & rating.");
        setProofModal({ isOpen: false, tripId: null, proofUrl: null, uploading: false });
        
        // Trigger real WhatsApp delivery notification to connected farmer
        if (incomingRequests && incomingRequests.length > 0) {
          const targetReq = incomingRequests.find(r => r.farmer_phone);
          if (targetReq && targetReq.farmer_phone) {
            sendDeliveryCompleteWhatsApp({
              farmerPhone: targetReq.farmer_phone,
              farmerName: targetReq.farmer_name,
              driverName: profile.full_name || "Driver",
              route: targetReq.route || "Mandi Route",
              weight: targetReq.goods_weight_kg || targetReq.kg || 400,
              lang
            });
          }
        }
        fetchMyTrips();
        const reqRes = await fetch("http://localhost:8000/api/requests/incoming", {
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


  // Fetch logged-in driver profile details + incoming requests + my trips
  useEffect(() => {
    const fetchStatus = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      try {
        const res = await fetch("http://localhost:8000/auth/status", {
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
        const reqRes = await fetch("http://localhost:8000/api/requests/incoming", {
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
    return () => {
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

      const res = await fetch("http://localhost:8000/auth/upload-document", {
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
      const res = await fetch("http://localhost:8000/api/trips", {
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
          lang: activeLang
        })
      });

      if (res.ok) {
        const createdTrip = await res.json();
        setPublished(true);
        notify(`✔ Trip published successfully: ${fromResolved.shortName || fromResolved.state || o.from} → ${toResolved.shortName || toResolved.state || o.to}`);
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
          pickupCoords: null
        });
        if (createdTrip && createdTrip.id) {
          setMyTrips(prev => [createdTrip, ...prev.filter(t => t.id !== createdTrip.id)]);
        }
        await fetchMyTrips();
        // Immediately redirect to published trips list
        setActiveTab('trips');
        setTripFilter('all');
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

  const [activeTab, setActiveTab] = useState('trips'); // 'trips' | 'requests' | 'publish' | 'profile'
  const [requestFilter, setRequestFilter] = useState('all'); // 'all' | 'pending' | 'accepted' | 'completed'
  const [tripFilter, setTripFilter] = useState('all'); // 'all' | 'live' | 'scheduled' | 'pending' | 'completed'

  const pendingRequestsCount = incomingRequests.filter(r => r.status === 'pending').length;
  const activeTripsCount = myTrips.filter(t => t.status === 'in_transit' || t.is_live || t.status === 'scheduled' || t.status === 'pending_passenger_confirmation').length;
  const completedTripsCount = myTrips.filter(t => t.status === 'completed').length;
  const liveTripsCount = myTrips.filter(t => t.status === 'in_transit' || t.is_live).length;
  const totalRevenuePotential = myTrips.reduce((acc, t) => acc + (t.total_driver_amount || t.totalDriverAmount || (t.price_per_kg * t.total_kg) || 0), 0);

  const filteredRequests = incomingRequests.filter(req => {
    if (requestFilter === 'pending') return req.status === 'pending';
    if (requestFilter === 'accepted') return req.status === 'accepted';
    if (requestFilter === 'completed') return req.status === 'completed' || req.status === 'pending_passenger_confirmation';
    return true;
  });

  const filteredTrips = myTrips.filter(trip => {
    if (tripFilter === 'live') return trip.status === 'in_transit' || trip.is_live;
    if (tripFilter === 'scheduled') return trip.status === 'scheduled';
    if (tripFilter === 'pending') return trip.status === 'pending_passenger_confirmation';
    if (tripFilter === 'completed') return trip.status === 'completed';
    return true;
  });

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
              {t('nav_offer_trip', 'Driver & Logistics Dashboard')}
            </h1>
            <TTSButton textToRead={`${t('nav_offer_trip', 'Driver & Logistics Dashboard')}. ${t('offer.subtitle', 'Share the available space in your vehicle with people who need to transport goods.')}`} />
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
          onClick={() => { setActiveTab('trips'); setTripFilter('all'); }}
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
          onClick={() => setActiveTab('trips')}
          className="rounded-2xl bg-paper border border-gold/30 p-4 shadow-sm hover:border-green-deep/40 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] font-mono text-green-soft uppercase tracking-wide">{t('metric.revenue_potential', 'Total Load Potential')}</p>
            <p className="font-display font-bold text-2xl text-green-deep mt-0.5">₹{totalRevenuePotential.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-green-soft mt-0.5">Across {myTrips.length} published trip{myTrips.length !== 1 ? 's' : ''}</p>
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
          onClick={() => setActiveTab('trips')}
          className={`px-5 py-3 rounded-2xl font-display font-bold text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer ${activeTab === 'trips'
              ? 'bg-green-deep text-cream shadow-md'
              : 'text-green-deep hover:bg-gold/10'
            }`}
        >
          <Truck size={17} />
          <span>{t('tab.driver_trips', 'My Published Trips')}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${activeTab === 'trips' ? 'bg-cream text-green-deep' : 'bg-green-deep/10 text-green-deep'}`}>
            {myTrips.length}
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
                Published Trip Loads ({myTrips.length})
              </h3>
              <p className="text-xs text-green-soft mt-0.5">
                Control active trips, share live GPS locations, and mark loads complete.
              </p>
            </div>

            {/* FILTER PILLS */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                ['all', `All (${myTrips.length})`],
                ['live', `Live (${liveTripsCount})`],
                ['pending', `Pending Conf. (${myTrips.filter(t => t.status === 'pending_passenger_confirmation').length})`],
                ['scheduled', `Scheduled (${myTrips.filter(t => t.status === 'scheduled').length})`],
                ['completed', `Completed (${completedTripsCount})`]
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

          {/* TRIPS CARD GRID */}
          {filteredTrips.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">
              {filteredTrips.map(trip => {
                const isTripLive = trip.id === activeLiveTripId || trip.status === 'in_transit' || trip.is_live;
                const isPendingConfirmation = trip.status === 'pending_passenger_confirmation';
                const isCompleted = trip.status === 'completed';
                const isCancelled = trip.status === 'cancelled' || trip.status === 'cancelled_by_driver';
                const usedPct = trip.space_used_percentage !== undefined ? trip.space_used_percentage : (trip.pct || 0);
                const freeKg = trip.available_space_kg !== undefined ? trip.available_space_kg : Math.max(0, (trip.total_kg || 1000) - (trip.total_booked_kg || 0));

                return (
                  <div
                    key={trip.id}
                    className={`rounded-2xl border p-5 transition-all shadow-sm flex flex-col justify-between ${isTripLive
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
                          <p className="font-display font-bold text-lg text-green-deep flex items-center gap-1.5">
                            <span>{trip.from_loc || trip.from}</span>
                            <span className="text-gold">→</span>
                            <span>{trip.to_loc || trip.to}</span>
                          </p>
                          <p className="text-xs text-green-soft font-mono mt-0.5">
                            📅 {trip.date} · 🚛 {trip.vehicle} · ⚖ Max {trip.total_kg || trip.totalKg} kg
                          </p>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${isTripLive
                            ? 'bg-green-600 text-white animate-pulse'
                            : isPendingConfirmation
                              ? 'bg-amber-500 text-white animate-pulse'
                              : isCompleted
                                ? 'bg-emerald-600 text-white'
                                : isCancelled
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-200 text-gray-700'
                          }`}>
                          {isTripLive
                            ? '🔴 IN-TRANSIT'
                            : isPendingConfirmation
                              ? '⏳ PENDING CONFIRMATION'
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

                      {/* CONNECTED ACCEPTED PASSENGERS / CARGO */}
                      {trip.partners && trip.partners.filter(p => p.status === 'accepted' || p.status === 'in_transit' || p.status === 'pending').length > 0 && (
                        <div className="bg-emerald-50/80 border border-emerald-300/80 rounded-xl p-2.5 mb-3">
                          <p className="text-[11px] font-bold text-emerald-900 flex items-center justify-between mb-1.5">
                            <span>📦 Accepted Cargo Bookings ({trip.partners.filter(p => p.status === 'accepted' || p.status === 'in_transit' || p.status === 'pending').length})</span>
                            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-mono font-semibold">Ready to Ship</span>
                          </p>
                          <div className="space-y-1">
                            {trip.partners.filter(p => p.status === 'accepted' || p.status === 'in_transit' || p.status === 'pending').map(p => (
                              <div key={p.id} className="text-xs text-emerald-950 flex items-center justify-between bg-white/80 px-2.5 py-1.5 rounded-lg border border-emerald-200 shadow-2xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-emerald-700 font-bold">👤 {p.farmer_name}</span>
                                  <span className="text-emerald-600 text-[10px]">({p.status.toUpperCase()})</span>
                                </div>
                                <span className="font-mono text-[11px] font-semibold text-emerald-800">{p.goods_weight_kg} kg</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* DRIVER DELIVERY PROOF PHOTO PREVIEW */}
                      {trip.delivery_proof_image_url && (
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
                            href={`http://localhost:8000${trip.delivery_proof_image_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-xl overflow-hidden border-2 border-white shadow group relative max-h-44 bg-slate-900"
                          >
                            <img
                              src={`http://localhost:8000${trip.delivery_proof_image_url}`}
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
                    <div className="pt-3 border-t border-gold/20 mt-2">
                      {isCompleted ? (
                        <div className="w-full bg-emerald-100/80 border border-emerald-300 p-2.5 rounded-xl">
                          <div className="text-xs text-emerald-900 font-bold flex items-center justify-between">
                            <span>✔ Ride Completed & Confirmation Done</span>
                            <span className="text-sm">🎉</span>
                          </div>
                          <p className="text-[11px] text-emerald-800 mt-0.5">
                            All active booked senders have confirmed delivery and submitted ratings.
                          </p>
                        </div>
                      ) : isPendingConfirmation ? (
                        <div className="w-full space-y-1.5 bg-amber-100/80 border border-amber-300 p-2.5 rounded-xl">
                          <div className="text-xs text-amber-950 font-bold flex items-center justify-between">
                            <span>⏳ Waiting for passenger confirmation...</span>
                            <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                          </div>
                          <p className="text-[11px] text-amber-900">
                            Passengers are reviewing their Ton-Km share breakdown and rating the delivery.
                          </p>
                        </div>
                      ) : isCancelled ? (
                        <div className="w-full text-xs text-red-700 bg-red-100/70 border border-red-200 p-2 rounded-xl font-semibold">
                          ✖ This trip was cancelled.
                        </div>
                      ) : !isTripLive ? (
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => startLiveTrip(trip)}
                            className="flex-1 py-2.5 bg-green-deep hover:bg-green text-cream font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <MapPin size={15} />
                            Start Trip & Share GPS
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
                      ) : (
                        <div className="w-full space-y-2">
                          <div className="text-xs text-green-900 font-semibold bg-green-100 border border-green-300 p-2.5 rounded-xl flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-bold">
                              <span>📡</span>
                              <span>Live GPS Broadcasting ({trip.speed || 35} km/h)</span>
                            </span>
                            <span className="w-2.5 h-2.5 rounded-full bg-green-600 animate-ping"></span>
                          </div>
                          <button
                            onClick={() => driverCompleteTrip(trip.id)}
                            className="w-full py-2.5 bg-green-deep hover:bg-green text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>🏁</span>
                            <span>Complete Ride & Request Passenger Confirmation</span>
                          </button>
                        </div>
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
                {tripFilter === 'all'
                  ? "You haven't published any trips yet. Share your vehicle's available space and start earning."
                  : `There are currently no trips matching the "${tripFilter}" filter.`}
              </p>
              <button
                onClick={() => setActiveTab('publish')}
                className="px-5 py-2.5 bg-green-deep hover:bg-green text-cream font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>➕</span>
                <span>Publish a New Trip</span>
              </button>
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
                              ? 'bg-green-600 text-white'
                              : isWaitingConf
                                ? 'bg-amber-600 text-white animate-pulse'
                                : isCompleted
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-red-500 text-white'
                          }`}>
                          {isWaitingConf
                            ? 'WAITING PASSENGER CONF.'
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
                              href={`http://localhost:8000${req.pickup_cargo_image_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-12 h-12 rounded-xl overflow-hidden border border-gold/40 shrink-0 block hover:opacity-90 shadow-2xs"
                              title="Click to inspect full cargo photo"
                            >
                              <img
                                src={`http://localhost:8000${req.pickup_cargo_image_url}`}
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
                            href={`http://localhost:8000${req.pickup_cargo_image_url}`}
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
                                  `http://localhost:8000/api/requests/${req.id}/status?status=accepted&lang=${encodeURIComponent(activeLang)}`,
                                  {
                                    method: "PUT",
                                    headers: { "Authorization": `Bearer ${token}` }
                                  }
                                );
                                if (res.ok) {
                                  notify(`✔ Accepted request from ${req.farmer_name}`);
                                  const reqRes = await fetch(
                                    "http://localhost:8000/api/requests/incoming",
                                    { headers: { "Authorization": `Bearer ${token}` } }
                                  );
                                  const reqData = await reqRes.json();
                                  if (reqRes.ok && Array.isArray(reqData)) setIncomingRequests(reqData);
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
                                  `http://localhost:8000/api/requests/${req.id}/status?status=cancelled_by_driver&reason=${encodeURIComponent("The driver has rejected this request.")}&lang=${encodeURIComponent(activeLang)}`,
                                  {
                                    method: "PUT",
                                    headers: { "Authorization": `Bearer ${token}` }
                                  }
                                );
                                if (res.ok) {
                                  notify(`✖ Rejected request from ${req.farmer_name}`);
                                  const reqRes = await fetch(
                                    "http://localhost:8000/api/requests/incoming",
                                    { headers: { "Authorization": `Bearer ${token}` } }
                                  );
                                  const reqData = await reqRes.json();
                                  if (reqRes.ok && Array.isArray(reqData)) setIncomingRequests(reqData);
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
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-green-700 font-semibold flex items-center gap-1">
                              <span>✔</span>
                              <span>Accepted</span>
                            </p>
                          </div>
                          <button
                            onClick={async () => {
                              if (!window.confirm(`Are you sure you want to cancel the accepted ride for ${req.farmer_name}?`)) return;
                              const token = localStorage.getItem("access_token");
                              try {
                                const res = await fetch(
                                  `http://localhost:8000/api/requests/${req.id}/status?status=cancelled_by_driver&reason=${encodeURIComponent("The driver has cancelled this ride.")}`,
                                  {
                                    method: "PUT",
                                    headers: { "Authorization": `Bearer ${token}` }
                                  }
                                );
                                if (res.ok) {
                                  notify(`✖ Cancelled ride for ${req.farmer_name}. Passenger notified.`);
                                  const reqRes = await fetch(
                                    "http://localhost:8000/api/requests/incoming",
                                    { headers: { "Authorization": `Bearer ${token}` } }
                                  );
                                  const reqData = await reqRes.json();
                                  if (reqRes.ok && Array.isArray(reqData)) setIncomingRequests(reqData);
                                } else {
                                  notify("⚠ Failed to cancel request.");
                                }
                              } catch (err) {
                                notify("Could not connect to backend.");
                              }
                            }}
                            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                          >
                            Cancel Ride
                          </button>
                        </div>
                      )}

                      {isWaitingConf && (
                        <p className="text-xs text-amber-800 font-medium">
                          ⏳ Waiting for passenger confirmation and rating.
                        </p>
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
                    onClick={() => { setActiveTab('trips'); setTripFilter('all'); }}
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
                    const res = await fetch("http://localhost:8000/auth/update-profile", {
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
                Stage 2 Verification: Transporters must upload a clear photo of the delivered cargo at the destination before completing the ride.
              </p>
            </div>

            {/* UPLOAD DROPZONE */}
            <div className="mt-5 space-y-3">
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
                    src={`http://localhost:8000${proofModal.proofUrl}`}
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
    </section>
  );
}

export { default as ProfileSetupPage } from './ProfileSetupPage';


