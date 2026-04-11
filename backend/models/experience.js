// models/Experience.js
const mongoose = require("mongoose");
const experienceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  skillsId: { type: mongoose.Schema.Types.ObjectId, ref: "Skills" }, // 🔥 OPTIONAL now
  jobTitle: { type: String, required: true },
  company: { type: String, required: true },
  responsibilities: [String],
  type: { type: String, enum: ["Full-time", "Part-time", "Contract", "Freelance", "Internship"], default: "Full-time" }
}, { timestamps: true });

module.exports = mongoose.model("Experience", experienceSchema);
