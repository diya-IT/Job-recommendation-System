const express = require("express");
const router = express.Router();

const User = require("../models/User");
const AddSkills = require("../models/addskills");
const Job = require("../models/Jobs");
const Company = require("../models/Company");
const JobMatch = require("../models/recommendation");
const SkillMaster = require("../models/skills_mastertable");


// ✅ Convert { years, months } → total months
function expToTotalMonths(exp) {
  if (!exp) return 0;
  const years = Number(exp.years) || 0;
  const months = Number(exp.months) || 0;
  return years * 12 + months;
}


// ✅ Safe skill name extractor
function extractSkillName(skill) {
  return (
    skill.name ||
    skill.skill ||
    skill.skillName ||
    skill.title ||
    ""
  );
}


// ✅ Safe experience extractor (returns { years, months } object)
function extractExperience(skill) {
  return skill.experience || skill.exp || null;
}


// ✅ Normalize skills safely
function normalizeSkills(skillsArray, skillMap) {
  return (skillsArray || []).map(skill => {
    const rawName = typeof skill === "object"
      ? extractSkillName(skill)
      : skill;

    const clean = String(rawName).trim().toLowerCase();

    const exp = typeof skill === "object"
      ? extractExperience(skill)
      : null;

    return {
      name: skillMap[clean] || clean,
      experience: exp
    };
  });
}


router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // 1️⃣ Check user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2️⃣ Get user skills (AddSkills.skills)
    const addSkills = await AddSkills.findOne({ userId });
    if (!addSkills || !addSkills.skills?.length) {
      console.log("DBG: No addSkills or skills for userId:", userId);
      return res.json([]);
    }

    // 🔥 DEBUG: LOG RAW USER SKILLS
    console.log("DBG - RAW USER SKILLS (AddSkills):", {
      userId,
      skills: addSkills.skills
    });

    // 3️⃣ Build Skill Map (canonical + aliases)
    const skillMasters = await SkillMaster.find({});
    const skillMap = {};

    skillMasters.forEach(skill => {
      const canonical = String(skill.canonical).trim().toLowerCase();
      skillMap[canonical] = canonical;

      if (Array.isArray(skill.aliases)) {
        skill.aliases.forEach(alias => {
          skillMap[String(alias).trim().toLowerCase()] = canonical;
        });
      }
    });

    // 4️⃣ Normalize User Skills
    const normalizedUserSkills = normalizeSkills(addSkills.skills, skillMap);

    // ✅ Build userSkillMap (names only, no per‑skill exp needed here)
    const userSkillMap = new Map();
    normalizedUserSkills.forEach(skill => {
      userSkillMap.set(skill.name, 1); // just a flag, not months
    });

    // 5️⃣ Approved Companies
    const approvedCompanies = await Company.find({
      status: /approved/i
    });

    if (!approvedCompanies.length) {
      console.log("DBG: No approved companies");
      return res.json([]);
    }

    const approvedRecruiterIds = approvedCompanies.map(c => c.recruiterId);

    const companyMap = {};
    approvedCompanies.forEach(company => {
      companyMap[String(company.recruiterId)] = company;
    });

    // 6️⃣ Active Jobs (Job.skills)
    const jobs = await Job.find({
      status: /active/i,
      recruiterId: { $in: approvedRecruiterIds }
    });

    if (!jobs.length) {
      console.log("DBG: No active jobs for approved recruiters");
      return res.json([]);
    }

    const recommendations = [];
    const bulkOperations = [];

    // ✅ Use top‑level exp (global for user, not per skill)
    const userExpMonths = expToTotalMonths(addSkills.experience);

    console.log("DBG - USER GLOBAL EXP:", {
      userId,
      userExpRaw: addSkills.experience,
      userExpMonths
    });

    for (let job of jobs) {
      const normalizedJobSkills = normalizeSkills(job.skills, skillMap);

      const matchedSkills = [];
      const missingSkills = [];

      let matchedSkillCount = 0;

      normalizedJobSkills.forEach(jobSkill => {
        // ✅ Back to original skill‑matching logic (using normalized names)
        if (userSkillMap.has(jobSkill.name)) {
          matchedSkills.push(jobSkill.name);
          matchedSkillCount++;
        } else {
          missingSkills.push(jobSkill.name);
        }
      });

      console.log("→ Matched skills:", matchedSkills);
      console.log("→ Missing skills:", missingSkills);

      // ✅ Skill match percentage (should be 100 when all skills match)
      const skillMatchPer =
        normalizedJobSkills.length > 0
          ? (matchedSkills.length / normalizedJobSkills.length) * 100
          : 0;

      // ✅ Use Job's top‑level experience as required exp
      const requiredExpMonths = expToTotalMonths(job.experience);

      // ✅ Experience ratio using global user vs job exp
      const expRatio = requiredExpMonths > 0
        ? Math.min(userExpMonths / requiredExpMonths, 1.0)
        : 1.0;

      const expDeficitRatio = requiredExpMonths > 0
        ? Math.max(0, (requiredExpMonths - userExpMonths) / requiredExpMonths)
        : 0;

      console.log("→ GLOBAL EXP RATIO:", {
        userId,
        jobId: job._id,
        jobTitle: job.jobTitle,
        userExpMonths,
        requiredExpMonths,
        expRatio,
        expDeficitRatio
      });

      // ✅ 50% skills, 50% exp
      const skillScore = skillMatchPer;       // 0–100
      const expScore = expRatio * 100;        // 0–100
      const jobFitScore = (skillScore + expScore) / 2;

      let fitStatus = "Not Fit";
      if (jobFitScore >= 80) {
        fitStatus = "Strong";
      } else if (jobFitScore >= 60) {
        fitStatus = "Partial";
      }

      const experienceMatchPer = expRatio * 100;
      const experienceDeficitPer = expDeficitRatio * 100;

      console.log("→ FINAL JOB METRICS:", {
        jobId: job._id,
        jobTitle: job.jobTitle,
        jobFitScore,
        skillMatchPer,
        experienceMatchPer,
        experienceDeficitPer
      });

      const company = companyMap[String(job.recruiterId)];
      if (!company) continue;

      const roundedJobFitScore = Math.round(jobFitScore);
      const roundedSkillMatchPer = Math.round(skillMatchPer);
      const roundedExperienceMatchPer = Math.round(experienceMatchPer);
      const roundedExperienceDeficitPer = Math.round(experienceDeficitPer);

      recommendations.push({
        jobId: job._id,
        title: job.jobTitle,
        company: company.companyName,
        match: roundedJobFitScore,
        fitStatus,
        matchedSkills,
        missingSkills,
        skillMatchPer: roundedSkillMatchPer,
        experienceMatchPer: roundedExperienceMatchPer,
        experienceDeficitPer: roundedExperienceDeficitPer
      });

      bulkOperations.push({
        updateOne: {
          filter: { userId: user._id, jobId: job._id },
          update: {
            userId: user._id,
            jobId: job._id,
            companyId: company._id,
            matchedSkills,
            missingSkills,
            skillMatchPer: roundedSkillMatchPer,
            experienceMatchPer: roundedExperienceMatchPer,
            experienceDeficitPer: roundedExperienceDeficitPer,
            jobFitScore: roundedJobFitScore,
            fitStatus
          },
          upsert: true
        }
      });
    }

    if (bulkOperations.length > 0) {
      await JobMatch.bulkWrite(bulkOperations);
    }

    recommendations.sort((a, b) => b.match - a.match);

    res.json(recommendations);

  } catch (error) {
    console.error("Recommendation Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;