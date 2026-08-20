import React, { useState, useEffect, useRef } from 'react';
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
  Send
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

  const [selectedTripId, setSelectedTripId] = useState(null)
  const [requestOpen, setRequestOpen] = useState(null)
  const [requests, setRequests] = useState({})
  const [myRequests, setMyRequests] = useState([])

  // Fetch logged-in user profile details AND available trips with 3-second live polling
  useEffect(() => {
    const fetchTrips = async () => {
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
            pct: trip.pct,
            totalKg: trip.total_kg,
            pricePerKg: trip.price_per_kg,
            pickup: trip.pickup,
            lat: trip.lat,
            lng: trip.lng,
            status: trip.status || 'scheduled',
            is_live: trip.is_live || false,
            speed: trip.speed || 0
          }));
          setTrips(mappedTrips);
        }
      } catch (err) {
        console.error("Failed to fetch trips", err);
      }
    };

    const fetchData = async () => {
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

      await fetchTrips();

      try {
        const myReqRes = await fetch("http://localhost:8000/api/requests/my", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const myReqData = await myReqRes.json();
        if (myReqRes.ok && Array.isArray(myReqData)) {
          setMyRequests(myReqData);
        }
      } catch (err) {
        console.error("Failed to fetch my requests", err);
      }
    };

    fetchData();

    // 3-second live polling interval to capture real-time driver coordinates on map
    const interval = setInterval(fetchTrips, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate('/login');
  };

  const list = trips.length > 0 ? trips : TRIPS
    .filter(trip =>
      (
        !f.state ||
        trip.state === f.state
      ) &&
      (
        !f.veh ||
        trip.vehicle === f.veh
      ) &&
      (
        !f.ver ||
        trip.verified
      ) &&
      (
        !f.pickupSearch ||
        trip.pickup
          .toLowerCase()
          .includes(f.pickupSearch.toLowerCase()) ||
        trip.from
          .toLowerCase()
          .includes(f.pickupSearch.toLowerCase()) ||
        trip.to
          .toLowerCase()
          .includes(f.pickupSearch.toLowerCase())
      )
    )
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
          kg: Number(r.weight)
        })
      });

      if (res.ok) {
        notify(
          `✔ Transport request sent to ${trip.owner}`
        );
        // Add the new request locally so the UI immediately
        // shows "PENDING" status instead of "Request Space".
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
            kg: Number(r.weight)
          }
        ]);
        setRequestOpen(null);
      } else {
        const data = await res.json();
        notify(data.detail || "Failed to send request.");
      }
    } catch (err) {
      console.error("Failed to send request", err);
      notify("Could not connect to backend. Request not sent.");
    }
  }


  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      {toast}

      {/* HEADER WITH LOGOUT & USER PROFILE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-gold/30">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-green-deep">
            Find a Vehicle (Sender Dashboard)
          </h1>
          <p className="text-sm text-green-soft mt-1">
            Find vehicles with available space for your goods.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="self-start sm:self-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-md transition duration-200 text-sm"
        >
          Logout
        </button>
      </div>

      {/* LOGGED IN USER CARD */}
      <div className="mb-6 rounded-2xl bg-paper border border-gold/30 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-green-soft uppercase tracking-wide">Connected Profile</p>
            <p className="font-display font-bold text-green-deep text-base">{profile.full_name || 'User'}</p>
            <p className="text-xs text-green-soft mt-0.5">Email: {profile.email} | Phone: {profile.phone_number || 'N/A'}</p>
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
                setIsEditing(true);
              }}
              className="px-3.5 py-1.5 rounded-lg border border-green-deep text-green-deep font-semibold text-xs hover:bg-green-deep/10 transition"
            >
              Edit Details
            </button>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-deep/10 text-green-deep">
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
            className="mt-4 pt-4 border-t border-gold/20 grid sm:grid-cols-3 gap-4 items-end animate-[fadeIn_0.3s_ease]"
          >
            <div>
              <label className="block text-xs font-semibold text-green-deep mb-1">Full Name</label>
              <input
                type="text"
                value={editForm.full_name}
                onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                className={`${inputCls} py-1 px-3 text-xs`}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-green-deep mb-1">Phone Number</label>
              <input
                type="text"
                value={editForm.phone_number}
                onChange={e => setEditForm({ ...editForm, phone_number: e.target.value })}
                className={`${inputCls} py-1 px-3 text-xs`}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-green-deep mb-1">Gender</label>
              <select
                value={editForm.gender}
                onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                className={`${inputCls} py-1 px-3 text-xs`}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-green-deep text-cream font-semibold text-xs rounded-lg hover:bg-green transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>


      {/* PICKUP LOCATION SEARCH */}

      <div className="mt-6">
        <div className="relative">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-green-soft"
          />

          <input
            value={f.pickupSearch}
            onChange={e =>
              setF({
                ...f,
                pickupSearch: e.target.value
              })
            }
            placeholder="Search by pickup location or city..."
            className="w-full rounded-xl border border-gold/40 bg-paper pl-11 pr-4 py-3 outline-none focus:border-green-deep"
          />
        </div>
      </div>


      {/* FILTERS */}

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <select
          className={inputCls}
          value={f.state}
          onChange={e =>
            setF({
              ...f,
              state: e.target.value
            })
          }
        >
          <option value="">
            All States
          </option>

          <option>Uttar Pradesh</option>
          <option>Maharashtra</option>
          <option>Delhi</option>
          <option>Karnataka</option>
        </select>


        <select
          className={inputCls}
          value={f.veh}
          onChange={e =>
            setF({
              ...f,
              veh: e.target.value
            })
          }
        >
          <option value="">
            All Vehicles
          </option>

          <option value="Bike">Bike</option>
          <option value="Pickup">Pickup</option>
          <option value="Mini Truck">Mini Truck</option>
          <option value="Tempo">Tempo</option>
          <option value="Truck">Truck</option>
        </select>


        <select
          className={inputCls}
          value={f.sort}
          onChange={e =>
            setF({
              ...f,
              sort: e.target.value
            })
          }
        >
          <option value="free">
            Most Free Space
          </option>

          <option value="date">
            Earliest Date
          </option>
        </select>


        <label className="flex items-center gap-2 rounded-xl border border-gold/40 px-3 py-2 text-sm cursor-pointer bg-paper">
          <input
            type="checkbox"
            className="accent-green-deep w-4 h-4"
            checked={f.ver}
            onChange={e =>
              setF({
                ...f,
                ver: e.target.checked
              })
            }
          />

          Verified Only
        </label>
      </div>


      {/* MAIN CONTENT */}

      <div className="mt-6 grid lg:grid-cols-5 gap-6">

        {/* LEFT VEHICLE LIST */}

        <div className="lg:col-span-3 flex flex-col gap-4">
          {list.map(trip => {
            const free = Math.round(
              trip.totalKg *
              (1 - trip.pct / 100)
            )

            const r = requests[trip.id] || {}
            const myReq = myRequests.find(
              req =>
                req.owner === trip.owner &&
                req.route === `${trip.from} → ${trip.to}`
            )

            return (
              <div
                key={trip.id}
                className="spot rounded-2xl border border-gold/30 bg-paper p-5 shadow-sm"
              >
                <div className="flex gap-4">
                  <SackGauge fill={trip.pct}>
                    <Truck
                      size={20}
                      className="text-green-deep"
                    />
                  </SackGauge>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-display font-semibold text-lg">
                          {trip.from}
                          {' → '}
                          {trip.to}
                        </p>

                        <p className="text-xs font-mono text-green-soft">
                          {trip.date}
                          {' · '}
                          {trip.vehicle}
                          {' · '}
                          {trip.state}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {(trip.status === 'in_transit' || trip.is_live) && (
                          <span className="animate-pulse bg-green-600 text-white font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                            🔴 LIVE IN-TRANSIT
                          </span>
                        )}
                        <Chip
                          tone={
                            trip.verified
                              ? 'indigo'
                              : 'brick'
                          }
                        >
                          {trip.verified
                            ? '✔ Verified Owner'
                            : '⏳ Verification Pending'
                          }
                        </Chip>
                      </div>
                    </div>

                    {(trip.status === 'in_transit' || trip.is_live) && (
                      <div className="mt-2 rounded-xl bg-green-50 border border-green-300 p-2.5 flex items-center justify-between">
                        <div className="text-xs text-green-800 font-medium">
                          📍 Driver is currently live on route! Speed: {trip.speed || 35} km/h
                        </div>
                        <button
                          onClick={() => fly(trip.id)}
                          className="px-3 py-1 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                        >
                          📍 Track Live
                        </button>
                      </div>
                    )}


                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="rounded-xl bg-cream p-3">
                        <p className="text-[11px] font-mono text-green-soft">
                          Space Used
                        </p>

                        <p className="font-display font-bold">
                          {trip.pct}%
                        </p>
                      </div>

                      <div className="rounded-xl bg-cream p-3">
                        <p className="text-[11px] font-mono text-green-soft">
                          Available Space
                        </p>

                        <p className="font-display font-bold">
                          {free} kg
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-gold/10 border border-gold/30 p-3 mt-3">
                      <p className="text-[11px] font-mono text-green-soft">
                        Driver's Price
                      </p>  
                      <p className="font-display font-bold text-lg text-green-deep">
                        ₹{trip.pricePerKg} / kg
                      </p>
                    </div>

                    <p className="text-xs text-green-soft mt-3">
                      👤 {trip.owner}
                    </p>
                  </div>
                </div>


                {/* PICKUP + REQUEST BOX */}

                <div className="mt-5 pt-4 border-t border-gold/20">
                  <div className="grid sm:grid-cols-2 gap-3">

                    {/* PICKUP LOCATION */}

                    <div className="rounded-xl border border-gold/30 bg-cream p-4">
                      <div className="flex items-start gap-3">
                        <MapPin
                          size={20}
                          className="text-brick shrink-0 mt-0.5"
                        />

                        <div>
                          <p className="font-semibold text-sm">
                            Pickup Location
                          </p>

                          <p className="text-xs text-green-soft mt-1">
                            {trip.pickup}
                          </p>

                          <button
                            onClick={() => fly(trip.id)}
                            className="mt-3 text-xs rounded-lg border border-green-deep/40 px-3 py-1.5 hover:bg-green-deep hover:text-cream transition-colors"
                          >
                            View on Map
                          </button>
                        </div>
                      </div>
                    </div>


                    {/* REQUEST SPACE */}

                    <div className="rounded-xl border border-green-deep/20 bg-green-deep/5 p-4 flex flex-col justify-between">
                      {myReq ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2
                              size={19}
                              className="text-green-soft"
                            />

                            <p className="font-semibold text-sm">
                              Request Status
                            </p>
                          </div>

                          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                            myReq.status === 'pending'
                              ? 'bg-gold/20 text-soil'
                              : myReq.status === 'accepted'
                                ? 'bg-green-deep/10 text-green-deep'
                                : 'bg-red-100 text-red-700'
                          }`}>
                            {myReq.status
                              ? myReq.status.toUpperCase()
                              : 'PENDING'
                            }
                          </span>

                          <p className="text-xs text-green-soft mt-2">
                            {myReq.status === 'accepted'
                              ? '✔ Your request has been accepted by the captain.'
                              : myReq.status === 'pending'
                                ? '⏳ Waiting for the captain to accept.'
                                : '✖ This request was cancelled.'
                            }
                          </p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <div className="flex items-center gap-2">
                              <Package
                                size={19}
                                className="text-green-deep"
                              />

                              <p className="font-semibold text-sm">
                                Need Transport Space?
                              </p>
                            </div>

                            <p className="text-xs text-green-soft mt-2">
                              Send your goods details directly to the vehicle owner.
                            </p>
                          </div>

                          <button
                            onClick={() => openRequest(trip)}
                            className="mt-4 text-sm rounded-lg bg-green-deep text-cream px-4 py-2 hover:bg-green transition-colors"
                          >
                            {requestOpen === trip.id
                              ? 'Close Request'
                              : 'Request Space'
                            }
                          </button>
                        </>
                      )}
                    </div>
                  </div>


                  {/* REQUEST FORM */}

                  {requestOpen === trip.id && (
                    <div className="mt-4 rounded-2xl border border-indigo/30 bg-white p-5 animate-[fadeIn_.3s_ease]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-display font-bold text-lg">
                            Request Transport
                          </h3>

                          <p className="text-xs text-green-soft mt-1">
                            {trip.from}
                            {' → '}
                            {trip.to}
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            setRequestOpen(null)
                          }
                          className="p-1.5 rounded-lg hover:bg-cream"
                        >
                          <X size={18} />
                        </button>
                      </div>


                      <div className="grid sm:grid-cols-2 gap-4 mt-5">

                        {/* GOODS CATEGORY */}

                        <Field label="Goods Category">
                          <select
                            className={inputCls}
                            value={r.category || ''}
                            onChange={e =>
                              updateRequest(
                                trip.id,
                                'category',
                                e.target.value
                              )
                            }
                          >
                            <option value="">
                              Select goods category
                            </option>

                            {GOODS_CATEGORIES.map(category => (
                              <option
                                key={category}
                                value={category}
                              >
                                {category}
                              </option>
                            ))}
                          </select>
                        </Field>


                        {/* WEIGHT */}

                        <Field label="Goods Weight (kg)">
                          <input
                            type="number"
                            min="1"
                            max={free}
                            className={inputCls}
                            value={r.weight || ''}
                            placeholder={`Maximum ${free} kg`}
                            onChange={e =>
                              updateRequest(
                                trip.id,
                                'weight',
                                e.target.value
                              )
                            }
                          />
                        </Field>


                        {/* USER PICKUP */}

                        <Field label="Your Pickup Location">
                          <LocationAutocomplete
                            value={r.pickupLocation || ''}
                            placeholder="Search pickup city/hub in India..."
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


                        {/* DELIVERY */}

                        <Field label="Delivery Location">
                          <LocationAutocomplete
                            value={r.deliveryLocation || ''}
                            placeholder="Search delivery city/hub in India..."
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


                      {/* DESCRIPTION */}

                      <div className="mt-4">
                        <Field label="Goods Description (Optional)">
                          <textarea
                            className={inputCls}
                            rows="3"
                            value={r.description || ''}
                            placeholder="Describe your goods, quantity or special handling requirements..."
                            onChange={e =>
                              updateRequest(
                                trip.id,
                                'description',
                                e.target.value
                              )
                            }
                          />
                        </Field>
                      </div>


                      {/* GOODS PHOTO */}

                      <div className="mt-4">
                        <label className="flex items-center justify-between gap-3 border-2 border-dashed border-gold/50 rounded-xl px-4 py-4 cursor-pointer hover:bg-paper transition">
                          <span className="font-semibold text-sm flex items-center gap-2">
                            {r.photo ? (
                              <CheckCircle2
                                size={17}
                                className="text-green-soft"
                              />
                            ) : (
                              <Camera
                                size={17}
                                className="text-gold"
                              />
                            )}

                            Goods Photo
                          </span>

                          <span className="text-xs text-green-soft truncate max-w-[140px]">
                            {r.photo
                              ? r.photo.name
                              : 'Upload photo (optional)'
                            }
                          </span>

                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={e => {
                              const file = e.target.files[0]

                              if (!file) return
                              if (!checkSize(file)) return

                              updateRequest(
                                trip.id,
                                'photo',
                                file
                              )
                            }}
                          />
                        </label>
                      </div>


                      <button
                        onClick={() =>
                          submitRequest(trip)
                        }
                        className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-green-deep text-cream px-4 py-3 font-semibold hover:bg-green transition"
                      >
                        <Send size={17} />

                        Send Transport Request
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}


          {!list.length && (
            <div className="text-sm text-green-soft border border-dashed border-gold/40 rounded-2xl p-10 text-center">
              <Truck
                size={35}
                className="mx-auto mb-3 opacity-50"
              />

              No vehicles found for this location.
            </div>
          )}
        </div>


        {/* RIGHT MAP */}

        <div className="lg:col-span-2">
            <div className="relative rounded-2xl overflow-hidden border border-gold/30 shadow-md bg-paper">
              <div>
                <Maps
                  mode="findVehicle"
                  trips={list}
                  selectedTripId={requestOpen || selectedTripId}
                  activeRequest={requestOpen && requests[requestOpen] ? requests[requestOpen] : (selectedTripId && requests[selectedTripId] ? requests[selectedTripId] : null)}
                  onTripSelect={trip => {
                    setSelectedTripId(trip.id)
                  }}
                />
              </div>

              <div className="bg-paper border-t border-gold/20 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-xs text-green-deep">
                    Interactive Route Map
                  </p>
                  <p className="text-[11px] text-green-soft">
                    {requestOpen ? 'Showing live driving route for selected vehicle' : 'Click "Request Space" on any vehicle to view its driving route'}
                  </p>
                </div>

                <button
                  onClick={() => navigate('/maps')}
                  className="px-3 py-1.5 bg-green-deep hover:bg-green text-cream text-xs font-semibold rounded-xl shadow transition flex items-center gap-1"
                >
                  <span>Full Map</span>
                  <span>↗</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-green-soft mt-2 font-mono text-center">
              Zoom and pan the map to explore road routes and pickup points across India.
            </p>

          </div>
        </div>
    </section>
  )
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
        // Remove completed trips from "My Published Trips"
        const activeTrips = data.filter(t => t.status !== 'completed');
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

  const stopLiveTrip = async (tripId) => {
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`http://localhost:8000/api/trips/${tripId}/status?status=completed`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setActiveLiveTripId(null);
        notify("✔ Trip completed! Live location sharing stopped.");
        fetchMyTrips();
      }
    } catch (err) {
      console.error("Failed to stop live trip", err);
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
          price_per_kg: Number(o.price),
          pickup: o.pickup,
          lat: tripLat,
          lng: tripLng
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
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      {toast}

      {/* HEADER WITH LOGOUT & DRIVER PROFILE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-gold/30">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-green-deep">
            Offer a Trip (Driver Dashboard)
          </h1>
          <p className="text-sm text-green-soft mt-1">
            Share your vehicle's available space and earn from your journey.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="self-start sm:self-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-md transition duration-200 text-sm"
        >
          Logout
        </button>
      </div>

      {/* LOGGED IN DRIVER CARD */}
      <div className="mb-6 rounded-2xl bg-paper border border-gold/30 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-green-soft uppercase tracking-wide">Connected Driver Profile</p>
            <p className="font-display font-bold text-green-deep text-base">{profile.full_name || 'Driver'}</p>
            <p className="text-xs text-green-soft mt-0.5">Email: {profile.email} | Phone: {profile.phone_number || 'N/A'}</p>
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
                setIsEditing(true);
              }}
              className="px-3.5 py-1.5 rounded-lg border border-green-deep text-green-deep font-semibold text-xs hover:bg-green-deep/10 transition"
            >
              Edit Details
            </button>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${profile.is_verified ? 'bg-green-deep/10 text-green-deep' : 'bg-gold/20 text-soil'}`}>
              {profile.is_verified ? '✔ Driver Verified' : '⏳ Verification Pending'}
            </span>
          </div>
        </div>

        {/* IN-LINE EDITING DRIVER PROFILE FORM */}
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
            className="mt-4 pt-4 border-t border-gold/20 space-y-4 animate-[fadeIn_0.3s_ease]"
          >
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-green-deep mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                  className={`${inputCls} py-1 px-3 text-xs`}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-green-deep mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone_number}
                  onChange={e => setEditForm({ ...editForm, phone_number: e.target.value })}
                  className={`${inputCls} py-1 px-3 text-xs`}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-green-deep mb-1">Gender</label>
                <select
                  value={editForm.gender}
                  onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                  className={`${inputCls} py-1 px-3 text-xs`}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-green-deep mb-1">Aadhaar Card Document / Image Name</label>
                <input
                  type="text"
                  placeholder="e.g. aadhaar.pdf"
                  value={editForm.aadhaar_doc}
                  onChange={e => setEditForm({ ...editForm, aadhaar_doc: e.target.value })}
                  className={`${inputCls} py-1 px-3 text-xs`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-green-deep mb-1">Driving Licence Document / Image Name</label>
                <input
                  type="text"
                  placeholder="e.g. license.pdf"
                  value={editForm.license_doc}
                  onChange={e => setEditForm({ ...editForm, license_doc: e.target.value })}
                  className={`${inputCls} py-1 px-3 text-xs`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-green-deep text-cream font-semibold text-xs rounded-lg hover:bg-green transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* VERIFICATION DOCUMENTS STATUS */}
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl bg-cream border border-gold/30 p-3">
            <p className="text-[11px] font-mono text-green-soft uppercase tracking-wide">Aadhaar Card</p>
            <p className="font-semibold text-sm mt-1 flex items-center gap-2">
              {profile.aadhaar_doc ? (
                <>
                  <CheckCircle2 size={15} className="text-green-soft" />
                  <span className="truncate">{profile.aadhaar_doc}</span>
                </>
              ) : (
                <span className="text-green-soft">Not uploaded</span>
              )}
            </p>
          </div>

          <div className="rounded-xl bg-cream border border-gold/30 p-3">
            <p className="text-[11px] font-mono text-green-soft uppercase tracking-wide">Driving License</p>
            <p className="font-semibold text-sm mt-1 flex items-center gap-2">
              {profile.license_doc ? (
                <>
                  <CheckCircle2 size={15} className="text-green-soft" />
                  <span className="truncate">{profile.license_doc}</span>
                </>
              ) : (
                <span className="text-green-soft">Not uploaded</span>
              )}
            </p>
          </div>
        </div>
      </div>


      {/* INCOMING TRANSPORT REQUESTS PANEL */}
      {incomingRequests.length > 0 && (
        <div className="mt-6 rounded-2xl bg-paper border border-gold/30 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Package size={18} className="text-green-soft" />
                Incoming Transport Requests
              </h3>
              <p className="text-xs text-green-soft mt-1">
                Senders have requested space in your published trips.
              </p>
            </div>
            <Chip tone="indigo">
              {incomingRequests.length} Request{incomingRequests.length !== 1 ? 's' : ''}
            </Chip>
          </div>

          <div className="flex flex-col gap-3">
            {incomingRequests.map(req => (
              <div key={req.id} className="rounded-xl border border-gold/30 bg-cream p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">
                      {req.route || 'Trip Route'}
                    </p>
                    <p className="text-xs text-green-soft mt-1">
                      👤 {req.farmer_name} · 🚚 {req.vehicle || 'Vehicle'} · ⚖ {req.kg} kg
                    </p>
                    <p className="text-xs text-green-soft mt-1">
                      Owner: {req.owner}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      req.status === 'pending'
                        ? 'bg-gold/20 text-soil'
                        : req.status === 'accepted'
                          ? 'bg-green-deep/10 text-green-deep'
                          : 'bg-red-100 text-red-700'
                    }`}>
                      {req.status ? req.status.toUpperCase() : 'PENDING'}
                    </span>
                  </div>
                </div>

                {req.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={async () => {
                        const token = localStorage.getItem("access_token");
                        try {
                          const res = await fetch(
                            `http://localhost:8000/api/requests/${req.id}/status?status=accepted`,
                            {
                              method: "PUT",
                              headers: {
                                "Authorization": `Bearer ${token}`
                              }
                            }
                          );
                          if (res.ok) {
                            notify(`✔ Accepted request from ${req.farmer_name}`);
                            // Refresh the list
                            const reqRes = await fetch(
                              "http://localhost:8000/api/requests/incoming",
                              { headers: { "Authorization": `Bearer ${token}` } }
                            );
                            const reqData = await reqRes.json();
                            if (reqRes.ok && Array.isArray(reqData)) {
                              setIncomingRequests(reqData);
                            }
                          } else {
                            notify("⚠ Failed to accept request.");
                          }
                        } catch (err) {
                          notify("Could not connect to backend.");
                        }
                      }}
                      className="px-3 py-1.5 bg-green-deep text-cream font-semibold text-xs rounded-lg hover:bg-green transition"
                    >
                      Accept
                    </button>
                    <button
                      onClick={async () => {
                        const token = localStorage.getItem("access_token");
                        try {
                          const res = await fetch(
                            `http://localhost:8000/api/requests/${req.id}/status?status=cancelled`,
                            {
                              method: "PUT",
                              headers: {
                                "Authorization": `Bearer ${token}`
                              }
                            }
                          );
                          if (res.ok) {
                            notify(`✖ Rejected request from ${req.farmer_name}`);
                            // Refresh the list
                            const reqRes = await fetch(
                              "http://localhost:8000/api/requests/incoming",
                              { headers: { "Authorization": `Bearer ${token}` } }
                            );
                            const reqData = await reqRes.json();
                            if (reqRes.ok && Array.isArray(reqData)) {
                              setIncomingRequests(reqData);
                            }
                          } else {
                            notify("⚠ Failed to reject request.");
                          }
                        } catch (err) {
                          notify("Could not connect to backend.");
                        }
                      }}
                      className="px-3 py-1.5 bg-red-600 text-white font-semibold text-xs rounded-lg hover:bg-red-700 transition"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {req.status === 'accepted' && (
                  <p className="mt-2 text-xs text-green-soft font-medium">
                    ✔ You have accepted this transport request.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}


      {/* MY PUBLISHED TRIPS & LIVE LOCATION CONTROL PANEL */}
      {myTrips.length > 0 && (
        <div className="mt-6 rounded-2xl bg-paper border border-gold/30 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-display font-bold text-lg flex items-center gap-2 text-green-deep">
                <Truck size={20} className="text-green-deep" />
                My Published Trips & Live Location Control
              </h3>
              <p className="text-xs text-green-soft mt-1">
                You must enable live location sharing when you start a trip so senders can track your actual location.
              </p>
            </div>
            <Chip tone="indigo">
              {myTrips.length} Trip{myTrips.length !== 1 ? 's' : ''}
            </Chip>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {myTrips.map(trip => {
              const isTripLive = trip.id === activeLiveTripId || trip.status === 'in_transit' || trip.is_live;
              return (
                <div key={trip.id} className={`rounded-xl border p-4 transition-all ${isTripLive ? 'bg-green-50 border-green-400 shadow-md' : 'bg-cream border-gold/30'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display font-bold text-base text-green-deep">
                        {trip.from_loc || trip.from} → {trip.to_loc || trip.to}
                      </p>
                      <p className="text-xs text-green-soft font-mono mt-0.5">
                        📅 {trip.date} · 🚛 {trip.vehicle} · ⚖ {trip.total_kg || trip.totalKg} kg
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isTripLive ? 'bg-green-600 text-white animate-pulse' : 'bg-gray-200 text-gray-700'}`}>
                      {isTripLive ? '🔴 IN-TRANSIT' : (trip.status || 'SCHEDULED').toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gold/20 flex items-center justify-between gap-2">
                    {!isTripLive ? (
                      <button
                        onClick={() => startLiveTrip(trip)}
                        className="w-full py-2.5 bg-green-deep hover:bg-green text-cream font-semibold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
                      >
                        <MapPin size={16} />
                        Start Trip & Share Live Location
                      </button>
                    ) : (
                      <div className="w-full space-y-2">
                        <div className="text-xs text-green-800 font-semibold bg-green-100 p-2 rounded-lg flex items-center justify-between">
                          <span>📡 Live GPS Active ({trip.speed || 35} km/h)</span>
                          <span className="w-2.5 h-2.5 rounded-full bg-green-600 animate-ping"></span>
                        </div>
                        <button
                          onClick={() => stopLiveTrip(trip.id)}
                          className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow transition"
                        >
                          Complete Trip & Stop Sharing Location
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      <div className="mt-6 grid lg:grid-cols-2 gap-8">

        {/* FORM */}

        <form
          className="flex flex-col gap-4"
          onSubmit={e => e.preventDefault()}
        >
          <div className="grid sm:grid-cols-2 gap-4">

            <Field label="From">
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


            <Field label="To">
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
                onChange={e =>
                  setO({
                    ...o,
                    date: e.target.value
                  })
                }
              />
            </Field>


            <Field label="Vehicle Type">
              <select
                className={inputCls}
                value={o.vehicle}
                onChange={e =>
                  setO({
                    ...o,
                    vehicle: e.target.value
                  })
                }
              >
                <option value="Bike">
                  Bike / Scooter
                </option>

                <option value="Auto">
                  Auto / Rickshaw
                </option>

                <option value="Pickup">
                  Pickup
                </option>

                <option value="Mini Truck">
                  Mini Truck
                </option>

                <option value="Tempo">
                  Tempo
                </option>

                <option value="Van">
                  Van
                </option>

                <option value="Truck">
                  Truck
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </Field>
          </div>


          {/* CAPACITY */}

          <div>
            <label className="text-sm font-medium block mb-2">
              Available Capacity
              {' — '}

              <span className="font-mono">
                {o.cap} kg
              </span>

              {' of '}

              <span className="font-mono">
                {o.total} kg
              </span>
            </label>

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
                  cap: Math.min(
                    o.cap,
                    +e.target.value
                  )
                })
              }
              className="w-full accent-soil"
            />

            <input
              type="range"
              min="0"
              max={o.total}
              step="10"
              value={o.cap}
              onChange={e =>
                setO({
                  ...o,
                  cap: +e.target.value
                })
              }
              className="w-full accent-gold mt-2"
            />
          </div>

          {/* PRICING */}

          <div>

            <span className="text-sm font-medium block mb-2">
              Transport Pricing
            </span>

            <div className="rounded-xl border border-green-deep bg-paper p-4">

              <div className="flex items-start gap-3">

                <div className="mt-1 text-xl">
                  ₹
                </div>

                <div className="flex-1">

                  <p className="font-semibold">
                    Driver Sets the Price
                  </p>

                  <p className="text-xs text-green-soft mt-1">
                    Set the total price you want to charge for transporting the goods.
                  </p>

                </div>

              </div>

              <div className="mt-4">

                <label className="text-sm font-medium block mb-1">
                  Transport Price
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-green-deep">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="1"
                    value={o.price}
                    placeholder="Enter transport price"
                    className={`${inputCls} pl-9`}
                    onChange={e =>
                      setO({
                        ...o,
                        price: e.target.value
                      })
                    }
                  />

                </div>

                <p className="text-xs text-green-soft mt-2">
                  This price will be shown to users requesting space in your vehicle.
                </p>

              </div>

            </div>

          </div>


          {/* PICKUP */}

          <Field label="Pickup Instructions / Location">
            <input
              className={inputCls}
              value={o.pickup}
              placeholder="e.g. Near highway toll plaza gate 2, 6:00 AM / Be on time"
              onChange={e =>
                setO(prev => ({
                  ...prev,
                  pickup: e.target.value
                }))
              }
            />
          </Field>


          {/* VERIFICATION */}

          <div className="border-t border-gold/20 pt-4">
            <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-3">
              <CheckCircle2
                size={18}
                className="text-green-soft"
              />
              Vehicle Owner Verification (Aadhaar & Driving Licence)
            </h3>

            {/* DRIVER VERIFICATION STATUS BANNER */}
            <div className={`p-4 rounded-2xl border mb-4 flex items-start justify-between gap-3 ${profile.is_verified || (docs.identity?.name && docs.license?.name) ? 'bg-green-50 border-green-500 text-green-950 shadow-sm' : 'bg-amber-50 border-amber-300 text-amber-950'}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">
                  {profile.is_verified || (docs.identity?.name && docs.license?.name) ? '🛡️' : '⏳'}
                </span>
                <div>
                  <h4 className="font-bold text-sm flex items-center gap-1.5">
                    {profile.is_verified || (docs.identity?.name && docs.license?.name) ? (
                      <>
                        <span>Govt. ID & Driving License Verified</span>
                        <span className="text-xs bg-green-600 text-white font-bold px-2 py-0.5 rounded-full">✔ VERIFIED</span>
                      </>
                    ) : (
                      <>
                        <span>Verification Pending</span>
                        <span className="text-xs bg-amber-600 text-white font-bold px-2 py-0.5 rounded-full">ACTION REQUIRED</span>
                      </>
                    )}
                  </h4>
                  <p className="text-xs mt-1 text-gray-700">
                    {profile.is_verified || (docs.identity?.name && docs.license?.name) ? (
                      'Your Aadhaar and Driving License documents are verified. All your published trips will display the official "Verified Driver" badge.'
                    ) : (
                      'Please upload both your Aadhaar Card and Driving License below to get verified and unlock verified trip publishing.'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                ['identity', 'Identity Proof (Aadhaar Card)', profile.aadhaar_doc, profile.aadhaar_doc_url],
                ['license', 'Driving License', profile.license_doc, profile.license_doc_url]
              ].map(([key, label, profileName, profileUrl]) => {
                const docName = docs[key]?.name || profileName || '';
                const docUrl = docs[key]?.url || profileUrl || null;
                const isPdf = docName.toLowerCase().endsWith('.pdf');
                const isDocVerified = !!docName;

                return (
                  <div key={key} className="space-y-2">
                    <label
                      className={`flex items-center justify-between gap-3 border-2 border-dashed rounded-xl px-4 py-4 cursor-pointer hover:bg-cream transition ${isDocVerified ? 'border-green-500 bg-green-50/40' : 'border-gold/50'}`}
                    >
                      <span className="font-semibold text-sm flex items-center gap-2">
                        {isDocVerified ? (
                          <CheckCircle2
                            size={16}
                            className="text-green-600"
                          />
                        ) : (
                          <Upload
                            size={16}
                            className="text-gold"
                          />
                        )}

                        {label}
                      </span>

                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDocVerified ? 'bg-green-100 text-green-800' : 'text-green-soft'}`}>
                        {isDocVerified ? '✔ Verified' : 'Upload'}
                      </span>

                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={e =>
                          upDoc(
                            key,
                            e.target.files[0]
                          )
                        }
                      />
                    </label>

                    {docUrl && (
                      <div className="rounded-xl border border-gold/30 overflow-hidden bg-cream p-2">
                        <div className="flex items-center justify-between text-[11px] text-green-soft font-mono mb-1">
                          <p className="truncate max-w-[200px] font-semibold text-green-deep">📄 {docName}</p>
                          <span className="text-green-700 font-bold">✔ Verified</span>
                        </div>
                        {isPdf ? (
                          <iframe src={docUrl} className="w-full h-32 rounded border border-gold/20 animate-[fadeIn_0.3s_ease]" title={label}></iframe>
                        ) : (
                          <img src={docUrl} alt={label} className="h-32 object-contain mx-auto rounded animate-[fadeIn_0.3s_ease]" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>


          <Btn
            size="lg"
            onClick={publishTrip}
          >
            Publish Trip
          </Btn>
        </form>


        {/* RIGHT SIDE */}

        <div className="lg:sticky lg:top-24 h-fit space-y-4">
          <p className="text-xs font-mono uppercase tracking-wide text-green-soft">
            Live Trip Preview
          </p>


          <div className="spot rounded-2xl border border-gold/30 bg-paper p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <SackGauge
                fill={taken}
                size={48}
              >
                <Truck
                  size={18}
                  className="text-green-deep"
                />
              </SackGauge>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display font-semibold">
                    {o.from || 'From'}
                    {' → '}
                    {o.to || 'To'}
                  </p>

                  <Chip tone="indigo">
                    {published
                      ? '✔ Published'
                      : 'Draft'
                    }
                  </Chip>
                </div>

                <p className="text-xs text-green-soft mt-1">
                  {o.date || 'Select date'}
                  {' · '}
                  {o.vehicle}
                </p>
              </div>
            </div>


            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-xl bg-cream p-3">
                <p className="text-[11px] font-mono text-green-soft">
                  Capacity Used
                </p>

                <p className="font-display font-bold text-lg">
                  {taken}%
                </p>
              </div>

              <div className="rounded-xl bg-cream p-3">
                <p className="text-[11px] font-mono text-green-soft">
                  Available Space
                </p>

                <p className="font-display font-bold text-lg">
                  {o.cap} kg
                </p>
              </div>
            </div>


            <div className="mt-4 rounded-xl border border-gold/30 bg-cream p-4">
              <p className="text-[11px] font-mono text-green-soft uppercase tracking-wide">
                Transport Price
              </p>

              <p className="font-display font-bold text-2xl text-green-deep mt-1">
                {o.price
                  ? `₹${Number(o.price).toLocaleString('en-IN')}`
                  : 'Price not set'
                }
              </p>

              <p className="text-xs text-green-soft mt-1">
                Set by vehicle owner
              </p>
            </div>
          </div>


          {/* DRIVER / DELIVERY PANEL */}

          {published && (
            <div className="rounded-2xl bg-green-deep text-cream p-5 shadow-lg space-y-4">
              <p className="font-mono text-gold-light text-xs">
                DRIVER DELIVERY PANEL
              </p>

              <h3 className="font-display text-xl font-bold">
                {o.from} → {o.to}
              </h3>


              {done ? (
                <div className="bg-cream/10 rounded-xl p-4">
                  <p className="font-semibold flex items-center gap-2">
                    <CheckCircle2
                      size={18}
                      className="text-gold-light"
                    />

                    Delivery Completed Successfully
                  </p>

                  <p className="text-xs text-cream/70 mt-2">
                    Delivery proof:
                    {' '}
                    {deliveryPhoto?.name}
                  </p>
                </div>
              ) : !arrived ? (
                <Btn
                  variant="gold"
                  className="w-full"
                  onClick={() => {
                    setArrived(true)

                    notify(
                      '📍 Driver marked destination reached.'
                    )
                  }}
                >
                  <MapPin size={18} />

                  Mark Destination Reached
                </Btn>
              ) : (
                <div className="bg-cream text-green-deep rounded-xl p-4 space-y-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <Camera
                      size={18}
                      className="text-brick"
                    />

                    Upload Delivery Proof
                  </h4>


                  <label className="flex items-center justify-between gap-3 border-2 border-dashed border-gold/60 rounded-xl px-4 py-4 cursor-pointer hover:bg-paper transition">
                    <span className="font-semibold flex items-center gap-2">
                      {deliveryPhoto ? (
                        <CheckCircle2
                          size={18}
                          className="text-green-soft"
                        />
                      ) : (
                        <Camera
                          size={18}
                          className="text-gold"
                        />
                      )}

                      Delivery Photo
                    </span>

                    <span className="text-xs text-green-soft">
                      {deliveryPhoto?.name ||
                        'Capture / Upload'
                      }
                    </span>

                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      capture="environment"
                      onChange={e => {
                        const file = e.target.files[0]

                        if (!file) return
                        if (!checkSize(file)) return

                        setDeliveryPhoto({
                          name: file.name,
                          url: URL.createObjectURL(file)
                        })
                      }}
                    />
                  </label>


                  {deliveryPhoto?.url && (
                    <img
                      src={deliveryPhoto.url}
                      alt="delivery proof"
                      className="h-32 rounded-lg border border-gold/40 object-cover"
                    />
                  )}


                  <Btn
                    className="w-full"
                    disabled={!deliveryPhoto}
                    onClick={() => {
                      setDone(true)

                      notify(
                        '✔ Delivery completed successfully.'
                      )
                    }}
                  >
                    Complete Delivery
                  </Btn>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
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
