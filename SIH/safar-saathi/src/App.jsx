import React, { useState, useEffect, useRef } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useNavigate,
  useLocation
} from 'react-router-dom';

import { LoginPage, ProfileSetupPage, Home, FindVehicles, OfferTrip } from './pages';
import Maps from './Maps';

import {
  Mic,
  X,
  Menu,
  Languages,
  Volume2,
  Send
} from 'lucide-react';

import {
  LangProvider,
  useLang,
  AppProvider,
  LANGS
} from './lib';

/* ================= SCROLL TO TOP ================= */

function ScrollTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }, [pathname])

  return null
}


/* ================= TOP STRIP ================= */

function TopStrip() {
  const {
    t,
    lang,
    setLang
  } = useLang()

  return (
    <div className="bg-indigo text-cream text-xs">

      <div className="ashoka-rule"></div>

      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between gap-3">

        <span className="font-mono tracking-wide truncate">
          {t('gov')}
        </span>

        <label className="flex items-center gap-1.5 cursor-pointer shrink-0">

          <Languages size={13} />

          <select
            value={lang}
            onChange={e => setLang(e.target.value)}
            className="bg-transparent text-cream text-xs font-semibold outline-none cursor-pointer"
          >
            {LANGS.map(l => (
              <option
                key={l.id}
                value={l.id}
                className="text-green-deep"
              >
                {l.label}
              </option>
            ))}
          </select>

        </label>

      </div>

    </div>
  )
}


/* ================= NAVIGATION ================= */

const NAV = [
  {
    to: '/',
    key: 'home'
  },
  {
    to: '/find',
    key: 'find'
  },
  {
    to: '/offer',
    key: 'offer'
  }
]


/* ================= HEADER ================= */

function Header() {
  const { t } = useLang()

  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-cream/90 border-b border-gold/30">

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">

        <Link
          to="/"
          className="flex items-center gap-2"
        >

          <div
            className="sack"
            style={{
              width: 34,
              '--fill': '60%'
            }}
          >
            <div className="sack-fill"></div>

            <div className="sack-icon text-white text-xs font-bold">
              📦
            </div>

          </div>

          <span className="text-left leading-tight">

            <span className="block font-display font-bold text-lg sm:text-xl text-green-deep">

              Safar-Saathi

              <span className="text-gold-dim">
                {' '}सफ़र-साथी
              </span>

            </span>

            <span className="block text-[10px] font-mono uppercase tracking-wider text-green-soft">
              {t('tagline')}
            </span>

          </span>

        </Link>


        {/* DESKTOP NAV */}

        <nav className="hidden md:flex items-center gap-1 font-mono text-xs">

          {NAV.map(item => (

            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-full font-medium transition-colors ${isActive
                  ? 'bg-green-deep text-cream'
                  : 'text-green-deep hover:bg-green-deep/10'
                }`
              }
            >
              {t('nav.' + item.key)}
            </NavLink>

          ))}

        </nav>


        {/* MOBILE MENU BUTTON */}

        <button
          className="md:hidden p-2 rounded-lg border border-gold/50"
          onClick={() => setOpen(o => !o)}
          aria-label="Menu"
        >
          {open
            ? <X size={20} />
            : <Menu size={20} />
          }
        </button>

      </div>


      {/* MOBILE NAV */}

      {open && (

        <nav className="md:hidden px-4 pb-3 flex flex-col gap-1 font-mono text-sm border-t border-gold/20">

          {NAV.map(item => (

            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-left ${isActive
                  ? 'bg-green-deep text-cream'
                  : 'text-green-deep'
                }`
              }
            >
              {t('nav.' + item.key)}
            </NavLink>

          ))}

        </nav>

      )}

    </header>
  )
}


/* ================= MAARG MITRA ================= */

function MaargMitra() {
  const {
    t,
    m,
    lang
  } = useLang()

  const nav = useNavigate()

  const [open, setOpen] = useState(false)

  const [pos, setPos] = useState({
    x: (window.innerWidth || 400) - 80,
    y: (window.innerHeight || 600) - 96
  })

  const [listening, setListening] = useState(false)

  const [log, setLog] = useState([])

  const [txt, setTxt] = useState('')

  const d = useRef({
    on: false,
    dx: 0,
    dy: 0,
    moved: 0
  })


  const speak = text => {
    try {
      const u =
        new SpeechSynthesisUtterance(text)

      const tag =
        (
          LANGS.find(l => l.id === lang) ||
          LANGS[0]
        ).voice

      u.lang = tag

      const v =
        window.speechSynthesis
          ?.getVoices()
          .find(v => v.lang === tag) ||

        window.speechSynthesis
          ?.getVoices()
          .find(v =>
            v.lang?.startsWith(
              tag.split('-')[0]
            )
          )

      if (v) {
        u.voice = v
      }

      window.speechSynthesis?.cancel()

      window.speechSynthesis?.speak(u)

    } catch (e) { }
  }


  const reply = (key, go) => {

    const msg = m(key)

    setLog(l => [
      ...l,
      {
        who: 'bot',
        msg
      }
    ])

    speak(msg)

    if (go) {
      setTimeout(
        () => nav(go),
        700
      )
    }

  }


  const handle = raw => {

    const q =
      (raw || '').toLowerCase()

    setLog(l => [
      ...l,
      {
        who: 'me',
        msg: raw
      }
    ])


    if (
      /(find|vehicle|वाहन|खोज|गाड़ी|गाड़ी)/.test(q)
    ) {
      return reply(
        'find',
        '/find'
      )
    }


    if (
      /(offer|trip|यात्रा|सफर)/.test(q)
    ) {
      return reply(
        'offer',
        '/offer'
      )
    }


    if (
      /(map|maps|location|नक्शा|मैप)/.test(q)
    ) {
      return reply(
        'fallback',
        '/maps'
      )
    }


    if (
      /(help|मदद|सहायता)/.test(q)
    ) {
      return reply('help')
    }


    reply('fallback')

  }


  const listen = () => {

    const SR =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition

    if (!SR) {
      reply('fallback')
      return
    }

    const rec =
      new SR()

    rec.lang =
      (
        LANGS.find(
          l => l.id === lang
        ) ||
        LANGS[0]
      ).voice

    rec.onstart =
      () => setListening(true)

    rec.onend =
      () => setListening(false)

    rec.onresult =
      e =>
        handle(
          e.results[0][0].transcript
        )

    rec.onerror =
      () => setListening(false)

    rec.start()

  }


  const down = e => {

    d.current = {
      on: true,
      dx: e.clientX - pos.x,
      dy: e.clientY - pos.y,
      moved: 0
    }

    e.currentTarget.setPointerCapture(
      e.pointerId
    )

  }


  const move = e => {

    if (!d.current.on) {
      return
    }

    d.current.moved +=
      Math.abs(
        e.movementX || 1
      ) +
      Math.abs(
        e.movementY || 1
      )

    setPos({
      x: Math.min(
        Math.max(
          8,
          e.clientX - d.current.dx
        ),
        window.innerWidth - 64
      ),

      y: Math.min(
        Math.max(
          8,
          e.clientY - d.current.dy
        ),
        window.innerHeight - 64
      )
    })

  }


  const up = () => {

    if (
      d.current.on &&
      d.current.moved < 6
    ) {

      setOpen(o => !o)

      if (!log.length) {

        const h =
          m('hello')

        setLog([
          {
            who: 'bot',
            msg: h
          }
        ])

        speak(h)

      }

    }

    d.current.on = false

  }


  const pw = 320
  const ph = 430

  const left =
    Math.max(
      8,
      Math.min(
        pos.x + 56 - pw,
        window.innerWidth - pw - 8
      )
    )

  const top =
    pos.y - ph - 12 > 8
      ? pos.y - ph - 12
      : Math.min(
        pos.y + 68,
        window.innerHeight - ph - 8
      )


  return (
    <>

      <button
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        style={{
          left: pos.x,
          top: pos.y
        }}
        className="fixed z-[100] w-14 h-14 rounded-full bg-indigo text-cream shadow-2xl flex items-center justify-center hover:bg-indigo-light transition-colors touch-none cursor-grab active:cursor-grabbing"
        title="MAARG-MITRA"
      >
        <div className={`delivery-girl ${listening ? 'pulse' : ''}`}>
          👩🏻‍🦰
          <span>📦</span>
        </div>
      </button>


      {open && (

        <div
          style={{
            left,
            top,
            width: pw
          }}
          className="fixed z-[99] bg-cream rounded-2xl shadow-2xl border border-gold/50 overflow-hidden"
        >

          <div className="bg-green-deep text-cream px-4 py-3 flex items-center justify-between">

            <div className="font-display font-bold">
              🤖 MAARG-MITRA
            </div>

            <button
              onClick={() =>
                setOpen(false)
              }
              className="p-1 hover:bg-white/10 rounded"
            >
              <X size={16} />
            </button>

          </div>


          <div className="h-56 overflow-y-auto p-3 space-y-2 bg-paper">

            {log.map((x, i) => (

              <div
                key={i}
                className={`flex ${x.who === 'me'
                    ? 'justify-end'
                    : ''
                  }`}
              >

                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-[12.5px] leading-relaxed ${x.who === 'me'
                      ? 'bg-indigo text-cream'
                      : 'bg-white border border-gold/30'
                    }`}
                >
                  {x.msg}
                </div>

              </div>

            ))}

          </div>


          <div className="px-3 pt-2 flex flex-wrap gap-1.5 bg-cream border-t border-gold/20">

            <button
              onClick={() => reply('find', '/find')}
              className="text-[11px] font-semibold border border-gold/40 rounded-full px-2.5 py-1"
            >
              {t('nav.find')}
            </button>

            <button
              onClick={() => reply('offer', '/offer')}
              className="text-[11px] font-semibold border border-gold/40 rounded-full px-2.5 py-1"
            >
              {t('nav.offer')}
            </button>

            <button
              onClick={() => nav('/maps')}
              className="text-[11px] font-semibold border border-gold/40 rounded-full px-2.5 py-1"
            >
              Maps
            </button>

          </div>


          <form
            className="flex p-2.5 bg-cream gap-2"
            onSubmit={e => {

              e.preventDefault()

              if (txt.trim()) {
                handle(txt)
                setTxt('')
              }

            }}
          >

            <input
              value={txt}
              onChange={e =>
                setTxt(e.target.value)
              }
              placeholder="Type / speak in your language…"
              className="flex-1 rounded-lg border border-gold/40 bg-white px-3 py-2 text-[12.5px] outline-none"
            />

            <button
              type="button"
              onClick={listen}
              className="bg-gold text-green-deep rounded-lg px-3"
            >
              <Mic size={15} />
            </button>

            <button
              className="bg-green-deep text-cream rounded-lg px-3"
            >
              <Send size={15} />
            </button>

          </form>

        </div>

      )}

    </>
  )
}


/* ================= FOOTER ================= */

function Footer() {
  const { t } = useLang()

  return (
    <footer className="bg-green-darkFooter text-cream border-t border-gold/40 mt-12">

      <div className="ashoka-rule"></div>

      <div className="max-w-7xl mx-auto px-4 py-10 grid sm:grid-cols-3 gap-8 text-sm">

        <div>

          <div className="font-display font-bold text-xl text-gold-light flex items-center gap-2">
            <span>📦</span>
            Safar-Saathi
          </div>

          <p className="text-cream/70 mt-2 leading-relaxed">
            {t('footer.note')}
          </p>

          <p className="text-xs text-gold/80 mt-3 font-mono">
            © Safar-Saathi
          </p>

        </div>

        <div className="border-t sm:border-t-0 sm:border-l border-gold/20 pt-4 sm:pt-0 sm:pl-6">

          <div className="font-display font-semibold text-gold-light text-base mb-2">
            Helpline
          </div>

          <p className="font-mono text-cream/90 font-medium text-base">
            📞 1800-419-0198
          </p>

        </div>

        <div className="border-t sm:border-t-0 sm:border-l border-gold/20 pt-4 sm:pt-0 sm:pl-6 text-xs text-cream/60 leading-relaxed">

          Move anything, anywhere.
          <br />

          Find vehicles · Offer trips · Track locations

        </div>

      </div>

    </footer>
  )
}


/* ================= PROTECTED ROUTE GUARD ================= */

function ProtectedRoute({ children, requiredType }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token")
      if (!token) {
        navigate('/login')
        return
      }

      try {
        const res = await fetch("http://localhost:8000/auth/status", {
          headers: { "Authorization": `Bearer ${token}` }
        })

        if (!res.ok) {
          localStorage.removeItem("access_token")
          navigate('/login')
          return
        }

        const data = await res.json()

        if (!data.is_profile_complete) {
          navigate('/complete-profile')
          return
        }

        // STRICT role separation
        if (requiredType === 'driver' && data.user_type !== 'driver') {
          localStorage.removeItem("access_token")
          navigate('/login', {
            state: {
              intent: 'offer',
              error: "This account belongs to Find a Vehicle (Sender). Please use a Driver account for Offer a Trip."
            }
          })
          return
        }

        if (requiredType === 'sender' && data.user_type === 'driver') {
          localStorage.removeItem("access_token")
          navigate('/login', {
            state: {
              intent: 'find',
              error: "This account belongs to Offer a Trip (Driver). Please use a Sender account for Find a Vehicle."
            }
          })
          return
        }
      } catch (err) {
        localStorage.removeItem("access_token")
        navigate('/login')
        return
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [navigate, requiredType])

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-green-soft font-semibold">Loading...</p>
      </div>
    )
  }

  return children
}


/* ================= APP SHELL ================= */

function Shell() {

  useEffect(() => {

    const fn = e => {

      const card =
        e.target.closest('.spot')

      if (!card) {
        return
      }

      const r =
        card.getBoundingClientRect()

      card.style.setProperty(
        '--mx',
        e.clientX - r.left + 'px'
      )

      card.style.setProperty(
        '--my',
        e.clientY - r.top + 'px'
      )

    }

    window.addEventListener(
      'mousemove',
      fn,
      {
        passive: true
      }
    )

    return () =>
      window.removeEventListener(
        'mousemove',
        fn
      )

  }, [])


  return (

    <div className="min-h-screen flex flex-col">

      <TopStrip />

      <Header />


      <main className="flex-1">
        <Routes>
          {/* HOME */}
          <Route
            path="/"
            element={<Home />}
          />

          {/* LOGIN & PROFILE SETUP */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/complete-profile" element={<ProfileSetupPage />} />

          {/* FIND VEHICLE - Only accessible by senders */}
          <Route
            path="/find"
            element={
              <ProtectedRoute requiredType="sender">
                <FindVehicles />
              </ProtectedRoute>
            }
          />

          {/* OFFER TRIP - Only accessible by drivers */}
          <Route
            path="/offer"
            element={
              <ProtectedRoute requiredType="driver">
                <OfferTrip />
              </ProtectedRoute>
            }
          />

          {/* SEPARATE FULL MAP PAGE */}
          <Route
            path="/maps"
            element={<Maps />}
          />

          {/* FALLBACK */}
          <Route
            path="*"
            element={<Home />}
          />
        </Routes>
      </main>


      <Footer />

      <MaargMitra />

      <ScrollTop />

    </div>

  )
}


/* ================= APP ================= */

export default function App() {

  return (

    <LangProvider>

      <AppProvider>

        <BrowserRouter>

          <Shell />

        </BrowserRouter>

      </AppProvider>

    </LangProvider>

  )
}