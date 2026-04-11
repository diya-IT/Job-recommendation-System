const express = require("express");
const router = express.Router();
const Company = require("../models/Company");
const { model } = require("mongoose");
router.get("/", async (req, res) => {
  try {
    const count = await Company.countDocuments({});
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// ================= COMPANY STATS =================
router.get("/Stats", async (req, res) => {
  try {
    const total = await Company.countDocuments({});
    const approved = await Company.countDocuments({ status: "approved" });
    const pending = await Company.countDocuments({ status: "pending" });

    res.json({
      total,
      approved,
      pending
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;