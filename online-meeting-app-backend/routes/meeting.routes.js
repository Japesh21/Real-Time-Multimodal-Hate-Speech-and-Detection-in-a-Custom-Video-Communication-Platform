const router = require("express").Router();
const Meeting = require("../models/Meeting");
const User = require("../models/User");

// ===== CREATE MEETING =====
router.post("/create", async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ message: "uid is required to create a meeting" });
    }

    // Generate unique 4-digit code
    let code;
    let exists = true;
    while (exists) {
      code = Math.floor(1000 + Math.random() * 9000).toString();
      exists = await Meeting.findOne({ code });
    }

    console.log("Creating meeting:", code);

    // Look up user from DB to get name and email
    let hostData = { uid: "", name: "", email: "" };
    const user = await User.findOne({ googleId: uid });
    if (user) {
      hostData = {
        uid: user.googleId,
        name: user.name,
        email: user.email,
      };
    } else {
      console.log("Host user not found in DB for uid:", uid);
    }

    const meeting = await Meeting.create({
      code,
      host: hostData,
      participants: [],
      active: true,
    });

    console.log("Meeting created:", meeting.code, "| Host:", hostData.name);

    res.json({
      code: meeting.code,
      host: meeting.host,
    });

  } catch (err) {
    console.log("CREATE ERROR:", err);
    res.status(500).json({ message: "Failed to create meeting" });
  }
});

// ===== JOIN MEETING =====
router.post("/join", async (req, res) => {
  try {
    const { code, uid } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Meeting code is required" });
    }

    const trimmedCode = String(code).trim();
    console.log("Join request for code:", trimmedCode, "| uid:", uid);

    const meeting = await Meeting.findOne({ code: trimmedCode });

    if (!meeting) {
      console.log("Meeting not found:", trimmedCode);
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (!meeting.active) {

    console.log(
    "Inactive meeting:",
    trimmedCode
  );

}

    // Add participant to DB if uid provided and not already in
    if (uid) {
      const user = await User.findOne({ googleId: uid });
      if (user) {
        const alreadyIn = meeting.participants.find((p) => p.uid === uid);
        if (!alreadyIn) {
          meeting.participants.push({
            uid: user.googleId,
            name: user.name,
            email: user.email,
            joinedAt: new Date(),
          });
          await meeting.save();
          console.log(`Added ${user.name} to meeting ${trimmedCode} in DB`);
        }
      } else {
        console.log("Joining user not found in DB for uid:", uid);
      }
    }

    res.json({
      code: meeting.code,
      host: meeting.host,
      participants: meeting.participants,
      active: meeting.active,
    });

  } catch (err) {
    console.log("JOIN ERROR:", err);
    res.status(500).json({ message: "Join failed" });
  }
});

// ===== END MEETING =====
// ✅ This must be BEFORE /:code route so express doesn't treat "end" as a code
router.post("/end", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "code is required" });
    }

    const meeting = await Meeting.findOneAndUpdate(
      { code },
      { active: false },
      { new: true }
    );

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    console.log("Meeting ended:", code);
    res.json({ message: "Meeting ended", code: meeting.code });

  } catch (err) {
    console.log("END ERROR:", err);
    res.status(500).json({ message: "Error ending meeting" });
  }
});

// ===== GET ALL MEETINGS FOR A USER =====
router.get("/user/:uid", async (req, res) => {
  try {
    const { uid } = req.params;

    // Get meetings where user was host OR participant
    const meetings = await Meeting.find({
      $or: [
        { "host.uid": uid },
        { "participants.uid": uid },
      ],
    }).sort({ createdAt: -1 }); // newest first

    console.log(`Found ${meetings.length} meetings for uid: ${uid}`);
    res.json(meetings);

  } catch (err) {
    console.log("GET USER MEETINGS ERROR:", err);
    res.status(500).json({ message: "Error fetching meetings" });
  }
});

// ===== GET SINGLE MEETING INFO =====
// ✅ This is LAST so /:code does not accidentally catch /end or /user
router.get("/:code", async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ code: req.params.code });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.json(meeting);

  } catch (err) {
    console.log("GET MEETING ERROR:", err);
    res.status(500).json({ message: "Error fetching meeting" });
  }
});

module.exports = router;