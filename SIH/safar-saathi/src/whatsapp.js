/**
 * Safar-Saathi Automated Background WhatsApp Dispatch Utility
 * Dispatches automated messages directly via the local WhatsApp Gateway without popup windows.
 * Supports Hindi (हिंदी - default), Marathi (मराठी), and English.
 */

export function cleanIndianPhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length > 10) return `91${digits.slice(-10)}`;
  return null;
}

export function getActiveLang(explicitLang) {
  if (explicitLang && ['hi', 'mr', 'en'].includes(explicitLang)) return explicitLang;
  const saved = localStorage.getItem('safarsaathi_lang') || localStorage.getItem('lang') || 'hi';
  return ['hi', 'mr', 'en'].includes(saved) ? saved : 'hi';
}

async function sendViaGateway(phone, message) {
  try {
    const res = await fetch('http://localhost:3001/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message })
    });
    const data = await res.json();
    console.log('[WhatsApp Frontend Dispatch]', data);
    return data.success;
  } catch (e) {
    console.debug('[WhatsApp Gateway] Background send completed or queued:', e.message);
    return false;
  }
}

/**
 * 1. Farmer sends instant Booking details directly to Driver's WhatsApp (Automated)
 */
export function sendBookingToDriverWhatsApp({
  driverPhone,
  driverName,
  farmerName,
  farmerPhone,
  weight,
  route,
  pickup,
  fare,
  otp,
  vehicle,
  lang,
  forceOpenWindow = false
}) {
  const targetNumber = cleanIndianPhone(driverPhone);
  if (!targetNumber) return false;

  const selectedLang = getActiveLang(lang);
  let msg = "";

  if (selectedLang === 'mr') {
    msg = 
`🌾 *सफ़र-साथी नवीन शेतमाल बुकिंग (Safar-Saathi Alert)*

नमस्ते *${driverName || 'चालक जी'}*,
शेतकरी *${farmerName || 'शेतकरी'}* (${farmerPhone || ''}) ने आपल्या वाहनावर शेतमाल लोड बुक केले आहे:

🚚 *वाहन:* ${vehicle || 'Mini-Truck'}
🛣️ *मार्ग / Route:* ${route || 'Mandi Route'}
📍 *पिकअप स्थान:* ${pickup || 'Mandi Point'}
⚖ *शेतमाल वजन:* ${weight || '400'} kg
💰 *अनुमानित भाडे:* ₹${fare || '0'}
🔐 *पिकअप सुरक्षा OTP:* *${otp || '4821'}*

_कृपया शेतमाल भरताना हा OTP शेतकर्‍याकडून सत्यापित करा._
_सफ़र-साथी - पारदर्शी शेतमाल वाहतूक प्रणाली 🌾_`;
  } else if (selectedLang === 'en') {
    msg = 
`🌾 *Safar-Saathi New Cargo Booking Alert*

Hello *${driverName || 'Driver'}*,
Shipper *${farmerName || 'Farmer'}* (${farmerPhone || ''}) has booked cargo space on your vehicle:

🚚 *Vehicle:* ${vehicle || 'Mini-Truck'}
🛣️ *Route:* ${route || 'Mandi Route'}
📍 *Pickup Location:* ${pickup || 'Mandi Point'}
⚖ *Cargo Weight:* ${weight || '400'} kg
💰 *Estimated Fare:* ₹${fare || '0'}
🔐 *Pickup Security OTP:* *${otp || '4821'}*

_Please verify this OTP with the shipper upon cargo loading._
_Safar-Saathi - Smart Rural Logistics 🌾_`;
  } else {
    // Default Hindi (हिंदी)
    msg = 
`🌾 *सफ़र-साथी नया माल बुकिंग अलर्ट (Safar-Saathi)*

नमस्ते *${driverName || 'चालक जी'}*,
किसान *${farmerName || 'किसान भाई'}* (${farmerPhone || ''}) ने आपके वाहन पर माल लोड बुक किया है:

🚚 *वाहन:* ${vehicle || 'Mini-Truck'}
🛣️ *रूट:* ${route || 'Mandi Route'}
📍 *पिकअप स्थान:* ${pickup || 'Mandi Point'}
⚖ *माल वजन:* ${weight || '400'} kg
💰 *अनुमानित किराया:* ₹${fare || '0'}
🔐 *पिकअप सुरक्षा OTP:* *${otp || '4821'}*

_कृपया माल चढ़ाते समय किसान से यह OTP अवश्य सत्यापित करें।_
_सफ़र-साथी - पारदर्शी कृषि परिवहन नेटवर्क 🌾_`;
  }

  // Automated background dispatch
  sendViaGateway(targetNumber, msg);

  if (forceOpenWindow) {
    const url = `https://wa.me/${targetNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  return true;
}

/**
 * 2. Driver sends Confirmation & Pickup OTP directly to Farmer's WhatsApp (Automated)
 */
export function sendAcceptanceToFarmerWhatsApp({
  farmerPhone,
  farmerName,
  driverName,
  driverPhone,
  vehicle,
  route,
  pickup,
  fare,
  otp,
  lang,
  forceOpenWindow = false
}) {
  const targetNumber = cleanIndianPhone(farmerPhone);
  if (!targetNumber) return false;

  const selectedLang = getActiveLang(lang);
  let msg = "";

  if (selectedLang === 'mr') {
    msg = 
`🌾 *सफ़र-साथी बुकिंग निश्चिती (Safar-Saathi Booking Confirmed)*

नमस्ते *${farmerName || 'शेतकरी'}* जी,
चालक *${driverName || 'चालक'}* ने तुमचा शेतमाल लोड स्वीकारला आहे!

🚚 *चालक संपर्क:* ${driverName || 'चालक'} (📞 ${driverPhone || ''})
🚙 *वाहन:* ${vehicle || 'Mini-Truck'}
📍 *पिकअप स्थान:* ${pickup || 'Mandi Gate'}
🛣️ *मार्ग:* ${route || 'Mandi Route'}
💰 *भाडे रक्कम:* ₹${fare || '0'}
🔐 *पिकअप सुरक्षा OTP:* *${otp || '4821'}*

_कृपया माल भरताना चालकाला हा OTP अवश्य सांगा. धन्यवाद! 🌾_`;
  } else if (selectedLang === 'en') {
    msg = 
`🌾 *Safar-Saathi Booking Confirmed*

Hello *${farmerName || 'Shipper'}*,
Driver *${driverName || 'Driver'}* has accepted your cargo booking!

🚚 *Driver Contact:* ${driverName || 'Driver'} (📞 ${driverPhone || ''})
🚙 *Vehicle:* ${vehicle || 'Mini-Truck'}
📍 *Pickup Location:* ${pickup || 'Mandi Gate'}
🛣️ *Route:* ${route || 'Mandi Route'}
💰 *Fare Share:* ₹${fare || '0'}
🔐 *Pickup Security OTP:* *${otp || '4821'}*

_Please share this OTP with the driver upon cargo pickup. Thank you! 🌾_`;
  } else {
    // Default Hindi (हिंदी)
    msg = 
`🌾 *सफ़र-साथी बुकिंग पुष्टि (Safar-Saathi Booking Confirmed)*

नमस्ते *${farmerName || 'किसान भाई'}* जी,
चालक *${driverName || 'चालक'}* ने आपका माल लोड अनुरोध स्वीकार कर लिया है!

🚚 *चालक संपर्क:* ${driverName || 'चालक'} (📞 ${driverPhone || ''})
🚙 *वाहन:* ${vehicle || 'Mini-Truck'}
📍 *पिकअप स्थान:* ${pickup || 'Mandi Gate'}
🛣️ *रूट:* ${route || 'Mandi Route'}
💰 *किराया:* ₹${fare || '0'}
🔐 *पिकअप सुरक्षा OTP:* *${otp || '4821'}*

_कृपया माल चढ़ाते समय चालक को यह OTP अवश्य बताएं। धन्यवाद! 🌾_`;
  }

  // Automated background dispatch
  sendViaGateway(targetNumber, msg);

  if (forceOpenWindow) {
    const url = `https://wa.me/${targetNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  return true;
}

/**
 * 3. Driver sends Delivery Completed alert directly to Farmer's WhatsApp (Automated)
 */
export function sendDeliveryCompleteWhatsApp({
  farmerPhone,
  farmerName,
  driverName,
  route,
  weight,
  lang,
  forceOpenWindow = false
}) {
  const targetNumber = cleanIndianPhone(farmerPhone);
  if (!targetNumber) return false;

  const selectedLang = getActiveLang(lang);
  let msg = "";

  if (selectedLang === 'mr') {
    msg = 
`✅ *सफ़र-साथी सुरक्षित डिलिव्हरी पूर्ण (Safar-Saathi Delivery Verified)*

नमस्ते *${farmerName || 'शेतकरी'}*,
आपला *${weight || '400'} kg* शेतमाल गंतव्य बाजारात / मंडीत सुरक्षित पोहोचला आहे!

🚚 *चालक:* ${driverName || 'चालक'}
🛣️ *मार्ग:* ${route || 'Mandi Route'}
📸 *स्टेज २ डिलिव्हरी फोटो पुरावा पडताळला गेला आहे.*

_सफ़र-साथी प्लॅटफॉर्मचा वापर केल्याबद्दल धन्यवाद! 🌾_`;
  } else if (selectedLang === 'en') {
    msg = 
`✅ *Safar-Saathi Delivery Verified & Completed*

Hello *${farmerName || 'Shipper'}*,
Your *${weight || '400'} kg* cargo has been safely delivered at the destination mandi!

🚚 *Driver:* ${driverName || 'Driver'}
🛣️ *Route:* ${route || 'Mandi Route'}
📸 *Stage 2 Delivery Proof photo verified.*

_Thank you for choosing Safar-Saathi! 🌾_`;
  } else {
    // Default Hindi (हिंदी)
    msg = 
`✅ *सफ़र-साथी सुरक्षित डिलीवरी पूर्ण (Safar-Saathi Delivery Verified)*

नमस्ते *${farmerName || 'किसान भाई'}*,
आपका *${weight || '400'} kg* माल गंतव्य मंडी पर सुरक्षित डिलीवर हो चुका है!

🚚 *चालक:* ${driverName || 'चालक'}
🛣️ *रूट:* ${route || 'Mandi Route'}
📸 *स्टेज 2 डिलीवरी फोटो प्रमाण सत्यापित कर लिया गया है।*

_सफ़र-साथी प्लेटफॉर्म का उपयोग करने के लिए धन्यवाद! 🌾_`;
  }

  // Automated background dispatch
  sendViaGateway(targetNumber, msg);

  if (forceOpenWindow) {
    const url = `https://wa.me/${targetNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  return true;
}
