const ChatMessage    = require("../models/ChatMessage");
const AudioTranscript = require("../models/AudioTranscript");
const VideoEvent     = require("../models/VideoEvent");
const Meeting        = require("../models/Meeting");

function userRiskLevel(total) {
  if (total === 0)     return "low";
  if (total <= 2)      return "medium";
  if (total <= 5)      return "high";
  return "critical";
}

async function updateAnalytics(meetingCode) {
  try {
    const [chatMessages, audioTranscripts, videoEvents] = await Promise.all([
      ChatMessage.find({ meetingCode, flagged: true }),
      AudioTranscript.find({ meetingCode, flagged: true }),
      VideoEvent.find({ meetingCode }),
    ]);

    // ===== MEETING-WIDE FUSION TOTALS =====
    const textAlerts    = chatMessages.length;
    const audioAlerts   = audioTranscripts.length;
    const videoAlerts   = videoEvents.filter(e => !e.emotionHarmful).length;
    const emotionAlerts = videoEvents.filter(e => e.emotionHarmful).length;
    const total         = textAlerts + audioAlerts + videoAlerts + emotionAlerts;

    const riskLevel   = userRiskLevel(total);
    const parts       = [];
    if (textAlerts)    parts.push(`${textAlerts} text`);
    if (audioAlerts)   parts.push(`${audioAlerts} audio`);
    if (videoAlerts)   parts.push(`${videoAlerts} video`);
    if (emotionAlerts) parts.push(`${emotionAlerts} emotion`);
    const riskSummary = parts.join(" + ") || "no alerts";

    // ===== PER-USER BREAKDOWN =====
    const userMap = {};

    function getUser(uid, name) {
      const key = uid || name;
      if (!userMap[key]) {
        userMap[key] = {
          uid:  uid  || "",
          name: name || "",
          text:  { count: 0, totalScore: 0, labels: [] },
          audio: { count: 0, totalScore: 0, labels: [] },
          video: { count: 0, weapon: 0, nudity: 0, nsfw: 0, middleFinger: 0, ocr: 0, emotion: 0, totalConf: 0 },
          image: { flagged: false, labels: [] },
        };
      }
      return userMap[key];
    }

    for (const msg of chatMessages) {
      const u = getUser(msg.sender?.uid, msg.sender?.name);
      u.text.count++;
      u.text.totalScore += msg.aiScore || 0;
      if (msg.aiLabel && !u.text.labels.includes(msg.aiLabel)) u.text.labels.push(msg.aiLabel);
    }

    for (const t of audioTranscripts) {
      const u = getUser(t.user?.uid, t.user?.name);
      u.audio.count++;
      u.audio.totalScore += t.aiScore || 0;
      if (t.aiLabel && !u.audio.labels.includes(t.aiLabel)) u.audio.labels.push(t.aiLabel);
    }

    for (const v of videoEvents) {
      const u = getUser(v.user?.uid, v.user?.name);
      u.video.count++;
      u.video.totalConf += v.confidence || 0;
      if (v.emotionHarmful)            u.video.emotion++;
      else if (v.type === "weapon")    u.video.weapon++;
      else if (v.type === "nudity")    u.video.nudity++;
      else if (v.type === "nsfw")      u.video.nsfw++;
      else if (v.type === "middle_finger") u.video.middleFinger++;
      else if (v.type === "ocr")       u.video.ocr++;
    }

    const usersArray = Object.values(userMap).map(u => {
      const userTotal = u.text.count + u.audio.count + u.video.count + (u.image.flagged ? 1 : 0);
      return {
        uid:  u.uid,
        name: u.name,
        text: {
          count:    u.text.count,
          avgScore: u.text.count > 0 ? Math.round((u.text.totalScore / u.text.count) * 10000) / 10000 : 0,
          labels:   u.text.labels,
        },
        audio: {
          count:    u.audio.count,
          avgScore: u.audio.count > 0 ? Math.round((u.audio.totalScore / u.audio.count) * 10000) / 10000 : 0,
          labels:   u.audio.labels,
        },
        video: {
          count:         u.video.count,
          weapon:        u.video.weapon,
          nudity:        u.video.nudity,
          nsfw:          u.video.nsfw,
          middleFinger:  u.video.middleFinger,
          ocr:           u.video.ocr,
          emotion:       u.video.emotion,
          avgConfidence: u.video.count > 0 ? Math.round((u.video.totalConf / u.video.count) * 10000) / 10000 : 0,
        },
        image: {
          flagged: u.image.flagged,
          labels:  u.image.labels,
        },
        totalAlerts: userTotal,
        riskLevel:   userRiskLevel(userTotal),
      };
    });

    // ===== CHAT ANALYTICS =====
    const allChatMessages = await ChatMessage.find({ meetingCode });
    const flaggedChat     = allChatMessages.filter(m => m.flagged);
    const avgToxScore     = flaggedChat.length > 0
      ? Math.round((flaggedChat.reduce((s, m) => s + (m.aiScore || 0), 0) / flaggedChat.length) * 10000) / 10000
      : 0;
    const labelCounts = {};
    flaggedChat.forEach(m => { if (m.aiLabel) labelCounts[m.aiLabel] = (labelCounts[m.aiLabel] || 0) + 1; });
    const mostCommonLabel = Object.keys(labelCounts).sort((a, b) => labelCounts[b] - labelCounts[a])[0] || "";

    // ===== AUDIO ANALYTICS =====
    const allAudio    = await AudioTranscript.find({ meetingCode });
    const flaggedAud  = allAudio.filter(t => t.flagged);
    const avgAudScore = flaggedAud.length > 0
      ? Math.round((flaggedAud.reduce((s, t) => s + (t.aiScore || 0), 0) / flaggedAud.length) * 10000) / 10000
      : 0;

    // ===== VIDEO ANALYTICS =====
    const allVideo   = videoEvents;
    const avgVidConf = allVideo.length > 0
      ? Math.round((allVideo.reduce((s, v) => s + (v.confidence || 0), 0) / allVideo.length) * 10000) / 10000
      : 0;
    const highestThreatLabel = allVideo.reduce((top, v) =>
      (v.confidence || 0) > (top.confidence || 0) ? v : top, {}
    ).label || "";

    await Meeting.findOneAndUpdate(
      { code: meetingCode },
      {
        $set: {
          "analytics.fusion.textAlerts":    textAlerts,
          "analytics.fusion.audioAlerts":   audioAlerts,
          "analytics.fusion.videoAlerts":   videoAlerts,
          "analytics.fusion.emotionAlerts": emotionAlerts,
          "analytics.fusion.imageAlerts":   0,
          "analytics.fusion.totalAlerts":   total,
          "analytics.fusion.riskLevel":     riskLevel,
          "analytics.fusion.riskSummary":   riskSummary,
          "analytics.fusion.lastUpdated":   new Date(),
          "analytics.users":                usersArray,
          "analytics.chat.totalMessages":   allChatMessages.length,
          "analytics.chat.flaggedMessages": flaggedChat.length,
          "analytics.chat.avgToxicityScore": avgToxScore,
          "analytics.chat.mostCommonLabel": mostCommonLabel,
          "analytics.audio.totalTranscripts":    allAudio.length,
          "analytics.audio.flaggedTranscripts":  flaggedAud.length,
          "analytics.audio.avgAudioToxicity":    avgAudScore,
          "analytics.video.totalEvents":          allVideo.length,
          "analytics.video.weaponDetections":     allVideo.filter(v => v.type === "weapon").length,
          "analytics.video.nudityDetections":     allVideo.filter(v => v.type === "nudity").length,
          "analytics.video.nsfwDetections":       allVideo.filter(v => v.type === "nsfw").length,
          "analytics.video.middleFingerDetections": allVideo.filter(v => v.type === "middle_finger").length,
          "analytics.video.ocrViolations":        allVideo.filter(v => v.type === "ocr").length,
          "analytics.video.avgConfidence":        avgVidConf,
          "analytics.video.highestThreatLabel":   highestThreatLabel,
          "analytics.overallRiskScore":           total,
          "analytics.threatLevel":                riskLevel,
        },
      }
    );

    console.log(`[ANALYTICS] ${meetingCode} → ${riskLevel} (${riskSummary}) | users: ${usersArray.length}`);
  } catch (err) {
    console.error("[ANALYTICS ERROR]", err.message);
  }
}

module.exports = { updateAnalytics };
