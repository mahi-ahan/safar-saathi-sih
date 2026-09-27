import React, { useState, useEffect, useRef } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation
} from 'react-router-dom';

import ProfileSetupPage from './ProfileSetupPage';
import LoginPage from './LoginPage';
import { Home, FindVehicles, OfferTrip } from './pages';
import LogisticsHub from './LogisticsHub';
import Maps from './maps';
import { API_BASE } from './apiConfig';

import {
  Mic,
  X,
  Menu,
  Languages,
  Volume2,
  VolumeX,
  Send,
  MapPin,
  Truck,
  IndianRupee,
  Compass
} from 'lucide-react';

import { speakText, stopSpeech } from './tts';
import { AuthModal } from './AuthModal';

import {
  LangProvider,
  useLang,
  AppProvider,
  useApp,
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
  },
  {
    to: '/logistics',
    key: 'logistics'
  }
]


/* ================= HEADER ================= */

function Header() {
  const { t } = useLang()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const handleNavClick = (e, item) => {
    e.preventDefault()
    setOpen(false)
    navigate(item.to)
  }

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
          {NAV.map(item => {
            const isActive = location.pathname === item.to
            return (
              <a
                key={item.to}
                href={item.to}
                onClick={e => handleNavClick(e, item)}
                className={`px-3.5 py-2 rounded-full font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-green-deep text-cream shadow-sm'
                    : 'text-green-deep hover:bg-green-deep/10'
                }`}
              >
                {t('nav.' + item.key)}
              </a>
            )
          })}
        </nav>

        {/* MOBILE MENU BUTTON */}
        <button
          className="md:hidden p-2 rounded-lg border border-gold/50 cursor-pointer"
          onClick={() => setOpen(o => !o)}
          aria-label="Menu"
        >
          {open
            ? <X size={20} />
            : <Menu size={20} />
          }
        </button>
      </div>

      {/* MOBILE NAV (HAMBURGER MENU) */}
      {open && (
        <nav className="md:hidden px-4 pb-3 flex flex-col gap-1.5 font-mono text-sm border-t border-gold/20 animate-[fadeIn_0.15s_ease]">
          {NAV.map(item => {
            const isActive = location.pathname === item.to
            return (
              <a
                key={item.to}
                href={item.to}
                onClick={e => handleNavClick(e, item)}
                className={`px-3 py-2.5 rounded-xl text-left font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-green-deep text-cream font-semibold'
                    : 'text-green-deep hover:bg-green-deep/10 bg-white/50 border border-gold/20'
                }`}
              >
                {t('nav.' + item.key)}
              </a>
            )
          })}
        </nav>
      )}
    </header>
  )
}


/* ================= MAARG MITRA KNOWLEDGE BASE ================= */

const MARG_KNOWLEDGE = {
  en: {
    hello: "Hello! I am Marg Mitra, your intelligent logistics assistant for Safar-Saathi. How can I help you transport cargo or manage your vehicle today?",
    find: "To book cargo space, go to 'Find a Vehicle'. Select your pickup and drop location, view verified vehicle capacities, and submit your request.",
    offer: "To offer a trip, go to 'Offer a Trip'. Set your origin, destination, vehicle cargo capacity in kg, and total desired fare.",
    pricing: "Our Ton-Km Fair Pricing formula calculates: Your Cargo Weight (kg) × Traveled Distance (km) ÷ Total Vehicle Workload. You only pay for what you use, and prices drop as more cargo joins!",
    tracking: "You can track your driver in real-time on our Live Map Radar. Drivers broadcast their live GPS location with speed and distance alerts.",
    verification: "Drivers undergo government document verification (Aadhaar & Driving Licence) to earn a verified shield badge for safe transport.",
    login: "Sign in using any Google account. You can operate as a Sender (booking cargo space) or a Driver (offering trip space).",
    help: "I can help you with: 1. Booking Cargo Space (/find) 2. Offering a Trip (/offer) 3. Fair Ton-Km Pricing 4. Live GPS Tracking (/maps) 5. Driver Verification.",
    fallback: "I can assist you with booking cargo space, publishing trips, understanding our fair Ton-Km fares, or tracking live vehicles. Please choose a topic or type your question below!"
  },
  hi: {
    hello: "नमस्ते! मैं मार्ग-मित्र हूँ, सफ़र-साथी का स्मार्ट सहायक। आज मैं आपके सामान परिवहन या गाड़ी बुकिंग में क्या मदद करूँ?",
    find: "सामान भेजने के लिए 'वाहन खोजें' पर जाएँ। अपना पिकअप और ड्रॉप स्थान चुनें, उपलब्ध क्षमता देखें और तुरंत जगह बुक करें।",
    offer: "यात्रा देने के लिए 'यात्रा दें' पर जाएँ। अपना मार्ग, तारीख, गाड़ी की क्षमता (किलो) और कुल लोड किराया दर्ज करें।",
    pricing: "हमारा टन-किमी निष्पक्ष फॉर्मूला: आपके सामान का वजन (किलो) × यात्रा दूरी (किमी)। साझा लोड से किराया अपने आप कम हो जाता है!",
    tracking: "आप लाइव मैप रडार पर अपनी गाड़ी को लाइव ट्रैक कर सकते हैं। ड्राइवर का जीपीएस और गति लाइव अपडेट होती है।",
    verification: "ड्राइवरों का आधार और ड्राइविंग लाइसेंस सत्यापित किया जाता है ताकि सुरक्षित और भरोसेमंद यात्रा सुनिश्चित हो सके।",
    login: "Google खाते से साइन इन करें। आप उपभोक्ता (Sender) या चालक (Driver) के रूप में काम कर सकते हैं।",
    help: "मैं इन कार्यों में मदद कर सकता हूँ: 1. गाड़ी खोजना (/find) 2. यात्रा दर्ज करना (/offer) 3. टन-किमी किराया समझना 4. लाइव ट्रैकिंग (/maps) 5. चालक सत्यापन।",
    fallback: "मैं आपको गाड़ी खोजने, यात्रा प्रकाशित करने, टन-किमी किराया समझने या लाइव जीपीएस ट्रैक करने में मदद कर सकता हूँ। कृपया नीचे कोई विषय चुनें या अपना प्रश्न लिखें।"
  },
  bho: {
    hello: "प्रणाम! हम मार्ग-मित्र हईं। आज रउआ सामान भेजे भा गाड़ी खोजे में का मदद करीं?",
    find: "सामान भेजे खातिर 'गाड़ी खोजीं' पर जाईं। रउआ आपन पिकअप आ डिलीवरी जगह चुन के जगह बुक कर सकीलें।",
    offer: "गाड़ी के ट्रिप देवे खातिर 'यात्रा दीं' पर जाईं आ आपन रूट आ किराया दर्ज करीं।",
    pricing: "टन-किमी फॉर्मूला से खाली आपन वजन (किलो) × दूरी (किमी) के किराया लागी।",
    tracking: "रउआ लाइव मैप रडार पर गाड़ी के लाइव लोकेशन देख सकीलें।",
    fallback: "रउआ गाड़ी खोजे, ट्रिप डाले, किराया जाने भा लाइव ट्रैक करे खातिर सवाल पूछ सकीलें।"
  },
  mr: {
    hello: "नमस्कार! मी मार्ग-मित्र आहे. आज मी आपल्याला मालवाहतूक किंवा वाहन शोधण्यात कशी मदत करू?",
    find: "माल पाठवण्यासाठी 'वाहन शोधा' वर जा. पिकअप आणि ड्रॉप ठिकाण निवडून जागेची विनंती करा.",
    offer: "प्रवास देण्यासाठी 'प्रवास नोंदवा' वर जा. आपला मार्ग, तारीख आणि क्षमता नोंदवा.",
    pricing: "टन-किमी फॉर्म्युला: मालाचे वजन (किलो) × अंतर (किमी). लोड सामायिक केल्यास भाडे कमी होते.",
    tracking: "आपण थेट नकाशा रडारवर वाहनाचे थेट लोकेशन पाहू शकता.",
    fallback: "मी आपल्याला वाहन शोधणे, प्रवास नोंदवणे, रास्त भाडे आणि थेट ट्रॅकिंगमध्ये मदत करू शकतो."
  },
  bn: {
    hello: "নমস্কার! আমি মার্গ-মিত্র। আজ আপনার পণ্য পরিবহন বা গাড়ি বুকিংয়ে কীভাবে সাহায্য করতে পারি?",
    find: "পণ্য পাঠাতে 'গাড়ি খুঁজুন' পেজে যান। আপনার স্থান নির্বাচন করে জায়গা বুক করুন।",
    offer: "ট্রিপ পোস্ট করতে 'ট্রিপ পোস্ট করুন' পেজে যান এবং আপনার রুট ও ভাড়া প্রকাশ করুন।",
    pricing: "টন-কিমি ন্যায্য মূল্য: পণ্যের ওজন (কেজি) × দূরত্ব (কিমি) অনুসারে সাশ্রয়ী ভাড়া।",
    tracking: "আপনি লাইভ ম্যাপ রাডারে গাড়ির অবস্থান রিয়েল-টাইমে ট্র্যাক করতে পারেন।",
    fallback: "আমি আপনাকে গাড়ি খুঁজতে, ট্রিপ পোস্ট করতে, টন-কিমি ভাড়া জানতে বা লাইভ ট্র্যাক করতে সাহায্য করতে পারি।"
  },
  te: {
    hello: "నమస్కారం! నేను మార్గ-మిత్ర. మీ సరుకు రవాణా లేదా వాహన బుకింగ్‌లో నేను ఎలా సహాయపడగలను?",
    find: "సరుకు పంపడానికి 'వాహనాన్ని శోధించండి' కి వెళ్లండి. పికప్ మరియు డెలివరీ ఎంచుకుని స్థలాన్ని బుక్ చేసుకోండి.",
    offer: "ట్రిప్ ఇవ్వడానికి 'ట్రిప్ ఆఫర్ చేయండి' కి వెళ్ళండి మరియు మీ రూట్ మరియు కిరాయిని పోస్ట్ చేయండి.",
    pricing: "టన్-కిమీ ఫార్ములా: సరుకు బరువు (కిలో) × దూరం (కిమీ) కి మాత్రమే న్యాయమైన ఛార్జీ.",
    tracking: "లైవ్ మ్యాప్ రాడార్‌లో వాహనాన్ని రియల్-టైమ్‌లో ట్రాక్ చేయవచ్చు.",
    fallback: "నేను మీకు వాహనం శోధన, ట్రిప్ పోస్టింగ్, టన్-కిమీ ఛార్జీలు మరియు లైవ్ ట్రాకింగ్‌లో సహాయపడగలను."
  },
  ta: {
    hello: "வணக்கம்! நான் மார்க்-மித்ரா. உங்கள் சரக்கு போக்குவரத்து அல்லது வாகன முன்பதிவில் நான் எவ்வாறு உதவ முடியும்?",
    find: "சரக்கு அனுப்ப 'வாகனம் தேடுங்கள்' பக்கத்திற்கு செல்லுங்கள். உங்கள் பிக்கப் மற்றும் சேருமிடம் தேர்வு செய்து முன்பதிவு செய்யுங்கள்.",
    offer: "பயணத்தை பதிவு செய்ய 'பயணத்தை பதிவு செய்யுங்கள்' பக்கத்திற்கு சென்று உங்கள் வழித்தடம் மற்றும் கட்டணத்தை உள்ளிடுங்கள்.",
    pricing: "டன்-கிமீ நியாயமான விலை: சரக்கின் எடை (கிலோ) × தூரம் (கிமீ) அடிப்படையில் மட்டுமே கட்டணம்.",
    tracking: "லைவ் வரைபடத்தில் நிகழ்நேரத்தில் வாகனத்தை கண்காணிக்கலாம்.",
    fallback: "வாகனம் தேட, பயணத்தை வெளியிட, கட்டணம் அறிய மற்றும் லைவ் டிராக்கிங் செய்ய நான் உதவ முடியும்."
  }
};

/* ================= MAARG MITRA CHATBOT COMPONENT ================= */

function MaargMitra() {
  const { t, lang } = useLang()
  const { openAuthModal } = useApp()
  const nav = useNavigate()

  const [open, setOpen] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [pos, setPos] = useState({
    x: typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 80) : 320,
    y: typeof window !== 'undefined' ? Math.max(16, window.innerHeight - 96) : 500
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

  const getKnowledgeText = (key) => {
    const dict = MARG_KNOWLEDGE[lang] || MARG_KNOWLEDGE.hi || MARG_KNOWLEDGE.en;
    if (dict && dict[key]) return dict[key];
    const enDict = MARG_KNOWLEDGE.en;
    return enDict[key] || "I am here to help you navigate Safar-Saathi.";
  }

  const reply = async (keyOrText, go = null) => {
    const msg = MARG_KNOWLEDGE.en[keyOrText] ? getKnowledgeText(keyOrText) : keyOrText;

    setLog(l => [
      ...l,
      {
        who: 'bot',
        msg
      }
    ]);

    setIsSpeaking(true);
    speakText(msg, lang, () => {
      setIsSpeaking(false);
    });

    if (go) {
      if (go === '/find' || go === '/offer') {
        const intent = go === '/find' ? 'find' : 'offer';
        const token = localStorage.getItem("access_token");
        if (!token) {
          setTimeout(() => openAuthModal(intent), 600);
          return;
        }
        try {
          const res = await fetch(`${API_BASE}/auth/status`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const data = await res.json();
          if (!data.is_profile_complete) {
            setTimeout(() => nav('/complete-profile'), 700);
          } else if ((intent === 'find' && data.user_type === 'driver') || (intent === 'offer' && data.user_type !== 'driver')) {
            setTimeout(() => openAuthModal(intent), 600);
          } else {
            setTimeout(() => nav(go), 700);
          }
        } catch (err) {
          setTimeout(() => openAuthModal(intent), 600);
        }
      } else {
        setTimeout(() => nav(go), 700);
      }
    }
  }

  const handle = (raw) => {
    const q = (raw || '').toLowerCase().trim();
    if (!q) return;

    setLog(l => [
      ...l,
      {
        who: 'me',
        msg: raw
      }
    ]);

    // 1. GREETINGS
    if (/(hi|hello|hey|namaste|नमस्ते|नमस्कार|सलाम|हेलो|హలో|வணக்கம்|নমস্কার)/i.test(q)) {
      return reply('hello');
    }

    // 2. FIND VEHICLE / BOOKING CARGO
    if (/(find|search|vehicle|truck|cargo|space|book|parcel|goods|वाहन|गाड़ी|खोज|सामान|भेजें|बुक|गाडी|লরি|गाडी|வாகனம்)/i.test(q)) {
      return reply('find', '/find');
    }

    // 3. OFFER A TRIP / DRIVER PUBLISHING
    if (/(offer|driver|publish|earn|chalak|ड्राइवर|चालक|यात्रा|सफर|रूट|कमाई|पोस्ट|ट्रिप|ఆఫర్|பயணம்)/i.test(q)) {
      return reply('offer', '/offer');
    }

    // 4. PRICING / TON-KM / FARE
    if (/(price|pricing|fare|cost|rate|ton-km|ton|split|discount|money|किराया|दाम|पैसे|दर|टन-किमी|लागत|ధర|கட்டணம்|ভাড়া)/i.test(q)) {
      return reply('pricing');
    }

    // 5. LIVE GPS / RADAR / TRACKING
    if (/(map|maps|radar|live|track|gps|location|speed|नक्शा|मैप|ट्रैक|स्थान|लाइव|మ్యాప్|வரைபடம்|ম্যাপ)/i.test(q)) {
      return reply('tracking', '/maps');
    }

    // 6. VERIFICATION / SECURITY
    if (/(verify|verification|aadhaar|license|licence|shield|doc|document|सत्यापन|आधार|लाइसेंस|पहचान|दस्तावेज)/i.test(q)) {
      return reply('verification');
    }

    // 7. LOGIN / AUTH / ACCOUNT
    if (/(login|signin|google|account|profile|sender|role|लॉगिन|साइन|प्रोफाइल|खाता)/i.test(q)) {
      return reply('login', '/login');
    }

    // 8. HELP & FEATURES
    if (/(help|support|contact|feature|how|मदद|सहायता|संपर्क|कदम|సహాయం|உதவி)/i.test(q)) {
      return reply('help');
    }

    // 9. SMART FALLBACK (Always helpful, never crashes)
    reply('fallback');
  }

  const listen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      reply('fallback');
      return;
    }

    const rec = new SR();
    const tag = (LANGS.find(l => l.id === lang) || LANGS[0]).voice || 'hi-IN';
    rec.lang = tag;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = e => {
      const transcript = e.results?.[0]?.[0]?.transcript;
      if (transcript) {
        handle(transcript);
      }
    };
    rec.onerror = () => setListening(false);

    try {
      rec.start();
    } catch (err) {
      setListening(false);
    }
  }

  const down = e => {
    d.current = {
      on: true,
      dx: e.clientX - pos.x,
      dy: e.clientY - pos.y,
      moved: 0
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  const move = e => {
    if (!d.current.on) return;

    d.current.moved += Math.abs(e.movementX || 1) + Math.abs(e.movementY || 1);

    setPos({
      x: Math.min(Math.max(8, e.clientX - d.current.dx), (window.innerWidth || 400) - 64),
      y: Math.min(Math.max(8, e.clientY - d.current.dy), (window.innerHeight || 600) - 64)
    });
  }

  const up = () => {
    if (d.current.on && d.current.moved < 6) {
      setOpen(o => !o);
      if (!log.length) {
        const welcome = getKnowledgeText('hello');
        setLog([{ who: 'bot', msg: welcome }]);
        setIsSpeaking(true);
        speakText(welcome, lang, () => setIsSpeaking(false));
      }
    }
    d.current.on = false;
  }

  const pw = 340;
  const ph = 460;

  const left = Math.max(8, Math.min(pos.x + 56 - pw, (window.innerWidth || 400) - pw - 8));
  const top = pos.y - ph - 12 > 8 ? pos.y - ph - 12 : Math.min(pos.y + 68, (window.innerHeight || 600) - ph - 8);

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
        className="fixed z-[100] w-14 h-14 rounded-full bg-green-deep text-cream shadow-2xl flex items-center justify-center hover:scale-105 transition-all touch-none cursor-grab active:cursor-grabbing border-2 border-gold/60"
        title="MARG-MITRA AI"
      >
        <div className={`delivery-girl ${listening ? 'pulse animate-bounce' : ''}`}>
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
          className="fixed z-[99] bg-cream rounded-3xl shadow-2xl border border-gold/60 overflow-hidden animate-[scaleIn_0.2s_ease]"
        >
          {/* BOT HEADER */}
          <div className="bg-green-deep text-cream px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <h4 className="font-display font-bold text-sm text-gold leading-none">MARG-MITRA</h4>
                <p className="text-[10px] text-green-soft mt-0.5">Safar-Saathi AI Logistics Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeech();
                    setIsSpeaking(false);
                  } else if (log.length > 0) {
                    const lastBot = [...log].reverse().find(x => x.who === 'bot');
                    if (lastBot) {
                      setIsSpeaking(true);
                      speakText(lastBot.msg, lang, () => setIsSpeaking(false));
                    }
                  }
                }}
                className={`p-1.5 rounded-lg text-xs transition ${isSpeaking ? 'bg-amber-400 text-green-deep animate-pulse' : 'hover:bg-white/15 text-cream'}`}
                title={isSpeaking ? "Stop Voice" : "Listen to Response"}
              >
                {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>

              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-white/15 rounded-lg text-cream transition"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* CHAT MESSAGES LOG */}
          <div className="h-60 overflow-y-auto p-3.5 space-y-2.5 bg-paper/90">
            {log.map((x, i) => (
              <div
                key={i}
                className={`flex ${x.who === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed shadow-2xs ${
                    x.who === 'me'
                      ? 'bg-green-deep text-cream rounded-tr-xs'
                      : 'bg-white border border-gold/30 text-soil rounded-tl-xs'
                  }`}
                >
                  {x.msg}
                </div>
              </div>
            ))}
          </div>

          {/* QUICK SUGGESTION CHIPS */}
          <div className="px-3 py-2 flex flex-wrap gap-1.5 bg-cream/90 border-t border-gold/20">
            <button
              onClick={() => reply('find', '/find')}
              className="text-[11px] font-semibold bg-white hover:bg-gold/20 text-green-deep border border-gold/40 rounded-full px-2.5 py-1 transition flex items-center gap-1 cursor-pointer"
            >
              <Truck size={11} /> {t('nav.find', 'Find Vehicle')}
            </button>

            <button
              onClick={() => reply('offer', '/offer')}
              className="text-[11px] font-semibold bg-white hover:bg-gold/20 text-green-deep border border-gold/40 rounded-full px-2.5 py-1 transition flex items-center gap-1 cursor-pointer"
            >
              <Compass size={11} /> {t('nav.offer', 'Offer Trip')}
            </button>

            <button
              onClick={() => reply('pricing')}
              className="text-[11px] font-semibold bg-white hover:bg-gold/20 text-green-deep border border-gold/40 rounded-full px-2.5 py-1 transition flex items-center gap-1 cursor-pointer"
            >
              <IndianRupee size={11} /> Ton-Km Fares
            </button>

            <button
              onClick={() => reply('tracking', '/maps')}
              className="text-[11px] font-semibold bg-white hover:bg-gold/20 text-green-deep border border-gold/40 rounded-full px-2.5 py-1 transition flex items-center gap-1 cursor-pointer"
            >
              <MapPin size={11} /> Live Maps
            </button>
          </div>

          {/* CHAT INPUT FORM */}
          <form
            className="flex p-2.5 bg-cream gap-2 border-t border-gold/20"
            onSubmit={e => {
              e.preventDefault();
              if (txt.trim()) {
                handle(txt);
                setTxt('');
              }
            }}
          >
            <input
              value={txt}
              onChange={e => setTxt(e.target.value)}
              placeholder="Ask Marg Mitra in your language…"
              className="flex-1 rounded-xl border border-gold/40 bg-white px-3 py-2 text-[12px] outline-none focus:border-green-deep transition"
            />

            <button
              type="button"
              onClick={listen}
              className={`rounded-xl px-3 flex items-center justify-center transition cursor-pointer ${
                listening ? 'bg-red-500 text-white animate-pulse' : 'bg-gold hover:bg-gold/80 text-green-deep'
              }`}
              title="Voice Input"
            >
              <Mic size={15} />
            </button>

            <button
              type="submit"
              className="bg-green-deep hover:bg-green text-cream rounded-xl px-3.5 flex items-center justify-center transition cursor-pointer"
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
        navigate('/login', { state: { intent: requiredType === 'driver' ? 'offer' : 'find' } })
        return
      }

      try {
        const res = await fetch(`${API_BASE}/auth/status`, {
          headers: { "Authorization": `Bearer ${token}` }
        })

        if (!res.ok) {
          localStorage.removeItem("access_token")
          navigate('/login', { state: { intent: requiredType === 'driver' ? 'offer' : 'find' } })
          return
        }

        const data = await res.json()

        if (data.authenticated === false) {
          localStorage.removeItem("access_token")
          navigate('/login', { state: { intent: requiredType === 'driver' ? 'offer' : 'find' } })
          return
        }

        if (!data.is_profile_complete) {
          const derivedIntent = requiredType === 'driver' ? 'offer' : 'find'
          localStorage.setItem("login_intent", derivedIntent)
          navigate('/complete-profile', { state: { intent: derivedIntent } })
          return
        }

        // Strict Role-Based Route Protection:
        // Senders (user_type !== 'driver') cannot access Driver Operations (/offer)
        // Drivers (user_type === 'driver') cannot access Sender Hub (/find)
        if (requiredType === 'driver' && data.user_type !== 'driver') {
          navigate('/login', {
            state: {
              intent: 'offer',
              error: `This Google account is registered as a Sender (${data.email || ''}). An email registered for Find a Vehicle cannot be used to Offer a Trip. Please sign in with a Driver account, or return to Find a Vehicle.`
            }
          });
          return;
        }

        if (requiredType === 'sender' && data.user_type === 'driver') {
          navigate('/login', {
            state: {
              intent: 'find',
              error: `This Google account is registered as a Driver (${data.email || ''}). An email registered for Offer a Trip cannot be used for Find a Vehicle. Please sign in with a Sender account, or return to Offer a Trip.`
            }
          });
          return;
        }

        localStorage.setItem("user_type", data.user_type);
      } catch (err) {
        console.error("Auth status error:", err)
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
  const { authModal, closeAuthModal } = useApp()

  useEffect(() => {
    const fn = e => {
      const card = e.target.closest('.spot')
      if (!card) return
      const r = card.getBoundingClientRect()
      card.style.setProperty('--mx', e.clientX - r.left + 'px')
      card.style.setProperty('--my', e.clientY - r.top + 'px')
    }

    window.addEventListener('mousemove', fn, { passive: true })
    return () => window.removeEventListener('mousemove', fn)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <TopStrip />
      <Header />

      <main className="flex-1">
        <Routes>
          {/* HOME */}
          <Route path="/" element={<Home />} />

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
          <Route path="/maps" element={<Maps />} />

          {/* LOGISTICS OPERATIONS & COLD-CHAIN HUB */}
          <Route path="/logistics" element={<LogisticsHub />} />

          {/* FALLBACK */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      <Footer />
      <MaargMitra />
      <ScrollTop />

      {/* GLOBAL AUTH MODAL */}
      <AuthModal
        isOpen={authModal?.isOpen}
        intent={authModal?.intent}
        onClose={closeAuthModal}
      />
    </div>
  )
}


/* ================= APP ================= */

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <AppProvider>
          <Shell />
        </AppProvider>
      </BrowserRouter>
    </LangProvider>
  )
}