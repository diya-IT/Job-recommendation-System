const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const profile = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    photo: {
      type: String, // path to uploaded photo
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profile);
