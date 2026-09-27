"""
Safar-Saathi Centralized Multilingual WhatsApp & SMS Notification Templates
Comprehensive support for 13 Indian languages:
Hindi (hi), English (en), Bhojpuri (bho), Marathi (mr), Bengali (bn),
Urdu (ur), Telugu (te), Tamil (ta), Kannada (kn), Malayalam (ml),
Odia (or), Punjabi (pa), Gujarati (gu).
"""


SUPPORTED_LANGUAGES = {
    "hi": "Hindi",
    "en": "English",
    "bho": "Bhojpuri",
    "mr": "Marathi",
    "bn": "Bengali",
    "ur": "Urdu",
    "te": "Telugu",
    "ta": "Tamil",
    "kn": "Kannada",
    "ml": "Malayalam",
    "or": "Odia",
    "pa": "Punjabi",
    "gu": "Gujarati"
}

def normalize_lang(lang: str | None) -> str:
    if not lang:
        return "hi"
    clean = str(lang).strip().lower()
    if clean in SUPPORTED_LANGUAGES:
        return clean
    for k, name in SUPPORTED_LANGUAGES.items():
        if clean == name.lower():
            return k
    return "hi"


# =========================================================================
# 1. TRIP PUBLISHED (To Driver)
# =========================================================================
def msg_trip_published(driver_name: str, from_loc: str, to_loc: str, date: str, vehicle: str, total_kg: int, price: float, pickup: str, lang: str = "hi") -> str:
    l = normalize_lang(lang)
    p_loc = str(pickup).strip() if (pickup and str(pickup).strip()) else "Driver route / Designated hub"

    if l == "en":
        return (
            f"🌾 *Safar-Saathi: Trip Successfully Published*\n\n"
            f"Hello *{driver_name}*,\n"
            f"Your new trip offer is now live on the Safar-Saathi network!\n\n"
            f"🛣️ *Route:* {from_loc} → {to_loc}\n"
            f"📅 *Date:* {date}\n"
            f"🚛 *Vehicle:* {vehicle}\n"
            f"⚖ *Cargo Capacity:* {total_kg} kg\n"
            f"💰 *Load Fare:* ₹{price:,.0f}\n"
            f"📝 *Pickup Instructions / Landmark:* {p_loc}\n\n"
            f"_You will receive instant alerts when shippers book space on your route. Safe driving! 🌾_"
        )
    elif l == "bho":
        return (
            f"🌾 *सफ़र-साथी: यात्रा प्रकाशित हो गइल*\n\n"
            f"प्रणाम *{driver_name}* जी,\n"
            f"रउआ के नया यात्रा सफ़र-साथी पर सफ़लतापूर्वक प्रकाशित हो गइल बा!\n\n"
            f"🛣️ *रूट:* {from_loc} → {to_loc}\n"
            f"📅 *तारीख:* {date}\n"
            f"🚛 *गाड़ी:* {vehicle}\n"
            f"⚖ *क्षमता:* {total_kg} kg\n"
            f"💰 *भाड़ा:* ₹{price:,.0f}\n"
            f"📝 *पिकअप निर्देश / जगह (Instructions):* {p_loc}\n\n"
            f"_जइसे कवनो ग्राहक लोड बुक करी, रउआ के तुरंत खबर मिल जाई। शुभ यात्रा! 🌾_"
        )
    elif l == "mr":
        return (
            f"🌾 *सफ़र-साथी: ट्रिप यशस्वीरित्या प्रकाशित*\n\n"
            f"नमस्कार *{driver_name}* जी,\n"
            f"आपली नवीन ट्रिप सफ़र-साथी प्लॅटफॉर्मवर थेट प्रकाशित झाली आहे!\n\n"
            f"🛣️ *मार्ग:* {from_loc} → {to_loc}\n"
            f"📅 *दिनांक:* {date}\n"
            f"🚛 *वाहन:* {vehicle}\n"
            f"⚖ *माल क्षमता:* {total_kg} kg\n"
            f"💰 *भाडे:* ₹{price:,.0f}\n"
            f"📝 *पिकअप सूचना / ठिकाण (Instructions):* {p_loc}\n\n"
            f"_ग्राहकांनी जागा बुक केल्यावर आपल्याला त्वरित संदेश मिळेल. धन्यवाद! 🌾_"
        )
    elif l == "bn":
        return (
            f"🌾 *সফর-সাথী: ট্রিপ সফলভাবে প্রকাশিত হয়েছে*\n\n"
            f"নমস্কার *{driver_name}* বাবু,\n"
            f"আপনার নতুন ট্রিপ সফর-সাথী নেটওয়ার্কে লাইভ হয়েছে!\n\n"
            f"🛣️ *রুট:* {from_loc} → {to_loc}\n"
            f"📅 *তারিখ:* {date}\n"
            f"🚛 *যানবাহন:* {vehicle}\n"
            f"⚖ *মাল ধারণক্ষমতা:* {total_kg} kg\n"
            f"💰 *ভাড়া:* ₹{price:,.0f}\n"
            f"📝 *পিকআপ নির্দেশাবলী / স্থান (Instructions):* {p_loc}\n\n"
            f"_বুকিং এলে আপনাকে অবিলম্বে জানানো হবে। নিরাপদ যাত্রা! 🌾_"
        )
    elif l == "ur":
        return (
            f"🌾 *سفر ساتھی: ٹرپ کامیابی کے ساتھ شائع ہو گیا*\n\n"
            f"محترم *{driver_name}* صاحب،\n"
            f"آپ کا نیا سفر کامیابی سے سفر ساتھی پر لائیو ہو گیا ہے!\n\n"
            f"🛣️ *روٹ:* {from_loc} ← {to_loc}\n"
            f"📅 *تاریخ:* {date}\n"
            f"🚛 *گاڑی:* {vehicle}\n"
            f"⚖ *گنجائش:* {total_kg} kg\n"
            f"💰 *کرایہ:* ₹{price:,.0f}\n"
            f"📝 *پک اپ ہدایات / مقام (Instructions):* {p_loc}\n\n"
            f"_بکنگ ہوتے ہی آپ کو فوری اطلاع مل جائے گی۔ پرامن سفر! 🌾_"
        )
    elif l == "te":
        return (
            f"🌾 *సఫర్-సాథీ: ట్రిప్ విజయవంతంగా ప్రచురించబడింది*\n\n"
            f"నమస్కారం *{driver_name}* గారు,\n"
            f"మీ కొత్త ప్రయాణ సమాచారం సఫర్-సాథీలో ప్రచురించబడింది!\n\n"
            f"🛣️ *రూట్:* {from_loc} → {to_loc}\n"
            f"📅 *తేదీ:* {date}\n"
            f"🚛 *వాహనం:* {vehicle}\n"
            f"⚖ *సామర్థ్యం:* {total_kg} kg\n"
            f"💰 *మొత్తం ఛార్జ్:* ₹{price:,.0f}\n"
            f"📝 *పికప్ సూచనలు / ప్రాంతం (Instructions):* {p_loc}\n\n"
            f"_ఎవరైనా సరుకు బుక్ చేయగానే మీకు సమాచారం అందుతుంది. శుభ ప్రయాణం! 🌾_"
        )
    elif l == "ta":
        return (
            f"🌾 *சஃபர்-சாதி: பயணம் வெற்றிகரமாக வெளியிடப்பட்டது*\n\n"
            f"வணக்கம் *{driver_name}* அவர்களே,\n"
            f"உங்கள் புதிய பயண விபரம் சஃபர்-சாதியில் பதிவேற்றப்பட்டது!\n\n"
            f"🛣️ *பாதை:* {from_loc} → {to_loc}\n"
            f"📅 *தேதி:* {date}\n"
            f"🚛 *வாகனம்:* {vehicle}\n"
            f"⚖ *கொள்ளளவு:* {total_kg} kg\n"
            f"💰 *வாடகை:* ₹{price:,.0f}\n"
            f"📝 *ஏற்றுமிடம் / வழிமுறைகள் (Instructions):* {p_loc}\n\n"
            f"_வாடிக்கையாளர் முன்பதிவு செய்தவுடன் உடனடி தகவல் வரும். பாதுகாப்பான பயணம்! 🌾_"
        )
    elif l == "kn":
        return (
            f"🌾 *ಸಫರ್-ಸಾಥಿ: ಟ್ರಿಪ್ ಯಶಸ್ವಿಯಾಗಿ ಪ್ರಕಟಿಸಲಾಗಿದೆ*\n\n"
            f"ನಮಸ್ಕಾರ *{driver_name}* ರವರೇ,\n"
            f"ನಿಮ್ಮ ಹೊಸ ಟ್ರಿಪ್ ಸಫರ್-ಸಾಥಿಯಲ್ಲಿ ಪ್ರಕಟಗೊಂಡಿದೆ!\n\n"
            f"🛣️ *ಮಾರ್ಗ:* {from_loc} → {to_loc}\n"
            f"📅 *ದಿನಾಂಕ:* {date}\n"
            f"🚛 *ವಾಹನ:* {vehicle}\n"
            f"⚖ *ಸಾಮರ್ಥ್ಯ:* {total_kg} kg\n"
            f"💰 *ಬಾಡಿಗೆ:* ₹{price:,.0f}\n"
            f"📝 *ಪಿಕಪ್ ಸೂಚನೆಗಳು / ಸ್ಥಳ (Instructions):* {p_loc}\n\n"
            f"_ಬುಕಿಂಗ್ ಆದ ತಕ್ಷಣ ನಿಮಗೆ ಸಂದೇಶ ಬರುತ್ತದೆ. ಸುರಕ್ಷಿತ ಪ್ರಯಾಣ! 🌾_"
        )
    elif l == "ml":
        return (
            f"🌾 *സഫർ-സാഥി: ട്രിപ്പ് വിജയകരമായി പ്രസിദ്ധീകരിച്ചു*\n\n"
            f"നമസ്കാരം *{driver_name}*,\n"
            f"നിങ്ങളുടെ പുതിയ ട്രിപ്പ് ഓഫർ സഫർ-സാഥിയിൽ ലഭ്യമാണ്!\n\n"
            f"🛣️ *റൂട്ട്:* {from_loc} → {to_loc}\n"
            f"📅 *തിയ്യതി:* {date}\n"
            f"🚛 *വാഹനം:* {vehicle}\n"
            f"⚖ *ശേഷി:* {total_kg} kg\n"
            f"💰 *കൂലി:* ₹{price:,.0f}\n"
            f"📝 *പിക്കപ്പ് നിർദ്ദേശങ്ങൾ / സ്ഥലം (Instructions):* {p_loc}\n\n"
            f"_ബുക്കിംഗ് ലഭിച്ചാലുടൻ നിങ്ങളെ അറിയിക്കും. ശുഭയാത്ര! 🌾_"
        )
    elif l == "or":
        return (
            f"🌾 *ସଫର-ସାଥୀ: ଯାତ୍ରା ସଫଳତାର ସହ ପ୍ରକାଶିତ ହେଲା*\n\n"
            f"ନମସ୍କାର *{driver_name}* ବାବୁ,\n"
            f"ଆପଣଙ୍କ ନୂଆ ଯାତ୍ରା ସଫର-ସାଥୀ ପ୍ଲାଟଫର୍ମରେ ଲାଇଭ୍ ହୋଇଛି!\n\n"
            f"🛣️ *ରୁଟ୍:* {from_loc} → {to_loc}\n"
            f"📅 *ତାରିଖ:* {date}\n"
            f"🚛 *ଗାଡ଼ି:* {vehicle}\n"
            f"⚖ *କ୍ଷମତା:* {total_kg} kg\n"
            f"💰 *ଭଡ଼ା:* ₹{price:,.0f}\n"
            f"📝 *ପିକଅପ୍ ନିର୍ଦ୍ଦେଶାବଳୀ / ସ୍ଥାନ (Instructions):* {p_loc}\n\n"
            f"_ଗ୍ରାହକ ବୁକ୍ କଲା ମାତ୍ରେ ଆପଣଙ୍କୁ ସୂଚନା ମିଳିବ। ଶୁଭ ଯାତ୍ରା! 🌾_"
        )
    elif l == "pa":
        return (
            f"🌾 *ਸਫ਼ਰ-ਸਾਥੀ: ਯਾਤਰਾ ਸਫਲਤਾਪੂਰਵਕ ਪੋਸਟ ਕੀਤੀ ਗਈ*\n\n"
            f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ *{driver_name}* ਜੀ,\n"
            f"ਤੁਹਾਡੀ ਨਵੀਂ ਯਾਤਰਾ ਸਫ਼ਰ-ਸਾਥੀ ਉੱਤੇ ਲਾਈਵ ਹੋ ਗਈ ਹੈ!\n\n"
            f"🛣️ *ਰੂਟ:* {from_loc} → {to_loc}\n"
            f"📅 *ਮਿਤੀ:* {date}\n"
            f"🚛 *ਗੱਡੀ:* {vehicle}\n"
            f"⚖ *ਸਮਰੱਥਾ:* {total_kg} kg\n"
            f"💰 *ਕਿਰਾਇਆ:* ₹{price:,.0f}\n"
            f"📝 *ਪਿਕਅੱਪ ਹਦਾਇਤਾਂ / ਸਥਾਨ (Instructions):* {p_loc}\n\n"
            f"_ਕੋਈ ਗਾਹਕ ਬੁਕਿੰਗ ਕਰੇਗਾ ਤਾਂ ਤੁਹਾਨੂੰ ਤੁਰੰਤ ਸੁਨੇਹਾ ਮਿਲੇਗਾ। ਸੁਰੱਖਿਅਤ ਸਫ਼ਰ! 🌾_"
        )
    elif l == "gu":
        return (
            f"🌾 *સફર-સાથી: ટ્રિપ સફળતાપૂર્વક પ્રકાશિત થઈ*\n\n"
            f"નમસ્તે *{driver_name}* ભાઈ,\n"
            f"તમારી નવી ટ્રિપ સફર-સાથી પર લાઈવ થઈ ગઈ છે!\n\n"
            f"🛣️ *રૂટ:* {from_loc} → {to_loc}\n"
            f"📅 *તારીખ:* {date}\n"
            f"🚛 *વાહન:* {vehicle}\n"
            f"⚖ *ક્ષમતા:* {total_kg} kg\n"
            f"💰 *ભાડું:* ₹{price:,.0f}\n"
            f"📝 *પીકઅપ સૂચનાઓ / સ્થળ (Instructions):* {p_loc}\n\n"
            f"_કોઈ ગ્રાહક લોડ બુક કરશે ત્યારે તમને તરત જ સંદેશ મળશે. સુરક્ષિત યાત્રા! 🌾_"
        )
    else: # hi
        return (
            f"🌾 *सफ़र-साथी: यात्रा सफलतापूर्वक प्रकाशित (Trip Published)*\n\n"
            f"नमस्ते *{driver_name}* जी,\n"
            f"आपकी नई माल परिवहन यात्रा सफ़र-साथी पर प्रकाशित हो गई है!\n\n"
            f"🛣️ *रूट:* {from_loc} → {to_loc}\n"
            f"📅 *यात्रा तिथि:* {date}\n"
            f"🚛 *वाहन:* {vehicle}\n"
            f"⚖ *कुल क्षमता:* {total_kg} kg\n"
            f"💰 *कुल लोड किराया:* ₹{price:,.0f}\n"
            f"📝 *पिकअप निर्देश / लैंडमार्क (Instructions):* {p_loc}\n\n"
            f"_जैसे ही कोई ग्राहक लोड बुक करेगा, आपको तुरंत WhatsApp सूचना प्राप्त होगी। सुरक्षित यात्रा! 🌾_"
        )


# =========================================================================
# 2. BOOKING CREATED (To Driver) - NO OTP
# =========================================================================
def msg_booking_created_driver(driver_name: str, shipper_name: str, shipper_phone: str, weight: int, vehicle: str, route: str, pickup: str, fare: float, is_shared: bool = False, sharers_count: int = 1, lang: str = "hi") -> str:
    l = normalize_lang(lang)
    p_loc = str(pickup).strip() if (pickup and str(pickup).strip()) else "Designated Hub"

    if l == "en":
        fare_text = f"💰 *Shared Fare for this Shipper:* ₹{fare:,.0f} (👥 Active Co-Shippers: {sharers_count})" if (is_shared and sharers_count > 1) else f"💰 *Trip Total Load Fare:* ₹{fare:,.0f} (Solo Shipper)"
        return (
            f"🌾 *Safar-Saathi: New Cargo Booking Request*\n\n"
            f"Hello *{driver_name}*,\n"
            f"*{shipper_name}* (📞 {shipper_phone}) has requested *{weight} kg* cargo space on your vehicle ({vehicle}).\n\n"
            f"📍 *Pickup Location / Instructions:* {p_loc}\n"
            f"🛣️ *Route:* {route}\n"
            f"{fare_text}\n\n"
            f"_Open Safar-Saathi app to accept or manage this booking request._"
        )
    elif l == "bho":
        fare_text = f"💰 *एह ग्राहक के शेयरिंग भाड़ा:* ₹{fare:,.0f} (👥 कुल ग्राहक: {sharers_count})" if (is_shared and sharers_count > 1) else f"💰 *गाड़ी के कुल लोड भाड़ा:* ₹{fare:,.0f} (पहिला ग्राहक)"
        return (
            f"🌾 *सफ़र-साथी: नया माल बुकिंग अनुरोध*\n\n"
            f"प्रणाम *{driver_name}* जी,\n"
            f"*{shipper_name}* (📞 {shipper_phone}) रउआ के गाड़ी ({vehicle}) पर *{weight} kg* माल बुक कइले बाड़न।\n\n"
            f"📍 *पिकअप जगह / निर्देश:* {p_loc}\n"
            f"🛣️ *रूट:* {route}\n"
            f"{fare_text}\n\n"
            f"_अनुरोध स्वीकार करे खातिर सफ़र-साथी ऐप खोलीं।_"
        )
    elif l == "mr":
        fare_text = f"💰 *या ग्राहकाचा शेअरिंग भाडे हिस्सा:* ₹{fare:,.0f} (👥 एकूण ग्राहक: {sharers_count})" if (is_shared and sharers_count > 1) else f"💰 *वाहनाचे एकूण लोड भाडे:* ₹{fare:,.0f} (पहिले बुकिंग)"
        return (
            f"🌾 *सफ़र-साथी: नवीन माल बुकिंग विनंती*\n\n"
            f"नमस्कार *{driver_name}* जी,\n"
            f"*{shipper_name}* (📞 {shipper_phone}) यांनी आपल्या वाहनावर ({vehicle}) *{weight} kg* लोड बुक केला आहे।\n\n"
            f"📍 *पिकअप ठिकाण / सूचना:* {p_loc}\n"
            f"🛣️ *मार्ग:* {route}\n"
            f"{fare_text}\n\n"
            f"_विनंती स्वीकारण्यासाठी कृपया सफ़र-साथी अ‍ॅप उघडा._"
        )
    elif l == "bn":
        fare_text = f"💰 *এই গ্রাহকের শেয়ারিং ভাড়া:* ₹{fare:,.0f} (👥 মোট গ্রাহক: {sharers_count})" if (is_shared and sharers_count > 1) else f"💰 *গাড়ির মোট লোড ভাড়া:* ₹{fare:,.0f}"
        return (
            f"🌾 *সফর-সাথী: নতুন কার্গো বুকিং অনুরোধ*\n\n"
            f"নমস্কার *{driver_name}* বাবু,\n"
            f"*{shipper_name}* (📞 {shipper_phone}) আপনার গাড়িতে ({vehicle}) *{weight} kg* মাল বুক করেছেন।\n\n"
            f"📍 *পিকআপ স্থান / নির্দেশ:* {p_loc}\n"
            f"🛣️ *রুট:* {route}\n"
            f"{fare_text}\n\n"
            f"_অনুরোধ গ্রহণ করতে সফর-সাথী অ্যাপ খুলুন।_"
        )
    elif l == "ur":
        fare_text = f"💰 *اس گاہک کا شیئرنگ کرایہ:* ₹{fare:,.0f} (👥 کل شرکاء: {sharers_count})" if (is_shared and sharers_count > 1) else f"💰 *گاڑی کا کل کرایہ:* ₹{fare:,.0f}"
        return (
            f"🌾 *سفر ساتھی: نیا کارگو بکنگ کا مطالبہ*\n\n"
            f"محترم *{driver_name}* صاحب،\n"
            f"*{shipper_name}* (📞 {shipper_phone}) نے آپ کی گاڑی पर *{weight} kg* کا بوجھ بک کیا ہے۔\n\n"
            f"📍 *مقام / ہدایات:* {p_loc}\n"
            f"🛣️ *روٹ:* {route}\n"
            f"{fare_text}\n\n"
            f"_درخواست قبول کرنے کے لیے سفر ساتھی ایپ کھولیں۔_"
        )
    elif l == "te":
        fare_text = f"💰 *ఈ కస్టమర్ షేరింగ్ ఛార్జ్:* ₹{fare:,.0f} (👥 మొత్తం కస్టమర్లు: {sharers_count})" if (is_shared and sharers_count > 1) else f"💰 *మొత్తం ఛార్జ్:* ₹{fare:,.0f}"
        return (
            f"🌾 *సఫర్-సాథీ: కొత్త సరుకు బుకింగ్ అభ్యర్థన*\n\n"
            f"నమస్కారం *{driver_name}* గారు,\n"
            f"*{shipper_name}* (📞 {shipper_phone}) మీ వాహనంలో *{weight} kg* స్పేస్ బుక్ చేశారు.\n\n"
            f"📍 *పికప్ ప్రాంతం / సూచనలు:* {p_loc}\n"
            f"🛣️ *రూట్:* {route}\n"
            f"{fare_text}\n\n"
            f"_బుకింగ్ అంగీకరించడానికి సఫర్-సాథీ యాప్ ఓపెన్ చేయండి._"
        )
    elif l == "ta":
        fare_text = f"💰 *பகிர்வு வாடகை:* ₹{fare:,.0f} (👥 மொத்தம்: {sharers_count})" if (is_shared and sharers_count > 1) else f"💰 *மொத்த வாடகை:* ₹{fare:,.0f}"
        return (
            f"🌾 *சஃபர்-சாதி: புதிய சரக்கு முன்பதிவு கோரிக்கை*\n\n"
            f"வணக்கம் *{driver_name}* அவர்களே,\n"
            f"*{shipper_name}* (📞 {shipper_phone}) உங்கள் வாகனத்தில் *{weight} kg* சரக்கு முன்பதிவு செய்துள்ளார்.\n\n"
            f"📍 *ஏற்றுமிடம் / வழிமுறைகள்:* {p_loc}\n"
            f"🛣️ *பாதை:* {route}\n"
            f"{fare_text}\n\n"
            f"_ஏற்றுக்கொள்ள சஃபர்-சாதி செயலியை திறக்கவும்._"
        )
    elif l == "kn":
        fare_text = f"💰 *ಹಂಚಿಕೆಯ ಬಾಡಿಗೆ:* ₹{fare:,.0f} (👥 ಒಟ್ಟು ಗ್ರಾಹಕರು: {sharers_count})" if (is_shared and sharers_count > 1) else f"💰 *ಒಟ್ಟು ಬಾಡಿಗೆ:* ₹{fare:,.0f}"
        return (
            f"🌾 *ಸಫರ್-ಸಾಥಿ: ಹೊಸ ಸರಕು ಬುಕಿಂಗ್ ವಿನಂತಿ*\n\n"
            f"ನಮಸ್ಕಾರ *{driver_name}* ರವರೇ,\n"
            f"*{shipper_name}* (📞 {shipper_phone}) ನಿಮ್ಮ ವಾಹನದಲ್ಲಿ *{weight} kg* ಸರಕು ಜಾಗವನ್ನು ಬುಕ್ ಮಾಡಿದ್ದಾರೆ.\n\n"
            f"📍 *ಪಿಕಪ್ ಸ್ಥಳ / ಸೂಚನೆಗಳು:* {p_loc}\n"
            f"🛣️ *ಮಾರ್ಗ:* {route}\n"
            f"{fare_text}\n\n"
            f"_ಸ್ವೀಕರಿಸಲು ಸಫರ್-ಸಾಥಿ ಆಪ್ ತೆರೆಯಿರಿ._"
        )
    elif l == "ml":
        fare_text = f"💰 *ഷെയറിങ് വാടക:* ₹{fare:,.0f} (👥 ആകെ: {sharers_count})" if (is_shared and sharers_count > 1) else f"💰 *ആകെ വാടക:* ₹{fare:,.0f}"
        return (
            f"🌾 *സഫർ-സാഥി: പുതിയ ചരക്ക് ബുക്കിംഗ്*\n\n"
            f"നമസ്കാരം *{driver_name}*,\n"
            f"*{shipper_name}* (📞 {shipper_phone}) നിങ്ങളുടെ വാഹനത്തിൽ *{weight} kg* ചരക്ക് ബുക്ക് ചെയ്തിട്ടുണ്ട്.\n\n"
            f"📍 *പിക്കപ്പ് സ്ഥലം / നിർദ്ദേശങ്ങൾ:* {p_loc}\n"
            f"🛣️ *റൂട്ട്:* {route}\n"
            f"{fare_text}\n\n"
            f"_സ്വീകരിക്കാൻ സഫർ-സാഥി ആപ്പ് തുറക്കുക._"
        )
    elif l == "or":
        fare_text = f"💰 *ଶେୟାରିଂ ଭଡ଼ା:* ₹{fare:,.0f} (👥 ମୋଟ ଗ୍ରାହକ: {sharers_count})" if (is_shared and sharers_count > 1) else f"💰 *ମୋଟ ଭଡ଼ା:* ₹{fare:,.0f}"
        return (
            f"🌾 *ସଫର-ସାଥୀ: ନୂତନ ମାଲ୍ ବୁକିଂ ଅନୁରୋଧ*\n\n"
            f"ନମସ୍କାର *{driver_name}* ବାବୁ,\n"
            f"*{shipper_name}* (📞 {shipper_phone}) ଆପଣଙ୍କ ଗାଡ଼ିରେ *{weight} kg* ସ୍ପେସ୍ ବୁକ୍ କରିଛନ୍ତି।\n\n"
            f"📍 *ପିକଅପ୍ ସ୍ଥାନ / ନିର୍ଦ୍ଦେଶ:* {p_loc}\n"
            f"🛣️ *ରୁଟ୍:* {route}\n"
            f"{fare_text}\n\n"
            f"_ସ୍ୱୀକାର କରିବା ପାଇଁ ସଫର-ସାଥୀ ଆପ୍ ଖୋଲନ୍ତୁ।_"
        )
    elif l == "pa":
        fare_text = f"💰 *ਸ਼ੇਅਰਿੰਗ ਕਿਰਾਇਆ:* ₹{fare:,.0f} (👥 ਕੁੱਲ ਗਾਹਕ: {sharers_count})" if (is_shared and sharers_count > 1) else f"💰 *ਕੁੱਲ ਲੋਡ ਕਿਰਾਇਆ:* ₹{fare:,.0f}"
        return (
            f"🌾 *ਸਫ਼ਰ-ਸਾਥੀ: ਨਵੀਂ ਮਾਲ ਬੁਕਿੰਗ ਬੇਨਤੀ*\n\n"
            f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ *{driver_name}* ਜੀ,\n"
            f"*{shipper_name}* (📞 {shipper_phone}) ਨੇ ਤੁਹਾਡੀ ਗੱਡੀ 'ਤੇ *{weight} kg* ਮਾਲ ਬੁੱਕ ਕੀਤਾ ਹੈ।\n\n"
            f"📍 *ਪਿਕਅੱਪ ਸਥਾਨ / ਹਦਾਇਤਾਂ:* {p_loc}\n"
            f"🛣️ *ਰੂਟ:* {route}\n"
            f"{fare_text}\n\n"
            f"_ਬੇਨਤੀ ਸਵੀਕਾਰ ਕਰਨ ਲਈ ਸਫ਼ਰ-ਸਾਥੀ ਐਪ ਖੋਲ੍ਹੋ।_"
        )
    elif l == "gu":
        fare_text = f"💰 *શેરિંગ ભાડું:* ₹{fare:,.0f} (👥 કુલ ગ્રાહકો: {sharers_count})" if (is_shared and sharers_count > 1) else f"💰 *કુલ લોડ ભાડું:* ₹{fare:,.0f}"
        return (
            f"🌾 *સફર-સાથી: નવી માલ બુકિંગ વિનંતી*\n\n"
            f"નમસ્તે *{driver_name}* ભાઈ,\n"
            f"*{shipper_name}* (📞 {shipper_phone}) એ તમારા વાહન પર *{weight} kg* માલ બુક કર્યો છે.\n\n"
            f"📍 *પીકઅપ સ્થળ / સૂચનાઓ:* {p_loc}\n"
            f"🛣️ *રૂટ:* {route}\n"
            f"{fare_text}\n\n"
            f"_સ્વીકારવા માટે સફર-સાથી એપ ખોલો._"
        )
    else: # hi
        fare_text = f"💰 *इस ग्राहक का शेयरिंग किराया:* ₹{fare:,.0f} (👥 कुल शेयरिंग ग्राहक: {sharers_count})" if (is_shared and sharers_count > 1) else f"💰 *कुल वाहन लोड किराया:* ₹{fare:,.0f} (एकल बुकिंग)"
        return (
            f"🌾 *सफ़र-साथी: नया माल बुकिंग अनुरोध*\n\n"
            f"नमस्ते *{driver_name}* जी,\n"
            f"*{shipper_name}* (📞 {shipper_phone}) ने आपके वाहन ({vehicle}) पर *{weight} kg* माल लोड बुक किया है।\n\n"
            f"📍 *पिकअप स्थान / निर्देश (Pickup Details):* {p_loc}\n"
            f"🛣️ *रूट:* {route}\n"
            f"{fare_text}\n\n"
            f"_अनुरोध स्वीकार करने के लिए सफ़र-साथी ऐप खोलें। सुरक्षित यात्रा! 🌾_"
        )


# =========================================================================
# 3. BOOKING CREATED (To Shipper) - NO OTP + CLEAR SOLO/SHARED EXPLANATION
# =========================================================================
def msg_booking_created_shipper(shipper_name: str, driver_name: str, driver_phone: str, weight: int, vehicle: str, route: str, pickup: str, fare: float, is_shared: bool = False, sharers_count: int = 1, savings: float = 0.0, lang: str = "hi") -> str:
    l = normalize_lang(lang)
    p_loc = str(pickup).strip() if (pickup and str(pickup).strip()) else "Designated Hub"

    if l == "en":
        if is_shared and sharers_count > 1:
            fare_section = (
                f"💰 *Your Shared Load Fare:* ₹{fare:,.0f}\n"
                f"👥 *Active Co-Shippers:* {sharers_count}\n"
                f"📉 *Your Cost Savings:* ₹{savings:,.0f}"
            )
        else:
            fare_section = (
                f"💰 *Total Vehicle Load Fare (Solo Booking):* ₹{fare:,.0f}\n"
                f"💡 _Note: This is the full vehicle load price. Once other shippers join this vehicle route, the fare will be automatically shared proportionally and your cost will drop significantly!_"
            )
        return (
            f"🌾 *Safar-Saathi: Booking Request Sent*\n\n"
            f"Hello *{shipper_name}*,\n"
            f"Your booking request for *{weight} kg* has been sent to driver *{driver_name}* (📞 {driver_phone}).\n\n"
            f"🚙 *Vehicle:* {vehicle}\n"
            f"📍 *Pickup / Instructions:* {p_loc}\n"
            f"🛣️ *Route:* {route}\n"
            f"{fare_section}\n\n"
            f"_You will receive an instant confirmation when the driver accepts. Thank you! 🌾_"
        )
    elif l == "bho":
        if is_shared and sharers_count > 1:
            fare_section = (
                f"💰 *रउआ के शेयरिंग भाड़ा:* ₹{fare:,.0f}\n"
                f"👥 *कुल साथी ग्राहक:* {sharers_count}\n"
                f"📉 *रउआ के बचत:* ₹{savings:,.0f}"
            )
        else:
            fare_section = (
                f"💰 *गाड़ी के कुल भाड़ा (अकेले बुकिंग):* ₹{fare:,.0f}\n"
                f"💡 _नोट: ई पूरा गाड़ी के भाड़ा बा। जइसे ही एह रूट पर अउरी ग्राहक जुड़िहें, भाड़ा आपस में बंट जाई आ रउआ के खर्चा बहुत कम हो जाई!_"
            )
        return (
            f"🌾 *सफ़र-साथी: बुकिंग अनुरोध भेजल गइल*\n\n"
            f"प्रणाम *{shipper_name}* जी,\n"
            f"रउआ के *{weight} kg* माल बुकिंग अनुरोध चालक *{driver_name}* (📞 {driver_phone}) के भेज दिहल गइल बा।\n\n"
            f"🚙 *गाड़ी:* {vehicle}\n"
            f"📍 *पिकअप / निर्देश:* {p_loc}\n"
            f"🛣️ *रूट:* {route}\n"
            f"{fare_section}\n\n"
            f"_चालक द्वारा स्वीकार करत ही रउआ के सूचना मिल जाई। धन्यवाद! 🌾_"
        )
    elif l == "mr":
        if is_shared and sharers_count > 1:
            fare_section = (
                f"💰 *आपला शेअरिंग भाडे हिस्सा:* ₹{fare:,.0f}\n"
                f"👥 *एकूण सह-ग्राहक:* {sharers_count}\n"
                f"📉 *आपली बचत:* ₹{savings:,.0f}"
            )
        else:
            fare_section = (
                f"💰 *एकूण वाहन भाडे (एकटे बुकिंग):* ₹{fare:,.0f}\n"
                f"💡 _टीप: हे पूर्ण वाहन लोड भाडे आहे. या मार्गावर इतर ग्राहक जोडले जाताच, हे भाडे सर्वांमध्ये विभागले जाईल आणि आपला खर्च खूप कमी होईल!_"
            )
        return (
            f"🌾 *सफ़र-साथी: बुकिंग विनंती पाठवली*\n\n"
            f"नमस्कार *{shipper_name}* जी,\n"
            f"आपली *{weight} kg* माल बुकिंग विनंती चालक *{driver_name}* (📞 {driver_phone}) यांच्याकडे पाठवली आहे।\n\n"
            f"🚙 *वाहन:* {vehicle}\n"
            f"📍 *पिकअप / सूचना:* {p_loc}\n"
            f"🛣️ *मार्ग:* {route}\n"
            f"{fare_section}\n\n"
            f"_चालकाने विनंती स्वीकारताच आपल्याला पुष्टी संदेश मिळेल. धन्यवाद! 🌾_"
        )
    elif l == "bn":
        if is_shared and sharers_count > 1:
            fare_section = (
                f"💰 *আপনার শেয়ারিং ভাড়া:* ₹{fare:,.0f}\n"
                f"👥 *মোট শেয়ারিং গ্রাহক:* {sharers_count}\n"
                f"📉 *আপনার সাশ্রয়:* ₹{savings:,.0f}"
            )
        else:
            fare_section = (
                f"💰 *মোট গাড়ির লোড ভাড়া (একক বুকিং):* ₹{fare:,.0f}\n"
                f"💡 _দ্রষ্টব্য: এটি সম্পূর্ণ গাড়ির লোড ভাড়া। এই রুটে অন্য গ্রাহক যুক্ত হলে ভাড়া স্বয়ংক্রিয়ভাবে ভাগ হয়ে যাবে এবং আপনার খরচ কমে যাবে!_"
            )
        return (
            f"🌾 *সফর-সাথী: বুকিং অনুরোধ পাঠানো হয়েছে*\n\n"
            f"নমস্কার *{shipper_name}*,\n"
            f"আপনার *{weight} kg* माल বুকিং অনুরোধ চালক *{driver_name}* (📞 {driver_phone}) এর কাছে পাঠানো হয়েছে।\n\n"
            f"🚙 *যানবাহন:* {vehicle}\n"
            f"📍 *পিকআপ / নির্দেশ:* {p_loc}\n"
            f"🛣️ *রুট:* {route}\n"
            f"{fare_section}\n\n"
            f"_চালক গ্রহণ করলেই নিশ্চিতকরণ বার্তা পাবেন। ধন্যবাদ! 🌾_"
        )
    elif l == "ur":
        if is_shared and sharers_count > 1:
            fare_section = (
                f"💰 *آپ کا شیئرنگ کرایہ:* ₹{fare:,.0f}\n"
                f"👥 *کل شرکاء:* {sharers_count}\n"
                f"📉 *آپ کی بچت:* ₹{savings:,.0f}"
            )
        else:
            fare_section = (
                f"💰 *گاڑی کا کل کرایہ (سولو بکنگ):* ₹{fare:,.0f}\n"
                f"💡 _نوٹ: یہ گاڑی کا مکمل کرایہ ہے۔ جیسے ہی مزید گاہک اس روٹ پر شامل ہوں گے، کرایہ تقسیم ہو جائے گا اور آپ کا خرچ کم ہو جائے گا!_"
            )
        return (
            f"🌾 *سفر ساتھی: بکنگ کی درخواست بھیج دی گئی*\n\n"
            f"محترم *{shipper_name}* صاحب،\n"
            f"آپ کی *{weight} kg* کی بکنگ درخواست ڈرائیور *{driver_name}* (📞 {driver_phone}) کو بھیج دی گئی ہے۔\n\n"
            f"🚙 *گاڑی:* {vehicle}\n"
            f"📍 *مقام / ہدایات:* {p_loc}\n"
            f"🛣️ *روٹ:* {route}\n"
            f"{fare_section}\n\n"
            f"_ڈرائیور کے قبول کرتے ہی آپ کو اطلاع مل جائے گی۔ شکریہ! 🌾_"
        )
    elif l == "te":
        if is_shared and sharers_count > 1:
            fare_section = (
                f"💰 *మీ షేరింగ్ ఛార్జ్:* ₹{fare:,.0f}\n"
                f"👥 *మొత్తం కస్టమర్లు:* {sharers_count}\n"
                f"📉 *మీ పొదుపు:* ₹{savings:,.0f}"
            )
        else:
            fare_section = (
                f"💰 *మొత్తం వాహన ఛార్జ్:* ₹{fare:,.0f}\n"
                f"💡 _గమనిక: ఇది పూర్తి వాహన ఛార్జ్. ఇతర కస్టమర్లు చేరినప్పుడు ఛార్జీ ఆటోమేటిక్‌గా పంచుకోబడుతుంది మరియు మీ ఖర్చు తగ్గుతుంది!_"
            )
        return (
            f"🌾 *సఫర్-సాథీ: బుకింగ్ అభ్యర్థన పంపబడింది*\n\n"
            f"నమస్కారం *{shipper_name}* గారు,\n"
            f"మీ *{weight} kg* సరుకు బుకింగ్ డ్రైవర్ *{driver_name}* (📞 {driver_phone}) కు పంపబడింది.\n\n"
            f"🚙 *వాహనం:* {vehicle}\n"
            f"📍 *పికప్ / సూచనలు:* {p_loc}\n"
            f"🛣️ *రూట్:* {route}\n"
            f"{fare_section}\n\n"
            f"_డ్రైవర్ అంగీకరించిన వెంటనే మీకు కన్ఫర్మేషన్ వస్తుంది. ధన్యవాదాలు! 🌾_"
        )
    elif l == "ta":
        if is_shared and sharers_count > 1:
            fare_section = (
                f"💰 *உங்கள் பகிர்வு வாடகை:* ₹{fare:,.0f}\n"
                f"👥 *மொத்த வாடிக்கையாளர்கள்:* {sharers_count}\n"
                f"📉 *உங்கள் சேமிப்பு:* ₹{savings:,.0f}"
            )
        else:
            fare_section = (
                f"💰 *முழு வாகன வாடகை:* ₹{fare:,.0f}\n"
                f"💡 _குறிப்பு: இது முழு வாகன கட்டணம். கூடுதல் வாடிக்கையாளர்கள் இணையும் போது வாடகை பகிர்ந்தளிக்கப்பட்டு உங்கள் கட்டணம் குறையும்!_"
            )
        return (
            f"🌾 *சஃபர்-சாதி: முன்பதிவு கோரிக்கை அனுப்பப்பட்டது*\n\n"
            f"வணக்கம் *{shipper_name}* அவர்களே,\n"
            f"உங்கள் *{weight} kg* முன்பதிவு ஓட்டுநர் *{driver_name}* (📞 {driver_phone}) அவர்களுக்கு அனுப்பப்பட்டுள்ளது.\n\n"
            f"🚙 *வாகனம்:* {vehicle}\n"
            f"📍 *ஏற்றுமிடம் / வழிமுறைகள்:* {p_loc}\n"
            f"🛣️ *பாதை:* {route}\n"
            f"{fare_section}\n\n"
            f"_ஓட்டுநர் ஏற்றவுடன் உறுதிப்படுத்தல் தகவல் வரும். நன்றி! 🌾_"
        )
    elif l == "kn":
        if is_shared and sharers_count > 1:
            fare_section = (
                f"💰 *ನಿಮ್ಮ ಹಂಚಿಕೆಯ ಬಾಡಿಗೆ:* ₹{fare:,.0f}\n"
                f"👥 *ಒಟ್ಟು ಗ್ರಾಹಕರು:* {sharers_count}\n"
                f"📉 *ನಿಮ್ಮ ಉಳಿತಾಯ:* ₹{savings:,.0f}"
            )
        else:
            fare_section = (
                f"💰 *ಸಂಪೂರ್ಣ ವಾಹನ ಬಾಡಿಗೆ:* ₹{fare:,.0f}\n"
                f"💡 _ಸೂಚನೆ: ಇದು ಪೂರ್ಣ ವಾಹನದ ಬಾಡಿಗೆ. ಇತರ ಗ್ರಾಹಕರು ಸೇರಿದಂತೆ ಬಾಡಿಗೆ ಹಂಚಿಕೆಯಾಗಿ ನಿಮ್ಮ ವೆಚ್ಚ ಕಡಿಮೆಯಾಗುತ್ತದೆ!_"
            )
        return (
            f"🌾 *ಸಫರ್-ಸಾಥಿ: ಬುಕಿಂಗ್ ವಿನಂತಿ ಕಳುಹಿಸಲಾಗಿದೆ*\n\n"
            f"ನಮಸ್ಕಾರ *{shipper_name}* ರವರೇ,\n"
            f"ನಿಮ್ಮ *{weight} kg* ಸರಕು ಬುಕಿಂಗ್ ಚಾಲಕ *{driver_name}* (📞 {driver_phone}) ರವರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.\n\n"
            f"🚙 *ವಾಹನ:* {vehicle}\n"
            f"📍 *ಪિકಪ್ / ಸೂಚನೆಗಳು:* {p_loc}\n"
            f"🛣️ *ಮಾರ್ಗ:* {route}\n"
            f"{fare_section}\n\n"
            f"_ಚಾಲಕರು ಸ್ವೀಕರಿಸಿದ ತಕ್ಷಣ ದೃಢೀಕರಣ ಸಂದೇಶ ಬರುತ್ತದೆ. ಧನ್ಯವಾದಗಳು! 🌾_"
        )
    elif l == "ml":
        if is_shared and sharers_count > 1:
            fare_section = (
                f"💰 *നിങ്ങളുടെ പങ്കിട്ട വാടക:* ₹{fare:,.0f}\n"
                f"👥 *ആകെ പങ്കാളികൾ:* {sharers_count}\n"
                f"📉 *നിങ്ങളുടെ ലാഭം:* ₹{savings:,.0f}"
            )
        else:
            fare_section = (
                f"💰 *ആകെ വാഹന വാടക:* ₹{fare:,.0f}\n"
                f"💡 _ശ്രദ്ധിക്കുക: കൂടുതൽ ആളുകൾ ചേരുമ്പോൾ വാടക തുല്യമായി പങ്കിട്ട് നിങ്ങളുടെ ചെലവ് കുറയും!_"
            )
        return (
            f"🌾 *സഫർ-സാഥി: ബുക്കിംഗ് അഭ്യർത്ഥന അയച്ചു*\n\n"
            f"നമസ്കാരം *{shipper_name}*,\n"
            f"നിങ്ങളുടെ *{weight} kg* ബുക്കിംഗ് ഡ്രൈവർ *{driver_name}* (📞 {driver_phone}) ന് അയച്ചിട്ടുണ്ട്.\n\n"
            f"🚙 *വാഹനം:* {vehicle}\n"
            f"📍 *പിക്കപ്പ് / നിർദ്ദേശങ്ങൾ:* {p_loc}\n"
            f"🛣️ *റൂട്ട്:* {route}\n"
            f"{fare_section}\n\n"
            f"_ഡ്രൈവർ സ്വീകരിച്ചാലുടൻ സ്ഥിരീകരണ അറിയിപ്പ് ലഭിക്കും. നന്ദി! 🌾_"
        )
    elif l == "or":
        if is_shared and sharers_count > 1:
            fare_section = (
                f"💰 *ଆପଣଙ୍କ ଶେୟାରିଂ ଭଡ଼ା:* ₹{fare:,.0f}\n"
                f"👥 *ମୋଟ ଗ୍ରାହକ:* {sharers_count}\n"
                f"📉 *ଆପଣଙ୍କ ବଚତ:* ₹{savings:,.0f}"
            )
        else:
            fare_section = (
                f"💰 *ସମ୍ପୂର୍ଣ୍ଣ ଗାଡ଼ି ଭଡ଼ା:* ₹{fare:,.0f}\n"
                f"💡 _ସୂଚନା: ଅନ୍ୟ ଗ୍ରାହକ ଯୋଡ଼ି ହେଲେ ଭଡ଼ା ବଣ୍ଟାଯିବ ଏବଂ ଆପଣଙ୍କ ଖର୍ଚ୍ଚ କମିଯିବ!_"
            )
        return (
            f"🌾 *ସଫର-ସାଥୀ: ବୁକିଂ ଅନୁରୋଧ ପଠାଗଲା*\n\n"
            f"ନମସ୍କାର *{shipper_name}*,\n"
            f"ଆପଣଙ୍କର *{weight} kg* ବୁକିଂ ଅନୁରୋଧ ଡ୍ରାଇଭର *{driver_name}* (📞 {driver_phone}) ଙ୍କୁ ପଠାଯାଇଛି।\n\n"
            f"🚙 *ଗାଡ଼ି:* {vehicle}\n"
            f"📍 *ପିକଅପ୍ / ନିର୍ଦ୍ଦେଶ:* {p_loc}\n"
            f"🛣️ *ରୁଟ୍:* {route}\n"
            f"{fare_section}\n\n"
            f"_ଡ୍ରାଇଭର ଗ୍ରହଣ କଲା ପରେ ନିଶ୍ଚିତକରଣ ମିଳିବ। ଧନ୍ୟବାଦ! 🌾_"
        )
    elif l == "pa":
        if is_shared and sharers_count > 1:
            fare_section = (
                f"💰 *ਤੁਹਾਡਾ ਸ਼ੇਅਰਿੰਗ ਕਿਰਾਇਆ:* ₹{fare:,.0f}\n"
                f"👥 *ਕੁੱਲ ਸਾਥੀ ਗਾਹਕ:* {sharers_count}\n"
                f"📉 *ਤੁਹਾਡੀ ਬੱਚਤ:* ₹{savings:,.0f}"
            )
        else:
            fare_section = (
                f"💰 *ਪੂਰੀ ਗੱਡੀ ਦਾ ਕਿਰਾਇਆ:* ₹{fare:,.0f}\n"
                f"💡 _ਨੋਟ: ਹੋਰ ਗਾਹਕ ਜੁੜਨ 'ਤੇ ਕਿਰਾਇਆ ਵੰਡਿਆ ਜਾਵੇਗਾ ਅਤੇ ਤੁਹਾਡਾ ਖ਼ਰਚਾ ਕਾਫ਼ੀ ਘੱਟ ਜਾਵੇਗਾ!_"
            )
        return (
            f"🌾 *ਸਫ਼ਰ-ਸਾਥੀ: ਬੁਕਿੰਗ ਬੇਨਤੀ ਦਰਜ*\n\n"
            f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ *{shipper_name}* ਜੀ,\n"
            f"ਤੁਹਾਡੀ *{weight} kg* ਮਾਲ ਬੁਕਿੰਗ ਬੇਨਤੀ ਡਰਾਈਵਰ *{driver_name}* (📞 {driver_phone}) ਨੂੰ ਭੇਜ ਦਿੱਤੀ ਗਈ ਹੈ।\n\n"
            f"🚙 *ਗੱਡੀ:* {vehicle}\n"
            f"📍 *ਪਿਕਅੱਪ / ਹਦਾਇਤਾਂ:* {p_loc}\n"
            f"🛣️ *ਰੂਟ:* {route}\n"
            f"{fare_section}\n\n"
            f"_ਡਰਾਈਵਰ ਵੱਲੋਂ ਮਨਜ਼ੂਰ ਕਰਨ 'ਤੇ ਤੁਹਾਨੂੰ ਪੁਸ਼ਟੀ ਮਿਲੇਗੀ। ਧੰਨਵਾਦ! 🌾_"
        )
    elif l == "gu":
        if is_shared and sharers_count > 1:
            fare_section = (
                f"💰 *તમારું શેરિંગ ભાડું:* ₹{fare:,.0f}\n"
                f"👥 *કુલ ગ્રાહકો:* {sharers_count}\n"
                f"📉 *તમારી બચત:* ₹{savings:,.0f}"
            )
        else:
            fare_section = (
                f"💰 *સંપૂર્ણ વાહન લોડ ભાડું:* ₹{fare:,.0f}\n"
                f"💡 _નોંધ: અન્ય ગ્રાહકો જોડાતાં જ ભાડું વહેંચાઈ જશે અને તમારો ખર્ચ ઘટી જશે!_"
            )
        return (
            f"🌾 *સફર-સાથી: બુકિંગ વિનંતી મોકલાઈ*\n\n"
            f"નમસ્તે *{shipper_name}*,\n"
            f"તમારી *{weight} kg* માલ બુકિંગ વિનંતી ડ્રાઇવર *{driver_name}* (📞 {driver_phone}) ને મોકલી દેવામાં આવી છે.\n\n"
            f"🚙 *વાહન:* {vehicle}\n"
            f"📍 *પીકઅપ / સૂચનાઓ:* {p_loc}\n"
            f"🛣️ *રૂટ:* {route}\n"
            f"{fare_section}\n\n"
            f"_ડ્રાઇવર સ્વીકારશે એટલે તમને તરત જ પુષ્ટિ મળશે. આભાર! 🌾_"
        )
    else: # hi
        if is_shared and sharers_count > 1:
            fare_section = (
                f"💰 *आपका शेयरिंग लोड किराया हिस्सा:* ₹{fare:,.0f}\n"
                f"👥 *कुल शेयरिंग साथी ग्राहक:* {sharers_count}\n"
                f"📉 *आपकी कुल बचत:* ₹{savings:,.0f}"
            )
        else:
            fare_section = (
                f"💰 *कुल वाहन लोड किराया (अकेले बुकिंग):* ₹{fare:,.0f}\n"
                f"💡 _नोट: यह पूरा वाहन लोड किराया है। जैसे ही इस रूट पर अन्य साथी ग्राहक जुड़ेंगे, यह किराया आनुपातिक रूप से सभी में बंट जाएगा और आपका खर्च काफी कम हो जाएगा!_"
            )
        return (
            f"🌾 *सफ़र-साथी: बुकिंग अनुरोध दर्ज*\n\n"
            f"नमस्ते *{shipper_name}* जी,\n"
            f"आपका *{weight} kg* माल बुकिंग अनुरोध चालक *{driver_name}* (📞 {driver_phone}) को भेज दिया गया है।\n\n"
            f"🚙 *वाहन:* {vehicle}\n"
            f"📍 *पिकअप स्थान / निर्देश (Pickup Details):* {p_loc}\n"
            f"🛣️ *रूट:* {route}\n"
            f"{fare_section}\n\n"
            f"_चालक द्वारा अनुरोध स्वीकार करते ही आपको पुष्टि प्राप्त होगी। धन्यवाद! 🌾_"
        )


# =========================================================================
# 3B. FARE REDUCED / CO-SHIPPER JOINED UPDATE (To All Existing Shippers)
# =========================================================================
def msg_fare_reduced_update_shipper(shipper_name: str, route: str, sharers_count: int, new_fare: float, savings: float, lang: str = "hi") -> str:
    l = normalize_lang(lang)
    if l == "en":
        return (
            f"🎉 *Safar-Saathi: Fare Reduced - Co-Shipper Joined!*\n\n"
            f"Hello *{shipper_name}*,\n"
            f"Great news! Another shipper has joined your vehicle route (*{route}*). 🤝\n\n"
            f"👥 *Total Active Co-Shippers:* {sharers_count}\n"
            f"💰 *Your New Reduced Fare:* ₹{new_fare:,.0f}\n"
            f"📉 *Your Total Savings:* ₹{savings:,.0f}\n\n"
            f"_Economical and safe cargo pooling with Safar-Saathi! 🌾_"
        )
    elif l == "bho":
        return (
            f"🎉 *सफ़र-साथी: भाड़ा कम भइल - नया साथी जुड़ल!*\n\n"
            f"प्रणाम *{shipper_name}* जी,\n"
            f"खुशखबरी! रउआ के रूट (*{route}*) पर एगो अउरी साथी ग्राहक जुड़ गइल बाड़न। 🤝\n\n"
            f"👥 *कुल साथी ग्राहक:* {sharers_count}\n"
            f"💰 *रउआ के नया कम भइल भाड़ा:* ₹{new_fare:,.0f}\n"
            f"📉 *रउआ के कुल बचत:* ₹{savings:,.0f}\n\n"
            f"_सफ़र-साथी संग कम खर्चा में सुरक्षित माल ढुलाई! 🌾_"
        )
    elif l == "mr":
        return (
            f"🎉 *सफ़र-साथी: भाडे कमी झाले - नवीन सह-ग्राहक जोडले!*\n\n"
            f"नमस्कार *{shipper_name}* जी,\n"
            f"आनंदाची बातमी! आपल्या मार्गावर (*{route}*) आणखी एक सहकारी ग्राहक जोडले गेले आहेत. 🤝\n\n"
            f"👥 *एकूण सह-ग्राहक:* {sharers_count}\n"
            f"💰 *आपले नवीन कमी झालेले भाडे:* ₹{new_fare:,.0f}\n"
            f"📉 *आपली एकूण बचत:* ₹{savings:,.0f}\n\n"
            f"_सफ़र-साथी सोबत कमी खर्चात सुरक्षित माल वाहतूक! 🌾_"
        )
    elif l == "bn":
        return (
            f"🎉 *সফর-সাথী: ভাড়া কমেছে - নতুন সহ-গ্রাহক যুক্ত হয়েছেন!*\n\n"
            f"নমস্কার *{shipper_name}*,\n"
            f"সুসংবাদ! আপনার রুটে (*{route}*) আরেকজন সহ-গ্রাহক যুক্ত হয়েছেন। 🤝\n\n"
            f"👥 *মোট শেয়ারিং গ্রাহক:* {sharers_count}\n"
            f"💰 *আপনার নতুন হ্রাসকৃত ভাড়া:* ₹{new_fare:,.0f}\n"
            f"📉 *আপনার মোট সাশ্রয়:* ₹{savings:,.0f}\n\n"
            f"_সফর-সাথীর সাথে কম খরচে নিরাপদ মাল পরিবহন! 🌾_"
        )
    elif l == "ur":
        return (
            f"🎉 *سفر ساتھی: کرایہ کم ہو گیا - نیا شراکت دار شامل!*\n\n"
            f"محترم *{shipper_name}* صاحب،\n"
            f"خوشخبری! آپ کے روٹ (*{route}*) پر ایک اور گاہک شامل ہو گیا ہے۔ 🤝\n\n"
            f"👥 *کل شرکاء:* {sharers_count}\n"
            f"💰 *آپ کا نیا کم شدہ کرایہ:* ₹{new_fare:,.0f}\n"
            f"📉 *آپ کی کل بچت:* ₹{savings:,.0f}\n\n"
            f"_سفر ساتھی کے ساتھ کم خرچ میں محفوظ نقل و حمل! 🌾_"
        )
    elif l == "te":
        return (
            f"🎉 *సఫర్-సాథీ: ఛార్జీ తగ్గింది - కొత్త తోటి కస్టమర్ చేరారు!*\n\n"
            f"నమస్కారం *{shipper_name}* గారు,\n"
            f"శుభవార్త! మీ రూట్ (*{route}*) లో మరొక కస్టమర్ చేరారు. 🤝\n\n"
            f"👥 *మొత్తం కస్టమర్లు:* {sharers_count}\n"
            f"💰 *మీ కొత్త తగ్గిన ఛార్జీ:* ₹{new_fare:,.0f}\n"
            f"📉 *మీ పొదుపు:* ₹{savings:,.0f}\n\n"
            f"_సఫర్-సాథీతో తక్కువ ఖర్చుతో సురక్షిత రవాణా! 🌾_"
        )
    elif l == "ta":
        return (
            f"🎉 *சஃபர்-சாதி: வாடகை குறைந்தது - புதிய வாடிக்கையாளர் இணைந்தார்!*\n\n"
            f"வணக்கம் *{shipper_name}* அவர்களே,\n"
            f"நற்செய்தி! உங்கள் பாதையில் (*{route}*) மற்றொரு வாடிக்கையாளர் இணைந்துள்ளார். 🤝\n\n"
            f"👥 *மொத்த வாடிக்கையாளர்கள்:* {sharers_count}\n"
            f"💰 *உங்கள் புதிய குறைந்த வாடகை:* ₹{new_fare:,.0f}\n"
            f"📉 *உங்கள் சேமிப்பு:* ₹{savings:,.0f}\n\n"
            f"_சஃபர்-சாதியுடன் குறைந்த செலவில் பாதுகாப்பான போக்குவரத்து! 🌾_"
        )
    elif l == "kn":
        return (
            f"🎉 *ಸಫರ್-ಸಾಥಿ: ಬಾಡಿಗೆ ಕಡಿಮೆಯಾಗಿದೆ - ಹೊಸ ಗ್ರಾಹಕರು ಸೇರ್ಪಡೆ!*\n\n"
            f"ನಮಸ್ಕಾರ *{shipper_name}* ರವರೇ,\n"
            f"ಶುಭ ಸುದ್ದಿ! ನಿಮ್ಮ ಮಾರ್ಗದಲ್ಲಿ (*{route}*) ಮತ್ತೊಬ್ಬ ಗ್ರಾಹಕರು ಸೇರಿದ್ದಾರೆ. 🤝\n\n"
            f"👥 *ಒಟ್ಟು ಗ್ರಾಹಕರು:* {sharers_count}\n"
            f"💰 *ನಿಮ್ಮ ಹೊಸ ಕಡಿಮೆ ಬಾಡಿಗೆ:* ₹{new_fare:,.0f}\n"
            f"📉 *ನಿಮ್ಮ ಉಳಿತಾಯ:* ₹{savings:,.0f}\n\n"
            f"_ಸಫರ್-ಸಾಥಿ ಜೊತೆ ಕಡಿಮೆ ವೆಚ್ಚದಲ್ಲಿ ಸುರಕ್ಷಿತ ಸಾಗಾಟ! 🌾_"
        )
    elif l == "ml":
        return (
            f"🎉 *സഫർ-സാഥി: വാടക കുറഞ്ഞു - പുതിയ പങ്കാളി ചേർന്നു!*\n\n"
            f"നമസ്കാരം *{shipper_name}*,\n"
            f"സന്തോഷവാർത്ത! നിങ്ങളുടെ റൂട്ടിൽ (*{route}*) മറ്റൊരു ഉപഭോക്താവ് കൂടി ചേർന്നു. 🤝\n\n"
            f"👥 *ആകെ പങ്കാളികൾ:* {sharers_count}\n"
            f"💰 *നിങ്ങളുടെ പുതിയ കുറഞ്ഞ വാടക:* ₹{new_fare:,.0f}\n"
            f"📉 *നിങ്ങളുടെ ലാഭം:* ₹{savings:,.0f}\n\n"
            f"_സഫർ-സാഥിക്കൊപ്പം കുറഞ്ഞ ചിലവിൽ സുരക്ഷിത ചരക്കുനീക്കം! 🌾_"
        )
    elif l == "or":
        return (
            f"🎉 *ସଫର-ସାଥୀ: ଭଡ଼ା କମିଲା - ନୂଆ ସାଥୀ ଯୋଡ଼ି ହେଲେ!*\n\n"
            f"ନମସ୍କାର *{shipper_name}*,\n"
            f"ଖୁସି ଖବର! ଆପଣଙ୍କ ରୁଟ୍ (*{route}*) ରେ ଆଉ ଜଣେ ଗ୍ରାହକ ଯୋଡ଼ି ହୋଇଛନ୍ତି। 🤝\n\n"
            f"👥 *ମୋଟ ସହଭାଗୀ:* {sharers_count}\n"
            f"💰 *ଆପଣଙ୍କ ନୂଆ କମ୍ ଭଡ଼ା:* ₹{new_fare:,.0f}\n"
            f"📉 *ଆପଣଙ୍କ ବଚତ:* ₹{savings:,.0f}\n\n"
            f"_ସଫର-ସାଥୀ ସହ କମ୍ ଖର୍ଚ୍ଚରେ ସୁରକ୍ଷିତ ମାଲ୍ ପରିବହନ! 🌾_"
        )
    elif l == "pa":
        return (
            f"🎉 *ਸਫ਼ਰ-ਸਾਥੀ: ਕਿਰਾਇਆ ਘਟਿਆ - ਨਵਾਂ ਗਾਹਕ ਜੁੜਿਆ!*\n\n"
            f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ *{shipper_name}* ਜੀ,\n"
            f"ਖੁਸ਼ਖਬਰੀ! ਤੁਹਾਡੇ ਰੂਟ (*{route}*) 'ਤੇ ਇੱਕ ਹੋਰ ਸਾਥੀ ਗਾਹਕ ਜੁੜ ਗਿਆ ਹੈ। 🤝\n\n"
            f"👥 *ਕੁੱਲ ਸਾਥੀ ਗਾਹਕ:* {sharers_count}\n"
            f"💰 *ਤੁਹਾਡਾ ਨਵਾਂ ਘਟਿਆ ਕਿਰਾਇਆ:* ₹{new_fare:,.0f}\n"
            f"📉 *ਤੁਹਾਡੀ ਬੱਚਤ:* ₹{savings:,.0f}\n\n"
            f"_ਸਫ਼ਰ-ਸਾਥੀ ਨਾਲ ਘੱਟ ਖ਼ਰਚੇ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਮਾਲ ਢੋਆ-ਢੁਆਈ! 🌾_"
        )
    elif l == "gu":
        return (
            f"🎉 *સફર-સાથી: ભાડું ઘટ્યું - નવો ગ્રાહક જોડાયો!*\n\n"
            f"નમસ્તે *{shipper_name}*,\n"
            f"ખુશખબર! તમારા રૂટ (*{route}*) પર અન્ય સહ-ગ્રાહક જોડાયા છે. 🤝\n\n"
            f"👥 *કુલ ગ્રાહકો:* {sharers_count}\n"
            f"💰 *તમારું નવું ઘટેલું ભાડું:* ₹{new_fare:,.0f}\n"
            f"📉 *તમારી બચત:* ₹{savings:,.0f}\n\n"
            f"_સફર-સાથી સાથે ઓછા ખર્ચે સુરક્ષિત માલ પરિવહન! 🌾_"
        )
    else: # hi
        return (
            f"🎉 *सफ़र-साथी: किराया कम हुआ - नया साथी ग्राहक जुड़ा! (Fare Reduced)*\n\n"
            f"नमस्ते *{shipper_name}* जी,\n"
            f"खुशखबरी! आपके रूट (*{route}*) पर एक और साथी ग्राहक जुड़ गए हैं। 🤝\n\n"
            f"👥 *कुल शेयरिंग ग्राहक:* {sharers_count}\n"
            f"💰 *आपका नया कम किया गया किराया:* ₹{new_fare:,.0f}\n"
            f"📉 *आपकी कुल बचत:* ₹{savings:,.0f}\n\n"
            f"_सफ़र-साथी के साथ कम खर्च में सुरक्षित माल ढुलाई! 🌾_"
        )


# =========================================================================
# 4. BOOKING ACCEPTED (To Shipper) - NO OTP
# =========================================================================
def msg_booking_accepted_shipper(shipper_name: str, driver_name: str, driver_phone: str, weight: int, vehicle: str, route: str, pickup: str, fare: float, lang: str = "hi") -> str:
    l = normalize_lang(lang)
    p_loc = pickup or "Designated Hub"
    if l == "en":
        return (
            f"✅ *Safar-Saathi: Booking Confirmed!*\n\n"
            f"Hello *{shipper_name}*,\n"
            f"Driver *{driver_name}* (📞 {driver_phone}) has ACCEPTED your *{weight} kg* cargo booking!\n\n"
            f"🚙 *Vehicle:* {vehicle}\n"
            f"📍 *Pickup:* {p_loc}\n"
            f"🛣️ *Route:* {route}\n"
            f"💰 *Confirmed Fare:* ₹{fare:,.0f}\n\n"
            f"_The driver will arrive at your pickup location as scheduled. Thank you! 🌾_"
        )
    elif l == "bho":
        return (
            f"✅ *सफ़र-साथी: बुकिंग कन्फर्म!*\n\n"
            f"प्रणाम *{shipper_name}* जी,\n"
            f"चालक *{driver_name}* (📞 {driver_phone}) रउआ के *{weight} kg* लोड स्वीकार कइले बाड़न!\n\n"
            f"🚙 *गाड़ी:* {vehicle}\n"
            f"📍 *पिकअप:* {p_loc}\n"
            f"🛣️ *रूट:* {route}\n"
            f"💰 *भाड़ा:* ₹{fare:,.0f}\n\n"
            f"_चालक समय पर पिकअप लोकेशन पर पहुँचीहें। धन्यवाद! 🌾_"
        )
    elif l == "mr":
        return (
            f"✅ *सफ़र-साथी: बुकिंग कन्फर्म!*\n\n"
            f"नमस्कार *{shipper_name}* जी,\n"
            f"चालक *{driver_name}* (📞 {driver_phone}) यांनी आपली *{weight} kg* माल बुकिंग स्वीकारली आहे!\n\n"
            f"🚙 *वाहन:* {vehicle}\n"
            f"📍 *पिकअप:* {p_loc}\n"
            f"🛣️ *मार्ग:* {route}\n"
            f"💰 *भाडे:* ₹{fare:,.0f}\n\n"
            f"_चालक वेळेवर पिकअप ठिकाणी पोहोचतील. धन्यवाद! 🌾_"
        )
    elif l == "bn":
        return (
            f"✅ *সফর-সাথী: বুকিং নিশ্চিত!*\n\n"
            f"নমস্কার *{shipper_name}*,\n"
            f"চালক *{driver_name}* (📞 {driver_phone}) আপনার *{weight} kg* বুকিং গ্রহণ করেছেন!\n\n"
            f"🚙 *যানবাহন:* {vehicle}\n"
            f"📍 *পিকআপ:* {p_loc}\n"
            f"🛣️ *রুট:* {route}\n"
            f"💰 *ভাড়া:* ₹{fare:,.0f}\n\n"
            f"_চালক নির্ধারিত সময়ে পিকআপ স্থানে পৌঁছাবেন। ধন্যবাদ! 🌾_"
        )
    elif l == "ur":
        return (
            f"✅ *سفر ساتھی: بکنگ کنفرم ہو گئی!*\n\n"
            f"محترم *{shipper_name}* صاحب،\n"
            f"ڈرائیور *{driver_name}* (📞 {driver_phone}) نے آپ کی *{weight} kg* کی بکنگ قبول کر لی ہے!\n\n"
            f"🚙 *گاڑی:* {vehicle}\n"
            f"📍 *مقام:* {p_loc}\n"
            f"🛣️ *روٹ:* {route}\n"
            f"💰 *کرایہ:* ₹{fare:,.0f}\n\n"
            f"_ڈرائیور وقت پر پک اپ مقام پر پہنچ جائے گا۔ شکریہ! 🌾_"
        )
    elif l == "te":
        return (
            f"✅ *సఫర్-సాథీ: బుకింగ్ కన్ఫర్మ్ అయింది!*\n\n"
            f"నమస్కారం *{shipper_name}* గారు,\n"
            f"డ్రైవర్ *{driver_name}* (📞 {driver_phone}) మీ *{weight} kg* బుకింగ్‌ను ఆమోదించారు!\n\n"
            f"🚙 *వాహనం:* {vehicle}\n"
            f"📍 *పికప్:* {p_loc}\n"
            f"🛣️ *రూట్:* {route}\n"
            f"💰 *ఛార్జ్:* ₹{fare:,.0f}\n\n"
            f"_డ్రైవర్ సమయానికి పికప్ పాయింట్‌కి చేరుకుంటారు. ధన్యవాదాలు! 🌾_"
        )
    elif l == "ta":
        return (
            f"✅ *சஃபர்-சாதி: முன்பதிவு உறுதி செய்யப்பட்டது!*\n\n"
            f"வணக்கம் *{shipper_name}* அவர்களே,\n"
            f"ஓட்டுநர் *{driver_name}* (📞 {driver_phone}) உங்கள் *{weight} kg* முன்பதிவை ஏற்றுக்கொண்டார்!\n\n"
            f"🚙 *வாகனம்:* {vehicle}\n"
            f"📍 *ஏற்றுமிடம்:* {p_loc}\n"
            f"🛣️ *பாதை:* {route}\n"
            f"💰 *வாடகை:* ₹{fare:,.0f}\n\n"
            f"_ஓட்டுநர் குறித்த நேரத்தில் வருவார். நன்றி! 🌾_"
        )
    elif l == "kn":
        return (
            f"✅ *ಸಫರ್-ಸಾಥಿ: ಬುಕಿಂಗ್ ಖಚಿತಗೊಂಡಿದೆ!*\n\n"
            f"ನಮಸ್ಕಾರ *{shipper_name}* ರವರೇ,\n"
            f"ಚಾಲಕ *{driver_name}* (📞 {driver_phone}) ನಿಮ್ಮ *{weight} kg* ಬುಕಿಂಗ್ ಸ್ವೀಕರಿಸಿದ್ದಾರೆ!\n\n"
            f"🚙 *ವಾಹನ:* {vehicle}\n"
            f"📍 *ಪಿಕಪ್:* {p_loc}\n"
            f"🛣️ *ಮಾರ್ಗ:* {route}\n"
            f"💰 *ಬಾಡಿಗೆ:* ₹{fare:,.0f}\n\n"
            f"_ಚಾಲಕರು ಸಮಯಕ್ಕೆ ಪಿಕಪ್ ಸ್ಥಳಕ್ಕೆ ಬರುತ್ತಾರೆ. ಧನ್ಯವಾದಗಳು! 🌾_"
        )
    elif l == "ml":
        return (
            f"✅ *സഫർ-സാഥി: ബുക്കിംഗ് സ്ഥിരീകരിച്ചു!*\n\n"
            f"നമസ്കാരം *{shipper_name}*,\n"
            f"ഡ്രൈവർ *{driver_name}* (📞 {driver_phone}) നിങ്ങളുടെ *{weight} kg* ബുക്കിംഗ് സ്വീകരിച്ചിരിക്കുന്നു!\n\n"
            f"🚙 *വാഹനം:* {vehicle}\n"
            f"📍 *പിക്കപ്പ്:* {p_loc}\n"
            f"🛣️ *റൂട്ട്:* {route}\n"
            f"💰 *കൂലി:* ₹{fare:,.0f}\n\n"
            f"_ഡ്രൈവർ കൃത്യസമയത്ത് എത്തുന്നതാണ്. നന്ദി! 🌾_"
        )
    elif l == "or":
        return (
            f"✅ *ସଫର-ସାଥୀ: ବୁକିଂ ନିଶ୍ଚିତ ହେଲା!*\n\n"
            f"ନମସ୍କାର *{shipper_name}*,\n"
            f"ଡ୍ରାଇଭର *{driver_name}* (📞 {driver_phone}) ଆପଣଙ୍କ *{weight} kg* ବୁକିଂ ସ୍ୱୀକାର କରିଛନ୍ତି!\n\n"
            f"🚙 *ଗାଡ଼ି:* {vehicle}\n"
            f"📍 *ପିକଅପ୍:* {p_loc}\n"
            f"🛣️ *ରୁଟ୍:* {route}\n"
            f"💰 *ଭଡ଼ା:* ₹{fare:,.0f}\n\n"
            f"_ଡ୍ରାଇଭର ସମୟ ଅନୁଯାୟୀ ପହଞ୍ଚିବେ। ଧନ୍ୟବାଦ! 🌾_"
        )
    elif l == "pa":
        return (
            f"✅ *ਸਫ਼ਰ-ਸਾਥੀ: ਬੁਕਿੰਗ ਕਨਫ਼ਰਮ!*\n\n"
            f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ *{shipper_name}* ਜੀ,\n"
            f"ਡਰਾਈਵਰ *{driver_name}* (📞 {driver_phone}) ਨੇ ਤੁਹਾਡੀ *{weight} kg* ਮਾਲ ਬੁਕਿੰਗ ਮਨਜ਼ੂਰ ਕਰ ਲਈ ਹੈ!\n\n"
            f"🚙 *ਗੱਡੀ:* {vehicle}\n"
            f"📍 *ਪਿਕਅੱਪ:* {p_loc}\n"
            f"🛣️ *ਰੂਟ:* {route}\n"
            f"💰 *ਕਿਰਾਇਆ:* ₹{fare:,.0f}\n\n"
            f"_ਡਰਾਈਵਰ ਸਮੇਂ ਸਿਰ ਪਿਕਅੱਪ ਪੁਆਇੰਟ 'ਤੇ ਪਹੁੰਚੇਗਾ। ਧੰਨਵਾਦ! 🌾_"
        )
    elif l == "gu":
        return (
            f"✅ *સફર-સાથી: બુકિંગ કન્ફર્મ!*\n\n"
            f"નમસ્તે *{shipper_name}*,\n"
            f"ડ્રાઇવર *{driver_name}* (📞 {driver_phone}) એ તમારો *{weight} kg* માલ સ્વીકારી લીધો છે!\n\n"
            f"🚙 *વાહન:* {vehicle}\n"
            f"📍 *પીકઅપ:* {p_loc}\n"
            f"🛣️ *રૂટ:* {route}\n"
            f"💰 *ભાડું:* ₹{fare:,.0f}\n\n"
            f"_ડ્રાઇવર સમયસર પીકઅપ સ્થળે પહોંચશે. આભાર! 🌾_"
        )
    else: # hi
        return (
            f"✅ *सफ़र-साथी: बुकिंग स्वीकृत व कन्फर्म!*\n\n"
            f"नमस्ते *{shipper_name}* जी,\n"
            f"चालक *{driver_name}* (📞 {driver_phone}) ने आपका *{weight} kg* माल अनुरोध स्वीकार कर लिया है!\n\n"
            f"🚙 *वाहन:* {vehicle}\n"
            f"📍 *पिकअप स्थान:* {p_loc}\n"
            f"🛣️ *रूट:* {route}\n"
            f"💰 *किराया:* ₹{fare:,.0f}\n\n"
            f"_चालक तय समय पर पिकअप लोकेशन पर पहुंचेंगे। सुरक्षित यात्रा! 🌾_"
        )


# =========================================================================
# 5. BOOKING ACCEPTED (To Driver) - NO OTP
# =========================================================================
def msg_booking_accepted_driver(driver_name: str, shipper_name: str, shipper_phone: str, weight: int, route: str, pickup: str, fare: float, lang: str = "hi") -> str:
    l = normalize_lang(lang)
    p_loc = pickup or "Designated Hub"
    if l == "en":
        return (
            f"✅ *Safar-Saathi: Booking Accepted & Confirmed*\n\n"
            f"Hello *{driver_name}*,\n"
            f"You have accepted *{shipper_name}*'s (📞 {shipper_phone}) cargo booking of *{weight} kg*.\n\n"
            f"📍 *Pickup:* {p_loc}\n"
            f"🛣️ *Route:* {route}\n"
            f"💰 *Payment Share:* ₹{fare:,.0f}\n\n"
            f"_Please coordinate with the shipper for loading. Safe driving! 🌾_"
        )
    elif l == "bho":
        return (
            f"✅ *सफ़र-साथी: राइड कन्फर्म*\n\n"
            f"प्रणाम *{driver_name}* जी,\n"
            f"रउआ *{shipper_name}* (📞 {shipper_phone}) के *{weight} kg* लोड स्वीकार कइले बानी।\n\n"
            f"📍 *पिकअप:* {p_loc}\n"
            f"💰 *कमाई हिस्सा:* ₹{fare:,.0f}\n\n"
            f"_लोडिंग खातिर ग्राहक से संपर्क करीं। शुभ यात्रा! 🌾_"
        )
    elif l == "mr":
        return (
            f"✅ *सफ़र-साथी: राइड कन्फर्म*\n\n"
            f"नमस्कार *{driver_name}* जी,\n"
            f"तुम्ही *{shipper_name}* (📞 {shipper_phone}) यांचा *{weight} kg* लोड स्वीकारला आहे.\n\n"
            f"📍 *पिकअप:* {p_loc}\n"
            f"💰 *भाडे हिस्सा:* ₹{fare:,.0f}\n\n"
            f"_माल लोडिंगसाठी ग्राहकाशी समन्वय साधा. सुरक्षित प्रवास! 🌾_"
        )
    else: # hi & others fallback
        return (
            f"✅ *सफ़र-साथी: बुकिंग स्वीकृत व कन्फर्म*\n\n"
            f"नमस्ते *{driver_name}* जी,\n"
            f"आपने *{shipper_name}* (📞 {shipper_phone}) का *{weight} kg* लोड स्वीकार कर लिया है।\n\n"
            f"📍 *पिकअप:* {p_loc}\n"
            f"💰 *किराया शेयर:* ₹{fare:,.0f}\n\n"
            f"_कृपया माल लोडिंग हेतु ग्राहक से संपर्क करें। सुरक्षित यात्रा! 🌾_"
        )


# =========================================================================
# 6. DELIVERY PROOF SUBMITTED (To Shipper) -> Request to Confirm & Rate (Sent with Photo Attachment)
# =========================================================================
def msg_delivery_proof_shipper(shipper_name: str, driver_name: str, weight: int, route: str, lang: str = "hi") -> str:
    l = normalize_lang(lang)
    if l == "en":
        return (
            f"📸 *Safar-Saathi: Delivery Completed (Verified Photo Attached)*\n\n"
            f"Hello *{shipper_name}*,\n"
            f"Driver *{driver_name}* has delivered your *{weight} kg* cargo at the destination! 📦\n\n"
            f"🛣️ *Route:* {route}\n"
            f"📸 *Stage 2 Delivery Proof Photo:* Attached above\n\n"
            f"👉 *Action Required: Please open Safar-Saathi app and click 'Confirm Delivery & Rate' to verify receipt and rate the driver.* Thank you! 🌾"
        )
    elif l == "bho":
        return (
            f"📸 *सफ़र-साथी: माल डिलीवरी पूरा (फोटो संलग्न)*\n\n"
            f"प्रणाम *{shipper_name}* जी,\n"
            f"चालक *{driver_name}* रउआ के *{weight} kg* माल गंतव्य पर पहुँचा दिहले बाड़न आ डिलीवरी फोटो संलग्न बा! 📦\n\n"
            f"🛣️ *रूट:* {route}\n\n"
            f"👉 *कृपया सफ़र-साथी ऐप खोल के माल प्राप्ति के पुष्टि करीं आ चालक के रेटिंग दीं। धन्यवाद! 🌾*"
        )
    elif l == "mr":
        return (
            f"📸 *सफ़र-साथी: माल डिलिव्हरी पूर्ण (फोटो संलग्न)*\n\n"
            f"नमस्कार *{shipper_name}* जी,\n"
            f"चालक *{driver_name}* यांनी आपला *{weight} kg* माल गंतव्यस्थानी पोहोचवला असून डिलिव्हरी फोटो संलग्न केला आहे! 📦\n\n"
            f"🛣️ *मार्ग:* {route}\n\n"
            f"👉 *कृपया सफ़र-साथी अ‍ॅप उघडून माल मिळाल्याची पुष्टी करा आणि चालकाला रेटिंग द्या. धन्यवाद! 🌾*"
        )
    elif l == "bn":
        return (
            f"📸 *সফর-সাথী: ডেলিভারি সম্পন্ন (ছবি সংযুক্ত)*\n\n"
            f"নমস্কার *{shipper_name}*,\n"
            f"চালক *{driver_name}* আপনার *{weight} kg* মাল গন্তব্যে পৌঁছে দিয়েছেন এবং ডেলিভারি ছবি সংযুক্ত করেছেন! 📦\n\n"
            f"🛣️ *রুট:* {route}\n\n"
            f"👉 *অনুগ্রহ করে সফর-সাথী অ্যাপে গিয়ে 'Confirm Delivery & Rate' ক্লিক করে চালককে রেটিং দিন। ধন্যবাদ! 🌾*"
        )
    elif l == "ur":
        return (
            f"📸 *سفر ساتھی: سامان پہنچ گیا (تصویر منسلک ہے)*\n\n"
            f"محترم *{shipper_name}* صاحب،\n"
            f"ڈرائیور *{driver_name}* نے آپ کا *{weight} kg* سامان منزل پر پہنچا دیا ہے اور تصویر منسلک ہے! 📦\n\n"
            f"🛣️ *روٹ:* {route}\n\n"
            f"👉 *براہ کرم سفر ساتھی ایپ کھول کر ڈیلیوری کی تصدیق کریں اور ڈرائیور کو ریٹنگ دیں۔ شکریہ! 🌾*"
        )
    elif l == "te":
        return (
            f"📸 *సఫర్-సాథీ: డెలివరీ పూర్తయింది (ఫోటో జతచేయబడింది)*\n\n"
            f"నమస్కారం *{shipper_name}* గారు,\n"
            f"డ్రైవర్ *{driver_name}* మీ *{weight} kg* సరుకును చేర్చి డెలివరీ ఫోటో జతచేశారు! 📦\n\n"
            f"🛣️ *రూట్:* {route}\n\n"
            f"👉 *దయచేసి సఫర్-సాథీ యాప్ ఓపెన్ చేసి డెలివరీ నిర్ధారించి డ్రైవర్‌కు రేటింగ్ ఇవ్వండి. ధన్యవాదాలు! 🌾*"
        )
    elif l == "ta":
        return (
            f"📸 *சஃபர்-சாதி: விநியோகம் முடிந்தது (புகைப்படம் இணைக்கப்பட்டுள்ளது)*\n\n"
            f"வணக்கம் *{shipper_name}* அவர்களே,\n"
            f"ஓட்டுநர் *{driver_name}* உங்கள் *{weight} kg* சரக்கை கொண்டு சேர்த்து புகைப்படத்தை இணைத்துள்ளார்! 📦\n\n"
            f"🛣️ *பாதை:* {route}\n\n"
            f"👉 *தயவுசெய்து சஃபர்-சாதி செயலியை திறந்து விநியோகத்தை உறுதிசெய்து ஓட்டுநருக்கு மதிப்பீடு வழங்கவும். நன்றி! 🌾*"
        )
    elif l == "kn":
        return (
            f"📸 *ಸಫರ್-ಸಾಥಿ: ಡೆಲಿವರಿ ಪೂರ್ಣಗೊಂಡಿದೆ (ಫೋಟೋ ಲಗತ್ತಿಸಲಾಗಿದೆ)*\n\n"
            f"ನಮಸ್ಕಾರ *{shipper_name}* ರವರೇ,\n"
            f"ಚಾಲಕ *{driver_name}* ನಿಮ್ಮ *{weight} kg* ಸರಕನ್ನು ತಲುಪಿಸಿ ಫೋಟೋ ಲಗತ್ತಿಸಿದ್ದಾರೆ! 📦\n\n"
            f"🛣️ *ಮಾರ್ಗ:* {route}\n\n"
            f"👉 *ದಯವಿಟ್ಟು ಸಫರ್-ಸಾಥಿ ಆಪ್ ತೆರೆದು ಡೆಲಿವರಿ ದೃಢಪಡಿಸಿ ಮತ್ತು ರೇಟಿಂಗ್ ನೀಡಿ. ಧನ್ಯವಾದಗಳು! 🌾*"
        )
    elif l == "ml":
        return (
            f"📸 *സഫർ-സാഥി: ഡെലിവറി പൂർത്തിയായി (ഫോട്ടോ ചേർത്തു)*\n\n"
            f"നമസ്കാരം *{shipper_name}*,\n"
            f"ഡ്രൈവർ *{driver_name}* നിങ്ങളുടെ *{weight} kg* ചരക്ക് ലക്ഷ്യസ്ഥാനത്ത് എത്തിച്ച് ഫോട്ടോ നൽകിയിട്ടുണ്ട്! 📦\n\n"
            f"🛣️ *റൂട്ട്:* {route}\n\n"
            f"👉 *സഫർ-സാഥി ആപ്പ് തുറന്ന് ഡെലിവറി സ്ഥിരീകരിക്കുകയും ഡ്രൈവർക്ക് റേറ്റിംഗ് നൽകുകയും ചെയ്യുക. നന്ദി! 🌾*"
        )
    elif l == "or":
        return (
            f"📸 *ସଫର-ସାଥୀ: ଡେଲିଭରୀ ସମ୍ପୂର୍ଣ୍ଣ (ଫଟୋ ସଂଲଗ୍ନ)*\n\n"
            f"ନମସ୍କାର *{shipper_name}*,\n"
            f"ଡ୍ରାଇଭର *{driver_name}* ଆପଣଙ୍କ *{weight} kg* ମାଲ୍ ପହଞ୍ଚାଇ ଫଟୋ ସଂଲଗ୍ନ କରିଛନ୍ତି! 📦\n\n"
            f"🛣️ *ରୁଟ୍:* {route}\n\n"
            f"👉 *ଦୟାକରି ସଫର-ସାଥୀ ଆପ୍ ଖୋଲି ଡେଲିଭରୀ ପୁଷ୍ଟି କରନ୍ତୁ ଏବଂ ଡ୍ରାଇଭରଙ୍କୁ ରେଟିଂ ଦିଅନ୍ତୁ। ଧନ୍ୟବାଦ! 🌾*"
        )
    elif l == "pa":
        return (
            f"📸 *ਸਫ਼ਰ-ਸਾਥੀ: ਮਾਲ ਡਿਲੀਵਰੀ ਮੁਕੰਮਲ (ਫੋਟੋ ਨਾਲ ਨੱਥੀ)*\n\n"
            f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ *{shipper_name}* ਜੀ,\n"
            f"ਡਰਾਈਵਰ *{driver_name}* ਨੇ ਤੁਹਾਡਾ *{weight} kg* ਮਾਲ ਪਹੁੰਚਾ ਦਿੱਤਾ ਹੈ ਅਤੇ ਫੋਟੋ ਨੱਥੀ ਕਰ ਦਿੱਤੀ ਹੈ! 📦\n\n"
            f"🛣️ *ਰੂਟ:* {route}\n\n"
            f"👉 *ਕਿਰਪਾ ਕਰਕੇ ਸਫ਼ਰ-ਸਾਥੀ ਐਪ ਖੋਲ੍ਹ ਕੇ ਮਾਲ ਮਿਲਣ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ ਅਤੇ ਡਰਾਈਵਰ ਨੂੰ ਰੇਟਿੰਗ ਦਿਓ। ਧੰਨਵਾਦ! 🌾*"
        )
    elif l == "gu":
        return (
            f"📸 *સફર-સાથી: ડિલિવરી પૂર્ણ (ફોટો જોડાયેલ છે)*\n\n"
            f"નમસ્તે *{shipper_name}*,\n"
            f"ડ્રાઇવર *{driver_name}* એ તમારો *{weight} kg* માલ પહોંચાડી દીધો છે અને ડિલિવરી ફોટો જોડ્યો છે! 📦\n\n"
            f"🛣️ *રૂટ:* {route}\n\n"
            f"👉 *કૃપા કરીને સફર-સાથી એપ ખોલીને માલ મળ્યાની પુષ્ટિ કરો અને ડ્રાઇવરને રેટિંગ આપો. આભાર! 🌾*"
        )
    else: # hi
        return (
            f"📸 *सफ़र-साथी: माल डिलीवरी पूर्ण (डिलीवरी फोटो संलग्न)*\n\n"
            f"नमस्ते *{shipper_name}* जी,\n"
            f"चालक *{driver_name}* ने गंतव्य मंडी पर आपका *{weight} kg* माल सुरक्षित डिलीवर कर दिया है और स्टेज २ डिलीवरी फोटो संलग्न कर दी है! 📦\n\n"
            f"🛣️ *रूट:* {route}\n\n"
            f"👉 *कृपया सफ़र-साथी ऐप खोलें और 'Confirm Delivery & Rate' पर क्लिक करके माल प्राप्ति की पुष्टि करें व रेटिंग दें। धन्यवाद! 🌾*"
        )


# =========================================================================
# 7. DELIVERY PROOF SUBMITTED (To Driver)
# =========================================================================
def msg_delivery_proof_driver(driver_name: str, route: str, lang: str = "hi") -> str:
    l = normalize_lang(lang)
    if l == "en":
        return (
            f"📸 *Safar-Saathi: Delivery Proof Submitted*\n\n"
            f"Hello *{driver_name}*,\n"
            f"Your delivery photo for [ {route} ] has been verified and recorded.\n"
            f"Waiting for shippers to confirm receipt and submit their star rating. 🌾"
        )
    elif l == "mr":
        return (
            f"📸 *सफ़र-साथी: डिलिव्हरी पुरावा नोंदवला*\n\n"
            f"नमस्कार *{driver_name}* जी,\n"
            f"आपला [ {route} ] डिलिव्हरी फोटो पुरावा नोंदवला गेला आहे. ग्राहकांकडून पुष्टी व रेटिंगची प्रतीक्षा आहे. 🌾"
        )
    elif l == "bho":
        return (
            f"📸 *सफ़र-साथी: डिलीवरी प्रमाण दर्ज*\n\n"
            f"प्रणाम *{driver_name}* जी,\n"
            f"रउआ के [ {route} ] यात्रा के डिलीवरी फोटो प्रमाण दर्ज हो गइल बा। ग्राहक से पुष्टि आ रेटिंग के प्रतीक्षा बा। 🌾"
        )
    else: # hi & others
        return (
            f"📸 *सफ़र-साथी: डिलीवरी प्रमाण फोटो दर्ज (Proof Verified)*\n\n"
            f"नमस्ते *{driver_name}* जी,\n"
            f"आपकी [ {route} ] यात्रा का डिलीवरी प्रमाण फोटो दर्ज हो गया है।\n"
            f"ग्राहकों द्वारा अंतिम पुष्टि व रेटिंग की प्रतीक्षा है। 🌾"
        )


# =========================================================================
# 8. DELIVERY CONFIRMED & RATED (To Driver)
# =========================================================================
def msg_trip_completed_driver(driver_name: str, shipper_name: str, rating: int, feedback: str, fare: float, lang: str = "hi") -> str:
    l = normalize_lang(lang)
    stars = "⭐" * max(1, min(5, int(rating or 5)))
    fb = feedback or "Excellent and safe service!"
    if l == "en":
        return (
            f"🌟 *Safar-Saathi: Delivery Confirmed & Rated!*\n\n"
            f"Hello *{driver_name}*,\n"
            f"*{shipper_name}* has confirmed receipt of their cargo!\n\n"
            f"🏆 *Rating:* {stars} ({rating}/5)\n"
            f"💬 *Review:* \"{fb}\"\n"
            f"💰 *Total Payment Share:* ₹{fare:,.0f}\n\n"
            f"_Thank you for providing outstanding service on Safar-Saathi! 🌾_"
        )
    elif l == "bho":
        return (
            f"🌟 *सफ़र-साथी: डिलीवरी पूरा भइल आ रेटिंग मिलल!*\n\n"
            f"प्रणाम *{driver_name}* जी,\n"
            f"*{shipper_name}* माल प्राप्ति के पुष्टि कइले बाड़न!\n\n"
            f"🏆 *रेटिंग:* {stars} ({rating}/5)\n"
            f"💬 *प्रतिक्रिया:* \"{fb}\"\n"
            f"💰 *रुपया:* ₹{fare:,.0f}\n\n"
            f"_सफ़र-साथी पर बढ़िया सेवा देवे खातिर धन्यवाद! 🌾_"
        )
    elif l == "mr":
        return (
            f"🌟 *सफ़र-साथी: डिलिव्हरी पूर्ण व रेटिंग प्राप्त!*\n\n"
            f"नमस्कार *{driver_name}* जी,\n"
            f"*{shipper_name}* यांनी माल मिळाल्याची पुष्टी केली आहे!\n\n"
            f"🏆 *रेटिंग:* {stars} ({rating}/5)\n"
            f"💬 *प्रतिक्रिया:* \"{fb}\"\n"
            f"💰 *एकूण रक्कम:* ₹{fare:,.0f}\n\n"
            f"_सफ़र-साथी सोबत उत्तम सेवा दिल्याबद्दल धन्यवाद! 🌾_"
        )
    elif l == "bn":
        return (
            f"🌟 *সফর-সাথী: ডেলিভারি নিশ্চিত ও রেটিং প্রাপ্ত!*\n\n"
            f"নমস্কার *{driver_name}* বাবু,\n"
            f"*{shipper_name}* মাল প্রাপ্তির নিশ্চিতকরণ করেছেন!\n\n"
            f"🏆 *রেটিং:* {stars} ({rating}/5)\n"
            f"💬 *মতামত:* \"{fb}\"\n"
            f"💰 *পেমেন্ট:* ₹{fare:,.0f}\n\n"
            f"_সফর-সাথীতে চমৎকার সেবা দেওয়ার জন্য ধন্যবাদ! 🌾_"
        )
    elif l == "te":
        return (
            f"🌟 *సఫర్-సాథీ: డెలివరీ నిర్ధారణ & రేటింగ్!*\n\n"
            f"నమస్కారం *{driver_name}* గారు,\n"
            f"*{shipper_name}* సరుకు చేరినట్లు నిర్ధారించారు!\n\n"
            f"🏆 *రేటింగ్:* {stars} ({rating}/5)\n"
            f"💬 *రివ్యూ:* \"{fb}\"\n"
            f"💰 *చెల్లింపు:* ₹{fare:,.0f}\n\n"
            f"_సఫర్-సాథీలో ఉత్తమ సేవలు అందించినందుకు ధన్యవాదాలు! 🌾_"
        )
    elif l == "ta":
        return (
            f"🌟 *சஃபர்-சாதி: விநியோகம் உறுதி & மதிப்பீடு!*\n\n"
            f"வணக்கம் *{driver_name}* அவர்களே,\n"
            f"*{shipper_name}* சரக்கு கிடைத்ததை உறுதிசெய்துள்ளார்!\n\n"
            f"🏆 *மதிப்பீடு:* {stars} ({rating}/5)\n"
            f"💬 *கருத்து:* \"{fb}\"\n"
            f"💰 *தொகை:* ₹{fare:,.0f}\n\n"
            f"_சிறந்த சேவைக்கு நன்றி! 🌾_"
        )
    elif l == "kn":
        return (
            f"🌟 *ಸಫರ್-ಸಾಥಿ: ಡೆಲಿವರಿ ದೃಢೀಕೃತ & ರೇಟಿಂಗ್!*\n\n"
            f"ನಮಸ್ಕಾರ *{driver_name}* ರವರೇ,\n"
            f"*{shipper_name}* ಸರಕು ತಲುಪಿರುವುದನ್ನು ದೃಢಪಡಿಸಿದ್ದಾರೆ!\n\n"
            f"🏆 *ರೇಟಿಂಗ್:* {stars} ({rating}/5)\n"
            f"💬 *ಅಭಿಪ್ರಾಯ:* \"{fb}\"\n"
            f"💰 *ಹಣ:* ₹{fare:,.0f}\n\n"
            f"_ಉತ್ತಮ ಸೇವೆಗಾಗಿ ಧನ್ಯವಾದಗಳು! 🌾_"
        )
    elif l == "gu":
        return (
            f"🌟 *સફર-સાથી: ડિલિવરી પુષ્ટિ & રેટિંગ!*\n\n"
            f"નમસ્તે *{driver_name}* ભાઈ,\n"
            f"*{shipper_name}* એ માલ મળ્યાની પુષ્ટિ કરી છે!\n\n"
            f"🏆 *રેટિંગ:* {stars} ({rating}/5)\n"
            f"💬 *સમીક્ષા:* \"{fb}\"\n"
            f"💰 *ચુકવણી:* ₹{fare:,.0f}\n\n"
            f"_સારી સેવા આપવા બદલ આભાર! 🌾_"
        )
    elif l == "pa":
        return (
            f"🌟 *ਸਫ਼ਰ-ਸਾਥੀ: ਡਿਲੀਵਰੀ ਪੁਸ਼ਟੀ ਅਤੇ ਰੇਟਿੰਗ!*\n\n"
            f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ *{driver_name}* ਜੀ,\n"
            f"*{shipper_name}* ਨੇ ਮਾਲ ਮਿਲਣ ਦੀ ਪੁਸ਼ਟੀ ਕਰ ਦਿੱਤੀ ਹੈ!\n\n"
            f"🏆 *ਰੇਟਿੰਗ:* {stars} ({rating}/5)\n"
            f"💬 *ਫੀਡਬੈਕ:* \"{fb}\"\n"
            f"💰 *ਕੁੱਲ ਰਕਮ:* ₹{fare:,.0f}\n\n"
            f"_ਵਧੀਆ ਸੇਵਾ ਲਈ ਧੰਨਵਾਦ! 🌾_"
        )
    else: # hi
        return (
            f"🌟 *सफ़र-साथी: डिलीवरी सफलतापूर्वक पूर्ण व मूल्यांकित!*\n\n"
            f"नमस्ते *{driver_name}* जी,\n"
            f"*{shipper_name}* ने माल प्राप्ति की पुष्टि कर दी है!\n\n"
            f"🏆 *रेटिंग:* {stars} ({rating}/5)\n"
            f"💬 *समीक्षा:* \"{fb}\"\n"
            f"💰 *कुल भुगतान शेयर:* ₹{fare:,.0f}\n\n"
            f"_सफ़र-साथी प्लेटफॉर्म पर बेहतरीन सेवा देने के लिए धन्यवाद! 🌾_"
        )


# =========================================================================
# 9. DELIVERY CONFIRMED (To Shipper)
# =========================================================================
def msg_trip_completed_shipper(shipper_name: str, weight: int, rating: int, lang: str = "hi") -> str:
    l = normalize_lang(lang)
    stars = "⭐" * max(1, min(5, int(rating or 5)))
    if l == "en":
        return (
            f"🌟 *Safar-Saathi: Thank You for Your Confirmation!*\n\n"
            f"Hello *{shipper_name}*,\n"
            f"Your *{weight} kg* cargo delivery has been finalized and your rating ({stars}) has been recorded.\n\n"
            f"_Thank you for choosing Safar-Saathi! 🌾_"
        )
    elif l == "bho":
        return (
            f"🌟 *सफ़र-साथी: पुष्टि खातिर धन्यवाद!*\n\n"
            f"प्रणाम *{shipper_name}* जी,\n"
            f"रउआ के *{weight} kg* माल डिलीवरी पूरा हो गइल आ रउआ के रेटिंग ({stars}) दर्ज हो गइल।\n\n"
            f"_सफ़र-साथी से जुड़े खातिर धन्यवाद! 🌾_"
        )
    elif l == "mr":
        return (
            f"🌟 *सफ़र-साथी: पुष्टी केल्याबद्दल धन्यवाद!*\n\n"
            f"नमस्कार *{shipper_name}* जी,\n"
            f"आपली *{weight} kg* माल डिलिव्हरी पूर्ण झाली असून आपले रेटिंग ({stars}) नोंदवले गेले आहे.\n\n"
            f"_सफ़र-साथी सोबत जोडल्याबद्दल धन्यवाद! 🌾_"
        )
    elif l == "bn":
        return (
            f"🌟 *সফর-সাথী: নিশ্চিতকরণের জন্য ধন্যবাদ!*\n\n"
            f"নমস্কার *{shipper_name}*,\n"
            f"আপনার *{weight} kg* মাল ডেলিভারি সম্পন্ন হয়েছে এবং আপনার রেটিং ({stars}) রেকর্ড করা হয়েছে।\n\n"
            f"_সফর-সাথী বেছে নেওয়ার জন্য ধন্যবাদ! 🌾_"
        )
    else: # hi
        return (
            f"🌟 *सफ़र-साथी: सफल डिलीवरी के लिए धन्यवाद!*\n\n"
            f"नमस्ते *{shipper_name}* जी,\n"
            f"आपकी *{weight} kg* माल डिलीवरी पूर्ण हो गई है और आपकी रेटिंग ({stars}) दर्ज कर ली गई है।\n\n"
            f"_सफ़र-साथी के साथ जुड़ने के लिए धन्यवाद! 🌾_"
        )


# =========================================================================
# 10. TRIP IN TRANSIT (To Driver)
# =========================================================================
def msg_in_transit_driver(driver_name: str, route: str, lang: str = "hi") -> str:
    l = normalize_lang(lang)
    if l == "en":
        return (
            f"🚚 *Safar-Saathi: Trip In Transit*\n\n"
            f"Hello *{driver_name}*,\n"
            f"Your trip [ {route} ] is now underway. Drive safely! 🌾"
        )
    elif l == "bho":
        return (
            f"🚚 *सफ़र-साथी: यात्रा शुरू भइल*\n\n"
            f"प्रणाम *{driver_name}* जी,\n"
            f"रउआ के [ {route} ] यात्रा शुरू हो गइल बा। सुरक्षित गाड़ी चलाईं! 🌾"
        )
    elif l == "mr":
        return (
            f"🚚 *सफ़र-साथी: प्रवास सुरू झाला*\n\n"
            f"नमस्कार *{driver_name}* जी,\n"
            f"आपला [ {route} ] प्रवास सुरू झाला आहे. सुरक्षित प्रवास! 🌾"
        )
    elif l == "bn":
        return (
            f"🚚 *সফর-সাথী: ট্রিপ শুরু হয়েছে*\n\n"
            f"নমস্কার *{driver_name}*,\n"
            f"আপনার [ {route} ] যাত্রা শুরু হয়েছে। সাবধানে গাড়ি চালান! 🌾"
        )
    elif l == "te":
        return (
            f"🚚 *సఫర్-సాథీ: ప్రయాణం ప్రారంభమైంది*\n\n"
            f"నమస్కారం *{driver_name}* గారు,\n"
            f"మీ [ {route} ] ప్రయాణం ప్రారంభమైంది. శుభ ప్రయాణం! 🌾"
        )
    elif l == "ta":
        return (
            f"🚚 *சஃபர்-சாதி: பயணம் தொடங்கியது*\n\n"
            f"வணக்கம் *{driver_name}* அவர்களே,\n"
            f"உங்கள் [ {route} ] பயணம் தொடங்கியது. பாதுகாப்பான பயணம்! 🌾"
        )
    elif l == "gu":
        return (
            f"🚚 *સફર-સાથી: યાત્રા શરૂ થઈ*\n\n"
            f"નમસ્તે *{driver_name}* ભાઈ,\n"
            f"તમારી [ {route} ] યાત્રા શરૂ થઈ ગઈ છે. સુરક્ષિત યાત્રા! 🌾"
        )
    elif l == "pa":
        return (
            f"🚚 *ਸਫ਼ਰ-ਸਾਥੀ: ਸਫ਼ਰ ਸ਼ੁਰੂ ਹੋਇਆ*\n\n"
            f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ *{driver_name}* ਜੀ,\n"
            f"ਤੁਹਾਡਾ [ {route} ] ਸਫ਼ਰ ਸ਼ੁਰੂ ਹੋ ਗਿਆ ਹੈ। ਸੁਰੱਖਿਅਤ ਡਰਾਈਵ ਕਰੋ! 🌾"
        )
    else: # hi
        return (
            f"🚚 *सफ़र-साथी: यात्रा प्रारंभ (Trip In Transit)*\n\n"
            f"नमस्ते *{driver_name}* जी,\n"
            f"आपकी [ {route} ] यात्रा शुरू हो चुकी है। सुरक्षित यात्रा! 🌾"
        )


# =========================================================================
# 11. GOODS IN TRANSIT (To Shipper) - NO OTP
# =========================================================================
def msg_in_transit_shipper(shipper_name: str, driver_name: str, driver_phone: str, weight: int, route: str, lang: str = "hi") -> str:
    l = normalize_lang(lang)
    if l == "en":
        return (
            f"🚚 *Safar-Saathi: Goods In Transit*\n\n"
            f"Hello *{shipper_name}*,\n"
            f"Driver *{driver_name}* (📞 {driver_phone}) has picked up your *{weight} kg* cargo and is on route to the destination.\n\n"
            f"🛣️ *Route:* {route}\n"
            f"_Live GPS tracking is active in your Safar-Saathi dashboard. 🌾_"
        )
    elif l == "bho":
        return (
            f"🚚 *सफ़र-साथी: माल रवाना हो गइल*\n\n"
            f"प्रणाम *{shipper_name}* जी,\n"
            f"चालक *{driver_name}* (📞 {driver_phone}) रउआ के *{weight} kg* माल पिकअप कइ के गंतव्य खातिर निकल गइल बाड़न।\n\n"
            f"🛣️ *रूट:* {route}\n"
            f"_सफ़र-साथी ऐप में लाइव जीपीएस ट्रैकिंग देख सकत बानी। 🌾_"
        )
    elif l == "mr":
        return (
            f"🚚 *सफ़र-साथी: माल वाहतूक सुरू*\n\n"
            f"नमस्कार *{shipper_name}* जी,\n"
            f"चालक *{driver_name}* (📞 {driver_phone}) यांनी आपला *{weight} kg* माल पिकअप केला असून गंतव्यस्थानाकडे रवाना झाले आहेत.\n\n"
            f"🛣️ *मार्ग:* {route}\n"
            f"_थेट जीपीएस ट्रॅकिंग अ‍ॅपमध्ये सुरू आहे. 🌾_"
        )
    elif l == "bn":
        return (
            f"🚚 *সফর-সাথী: মালবাহী যাত্রা শুরু*\n\n"
            f"নমস্কার *{shipper_name}*,\n"
            f"চালক *{driver_name}* (📞 {driver_phone}) আপনার *{weight} kg* মাল তুলে গন্তব্যের উদ্দেশ্যে রওনা দিয়েছেন।\n\n"
            f"🛣️ *রুট:* {route}\n"
            f"_সফর-সাথী অ্যাপে লাইভ ট্র্যাকিং সক্রিয় রয়েছে। 🌾_"
        )
    elif l == "te":
        return (
            f"🚚 *సఫర్-సాథీ: సరుకు ప్రయాణం మొదలైంది*\n\n"
            f"నమస్కారం *{shipper_name}* గారు,\n"
            f"డ్రైవర్ *{driver_name}* (📞 {driver_phone}) మీ *{weight} kg* సరుకుతో బయలుదేరారు.\n\n"
            f"🛣️ *రూట్:* {route}\n"
            f"_లైవ్ ట్రాకింగ్ యాప్‌లో అందుబాటులో ఉంది. 🌾_"
        )
    elif l == "ta":
        return (
            f"🚚 *சஃபர்-சாதி: சரக்கு பயணம் தொடங்கியது*\n\n"
            f"வணக்கம் *{shipper_name}* அவர்களே,\n"
            f"ஓட்டுநர் *{driver_name}* (📞 {driver_phone}) உங்கள் *{weight} kg* சரக்கை ஏற்றுக்கொண்டு புறப்பட்டுவிட்டார்.\n\n"
            f"🛣️ *பாதை:* {route}\n"
            f"_நேரலை கண்காணிப்பு செயலியில் உள்ளது. 🌾_"
        )
    elif l == "gu":
        return (
            f"🚚 *સફર-સાથી: માલ રવાના થયો*\n\n"
            f"નમસ્તે *{shipper_name}*,\n"
            f"ડ્રાઇવર *{driver_name}* (📞 {driver_phone}) તમારો *{weight} kg* માલ લઈને નીકળી ગયા છે.\n\n"
            f"🛣️ *રૂટ:* {route}\n"
            f"_સફર-સાથી પર લાઈવ ટ્રેકિંગ ચાલુ છે. 🌾_"
        )
    elif l == "pa":
        return (
            f"🚚 *ਸਫ਼ਰ-ਸਾਥੀ: ਮਾਲ ਰਵਾਨਾ ਹੋ ਗਿਆ*\n\n"
            f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ *{shipper_name}* ਜੀ,\n"
            f"ਡਰਾਈਵਰ *{driver_name}* (📞 {driver_phone}) ਤੁਹਾਡਾ *{weight} kg* ਮਾਲ ਲੈ ਕੇ ਰਵਾਨਾ ਹੋ ਗਏ ਹਨ।\n\n"
            f"🛣️ *ਰੂਟ:* {route}\n"
            f"_ਲਾਈਵ ਟਰੈਕਿੰਗ ਐਪ ਵਿੱਚ ਚਾਲੂ ਹੈ। 🌾_"
        )
    else: # hi
        return (
            f"🚚 *सफ़र-साथी: माल यात्रा शुरू (Goods In Transit)*\n\n"
            f"नमस्ते *{shipper_name}* जी,\n"
            f"चालक *{driver_name}* (📞 {driver_phone}) द्वारा आपका *{weight} kg* माल पिकअप कर लिया गया है और गंतव्य मंडी की ओर रवाना हो चुका है।\n\n"
            f"🛣️ *रूट:* {route}\n"
            f"_सफ़र-साथी लाइव ट्रैकिंग सक्रिय है। 🌾_"
        )


# =========================================================================
# 12. CANCELLED BY DRIVER (To Shipper)
# =========================================================================
def msg_cancelled_by_driver_shipper(shipper_name: str, driver_name: str, weight: int, route: str, reason: str, lang: str = "hi") -> str:
    l = normalize_lang(lang)
    r_text = reason or "Capacity or schedule constraint"
    if l == "en":
        return (
            f"⚠️ *Safar-Saathi: Request Cancelled by Transporter*\n\n"
            f"Hello *{shipper_name}*,\n"
            f"Driver *{driver_name}* has cancelled your *{weight} kg* load request for [ {route} ].\n"
            f"Reason: {r_text}\n\n"
            f"_Please explore other available vehicles on Safar-Saathi._"
        )
    elif l == "bho":
        return (
            f"⚠️ *सफ़र-साथी: अनुरोध अस्वीकृत सूचना*\n\n"
            f"प्रणाम *{shipper_name}* जी,\n"
            f"चालक *{driver_name}* [ {route} ] खातिर रउआ के *{weight} kg* माल लोड अनुरोध रद्द कइ दिहले बाड़न।\n"
            f"कारण: {r_text}\n\n"
            f"_कृपया सफ़र-साथी ऐप पर दोसर गाड़ी खोजीं।_"
        )
    elif l == "mr":
        return (
            f"⚠️ *सफ़र-साथी: विनंती रद्द केली*\n\n"
            f"नमस्कार *{shipper_name}* जी,\n"
            f"चालक *{driver_name}* यांनी आपला *{weight} kg* माल अनुरोध रद्द केला आहे.\n"
            f"कारण: {r_text}\n\n"
            f"_कृपया सफ़र-साथी वर इतर उपलब्ध वाहने शोधा._"
        )
    else: # hi
        return (
            f"⚠️ *सफ़र-साथी: अनुरोध अस्वीकृत सूचना*\n\n"
            f"नमस्ते *{shipper_name}* जी,\n"
            f"चालक *{driver_name}* ने [ {route} ] के लिए आपका *{weight} kg* माल लोड अनुरोध अस्वीकार कर दिया है।\n"
            f"कारण: {r_text}\n\n"
            f"_कृपया सफ़र-साथी ऐप पर अन्य उपलब्ध वाहन बुक करें।_"
        )


# =========================================================================
# 13. CANCELLED BY SHIPPER (To Driver)
# =========================================================================
def msg_cancelled_by_shipper_driver(driver_name: str, shipper_name: str, weight: int, route: str, lang: str = "hi") -> str:
    l = normalize_lang(lang)
    if l == "en":
        return (
            f"⚠️ *Safar-Saathi: Booking Cancelled by Shipper*\n\n"
            f"Hello *{driver_name}*,\n"
            f"*{shipper_name}* has cancelled their *{weight} kg* booking on route [ {route} ].\n"
            f"_Your available vehicle capacity has been restored for other shippers._"
        )
    elif l == "bho":
        return (
            f"⚠️ *सफ़र-साथी: बुकिंग रद्द अलर्ट*\n\n"
            f"प्रणाम *{driver_name}* जी,\n"
            f"*{shipper_name}* [ {route} ] खातिर आपन *{weight} kg* माल बुकिंग रद्द कइ दिहले बाड़न।\n"
            f"_रउआ के गाड़ी के क्षमता फेर से उपलब्ध हो गइल बा।_"
        )
    elif l == "mr":
        return (
            f"⚠️ *सफ़र-साथी: बुकिंग रद्द*\n\n"
            f"नमस्कार *{driver_name}* जी,\n"
            f"*{shipper_name}* यांनी [ {route} ] वरील आपली *{weight} kg* बुकिंग रद्द केली आहे.\n"
            f"_आपली वाहन क्षमता इतर ग्राहकांसाठी उपलब्ध करण्यात आली आहे._"
        )
    else: # hi
        return (
            f"⚠️ *सफ़र-साथी: बुकिंग रद्द अलर्ट*\n\n"
            f"नमस्ते *{driver_name}* जी,\n"
            f"*{shipper_name}* ने [ {route} ] के लिए अपनी *{weight} kg* माल बुकिंग रद्द कर दी है।\n"
            f"_आपकी वाहन क्षमता अन्य ग्राहकों के लिए पुनः उपलब्ध कर दी गई है।_"
        )


# =========================================================================
# 28. CHECKPOINT INSPECTION PASSED (To Shipper & Driver)
# =========================================================================
def msg_checkpoint_verified(user_name: str, checkpoint_name: str, officer_name: str, condition: str, temp_c: float | None = None, lang: str = "hi") -> str:
    l = normalize_lang(lang)
    temp_str = f" | ❄️ Temp: {temp_c}°C" if temp_c is not None else ""
    if l == "en":
        return (
            f"🛡️ *Safar-Saathi: Checkpoint Inspection Passed*\n\n"
            f"Hello *{user_name}*,\n"
            f"Your transit shipment just completed an official quality inspection at *{checkpoint_name}*.\n\n"
            f"👮 *Inspected By:* Officer {officer_name}\n"
            f"📦 *Cargo Condition:* {condition}{temp_str}\n"
            f"🔒 *Security Seal:* Intact & Verified\n\n"
            f"_Ground logistics officers are actively monitoring your cargo to ensure safe delivery._"
        )
    else:  # hi
        return (
            f"🛡️ *सफ़र-साथी: चेकपॉइंट निरीक्षण सफल*\n\n"
            f"नमस्ते *{user_name}* जी,\n"
            f"आपके सामान का *{checkpoint_name}* पर आधिकारिक गुणवत्ता निरीक्षण सफलता पूर्वक पूरा हुआ।\n\n"
            f"👮 *निरीक्षक:* अधिकारी {officer_name}\n"
            f"📦 *सामान की स्थिति:* {condition}{temp_str}\n"
            f"🔒 *सुरक्षा सील:* सुरक्षित एवं सत्यापित\n\n"
            f"_सफ़र-साथी ग्राउंड लॉजिस्टिक्स टीम आपके सामान की निरंतर निगरानी कर रही है।_"
        )


# =========================================================================
# 29. COLD-CHAIN ICE REPLENISHED (To Perishable Shipper)
# =========================================================================
def msg_ice_replenished(shipper_name: str, commodity: str, ice_kg: float, ice_type: str, temp_c: float, lang: str = "hi") -> str:
    l = normalize_lang(lang)
    if l == "en":
        return (
            f"❄️ *Safar-Saathi: Cold-Chain Ice Replenished*\n\n"
            f"Hello *{shipper_name}*,\n"
            f"Cold-chain preservation service has topped up *{ice_kg} kg* of *{ice_type}* for your *{commodity}*.\n\n"
            f"🌡️ *Stabilized Temperature:* {temp_c}°C (Chilled & Fresh)\n"
            f"⏳ *Safe Window Extended:* ~6 to 8 hours\n\n"
            f"_Your perishable goods are protected against spoilage until destination arrival._"
        )
    else:  # hi
        return (
            f"❄️ *सफ़र-साथी: कोल्ड-चेन बर्फ पुनःपूर्ति सफल*\n\n"
            f"नमस्ते *{shipper_name}* जी,\n"
            f"आपके *{commodity}* के लिए ग्राउंड टीम द्वारा *{ice_kg} kg* *{ice_type}* डाली गई है।\n\n"
            f"🌡️ *स्थिर तापमान:* {temp_c}°C (ताजा एवं सुरक्षित)\n"
            f"⏳ *सुरक्षित समय:* आगामी 6 से 8 घंटे\n\n"
            f"_सफ़र-साथी कोल्ड-चेन टीम आपके सामान को खराब होने से सुरक्षित रख रही है।_"
        )
