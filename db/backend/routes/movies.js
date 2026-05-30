const express = require("express")
const { query } = require("express-validator")
const db = require("../config/database")

const router = express.Router()

// Get all movies from MySQL
router.get(
  "/",
  [query("status").optional().isIn(["now_showing", "coming_soon", "ended"]).withMessage("Invalid status")],
  async (req, res) => {
    try {
      const { status = "now_showing" } = req.query

      const [movies] = await db.execute(
        `SELECT id, title, description, duration, genre, rating, poster_url, release_date, status 
       FROM movies 
       WHERE status = ? 
       ORDER BY release_date DESC`,
        [status],
      )

      res.json(movies)
    } catch (error) {
      console.error("Movies fetch error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },
)

// Get movie by ID from MySQL
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params

    const [movies] = await db.execute(
      `SELECT id, title, description, duration, genre, rating, poster_url, release_date, status 
       FROM movies 
       WHERE id = ?`,
      [id],
    )

    if (movies.length === 0) {
      return res.status(404).json({ error: "Movie not found" })
    }

    res.json(movies[0])
  } catch (error) {
    console.error("Movie fetch error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get showtimes for a movie from MySQL
router.get(
  "/:id/showtimes",
  [query("date").optional().isISO8601().withMessage("Invalid date format")],
  async (req, res) => {
    try {
      const { id } = req.params
      const { date = new Date().toISOString().split("T")[0] } = req.query

      const [showtimes] = await db.execute(
        `SELECT 
        s.id,
        s.show_date,
        s.show_time,
        s.price,
        s.available_seats,
        t.name as theater_name,
        t.location as theater_location,
        t.total_seats
       FROM showtimes s
       JOIN theaters t ON s.theater_id = t.id
       WHERE s.movie_id = ? AND s.show_date = ?
       ORDER BY s.show_time`,
        [id, date],
      )

      res.json(showtimes)
    } catch (error) {
      console.error("Showtimes fetch error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },
)

module.exports = router
