const axios = require("axios");

const AI_URL = "http://127.0.0.1:8000";

async function moderateText(text, user = "unknown", meetingCode = "0000") {
  try {
    const response = await axios.post(
      `${AI_URL}/moderate/text`,
      {
        text: text,
        user: user,
        meetingCode: meetingCode,
      }
    );

    const data = response.data;

    return {
      label: data.is_harmful ? "offensive" : "non-offensive",
      score: data.confidence,
      is_harmful: data.is_harmful,
      prediction: data.prediction,
    };

  } catch (error) {
    console.error("AI moderation error:", error.message);
    return {
      label: "unknown",
      score: 0,
      is_harmful: false,
    };
  }
}

module.exports = {
  moderateText,
};