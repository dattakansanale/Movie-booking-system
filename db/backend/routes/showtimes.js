const express = require("express")
const db = require("../config/database")

const router = express.Router()

// Get seats for a showtime from MySQL
router.get("/:id/seats", async (req, res) => {
  try {
    const { id } = req.params

    const [seats] = await db.execute(
      `SELECT 
        s.id,
        s.seat_number,
        s.seat_type,
        CASE WHEN bs.seat_id IS NOT NULL THEN 1 ELSE 0 END as is_booked
       FROM showtimes st
       JOIN theaters t ON st.theater_id = t.id
       JOIN seats s ON t.id = s.theater_id
       LEFT JOIN booking_seats bs ON s.id = bs.seat_id
       LEFT JOIN bookings b ON bs.booking_id = b.id AND b.showtime_id = st.id AND b.status = 'confirmed'
       WHERE st.id = ?
       ORDER BY s.seat_number`,
      [id],
    )

    res.json(seats)
  } catch (error) {
    console.error("Seats fetch error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get showtime details from MySQL
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params

    const [showtimes] = await db.execute(
      `SELECT 
        s.id,
        s.show_date,
        s.show_time,
        s.price,
        s.available_seats,
        m.title as movie_title,
        m.duration,
        m.rating,
        t.name as theater_name,
        t.location as theater_location,
        t.total_seats
       FROM showtimes s
       JOIN movies m ON s.movie_id = m.id
       JOIN theaters t ON s.theater_id = t.id
       WHERE s.id = ?`,
      [id],
    )

    if (showtimes.length === 0) {
      return res.status(404).json({ error: "Showtime not found" })
    }

    res.json(showtimes[0])
  } catch (error) {
    console.error("Showtime fetch error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

module.exports = router
