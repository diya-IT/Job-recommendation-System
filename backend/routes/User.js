const express = require("express");
const router = express.Router();
const User = require("../models/User");
const ProfilePhoto = require("../models/Profileq"); // ✅ FIXED - ProfilePhoto

// GET user by ID + ProfilePhoto ONLY
router.get("/:id", async (req, res) => {
    console.log("GET USER ROUTE HIT, ID:", req.params.id);
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const profilePhoto = await ProfilePhoto.findOne({ userId: req.params.id });
        
        // ✅ FULL URL - Frontend can access directly
        const photoUrl = profilePhoto?.photo 
            ? `http://localhost:5000${profilePhoto.photo}`  // ✅ Convert relative to absolute
            : "https://via.placeholder.com/120?w=120&h=120&text=👤";
        
        const userWithPhoto = {
            _id: user._id,
            name: user.name,
            email: user.email,
            photo: photoUrl  // ✅ ONLY photo from ProfilePhoto table
        };
        
        console.log("🖼️ Photo URL:", photoUrl); // ✅ Debug log
        res.json(userWithPhoto);
    } catch (err) {
        console.error("Error fetching user with photo:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;
