const mongoose = require("mongoose");

const AudioTranscriptSchema = new mongoose.Schema({
  meetingCode: { type: String, default: "" },
  user: {
    uid: { type: String, default: "" },
    name: { type: String, default: "" },
  },
  transcript: { type: String, default: "" },
  flagged: { type: Boolean, default: false },
  aiLabel: { type: String, default: "" },      // ✅ "offensive | anger"
  aiScore: { type: Number, default: 0 },
  emotion: { type: String, default: "" },       // ✅ "anger"
  emotionScore: { type: Number, default: 0 },   // ✅ 0.94
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AudioTranscript", AudioTranscriptSchema);