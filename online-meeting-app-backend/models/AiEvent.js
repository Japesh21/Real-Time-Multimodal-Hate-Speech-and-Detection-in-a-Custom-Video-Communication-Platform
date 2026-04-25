// models/AiEvent.js
const mongoose = require("mongoose");

const AiEventSchema = new mongoose.Schema({

  // Which meeting this event happened in
  meetingCode: {
    type: String,
    required: true,
  },

  // Who triggered it
  user: {
    uid: { type: String, default: "" },
    name: { type: String, default: "" },
  },

  // What type of event — chat moderation or audio moderation
  type: {
    type: String,
    enum: ["chat", "audio","text","image"],
    required: true,
  },

  // The actual content that was flagged
  content: {
    type: String,
    default: "",
  },

  // What the AI decided
  aiLabel: {
    type: String, // e.g. "toxic", "LABEL_1", "safe"
    default: "",
  },

  // AI confidence score if available
  aiScore: {
    type: Number,
    default: 0,
  },

  // Was a warning sent to the room?
  warningSent: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

});

module.exports = mongoose.model("AiEvent", AiEventSchema);