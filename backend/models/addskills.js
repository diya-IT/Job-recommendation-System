const mongoose = require("mongoose");
const skillsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  skills: [{ type: String }],

  experience: {
    years: { type: Number, default: 0 },
    months: { type: Number, default: 0 } // ✅ ADD THIS
  },

  level: {
    type: String,
    enum: ["Fresher", "Experienced"],
    default: "Fresher"
  },

  location: {
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    country: { type: String, default: "India" },
    lat: Number,
    lng: Number
  },

  projects: [{
    title: { type: String, required: true },
    url: { type: String, required: true },
    techUsed: [{ type: String }],
    status: {
      type: String,
      enum: ["Verified", "Not Verified"],
      default: "Not Verified"
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model("Skills", skillsSchema);
