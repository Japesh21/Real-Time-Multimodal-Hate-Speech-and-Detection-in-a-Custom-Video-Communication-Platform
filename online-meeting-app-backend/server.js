require("dotenv").config();
const cloudinary = require("./config/cloudinary");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const authRoutes = require("./routes/auth.routes");
const meetingRoutes = require("./routes/meeting.routes");
const profileRoutes = require("./routes/profile");

const AudioTranscript = require("./models/AudioTranscript");
const VideoEvent = require("./models/VideoEvent");
const Meeting = require("./models/Meeting");
const { agentLog } = require("./debug_agent_log");
const { updateAnalytics } = require("./utils/updateAnalytics");

const meetingSocket = require("./sockets/meeting.socket");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ===== CREATE UPLOAD FOLDERS IF NOT EXIST =====
const UPLOAD_DIRS = [
  path.join(__dirname, "uploads"),
  path.join(__dirname, "uploads", "aievents"),
  path.join(__dirname, "uploads", "aievents", "video"),
];

UPLOAD_DIRS.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created folder: ${dir}`);
  }
});


// ===== MONGODB CONNECTION =====
const mongoURI =
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/ai-meeting";

mongoose
  .connect(mongoURI)
  .then(async () => {
    console.log("MongoDB connected");

    try {
      const collections = await mongoose.connection.db
        .listCollections()
        .toArray();

      const names = collections.map((c) => c.name);

      const needed = [
        "users",
        "meetings",
        "aievents",
        "chatmessages",
        "audiotranscripts",
        "videoevents",
      ];

      for (const name of needed) {
        if (!names.includes(name)) {
          await mongoose.connection.db.createCollection(name);
          console.log(`Created ${name} collection`);
        }
      }
    } catch (err) {
      console.error("Collection init error:", err);
    }
  })
  .catch((err) => console.log("MongoDB error:", err));


// ===== ROUTES =====
app.use("/api/auth", authRoutes);
app.use("/api/meeting", meetingRoutes);
app.use("/api/profile", profileRoutes);



// updateAnalytics is imported from utils/updateAnalytics.js
// Call it as: updateAnalytics(meetingCode)
// Alias kept so existing call sites don't break
const updateFusionRisk = updateAnalytics;


/* =====================================================
   SAVE AUDIO TRANSCRIPT (UPDATED WITH EMOTION SUPPORT)
===================================================== */

app.post("/api/moderation/save-transcript", async (req, res) => {
  try {

    const {
      meetingCode,
      uid,
      name,
      transcript,
      flagged,
      aiLabel,
      aiScore,
      emotion,
      emotionScore,
    } = req.body;

    await AudioTranscript.create({
      meetingCode,
      user: { uid, name },
      transcript,
      flagged,
      aiLabel,
      aiScore,
      emotion: emotion || "",
      emotionScore: emotionScore || 0,
    });

    agentLog(
      "server.js:save-transcript",
      "AudioTranscript created",
      {
        meetingCode,
        uid,
        flagged,
        transcriptLen: (transcript || "").length,
      },
      "H4"
    );

    console.log(
      `[SAVE] Transcript saved for ${name} in room ${meetingCode}`
    );

    if (flagged) updateFusionRisk(meetingCode);

    res.json({ message: "Transcript saved" });

  } catch (err) {
    console.error("Save transcript error:", err);
    res.status(500).json({ message: "Failed to save transcript" });
  }
});



/* =====================================================
   SAVE VIDEO EVENT
===================================================== */

app.post("/api/moderation/save-video-event", async (req, res) => {
  try {

    const {
      meetingCode,
      uid,
      name,
      label,
      confidence,
      allDetections,
      reasons,
      ocrText,
      ocrHarmful,
      middleFinger,
      nsfw,
      snapshotCloudURL,
      // emotion fields
      emotion,
      emotionScore,
      emotionHarmful,
      // fusion vote summary (backend/admin view only — not shown to users in-call)
      fusionVotes,
    } = req.body;

    let type = "weapon";

    if (emotionHarmful) type = "emotion";
    else if (ocrHarmful) type = "ocr";
    else if (nsfw) type = "nsfw";
    else if (middleFinger) type = "middle_finger";
    else if (reasons && reasons.some((r) => r.startsWith("nudity:")))
      type = "nudity";

    let snapshotPath = "";
    const finalSnapshotCloudURL = snapshotCloudURL || "";

    await VideoEvent.create({
      meetingCode,
      user: { uid, name },
      type,
      label,
      confidence,
      allDetections: allDetections || [],
      reasons: reasons || [],
      ocrText: ocrText || "",
      ocrHarmful: ocrHarmful || false,
      middleFinger: middleFinger || false,
      nsfw: nsfw || false,
      emotion: emotion || "",
      emotionScore: emotionScore || 0,
      emotionHarmful: emotionHarmful || false,
      fusionVotes: fusionVotes || "",
      snapshotPath,
      snapshotCloudURL: finalSnapshotCloudURL,
      warningSent: true,
    });

    agentLog(
      "server.js:save-video-event",
      "VideoEvent created",
      {
        meetingCode,
        uid,
        label,
        hasSnapshotURL: !!finalSnapshotCloudURL,
      },
      "H2"
    );

    console.log(
      `[SAVE] Video event saved for ${name} in ${meetingCode} — ${label}`
    );

    updateFusionRisk(meetingCode);

    // ===== REALTIME AI ALERT =====
    io.to(meetingCode).emit("ai-warning", {
      user: name,
      message: `🎥 ${label} detected (${Math.round(confidence * 100)}%)`,
    });

    res.json({ message: "Video event saved" });

  } catch (err) {
    console.error("Save video event error:", err);
    res.status(500).json({ message: "Failed to save video event" });
  }
});



/* =====================================================
   SOCKET ROOMS
===================================================== */

const rooms = {};

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

  console.log(
    "Total sockets after connect:",
    io.engine.clientsCount
  );

  meetingSocket(io, socket, rooms);
});



/* =====================================================
   START SERVER
===================================================== */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);