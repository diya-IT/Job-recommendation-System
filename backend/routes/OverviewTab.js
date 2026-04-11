const express = require('express');
const router = express.Router();
const User = require("../models/User");
const Skillsmaster = require("../models/skills_mastertable");  // Your model name
const Company = require("../models/Company");  // Fixed capitalization

// ================= 1. COMPANY COUNTS =================
router.get('/adcompany/Stats', async (req, res) => {
  try {
    const [total, approved, pending] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ status: 'approved' }),
      Company.countDocuments({ status: 'pending' })
    ]);

    res.json({ 
      total,        // Total Companies
      approved,     // Approved Companies  
      pending       // Pending Companies
    });
  } catch (err) {
    res.status(500).json({ error: 'Company stats failed' });
  }
});

// ================= 2. USER COUNTS =================
router.get('/admin/users/counts', async (req, res) => {
  try {
    const [totalUsers, activeUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ 
        $or: [
          { isActive: true },
          { lastActive: { $gte: new Date(Date.now() - 30*24*60*60*1000) } } // Last 30 days
        ]
      })
    ]);

    res.json({ 
      total: totalUsers,
      active: activeUsers,
      count: totalUsers  // Frontend expects 'count' sometimes
    });
  } catch (err) {
    res.status(500).json({ error: 'User stats failed' });
  }
});

// ================= 3. SKILLS COUNT =================  
router.get('/skillmaster/count', async (req, res) => {
  try {
    const count = await Skillsmaster.countDocuments();  // Fixed: Skillsmaster
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Skills count failed' });
  }
});

module.exports = router;