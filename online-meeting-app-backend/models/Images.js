const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
  user: {
    uid: String,
    name: String,
  },

  imageUrl: String,

  ai: {
    emotion: String,
    emotionScore: Number,

    gesture: String,
    gestureConfidence: Number,

    aggressive: Boolean,
    aggressionScore: Number,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Image", ImageSchema);