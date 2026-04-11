const router = require("express").Router();
const User = require("../models/User");
const Skills = require("../models/addskills");
const Experience = require("../models/experience");
const Company = require("../models/Company");

// 1. List all users (for your table)
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 2.This is the only route you need for the eye button
//    GET /api/admin/users/:id/profile
router.get("/:id/profile", async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1 — base user
    const user = await User.findById(id).select("-password").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ── RECRUITER: attach company info (no extra frontend route)
    if (user.role === "recruiter") {
      const company = await Company.findOne({ recruiterId: id }).lean();

      return res.json({
        _id:            user._id,
        name:           user.name,
        email:          user.email,
        role:           user.role,
        profileImage:   user.profileImage || user.avatar || null,
        createdAt:      user.createdAt,

        // Company fields
        companyName:    company?.companyName    || null,
        companyTitle:   company?.companyTitle   || null,
        companyWebsite: company?.companyWebsite || null,
        companyStatus:  company?.status         || null,
        adminNotes:     company?.adminNotes     || null,
      });
    }

    // ── USER / CANDIDATE: attach skills + experience (if not Fresher)
    const skillsDoc = await Skills.findOne({ userId: id }).lean();

    let experienceList = [];
    const isFresher = (skillsDoc?.level || "").toLowerCase() === "fresher";

    if (!isFresher) {
      experienceList = await Experience.find({ userId: id }).lean();
    }

    return res.json({
      _id:          user._id,
      name:         user.name,
      email:        user.email,
      role:         user.role,
      profileImage: user.profileImage || user.avatar || null,
      createdAt:    user.createdAt,

      // Skills fields
      skills:   skillsDoc?.skills   || [],
      level:    skillsDoc?.level    || "Fresher",
      projects: skillsDoc?.projects || [],
      location: skillsDoc?.location || null,

      // Experience (only if not Fresher)
      experience: experienceList,
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// 3. DELETE user (if you still want it)
router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;