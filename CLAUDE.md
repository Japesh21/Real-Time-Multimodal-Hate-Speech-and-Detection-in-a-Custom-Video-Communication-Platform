# CLAUDE.md — Project Context for AI Assistants

## What this project is

**MeetUp AI** — a real-time video conferencing platform with live multimodal AI moderation.
Built as a research project for ICETCI 2026 (Paper ID #1571268849):
"Real-Time Multimodal Hate Speech and Cyberbullying Detection in a Custom Video Communication Platform"

The system detects harmful content across 4 modalities simultaneously during live video calls:
- **Text** (chat messages)
- **Audio** (live speech via Whisper transcription)
- **Video frames** (weapons, nudity, gestures, OCR text, facial emotion)
- **Profile images** (avatar scan when AI is enabled)

---

## Repository structure

```
call/
├── online-meeting-app-frontend/   # React 19 + Vite + WebRTC client (deployed on Vercel)
├── online-meeting-app-backend/    # Node.js + Express + Socket.IO + MongoDB (deployed on Render)
├── AI/                            # Python FastAPI AI moderation microservice (runs locally via ngrok)
│   ├── services/
│   │   ├── text_analysis.py       # Ensemble toxicity classifier (4 models)
│   │   ├── audio_analysis.py      # faster-whisper → transcribe → analyze_text()
│   │   ├── video_analysis.py      # YOLO + NudeNet + NSFW + MediaPipe + EasyOCR + FER
│   │   ├── image_analysis.py      # Profile image moderation
│   │   └── fusion_engine.py       # Alert-count aggregator → risk level (low/medium/high/critical)
│   ├── api/
│   │   └── moderation_api.py      # FastAPI routes: /moderate/text, /moderate/audio, /moderate/image
│   └── main.py                    # FastAPI app entry point
├── eval/                          # Evaluation scripts for the paper (Phase 1)
│   ├── run_text_eval.py           # Evaluates text ensemble on Jigsaw (300 samples)
│   ├── run_audio_eval.py          # Evaluates audio pipeline on TTS-synthesized audio (300 samples)
│   ├── run_emotion_eval.py        # Evaluates FER on FER2013 images (350 samples, 50/class × 7)
│   ├── run_fusion_eval.py         # Ablation study: majority-vote fusion across modalities
│   └── synthesize_audio.py        # Generates audio/sample_N.mp3 from Jigsaw CSV via TTS
├── results/                       # CSV outputs from eval scripts (used in Table II of the paper)
│   ├── text_preds.csv
│   ├── audio_preds.csv
│   ├── emotion_preds.csv
│   └── fusion_preds.csv
├── data/
│   └── audio_labels.csv           # 300-row Jigsaw sample (id, comment_text, toxic)
└── .gitignore                     # Excludes: data/audio/ (mp3s), data/fer2013_sample/ (121MB images)
```

---

## AI modalities — how each works

### Text (chat)
- **Models:** Cardiff NLP RoBERTa + HateBERT + Unitary Toxic-BERT + BiLSTM (ensemble of 4)
- **Decision:** majority vote (≥ 2 of 4 flag as harmful)
- **File:** `AI/services/text_analysis.py` → `analyze_text(text)`
- **Returns:** `{ is_harmful, prediction, confidence }`

### Audio (live speech)
- **Pipeline:** faster-whisper medium → transcribe WAV → `analyze_text()` on transcript
- **File:** `AI/services/audio_analysis.py` → `analyze_audio(wav_path)`
- **Note:** No existing toxic-speech audio corpus exists, so eval uses TTS-synthesized audio from Jigsaw labels

### Video frames
- **Step 1:** YOLOv8n — weapon detection (knife, scissors, baseball bat, fork); threshold 0.35
- **Step 2:** NudeNet — nudity detection; threshold 0.35
- **Step 3:** Falconsai NSFW classifier; threshold 0.80
- **Step 4:** MediaPipe hand landmarker — middle finger gesture; MIDDLE_CONFIRM_FRAMES = 1
- **Step 5:** EasyOCR → extract text → `analyze_text()` (runs every 5th frame per user)
- **Step 6:** FER (mtcnn=False) — emotion detection; angry/disgust ≥ 0.45 = harmful
- **Alert trigger:** `is_harmful = len(reasons) > 0` — ANY single detection fires alert
- **File:** `AI/services/video_analysis.py` → `analyze_frame(image_path, meeting_code, user_name, user_uid)`

### Fusion (backend-only, does NOT affect alerts)
- **Purpose:** Aggregate all past alerts per meeting → compute risk level → store in MongoDB
- **Logic:** counts text/audio/video/emotion alerts; 0=low, 1-2=medium, 3-5=high, 6+=critical
- **Stored in:** `Meeting.analytics.fusion` (updated after every alert save)
- **File:** `AI/services/fusion_engine.py` → `fuse(text_alerts, audio_alerts, video_alerts, emotion_alerts)`
- **Key point:** fusion NEVER blocks alerts, NEVER touches the frontend — admin/DB view only

---

## MongoDB collections

| Collection | Purpose |
|---|---|
| `meetings` | Room info + `analytics.fusion` (risk level per meeting) |
| `chatmessages` | Chat text + AI label/score |
| `aievents` | Toxic chat event records |
| `audiotranscripts` | Whisper transcripts (flagged=true if toxic) |
| `videoevents` | Harmful frame metadata + emotion fields + Cloudinary snapshot URL |
| `images` | Flagged profile images |

### VideoEvent fields (key ones added recently)
- `emotion` — top detected emotion string (e.g. "angry")
- `emotionScore` — confidence 0–1
- `emotionHarmful` — boolean
- `fusionVotes` — unused now (fusion runs server-side)
- `type` enum includes: weapon, ocr, nudity, nsfw, middle_finger, emotion, both, multiple

### Meeting.analytics.fusion fields
- `textAlerts`, `audioAlerts`, `videoAlerts`, `emotionAlerts`, `totalAlerts`
- `riskLevel` — "low" | "medium" | "high" | "critical"
- `riskSummary` — e.g. "3 text + 1 video + 1 emotion"
- `lastUpdated` — Date

---

## Paper evaluation datasets

| Modality | Dataset | Samples used | Split |
|---|---|---|---|
| Text + Audio | Jigsaw Toxic Comments | 300 (random_state=42) | Evaluation only, no train/test split |
| Emotion | FER2013 | 350 (50/class × 7 classes) | Evaluation only |
| All models | Pretrained only | — | Zero fine-tuning |

**Audio eval note:** Audio samples are TTS-synthesized from Jigsaw comments (no real toxic-speech corpus exists). Generated by `eval/synthesize_audio.py`, stored in `data/audio/` (gitignored, 300 mp3 files).

**FER2013 note:** Images are in `data/fer2013_sample/<emotion>/` (gitignored, 121MB, 28k images). Download separately.

---

## Paper eval results (Table II — Ablation Study)

| Modality | Accuracy | Precision (harmful) | Recall (harmful) | F1 (harmful) |
|---|---|---|---|---|
| Text-only | 0.9833 | 0.9286 | 0.8966 | 0.9123 |
| Audio-only | 0.9700 | 0.7778 | 0.9655 | 0.8615 |
| Emotion-only (FER2013 standalone) | 0.8114 | 0.8036 | 0.4500 | 0.5769 |
| Multimodal fusion (majority vote) | 0.9833 | 0.9000 | 0.9310 | 0.9153 |

---

## Key design decisions

1. **Any single detection = alert** — no majority vote required for frontend warning. Fusion is separate.
2. **FER confidence threshold = 0.45** — only angry/disgust above 45% triggers emotion alert.
3. **OCR runs every 5th frame** per user (performance optimization).
4. **Cooldown = 30 seconds** — same detection for same user saved max once per 30s.
5. **Fusion runs after every save** — `updateFusionRisk(meetingCode)` in server.js queries all past alerts and updates Meeting doc.
6. **Audio is text-based under the hood** — Whisper transcribes speech, then the same text ensemble runs on the transcript.

---

## Deployment

| Layer | Where |
|---|---|
| Frontend | Vercel — React + Vite |
| Backend | Render — Node.js (`https://meeting-backend-v3xj.onrender.com`) |
| AI service | Local Python (FastAPI on port 8000) + ngrok tunnel |
| Database | MongoDB Atlas |
| Media snapshots | Cloudinary |

**Why AI runs locally:** The ML stack (Whisper medium, YOLO, 3× HuggingFace models, FER, NudeNet, EasyOCR) is too heavy for a free Render instance. ngrok tunnels the local FastAPI to the cloud frontend.

---

## Python venv location

```
c:\Users\japes\Desktop\call_local\jape\Scripts\python.exe
```

Run eval scripts from project root:
```powershell
& "c:\Users\japes\Desktop\call_local\jape\Scripts\python.exe" eval/run_text_eval.py
```

---

## Paper revision phases (status)

- **Phase 1** (eval + code) — COMPLETE. All 4 CSV result files generated.
- **Phase 2** (new writing) — PENDING. Needs paper .docx/.tex file.
- **Phase 3** (restructure existing writing) — PENDING. Needs paper file.
- **Phase 4** (formatting/references) — PENDING. IEEE PDF eXpress Conference ID: `71772X`.
