// ================= 2. PROFILE MANAGEMENT =================
// Fetch Profile by ID (for AdminPortal sidebar)
const express = require("express");
const router = express.Router();
const User = require("../models/User");
router.get('/pradmin/:id', async (req, res) => {
  try {
    const profile = await User.findById(req.params.id)
      .select('name email role avatar')
      .lean();

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      _id: profile._id,
      name: profile.name || "Admin",
      email: profile.email || "",
      role: "admin",
      avatar: profile.avatar || null
    });
  } catch (err) {
    res.status(500).json({ error: 'Profile fetch failed' });
  }
});

// Update Profile (for AdminPortal edit)
router.put('/editadmin/pr/:id', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email required' });
    }

    const updatedProfile = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: "admin"
      },
      { new: true, runValidators: true }
    )
    .select('name email role avatar _id')
    .lean();

    if (!updatedProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      _id: updatedProfile._id,
      name: updatedProfile.name,
      email: updatedProfile.email,
      role: "admin",
      avatar: updatedProfile.avatar || null
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Update failed' });
  }
});

module.exports = router;