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

export function isPointAlongRoute(pointCoords, originCoords, destCoords, maxDetourRatio = 0.25) {
  if (!pointCoords || !originCoords || !destCoords) return true;
  if (!pointCoords.lat || !pointCoords.lng || !originCoords.lat || !originCoords.lng || !destCoords.lat || !destCoords.lng) return true;

  const directDist = haversineDistance(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng);
  const distViaPoint = haversineDistance(originCoords.lat, originCoords.lng, pointCoords.lat, pointCoords.lng) +
                       haversineDistance(pointCoords.lat, pointCoords.lng, destCoords.lat, destCoords.lng);

  const distToOrigin = haversineDistance(originCoords.lat, originCoords.lng, pointCoords.lat, pointCoords.lng);
  const distToDest = haversineDistance(destCoords.lat, destCoords.lng, pointCoords.lat, pointCoords.lng);

  // Allow points within 35km radius of origin or destination
  if (distToOrigin <= 35 || distToDest <= 35) return true;

  if (directDist <= 5) return true;

  // Intercity detour tolerance check
  return distViaPoint <= directDist * (1 + maxDetourRatio);
}

/* =========================================================
   GEOCODING & LOCATION RESOLVER (INDIA NOMINATIM)
========================================================= */

export async function geocodeIndianLocation(query) {
  if (!query || typeof query !== 'string' || query.trim().length < 2) return null;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&countrycodes=in&limit=1&addressdetails=1`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;
    const item = data[0];
    return {
      name: item.display_name,
      shortName: item.address?.city || item.address?.town || item.address?.village || item.address?.suburb || item.address?.county || item.display_name.split(',')[0],
      state: item.address?.state || '',
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon)
    };
  } catch (err) {
    console.error("Geocoding failed", err);
    return null;
  }
}

/* =========================================================
   INDIA LOCATION AUTOCOMPLETE COMPONENT (NOMINATIM GEOLOCATION)
========================================================= */

export function LocationAutocomplete({
  placeholder = "Search location in India...",
  value = "",
  onChange,
  onSelectLocation,
  required = false,
  className = ""
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isValid, setIsValid] = useState(!!value);
  const [errorMessage, setErrorMessage] = useState("");
  const containerRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
    if (value && value.trim().length > 2) {
      setIsValid(true);
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
    setIsValid(false);
    setErrorMessage("");
    if (onChange) onChange(val);
    if (onSelectLocation) onSelectLocation(null);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&countrycodes=in&limit=6&addressdetails=1`);
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map(item => ({
            name: item.display_name,
            shortName: item.address?.city || item.address?.town || item.address?.village || item.address?.suburb || item.address?.county || item.display_name.split(',')[0],
            state: item.address?.state || '',
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          }));
          setSuggestions(mapped);
          setOpen(mapped.length > 0);
          if (mapped.length === 0) {
            setErrorMessage("❌ No location found in India. Please enter a valid Indian city or place.");
          }
        }
      } catch (err) {
        console.error("Geocoding fetch error", err);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleSelect = (item) => {
    const displayName = item.name;
    setQuery(displayName);
    setIsValid(true);
    setErrorMessage("");
    setOpen(false);
    if (onChange) onChange(displayName);
    if (onSelectLocation) onSelectLocation(item);
  };

  const handleBlur = async () => {
    // Give user time to click suggestion if open
    setTimeout(async () => {
      if (!query || query.trim().length < 2) return;
      if (!isValid) {
        setLoading(true);
        const resolved = await geocodeIndianLocation(query);
        setLoading(false);
        if (resolved) {
          handleSelect(resolved);
        } else {
          setIsValid(false);
          setErrorMessage("❌ Unverified location. Please enter a valid Indian city/town.");
          if (onSelectLocation) onSelectLocation(null);
        }
      }
    }, 250);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          className={`${inputCls} ${errorMessage ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20' : isValid ? 'border-green-600/70 bg-green-50/10' : ''} ${className}`}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-soft font-semibold animate-pulse">
            🔍 Searching India...
          </div>
        )}
        {!loading && isValid && query.length > 2 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-bold flex items-center gap-1">
            ✔ Verified
          </div>
        )}
      </div>

      {errorMessage && (
        <p className="text-[11px] text-red-600 font-medium mt-1 animate-[fadeIn_.2s_ease]">
          {errorMessage}
        </p>
      )}

      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-1.5 z-[100] max-h-56 overflow-y-auto rounded-xl border border-gold/40 bg-white shadow-2xl divide-y divide-gold/10 text-xs">
          {suggestions.map((item, idx) => (
            <li
              key={idx}
              onMouseDown={() => handleSelect(item)}
              className="p-2.5 hover:bg-cream cursor-pointer transition flex items-start gap-2 text-green-deep"
            >
              <span className="text-sm">📍</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs truncate">{item.shortName} {item.state ? `(${item.state})` : ''}</p>
                <p className="text-[11px] text-green-soft truncate mt-0.5">{item.name}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}