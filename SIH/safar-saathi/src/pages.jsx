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
  ShieldCheck
} from 'lucide-react'

import { useLang } from './lib'

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
  haversineDistance
} from './ui'

import Maps from './Maps'
import { useLocation, useNavigate } from 'react-router-dom'

/* =========================================================
   HOME
========================================================= */

export function Home() {
  const { t } = useLang()
  const [phase, setPhase] = useState('truck')
  const navigate = useNavigate()

  useEffect(() => {
    const id = setTimeout(
      () => setPhase(p => (p === 'truck' ? 'slide' : 'truck')),
      phase === 'truck' ? 9000 : 5000
    )

    return () => clearTimeout(id)
  }, [phase])

  const steps = [
    [
      15,
      Search,
      'Find a Vehicle',
      'Search vehicles travelling on your route and find available space.'
    ],
    [
      45,
      Package,
      'Request Transport',
      'Add your goods details and send a request to the vehicle owner.'
    ],
    [
      78,
      Truck,
      'Move Your Goods',
      'The vehicle owner accepts your request and transports your goods.'
    ],
    [
      100,
      CheckCircle2,
      'Delivery Complete',
      'Confirm delivery and complete your transportation journey.'
    ]
  ]

  return (
    <section className="max-w-7xl mx-auto px-4 pt-8 sm:pt-12">
      <div className="hero-scene shadow-xl">
        <div className="hero-sky"></div>
        <div className="hero-sun"></div>

        <svg
          className="bird"
          style={{ top: '18%' }}
          width="30"
          height="14"
          viewBox="0 0 30 14"
        >
          <path
            d="M0 8 Q7 0 15 8 Q23 0 30 8"
            stroke="#1F3D2B"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        <svg
          className="bird"
          style={{
            top: '26%',
            animationDelay: '-6s'
          }}
          width="22"
          height="10"
          viewBox="0 0 30 14"
        >
          <path
            d="M0 8 Q7 0 15 8 Q23 0 30 8"
            stroke="#1F3D2B"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        <div className="field-row r1"></div>
        <div className="field-row r2"></div>
        <div className="field-row r3"></div>

        <div className="lane"></div>

        {/* MOVING TRUCK */}

        <div className="truck-wrap">
          <svg
            className="truck-bounce"
            width="130"
            height="65"
            viewBox="0 0 130 65"
          >
            <rect
              x="4"
              y="22"
              width="70"
              height="28"
              rx="4"
              fill="#1F3D2B"
            />

            <rect
              x="12"
              y="13"
              width="22"
              height="18"
              rx="2"
              fill="#E4C878"
              stroke="#6B4226"
            />

            <rect
              x="36"
              y="13"
              width="25"
              height="18"
              rx="2"
              fill="#B23A2E"
              stroke="#6B4226"
            />

            <path
              d="M74 22 L100 22 L115 38 L115 50 L74 50 Z"
              fill="#B23A2E"
            />

            <rect
              x="82"
              y="27"
              width="20"
              height="13"
              rx="2"
              fill="#FBF6EC"
            />

            <circle cx="28" cy="53" r="9" fill="#1F1F1F" />
            <circle cx="28" cy="53" r="3" fill="#C89B3C" />

            <circle cx="98" cy="53" r="9" fill="#1F1F1F" />
            <circle cx="98" cy="53" r="3" fill="#C89B3C" />
          </svg>
        </div>

        {/* SECOND SLIDE */}

        {phase === 'slide' && (
          <div className="absolute inset-0 z-10 bg-green-deep flex items-center justify-center animate-[fadeIn_.8s_ease]">
            <img
              src="/slide1.jpg"
              alt="Goods transportation"
              className="absolute inset-0 w-full h-full object-cover"
              onError={e => {
                e.target.style.display = 'none'
              }}
            />

            <div className="absolute inset-0 bg-green-deep/70"></div>

            <div className="relative text-center text-cream p-8">
              <div className="text-6xl mb-4">
                📦 🚚 📍
              </div>

              <h2 className="font-display text-3xl font-bold text-gold-light">
                Move Goods. Share Space.
              </h2>

              <p className="mt-3 text-lg max-w-md mx-auto">
                Connect with vehicles already travelling on your route.
              </p>
            </div>
          </div>
        )}

        {/* HERO CONTENT */}

        <div className="absolute inset-0 flex items-end sm:items-center pointer-events-none">
          <div className="p-5 sm:p-10 max-w-xl pointer-events-auto">
            <span className="inline-block font-mono text-[11px] px-2.5 py-1 rounded-full bg-cream/80 text-green-deep border border-green-deep/20 mb-3">
              Smart Goods Transportation
            </span>

            <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-green-deep drop-shadow-sm leading-tight">
              Safar-Saathi
              <br />

              <span className="text-2xl sm:text-3xl">
                सफ़र-साथी
              </span>
            </h1>

            <p className="mt-3 text-sm sm:text-base text-green-deep/90 font-medium max-w-md">
              Find available vehicle space and move your goods easily.
              <br />

              <span className="text-xs opacity-80">
                Send goods · Offer space · Share the journey
              </span>
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {/* Find a Vehicle Button -> Always goes to /find */}
              <button 
                onClick={async () => {
                  const token = localStorage.getItem("access_token");
                  if (!token) {
                    navigate('/login', { state: { intent: 'find' } });
                    return;
                  }
                  try {
                    const res = await fetch("http://localhost:8000/auth/status", {
                      headers: { "Authorization": `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (!data.is_profile_complete) {
                      navigate('/complete-profile');
                    } else if (data.user_type === 'driver') {
                      localStorage.removeItem("access_token");
                      navigate('/login', {
                        state: {
                          intent: 'find',
                          error: 'This account belongs to Offer a Trip (Driver). Please use a Sender account for Find a Vehicle.'
                        }
                      });
                    } else {
                      navigate('/find');
                    }
                  } catch (err) {
                    navigate('/login', { state: { intent: 'find' } });
                  }
                }}
                className="bg-green-deep text-cream px-5 py-3 rounded-xl font-semibold hover:bg-green transition"
              >
                Find a Vehicle
              </button>

              {/* Offer a Trip Button */}
              <button 
                onClick={async () => {
                  const token = localStorage.getItem("access_token");
                  if (!token) {
                    navigate('/login', { state: { intent: 'offer' } });
                    return;
                  }
                  try {
                    const res = await fetch("http://localhost:8000/auth/status", {
                      headers: { "Authorization": `Bearer ${token}` }
                    });
                    const data = await res.json();
                    
                    if (!data.is_profile_complete) {
                      navigate('/complete-profile');
                    } else if (data.user_type !== 'driver') {
                      localStorage.removeItem("access_token");
                      navigate('/login', {
                        state: {
                          intent: 'offer',
                          error: 'This account belongs to Find a Vehicle (Sender). Please use a Driver account for Offer a Trip.'
                        }
                      });
                    } else {
                      navigate('/offer');
                    }
                  } catch (err) {
                    navigate('/login', { state: { intent: 'offer' } });
                  }
                }}
                className="bg-gold text-green-deep px-5 py-3 rounded-xl font-semibold hover:bg-gold-light transition"
              >
                Offer a Trip
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}

      <div className="max-w-7xl mx-auto mt-16">
        <Reveal>
          <h2 className="font-display font-bold text-2xl sm:text-3xl">
            How It Works

            <span className="text-base font-body font-normal text-green-soft">
              {' '} / Simple transport in 4 steps
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
                  size={64}
                >
                  <Icon
                    size={22}
                    className="text-green-deep"
                  />
                </SackGauge>

                <p className="font-display font-semibold mt-3">
                  {h}
                </p>

                <p className="text-sm text-green-soft mt-1">
                  {d}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}


/* =========================================================
   FIND VEHICLES
========================================================= */

const TRIPS = [
  {
    id: 1,
    state: 'Uttar Pradesh',
    from: 'Lucknow',
    to: 'Delhi',
    date: '2026-08-20',
    vehicle: 'Mini Truck',
    owner: 'Ramesh Kumar',
    verified: true,
    pct: 55,
    totalKg: 1200,
    pricePerKg: 8,
    pickup: 'Alambagh Transport Nagar, Lucknow',
    lat: 26.8467,
    lng: 80.9462
  },
  {
    id: 2,
    state: 'Maharashtra',
    from: 'Mumbai',
    to: 'Pune',
    date: '2026-08-21',
    vehicle: 'Pickup',
    owner: 'Amit Patil',
    verified: true,
    pct: 30,
    totalKg: 1000,
    pricePerKg: 10,
    pickup: 'Andheri East, Mumbai',
    lat: 19.1197,
    lng: 72.8468
  },
  {
    id: 3,
    state: 'Delhi',
    from: 'Delhi',
    to: 'Jaipur',
    date: '2026-08-22',
    vehicle: 'Truck',
    owner: 'Sandeep Sharma',
    verified: true,
    pct: 70,
    totalKg: 3000,
    pricePerKg: 6,
    pickup: 'Okhla Industrial Area, Delhi',
    lat: 28.5355,
    lng: 77.2730
  },
  {
    id: 4,
    state: 'Karnataka',
    from: 'Bengaluru',
    to: 'Chennai',
    date: '2026-08-23',
    vehicle: 'Tempo',
    owner: 'Arjun Reddy',
    verified: false,
    pct: 40,
    totalKg: 1500,
    pricePerKg: 7,
    pickup: 'Electronic City, Bengaluru',
    lat: 12.8399,
    lng: 77.6770
  }
]

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
        if (res.ok) {
          setProfile(data);
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
    navigate('/login');
  };

  const list = (trips.length > 0 ? trips : TRIPS)
    .filter(trip => {
      // Exclude cancelled or completed trips from new booking search,
      // UNLESS the passenger has a request on that trip so they can view its cancelled status
      const hasMyReq = myRequests.some(
        req =>
          req.owner === trip.owner &&
          req.route === `${trip.from} → ${trip.to}`
      );
      if (trip.status === 'completed' || trip.status === 'cancelled' || trip.status === 'cancelled_by_driver') {
        if (!hasMyReq) return false;
      }

      return (
        (!f.state || trip.state === f.state) &&
        (!f.veh || trip.vehicle === f.veh) &&
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
    const allTrips = trips.length > 0 ? trips : TRIPS;
    const trip = allTrips.find(x => x.id === id)

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

      return
    }

    if (+r.weight > free) {
      notify(
        `⚠ Maximum available space is ${free} kg.`
      )

      return
    }

    // Intercity Route Corridor Validation
    const tripOriginCoords = { lat: trip.lat || 19.9975, lng: trip.lng || 73.7898 };
    const tripDestCoords = { lat: trip.destLat || (trip.lat ? trip.lat + 1.2 : 18.5204), lng: trip.destLng || (trip.lng ? trip.lng + 1.2 : 73.8567) };

    if (r.pickupCoords && !isPointAlongRoute(r.pickupCoords, tripOriginCoords, tripDestCoords, 0.25)) {
      notify(`⚠ Pickup location is not along the driver's travel route (${trip.from} → ${trip.to}). Please select a location along the intercity route.`);
      return;
    }

    if (r.deliveryCoords && !isPointAlongRoute(r.deliveryCoords, tripOriginCoords, tripDestCoords, 0.25)) {
      notify(`⚠ Delivery location is not along the driver's travel route (${trip.from} → ${trip.to}). Please select a location along the intercity route.`);
      return;
    }

    // Calculate travel distance between user pickup and delivery locations
    let estimatedDist = trip.distance_km || 150;
    if (r.pickupCoords && r.deliveryCoords) {
      const R = 6371;
      const dLat = (r.deliveryCoords.lat - r.pickupCoords.lat) * Math.PI / 180;
      const dLon = (r.deliveryCoords.lng - r.pickupCoords.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(r.pickupCoords.lat * Math.PI / 180) * Math.cos(r.deliveryCoords.lat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      estimatedDist = Math.max(10, Math.round(R * c * 1.25));
    }

    // Actually POST the request to the backend so it
    // persists and can be seen by the vehicle owner
    const token = localStorage.getItem("access_token");
    // Build a unique request ID to avoid primary-key collisions
    // when multiple senders request the same trip.
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      const res = await fetch("http://localhost:8000/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
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
          delivery_lng: r.deliveryCoords?.lng || 0
        })
      });

      if (res.ok) {
        notify(
          `✔ Transport request sent to ${trip.owner}`
        );
        const created = await res.json();
        setMyRequests(prev => [
          ...prev,
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
            kg_km: created.kg_km || (Number(r.weight) * estimatedDist),
            per_person_share: created.per_person_share || 0,
            total_driver_amount: created.total_driver_amount || trip.total_driver_amount,
            total_trip_kg_km: created.total_trip_kg_km || 0,
            share_pct: created.share_pct || 0
          }
        ]);
        setRequestOpen(null);
        fetchTripsAndRequests();
      } else {
        const data = await res.json();
        notify(data.detail || "Failed to send request.");
      }

    } catch (err) {
      console.error("Failed to send request", err);
      notify("Could not connect to backend. Request not sent.");
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
              <CheckCircle2 size={13} /> Sender Active
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-green-deep mt-1">
            Find a Vehicle (Sender Dashboard)
          </h1>
          <p className="text-sm text-green-soft mt-1">
            Browse available cargo space, calculate fair Ton-Km fares, and track shipments live.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="hidden sm:block text-right">
            <p className="font-bold text-xs text-green-deep">{profile.full_name || 'Sender'}</p>
            <p className="text-[11px] text-green-soft font-mono">{profile.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-sm transition duration-200 text-xs cursor-pointer"
          >
            Logout
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
            <p className="text-[11px] font-mono text-green-soft uppercase tracking-wide">Available Trucks</p>
            <p className="font-display font-bold text-2xl text-green-deep mt-0.5">{activeVehiclesCount}</p>
            <p className="text-[11px] text-green-soft mt-0.5">{liveVehiclesCount} Live In-Transit</p>
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
            <p className="text-[11px] font-mono text-green-soft uppercase tracking-wide">My Cargo Bookings</p>
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
            <p className="text-[11px] font-mono text-green-soft uppercase tracking-wide">Free Cargo Space</p>
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
            <p className="text-[11px] font-mono text-green-soft uppercase tracking-wide">Verified Transporters</p>
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
          className={`px-5 py-3 rounded-2xl font-display font-bold text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'explore'
              ? 'bg-green-deep text-cream shadow-md'
              : 'text-green-deep hover:bg-gold/10'
          }`}
        >
          <Truck size={17} />
          <span>Explore Available Vehicles</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${activeTab === 'explore' ? 'bg-cream text-green-deep' : 'bg-green-deep/10 text-green-deep'}`}>
            {activeVehiclesCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('my_bookings')}
          className={`px-5 py-3 rounded-2xl font-display font-bold text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'my_bookings'
              ? 'bg-green-deep text-cream shadow-md'
              : 'text-green-deep hover:bg-gold/10'
          }`}
        >
          <Package size={17} />
          <span>My Bookings & Shipments</span>
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
          className={`px-5 py-3 rounded-2xl font-display font-bold text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'map'
              ? 'bg-green-deep text-cream shadow-md'
              : 'text-green-deep hover:bg-gold/10'
          }`}
        >
          <Route size={17} />
          <span>Live Map Radar</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-3 rounded-2xl font-display font-bold text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-green-deep text-cream shadow-md'
              : 'text-green-deep hover:bg-gold/10'
          }`}
        >
          <Users size={17} />
          <span>Sender Profile</span>
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
                placeholder="Search by pickup location, origin city, destination, or route in India..."
                className="w-full rounded-2xl border border-gold/40 bg-cream/30 pl-11 pr-4 py-3 outline-none focus:border-green-deep text-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <select
                className={`${inputCls} py-2 text-xs`}
                value={f.state}
                onChange={e => setF({ ...f, state: e.target.value })}
              >
                <option value="">All States</option>
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
                <option value="">All Vehicle Types</option>
                <option value="Bike">Bike / Scooter</option>
                <option value="Auto">Auto / Rickshaw</option>
                <option value="Pickup">Pickup</option>
                <option value="Mini Truck">Mini Truck</option>
                <option value="Tempo">Tempo</option>
                <option value="Truck">Truck</option>
              </select>

              <select
                className={`${inputCls} py-2 text-xs`}
                value={f.sort}
                onChange={e => setF({ ...f, sort: e.target.value })}
              >
                <option value="free">Most Free Space (kg)</option>
                <option value="date">Earliest Date</option>
              </select>

              <label className="flex items-center gap-2 rounded-xl border border-gold/40 px-3 py-2 text-xs font-semibold cursor-pointer bg-cream/40 select-none">
                <input
                  type="checkbox"
                  className="accent-green-deep w-4 h-4 rounded cursor-pointer"
                  checked={f.ver}
                  onChange={e => setF({ ...f, ver: e.target.checked })}
                >
                </input>
                <span>🛡️ Verified Only</span>
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
                  const myReq = myRequests.find(
                    req =>
                      req.owner === trip.owner &&
                      req.route === `${trip.from} → ${trip.to}`
                  );
                  const isTripLive = trip.status === 'in_transit' || trip.is_live;

                  return (
                    <div
                      key={trip.id}
                      className={`rounded-2xl border p-5 transition-all shadow-sm flex flex-col justify-between ${
                        isTripLive
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
                            {isTripLive && (
                              <span className="animate-pulse bg-green-600 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                                🔴 LIVE IN-TRANSIT
                              </span>
                            )}
                            <Chip tone={trip.verified ? 'indigo' : 'brick'}>
                              {trip.verified ? '✔ Verified Driver' : '⏳ Unverified'}
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
                              <span>📍 Track Live</span>
                            </button>
                          </div>
                        )}

                        {/* LOAD CAPACITY BAR */}
                        <div className="bg-cream rounded-xl border border-gold/20 p-3 mb-3">
                          <div className="flex items-center justify-between text-xs font-semibold text-green-deep mb-1.5">
                            <span>📦 Space Used: {usedPct}% ({bookedKg} kg)</span>
                            <span className={free <= 0 ? 'text-red-600 font-bold' : 'text-green-700 font-bold'}>
                              {free <= 0 ? '❌ Full Capacity' : `✔ ${free} kg available`}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                usedPct >= 90
                                  ? 'bg-red-500'
                                  : usedPct >= 70
                                    ? 'bg-amber-500'
                                    : 'bg-green-600'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, usedPct))}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* FARE & TON-KM SPLIT CARD */}
                        <div className="rounded-xl bg-gold/10 border border-gold/25 p-3 mb-3">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <div>
                              <p className="text-[10.5px] font-mono text-green-soft uppercase">Total Vehicle Load Fare</p>
                              <p className="font-display font-bold text-lg text-green-deep mt-0.5">
                                ₹{(trip.total_driver_amount || trip.totalDriverAmount || (trip.pricePerKg * trip.totalKg) || 0).toLocaleString('en-IN')}
                              </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-lg bg-green-deep/10 text-green-deep font-semibold text-[11px]">
                              ⚖ Ton-Km Fair Split
                            </span>
                          </div>
                          <p className="text-[11px] text-green-soft mt-1">
                            Fair pricing: You pay strictly for your cargo weight (kg) × travel distance (km).
                          </p>
                        </div>

                        {/* PICKUP LOCATION */}
                        <div className="rounded-xl bg-cream border border-gold/20 p-3 mb-2 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 min-w-0">
                            <MapPin size={16} className="text-brick shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-green-deep">Pickup Location:</p>
                              <p className="text-xs text-green-soft truncate">{trip.pickup || trip.from}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleFocusLocation(trip, 'pickup')}
                            className="px-2.5 py-1 text-[11px] rounded-lg border border-green-deep/40 text-green-deep hover:bg-green-deep hover:text-cream transition flex items-center gap-1 font-medium cursor-pointer shrink-0"
                          >
                            <span>📦 View on Map</span>
                          </button>
                        </div>
                      </div>

                      {/* CARD ACTIONS & BOOKING STATUS */}
                      <div className="pt-3 border-t border-gold/20 mt-2">
                        {myReq ? (
                          <div className="rounded-xl bg-green-deep/5 border border-green-deep/20 p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 size={16} className="text-green-600" />
                                <span className="font-bold text-xs text-green-deep">Your Booking:</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                myReq.status === 'pending'
                                  ? 'bg-gold/20 text-soil'
                                  : myReq.status === 'accepted'
                                    ? 'bg-green-deep/10 text-green-deep'
                                    : myReq.status === 'pending_passenger_confirmation'
                                      ? 'bg-amber-500 text-white animate-pulse'
                                      : myReq.status === 'completed'
                                        ? 'bg-green-700 text-white'
                                        : 'bg-red-100 text-red-700'
                              }`}>
                                {myReq.status === 'pending_passenger_confirmation' ? 'CONFIRMATION REQUIRED' : (myReq.status || 'PENDING').toUpperCase()}
                              </span>
                            </div>

                            <div className="bg-white rounded-lg p-2 border border-gold/20 text-xs flex items-center justify-between">
                              <span className="text-green-soft">Weight: <strong>{myReq.goods_weight_kg || myReq.kg} kg</strong> · Fare Share:</span>
                              <span className="font-bold text-green-deep font-display text-sm">₹{myReq.per_person_share || 0}</span>
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
                                    rating: 5,
                                    feedback: ''
                                  });
                                }}
                                className="w-full py-2 bg-green-deep hover:bg-green text-cream font-bold text-xs rounded-xl shadow transition cursor-pointer"
                              >
                                🎉 Confirm Delivery & Rate
                              </button>
                            )}

                            {['pending', 'accepted'].includes(myReq.status) && (
                              <div className="flex justify-end pt-1">
                                <button
                                  onClick={async () => {
                                    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
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
                                  Cancel Booking
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
                              <span>{requestOpen === trip.id ? 'Close Booking Form' : 'Request Cargo Space'}</span>
                            </button>
                          </div>
                        )}

                        {/* IN-LINE EXPANDABLE REQUEST FORM */}
                        {requestOpen === trip.id && (
                          <div className="mt-4 rounded-2xl border border-gold/30 bg-cream/40 p-4 space-y-3 animate-[fadeIn_.25s_ease]">
                            <div className="flex items-center justify-between pb-2 border-b border-gold/20">
                              <h4 className="font-display font-bold text-sm text-green-deep">
                                Request Space ({trip.from} → {trip.to})
                              </h4>
                              <button onClick={() => setRequestOpen(null)} className="text-gray-500 hover:text-gray-800 cursor-pointer">
                                <X size={16} />
                              </button>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                              <Field label="Goods Category">
                                <select
                                  className={`${inputCls} py-1.5 text-xs`}
                                  value={r.category || ''}
                                  onChange={e => updateRequest(trip.id, 'category', e.target.value)}
                                >
                                  <option value="">Select goods category</option>
                                  {GOODS_CATEGORIES.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                  ))}
                                </select>
                              </Field>

                              <Field label="Goods Weight (kg)">
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

                            {/* DYNAMIC ESTIMATED FARE SHARE */}
                            {r.weight && Number(r.weight) > 0 && (
                              <div className="rounded-xl bg-gold/15 border border-gold/30 p-2.5 text-xs space-y-1">
                                <div className="flex items-center justify-between text-green-deep font-semibold">
                                  <span>Estimated Ton-Km Share:</span>
                                  <span className="font-bold font-display text-sm">
                                    ₹{Math.round(((Number(r.weight) * (trip.distance_km || 150)) / (((trip.total_kg_km || 0) + (Number(r.weight) * (trip.distance_km || 150))) || 1)) * (trip.total_driver_amount || (trip.pricePerKg * trip.totalKg) || 1000))}
                                  </span>
                                </div>
                                <p className="text-[10.5px] text-green-soft">
                                  Workload: {Number(r.weight) * (trip.distance_km || 150)} kg·km
                                </p>
                              </div>
                            )}

                            <div className="grid sm:grid-cols-2 gap-3">
                              <Field label="Your Pickup Location">
                                <LocationAutocomplete
                                  value={r.pickupLocation || ''}
                                  placeholder="Search pickup city/hub..."
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

                              <Field label="Delivery Location">
                                <LocationAutocomplete
                                  value={r.deliveryLocation || ''}
                                  placeholder="Search delivery city/hub..."
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

                            <Field label="Description (Optional)">
                              <input
                                className={`${inputCls} py-1.5 text-xs`}
                                value={r.description || ''}
                                placeholder="Special handling requirements, fragile goods..."
                                onChange={e => updateRequest(trip.id, 'description', e.target.value)}
                              />
                            </Field>

                            <button
                              onClick={() => submitRequest(trip)}
                              className="w-full py-2.5 rounded-xl bg-green-deep hover:bg-green text-cream font-bold text-xs shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Send size={14} />
                              <span>Submit Cargo Booking</span>
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
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    myBookingFilter === key
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
                    className={`rounded-2xl border p-5 transition-all shadow-sm flex flex-col justify-between ${
                      isWaitingConf
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

                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                          isPending
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
                        <p className="text-[10.5px] text-green-soft mt-0.5">
                          Workload: {req.kg_km || ((req.goods_weight_kg || req.kg || 0) * (req.distance_km || 150))} kg·km ({req.share_pct || 100}% of load pool)
                        </p>
                      </div>

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
                  try {
                    const res = await fetch(`http://localhost:8000/api/requests/${completionModal.requestId}/confirm-completion`, {
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
    vehicle: 'Mini Truck',
    total: 1000,
    cap: 600,
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
  const [arrived, setArrived] = useState(false)
  const [deliveryPhoto, setDeliveryPhoto] = useState(null)
  const [done, setDone] = useState(false)
  const [incomingRequests, setIncomingRequests] = useState([])
  const [myTrips, setMyTrips] = useState([])
  const [activeLiveTripId, setActiveLiveTripId] = useState(null)
  const liveIntervalRef = useRef(null)

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

          setActiveLiveTripId(trip.id);
          notify("✔ Trip Started! Sharing live location with all senders.");
          fetchMyTrips();

          if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);

          let step = 0;
          liveIntervalRef.current = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                let currentLat = pos.coords.latitude;
                let currentLng = pos.coords.longitude;

                // Incremental simulation step so truck moves on map even on stationary desktop
                step += 0.0005;
                currentLat += (step * 0.02);
                currentLng += (step * 0.02);

                const currentSpeed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 40;

                try {
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

  const driverCompleteTrip = async (tripId) => {

    if (!window.confirm("Mark this trip as complete? Connected passengers will be prompted to confirm delivery, view their dynamic weight-based share, and rate your service.")) {
      return;
    }
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`http://localhost:8000/api/trips/${tripId}/complete`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setActiveLiveTripId(null);
        notify("✔ Trip marked complete! Waiting for passenger delivery confirmation & rating.");
        fetchMyTrips();
        const reqRes = await fetch("http://localhost:8000/api/requests/incoming", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const reqData = await reqRes.json();
        if (reqRes.ok && Array.isArray(reqData)) {
          setIncomingRequests(reqData);
        }
      } else {
        notify("⚠ Failed to initiate trip completion.");
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
        if (res.ok) {
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
        console.error("Failed to fetch user status", err);
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

      await fetchMyTrips();
    };
    fetchStatus();
    return () => {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate('/login');
  };

  const upDoc = async (key, file) => {
    if (!file) return

    if (!checkSize(file)) return

    // Immediate local preview via object URL
    const localUrl = URL.createObjectURL(file)
    setDocs(prev => ({
      ...prev,
      [key]: {
        name: file.name,
        url: localUrl
      }
    }))

    // Persist the document to the backend so it survives page reloads
    const token = localStorage.getItem("access_token")
    const docType = key === 'identity' ? 'aadhaar' : 'license'
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('doc_type', docType)

      const res = await fetch("http://localhost:8000/auth/upload-document", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setProfile(prev => ({
          ...prev,
          aadhaar_doc: data.aadhaar_doc || prev.aadhaar_doc,
          aadhaar_doc_url: data.aadhaar_doc_url || prev.aadhaar_doc_url,
          license_doc: data.license_doc || prev.license_doc,
          license_doc_url: data.license_doc_url || prev.license_doc_url,
          is_verified: data.is_verified
        }))
        // Use the server URL/name so the preview is stable across reloads
        setDocs(prev => ({
          ...prev,
          [key]: {
            name: data.filename || file.name,
            url: data.url || localUrl
          }
        }))
        notify(`✔ ${docType === 'aadhaar' ? 'Aadhaar' : 'Driving Licence'} uploaded successfully!`)
      } else {
        notify("⚠ Could not save document to server. It is only previewed locally.")
      }
    } catch (err) {
      console.error("Failed to upload document", err)
      notify("⚠ Could not save document to server. It is only previewed locally.")
    }
  }

  const taken = Math.round(
    (1 - o.cap / o.total) * 100
  )

  const publishTrip = async () => {
    if (
      !o.from ||
      !o.to ||
      !o.date ||
      !o.pickup
    ) {
      notify('⚠ Please fill all trip details.');
      return;
    }

    // Check documents: either from local docs state or from profile (already uploaded)
    const hasIdentity = docs.identity || profile.aadhaar_doc;
    const hasLicense = docs.license || profile.license_doc;
    if (!hasIdentity || !hasLicense) {
      notify('⚠ Please upload required verification documents.');
      return;
    }
    if (!o.price || Number(o.price) <= 0) {
      notify('⚠ Please set a valid transport price.');
      return;
    }

    // STRICT LOCATION VERIFICATION: Verify with OpenStreetMap Nominatim
    notify('🔍 Verifying locations in India...');
    let fromResolved = o.fromCoords;
    if (!fromResolved) {
      fromResolved = await geocodeIndianLocation(o.from);
    }
    if (!fromResolved) {
      notify(`❌ "${o.from}" is not a valid location in India. Please enter a valid Indian city.`);
      return;
    }

    let toResolved = o.toCoords;
    if (!toResolved) {
      toResolved = await geocodeIndianLocation(o.to);
    }
    if (!toResolved) {
      notify(`❌ "${o.to}" is not a valid location in India. Please enter a valid Indian city.`);
      return;
    }

    const tripLat = fromResolved.lat;
    const tripLng = fromResolved.lng;

    // Send trip to backend
    const token = localStorage.getItem("access_token");
    try {
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
          total_kg: o.total,
          price_per_kg: Number(o.price) || 0,
          total_driver_amount: Number(o.totalDriverAmount) || Number(o.price) || 0,
          pickup: o.pickup,
          lat: tripLat,
          lng: tripLng,
          dest_lat: toResolved.lat,
          dest_lng: toResolved.lng,
          pickup_lat: tripLat,
          pickup_lng: tripLng
        })
      });

      if (res.ok) {
        setPublished(true);
        notify(`✔ Trip published: ${fromResolved.shortName} → ${toResolved.shortName}`);
        fetchMyTrips();
      } else {
        const data = await res.json();
        notify(data.detail || "Failed to publish trip.");
      }
    } catch (err) {
      console.error("Failed to publish trip", err);
      notify("Could not connect to backend.");
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
              Driver Operations Hub
            </span>
            {profile.is_verified && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 size={13} /> Verified
              </span>
            )}
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-green-deep mt-1">
            Driver & Logistics Dashboard
          </h1>
          <p className="text-sm text-green-soft mt-1">
            Manage your shared vehicle loads, review cargo requests, and track trips in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="hidden sm:block text-right">
            <p className="font-bold text-xs text-green-deep">{profile.full_name || 'Driver'}</p>
            <p className="text-[11px] text-green-soft font-mono">{profile.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-sm transition duration-200 text-xs cursor-pointer"
          >
            Logout
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
            <p className="text-[11px] font-mono text-green-soft uppercase tracking-wide">Active Trips</p>
            <p className="font-display font-bold text-2xl text-green-deep mt-0.5">{activeTripsCount}</p>
            <p className="text-[11px] text-green-soft mt-0.5">{liveTripsCount} Live In-Transit</p>
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
            <p className="text-[11px] font-mono text-green-soft uppercase tracking-wide">Incoming Requests</p>
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
            <p className="text-[11px] font-mono text-green-soft uppercase tracking-wide">Total Load Potential</p>
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
            <p className="text-[11px] font-mono text-green-soft uppercase tracking-wide">Verification</p>
            <p className="font-display font-bold text-lg text-green-deep mt-1">
              {profile.is_verified ? 'Verified Driver' : 'Pending Upload'}
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
          className={`px-5 py-3 rounded-2xl font-display font-bold text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'trips'
              ? 'bg-green-deep text-cream shadow-md'
              : 'text-green-deep hover:bg-gold/10'
          }`}
        >
          <Truck size={17} />
          <span>My Published Trips</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${activeTab === 'trips' ? 'bg-cream text-green-deep' : 'bg-green-deep/10 text-green-deep'}`}>
            {myTrips.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-5 py-3 rounded-2xl font-display font-bold text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-green-deep text-cream shadow-md'
              : 'text-green-deep hover:bg-gold/10'
          }`}
        >
          <Package size={17} />
          <span>Incoming Requests</span>
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
          className={`px-5 py-3 rounded-2xl font-display font-bold text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'publish'
              ? 'bg-green-deep text-cream shadow-md'
              : 'text-green-deep hover:bg-gold/10'
          }`}
        >
          <span>➕</span>
          <span>Offer New Trip</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-3 rounded-2xl font-display font-bold text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-green-deep text-cream shadow-md'
              : 'text-green-deep hover:bg-gold/10'
          }`}
        >
          <ShieldCheck size={17} />
          <span>Driver Profile & ID</span>
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
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    tripFilter === key
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
                    className={`rounded-2xl border p-5 transition-all shadow-sm flex flex-col justify-between ${
                      isTripLive
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

                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                          isTripLive
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
                            className={`h-full transition-all duration-500 rounded-full ${
                              usedPct >= 90
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
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    requestFilter === key
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
                    className={`rounded-2xl border p-5 transition-all shadow-sm flex flex-col justify-between ${
                      isPending
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

                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                          isPending
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
                              try {
                                const res = await fetch(
                                  `http://localhost:8000/api/requests/${req.id}/status?status=accepted`,
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
                              try {
                                const res = await fetch(
                                  `http://localhost:8000/api/requests/${req.id}/status?status=cancelled_by_driver&reason=${encodeURIComponent("The driver has rejected this request.")}`,
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
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-green-700 font-semibold flex items-center gap-1">
                            <span>✔</span>
                            <span>Accepted</span>
                          </p>
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
            <div>
              <h3 className="font-display font-bold text-xl text-green-deep">
                Publish a New Vehicle Trip
              </h3>
              <p className="text-xs text-green-soft mt-0.5">
                Fill in your route, vehicle capacity, and desired price.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="From (Origin City/Hub)">
                <LocationAutocomplete
                  value={o.from}
                  placeholder="Search starting city/hub in India..."
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

              <Field label="To (Destination City)">
                <LocationAutocomplete
                  value={o.to}
                  placeholder="Search destination city in India..."
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

              <Field label="Travel Date">
                <input
                  type="date"
                  className={inputCls}
                  value={o.date}
                  onChange={e => setO({ ...o, date: e.target.value })}
                />
              </Field>

              <Field label="Vehicle Type">
                <select
                  className={inputCls}
                  value={o.vehicle}
                  onChange={e => setO({ ...o, vehicle: e.target.value })}
                >
                  <option value="Bike">Bike / Scooter</option>
                  <option value="Auto">Auto / Rickshaw</option>
                  <option value="Pickup">Pickup</option>
                  <option value="Mini Truck">Mini Truck</option>
                  <option value="Tempo">Tempo</option>
                  <option value="Van">Van</option>
                  <option value="Truck">Truck</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
            </div>

            {/* CAPACITY SLIDERS */}
            <div className="bg-cream rounded-2xl border border-gold/30 p-4 space-y-3">
              <label className="text-sm font-semibold text-green-deep block">
                Vehicle Cargo Capacity: <span className="font-mono text-soil">{o.cap} kg free</span> / {o.total} kg total
              </label>

              <div>
                <p className="text-[11px] text-green-soft mb-1 font-mono">Total Vehicle Limit: {o.total} kg</p>
                <input
                  type="range"
                  min="50"
                  max="5000"
                  step="50"
                  value={o.total}
                  onChange={e =>
                    setO({
                      ...o,
                      total: +e.target.value,
                      cap: Math.min(o.cap, +e.target.value)
                    })
                  }
                  className="w-full accent-soil cursor-pointer"
                />
              </div>

              <div>
                <p className="text-[11px] text-green-soft mb-1 font-mono">Available Space to Share: {o.cap} kg</p>
                <input
                  type="range"
                  min="0"
                  max={o.total}
                  step="10"
                  value={o.cap}
                  onChange={e => setO({ ...o, cap: +e.target.value })}
                  className="w-full accent-gold cursor-pointer"
                />
              </div>
            </div>

            {/* PRICING & TON-KM EXPLANATION */}
            <div className="rounded-2xl border border-green-deep/30 bg-green-50/40 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="text-2xl mt-0.5">⚖</div>
                <div>
                  <p className="font-bold text-sm text-green-deep">
                    Total Desired Vehicle Load Fare (₹)
                  </p>
                  <p className="text-xs text-green-soft mt-0.5">
                    Enter the total amount you want to earn for this full trip load.
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
                ⚡ <strong>Ton-Km Fair Split:</strong> The backend automatically splits this ₹{o.price || '0'} among passengers based on their individual weight (kg) × distance (km).
              </p>
            </div>

            {/* PICKUP */}
            <Field label="Pickup Instructions / Location Details">
              <input
                className={inputCls}
                value={o.pickup}
                placeholder="e.g. Near highway toll plaza gate 2, 6:00 AM / Be on time"
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
                    {profile.is_verified || (docs.identity?.name && docs.license?.name) ? 'Driver Credentials Ready' : 'Verification Required'}
                  </p>
                  <p className="text-[11px] text-green-soft">
                    {profile.is_verified || (docs.identity?.name && docs.license?.name) ? 'Aadhaar & License uploaded' : 'Upload ID in Driver Profile tab'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="text-xs font-semibold text-green-deep underline hover:text-green cursor-pointer"
              >
                View ID Docs
              </button>
            </div>

            <Btn size="lg" onClick={publishTrip} className="w-full">
              Publish Trip Load
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
                        <div className="rounded-2xl border border-gold/30 overflow-hidden bg-cream p-3">
                          <div className="flex items-center justify-between text-[11px] text-green-soft font-mono mb-2">
                            <p className="truncate max-w-[200px] font-semibold text-green-deep">📄 {docName}</p>
                            <span className="text-green-700 font-bold">✔ Verified</span>
                          </div>
                          {isPdf ? (
                            <iframe src={docUrl} className="w-full h-36 rounded-xl border border-gold/20" title={label}></iframe>
                          ) : (
                            <img src={docUrl} alt={label} className="h-36 object-contain mx-auto rounded-xl" />
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
    </section>
  );
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState(location.state?.error || '')

  useEffect(() => {
    setLoginError(location.state?.error || '')
    if (location.state?.intent) {
      localStorage.setItem('login_intent', location.state.intent)
    }
  }, [location.state])

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    setLoginError('')
    try {
    
      const res = await fetch("http://127.0.0.1:8000/auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          google_token: credentialResponse.credential 
        })
      })

      const data = await res.json()
      
      if (res.ok) {
        const intent = location.state?.intent || localStorage.getItem('login_intent')

        if (!data.is_profile_complete) {
          localStorage.setItem("access_token", data.access_token)
          navigate('/complete-profile')
          return
        }

        // Strict intent-based login checks
        if (intent === 'find' && data.user_type === 'driver') {
          localStorage.removeItem("access_token")
          setLoginError('This account belongs to Offer a Trip (Driver). Please use a Sender account for Find a Vehicle.')
          return
        }

        if (intent === 'offer' && data.user_type !== 'driver') {
          localStorage.removeItem("access_token")
          setLoginError('This account belongs to Find a Vehicle (Sender). Please use a Driver account for Offer a Trip.')
          return
        }

        localStorage.removeItem('login_intent')
        localStorage.setItem("access_token", data.access_token)

        if (data.user_type === 'driver') {
          navigate('/offer')
        } else {
          navigate('/find')
        }
      } else {
        setLoginError(data.detail || "Google authentication failed on backend.")
      }
    } catch (err) {
      console.error("Backend error:", err)
      setLoginError("Could not connect to FastAPI backend.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <GoogleOAuthProvider clientId="985266026061-a7hpfspuv6hc17pc72camb1gig9vucqq.apps.googleusercontent.com">
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-paper p-8 rounded-2xl shadow-lg border border-gold/30 text-center">
          <h2 className="text-2xl font-display font-bold text-green-deep mb-2">Sign in to Safar-Saathi</h2>
          <p className="text-green-soft mb-4 text-sm">Choose any Google account to sign in.</p>
          
          {loginError && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {loginError}
            </div>
          )}
          
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => alert('Google Sign In Failed')}
              useOneTap={false}
              prompt="select_account"
            />
          </div>
          {loading && <p className="mt-4 text-sm text-green-soft">Logging in...</p>}
        </div>
      </div>
    </GoogleOAuthProvider>
  )
}

export function ProfileSetupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Male');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userType, setUserType] = useState('sender'); // Auto-detected
  
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [toast, notify] = useToast();

  useEffect(() => {
    // Auto-detect user role/intent based on local storage intent
    const intent = localStorage.getItem('login_intent');
    if (intent === 'offer') {
      setUserType('driver');
    } else {
      setUserType('sender');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (userType === 'driver') {
      if (!aadhaarFile || !licenseFile) {
        notify('⚠ Drivers must upload both verification documents.');
        return;
      }
    }

    setSubmitting(true);
    const token = localStorage.getItem("access_token");

    try {
      let aadhaarName = aadhaarFile ? aadhaarFile.name : null;
      let licenseName = licenseFile ? licenseFile.name : null;

      // Upload document files to backend so they are stored on disk
      if (userType === 'driver') {
        try {
          const fd1 = new FormData();
          fd1.append('file', aadhaarFile);
          fd1.append('doc_type', 'aadhaar');
          const up1 = await fetch("http://localhost:8000/auth/upload-document", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: fd1
          });
          if (up1.ok) {
            const d1 = await up1.json();
            aadhaarName = d1.filename || aadhaarName;
          }

          const fd2 = new FormData();
          fd2.append('file', licenseFile);
          fd2.append('doc_type', 'license');
          const up2 = await fetch("http://localhost:8000/auth/upload-document", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: fd2
          });
          if (up2.ok) {
            const d2 = await up2.json();
            licenseName = d2.filename || licenseName;
          }
        } catch (err) {
          console.error(err);
          notify("⚠ Document upload failed. Continuing with filename only.");
        }
      }

      const res = await fetch("http://localhost:8000/auth/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          full_name: fullName,
          gender: gender,
          phone_number: phoneNumber, 
          user_type: userType,
          aadhaar_doc: aadhaarName,
          license_doc: licenseName
        })
      });

      if (res.ok) {
        if (userType === 'driver') {
          navigate('/offer');
        } else {
          navigate('/find');
        }
      } else {
        const data = await res.json();
        notify(data.detail || "Failed to complete profile.");
      }
    } catch (err) {
      console.error(err);
      notify("Could not connect to FastAPI backend.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-12">
      {toast}
      <form onSubmit={handleSubmit} className="max-w-lg w-full bg-paper p-8 rounded-2xl shadow-lg border border-gold/30">
        <h2 className="text-2xl font-display font-bold text-green-deep mb-2">Complete Your Profile</h2>
        <p className="text-green-soft mb-6 text-sm">Please provide your details to continue to Safar-Saathi as a <strong>{userType === 'driver' ? 'Driver' : 'Sender'}</strong>.</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-green-deep mb-1">Full Name</label>
          <input 
            type="text" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            placeholder="Enter your full name" 
            className={inputCls}
            required 
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-green-deep mb-1">Gender</label>
          <select 
            value={gender} 
            onChange={(e) => setGender(e.target.value)}
            className={inputCls}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-green-deep mb-1">Phone Number</label>
          <input 
            type="text" 
            value={phoneNumber} 
            onChange={(e) => setPhoneNumber(e.target.value)} 
            placeholder="Enter 10-digit mobile number" 
            className={inputCls}
            required 
          />
        </div>

        {userType === 'driver' && (
          <div className="mb-6 p-4 rounded-xl bg-gold/10 border border-gold/30 space-y-4">
            <p className="font-semibold text-sm text-green-deep">Driver Verification Documents</p>
            
            <div>
              <label className="block text-xs font-medium text-green-deep mb-1">Aadhaar Card Document / Image [Redacted]</label>
              <input 
                type="file" 
                accept="image/*,application/pdf"
                onChange={(e) => setAadhaarFile(e.target.files[0])}
                className="text-xs text-green-soft"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-green-deep mb-1">Driving License Document / Image</label>
              <input 
                type="file" 
                accept="image/*,application/pdf"
                onChange={(e) => setLicenseFile(e.target.files[0])}
                className="text-xs text-green-soft"
                required
              />
            </div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={submitting}
          className="w-full bg-green-deep text-cream py-3 rounded-xl font-semibold hover:bg-green transition"
        >
          {submitting ? "Saving..." : "Save and Continue"}
        </button>
      </form>
    </div>
  );
}
