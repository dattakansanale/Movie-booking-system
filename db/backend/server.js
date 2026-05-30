const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const rateLimit = require("express-rate-limit")
const path = require("path")
require("dotenv").config({ path: path.join(__dirname, ".env") })

const authRoutes = require("./routes/auth")
const movieRoutes = require("./routes/movies")
const showtimeRoutes = require("./routes/showtimes")
const bookingRoutes = require("./routes/bookings")
const theaterRoutes = require("./routes/theaters")

const app = express()
const PORT = process.env.PORT || 5000

console.log("🚀 Starting MovieBook Server...")
console.log("Environment:", process.env.NODE_ENV || "development")

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }),
)

// CORS - Allow all origins for development
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  }),
)

// Handle preflight requests
app.options("*", cors())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for development
  message: { error: "Too many requests from this IP, please try again later." },
})
app.use("/api/", limiter)

// Logging
app.use(morgan("combined"))

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Serve static files (for frontend)
app.use(express.static(path.join(__dirname, "../frontend")))

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/movies", movieRoutes)
app.use("/api/showtimes", showtimeRoutes)
app.use("/api/bookings", bookingRoutes)
app.use("/api/theaters", theaterRoutes)

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: "connected",
  })
})

// Debug endpoint to test API
app.get("/api/test", (req, res) => {
  console.log("🧪 API test endpoint hit")
  res.json({
    message: "API is working!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  })
})

// Serve frontend for all non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"))
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("💥 Server Error:", err.stack)
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  })
})

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  console.log("❌ API route not found:", req.originalUrl)
  res.status(404).json({ error: "API route not found" })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🌐 Frontend: http://localhost:${PORT}`)
  console.log(`🔧 API Test: http://localhost:${PORT}/api/test`)
  console.log(`📝 Registration: http://localhost:${PORT}/register.html`)
  console.log(`🔐 Login: http://localhost:${PORT}/login.html`)
  console.log(`🎬 Movies: http://localhost:${PORT}/movies.html`)
})

module.exports = app
