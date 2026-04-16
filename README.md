# 🌐 ConnectWorld — Random Video & Chat Platform

A full-stack real-time video chat app that connects you with random strangers
worldwide. Built with React, Vite, Node.js, Socket.io, and WebRTC (simple-peer).

---

## Features

| Feature | Description |
|---|---|
| 🔞 Age Verification | 18+ gate before entering |
| 🔑 Login | Display name, gender, country, city — or Google sign-in |
| 🎥 Live Video | Real WebRTC peer-to-peer video & audio |
| 💬 Text Chat | Real-time messaging during calls |
| ⚤ Gender Filter | Show: Both / Males / Females |
| 🚀 Start Connection | Match with a random stranger worldwide |
| ⏭ Skip | Skip to the next stranger instantly |
| + Add Friend | Save strangers to your friend list |
| 👥 Friends List | View & remove your friends |
| 🌍 History | Every past connection with timestamp & location |
| 📹 Camera/Mic Toggle | Mute/unmute anytime |
| 🟢 Live Counter | Real online user count from the server |

---

## Project Structure

```
connectworld/
├── server/
│   ├── server.js        ← Node.js + Socket.io signaling server
│   └── package.json
└── client/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        └── App.jsx      ← Full React + WebRTC app
```

---

## Quick Start

### 1. Start the signaling server

```bash
cd server
npm install
npm start
# Server runs on http://localhost:3001
```

For development with auto-restart:
```bash
npm run dev
```

### 2. Start the React client

```bash
cd client
npm install
npm run dev
# Client runs on http://localhost:5173
```

### 3. Open two tabs / two devices

- Open **http://localhost:5173** in two browser tabs
- Complete age verification and login in each
- Click **Start Connection** in both — they will match!

---

## How WebRTC Works (under the hood)

```
User A                     Server                    User B
  |                           |                         |
  |── find-stranger ─────────>|                         |
  |                           |<──── find-stranger ─────|
  |                           |                         |
  |<── matched (initiator) ───|──── matched (receiver) >|
  |                           |                         |
  |── signal (offer) ────────>|──── signal (offer) ────>|
  |<── signal (answer) ───────|<─── signal (answer) ────|
  |── signal (ICE) ──────────>|──── signal (ICE) ───────|
  |                           |                         |
  |<════════════ Direct P2P Video Stream ═══════════════|
```

---

## Production Deployment

### TURN Server (Required for users behind strict NAT/firewalls)

Free STUN servers work for most users, but for production you need a TURN server.
Options:
- **Twilio TURN** (paid, easy) — https://www.twilio.com/stun-turn
- **coturn** (free, self-hosted) — https://github.com/coturn/coturn
- **Metered TURN** (free tier) — https://www.metered.ca/tools/openrelay

Add your TURN credentials in `client/src/App.jsx`:
```js
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com',
      username: 'your-username',
      credential: 'your-password',
    },
  ],
};
```

### Deploy the server

The server can be deployed to any Node.js host:
- **Railway** — `railway up` in the server folder
- **Render** — connect your GitHub repo
- **Heroku** — `git push heroku main`
- **VPS** — run with `pm2 start server.js`

Update `SERVER_URL` in `client/src/App.jsx` to point to your deployed server.

### Deploy the client

```bash
cd client
npm run build
# Deploy the dist/ folder to Vercel, Netlify, or any static host
```

---

## Browser Support

Chrome, Edge, Firefox, Safari 14+ (all support WebRTC).
> Note: WebRTC requires HTTPS in production (localhost is exempt).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| WebRTC | simple-peer (wrapper around browser WebRTC) |
| Real-time | Socket.io client |
| Backend | Node.js + Express |
| Signaling | Socket.io server |
| Styling | Inline CSS with CSS variables |
