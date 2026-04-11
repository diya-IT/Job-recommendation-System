// routes/users.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

const User = require("../models/User");
const Profile = require("../models/Profileq");

// DELETE /api/users/delete/:id
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Delete profile and photo
    const profile = await Profile.findOne({ userId });
    if (profile) {
      if (profile.photo) {
        const photoPath = path.join(__dirname, "../", profile.photo);
        if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
      }
      await profile.deleteOne();
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({ message: "User account and profile deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
