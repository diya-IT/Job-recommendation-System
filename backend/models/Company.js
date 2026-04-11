const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  companyTitle: {
    type: String,
    required: true,
    trim: true
  },
  companyWebsite: { 
    type: String,
    required: [true, 'Company website is required'],
    trim: true,
    unique: true,  //  ONE RECRUITER PER COMPANY - No duplicate websites!
    match: [/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i, 'Please enter a valid website URL']
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'approved', 'rejected'],  //  Has 'verified'
    default: 'pending'  //  Admin-only companies start as 'pending'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true  // Adds updatedAt automatically
});

module.exports = mongoose.model('Company', companySchema);
