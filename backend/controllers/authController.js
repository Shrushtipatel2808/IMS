const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const createTransporter = () => {
  // Explicit SMTP override from env (works for Gmail, iCloud, custom SMTP)
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: String(process.env.EMAIL_SECURE || "false") === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Default to Gmail service (user requested Gmail switch)
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const transporter = createTransporter();


// SIGNUP
exports.signupUser = async (req, res) => {
  try {

    const { name, password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    const token = generateToken(user._id);

    res.json({
      message: "Signup successful",
      token
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Signup error"
    });

  }
};


// LOGIN
exports.loginUser = async (req, res) => {
  try {

    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = generateToken(user._id);

    res.json({
      message: "Login successful",
      token
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Login error"
    });

  }
};


// SEND OTP (NO EMAIL)
exports.sendOTP = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email || "");

    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await user.save();

    const emailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

    if (!emailConfigured) {
      return res.status(500).json({
        message: "Email service not configured"
      });
    }

    await transporter.sendMail({
      from: `"IMS Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP - Inventory Management System",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#2563eb;">Password Reset</h2>
          <p>Your OTP code is:</p>
          <h1 style="letter-spacing:8px;text-align:center;color:#1e293b;">${otp}</h1>
          <p style="color:#64748b;font-size:14px;">This code expires in <strong>5 minutes</strong>.</p>
          <p style="color:#64748b;font-size:13px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    res.json({
      message: "OTP sent to email"
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Failed to send OTP"
    });

  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {

  try {
    const email = normalizeEmail(req.body?.email || "");
    const otp = String(req.body?.otp || "").trim();
    const { newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "Email, OTP, and new password are required"
      });
    }

    const user = await User.findOne({ email });

    if (!user || user.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP"
      });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({
        message: "OTP expired"
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    res.json({
      message: "Password reset successful"
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Reset password error"
    });

  }
};
