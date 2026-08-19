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