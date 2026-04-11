const express = require("express");
const router = express.Router();
const Skill = require("../models/skills_mastertable");

/* ===========================
   GET ALL SKILLS
=========================== */
router.get("/", async (req, res) => {
  try {
    const skills = await Skill.find().sort({ createdAt: -1 });
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch skills" });
  }
});

/* ===========================
   CREATE SKILL
=========================== */
router.post("/", async (req, res) => {
  try {
    const { canonical, aliases, category } = req.body;

    const newSkill = new Skill({
      canonical,
      aliases,
      category
    });

    const saved = await newSkill.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: "Failed to create skill" });
  }
});

/* ===========================
   UPDATE SKILL
=========================== */
router.put("/:id", async (req, res) => {
  try {
    const updated = await Skill.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update skill" });
  }
});

/* ===========================
   DELETE SKILL
=========================== */
router.delete("/:id", async (req, res) => {
  try {
    await Skill.findByIdAndDelete(req.params.id);
    res.json({ message: "Skill deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete skill" });
  }
});

//====total skill count ==========
// ===========================
// GET SKILLS COUNT
// ===========================
router.get("/count", async (req, res) => {
  try {
    const count = await Skill.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Failed to get skills count" });
  }
});
module.exports = router;