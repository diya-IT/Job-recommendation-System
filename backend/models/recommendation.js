const mongoose = require("mongoose");

const jobMatchSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },

  matchedSkills: {
    type: [String],
    required: true
  },

  missingSkills: {
    type: [String],
    required: true
  },

  skillMatchPer: {
    type: Number,
    required: true
  },

  experienceMatchPer: {
    type: Number,
    required: true
  },

  jobFitScore: {
    type: Number,
    required: true
  },

  fitStatus: {
    type: String,
    enum: ["Strong", "Partial", "Not Fit"],
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model("JobMatch", jobMatchSchema);