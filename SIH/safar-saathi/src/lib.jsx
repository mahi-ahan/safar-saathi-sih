import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react'

/* =========================================================
   LANGUAGES
========================================================= */

export const LANGS = [
  { id: 'en', label: 'English', voice: 'en-IN' },
  { id: 'hi', label: 'हिन्दी', voice: 'hi-IN' },
  { id: 'bho', label: 'भोजपुरी', voice: 'hi-IN' },
  { id: 'mr', label: 'मराठी', voice: 'mr-IN' },
  { id: 'bn', label: 'বাংলা', voice: 'bn-IN' },
  { id: 'ur', label: 'اردو', voice: 'ur-IN' },
  { id: 'te', label: 'తెలుగు', voice: 'te-IN' },
  { id: 'ta', label: 'தமிழ்', voice: 'ta-IN' },
  { id: 'kn', label: 'ಕನ್ನಡ', voice: 'kn-IN' },
  { id: 'ml', label: 'മലയാളം', voice: 'ml-IN' },
  { id: 'or', label: 'ଓଡ଼ିଆ', voice: 'or-IN' }
]


/* =========================================================
   ENGLISH MASTER TRANSLATIONS
========================================================= */

const EN = {

  /* ---------- GLOBAL ---------- */

  gov:
    'Smart Digital Goods Transportation Platform',

  tagline:
    'Shared goods transportation',

  'nav.home':
    'Home',

  'nav.find':
    'Find a Vehicle',

  'nav.offer':
    'Offer a Trip',


  /* ---------- HOME ---------- */

  'hero.kicker':
    'Smart Goods Transportation',

  'hero.sub':
    'Find available vehicle space and move your goods easily without booking an entire vehicle.',

  'hero.sub2':
    'Send goods · Share space · Save money',

  'cta.find':
    'Find a Vehicle',

  'cta.offer':
    'Offer a Trip',

  'footer.note':
    'A smart platform that connects people who need to transport goods with vehicles that have available space.',

  'village.title':
    'Move Goods. Share Space.',

  'village.desc':
    'Connect with vehicles already travelling on your route and transport goods more efficiently.',

  'how.title':
    'How it works',

  'how.sub':
    'Simple, fast and convenient',

  'how.step1.title':
    '1. Offer or find a trip',

  'how.step1.desc':
    'Vehicle owners publish their route, travel date and available cargo space.',

  'how.step2.title':
    '2. Request space',

  'how.step2.desc':
    'People can search for suitable vehicles and request space for their goods.',

  'how.step3.title':
    '3. Confirm the goods',

  'how.step3.desc':
    'Enter the goods category, quantity and pickup details before sending your request.',

  'how.step4.title':
    '4. Complete delivery',

  'how.step4.desc':
    'The trip is completed after the goods reach their destination.',


  /* ---------- VEHICLES ---------- */

  'vehicle.pickup':
    'Pickup',

  'vehicle.miniTruck':
    'Mini truck',

  'vehicle.truck':
    'Truck',

  'vehicle.tractor':
    'Tractor-trolley',


  /* ---------- FIND VEHICLES ---------- */

  'find.title':
    'Find a Vehicle',

  'find.subtitle':
    'Search available vehicles travelling on your route.',

  'find.searchLocation':
    'Search pickup location, city or route',

  'find.searchPlaceholder':
    'Search location...',

  'find.allStates':
    'All states',

  'find.allVehicles':
    'All vehicles',

  'find.sortFree':
    'Most free space',

  'find.sortDate':
    'Earliest date',

  'find.verifiedOnly':
    'Verified owners only',

  'find.pickupPoint':
    'Pickup point',

  'find.verifiedOwner':
    'Verified owner',

  'find.verificationPending':
    'Verification pending',

  'find.loadTaken':
    'Space booked',

  'find.stillFree':
    'Still free',

  'find.pickupLocation':
    'Pickup location',

  'find.requestSpace':
    'Request Space',

  'find.requestSent':
    'Request sent to',

  'find.noVehicles':
    'No vehicles match your search or filters.',

  'find.mapHint':
    'Select a pickup location to view the vehicle on the map.',


  /* ---------- GOODS REQUEST ---------- */

  'request.title':
    'Request Vehicle Space',

  'request.subtitle':
    'Enter your goods details and send a request to the vehicle owner.',

  'request.goodsCategory':
    'Goods Category',

  'request.selectCategory':
    'Select goods category',

  'request.general':
    'General Goods',

  'request.electronics':
    'Electronics',

  'request.furniture':
    'Furniture',

  'request.food':
    'Food & Groceries',

  'request.clothing':
    'Clothing & Textiles',

  'request.construction':
    'Construction Materials',

  'request.machinery':
    'Machinery & Equipment',

  'request.other':
    'Other',

  'request.goodsDescription':
    'Goods Description',

  'request.descriptionPlaceholder':
    'Example: 3 boxes of household सामान',

  'request.weight':
    'Approximate Weight',

  'request.weightPlaceholder':
    'Example: 120',

  'request.pickup':
    'Pickup Location',

  'request.pickupPlaceholder':
    'Enter pickup location',

  'request.drop':
    'Delivery Location',

  'request.dropPlaceholder':
    'Enter delivery location',

  'request.contact':
    'Contact Number',

  'request.contactPlaceholder':
    'Enter mobile number',

  'request.tripDetails':
    'Trip Details',

  'request.send':
    'Send Request',

  'request.cancel':
    'Cancel',

  'request.sent':
    'Your request has been sent successfully.',

  'request.required':
    'Please fill all required details.',


  /* ---------- OFFER TRIP ---------- */

  'offer.title':
    'Offer a Trip',

  'offer.subtitle':
    'Share the available space in your vehicle with people who need to transport goods.',

  'offer.from':
    'From',

  'offer.to':
    'To',

  'offer.travelDate':
    'Date of Travel',

  'offer.vehicleType':
    'Vehicle Type',

  'offer.shareableCapacity':
    'Available Capacity',

  'offer.of':
    'of',

  'offer.total':
    'total',

  'offer.fareRule':
    'Pricing Rule',

  'offer.flatFare':
    'Fixed price per booking',

  'offer.thirdFare':
    'Share the journey cost',

  'offer.voluntary':
    'Free / voluntary',

  'offer.journeyCost':
    'Estimated journey cost ₹',

  'offer.pickupInstructions':
    'Pickup Instructions',

  'offer.ownerVerification':
    'Owner Verification',

  'offer.aadhaar':
    'Identity Proof',

  'offer.license':
    'Driving Licence',

  'offer.upload':
    'Upload (<2MB)',

  'offer.uploadDocuments':
    'Please upload identity proof and driving licence first',

  'offer.tripPublished':
    'Trip published successfully',

  'offer.publish':
    'Publish Trip',

  'offer.livePreview':
    'Live Preview',

  'offer.date':
    'Date',

  'offer.freeSpace':
    'Free space',

  'offer.goodsAccepted':
    'Goods accepted',

  'offer.allGoods':
    'General goods',

  'offer.ownerCollect':
    'Estimated earnings',

  'offer.bookingsJoining':
    'Bookings joining',

  'offer.perBooking':
    'per booking',

  'offer.freeUntil':
    'Free until more bookings are added',


  /* ---------- DRIVER / DELIVERY ---------- */

  'driver.deliveryStatus':
    'Delivery Status',

  'driver.markArrived':
    'Mark Arrived at Destination',

  'driver.destinationReached':
    'Destination reached',

  'driver.captureGoods':
    'Capture delivery proof',

  'driver.capture':
    'Capture photo (<2MB)',

  'driver.completeDelivery':
    'Complete Delivery',

  'driver.deliveryCompleted':
    'Delivery completed successfully',

  'driver.deliveryDoneSMS':
    'Delivery completed and confirmation sent',

  'driver.earnings':
    'Earnings'
}


/* =========================================================
   TRANSLATIONS
========================================================= */

const T = {

  en: EN,


  /* ================= HINDI ================= */

  hi: {
    ...EN,

    gov:
      'स्मार्ट डिजिटल सामान परिवहन प्लेटफ़ॉर्म',

    tagline:
      'साझा सामान परिवहन',

    'nav.home':
      'होम',

    'nav.find':
      'वाहन खोजें',

    'nav.offer':
      'यात्रा दें',

    'hero.kicker':
      'स्मार्ट सामान परिवहन',

    'hero.sub':
      'पूरे वाहन को बुक किए बिना उपलब्ध जगह खोजें और अपना सामान आसानी से भेजें।',

    'hero.sub2':
      'सामान भेजें · जगह साझा करें · पैसे बचाएँ',

    'cta.find':
      'वाहन खोजें',

    'cta.offer':
      'यात्रा दें',

    'footer.note':
      'एक स्मार्ट प्लेटफ़ॉर्म जो सामान भेजने वाले लोगों को खाली जगह वाले वाहनों से जोड़ता है।',

    'village.title':
      'सामान भेजें। जगह साझा करें।',

    'village.desc':
      'आपके मार्ग पर पहले से यात्रा कर रहे वाहनों से जुड़ें और अपना सामान आसानी से भेजें।',

    'how.title':
      'यह कैसे काम करता है',

    'how.sub':
      'सरल, तेज और सुविधाजनक',

    'how.step1.title':
      '1. यात्रा दें या खोजें',

    'how.step1.desc':
      'वाहन मालिक अपना मार्ग, यात्रा की तारीख और उपलब्ध जगह साझा करता है।',

    'how.step2.title':
      '2. जगह का अनुरोध करें',

    'how.step2.desc':
      'उपयोगकर्ता अपने सामान के लिए सही वाहन खोजकर जगह का अनुरोध कर सकते हैं।',

    'how.step3.title':
      '3. सामान की जानकारी दें',

    'how.step3.desc':
      'सामान की श्रेणी, वजन और पिकअप की जानकारी भरें।',

    'how.step4.title':
      '4. डिलीवरी पूरी करें',

    'how.step4.desc':
      'सामान गंतव्य तक पहुँचने के बाद यात्रा पूरी होती है।',

    'find.title':
      'वाहन खोजें',

    'find.subtitle':
      'अपने मार्ग पर जाने वाले उपलब्ध वाहन खोजें।',

    'find.searchLocation':
      'पिकअप स्थान, शहर या मार्ग खोजें',

    'find.searchPlaceholder':
      'स्थान खोजें...',

    'find.allStates':
      'सभी राज्य',

    'find.allVehicles':
      'सभी वाहन',

    'find.sortFree':
      'सबसे अधिक खाली जगह',

    'find.sortDate':
      'सबसे पहले की तारीख',

    'find.verifiedOnly':
      'केवल सत्यापित मालिक',

    'find.pickupPoint':
      'पिकअप स्थान',

    'find.verifiedOwner':
      'सत्यापित मालिक',

    'find.verificationPending':
      'सत्यापन लंबित',

    'find.loadTaken':
      'बुक की गई जगह',

    'find.stillFree':
      'अभी खाली',

    'find.pickupLocation':
      'पिकअप स्थान',

    'find.requestSpace':
      'जगह का अनुरोध करें',

    'find.noVehicles':
      'आपकी खोज या फ़िल्टर के अनुसार कोई वाहन नहीं मिला।',

    'request.title':
      'वाहन में जगह का अनुरोध करें',

    'request.subtitle':
      'अपने सामान की जानकारी भरें और वाहन मालिक को अनुरोध भेजें।',

    'request.goodsCategory':
      'सामान की श्रेणी',

    'request.selectCategory':
      'सामान की श्रेणी चुनें',

    'request.general':
      'सामान्य सामान',

    'request.electronics':
      'इलेक्ट्रॉनिक्स',

    'request.furniture':
      'फर्नीचर',

    'request.food':
      'खाद्य और किराना',

    'request.clothing':
      'कपड़े और टेक्सटाइल',

    'request.construction':
      'निर्माण सामग्री',

    'request.machinery':
      'मशीनरी और उपकरण',

    'request.other':
      'अन्य',

    'request.goodsDescription':
      'सामान का विवरण',

    'request.weight':
      'अनुमानित वजन',

    'request.pickup':
      'पिकअप स्थान',

    'request.drop':
      'डिलीवरी स्थान',

    'request.contact':
      'मोबाइल नंबर',

    'request.tripDetails':
      'यात्रा की जानकारी',

    'request.send':
      'अनुरोध भेजें',

    'request.cancel':
      'रद्द करें',

    'request.sent':
      'आपका अनुरोध सफलतापूर्वक भेज दिया गया है।',

    'request.required':
      'कृपया सभी आवश्यक जानकारी भरें।',

    'offer.title':
      'यात्रा दें',

    'offer.subtitle':
      'अपने वाहन की खाली जगह उन लोगों के साथ साझा करें जिन्हें सामान भेजना है।',

    'offer.from':
      'कहाँ से',

    'offer.to':
      'कहाँ तक',

    'offer.travelDate':
      'यात्रा की तारीख',

    'offer.vehicleType':
      'वाहन का प्रकार',

    'offer.shareableCapacity':
      'उपलब्ध क्षमता',

    'offer.fareRule':
      'कीमत नियम',

    'offer.flatFare':
      'प्रति बुकिंग निश्चित कीमत',

    'offer.thirdFare':
      'यात्रा की लागत साझा करें',

    'offer.voluntary':
      'निःशुल्क / स्वैच्छिक',

    'offer.journeyCost':
      'अनुमानित यात्रा लागत ₹',

    'offer.pickupInstructions':
      'पिकअप निर्देश',

    'offer.ownerVerification':
      'मालिक सत्यापन',

    'offer.aadhaar':
      'पहचान प्रमाण',

    'offer.license':
      'ड्राइविंग लाइसेंस',

    'offer.uploadDocuments':
      'कृपया पहले पहचान प्रमाण और ड्राइविंग लाइसेंस अपलोड करें',

    'offer.tripPublished':
      'यात्रा सफलतापूर्वक प्रकाशित हो गई',

    'offer.publish':
      'यात्रा प्रकाशित करें',

    'offer.livePreview':
      'लाइव पूर्वावलोकन',

    'offer.freeSpace':
      'खाली जगह',

    'offer.goodsAccepted':
      'स्वीकार्य सामान',

    'offer.allGoods':
      'सामान्य सामान',

    'offer.ownerCollect':
      'अनुमानित कमाई',

    'offer.bookingsJoining':
      'बुकिंग',

    'offer.perBooking':
      'प्रति बुकिंग'
  },


  /* ================= BHOJPURI ================= */

  bho: {
    ...EN,

    'nav.home':
      'होम',

    'nav.find':
      'वाहन खोजीं',

    'nav.offer':
      'यात्रा दीं',

    'cta.find':
      'वाहन खोजीं',

    'cta.offer':
      'यात्रा दीं',

    'hero.sub':
      'पूरा गाड़ी बुक कइले बिना खाली जगह खोजीं आ आपन सामान आसानी से भेजीं।',

    'find.title':
      'वाहन खोजीं',

    'find.requestSpace':
      'जगह माँगीं',

    'request.title':
      'गाड़ी में जगह माँगीं',

    'request.goodsCategory':
      'सामान के श्रेणी',

    'request.send':
      'अनुरोध भेजीं',

    'offer.title':
      'यात्रा दीं',

    'offer.publish':
      'यात्रा प्रकाशित करीं'
  },


  /* ================= MARATHI ================= */

  mr: {
    ...EN,

    'nav.home':
      'मुख्यपृष्ठ',

    'nav.find':
      'वाहन शोधा',

    'nav.offer':
      'प्रवास द्या',

    'cta.find':
      'वाहन शोधा',

    'cta.offer':
      'प्रवास द्या',

    'find.title':
      'वाहन शोधा',

    'find.requestSpace':
      'जागेची विनंती करा',

    'request.title':
      'वाहनामध्ये जागेची विनंती करा',

    'request.goodsCategory':
      'मालाचा प्रकार',

    'request.send':
      'विनंती पाठवा',

    'offer.title':
      'प्रवास द्या',

    'offer.publish':
      'प्रवास प्रकाशित करा'
  },


  /* ================= BENGALI ================= */

  bn: {
    ...EN,

    'nav.home':
      'হোম',

    'nav.find':
      'গাড়ি খুঁজুন',

    'nav.offer':
      'যাত্রা অফার করুন',

    'cta.find':
      'গাড়ি খুঁজুন',

    'cta.offer':
      'যাত্রা অফার করুন',

    'find.title':
      'গাড়ি খুঁজুন',

    'find.requestSpace':
      'জায়গা অনুরোধ করুন',

    'request.title':
      'গাড়িতে জায়গার অনুরোধ করুন',

    'request.goodsCategory':
      'পণ্যের বিভাগ',

    'request.send':
      'অনুরোধ পাঠান',

    'offer.title':
      'যাত্রা অফার করুন',

    'offer.publish':
      'যাত্রা প্রকাশ করুন'
  },


  /* ================= URDU ================= */

  ur: {
    ...EN,

    'nav.home':
      'ہوم',

    'nav.find':
      'گاڑی تلاش کریں',

    'nav.offer':
      'سفر پیش کریں',

    'cta.find':
      'گاڑی تلاش کریں',

    'cta.offer':
      'سفر پیش کریں',

    'find.title':
      'گاڑی تلاش کریں',

    'find.requestSpace':
      'جگہ کی درخواست',

    'request.title':
      'گاڑی میں جگہ کی درخواست',

    'request.goodsCategory':
      'سامان کی قسم',

    'request.send':
      'درخواست بھیجیں',

    'offer.title':
      'سفر پیش کریں',

    'offer.publish':
      'سفر شائع کریں'
  },


  /* ================= TELUGU ================= */

  te: {
    ...EN,

    'nav.home':
      'హోమ్',

    'nav.find':
      'వాహనం వెతకండి',

    'nav.offer':
      'ప్రయాణాన్ని అందించండి',

    'cta.find':
      'వాహనం వెతకండి',

    'cta.offer':
      'ప్రయాణాన్ని అందించండి',

    'find.title':
      'వాహనం వెతకండి',

    'request.title':
      'వాహనంలో స్థలం కోరండి',

    'request.goodsCategory':
      'వస్తువుల వర్గం',

    'request.send':
      'అభ్యర్థన పంపండి',

    'offer.title':
      'ప్రయాణాన్ని అందించండి',

    'offer.publish':
      'ప్రయాణాన్ని ప్రచురించండి'
  },


  /* ================= TAMIL ================= */

  ta: {
    ...EN,

    'nav.home':
      'முகப்பு',

    'nav.find':
      'வாகனம் தேடுங்கள்',

    'nav.offer':
      'பயணத்தை வழங்குங்கள்',

    'cta.find':
      'வாகனம் தேடுங்கள்',

    'cta.offer':
      'பயணத்தை வழங்குங்கள்',

    'find.title':
      'வாகனம் தேடுங்கள்',

    'request.title':
      'வாகன இடம் கோரிக்கை',

    'request.goodsCategory':
      'பொருட்களின் வகை',

    'request.send':
      'கோரிக்கையை அனுப்புங்கள்',

    'offer.title':
      'பயணத்தை வழங்குங்கள்',

    'offer.publish':
      'பயணத்தை வெளியிடுங்கள்'
  },


  /* ================= KANNADA ================= */

  kn: {
    ...EN,

    'nav.home':
      'ಮುಖಪುಟ',

    'nav.find':
      'ವಾಹನ ಹುಡುಕಿ',

    'nav.offer':
      'ಪ್ರಯಾಣ ನೀಡಿ',

    'cta.find':
      'ವಾಹನ ಹುಡುಕಿ',

    'cta.offer':
      'ಪ್ರಯಾಣ ನೀಡಿ',

    'find.title':
      'ವಾಹನ ಹುಡುಕಿ',

    'request.title':
      'ವಾಹನದಲ್ಲಿ ಸ್ಥಳವನ್ನು ವಿನಂತಿಸಿ',

    'request.goodsCategory':
      'ಸರಕು ವರ್ಗ',

    'request.send':
      'ವಿನಂತಿ ಕಳುಹಿಸಿ',

    'offer.title':
      'ಪ್ರಯಾಣ ನೀಡಿ',

    'offer.publish':
      'ಪ್ರಯಾಣ ಪ್ರಕಟಿಸಿ'
  },


  /* ================= MALAYALAM ================= */

  ml: {
    ...EN,

    'nav.home':
      'ഹോം',

    'nav.find':
      'വാഹനം കണ്ടെത്തുക',

    'nav.offer':
      'യാത്ര നൽകുക',

    'cta.find':
      'വാഹനം കണ്ടെത്തുക',

    'cta.offer':
      'യാത്ര നൽകുക',

    'find.title':
      'വാഹനം കണ്ടെത്തുക',

    'request.title':
      'വാഹനത്തിൽ സ്ഥലം അഭ്യർത്ഥിക്കുക',

    'request.goodsCategory':
      'സാധനങ്ങളുടെ വിഭാഗം',

    'request.send':
      'അഭ്യർത്ഥന അയയ്ക്കുക',

    'offer.title':
      'യാത്ര നൽകുക',

    'offer.publish':
      'യാത്ര പ്രസിദ്ധീകരിക്കുക'
  },


  /* ================= ODIA ================= */

  or: {
    ...EN,

    'nav.home':
      'ହୋମ୍',

    'nav.find':
      'ବାହନ ଖୋଜନ୍ତୁ',

    'nav.offer':
      'ଯାତ୍ରା ଦିଅନ୍ତୁ',

    'cta.find':
      'ବାହନ ଖୋଜନ୍ତୁ',

    'cta.offer':
      'ଯାତ୍ରା ଦିଅନ୍ତୁ',

    'find.title':
      'ବାହନ ଖୋଜନ୍ତୁ',

    'request.title':
      'ବାହନରେ ସ୍ଥାନ ଅନୁରୋଧ କରନ୍ତୁ',

    'request.goodsCategory':
      'ସାମଗ୍ରୀର ପ୍ରକାର',

    'request.send':
      'ଅନୁରୋଧ ପଠାନ୍ତୁ',

    'offer.title':
      'ଯାତ୍ରା ଦିଅନ୍ତୁ',

    'offer.publish':
      'ଯାତ୍ରା ପ୍ରକାଶ କରନ୍ତୁ'
  }
}


/* =========================================================
   MAARG-MITRA VOICE ASSISTANT TEXT
========================================================= */

const MITRA = {

  en: {
    hello:
      'Hello! I am Maarg-Mitra. I can help you find a vehicle or offer a trip.',

    find:
      'Opening the Find a Vehicle page.',

    offer:
      'Opening the Offer a Trip page.',

    help:
      'You can say find a vehicle, request space, or offer a trip.',

    fallback:
      'I can help you find a vehicle or offer a trip.'
  },


  hi: {
    hello:
      'नमस्ते! मैं मार्ग-मित्र हूँ। मैं आपको वाहन खोजने या यात्रा देने में मदद कर सकता हूँ।',

    find:
      'वाहन खोजने वाला पेज खोला जा रहा है।',

    offer:
      'यात्रा देने वाला पेज खोला जा रहा है।',

    help:
      'आप वाहन खोजें, जगह का अनुरोध करें या यात्रा दें कह सकते हैं।',

    fallback:
      'मैं आपको वाहन खोजने या यात्रा देने में मदद कर सकता हूँ।'
  },


  bho: {
    hello:
      'नमस्ते! हम मार्ग-मित्र बानी। वाहन खोजे आ यात्रा देवे में मदद कर सकत बानी।',

    find:
      'वाहन खोजे वाला पेज खुलत बा।',

    offer:
      'यात्रा देवे वाला पेज खुलत बा।',

    help:
      'रउआ वाहन खोजीं, जगह माँगीं या यात्रा दीं कह सकत बानी।',

    fallback:
      'हम वाहन खोजे आ यात्रा देवे में मदद कर सकत बानी।'
  },


  mr: {
    hello:
      'नमस्कार! मी मार्ग-मित्र आहे. वाहन शोधण्यात किंवा प्रवास देण्यात मदत करू शकतो.',

    find:
      'वाहन शोधण्याचे पृष्ठ उघडत आहे.',

    offer:
      'प्रवास देण्याचे पृष्ठ उघडत आहे.',

    help:
      'तुम्ही वाहन शोधा किंवा प्रवास द्या असे म्हणू शकता.',

    fallback:
      'मी वाहन शोधण्यात मदत करू शकतो.'
  },


  bn: {
    hello:
      'নমস্কার! আমি মার্গ-মিত্র। আমি আপনাকে গাড়ি খুঁজতে বা যাত্রা অফার করতে সাহায্য করতে পারি।',

    find:
      'গাড়ি খোঁজার পেজ খোলা হচ্ছে।',

    offer:
      'যাত্রা অফার করার পেজ খোলা হচ্ছে।',

    help:
      'আপনি গাড়ি খুঁজুন বা যাত্রা অফার করুন বলতে পারেন।',

    fallback:
      'আমি আপনাকে গাড়ি খুঁজতে সাহায্য করতে পারি।'
  },


  ur: {
    hello:
      'السلام علیکم! میں مارگ متر ہوں۔ میں گاڑی تلاش کرنے یا سفر پیش کرنے میں مدد کر سکتا ہوں۔',

    find:
      'گاڑی تلاش کرنے والا صفحہ کھولا جا رہا ہے۔',

    offer:
      'سفر پیش کرنے والا صفحہ کھولا جا رہا ہے۔',

    help:
      'آپ گاڑی تلاش کریں یا سفر پیش کریں کہہ سکتے ہیں۔',

    fallback:
      'میں گاڑی تلاش کرنے میں مدد کر سکتا ہوں۔'
  },


  te: {
    hello:
      'నమస్కారం! నేను మార్గ్-మిత్ర. వాహనం వెతకడం లేదా ప్రయాణం అందించడంలో సహాయం చేస్తాను.',

    find:
      'వాహనం వెతికే పేజీ తెరవబడుతోంది.',

    offer:
      'ప్రయాణాన్ని అందించే పేజీ తెరవబడుతోంది.',

    help:
      'మీరు వాహనం వెతకండి లేదా ప్రయాణాన్ని అందించండి అని చెప్పవచ్చు.',

    fallback:
      'వాహనం వెతకడంలో నేను సహాయం చేస్తాను.'
  },


  ta: {
    hello:
      'வணக்கம்! நான் மார்க்-மித்ரா. வாகனம் தேட அல்லது பயணம் வழங்க உதவுகிறேன்.',

    find:
      'வாகனம் தேடும் பக்கம் திறக்கப்படுகிறது.',

    offer:
      'பயணம் வழங்கும் பக்கம் திறக்கப்படுகிறது.',

    help:
      'நீங்கள் வாகனம் தேடுங்கள் அல்லது பயணம் வழங்குங்கள் என்று கூறலாம்.',

    fallback:
      'வாகனம் தேட நான் உதவுகிறேன்.'
  },


  kn: {
    hello:
      'ನಮಸ್ಕಾರ! ನಾನು ಮಾರ್ಗ್-ಮಿತ್ರ. ವಾಹನ ಹುಡುಕಲು ಅಥವಾ ಪ್ರಯಾಣ ನೀಡಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.',

    find:
      'ವಾಹನ ಹುಡುಕುವ ಪುಟ ತೆರೆಯುತ್ತಿದೆ.',

    offer:
      'ಪ್ರಯಾಣ ನೀಡುವ ಪುಟ ತೆರೆಯುತ್ತಿದೆ.',

    help:
      'ನೀವು ವಾಹನ ಹುಡುಕಿ ಅಥವಾ ಪ್ರಯಾಣ ನೀಡಿ ಎಂದು ಹೇಳಬಹುದು.',

    fallback:
      'ವಾಹನ ಹುಡುಕಲು ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.'
  },


  ml: {
    hello:
      'നമസ്കാരം! ഞാൻ മാർഗ്-മിത്ര. വാഹനം കണ്ടെത്താനോ യാത്ര നൽകാനോ സഹായിക്കും.',

    find:
      'വാഹനം കണ്ടെത്തുന്ന പേജ് തുറക്കുന്നു.',

    offer:
      'യാത്ര നൽകുന്ന പേജ് തുറക്കുന്നു.',

    help:
      'നിങ്ങൾ വാഹനം കണ്ടെത്തുക അല്ലെങ്കിൽ യാത്ര നൽകുക എന്ന് പറയാം.',

    fallback:
      'വാഹനം കണ്ടെത്താൻ ഞാൻ സഹായിക്കും.'
  },


  or: {
    hello:
      'ନମସ୍କାର! ମୁଁ ମାର୍ଗ-ମିତ୍ର। ବାହନ ଖୋଜିବା କିମ୍ବା ଯାତ୍ରା ଦେବାରେ ସାହାଯ୍ୟ କରିପାରିବି।',

    find:
      'ବାହନ ଖୋଜିବା ପୃଷ୍ଠା ଖୋଲୁଛି।',

    offer:
      'ଯାତ୍ରା ଦେବା ପୃଷ୍ଠା ଖୋଲୁଛି।',

    help:
      'ଆପଣ ବାହନ ଖୋଜନ୍ତୁ କିମ୍ବା ଯାତ୍ରା ଦିଅନ୍ତୁ କହିପାରିବେ।',

    fallback:
      'ମୁଁ ବାହନ ଖୋଜିବାରେ ସାହାଯ୍ୟ କରିପାରିବି।'
  }
}


/* =========================================================
   LANGUAGE CONTEXT
========================================================= */

const LangCtx = createContext(null)

export function LangProvider({ children }) {

  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('ss_lang') || 'en'
    } catch (e) {
      return 'en'
    }
  })


  useEffect(() => {

    document.documentElement.lang = lang

    try {
      localStorage.setItem(
        'ss_lang',
        lang
      )
    } catch (e) {}

  }, [lang])


  const t = key => {

    if (
      T[lang] &&
      Object.prototype.hasOwnProperty.call(
        T[lang],
        key
      )
    ) {
      return T[lang][key]
    }

    if (
      Object.prototype.hasOwnProperty.call(
        T.en,
        key
      )
    ) {
      return T.en[key]
    }

    return key
  }


  const m = key => {

    if (
      MITRA[lang] &&
      Object.prototype.hasOwnProperty.call(
        MITRA[lang],
        key
      )
    ) {
      return MITRA[lang][key]
    }

    return (
      MITRA.en[key] ||
      key
    )
  }


  return (

    <LangCtx.Provider
      value={{
        lang,
        setLang,
        t,
        m
      }}
    >

      {children}

    </LangCtx.Provider>

  )
}


export const useLang = () =>
  useContext(LangCtx)


/* =========================================================
   GLOBAL APP CONTEXT
========================================================= */

const AppCtx = createContext(null)


export function AppProvider({ children }) {

  const [user, setUserState] = useState(() => {

    try {

      const saved =
        localStorage.getItem('ss_user')

      return saved
        ? JSON.parse(saved)
        : null

    } catch (e) {

      return null

    }

  })


  const setUser = userData => {

    setUserState(userData)

    try {

      if (userData) {

        localStorage.setItem(
          'ss_user',
          JSON.stringify(userData)
        )

      } else {

        localStorage.removeItem(
          'ss_user'
        )

      }

    } catch (e) {}

  }


  return (

    <AppCtx.Provider
      value={{
        user,
        setUser
      }}
    >

      {children}

    </AppCtx.Provider>

  )
}


export const useApp = () =>
  useContext(AppCtx)


/* =========================================================
   INR FORMATTER
========================================================= */

export const inr = n =>
  '₹' +
  Number(n || 0).toLocaleString(
    'en-IN'
  )