import React, { useState, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useLang } from './lib';

// Global voice cache & async voice initialization
let cachedVoices = [];

export function loadVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const voices = window.speechSynthesis.getVoices() || [];
  if (voices.length > 0) {
    cachedVoices = voices;
  }
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
  };
}

/**
 * Maps language ID to preferred BCP-47 tag and regional voice names
 */
const VOICE_CODE_MAP = {
  en: ['en-IN', 'en-GB', 'en-US'],
  hi: ['hi-IN', 'hi'],
  bho: ['hi-IN', 'hi'],
  mr: ['mr-IN', 'mr', 'hi-IN'],
  bn: ['bn-IN', 'bn-BD', 'bn'],
  ur: ['ur-IN', 'ur-PK', 'ur', 'hi-IN'],
  te: ['te-IN', 'te'],
  ta: ['ta-IN', 'ta-LK', 'ta'],
  kn: ['kn-IN', 'kn'],
  ml: ['ml-IN', 'ml'],
  or: ['or-IN', 'or', 'hi-IN'],
  pa: ['pa-IN', 'pa-PK', 'pa'],
  gu: ['gu-IN', 'gu', 'hi-IN']
};

/**
 * Finds the best matching regional voice from installed system/browser voices
 */
export function getBestVoiceForLang(langIdOrCode) {
  const voices = loadVoices();
  const codes = VOICE_CODE_MAP[langIdOrCode] || [langIdOrCode, 'hi-IN', 'en-IN'];

  for (const code of codes) {
    const cleanCode = code.toLowerCase().replace('_', '-');
    const prefix = cleanCode.split('-')[0];

    // 1. Exact match (e.g. hi-IN)
    const exact = voices.find(v => v.lang && v.lang.toLowerCase().replace('_', '-') === cleanCode);
    if (exact) return { voice: exact, langCode: exact.lang };

    // 2. Name contains language keyword
    const byName = voices.find(v => v.name && v.name.toLowerCase().includes(prefix));
    if (byName) return { voice: byName, langCode: byName.lang || cleanCode };

    // 3. Prefix match (e.g. hi)
    const byPrefix = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(prefix));
    if (byPrefix) return { voice: byPrefix, langCode: byPrefix.lang };
  }

  return { voice: null, langCode: codes[0] || 'hi-IN' };
}

/**
 * Cleans text from markdown and splits into natural conversational sentences for reliable long-paragraph speech.
 */
function splitIntoSentences(text) {
  if (!text) return [];
  const clean = text
    .replace(/[*_#`~[\]]/g, '') // remove markdown
    .replace(/₹/g, ' rupees ')
    .replace(/kg/gi, ' kilograms ')
    .replace(/km\/h/gi, ' kilometers per hour ')
    .replace(/km/gi, ' kilometers ')
    .replace(/→/g, ' to ')
    .replace(/·/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

  // Split by sentence terminators including Hindi purna viram (।)
  const sentences = clean
    .split(/(?<=[.?!।\n])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return sentences.length > 0 ? sentences : [clean];
}

let activeQueue = [];
let isSpeakingQueue = false;

/**
 * Plays full paragraphs or sentences sequentially without timing out on long text.
 * Persists and resolves language globally from state or localStorage.
 */
export function speakText(text, langId = null, onEndCallback = null) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    if (onEndCallback) onEndCallback();
    return false;
  }

  stopSpeech();

  const sentences = splitIntoSentences(text);
  if (sentences.length === 0) {
    if (onEndCallback) onEndCallback();
    return false;
  }

  // Resilient language resolution
  const resolvedLang =
    langId ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('ss_lang')) ||
    (typeof document !== 'undefined' && document.documentElement.lang) ||
    'hi';

  const { voice, langCode } = getBestVoiceForLang(resolvedLang);

  activeQueue = [...sentences];
  isSpeakingQueue = true;

  function speakNext() {
    if (!isSpeakingQueue || activeQueue.length === 0) {
      isSpeakingQueue = false;
      if (onEndCallback) onEndCallback();
      return;
    }

    const currentChunk = activeQueue.shift();
    const utterance = new SpeechSynthesisUtterance(currentChunk);
    utterance.lang = langCode;
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      speakNext();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error on chunk:', e);
      speakNext();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis invocation error:', err);
      speakNext();
    }
  }

  speakNext();
  return true;
}

export function stopSpeech() {
  isSpeakingQueue = false;
  activeQueue = [];
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Custom React Hook for programmatic TTS
 */
export function useTTS() {
  const { lang } = useLang();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text) => {
    setIsSpeaking(true);
    speakText(text, lang, () => {
      setIsSpeaking(false);
    });
  }, [lang]);

  const stop = useCallback(() => {
    stopSpeech();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speak, stop };
}

/**
 * Upgraded Interactive TTS Button Component
 * Supports reading full paragraph descriptions in regional voices with wave feedback
 */
export function TTSButton({
  textToRead,
  className = "",
  label = null,
  size = 14,
  fullParagraph = false
}) {
  const { lang, t } = useLang();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(textToRead, lang, () => {
        setIsSpeaking(false);
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={isSpeaking ? t('tts.stop_audio', 'Stop Audio') : t('tts.read_aloud', 'Read Aloud')}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer select-none ${
        isSpeaking
          ? 'bg-green-700 text-white shadow-md ring-2 ring-green-400/80 animate-pulse'
          : 'bg-gold/20 hover:bg-gold/40 text-green-deep border border-gold/40 hover:border-gold shadow-2xs'
      } ${className}`}
    >
      {isSpeaking ? (
        <VolumeX size={size} className="animate-spin text-amber-200" />
      ) : (
        <Volume2 size={size} className="text-green-deep" />
      )}
      {label !== false && (
        <span className="text-[11px] font-medium">
          {label || (isSpeaking ? t('tts.stop', 'Stop') : fullParagraph ? t('tts.read_aloud', 'Read Aloud') : t('tts.read', 'Listen'))}
        </span>
      )}
    </button>
  );
}
