const mongoose = require("mongoose");

const VideoEventSchema = new mongoose.Schema({
  meetingCode: { type: String, required: true },
  user: {
    uid: { type: String, default: "" },
    name: { type: String, default: "" },
  },
  type: {
    type: String,
    enum: ["weapon", "ocr", "nudity", "nsfw", "middle_finger", "emotion", "both", "multiple"],
    default: "weapon"
  },
  label: { type: String, default: "" },
  confidence: { type: Number, default: 0 },
  allDetections: { type: Array, default: [] },
  reasons: { type: Array, default: [] },
  ocrText: { type: String, default: "" },
  ocrHarmful: { type: Boolean, default: false },
  middleFinger: { type: Boolean, default: false },
  nsfw: { type: Boolean, default: false },
  emotion: { type: String, default: "" },
  emotionScore: { type: Number, default: 0 },
  emotionHarmful: { type: Boolean, default: false },
  fusionVotes: { type: String, default: "" },
  snapshotPath: { type: String, default: "" },
  snapshotCloudURL: { type: String, default: "" },
  warningSent: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("VideoEvent", VideoEventSchema);