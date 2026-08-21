import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export const inputCls = 'w-full rounded-xl border border-gold/40 bg-paper px-3 py-2.5 text-sm outline-none transition focus:border-green-deep focus:ring-2 focus:ring-green-soft/30'

export function Btn({ to, variant = 'primary', size = 'md', className = '', children, ...rest }) {
  const base = 'inline-flex items-center justify-center gap-2 font-display font-semibold rounded-xl transition-all duration-200 active:translate-y-px focus:outline-none focus-visible:ring-2 ring-offset-2'
  const variants = {
    primary: 'bg-green-deep text-cream hover:bg-green shadow-sm ring-green-deep',
    gold: 'bg-gold text-green-deep hover:bg-gold-light shadow-sm ring-gold',
    ghost: 'border-2 border-green-deep/30 text-green-deep hover:border-green-deep ring-green-deep',
    danger: 'bg-brick text-cream hover:bg-red-700 shadow-sm ring-brick'
  }
  const sizes = { sm: 'text-sm px-3.5 py-2', md: 'px-5 py-2.5', lg: 'px-7 py-3 text-lg' }
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`
  return to ? <Link to={to} className={cls} {...rest}>{children}</Link> : <button type="button" className={cls} {...rest}>{children}</button>
}

export function Chip({ tone = 'green', children, className = '' }) {
  const tones = {
    green: 'bg-green-deep/10 text-green-deep border-green-deep/20',
    gold: 'bg-gold/20 text-soil border-gold/40',
    brick: 'bg-brick/10 text-brick border-brick/20',
    indigo: 'bg-indigo/10 text-indigo border-indigo/20'
  }
  return <span className={`inline-flex items-center gap-1 border rounded-full px-2.5 py-0.5 text-[11.5px] font-mono font-semibold whitespace-nowrap ${tones[tone]} ${className}`}>{children}</span>
}

export function SackGauge({ fill = 40, size = 56, children }) {
  return (
    <div className="sack" style={{ width: size + 'px', '--fill': fill + '%' }}>
      <div className="sack-fill"></div>
      <div className="sack-icon">{children}</div>
    </div>
  )
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-semibold text-green-deep mb-1.5">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-green-soft mt-1 block">{hint}</span>}
    </label>
  )
}

export function Reveal({ children, d = 0, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect() } }, { threshold: 0.12 })
    io.observe(el); return () => io.disconnect()
  }, [])
  return <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: d + 'ms' }}>{children}</div>
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-deep/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-cream rounded-3xl shadow-2xl w-full max-w-lg max-h-[86vh] overflow-auto border border-gold/50 animate-[modalPop_.3s_cubic-bezier(.16,1,.3,1)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gold/30 sticky top-0 bg-cream rounded-t-3xl z-10">
          <h3 className="font-display font-bold text-xl text-green-deep">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-green-deep/10 transition"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function useToast() {
  const [msg, setMsg] = useState(null)
  useEffect(() => { if (!msg) return; const id = setTimeout(() => setMsg(null), 3200); return () => clearTimeout(id) }, [msg])
  const el = msg ? <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[95] bg-green-deep text-cream text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl animate-[fadeIn_.3s_ease]">{msg}</div> : null
  return [el, setMsg]
}

/* Leaflet map interface (kept from previous project) */
export function NetworkMap({ className = '', onReady }) {
  const ref = useRef(null)
  useEffect(() => {
    const map = L.map(ref.current, { scrollWheelZoom: false }).setView([22.9, 78.9], 5)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map)
    if (onReady) onReady(map)
    return () => map.remove()
  }, [])
  return <div ref={ref} className={`isolate ${className}`} />
}

/* <2MB file validator for photo proofs & documents */
export function checkSize(file, mb = 2) {
  if (!file) return false
  if (file.size >= mb * 1024 * 1024) { alert(`File must be under ${mb} MB / फ़ाइल ${mb} MB से कम होनी चाहिए`); return false }
  return true
}

/* =========================================================
   GEOLOCATION & ROUTE CORRIDOR MATCHING HELPERS
========================================================= */

export function haversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function distanceToSegmentKm(pLat, pLng, aLat, aLng, bLat, bLng) {
  const R = 6371; // Earth radius in km
  const phi0 = ((aLat + bLat + pLat) / 3.0) * Math.PI / 180;
  const xA = R * (aLng * Math.PI / 180) * Math.cos(phi0);
  const yA = R * (aLat * Math.PI / 180);
  const xB = R * (bLng * Math.PI / 180) * Math.cos(phi0);
  const yB = R * (bLat * Math.PI / 180);
  const xP = R * (pLng * Math.PI / 180) * Math.cos(phi0);
  const yP = R * (pLat * Math.PI / 180);

  const dx = xB - xA;
  const dy = yB - yA;
  const l2 = dx * dx + dy * dy;

  if (l2 === 0) {
    return Math.hypot(xP - xA, yP - yA);
  }

  const t = Math.max(0, Math.min(1, ((xP - xA) * dx + (yP - yA) * dy) / l2));
  const projX = xA + t * dx;
  const projY = yA + t * dy;

  return Math.hypot(xP - projX, yP - projY);
}

export function isPassengerOnRoute(passengerCoords, driverRouteCoords, thresholdKm = 5.0) {
  if (!passengerCoords) return true;
  const pLat = Number(passengerCoords.lat || (Array.isArray(passengerCoords) ? passengerCoords[0] : 0));
  const pLng = Number(passengerCoords.lng || (Array.isArray(passengerCoords) ? passengerCoords[1] : 0));
  if (!pLat || !pLng || !driverRouteCoords || driverRouteCoords.length < 2) return true;

  const origin = driverRouteCoords[0];
  const dest = driverRouteCoords[driverRouteCoords.length - 1];
  const oLat = Number(origin.lat || (Array.isArray(origin) ? origin[0] : 0));
  const oLng = Number(origin.lng || (Array.isArray(origin) ? origin[1] : 0));
  const dLat = Number(dest.lat || (Array.isArray(dest) ? dest[0] : 0));
  const dLng = Number(dest.lng || (Array.isArray(dest) ? dest[1] : 0));

  if (oLat && oLng && dLat && dLng) {
    // 1. Start point buffer (up to 5 km from starting point)
    const distToOrigin = haversineDistance(pLat, pLng, oLat, oLng);
    if (distToOrigin <= 5.0) return true;

    // 2. Destination stop buffer (up to 5 km from destination point)
    const distToDest = haversineDistance(pLat, pLng, dLat, dLng);
    if (distToDest <= 5.0) return true;

    // 3. Intermediate route corridor check (full leverage anywhere along the vehicle path)
    const directDist = haversineDistance(oLat, oLng, dLat, dLng);
    const distViaPoint = distToOrigin + distToDest;
    const maxAllowedDetour = (directDist * 1.25) + 15.0;

    if (distViaPoint <= maxAllowedDetour && distToOrigin <= (directDist + 15.0) && distToDest <= (directDist + 15.0)) {
      return true;
    }
  }

  // 4. Fallback segment polyline check
  let minDist = Infinity;
  for (let i = 0; i < driverRouteCoords.length - 1; i++) {
    const a = driverRouteCoords[i];
    const b = driverRouteCoords[i + 1];
    const aLat = Number(a.lat || (Array.isArray(a) ? a[0] : 0));
    const aLng = Number(a.lng || (Array.isArray(a) ? a[1] : 0));
    const bLat = Number(b.lat || (Array.isArray(b) ? b[0] : 0));
    const bLng = Number(b.lng || (Array.isArray(b) ? b[1] : 0));

    if (!aLat || !aLng || !bLat || !bLng) continue;
    const d = distanceToSegmentKm(pLat, pLng, aLat, aLng, bLat, bLng);
    if (d < minDist) minDist = d;
  }

  if (minDist === Infinity) return true;
  return minDist <= thresholdKm;
}

export function isPointAlongRoute(pointCoords, originCoords, destCoords, thresholdKm = 5.0) {
  if (!pointCoords || !originCoords || !destCoords) return true;
  return isPassengerOnRoute(pointCoords, [originCoords, destCoords], thresholdKm);
}

export function calculateRouteAwarePrice(passengerDistKm, trip, serviceFee = 20.0) {
  let basePricePerKm = 12.0;
  if (trip && trip.distance_km && trip.distance_km > 0 && trip.total_driver_amount && trip.total_driver_amount > 0) {
    basePricePerKm = Number(trip.total_driver_amount) / Number(trip.distance_km);
  } else if (trip && (trip.price_per_kg || trip.pricePerKg) && (trip.price_per_kg > 0 || trip.pricePerKg > 0)) {
    basePricePerKm = Number(trip.price_per_kg || trip.pricePerKg);
  }

  const price = Math.round((basePricePerKm * passengerDistKm) + serviceFee);
  return Math.max(0, price);
}

/* =========================================================
   COMPREHENSIVE INDIAN CITIES, MANDIS & TRANSPORT HUBS DATASET
========================================================= */

export const INDIAN_LOCATIONS_DATABASE = [
  // Bihar & Jharkhand
  { name: "Patna, Bihar, India", shortName: "Patna", state: "Bihar", lat: 25.5941, lng: 85.1376 },
  { name: "Boring Road, Patna, Bihar, India", shortName: "Boring Road, Patna", state: "Bihar", lat: 25.6165, lng: 85.1138 },
  { name: "Patna Junction, Station Road, Patna, Bihar, India", shortName: "Patna Junction", state: "Bihar", lat: 25.6022, lng: 85.1350 },
  { name: "Jayprakash Narayan Airport, Patna, Bihar, India", shortName: "Patna Airport", state: "Bihar", lat: 25.5913, lng: 85.0880 },
  { name: "Barauni, Begusarai, Bihar, India", shortName: "Barauni", state: "Bihar", lat: 25.4740, lng: 85.9750 },
  { name: "Begusarai, Bihar, India", shortName: "Begusarai", state: "Bihar", lat: 25.4182, lng: 86.1272 },
  { name: "GD College Road, Begusarai, Bihar, India", shortName: "GD College, Begusarai", state: "Bihar", lat: 25.4164, lng: 86.1239 },
  { name: "Muzaffarpur, Bihar, India", shortName: "Muzaffarpur", state: "Bihar", lat: 26.1209, lng: 85.3647 },
  { name: "Gaya, Bihar, India", shortName: "Gaya", state: "Bihar", lat: 24.7914, lng: 85.0002 },
  { name: "Bhagalpur, Bihar, India", shortName: "Bhagalpur", state: "Bihar", lat: 25.2425, lng: 86.9842 },
  { name: "Darbhanga, Bihar, India", shortName: "Darbhanga", state: "Bihar", lat: 26.1542, lng: 85.8918 },
  { name: "Purnia, Bihar, India", shortName: "Purnia", state: "Bihar", lat: 25.7771, lng: 87.4753 },
  { name: "Arrah, Bhojpur, Bihar, India", shortName: "Arrah", state: "Bihar", lat: 25.5541, lng: 84.6644 },
  { name: "Bihar Sharif, Nalanda, Bihar, India", shortName: "Bihar Sharif", state: "Bihar", lat: 25.1982, lng: 85.5149 },
  { name: "Chhapra, Saran, Bihar, India", shortName: "Chhapra", state: "Bihar", lat: 25.7811, lng: 84.7466 },
  { name: "Marhaura, Saran, Bihar, India", shortName: "Marhaura", state: "Bihar", lat: 25.9302, lng: 84.7950 },
  { name: "Samastipur, Bihar, India", shortName: "Samastipur", state: "Bihar", lat: 25.8629, lng: 85.7811 },
  { name: "Katihar, Bihar, India", shortName: "Katihar", state: "Bihar", lat: 25.5541, lng: 87.5722 },
  { name: "Munger, Bihar, India", shortName: "Munger", state: "Bihar", lat: 25.3757, lng: 86.4735 },
  { name: "Ranchi, Jharkhand, India", shortName: "Ranchi", state: "Jharkhand", lat: 23.3441, lng: 85.3096 },
  { name: "Kanke, Ranchi, Jharkhand, India", shortName: "Kanke, Ranchi", state: "Jharkhand", lat: 23.4326, lng: 85.3214 },
  { name: "Jamshedpur, Jharkhand, India", shortName: "Jamshedpur", state: "Jharkhand", lat: 22.8046, lng: 86.2029 },
  { name: "Dhanbad, Jharkhand, India", shortName: "Dhanbad", state: "Jharkhand", lat: 23.7957, lng: 86.4304 },
  { name: "Bokaro Steel City, Jharkhand, India", shortName: "Bokaro", state: "Jharkhand", lat: 23.6693, lng: 86.1511 },
  { name: "Deoghar, Jharkhand, India", shortName: "Deoghar", state: "Jharkhand", lat: 24.4826, lng: 86.7001 },

  // Odisha & West Bengal
  { name: "Bhubaneswar, Odisha, India", shortName: "Bhubaneswar", state: "Odisha", lat: 20.2961, lng: 85.8245 },
  { name: "ITER Boys Hostel, Bhubaneswar, Odisha, India", shortName: "ITER, Bhubaneswar", state: "Odisha", lat: 20.2504, lng: 85.8004 },
  { name: "Cuttack, Odisha, India", shortName: "Cuttack", state: "Odisha", lat: 20.4625, lng: 85.8828 },
  { name: "Rourkela, Sundargarh, Odisha, India", shortName: "Rourkela", state: "Odisha", lat: 22.2604, lng: 84.8536 },
  { name: "Berhampur, Ganjam, Odisha, India", shortName: "Berhampur", state: "Odisha", lat: 19.3150, lng: 84.7941 },
  { name: "Sambalpur, Odisha, India", shortName: "Sambalpur", state: "Odisha", lat: 21.4669, lng: 83.9812 },
  { name: "Puri, Odisha, India", shortName: "Puri", state: "Odisha", lat: 19.8135, lng: 85.8312 },
  { name: "Balasore, Odisha, India", shortName: "Balasore", state: "Odisha", lat: 21.4934, lng: 86.9135 },
  { name: "Kolkata, West Bengal, India", shortName: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639 },
  { name: "Howrah, West Bengal, India", shortName: "Howrah", state: "West Bengal", lat: 22.5958, lng: 88.2636 },
  { name: "Siliguri, Darjeeling, West Bengal, India", shortName: "Siliguri", state: "West Bengal", lat: 26.7271, lng: 88.3953 },
  { name: "Durgapur, Paschim Bardhaman, West Bengal, India", shortName: "Durgapur", state: "West Bengal", lat: 23.5204, lng: 87.3119 },
  { name: "Asansol, West Bengal, India", shortName: "Asansol", state: "West Bengal", lat: 23.6739, lng: 86.9524 },
  { name: "Kharagpur, Paschim Medinipur, West Bengal, India", shortName: "Kharagpur", state: "West Bengal", lat: 22.3460, lng: 87.2320 },

  // Delhi NCR & North India
  { name: "New Delhi, Delhi, India", shortName: "New Delhi", state: "Delhi", lat: 28.6139, lng: 77.2090 },
  { name: "Connaught Place, New Delhi, Delhi, India", shortName: "Connaught Place, Delhi", state: "Delhi", lat: 28.6315, lng: 77.2167 },
  { name: "Azadpur Mandi, Delhi, India", shortName: "Azadpur Mandi, Delhi", state: "Delhi", lat: 28.7075, lng: 77.1775 },
  { name: "Noida, Gautam Buddha Nagar, Uttar Pradesh, India", shortName: "Noida", state: "Uttar Pradesh", lat: 28.5355, lng: 77.3910 },
  { name: "Greater Noida, Uttar Pradesh, India", shortName: "Greater Noida", state: "Uttar Pradesh", lat: 28.4744, lng: 77.5040 },
  { name: "Ghaziabad, Uttar Pradesh, India", shortName: "Ghaziabad", state: "Uttar Pradesh", lat: 28.6692, lng: 77.4538 },
  { name: "Gurugram, Haryana, India", shortName: "Gurugram (Gurgaon)", state: "Haryana", lat: 28.4595, lng: 77.0266 },
  { name: "Faridabad, Haryana, India", shortName: "Faridabad", state: "Haryana", lat: 28.4089, lng: 77.3178 },
  { name: "Chandigarh, India", shortName: "Chandigarh", state: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  { name: "Ludhiana, Punjab, India", shortName: "Ludhiana", state: "Punjab", lat: 30.9010, lng: 75.8573 },
  { name: "Amritsar, Punjab, India", shortName: "Amritsar", state: "Punjab", lat: 31.6340, lng: 74.8723 },
  { name: "Jalandhar, Punjab, India", shortName: "Jalandhar", state: "Punjab", lat: 31.3260, lng: 75.5762 },
  { name: "Jaipur, Rajasthan, India", shortName: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873 },
  { name: "Jodhpur, Rajasthan, India", shortName: "Jodhpur", state: "Rajasthan", lat: 26.2389, lng: 73.0243 },
  { name: "Kota, Rajasthan, India", shortName: "Kota", state: "Rajasthan", lat: 25.2138, lng: 75.8648 },
  { name: "Udaipur, Rajasthan, India", shortName: "Udaipur", state: "Rajasthan", lat: 24.5854, lng: 73.7125 },
  { name: "Bikaner, Rajasthan, India", shortName: "Bikaner", state: "Rajasthan", lat: 28.0229, lng: 73.3119 },
  { name: "Lucknow, Uttar Pradesh, India", shortName: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462 },
  { name: "Kanpur, Uttar Pradesh, India", shortName: "Kanpur", state: "Uttar Pradesh", lat: 26.4499, lng: 80.3319 },
  { name: "Varanasi, Uttar Pradesh, India", shortName: "Varanasi", state: "Uttar Pradesh", lat: 25.3176, lng: 82.9739 },
  { name: "Agra, Uttar Pradesh, India", shortName: "Agra", state: "Uttar Pradesh", lat: 27.1767, lng: 78.0081 },
  { name: "Prayagraj, Uttar Pradesh, India", shortName: "Prayagraj (Allahabad)", state: "Uttar Pradesh", lat: 25.4358, lng: 81.8463 },
  { name: "Meerut, Uttar Pradesh, India", shortName: "Meerut", state: "Uttar Pradesh", lat: 28.9845, lng: 77.7064 },
  { name: "Gorakhpur, Uttar Pradesh, India", shortName: "Gorakhpur", state: "Uttar Pradesh", lat: 26.7606, lng: 83.3732 },
  { name: "Dehradun, Uttarakhand, India", shortName: "Dehradun", state: "Uttarakhand", lat: 30.3165, lng: 78.0322 },
  { name: "Haridwar, Uttarakhand, India", shortName: "Haridwar", state: "Uttarakhand", lat: 29.9457, lng: 78.1642 },

  // Maharashtra & Gujarat
  { name: "Mumbai, Maharashtra, India", shortName: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777 },
  { name: "Navi Mumbai, Maharashtra, India", shortName: "Navi Mumbai", state: "Maharashtra", lat: 19.0330, lng: 73.0297 },
  { name: "Vashi APMC Market, Navi Mumbai, Maharashtra, India", shortName: "Vashi APMC Mandi", state: "Maharashtra", lat: 19.0770, lng: 73.0035 },
  { name: "Pune, Maharashtra, India", shortName: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  { name: "Nagpur, Maharashtra, India", shortName: "Nagpur", state: "Maharashtra", lat: 21.1458, lng: 79.0882 },
  { name: "Nashik, Maharashtra, India", shortName: "Nashik", state: "Maharashtra", lat: 19.9975, lng: 73.7898 },
  { name: "Chhatrapati Sambhajinagar, Maharashtra, India", shortName: "Aurangabad", state: "Maharashtra", lat: 19.8762, lng: 75.3433 },
  { name: "Solapur, Maharashtra, India", shortName: "Solapur", state: "Maharashtra", lat: 17.6599, lng: 75.9064 },
  { name: "Kolhapur, Maharashtra, India", shortName: "Kolhapur", state: "Maharashtra", lat: 16.7050, lng: 74.2433 },
  { name: "Ahmedabad, Gujarat, India", shortName: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714 },
  { name: "Surat, Gujarat, India", shortName: "Surat", state: "Gujarat", lat: 21.1702, lng: 72.8311 },
  { name: "Vadodara, Gujarat, India", shortName: "Vadodara", state: "Gujarat", lat: 22.3072, lng: 73.1812 },
  { name: "Rajkot, Gujarat, India", shortName: "Rajkot", state: "Gujarat", lat: 22.3039, lng: 70.8022 },
  { name: "Bhavnagar, Gujarat, India", shortName: "Bhavnagar", state: "Gujarat", lat: 21.7645, lng: 72.1519 },

  // South & Central India
  { name: "Bengaluru, Karnataka, India", shortName: "Bengaluru (Bangalore)", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { name: "Mysuru, Karnataka, India", shortName: "Mysuru", state: "Karnataka", lat: 12.2958, lng: 76.6394 },
  { name: "Hubballi, Dharwad, Karnataka, India", shortName: "Hubballi", state: "Karnataka", lat: 15.3647, lng: 75.1240 },
  { name: "Mangaluru, Dakshina Kannada, Karnataka, India", shortName: "Mangaluru", state: "Karnataka", lat: 12.9141, lng: 74.8560 },
  { name: "Hyderabad, Telangana, India", shortName: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867 },
  { name: "Warangal, Telangana, India", shortName: "Warangal", state: "Telangana", lat: 17.9689, lng: 79.5941 },
  { name: "Chennai, Tamil Nadu, India", shortName: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
  { name: "Coimbatore, Tamil Nadu, India", shortName: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558 },
  { name: "Madurai, Tamil Nadu, India", shortName: "Madurai", state: "Tamil Nadu", lat: 9.9252, lng: 78.1198 },
  { name: "Tiruchirappalli, Tamil Nadu, India", shortName: "Tiruchirappalli (Trichy)", state: "Tamil Nadu", lat: 10.7905, lng: 78.7047 },
  { name: "Salem, Tamil Nadu, India", shortName: "Salem", state: "Tamil Nadu", lat: 11.6643, lng: 78.1460 },
  { name: "Visakhapatnam, Andhra Pradesh, India", shortName: "Visakhapatnam (Vizag)", state: "Andhra Pradesh", lat: 17.6868, lng: 83.2185 },
  { name: "Vijayawada, Andhra Pradesh, India", shortName: "Vijayawada", state: "Andhra Pradesh", lat: 16.5062, lng: 80.6480 },
  { name: "Guntur, Andhra Pradesh, India", shortName: "Guntur", state: "Andhra Pradesh", lat: 16.3067, lng: 80.4365 },
  { name: "Tirupati, Andhra Pradesh, India", shortName: "Tirupati", state: "Andhra Pradesh", lat: 13.6288, lng: 79.4192 },
  { name: "Kochi, Ernakulam, Kerala, India", shortName: "Kochi (Cochin)", state: "Kerala", lat: 9.9312, lng: 76.2673 },
  { name: "Thiruvananthapuram, Kerala, India", shortName: "Thiruvananthapuram", state: "Kerala", lat: 8.5241, lng: 76.9366 },
  { name: "Kozhikode, Kerala, India", shortName: "Kozhikode (Calicut)", state: "Kerala", lat: 11.2588, lng: 75.7804 },
  { name: "Indore, Madhya Pradesh, India", shortName: "Indore", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577 },
  { name: "Bhopal, Madhya Pradesh, India", shortName: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lng: 77.4126 },
  { name: "Jabalpur, Madhya Pradesh, India", shortName: "Jabalpur", state: "Madhya Pradesh", lat: 23.1815, lng: 79.9864 },
  { name: "Gwalior, Madhya Pradesh, India", shortName: "Gwalior", state: "Madhya Pradesh", lat: 26.2183, lng: 78.1828 },
  { name: "Raipur, Chhattisgarh, India", shortName: "Raipur", state: "Chhattisgarh", lat: 21.2514, lng: 81.6296 },
  { name: "Guwahati, Assam, India", shortName: "Guwahati", state: "Assam", lat: 26.1445, lng: 91.7362 }
];

/* =========================================================
   GEOCODING & LOCATION RESOLVER (MULTI-SOURCE INDIA SEARCH)
========================================================= */

export async function searchIndianLocations(query) {
  if (!query || typeof query !== 'string' || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();
  const results = [];
  const seen = new Set();

  // Tier 1: Instant Local India Dataset Search
  for (const loc of INDIAN_LOCATIONS_DATABASE) {
    const matchName = loc.name.toLowerCase().includes(q);
    const matchShort = loc.shortName.toLowerCase().includes(q);
    const matchState = loc.state.toLowerCase().includes(q);
    if (matchName || matchShort || matchState) {
      const key = `${loc.lat.toFixed(3)},${loc.lng.toFixed(3)}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push(loc);
      }
    }
  }

  // Tier 2: Photon High-Speed Geocoding API
  try {
    const photonRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query.trim())}&limit=8&lat=20.5937&lon=78.9629`);
    if (photonRes.ok) {
      const pData = await photonRes.json();
      if (pData?.features && Array.isArray(pData.features)) {
        for (const f of pData.features) {
          const coords = f.geometry?.coordinates;
          if (!coords || coords.length < 2) continue;
          const lng = parseFloat(coords[0]);
          const lat = parseFloat(coords[1]);
          const props = f.properties || {};
          const country = props.country || '';
          
          // Focus on India or nearby bounds
          if (country && country.toLowerCase() !== 'india' && country.toLowerCase() !== 'in') {
            continue;
          }

          const name = [props.name, props.district || props.city, props.state, props.country || 'India'].filter(Boolean).join(', ');
          const shortName = props.name || props.city || props.district || 'Location';
          const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
          if (!seen.has(key)) {
            seen.add(key);
            results.push({
              name,
              shortName,
              state: props.state || '',
              lat,
              lng
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn("Photon search fallback", err);
  }

  // Tier 3: OpenStreetMap Nominatim Fallback if needed
  if (results.length < 2) {
    try {
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&countrycodes=in&limit=4&addressdetails=1`);
      if (nomRes.ok) {
        const nomData = await nomRes.json();
        if (Array.isArray(nomData)) {
          for (const item of nomData) {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({
                name: item.display_name,
                shortName: item.address?.city || item.address?.town || item.address?.village || item.address?.suburb || item.display_name.split(',')[0],
                state: item.address?.state || '',
                lat,
                lng
              });
            }
          }
        }
      }
    } catch (e) {
      // Ignored fallback
    }
  }

  return results.slice(0, 8);
}

export async function geocodeIndianLocation(query) {
  if (!query || typeof query !== 'string' || query.trim().length < 2) return null;
  const list = await searchIndianLocations(query);
  return list.length > 0 ? list[0] : null;
}

/* =========================================================
   INDIA LOCATION AUTOCOMPLETE COMPONENT
========================================================= */

export function LocationAutocomplete({
  placeholder = "Search location in India...",
  value = "",
  onChange,
  onSelectLocation,
  required = false,
  className = ""
}) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const containerRef = useRef(null);
  const timerRef = useRef(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value || "");
    if (!value) {
      setSelectedLoc(null);
      setErrorMessage("");
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedLoc(null); // Clear selected location when user edits
    setErrorMessage("");
    if (onChange) onChange(val);
    if (onSelectLocation) onSelectLocation(null);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    // Instant local suggestions first
    const instantMatches = INDIAN_LOCATIONS_DATABASE.filter(loc =>
      loc.name.toLowerCase().includes(val.toLowerCase()) ||
      loc.shortName.toLowerCase().includes(val.toLowerCase())
    ).slice(0, 6);

    if (instantMatches.length > 0) {
      setSuggestions(instantMatches);
      setOpen(true);
    }

    // Debounced full search across sources
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchIndianLocations(val);
        setSuggestions(results);
        setOpen(results.length > 0);
        if (results.length === 0) {
          setErrorMessage("❌ No location found in India. Please enter a valid Indian city or hub.");
        }
      } catch (err) {
        console.error("Location search error", err);
      } finally {
        setLoading(false);
      }
    }, 200);
  };

  const handleSelect = (item) => {
    setQuery(item.name);
    setSelectedLoc(item);
    setErrorMessage("");
    setOpen(false);
    if (onChange) onChange(item.name);
    if (onSelectLocation) onSelectLocation(item);
  };

  const handleClear = () => {
    setQuery("");
    setSelectedLoc(null);
    setSuggestions([]);
    setErrorMessage("");
    setOpen(false);
    if (onChange) onChange("");
    if (onSelectLocation) onSelectLocation(null);
  };

  const handleBlur = () => {
    // Delay to let mouseDown on suggestions register first
    setTimeout(async () => {
      if (!query || query.trim().length < 2) return;
      if (!selectedLoc || !selectedLoc.lat) {
        setLoading(true);
        const resolved = await geocodeIndianLocation(query);
        setLoading(false);
        if (resolved && resolved.lat && resolved.lng) {
          handleSelect(resolved);
        } else {
          setErrorMessage("❌ Unverified location. Please select a valid Indian city/hub from suggestions.");
          if (onSelectLocation) onSelectLocation(null);
        }
      }
    }, 280);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      }
    }
  };

  const isVerified = Boolean(selectedLoc && selectedLoc.lat && selectedLoc.lng);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className={`${inputCls} pr-20 ${errorMessage ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20' : isVerified ? 'border-green-600/70 bg-green-50/15' : ''} ${className}`}
          onFocus={() => {
            if (suggestions.length > 0) {
              setOpen(true);
            } else if (query && query.trim().length >= 2) {
              searchIndianLocations(query).then(res => {
                setSuggestions(res);
                if (res.length > 0) setOpen(true);
              });
            }
          }}
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-auto">
          {loading && (
            <span className="text-[11px] text-green-soft font-semibold animate-pulse">
              🔍 Searching...
            </span>
          )}

          {!loading && isVerified && (
            <span className="text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span>✔</span>
              <span>Selected</span>
            </span>
          )}

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full cursor-pointer hover:bg-gray-100 transition"
              title="Clear location"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <p className="text-[11px] text-red-600 font-medium mt-1 animate-[fadeIn_.2s_ease]">
          {errorMessage}
        </p>
      )}

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[99999] max-h-60 overflow-y-auto rounded-2xl border border-gold/40 bg-white shadow-2xl divide-y divide-gold/15 text-xs animate-[fadeIn_.15s_ease]">
          <div className="px-3 py-1.5 bg-cream/60 text-[10.5px] font-bold text-green-soft uppercase tracking-wider flex items-center justify-between">
            <span>Locations in India</span>
            <span>{suggestions.length} found</span>
          </div>
          {suggestions.map((item, idx) => (
            <div
              key={`${item.lat}_${item.lng}_${idx}`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(item);
              }}
              className="p-3 hover:bg-green-50/80 cursor-pointer transition flex items-start gap-2.5 text-green-deep border-b border-gold/10 last:border-0"
            >
              <span className="text-base shrink-0 mt-0.5">📍</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-xs text-green-deep truncate">{item.shortName}</p>
                  {item.state && (
                    <span className="text-[10px] bg-gold/20 text-soil font-semibold px-1.5 py-0.5 rounded-md shrink-0">
                      {item.state}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-green-soft truncate mt-0.5">{item.name}</p>
              </div>
              <span className="text-[10px] text-green-700 font-mono bg-green-100/60 px-1.5 py-0.5 rounded shrink-0">
                {item.lat.toFixed(2)}, {item.lng.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}