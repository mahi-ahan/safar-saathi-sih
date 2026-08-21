import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { X, Info, Volume2, VolumeX, ShieldCheck, Truck, Package } from 'lucide-react';
import { useLang } from './lib';
import { speakText, stopSpeech } from './tts';
import { useNavigate } from 'react-router-dom';

export const GOOGLE_CLIENT_ID = "985266026061-a7hpfspuv6hc17pc72camb1gig9vucqq.apps.googleusercontent.com";

export const AUTH_ROLE_TEXTS = {
  en: {
    title: "Sign in to Safar-Saathi",
    subtitle: "Fast, secure single-click sign in with your Google account.",
    sender_title: "Find a Vehicle (Cargo Sender)",
    driver_title: "Offer a Trip (Transporter / Driver)",
    role_notice_title: "One Role per Google Account",
    role_notice_body: "Note: In Safar-Saathi, each Google account is dedicated to one role (either Sender or Driver). If you need both, please use separate Google accounts.",
    sender_mismatch: "This Google account is already registered as a Transporter (Driver). Please sign in with a Sender account to book cargo space, or proceed to Driver Operations.",
    driver_mismatch: "This Google account is already registered as a Sender. Please sign in with a Driver account to offer trips, or proceed to Find a Vehicle.",
    continue_as: "Or switch to your registered role:",
    go_driver: "Go to Driver Hub",
    go_sender: "Go to Sender Hub",
    logging_in: "Authenticating with Safar-Saathi..."
  },
  hi: {
    title: "सफ़र-साथी में साइन इन करें",
    subtitle: "अपने Google खाते से एक क्लिक में सुरक्षित साइन इन करें।",
    sender_title: "वाहन खोजें (सामान भेजने वाले)",
    driver_title: "यात्रा दें (चालक / ट्रांसपोर्टर)",
    role_notice_title: "एक Google खाता — एक भूमिका",
    role_notice_body: "सूचना: सफ़र-साथी में प्रत्येक Google खाता केवल एक भूमिका (सामान भेजने वाले या चालक) के लिए निर्धारित होता है। दोनों का उपयोग करने के लिए अलग-अलग Google खातों का उपयोग करें।",
    sender_mismatch: "यह Google खाता पहले से चालक (Driver) के रूप में पंजीकृत है। सामान भेजने के लिए कृपया अन्य खाता चुनें या चालक डैशबोर्ड पर जाएँ।",
    driver_mismatch: "यह Google खाता पहले से उपभोक्ता (Sender) के रूप में पंजीकृत है। यात्रा देने के लिए कृपया चालक खाता चुनें या वाहन खोजें पर जाएँ।",
    continue_as: "या अपनी पंजीकृत भूमिका पर जाएँ:",
    go_driver: "चालक डैशबोर्ड पर जाएँ",
    go_sender: "उपभोक्ता डैशबोर्ड पर जाएँ",
    logging_in: "साइन इन हो रहा है..."
  },
  mr: {
    title: "सफ़र-साथी मध्ये साइन इन करा",
    subtitle: "आपल्या Google खात्यासह एका क्लिकवर सुरक्षित साइन इन करा.",
    sender_title: "वाहन शोधा (माल पाठवणारे)",
    driver_title: "प्रवास नोंदवा (चालक / ट्रान्सपोर्टर)",
    role_notice_title: "एका Google खात्यासाठी एकच भूमिका",
    role_notice_body: "सूचना: प्रत्येक Google खाते केवळ एका भूमिकेसाठी (माल पाठवणारे किंवा चालक) वापरता येते. दोन्ही भूमिकांसाठी स्वतंत्र खाती वापरा.",
    sender_mismatch: "हे Google खाते चालक म्हणून नोंदणीकृत आहे. कृपया माल पाठवण्यासाठी दुसरे खाते वापरा किंवा चालक डॅशबोर्डवर जा.",
    driver_mismatch: "हे Google खाते माल पाठवणारे म्हणून नोंदणीकृत आहे. कृपया चालक खाते वापरा किंवा वाहन शोधा वर जा.",
    continue_as: "किंवा आपल्या भूमिकेवर जा:",
    go_driver: "चालक डॅशबोर्ड",
    go_sender: "ग्राहक डॅशबोर्ड",
    logging_in: "लॉगिन होत आहे..."
  },
  bn: {
    title: "সফর-সাথীতে সাইন ইন করুন",
    subtitle: "আপনার Google অ্যাকাউন্ট দিয়ে সহজে সাইন ইন করুন।",
    sender_title: "গাড়ি খুঁজুন (পণ্য প্রেরক)",
    driver_title: "ট্রিপ পোস্ট করুন (ড্রাইভার / পরিবহনকারী)",
    role_notice_title: "প্রতি Google অ্যাকাউন্টে একটি ভূমিকা",
    role_notice_body: "বিজ্ঞপ্তি: সফর-সাথীতে প্রতিটি Google অ্যাকাউন্ট শুধুমাত্র একটি ভূমিকার (প্রেরক বা ড্রাইভার) জন্য নির্ধারিত।",
    sender_mismatch: "এই Google অ্যাকাউন্টটি ড্রাইভার হিসাবে নিবন্ধিত। পণ্য পাঠাতে অন্য অ্যাকাউন্ট ব্যবহার করুন।",
    driver_mismatch: "এই Google অ্যাকাউন্টটি প্রেরক হিসাবে নিবন্ধিত। ট্রিপ দিতে ড্রাইভার অ্যাকাউন্ট ব্যবহার করুন।",
    continue_as: "অথবা আপনার নিবন্ধিত ড্যাশবোর্ডে যান:",
    go_driver: "ড্রাইভার ড্যাশবোর্ড",
    go_sender: "প্রেরক ড্যাশবোর্ড",
    logging_in: "লগইন হচ্ছে..."
  }
};

export function AuthModal({
  isOpen,
  onClose,
  intent = 'find', // 'find' | 'offer'
  onSuccess = null
}) {
  const { lang } = useLang();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [roleError, setRoleError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const localizedText = AUTH_ROLE_TEXTS[lang] || AUTH_ROLE_TEXTS.hi || AUTH_ROLE_TEXTS.en;

  // Auto-speak narration when modal opens or when role mismatch occurs
  useEffect(() => {
    if (isOpen) {
      setRoleError(null);
      const textToNarrate = `${localizedText.title}. ${intent === 'offer' ? localizedText.driver_title : localizedText.sender_title}. ${localizedText.role_notice_body}`;
      
      setIsSpeaking(true);
      speakText(textToNarrate, lang, () => {
        setIsSpeaking(false);
      });
    } else {
      stopSpeech();
      setIsSpeaking(false);
    }
  }, [isOpen, intent, lang]);

  if (!isOpen) return null;

  const handleToggleVoice = () => {
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
    } else {
      const textToNarrate = roleError 
        ? roleError.message 
        : `${localizedText.title}. ${intent === 'offer' ? localizedText.driver_title : localizedText.sender_title}. ${localizedText.role_notice_body}`;
      
      setIsSpeaking(true);
      speakText(textToNarrate, lang, () => {
        setIsSpeaking(false);
      });
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setRoleError(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          google_token: credentialResponse.credential
        })
      });

      const data = await res.json();

      if (res.ok) {
        if (!data.is_profile_complete) {
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("login_intent", intent);
          onClose();
          navigate('/complete-profile');
          return;
        }

        // Check for Intent vs Role Mismatch
        if (intent === 'find' && data.user_type === 'driver') {
          localStorage.removeItem("access_token");
          const errorMsg = localizedText.sender_mismatch;
          setRoleError({
            type: 'driver_on_sender',
            message: errorMsg,
            token: data.access_token
          });
          speakText(errorMsg, lang);
          return;
        }

        if (intent === 'offer' && data.user_type !== 'driver') {
          localStorage.removeItem("access_token");
          const errorMsg = localizedText.driver_mismatch;
          setRoleError({
            type: 'sender_on_driver',
            message: errorMsg,
            token: data.access_token
          });
          speakText(errorMsg, lang);
          return;
        }

        localStorage.removeItem('login_intent');
        localStorage.setItem("access_token", data.access_token);
        
        onClose();
        if (onSuccess) {
          onSuccess(data);
        } else if (data.user_type === 'driver') {
          navigate('/offer');
        } else {
          navigate('/find');
        }
      } else {
        const detail = data.detail || "Google authentication failed on backend.";
        setRoleError({ type: 'general', message: detail });
        speakText(detail, lang);
      }
    } catch (err) {
      console.error("Auth error:", err);
      const netErr = "Could not connect to FastAPI server. Ensure backend is running.";
      setRoleError({ type: 'network', message: netErr });
      speakText(netErr, lang);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-[fadeIn_0.2s_ease]">
      <div 
        className="relative w-full max-w-md bg-paper/95 backdrop-blur-xl border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl animate-[scaleIn_0.25s_ease] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* TOP ACCENT DECORATION */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-soil via-gold to-green-deep"></div>

        {/* CLOSE & VOICE HEADER */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
              isSpeaking
                ? 'bg-green-700 text-white border-green-500 animate-pulse shadow-sm'
                : 'bg-gold/15 text-green-deep border-gold/40 hover:bg-gold/30'
            }`}
            title="Listen to Instructions"
          >
            {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isSpeaking ? "Stop Voice" : "Listen Aloud"}</span>
          </button>

          <button
            onClick={() => {
              stopSpeech();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-black/5 text-gray-500 hover:text-gray-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ROLE ICON & INTENT BADGE */}
        <div className="text-center mb-4">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-green-deep/10 to-gold/20 border border-gold/30 flex items-center justify-center text-2xl shadow-inner">
            {intent === 'offer' ? <Truck className="text-green-deep" size={28} /> : <Package className="text-soil" size={28} />}
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider bg-green-deep/10 text-green-deep mb-1.5">
            {intent === 'offer' ? localizedText.driver_title : localizedText.sender_title}
          </span>

          <h3 className="font-display font-bold text-2xl text-green-deep">
            {localizedText.title}
          </h3>
          <p className="text-xs text-green-soft mt-1">
            {localizedText.subtitle}
          </p>
        </div>

        {/* FRIENDLY ROLE WARNING BANNER */}
        <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left">
          <div className="flex items-start gap-2.5">
            <Info className="text-amber-700 shrink-0 mt-0.5" size={17} />
            <div className="text-xs text-amber-950">
              <p className="font-bold text-amber-900">{localizedText.role_notice_title}</p>
              <p className="mt-0.5 leading-relaxed text-[11.5px] text-amber-900/90">
                {localizedText.role_notice_body}
              </p>
            </div>
          </div>
        </div>

        {/* DYNAMIC ROLE MISMATCH / ERROR BANNER */}
        {roleError && (
          <div className="mb-5 p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-left animate-[fadeIn_0.2s_ease]">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={18} />
              <div className="text-xs text-blue-900 space-y-2">
                <p className="font-medium leading-relaxed text-[11.5px]">
                  {roleError.message}
                </p>

                {roleError.type === 'driver_on_sender' && roleError.token && (
                  <button
                    onClick={() => {
                      localStorage.setItem("access_token", roleError.token);
                      onClose();
                      navigate('/offer');
                    }}
                    className="mt-1 px-3 py-1.5 bg-green-deep text-cream rounded-xl text-xs font-semibold hover:bg-green transition flex items-center gap-1 cursor-pointer"
                  >
                    <Truck size={13} /> {localizedText.go_driver} →
                  </button>
                )}

                {roleError.type === 'sender_on_driver' && roleError.token && (
                  <button
                    onClick={() => {
                      localStorage.setItem("access_token", roleError.token);
                      onClose();
                      navigate('/find');
                    }}
                    className="mt-1 px-3 py-1.5 bg-soil text-cream rounded-xl text-xs font-semibold hover:bg-soil-light transition flex items-center gap-1 cursor-pointer"
                  >
                    <Package size={13} /> {localizedText.go_sender} →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* GOOGLE SIGN IN BUTTON */}
        <div className="flex flex-col items-center justify-center my-2">
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <div className="transform hover:scale-102 transition-transform">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  const failMsg = "Google Sign In Failed. Please check popups or try again.";
                  setRoleError({ type: 'fail', message: failMsg });
                  speakText(failMsg, lang);
                }}
                useOneTap={false}
                prompt="select_account"
                theme="outline"
                shape="pill"
                size="large"
                text="continue_with"
                width="280"
              />
            </div>
          </GoogleOAuthProvider>

          {loading && (
            <div className="flex items-center gap-2 mt-3 text-xs text-green-soft font-medium animate-pulse">
              <div className="w-3.5 h-3.5 border-2 border-green-deep border-t-transparent rounded-full animate-spin"></div>
              <span>{localizedText.logging_in}</span>
            </div>
          )}
        </div>

        {/* FOOTER PRIVACY NOTICE */}
        <p className="text-[10.5px] text-green-soft text-center mt-4">
          🛡️ Verified by Government Digital Logistics Infrastructure
        </p>
      </div>
    </div>
  );
}
