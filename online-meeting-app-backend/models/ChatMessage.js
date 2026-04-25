const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema({
  meetingCode: { type: String, required: true },
  sender: {
    uid: { type: String, default: "" },
    name: { type: String, default: "" },
  },
  text: { type: String, required: true },
  flagged: { type: Boolean, default: false },  // ✅ true if AI found it toxic
  aiLabel: { type: String, default: "" },       // ✅ what AI said
  aiScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ChatMessage", ChatMessageSchema);