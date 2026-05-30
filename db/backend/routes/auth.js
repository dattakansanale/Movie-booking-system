const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { body, validationResult } = require("express-validator")
const db = require("../config/database")

const router = express.Router()

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" })
}

// Register
router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("phone").optional().isMobilePhone().withMessage("Please provide a valid phone number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { name, email, password, phone } = req.body

      // Check if user already exists
      const [existingUsers] = await db.execute("SELECT id FROM users WHERE email = ?", [email])

      if (existingUsers.length > 0) {
        return res.status(400).json({ error: "User already exists with this email" })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Create user in MySQL
      const [result] = await db.execute("INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)", [
        name,
        email,
        hashedPassword,
        phone,
      ])

      const userId = result.insertId
      const token = generateToken(userId)

      res.status(201).json({
        message: "User created successfully",
        token,
        user: { id: userId, name, email, phone },
      })
    } catch (error) {
      console.error("Registration error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },
)

// Login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { email, password } = req.body

      // Find user in MySQL
      const [users] = await db.execute("SELECT id, name, email, password, phone FROM users WHERE email = ?", [email])

      if (users.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" })
      }

      const user = users[0]

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" })
      }

      const token = generateToken(user.id)

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },
)

module.exports = router
