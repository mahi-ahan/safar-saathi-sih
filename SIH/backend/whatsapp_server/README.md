# 💬 Safar-Saathi WhatsApp Dispatch Gateway Microservice

Automated background WhatsApp messaging microservice powered by Express.js and `whatsapp-web.js`.

---

## 🚀 Features

- **Free Background Messaging**: Sends 100% automated WhatsApp notifications with zero per-message cost.
- **Media Attachments**: Supports sending JPEG/PNG delivery proof images directly in WhatsApp chats.
- **Session Management**: Visual browser interface at `http://localhost:3001` showing active connection status and sender phone number.
- **One-Click Logout & Reset**: Endpoint `/logout` clears session authentication files to link a new phone number.
- **Two-Way Message Webhook**: Catches incoming WhatsApp replies from users or drivers and forwards them to the backend server (`http://127.0.0.1:8000/api/notifications/webhook`).

---

## 📡 API Endpoints

### 1. `GET /`
Visual status web page displaying QR login code, connection state, active sender phone number, and logout button.

### 2. `GET /status`
JSON status endpoint for automated health checks:
```json
{
  "status": "ready",
  "ready": true,
  "has_qr": false,
  "connected_number": "919876543210",
  "timestamp": "2026-08-31T00:45:00.000Z"
}
```

### 3. `POST /send-message`
Dispatches a queued WhatsApp message:
```json
{
  "phone": "919608959215",
  "message": "🌾 Safar-Saathi Booking Alert...",
  "media_path": "/path/to/delivery_proof.jpg"
}
```

### 4. `GET /logout`
Clears local `.wwebjs_auth` session directory and re-initializes client to generate a fresh QR code for scanning a new phone number.
