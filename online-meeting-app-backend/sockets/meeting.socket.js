const ChatMessage = require("../models/ChatMessage");
const AiEvent = require("../models/AiEvent");
const Meeting = require("../models/Meeting");
const User = require("../models/User");
const Image = require("../models/Images");
const { agentLog } = require("../debug_agent_log");
const { updateAnalytics } = require("../utils/updateAnalytics");


// ===== TEXT AI =====
async function moderateTextPython(text, sender, meetingCode) {

  try {

    const res = await fetch("https://emmy-vascular-optionally.ngrok-free.dev/moderate/text", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        text,
        user: sender,
        meetingCode
      }),

    });

    const data = await res.json();

    return {
      is_harmful: data.is_harmful,
      label: data.prediction,
      score: data.confidence,
      model_scores: data.model_scores,
      active_labels: data.active_labels,
      votes: data.votes,
    };

  } catch (err) {

    console.error("[PYTHON TEXT ERROR]", err);

    return {
      is_harmful: false,
      label: "non-offensive",
      score: 0,
      votes: 0,
      active_labels: []
    };

  }

}


// ===== PROFILE IMAGE AI =====
async function moderateProfileImage(imageUrl, meetingId, userUid) {

  try {

    const res = await fetch(
      "https://emmy-vascular-optionally.ngrok-free.dev/moderation/profile-image",
      {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          image_url: imageUrl,
          meeting_id: meetingId,
          user_uid: userUid,
        }),

      }
    );

    return await res.json();

  } catch (err) {

    console.error("[PROFILE AI ERROR]", err);

    return {
      safe: true
    };

  }

}

  
module.exports = function (io, socket, rooms) {

// ===== JOIN ROOM =====

socket.on("join-room", async ({ roomId, user }) => {

    const meeting =
      await Meeting.findOne({
        code: String(roomId)
      });

    if (
      !meeting ||
      !meeting.active
    ) {

      agentLog(
        "meeting.socket.js:join-room",
        "socket blocked inactive meeting",
        { roomId, active: meeting?.active ?? null },
        "H1"
      );

      socket.emit(
        "meeting-ended"
      );

      return;

    }

    socket.join(String(roomId));

    if (!rooms[roomId]) rooms[roomId] = [];

    rooms[roomId] = rooms[roomId].filter(
      (u) => u.id !== socket.id
    );

    const newUser = {

      id: socket.id,

      uid: user.uid,

      name: user.name,

      profileImage: user.profileImage || "",

      micOn: true,

      camOn: true,

    };

    rooms[roomId].push(newUser);

    console.log(
      `${user.name} joined room ${roomId} | total: ${rooms[roomId].length}`
    );

    try {

      const meeting = await Meeting.findOne({
        code: String(roomId)
      });

      if (meeting) {

        const dbUser = await User.findOne({
          googleId: user.uid
        });

        const alreadyIn = meeting.participants.find(
          (p) => p.uid === user.uid
        );

        if (!alreadyIn && user.uid) {

          meeting.participants.push({

            uid: user.uid,

            name: user.name,

            email: dbUser ? dbUser.email : "",

            joinedAt: new Date(),

          });

          await meeting.save();

          console.log(
            `Saved participant ${user.name} to meeting ${roomId}`
          );

        }

        if (!meeting.host.uid && rooms[roomId].length === 1) {

          meeting.host = {

            uid: user.uid,

            name: user.name,

            email: dbUser ? dbUser.email : "",

          };

          await meeting.save();

        }

      }

    } catch (err) {

      console.error(
        "DB error on join-room:",
        err
      );

    }

    io.to(String(roomId)).emit(
      "participants",
      rooms[roomId]
    );

    socket.to(String(roomId)).emit(
      "user-joined",
      {
        id: socket.id,
        ...newUser
      }
    );

  });

  socket.on(
  "update-participant",

  ({ roomId, micOn, camOn }) => {

    if (!rooms[roomId]) return;

    rooms[roomId] =
      rooms[roomId].map((p) => {

        if (p.id === socket.id) {

          return {
            ...p,
            micOn,
            camOn,
          };

        }

        return p;

      });

    io.to(String(roomId)).emit(
      "participants",
      rooms[roomId]
    );

  }
);

  // ===== WEBRTC OFFER =====
socket.on("offer", ({ to, offer }) => {

  io.to(to).emit(
    "offer",
    {
      offer,
      from: socket.id,
    }
  );

});


// ===== WEBRTC ANSWER =====
socket.on("answer", ({ to, answer }) => {

  io.to(to).emit(
    "answer",
    {
      answer,
      from: socket.id,
    }
  );

});


// ===== WEBRTC ICE =====
socket.on(
  "ice-candidate",

  ({ to, candidate }) => {

    io.to(to).emit(
      "ice-candidate",
      {
        candidate,
        from: socket.id,
      }
    );

  }
);

  // ===== TOGGLE AI =====
  socket.on("toggle-ai", async (data) => {

    try {

      const {
        roomId,
        enabled,
        user
      } = data;

      if (!enabled) return;

      const dbUser = await User.findOne({
        googleId: user.uid
      });

      if (!dbUser?.logoURL) return;

      const profileResult = await moderateProfileImage(
        dbUser.logoURL,
        roomId,
        user.uid
      );

      console.log(
        "[PROFILE AI RESULT]",
        profileResult
      );

      if (
        !profileResult.safe &&
        profileResult.confidence > 0.40
      ) {

        await Image.create({

          user: {
            uid: user.uid,
            name: user.name,
          },

          imagePath: dbUser.logoURL,

          ai: {

            labels: profileResult.labels,

            confidence: profileResult.confidence,

            harmful: true,

          },

        });

        console.log(
          `[PROFILE IMAGE SAVED] ${user.name}`
        );

        io.to(String(roomId)).emit("ai-warning", {

          user: user.name,

          message:
            `🖼 Harmful profile image detected: ` +
            `${profileResult.labels?.join(", ")}`

        });

      }

    } catch (err) {

      console.error(
        "[TOGGLE AI ERROR]",
        err
      );

    }

  });


  // ===== CHAT =====
  socket.on("chat-message", async (data) => {

    const {
      roomId,
      text,
      sender
    } = data;

    if (!roomId || !text || !sender) {
      return;
    }

    console.log(
      `[CHAT] ${sender} in ${roomId}: ${text}`
    );

    io.to(String(roomId)).emit(
      "chat-message",
      {
        sender,
        text,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }
    );

    const roomUser = rooms[roomId]?.find(
      (u) => u.name === sender
    );

    try {

      const aiResult = await moderateTextPython(
        text,
        sender,
        roomId
      );

      console.log(
        `[AI CHAT] ${aiResult.label}`
      );

      const isToxic =
        aiResult.is_harmful === true;

      await ChatMessage.create({

        meetingCode: roomId,

        sender: {
          uid: roomUser?.uid || "",
          name: sender,
        },

        text,

        flagged: isToxic,

        aiLabel: aiResult.label || "",

        aiScore: aiResult.score || 0,

      });

      agentLog(
        "meeting.socket.js:chat-message",
        "ChatMessage saved after AI",
        { roomId, isToxic, label: aiResult.label },
        "H4"
      );

      // update meeting analytics after every chat message (total count + per-user if toxic)
      updateAnalytics(roomId);

      if (isToxic) {

        await AiEvent.create({

          meetingCode: roomId,

          user: {
            uid: roomUser?.uid || "",
            name: sender,
          },

          type: "chat",

          content: text,

          aiLabel: aiResult.label,

          aiScore: aiResult.score,

          warningSent: true,

          snapshotPath: "",

        });

        io.to(String(roomId)).emit("ai-warning", {

          user: sender,

          message:
            `💬 ${aiResult.label} detected`

        });

      }

    } catch (err) {

      console.error(
        "[AI CHAT ERROR]",
        err
      );

    }

  });


  // ===== DISCONNECT =====
  socket.on("disconnect", async () => {

    for (let roomId in rooms) {

      const user = rooms[roomId].find(
        (u) => u.id === socket.id
      );

      if (user) {

        rooms[roomId] =
          rooms[roomId].filter(
            (u) => u.id !== socket.id
          );

        socket.to(roomId).emit(
          "user-left",
          socket.id
        );

        io.to(String(roomId)).emit(
          "participants",
          rooms[roomId]
        );

        if (rooms[roomId].length === 0) {

          delete rooms[roomId];

          try {

            await Meeting.findOneAndUpdate(
              { code: roomId },
              { active: false }
            );

            console.log(
              `Meeting ${roomId} marked inactive`
            );

          } catch (err) {

            console.error(err);

          }

        }

        break;

      }

    }

    console.log(
      "User disconnected:",
      socket.id
    );

  });

};