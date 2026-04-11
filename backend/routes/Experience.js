const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Experience = require('../models/experience'); // Adjust path to your models
const Skills = require('../models/addskills'); // optional

// ===================== ADD EXPERIENCE =====================
router.post('/add/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('[ADD] User ID:', userId);
    console.log('[ADD] Request body:', req.body);

    const experience = new Experience({
      userId: userId,
      skillsId: req.body.skillsId || null, // optional
      jobTitle: req.body.jobTitle,
      company: req.body.company,
      responsibilities: Array.isArray(req.body.responsibilities)
        ? req.body.responsibilities
        : req.body.responsibilities
          ? [req.body.responsibilities]
          : [],
      type: req.body.type || 'Full-time'
    });

    const savedExperience = await experience.save();
    console.log('[ADD] Saved experience:', savedExperience);

    res.status(201).json({
      message: 'Experience added successfully!',
      experience: savedExperience
    });

  } catch (error) {
    console.error('[ADD] Error:', error);
    res.status(400).json({ error: error.message || 'Failed to add experience' });
  }
});

// ===================== GET EXPERIENCE =====================
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('[GET] User ID:', userId);

    const experiences = await Experience.find({ userId })
      .populate('skillsId', 'level experience');

    console.log('[GET] Fetched experiences:', experiences);
    res.json(experiences);

  } catch (error) {
    console.error('[GET] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================== UPDATE OR ADD EXPERIENCE BY USERID =====================
router.put('/update/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('[UPDATE] User ID:', userId);
    console.log('[UPDATE] Request body:', req.body);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const responsibilities = Array.isArray(req.body.responsibilities)
      ? req.body.responsibilities
      : req.body.responsibilities
        ? [req.body.responsibilities]
        : [];

    // 🔹 Find existing experience for this user
    let experience = await Experience.findOne({ userId });
    console.log('[UPDATE] Found experience:', experience);

    if (experience) {
      // 🔁 Update
      experience.jobTitle = req.body.jobTitle;
      experience.company = req.body.company;
      experience.type = req.body.type || 'Full-time';
      experience.responsibilities = responsibilities;

      await experience.save();
      console.log('[UPDATE] Experience updated:', experience);

    } else {
      // ➕ Create new
      experience = new Experience({
        userId,
        jobTitle: req.body.jobTitle,
        company: req.body.company,
        type: req.body.type || 'Full-time',
        responsibilities
      });

      await experience.save();
      console.log('[UPDATE] Experience created:', experience);
    }

    res.json({ message: 'Experience saved successfully!', experience });

  } catch (error) {
    console.error('[UPDATE] Error:', error);
    res.status(400).json({ error: error.message || 'Failed to save experience' });
  }
});

module.exports = router;
