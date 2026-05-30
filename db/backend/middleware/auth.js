const jwt = require("jsonwebtoken")
const db = require("../config/database")

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  console.log("🔐 Auth check - Token present:", !!token)

  if (!token) {
    console.log("❌ No token provided")
    return res.status(401).json({ error: "Access token required" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log("🔐 Token decoded:", decoded.userId)

    // Verify user still exists in MySQL
    const [users] = await db.execute("SELECT id, name, email FROM users WHERE id = ?", [decoded.userId])

    if (users.length === 0) {
      console.log("❌ User not found in database")
      return res.status(401).json({ error: "User not found" })
    }

    req.user = users[0]
    console.log("✅ Auth successful for user:", req.user.name)
    next()
  } catch (error) {
    console.error("❌ Token verification failed:", error.message)
    return res.status(403).json({ error: "Invalid or expired token" })
  }
}

module.exports = { authenticateToken }
