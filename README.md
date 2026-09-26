# 🌾 Safar-Saathi (सफ़र-साथी)
### AI-Powered Dynamic Logistics Pooling & Rural Mandi Transport Platform
**Smart India Hackathon (SIH)**

---

## 📖 Overview
**Safar-Saathi** is an intelligent logistics and freight-sharing ecosystem designed for farmers, rural traders, and truck drivers. It enables dynamic partial-load (PTL) sharing along intercity highway corridors, cutting freight costs by up to **60%** while maximizing transporter vehicle capacity utilization.

---

## ✨ Key Features
- **⚖️ Dynamic Ton-Km Cost Pooling**: Fair, proportional cost-sharing based on cargo weight (kg) × travel distance (km).
- **📉 Real-time Price Drop Alerts**: When new shippers join an existing route, earlier shippers automatically receive WhatsApp price drop notifications with their updated lower fare and savings.
- **📸 2-Stage Mandatory Image Proof Verification**:
  - **Stage 1**: Mandatory Cargo Photo verification on booking.
  - **Stage 2**: Transporter Drop-off Delivery Proof Photo verification before completing the ride.
- **💬 Unlimited WhatsApp Notification Gateway**: Local microservice delivering native photo attachments and status updates directly to users' phones in **13 Indian languages** (Hindi, English, Bhojpuri, Marathi, Bengali, Urdu, Telugu, Tamil, Kannada, Malayalam, Odia, Punjabi, Gujarati).
- **🗺️ Live GPS Radar & Highway Corridor Validation**: Real-time road tracking with automatic tortuosity curvature computation.

---

## 🚀 Quick Start Guide (3-Terminal Setup)

Follow these steps to run the complete platform on your local machine:

### 1️⃣ Terminal 1: FastAPI Backend (Port 8000)
```bash
# Navigate to the backend directory
cd SIH/backend

# Optional: Create and activate virtual environment
# python -m venv .venv
# .venv\Scripts\activate   # Windows
# source .venv/bin/activate # Mac/Linux

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload
```
- **API Docs & Swagger**: [`http://localhost:8000/docs`](http://localhost:8000/docs)

---

### 2️⃣ Terminal 2: WhatsApp Dispatch Gateway (Port 3001)
```bash
# Navigate to the WhatsApp Gateway directory
cd SIH/backend/whatsapp_server

# Install Node.js dependencies
npm install

# Start the WhatsApp Gateway
npm start
```
- **Linking a Sender Phone Number**:
  1. Open [`http://localhost:3001`](http://localhost:3001) in your browser.
  2. On your phone, open **WhatsApp → Linked Devices → Link a Device**.
  3. Scan the QR code displayed on the screen.
  4. Once linked, the status page will display: `📱 Connected Sender: +91XXXXXXXXXX`.
- **Changing / Resetting Sender Number**:
  - To switch to a different sender WhatsApp number at any time, click **"🔄 Change Sender Number / Scan New QR"** on [`http://localhost:3001`](http://localhost:3001) (or visit [`http://localhost:3001/logout`](http://localhost:3001/logout)).
  - Scan the fresh QR code with your new WhatsApp phone number.
- **Two-Way Messaging & Webhooks**:
  - **Outbound**: Automatically dispatches localized booking, acceptance, price-drop, and delivery photo proof alerts to driver and shipper phone numbers.
  - **Inbound**: Listens for incoming WhatsApp replies from users/drivers and forwards them to the backend webhook (`POST /api/notifications/webhook`).

---

### 3️⃣ Terminal 3: React Frontend (Port 5173)
```bash
# Navigate to the React frontend directory
cd SIH/safar-saathi

# Install Node.js dependencies
npm install

# Start the Vite development server
npm run dev
```
- **Web Application**: [`http://localhost:5173`](http://localhost:5173)

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, TailwindCSS, Lucide React, HTML5 Web Speech API
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, SQLite, Pydantic
- **WhatsApp Gateway**: Node.js, Express, `whatsapp-web.js`, `qrcode-terminal`
- **Geolocation & Mapping**: OpenStreetMap (OSRM API), Haversine Formula with Highway Tortuosity Multiplier

---

## 👥 Roles & Workflows
1. **Sender / Farmer Hub**:
   - Browse active trucks or search by state/corridor.
   - Enter pickup/delivery hubs and upload cargo proof.
   - Monitor real-time dynamic fare reductions as co-shippers join.
   - Review driver's uploaded delivery photo and rate the service upon arrival.
2. **Transporter / Driver Hub**:
   - Publish vehicle capacity, route, and full load rate.
   - Accept incoming cargo requests.
   - Broadcast live GPS route tracking.
   - Upload Stage 2 delivery proof photo at drop-off to finalize the ride.

---

## 📄 License
Developed for the Smart India Hackathon (SIH). All rights reserved.
