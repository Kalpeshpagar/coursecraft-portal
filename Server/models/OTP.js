// File: models/OTP.js

const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

// Secure OTP Generator
function generateSecureOTP() {
  return crypto.randomInt(100000, 999999).toString(); // 6-digit numeric OTP
}

// Sends verification email with OTP
async function sendVerificationEmail(email, otp) {
  try {
    await mailSender(email, "Verification Email", emailTemplate(otp));
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
}

// MongoDB OTP Schema
const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 5, // Auto-delete after 5 minutes
  },
});

// Pre-save Hook: Hash OTP & Send Email
OTPSchema.pre("save", async function (next) {
  if (this.isNew) {
    const plainOTP = this.otp; // Save original to email
    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(plainOTP, salt); // Hash before saving
    await sendVerificationEmail(this.email, plainOTP); // Send unhashed OTP to user
  }
  next();
});

// Method to Compare OTPs
OTPSchema.methods.verifyOTP = async function (inputOTP) {
  return await bcrypt.compare(inputOTP, this.otp);
};

const OTP = mongoose.model("OTP", OTPSchema);

module.exports = { OTP, generateSecureOTP };
