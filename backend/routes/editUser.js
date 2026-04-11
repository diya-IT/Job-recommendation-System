const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const User = require("../models/User");
const Profile = require("../models/Profileq");

/* ========= MULTER SETUP ========= */
const uploadDir = path.join(__dirname, "../uploads/profile");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

/* ========= UPDATE PROFILE ========= */
router.put("/:id", upload.single("photo"), async (req, res) => {
  try {
    const { name, email } = req.body;

    // Update user
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    // Update profile
    let profile = await Profile.findOne({ userId: user._id });
    if (!profile) profile = new Profile({ userId: user._id });

    if (req.file) {
      // Delete old photo
      if (profile.photo) {
        const oldPath = path.join(__dirname, "..", profile.photo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      profile.photo = `/uploads/profile/${req.file.filename}`;
    }

    await profile.save();

    res.json({
      message: "Profile updated successfully",
      user,
      profile,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router; 