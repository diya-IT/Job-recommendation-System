const express = require('express');
const router = express.Router();
const Job = require('../models/Jobs');
const SkillsMaster = require('../models/skills_mastertable');

/**
 * ✅ NORMALIZE + VALIDATE SKILLS
 * - react / reactjs → React
 * - unknown skills → error
 */
async function normalizeSkills(inputSkills = []) {
  if (!Array.isArray(inputSkills) || inputSkills.length === 0) {
    return { normalizedSkills: [], invalidSkills: [] };
  }

  const masters = await SkillsMaster.find();
  const normalizedSkills = [];
  const invalidSkills = [];

  for (let skill of inputSkills) {
    const s = skill.toLowerCase().trim();

    const match = masters.find(m => {
      if (m.canonical.toLowerCase() === s) return true;
      if (Array.isArray(m.aliases)) {
        return m.aliases.map(a => a.toLowerCase()).includes(s);
      }
      return false;
    });

    if (match) {
      normalizedSkills.push(match.canonical);
    } else {
      invalidSkills.push(skill);
    }
  }

  return { normalizedSkills, invalidSkills };
}

/**
 * SAFE EXPERIENCE CONVERSION
 * Handles:
 *  - { years: 2, months: 5 }
 *  - "2 years 5 months"
 *  - 2.5 → { years: 2, months: 6 }
 */
function convertExperience(input) {
  if (!input) return { years: 0, months: 0 };

  let years = 0;
  let months = 0;

  //  Object input
  if (typeof input === "object" && input.years !== undefined && input.months !== undefined) {
    years = parseInt(input.years) || 0;
    months = parseInt(input.months) || 0;
  }

  // String input like "2 years 5 months"
  else if (typeof input === "string") {
    const yearMatch = input.match(/(\d+)\s*year/i);
    const monthMatch = input.match(/(\d+)\s*month/i);
    years = yearMatch ? parseInt(yearMatch[1], 10) : 0;
    months = monthMatch ? parseInt(monthMatch[1], 10) : 0;
  }

  // Decimal number input like 2.5
  else {
    const num = parseFloat(input);
    if (!isNaN(num) && num >= 0) {
      years = Math.floor(num);
      months = Math.round((num - years) * 12);
    }
  }

  //  Carry over months > 11 into years
  if (months > 11) {
    years += Math.floor(months / 12);
    months = months % 12;
  }

  // Ensure non-negative
  years = Math.max(0, years);
  months = Math.max(0, months);

  return { years, months };
}

/**
 *  POST /api/jobs
 */
router.post('/', async (req, res) => {
  try {
    console.log('📥 Job POST body:', req.body);
    const {
      jobName,
      jobTitle,
      jobDescription,
      skills,
      experience,
      companyId,
      recruiterId
    } = req.body;

    if (!recruiterId) {
      return res.status(400).json({
        success: false,
        error: true,
        message: 'recruiterId is required'
      });
    }

    // 🔥 SKILL NORMALIZATION + VALIDATION
    const { normalizedSkills, invalidSkills } = await normalizeSkills(skills);

    if (invalidSkills.length > 0) {
      return res.status(400).json({
        success: false,
        error: true,
        message: `❌ Invalid skills found: ${invalidSkills.join(', ')}`,
        invalidSkills
      });
    }

    const experienceObj = convertExperience(experience);

    const jobData = {
      jobName: (jobName || '').trim(),
      jobTitle: (jobTitle || '').trim(),
      jobDescription: (jobDescription || '').trim(),
      skills: normalizedSkills, // ✅ ONLY canonical skills
      experience: experienceObj,
      recruiterId
    };

    if (companyId) {
      jobData.companyId = companyId;
    }

    console.log('💾 Saving jobData:', jobData);

    const newJob = new Job(jobData);
    await newJob.save();

    const populatedJob = await Job.findById(newJob._id)
      .populate('companyId', 'companyName companyTitle');

    res.status(201).json({
      success: true,
      job: populatedJob || newJob,
      message: '✅ Job posted successfully!'
    });

  } catch (error) {
    console.error('💥 Job POST ERROR:', error);
    res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Failed to create job'
    });
  }
});

/**
 * ✅ GET JOBS BY RECRUITER
 */
router.get('/:recruiterId', async (req, res) => {
  try {
    const jobs = await Job.find({ recruiterId: req.params.recruiterId })
      .populate('companyId', 'companyName companyTitle')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json([]);
  }
});

/**
 * ✅ DELETE JOB
 */
router.delete('/:id', async (req, res) => {
  try {
    const deletedJob = await Job.findByIdAndDelete(req.params.id);
    if (!deletedJob) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ message: '✅ Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ JOB DETAIL
 */
router.get('/detail/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('companyId', 'companyName companyTitle location')
      .populate('matchedUsers', 'name email');

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// put means edit job 
router.put('/:id', async (req, res) => {
  try {
    const { jobName, jobTitle, jobDescription, skills, experience, companyId } = req.body;

    const { normalizedSkills, invalidSkills } = await normalizeSkills(skills);
    if (invalidSkills.length > 0) {
      return res.status(400).json({
        success: false,
        message: `❌ Invalid skills: ${invalidSkills.join(', ')}`,
        invalidSkills,
      });
    }



    
    const experienceObj = convertExperience(experience);

    const updateData = {
      jobName:        (jobName || '').trim(),
      jobTitle:       (jobTitle || '').trim(),
      jobDescription: (jobDescription || '').trim(),
      skills:         normalizedSkills,
      experience:     experienceObj,
    };
    if (companyId) updateData.companyId = companyId;

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).populate('companyId', 'companyName companyTitle');

    if (!updatedJob) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    res.json({ success: true, job: updatedJob, message: '✅ Job updated!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
