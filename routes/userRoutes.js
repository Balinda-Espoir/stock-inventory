
const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { protect, superAdminOnly } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

async function createAccount(req, res, role) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role
    });

    return res.status(201).json({
      message: `${role} created successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message
    });
  }
}

// Only Super Admin creates Admins
router.post("/admins", async (req, res, next) => {
  if (req.user.role !== "superadmin") {
    return res.status(403).json({
      message: "Only Super Admin can create Admins"
    });
  }

  return createAccount(req, res, "admin");
});

// Only Admin creates Store Keepers
router.post("/storekeepers", async (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Only Admin can create Store Keepers"
    });
  }

  return createAccount(req, res, "storekeeper");
});

// Only Store Keeper creates regular users
router.post("/staff", async (req, res, next) => {
  if (req.user.role !== "storekeeper") {
    return res.status(403).json({
      message: "Only Store Keeper can create regular users"
    });
  }

  return createAccount(req, res, "staff");
});

// GET: Get all users
router.get("/", protect, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Get one user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: "Invalid user ID" });
  }
});

// PUT: Update a user
router.put("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE: Delete a user
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Invalid user ID" });
  }
});

module.exports = router;
