const mongoose = require("mongoose")
const Schema = mongoose.Schema

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  occupation: {
    type: String,
    default: "",
  },
  location: {
    type: String,
    default: "",
  },
  socialLinks: {
    type: [String],
    default: [],
  },
  profilePhoto: {
    type: String,
    default: "",
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("User", UserSchema)

