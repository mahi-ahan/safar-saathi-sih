import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Truck, Package, ShieldCheck, ArrowLeft, Volume2, VolumeX, Info } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLang } from './lib';
import { speakText, stopSpeech } from './tts';
import { GOOGLE_CLIENT_ID, AUTH_ROLE_TEXTS } from './AuthModal';

export function LoginPage() {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const [intent, setIntent] = useState(location.state?.intent || localStorage.getItem('login_intent') || 'find');
  const [loading, setLoading] = useState(false);
  const [roleError, setRoleError] = useState(location.state?.error ? { type: 'initial', message: location.state.error } : null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const localizedText = AUTH_ROLE_TEXTS[lang] || AUTH_ROLE_TEXTS.hi || AUTH_ROLE_TEXTS.en;

  useEffect(() => {
    if (location.state?.intent) {
      setIntent(location.state.intent);
    }
  }, [location.state]);

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
      const res = await fetch("http://localhost:8000/auth/google-login", {
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
          navigate('/complete-profile', { state: { intent } });
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

        if (data.user_type === 'driver') {
          navigate('/offer');
        } else {
          navigate('/find');
        }
      } else {
        const detail = data.detail || "Google authentication failed. Please try again.";
        setRoleError({ type: 'general', message: detail });
        speakText(detail, lang);
      }
    } catch (err) {
      console.error("Auth error:", err);
      const netErr = "Could not connect to authentication server. Ensure backend is running.";
      setRoleError({ type: 'network', message: netErr });
      speakText(netErr, lang);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F5F7F6] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* BACKGROUND GLOW */}
      <div className="absolute top-[-100px] left-1/3 w-[500px] h-[500px] rounded-full bg-green/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-1/4 w-[450px] h-[450px] rounded-full bg-gold/10 blur-[100px] pointer-events-none"></div>

      <div className="relative w-full max-w-lg bg-paper/95 backdrop-blur-xl border border-gold/40 rounded-3xl p-6 sm:p-9 shadow-2xl overflow-hidden animate-[fadeIn_0.3s_ease]">
        
        {/* TOP ACCENT DECORATION */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-soil via-gold to-green-deep"></div>

        {/* HEADER BAR WITH BACK TO HOME & VOICE */}
        <div className="flex items-center justify-between mb-5 pt-1">
          <button
            type="button"
            onClick={() => {
              stopSpeech();
              navigate('/');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/70 text-green-deep border border-gold/30 hover:bg-white hover:border-gold/60 transition cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>{t('nav.home', 'Home')}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleVoice}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
              isSpeaking
                ? 'bg-green-700 text-white border-green-500 animate-pulse shadow-sm'
                : 'bg-gold/15 text-green-deep border-gold/40 hover:bg-gold/30'
            }`}
            title="Listen to Instructions"
          >
            {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isSpeaking ? "Stop Voice" : "Listen Aloud"}</span>
          </button>
        </div>

        {/* ROLE SELECTOR TABS */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-black/5 border border-gold/30 mb-6 gap-1">
          <button
            type="button"
            onClick={() => {
              setIntent('find');
              setRoleError(null);
              localStorage.setItem('login_intent', 'find');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              intent === 'find'
                ? 'bg-green-deep text-cream shadow-md'
                : 'text-green-soft hover:text-green-deep hover:bg-white/50'
            }`}
          >
            <Package size={15} className={intent === 'find' ? 'text-gold-light' : 'text-soil'} />
            <span className="truncate">{t('nav.find', 'Find Vehicle')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIntent('offer');
              setRoleError(null);
              localStorage.setItem('login_intent', 'offer');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              intent === 'offer'
                ? 'bg-green-deep text-cream shadow-md'
                : 'text-green-soft hover:text-green-deep hover:bg-white/50'
            }`}
          >
            <Truck size={15} className={intent === 'offer' ? 'text-gold-light' : 'text-soil'} />
            <span className="truncate">{t('nav.offer', 'Offer Trip')}</span>
          </button>
        </div>

        {/* ROLE ICON & HEADER */}
        <div className="text-center mb-5">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-green-deep/10 to-gold/20 border border-gold/30 flex items-center justify-center text-3xl shadow-inner">
            {intent === 'offer' ? <Truck className="text-green-deep" size={32} /> : <Package className="text-soil" size={32} />}
          </div>

          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider bg-green-deep/10 text-green-deep mb-2">
            {intent === 'offer' ? localizedText.driver_title : localizedText.sender_title}
          </span>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-green-deep">
            {localizedText.title}
          </h2>
          <p className="text-xs sm:text-sm text-green-soft mt-1.5">
            {localizedText.subtitle}
          </p>
        </div>

        {/* FRIENDLY ROLE INFO BANNER */}
        <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left">
          <div className="flex items-start gap-2.5">
            <Info className="text-amber-700 shrink-0 mt-0.5" size={18} />
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
          <div className="mb-5 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-left animate-[fadeIn_0.2s_ease]">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={18} />
              <div className="text-xs text-blue-900 space-y-2.5">
                <p className="font-medium leading-relaxed text-[12px]">
                  {roleError.message}
                </p>

                {roleError.type === 'driver_on_sender' && roleError.token && (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem("access_token", roleError.token);
                      navigate('/offer');
                    }}
                    className="px-3.5 py-1.5 bg-green-deep text-cream rounded-xl text-xs font-semibold hover:bg-green transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Truck size={14} /> {localizedText.go_driver} →
                  </button>
                )}

                {roleError.type === 'sender_on_driver' && roleError.token && (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem("access_token", roleError.token);
                      navigate('/find');
                    }}
                    className="px-3.5 py-1.5 bg-soil text-cream rounded-xl text-xs font-semibold hover:bg-soil-light transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Package size={14} /> {localizedText.go_sender} →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* GOOGLE SIGN IN BUTTON */}
        <div className="flex flex-col items-center justify-center my-4">
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <div className="transform hover:scale-102 transition-transform shadow-sm rounded-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  const failMsg = "Google Sign In Failed. Please try again.";
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
            <div className="flex items-center gap-2 mt-4 text-xs text-green-soft font-medium animate-pulse">
              <div className="w-4 h-4 border-2 border-green-deep border-t-transparent rounded-full animate-spin"></div>
              <span>{localizedText.logging_in}</span>
            </div>
          )}
        </div>

        {/* FOOTER PRIVACY NOTICE */}
        <p className="text-[11px] text-green-soft text-center mt-5">
          🛡️ Verified by Government Digital Logistics Infrastructure
        </p>

      </div>
    </div>
  );
}

export default LoginPage;