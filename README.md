# MeetUp AI — Real-Time Video Meetings with Live AI Moderation

A full-stack video conferencing application that combines **peer-to-peer WebRTC** calls with **multi-modal AI moderation** (text, speech, video frames, and profile images). Built for live classrooms and meetings where harmful content should be detected and logged in real time.

**Live demo (typical setup)**

| Layer | Hosting |
|--------|---------|
| Frontend | [Vercel](https://vercel.com) — React + Vite |
| Backend | [Render](https://render.com) — Node.js, Express, Socket.IO |
| AI service | Local Python (FastAPI) exposed via **ngrok** during development/demos |
| Database | MongoDB |
| Media snapshots | Cloudinary |

---

## What this project does

- **Video meetings** — 4-digit room codes, host/participant roles, mic/camera toggles, optional screen share, participant list and chat.
- **WebRTC** — Browser-to-browser media with Socket.IO signaling and TURN/STUN for NAT traversal.
- **AI moderation (toggle on/off in meeting)**
  - **Chat** — Toxicity / hate / threat detection (ensemble of transformer models).
  - **Live audio** — Whisper transcription + text moderation on speech.
  - **Video frames** — Weapon detection (YOLO), nudity (NudeNet), NSFW classifier, gesture (middle finger), OCR + text check on on-screen text.
  - **Profile image** — Scan avatar when AI is enabled.
- **Persistence** — Flagged chat, audio transcripts, and video events stored in MongoDB; harmful video frames uploaded to Cloudinary.
- **Real-time alerts** — Moderation warnings broadcast to everyone in the room via Socket.IO.

---

## Architecture

```
Browser (Vercel)
    │  REST + WebSocket
    ▼
Node backend (Render) ──► MongoDB
    │
    │  (chat uses AI for scoring only; saves ChatMessage + AiEvent on Node)
    │
Browser ──► ngrok ──► FastAPI AI (local: Whisper, YOLO, RoBERTa, etc.)
                │
                └──► POST results back to Render (/api/moderation/save-*)
```

**Why AI runs locally + ngrok:** The ML stack (Whisper medium, YOLO, multiple Hugging Face models) is too heavy for a small free Render instance. The production frontend calls your tunneled AI URL; the AI service then writes moderation results to the cloud backend.

---

## Repository structure

```
call/
├── online-meeting-app-frontend/   # React, Vite, WebRTC client
├── online-meeting-app-backend/    # Express, Socket.IO, MongoDB models
├── AI/                            # FastAPI moderation service
├── .vscode/                       # Python interpreter (local venv)
└── README.md                      # This file
```

---

## Tech stack

| Area | Technologies |
|------|----------------|
| Frontend | React 19, Vite, Tailwind CSS, Firebase Auth, Socket.IO client, WebRTC |
| Backend | Node.js, Express, Socket.IO, Mongoose, Cloudinary |
| AI | Python 3, FastAPI, Uvicorn, faster-whisper, Ultralytics YOLO, NudeNet, Hugging Face transformers, MediaPipe, EasyOCR |
| DevOps | Vercel, Render, ngrok |

---

## Environment variables

### Frontend (`online-meeting-app-frontend/.env`)

```env
VITE_BACKEND_URL=https://your-backend.onrender.com
VITE_AI_URL=https://your-subdomain.ngrok-free.app
```

Set the same values in the **Vercel** project settings for production builds.

### Backend (`online-meeting-app-backend/.env`)

```env
PORT=5000
MONGO_URI=mongodb+srv://...
CLOUD_NAME=...
API_KEY=...
API_SECRET=...
AI_URL=https://your-subdomain.ngrok-free.app
```

On **Render**, set `MONGO_URI` to your Atlas cluster (not `localhost`).

### AI (`AI/.env`)

```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## Local development — startup order

Run these in separate terminals. Order matters when testing **production-like** moderation (Vercel/Render + local AI).

1. **MongoDB** — Local `mongod` or MongoDB Atlas (backend must reach it).
2. **Backend**
   ```powershell
   cd online-meeting-app-backend
   npm install
   npm start
   ```
   Default: `http://localhost:5000`

3. **Python virtual environment** (example path; adjust to your machine)
   ```powershell
   cd AI
   # Activate venv, e.g. call_local\jape\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

4. **ngrok** (from repo root, with AI already on port 8000)
   ```powershell
   .\ngrok.exe http 8000
   ```
   Copy the **HTTPS forwarding URL** from the ngrok console.

5. **Update URLs** after every ngrok restart (free tunnels change each session):
   - `online-meeting-app-frontend/.env` → `VITE_AI_URL`
   - `online-meeting-app-backend/.env` → `AI_URL` (if socket uses env)
   - Vercel dashboard → same `VITE_*` vars, then redeploy

6. **Frontend**
   ```powershell
   cd online-meeting-app-frontend
   npm install
   npm run dev
   ```
   Default: `http://localhost:5173` (uses localhost backend in dev mode).

**Health checks**

- AI: `http://127.0.0.1:8000/health`
- Backend: meeting create/join APIs on port 5000

---

## Production deployment notes

1. Deploy **backend** to Render; set `MONGO_URI` and Cloudinary vars.
2. Deploy **frontend** to Vercel; set `VITE_BACKEND_URL` and `VITE_AI_URL`.
3. Keep **uvicorn + ngrok running** on a machine you control if the live site should moderate content (otherwise chat/video AI calls will fail).
4. For a fully cloud AI service, deploy `AI/` to a GPU-capable host (Railway, Fly.io, AWS, etc.) and point `VITE_AI_URL` to that URL instead of ngrok.

---

## Data model (moderation)

| Collection | Purpose |
|------------|---------|
| `chatmessages` | Chat text + AI label/score + flagged flag |
| `aievents` | Toxic chat warnings |
| `audiotranscripts` | **Speech only** (from live audio pipeline) |
| `videoevents` | Harmful frame metadata + Cloudinary snapshot URL |
| `images` | Flagged profile images |

Chat messages are **not** duplicated into `audiotranscripts` (audio collection is for Whisper transcripts only).

---

## Meeting lifecycle

- Creating a meeting sets `active: true`.
- When the last participant disconnects, the backend sets `active: false`.
- **Join API** returns `410` if the meeting has ended; the UI shows “This meeting has ended.”
- Socket `join-room` emits `meeting-ended` for inactive rooms.

---

## Highlights for reviewers

- End-to-end **real-time** system: WebRTC + WebSockets + REST + separate ML microservice.
- **Multi-modal ML pipeline** with buffering, cooldowns, and cloud snapshot storage.
- **Split deployment** (Vercel / Render / tunneled AI) with clear env-based configuration.
- Recent hardening: inactive-meeting guard, single persistence path for chat, Cloudinary video event pipeline.

---

## License

Add your license here if open-sourcing.

## Author

Your name / portfolio link — update this section for recruiters.
