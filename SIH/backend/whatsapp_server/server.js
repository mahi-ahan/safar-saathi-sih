const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const PORT = process.env.WHATSAPP_SERVER_PORT || 3001;

let isReady = false;
let lastQr = null;
let initError = null;
let client = null;

console.log('====================================================');
console.log('🌾 SAFAR-SAATHI UNLIMITED WHATSAPP DISPATCH GATEWAY');
console.log('====================================================');

// Start Express server immediately so port 3001 is active right away
app.listen(PORT, () => {
  console.log(`✅ [WhatsApp Server] Web Server running at http://localhost:${PORT}`);
  console.log(`👉 Open http://localhost:${PORT} in your browser to scan the visual QR code!`);
});

// Visual Web QR & Status Page (Open http://localhost:3001 in browser)
app.get('/', (req, res) => {
  if (isReady) {
    const connectedNum = (client && client.info && client.info.wid) ? client.info.wid.user : 'Unknown';
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Safar-Saathi WhatsApp Server</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #f0fdf4; color: #166534; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); text-align: center; max-width: 420px; border: 2px solid #bbf7d0; }
          .icon { font-size: 56px; margin-bottom: 12px; }
          h1 { font-size: 22px; margin: 0 0 8px; color: #14532d; }
          p { font-size: 14px; color: #15803d; line-height: 1.5; margin: 0 0 12px; }
          .num-box { background: #dcfce7; padding: 8px 16px; border-radius: 12px; font-weight: bold; font-size: 15px; color: #14532d; margin-bottom: 16px; display: inline-block; }
          .badge { display: inline-block; background: #22c55e; color: white; padding: 4px 14px; border-radius: 99px; font-size: 12px; font-weight: bold; }
          .btn-logout { display: block; margin-top: 20px; background: #ef4444; color: white; text-decoration: none; padding: 10px 18px; border-radius: 12px; font-size: 13px; font-weight: bold; }
          .btn-logout:hover { background: #dc2626; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✅</div>
          <h1>WhatsApp Gateway Active</h1>
          <p>Safar-Saathi is connected to WhatsApp and delivering automated alerts!</p>
          <div class="num-box">📱 Connected Sender: +${connectedNum}</div><br/>
          <div class="badge">100% Online & Ready</div>
          <a href="/logout" class="btn-logout" onclick="return confirm('Disconnect this WhatsApp number and scan a new QR code?')">🔄 Change Sender Number / Scan New QR</a>
        </div>
      </body>
      </html>
    `);
  }

  if (initError) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Safar-Saathi WhatsApp Server Error</title></head>
      <body style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h2 style="color: #b91c1c;">Initialization Notice</h2>
        <p>${initError}</p>
        <p>Retrying connection automatically...</p>
      </body>
      </html>
    `);
  }

  if (!lastQr) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Safar-Saathi WhatsApp Server</title>
        <meta http-equiv="refresh" content="3">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fafaf9; }
          .card { background: white; padding: 32px; border-radius: 20px; text-align: center; border: 1px solid #e7e5e4; }
        </style>
      </head>
      <body>
        <div class="card">
          <p style="font-size: 16px; font-weight: bold; color: #1c1917;">Initializing WhatsApp Gateway...</p>
          <p style="font-size: 13px; color: #78716c;">Auto-refreshing in 3 seconds to fetch QR code...</p>
        </div>
      </body>
      </html>
    `);
  }

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(lastQr)}`;
  return res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Safar-Saathi WhatsApp QR Login</title>
      <meta http-equiv="refresh" content="15">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #fafaf9; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
        .card { background: white; padding: 36px; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); text-align: center; max-width: 440px; border: 1px solid #e7e5e4; }
        h1 { font-size: 20px; color: #064e3b; margin: 0 0 6px; }
        p { font-size: 13px; color: #57534e; margin: 0 0 20px; line-height: 1.4; }
        .qr-box { background: #f0fdf4; border: 3px solid #22c55e; border-radius: 16px; padding: 12px; display: inline-block; }
        .steps { text-align: left; background: #f5f5f4; border-radius: 12px; padding: 14px 18px; margin-top: 20px; font-size: 12px; color: #44403c; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🌾 Safar-Saathi WhatsApp Gateway</h1>
        <p>Scan this QR code with WhatsApp on your phone to activate unlimited automated background messaging:</p>
        <div class="qr-box">
          <img src="${qrImageUrl}" alt="Scan QR Code" style="width: 260px; height: 260px; display: block;" />
        </div>
        <div class="steps">
          <b>How to scan:</b><br/>
          1. Open <b>WhatsApp</b> on your phone.<br/>
          2. Tap <b>Settings</b> or <b>⋮</b> ➔ <b>Linked Devices</b>.<br/>
          3. Tap <b>Link a Device</b> and point your camera at this QR code.
        </div>
      </div>
    </body>
    </html>
  `);
});

// Status API
app.get('/status', (req, res) => {
  res.json({
    status: isReady ? 'ready' : (lastQr ? 'qr_ready' : 'initializing'),
    ready: isReady,
    has_qr: !!lastQr,
    connected_number: (client && client.info && client.info.wid) ? client.info.wid.user : null,
    timestamp: new Date().toISOString()
  });
});

// Logout / Reset session endpoint to change sender WhatsApp number
app.get('/logout', async (req, res) => {
  isReady = false;
  lastQr = null;
  console.log('🔄 [WhatsApp Gateway] Logging out and resetting session...');
  
  if (client) {
    try {
      await client.logout();
    } catch (e) {
      try { await client.destroy(); } catch (err) {}
    }
    client = null;
  }

  const authDir = path.join(__dirname, '.wwebjs_auth');
  if (fs.existsSync(authDir)) {
    try {
      fs.rmSync(authDir, { recursive: true, force: true });
      console.log('🧹 [WhatsApp Gateway] Cleared session authentication files.');
    } catch (err) {
      console.log('Notice removing auth dir:', err.message);
    }
  }

  setTimeout(() => {
    startWhatsAppClient();
  }, 1000);

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Resetting WhatsApp Gateway</title>
      <meta http-equiv="refresh" content="4;url=/">
      <style>
        body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fafaf9; }
        .card { background: white; padding: 32px; border-radius: 20px; text-align: center; border: 1px solid #e7e5e4; max-width: 400px; }
      </style>
    </head>
    <body>
      <div class="card">
        <p style="font-size: 18px; font-weight: bold; color: #1c1917;">Logged Out Successfully!</p>
        <p style="font-size: 13px; color: #57534e;">Generating a new QR code for your new WhatsApp phone number... Redirecting in 4 seconds...</p>
      </div>
    </body>
    </html>
  `);
});

// Message Queue to prevent race conditions when multiple messages are dispatched simultaneously
const messageQueue = [];
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue || messageQueue.length === 0) return;
  isProcessingQueue = true;

  while (messageQueue.length > 0) {
    const item = messageQueue.shift();
    try {
      console.log(`[WhatsApp Gateway] Dispatching queued message to ${item.cleanDigits}...`);
      
      let targetId = `${item.cleanDigits}@c.us`;
      
      // Check if target is the logged-in client itself (Message to self)
      if (client && client.info && client.info.wid) {
        const myDigits = client.info.wid.user;
        if (myDigits === item.cleanDigits || item.cleanDigits.endsWith(myDigits) || myDigits.endsWith(item.cleanDigits)) {
          targetId = client.info.wid._serialized;
          console.log(`[WhatsApp Gateway] Detected self-message, routing to ${targetId}`);
        }
      }

      // Try getNumberId resolution if not sending to self
      if (targetId.endsWith('@c.us') && (!client.info || !targetId.includes(client.info.wid?.user))) {
        try {
          const numberInfo = await client.getNumberId(item.cleanDigits);
          if (numberInfo && numberInfo._serialized) {
            targetId = numberInfo._serialized;
          }
        } catch (e) {
          console.log(`[WhatsApp Gateway] getNumberId notice: ${e.message}`);
        }
      }

      let mediaToSend = null;
      if (item.media_path && fs.existsSync(item.media_path)) {
        try {
          mediaToSend = MessageMedia.fromFilePath(item.media_path);
        } catch (mediaErr) {
          console.log(`[WhatsApp Gateway] Notice loading media from file: ${mediaErr.message}`);
        }
      } else if (item.media_base64) {
        try {
          mediaToSend = new MessageMedia(item.media_mimetype || 'image/jpeg', item.media_base64, 'delivery_proof.jpg');
        } catch (mediaErr) {
          console.log(`[WhatsApp Gateway] Notice building media from base64: ${mediaErr.message}`);
        }
      }

      let sentMsg;
      try {
        if (mediaToSend) {
          sentMsg = await client.sendMessage(targetId, mediaToSend, { caption: item.message });
        } else {
          sentMsg = await client.sendMessage(targetId, item.message);
        }
      } catch (sendErr) {
        console.log(`[WhatsApp Gateway] Primary send error: ${sendErr.message}. Attempting fallback...`);
        try {
          const chat = await client.getChatById(targetId);
          if (chat) {
            if (mediaToSend) {
              sentMsg = await chat.sendMessage(mediaToSend, { caption: item.message });
            } else {
              sentMsg = await chat.sendMessage(item.message);
            }
          }
        } catch (chatErr) {
          console.log(`[WhatsApp Gateway] Fallback getChatById error: ${chatErr.message}`);
        }
        
        // If still failing, try alternative format without country code or with raw digits
        if (!sentMsg) {
          try {
            const rawChatId = `${item.cleanDigits}@c.us`;
            if (mediaToSend) {
              sentMsg = await client.sendMessage(rawChatId, mediaToSend, { caption: item.message });
            } else {
              sentMsg = await client.sendMessage(rawChatId, item.message);
            }
          } catch (rawErr) {
            console.log(`[WhatsApp Gateway] Raw send error: ${rawErr.message}`);
          }
        }

        if (!sentMsg) throw sendErr;
      }

      const msgId = (sentMsg && sentMsg.id) ? (sentMsg.id._serialized || sentMsg.id.id || 'sent') : 'sent';
      console.log(`✔ [WhatsApp Gateway] Message ${mediaToSend ? 'with photo ' : ''}delivered successfully to ${targetId} (ID: ${msgId})`);
      item.resolve({ success: true, message_id: msgId, recipient: targetId, has_media: !!mediaToSend });
    } catch (err) {
      console.error(`❌ [WhatsApp Gateway] Error delivering message:`, err.message || err);
      item.reject(err);
    }
    // 750ms breathing room between messages so WhatsApp Web DOM settles cleanly
    await new Promise(r => setTimeout(r, 750));
  }

  isProcessingQueue = false;
}

// Send message endpoint (Thread-Safe & Queued)
app.post('/send-message', async (req, res) => {
  const { phone, message, media_path, media_base64, media_mimetype } = req.body;

  if (!phone || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing phone or message parameter.'
    });
  }

  if (!isReady || !client) {
    return res.status(503).json({
      success: false,
      error: 'WhatsApp Gateway is not connected yet. Please scan the QR code at http://localhost:3001.'
    });
  }

  try {
    let cleanDigits = String(phone).replace(/\D/g, '');
    if (cleanDigits.length === 10) {
      cleanDigits = `91${cleanDigits}`;
    } else if (cleanDigits.length > 10 && !cleanDigits.startsWith('91')) {
      cleanDigits = `91${cleanDigits.slice(-10)}`;
    }

    const result = await new Promise((resolve, reject) => {
      messageQueue.push({ cleanDigits, message, media_path, media_base64, media_mimetype, resolve, reject });
      processQueue();
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to send WhatsApp message'
    });
  }
});

// Initialize WhatsApp client with auto-reconnect
let isStarting = false;

async function startWhatsAppClient() {
  if (isStarting) return;
  isStarting = true;

  if (client) {
    try {
      console.log('[WhatsApp Gateway] Cleaning up previous client session...');
      await client.destroy();
    } catch (e) {
      console.log('[WhatsApp Gateway] Error destroying client:', e.message);
    }
    client = null;
  }

  try {
    client = new Client({
      authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });

    client.on('qr', (qr) => {
      lastQr = qr;
      console.log('\n[WhatsApp Gateway] Scan the QR code at http://localhost:3001 in your browser:');
      qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
      isReady = true;
      lastQr = null;
      initError = null;
      console.log('✅ [WhatsApp Gateway] CLIENT IS READY & CONNECTED!');
    });

    client.on('authenticated', () => {
      console.log('🔐 [WhatsApp Gateway] Authentication Successful!');
    });

    client.on('auth_failure', (msg) => {
      console.error('❌ [WhatsApp Gateway] Authentication Failure:', msg);
    });

    client.on('message', async (msg) => {
      try {
        const fromNum = msg.from ? msg.from.replace('@c.us', '') : 'Unknown';
        console.log(`📩 [WhatsApp Gateway] Incoming message from ${fromNum}: "${msg.body}"`);
        
        // Forward incoming message to backend webhook if configured
        try {
          const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
          await fetch('http://127.0.0.1:8000/api/notifications/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: fromNum, body: msg.body, timestamp: msg.timestamp })
          });
        } catch (webhookErr) {
          // Backend webhook notice silently logged
        }
      } catch (err) {
        console.log(`[WhatsApp Gateway] Notice processing incoming message: ${err.message}`);
      }
    });

    client.on('disconnected', async (reason) => {
      isReady = false;
      lastQr = null;
      console.log('⚠️ [WhatsApp Gateway] Disconnected:', reason);
      isStarting = false;
      setTimeout(startWhatsAppClient, 5000);
    });

    await client.initialize();
  } catch (err) {
    console.error('WhatsApp Web init error, retrying in 5s:', err.message);
    initError = String(err);
    if (client) {
      try { await client.destroy(); } catch (e) {}
      client = null;
    }
    isStarting = false;
    setTimeout(startWhatsAppClient, 5000);
  } finally {
    isStarting = false;
  }
}

startWhatsAppClient();
