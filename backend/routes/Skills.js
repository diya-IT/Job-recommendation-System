const express = require("express");
const router = express.Router();
const axios = require("axios");

const Skills = require("../models/addskills");
const SkillsMaster = require("../models/skills_mastertable");
const User = require("../models/User");

// ✅ Calculate total experience from multiple experiences
function calculateTotalExperience(input) {
  if (!input) return { years: 0, months: 0 };

  // If array of experiences [{ years, months }]
  if (Array.isArray(input)) {
    let totalMonths = 0;
    input.forEach(exp => {
      const { years = 0, months = 0 } = parseExperience(exp);
      totalMonths += years * 12 + months;
    });
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return { years, months };
  }

  // Otherwise delegate to parseExperience
  return parseExperience(input);
}

function parseExperience(input) {
  if (!input) return { years: 0, months: 0 };

  // If input is an object { years, months }
  if (typeof input === "object") {
    const years = parseInt(input.years) || 0;
    const months = parseInt(input.months) || 0;
    return { years, months: months > 11 ? 11 : months };
  }

  // If input is a string like "2 years 5 months" or "1 year 1 month"
  if (typeof input === "string") {
    // Match both singular and plural forms
    const yearMatch = input.match(/(\d+)\s*year[s]?/i);
    const monthMatch = input.match(/(\d+)\s*month[s]?/i);

    const years = yearMatch ? parseInt(yearMatch[1], 10) : 0;
    const months = monthMatch ? parseInt(monthMatch[1], 10) : 0;

    return { years, months: months > 11 ? 11 : months };
  }

  // If input is a decimal number like 2.5
  const num = Number(input);
  if (!isNaN(num) && num > 0) {
    const years = Math.floor(num);
    const months = Math.round((num - years) * 12);
    return { years, months: months > 11 ? 11 : months };
  }

  return { years: 0, months: 0 };
}

// ✅ Normalize Skills
async function normalizeSkills(inputSkills = []) {
  if (!inputSkills.length) return [];
  const masters = await SkillsMaster.find();
  const normalized = [];
  for (let skill of inputSkills) {
    const s = skill.toLowerCase().trim();
    const match = masters.find(
      m =>
        m.canonical.toLowerCase() === s ||
        m.aliases.map(a => a.toLowerCase()).includes(s)
    );
    if (!match) throw new Error(`Invalid skill entered: "${skill}"`);
    normalized.push(match.canonical);
  }
  return normalized;
}

// ✅ Geocoding
async function getLatLng(address, city, country) {
  try {
    const query = `${address}, ${city}, ${country}`;
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      { 
        params: { q: query, format: "json", limit: 1 }, 
        headers: { "User-Agent": "job-recommendation-app" }, 
        timeout: 5000 
      }
    );
    if (!response.data || !response.data.length) return { lat: null, lng: null };
    return { lat: Number(response.data[0].lat), lng: Number(response.data[0].lon) };
  } catch {
    return { lat: null, lng: null };
  }
}

// ✅ URL Verification
async function verifyUrl(url) {
  try {
    await axios.head(url, { timeout: 5000 });
    return "Verified";
  } catch {
    return "Not Verified";
  }
}

// 🔥 POST - Add New Skills/Projects
router.post("/add/:userId", async (req, res) => {
  const { skills, experience, location, projects } = req.body;
  const { userId } = req.params;

  try {
    const userExists = await User.findById(userId);
    if (!userExists) return res.status(404).json({ success: false, message: "User not found" });

    const normalizedSkills = await normalizeSkills(skills || []);
    let verifiedProjects = [];

    if (Array.isArray(projects) && projects.length > 0) {
      verifiedProjects = await Promise.all(projects.map(async p => ({
        title: p.title,
        url: p.url,
        techUsed: Array.isArray(p.techUsed)
          ? p.techUsed
          : (p.techUsed || "").split(",").map(t => t.trim()).filter(Boolean),
        status: await verifyUrl(p.url)
      })));
    }

    const { years, months } = calculateTotalExperience(experience);
    const level = years === 0 && months === 0 ? "Fresher" : "Experienced";

    const updateObj = {
      $set: {
        skills: normalizedSkills,
        "experience.years": years,
        "experience.months": months,
        level,
        updatedAt: new Date()
      }
    };

    if (verifiedProjects.length > 0) {
      updateObj.$addToSet = { projects: { $each: verifiedProjects } };
    }

    if (location?.city) {
      const { lat, lng } = await getLatLng(location.address || "", location.city, location.country || "India");
      updateObj.$set.location = { ...location, lat, lng };
    }

    const result = await Skills.findOneAndUpdate(
      { userId },
      updateObj,
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: result });

  } catch (error) {
    console.error("❌ CRITICAL ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔥 PUT - Edit Specific Project
router.put("/project/:userId/:projectIndex", async (req, res) => {
  const { userId, projectIndex } = req.params;
  const { title, url, techUsed } = req.body;

  try {
    if (!title?.trim() || !url?.trim()) {
      return res.status(400).json({ error: "Title and URL required" });
    }

    const index = parseInt(projectIndex);
    const status = await verifyUrl(url.trim());

    const result = await Skills.findOneAndUpdate(
      { userId },
      {
        $set: {
          [`projects.${index}`]: {
            title: title.trim(),
            url: url.trim(),
            techUsed: Array.isArray(techUsed)
              ? techUsed
              : (techUsed || "").split(",").map(t => t.trim()).filter(Boolean),
            status,
            updatedAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!result || !result.projects?.[index]) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ success: true, updatedProject: result.projects[index] });

  } catch (error) {
    console.error("❌ PUT Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 🔥 SIMPLE UPDATE - Experience → Skills linkage
router.post("/:userId/simple-update", async (req, res) => {
  try {
    const { userId } = req.params;
    const { level, experience } = req.body;

    const { years, months } = calculateTotalExperience(experience);

    const updateResult = await Skills.findOneAndUpdate(
      { userId },
      {
        $set: {
          level: level || (years === 0 && months === 0 ? "Fresher" : "Experienced"),
          "experience.years": years,
          "experience.months": months
        }
      },
      { new: true, upsert: true }
    );

    res.json({ 
      success: true, 
      skillsId: updateResult._id,
      level: updateResult.level 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
