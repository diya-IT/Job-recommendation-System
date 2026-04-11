// models/SkillsMaster.js
const mongoose = require("mongoose");

const skillMasterSchema = new mongoose.Schema({
  canonical: String,
  aliases: [String],
  category: String,
}, { collection: "skillsmasters" }); // 👈 explicit

module.exports = mongoose.model("SkillsMaster", skillMasterSchema);
