const express = require("express");
const router = express.Router();

const {
  signupUser,
  loginUser,
  sendOTP,
  resetPassword,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

// Helper function to show correct method usage
const methodHint = (endpoint, expectedMethod, sampleBody = null) => {
  const payload = {
    message: `Use ${expectedMethod} ${endpoint} (not GET in browser)`
  };

  if (sampleBody) {
    payload.sampleBody = sampleBody;
  }

  return payload;
};

// Prevent using browser GET for POST APIs

router.get("/login", (_req, res) => {
  res.status(405).json(
    methodHint("/api/auth/login", "POST", {
      email: "you@example.com",
      password: "your-password",
    })
  );
});

router.get("/signup", (_req, res) => {
  res.status(405).json(
    methodHint("/api/auth/signup", "POST", {
      name: "Your Name",
      email: "you@example.com",
      password: "your-password",
    })
  );
});

router.get("/send-otp", (_req, res) => {
  res.status(405).json(
    methodHint("/api/auth/send-otp", "POST", {
      email: "you@example.com",
    })
  );
});

router.get("/reset-password", (_req, res) => {
  res.status(405).json(
    methodHint("/api/auth/reset-password", "POST", {
      email: "you@example.com",
      otp: "123456",
      newPassword: "new-password",
    })
  );
});

// Actual API routes

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/send-otp", sendOTP);
router.post("/reset-password", resetPassword);

// Current user profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email role createdAt");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;