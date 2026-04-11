const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  jobName: {
    type: String,
    required: true,
    trim: true
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true
  },
  jobDescription: {
    type: String,
    required: true
  },
  skills: [{
    type: String,
    required: true
  }],
  experience: {
    type: {
      years: { type: Number, required: true, min: 0 },
      months: { type: Number, required: true, min: 0, max: 11 }
    },
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: false
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Closed', 'Draft'],
    default: 'Active'
  },
  applicants: {
    type: Number,
    default: 0
  },
  matchedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});
module.exports = mongoose.model('Job', jobSchema);