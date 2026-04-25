const express = require("express");
const router = express.Router();
const User = require("../models/User");

// POST /api/auth/google-login
router.post("/google-login", async (req, res) => {

  const { googleId, email } = req.body;

  try {

    // ✅ FIRST: check by email (MOST IMPORTANT FIX)
    let user = await User.findOne({ email });

    if (user) {
      // ✅ Update googleId if different
      if (user.googleId !== googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // ✅ NEW USER
      user = await User.create({
        googleId,
        email,
        profileCompleted: false
      });

      return res.json({
        status: "NEW_USER",
        user
      });
    }

    // ✅ PROFILE CHECK
    if (!user.profileCompleted || !user.name || !user.logoURL) {
      return res.json({
        status: "INCOMPLETE_PROFILE",
        user
      });
    }

    // ✅ READY USER
    return res.json({
      status: "READY",
      user
    });

  } catch (err) {
    console.log("AUTH ERROR:", err);
    res.status(500).json({
      message: "Server error"
    });
  }

});

module.exports = router;