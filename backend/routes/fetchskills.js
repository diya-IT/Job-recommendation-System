// routes/skills.js - FIXED ROUTE PATH
const express = require("express");
const router = express.Router();
const Skill = require("../models/addskills");
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("⚡ Fetching skills/projects for userId:", userId);

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const skillData = await Skill.findOne({ userId }).lean();
    
    // 🔥 FULL PROJECTS LOGGING - SHOW EVERYTHING
    console.log("📊 DB RESULTS:", {
      found: !!skillData,
      skillsCount: skillData?.skills?.length || 0,
      projectsCount: skillData?.projects?.length || 0,
      fullProjects: skillData?.projects || []  // 🔥 COMPLETE PROJECTS ARRAY
    });

    // 🔥 LOG FIRST PROJECT DETAILS (if exists)
    if (skillData?.projects && skillData.projects.length > 0) {
      console.log("🔍 FIRST PROJECT:", skillData.projects[0]);
      console.log("🏷️  PROJECT STATUS:", skillData.projects.map(p => ({ title: p.title, status: p.status })));
    }

    if (!skillData) {
      console.log("❌ NO DATA FOUND - Creating empty response");
      return res.status(200).json({ 
        skills: [],
        projects: [], 
        experience: { years: 0 },
        level: "Fresher",
        location: { address: "", city: "", country: "India" }
      });
    }

    console.log("✅ SENDING TO FRONTEND:", {
      projectsSent: skillData.projects?.length || 0,
      firstProjectTitle: skillData.projects?.[0]?.title || "none"
    });

    res.json({
      skills: skillData.skills || [],
      projects: skillData.projects || [],
      experience: skillData.experience || { years: 0 },
      level: skillData.level || "Fresher",
      location: skillData.location || { address: "", city: "", country: "India" }
    });

  } catch (error) {
    console.error("❌ FULL ERROR:", error);
    res.status(500).json({ error: "Server error", projects: [] });
  }
});
module.exports = router;