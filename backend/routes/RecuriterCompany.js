// routes/reccompanies.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Company = require('../models/Company'); // Make sure path is correct

// GET companies by recruiter ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Requested recruiter ID:', id);

    // Check if ID is provided
    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Recruiter ID is required' });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid recruiter ID format' });
    }

    // Find companies with that recruiterId
    const companies = await Company.find({ recruiterId: id }) // No need to wrap in ObjectId
      .select('_id companyName companyTitle companyWebsite recruiterId status adminNotes createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    console.log('Found companies:', companies.length);

    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies,
      hasApprovedCompanies: companies.some(c => c.status?.toLowerCase() === 'approved')
    });

  } catch (error) {
    console.error('❌ Error fetching companies:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});





module.exports = router;