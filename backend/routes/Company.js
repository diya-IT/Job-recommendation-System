const express = require("express");
const router = express.Router();
const Company = require("../models/Company");

/* =====================================================
   ✅ GET ALL COMPANIES (Admin Panel)
===================================================== */
router.get("/", async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =====================================================
   ✅ UPDATE STATUS (Approve / Reject)
===================================================== */
router.put("/:id/status", async (req, res) => {
  try {
    const { status, adminId } = req.body;

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewedBy: adminId,
        reviewedAt: new Date()
      },
      { new: true }
    );

    if (!updatedCompany) {
      return res.status(404).json({ error: "Company not found" });
    }

    res.json({
      message: "Company status updated",
      company: updatedCompany
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =====================================================
   ✅ DELETE COMPANY (optional admin control)
===================================================== */
router.delete("/:id", async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.json({ message: "Company deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =====================================================
   ✅ GET SINGLE COMPANY (optional details modal)
===================================================== */
router.get("/:id", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ===========================
// GET TOTAL COMPANIES COUNT
// ===========================


module.exports = router;