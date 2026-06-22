const mongoose = require("mongoose");

const MeetingSchema = new mongoose.Schema({

  code: {
    type: String,
    required: true,
    unique: true,
  },

  /* =========================================
     HOST INFO
  ========================================= */

  host: {
    uid: { type: String, default: "" },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
  },

  /* =========================================
     PARTICIPANTS
  ========================================= */

  participants: [
    {
      uid: { type: String },

      name: { type: String },

      email: { type: String },

      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  /* =========================================
     MEETING STATUS
  ========================================= */

  active: {
    type: Boolean,
    default: true,
  },

  /* =========================================
     AI ANALYTICS
  ========================================= */

  analytics: {

    /* ===== CHAT ANALYTICS ===== */

    chat: {

      totalMessages: {
        type: Number,
        default: 0,
      },

      flaggedMessages: {
        type: Number,
        default: 0,
      },

      avgToxicityScore: {
        type: Number,
        default: 0,
      },

      mostCommonLabel: {
        type: String,
        default: "",
      },

    },

    /* ===== AUDIO ANALYTICS ===== */

    audio: {

      totalTranscripts: {
        type: Number,
        default: 0,
      },

      flaggedTranscripts: {
        type: Number,
        default: 0,
      },

      avgAudioToxicity: {
        type: Number,
        default: 0,
      },

      dominantEmotion: {
        type: String,
        default: "",
      },

      avgEmotionScore: {
        type: Number,
        default: 0,
      },

    },

    /* ===== VIDEO ANALYTICS ===== */

    video: {

      totalEvents: {
        type: Number,
        default: 0,
      },

      weaponDetections: {
        type: Number,
        default: 0,
      },

      nudityDetections: {
        type: Number,
        default: 0,
      },

      nsfwDetections: {
        type: Number,
        default: 0,
      },

      middleFingerDetections: {
        type: Number,
        default: 0,
      },

      ocrViolations: {
        type: Number,
        default: 0,
      },

      avgConfidence: {
        type: Number,
        default: 0,
      },

      highestThreatLabel: {
        type: String,
        default: "",
      },

    },

    /* ===== FUSION RISK (per-user aggregated across modalities) ===== */

    fusion: {

      textAlerts: { type: Number, default: 0 },
      audioAlerts: { type: Number, default: 0 },
      videoAlerts: { type: Number, default: 0 },
      emotionAlerts: { type: Number, default: 0 },
      totalAlerts: { type: Number, default: 0 },

      // "low" | "medium" | "high" | "critical"
      riskLevel: { type: String, default: "low" },

      // e.g. "3 text + 1 video + 1 audio"
      riskSummary: { type: String, default: "" },

      lastUpdated: { type: Date, default: null },

    },

    /* ===== OVERALL MEETING RISK ===== */

    overallRiskScore: {
      type: Number,
      default: 0,
    },

    threatLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },

  },

  /* =========================================
     TIMESTAMPS
  ========================================= */

  createdAt: {
    type: Date,
    default: Date.now,
  },

});

module.exports = mongoose.model("Meeting", MeetingSchema);