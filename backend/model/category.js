const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const categorySchema = new mongoose.Schema({
  title:{
    type: String,
    required: [true, "Please enter your Title!"],
  }
 },
);

module.exports = mongoose.model("Category", categorySchema);
