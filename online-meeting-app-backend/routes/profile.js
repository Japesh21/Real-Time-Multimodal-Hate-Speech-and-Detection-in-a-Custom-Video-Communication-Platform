const express = require("express");
const router = express.Router();
const User = require("../models/User");

const multer = require("multer");
const streamifier = require("streamifier");

const cloudinary = require("../config/cloudinary");

/* ================================
   MULTER CONFIG
================================ */

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 }, // 100KB

    fileFilter: (req, file, cb) => {

        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files allowed"));
        }

    }
});

/* ================================
   CLOUDINARY UPLOAD
================================ */

const streamUpload = (buffer) => {

    return new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(

            { folder: "profiles" },

            (error, result) => {

                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }

            }

        );

        streamifier.createReadStream(buffer).pipe(stream);

    });

};

/* ================================
   PROFILE SETUP
   POST /api/profile/setup
================================ */

router.post("/setup", upload.single("logo"), async (req, res) => {

    console.log("PROFILE SETUP CALLED");

    const { googleId, name } = req.body;

    if (!googleId) {

        return res.status(400).json({
            success: false,
            message: "googleId is required"
        });

    }

    try {

        const updateData = {
            name,
            profileCompleted: true
        };

        /* ================================
           UPLOAD IMAGE TO CLOUDINARY
        ================================ */

        if (req.file) {

            console.log("Uploading image to cloudinary...");

            const result = await streamUpload(req.file.buffer);

            console.log("Cloudinary upload done");

            updateData.logoURL = result.secure_url;


        }

        const user = await User.findOneAndUpdate(

            { googleId },

            updateData,

            { new: true }

        );

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }

        res.json({
            success: true,
            user
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});

/* ================================
   GET PROFILE
   GET /api/profile/:googleId
================================ */

router.get("/:googleId", async (req, res) => {

    try {

        const user = await User.findOne({
            googleId: req.params.googleId
        });

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }

        res.json({
            success: true,
            user
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});

module.exports = router;