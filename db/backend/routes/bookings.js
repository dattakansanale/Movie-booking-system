const express = require("express")
const { body, validationResult } = require("express-validator")
const { authenticateToken } = require("../middleware/auth")
const db = require("../config/database")

const router = express.Router()

// Create booking - Updates MySQL database
router.post(
  "/",
  authenticateToken,
  [
    body("showtimeId").isInt().withMessage("Valid showtime ID required"),
    body("seatIds").isArray({ min: 1 }).withMessage("At least one seat must be selected"),
  ],
  async (req, res) => {
    const connection = await db.getConnection()

    try {
      console.log("🎫 Booking attempt by user:", req.user.id)

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        console.log("❌ Validation errors:", errors.array())
        return res.status(400).json({ error: errors.array()[0].msg })
      }

      const { showtimeId, seatIds } = req.body
      const userId = req.user.id

      console.log("Booking details:", { userId, showtimeId, seatIds })

      await connection.beginTransaction()

      // Get showtime details from MySQL
      const [showtimes] = await connection.execute("SELECT price, available_seats FROM showtimes WHERE id = ?", [
        showtimeId,
      ])

      if (showtimes.length === 0) {
        await connection.rollback()
        console.log("❌ Showtime not found:", showtimeId)
        return res.status(404).json({ error: "Showtime not found" })
      }

      const showtime = showtimes[0]
      console.log("Showtime found:", showtime)

      // Check if enough seats are available
      if (showtime.available_seats < seatIds.length) {
        await connection.rollback()
        console.log("❌ Not enough seats available")
        return res.status(400).json({ error: "Not enough seats available" })
      }

      // Check if seats are already booked in MySQL
      const placeholders = seatIds.map(() => "?").join(",")
      const [bookedSeats] = await connection.execute(
        `SELECT bs.seat_id 
         FROM booking_seats bs
         JOIN bookings b ON bs.booking_id = b.id
         WHERE b.showtime_id = ? AND b.status = 'confirmed' AND bs.seat_id IN (${placeholders})`,
        [showtimeId, ...seatIds],
      )

      if (bookedSeats.length > 0) {
        await connection.rollback()
        console.log("❌ Some seats are already booked:", bookedSeats)
        return res.status(400).json({ error: "Some seats are already booked" })
      }

      // Calculate total amount based on seat types from MySQL
      const [seatDetails] = await connection.execute(
        `SELECT seat_type FROM seats WHERE id IN (${placeholders})`,
        seatIds,
      )

      let totalAmount = 0
      seatDetails.forEach((seat) => {
        switch (seat.seat_type) {
          case "premium":
            totalAmount += showtime.price * 1.5
            break
          case "vip":
            totalAmount += showtime.price * 2
            break
          default:
            totalAmount += showtime.price
        }
      })

      console.log("Total amount calculated:", totalAmount)

      // Generate booking reference
      const bookingReference =
        "BK" + Date.now().toString().slice(-6) + Math.random().toString(36).substring(2, 5).toUpperCase()

      // Create booking in MySQL
      const [bookingResult] = await connection.execute(
        `INSERT INTO bookings (user_id, showtime_id, seats_booked, total_amount, booking_reference)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, showtimeId, seatIds.length, totalAmount, bookingReference],
      )

      const bookingId = bookingResult.insertId
      console.log("Booking created with ID:", bookingId)

      // Add booking seats to MySQL
      for (const seatId of seatIds) {
        await connection.execute("INSERT INTO booking_seats (booking_id, seat_id) VALUES (?, ?)", [bookingId, seatId])
      }

      // Update available seats in MySQL
      await connection.execute("UPDATE showtimes SET available_seats = available_seats - ? WHERE id = ?", [
        seatIds.length,
        showtimeId,
      ])

      await connection.commit()

      console.log("✅ Booking successful:", {
        bookingId,
        bookingReference,
        totalAmount,
        seatsBooked: seatIds.length,
      })

      res.status(201).json({
        message: "Booking successful",
        bookingId,
        bookingReference,
        totalAmount,
      })
    } catch (error) {
      await connection.rollback()
      console.error("❌ Booking error:", error)
      res.status(500).json({ error: "Internal server error" })
    } finally {
      connection.release()
    }
  },
)

// Get user bookings from MySQL
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    console.log("📋 Fetching bookings for user:", userId)

    const [bookings] = await db.execute(
      `SELECT 
        b.id,
        b.booking_reference,
        b.seats_booked,
        b.total_amount,
        b.booking_date,
        b.status,
        m.title as movie_title,
        m.poster_url,
        s.show_date,
        s.show_time,
        t.name as theater_name,
        t.location as theater_location
       FROM bookings b
       JOIN showtimes s ON b.showtime_id = s.id
       JOIN movies m ON s.movie_id = m.id
       JOIN theaters t ON s.theater_id = t.id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC`,
      [userId],
    )

    console.log("✅ Found bookings for user", userId, ":", bookings.length)
    console.log(
      "Bookings data:",
      bookings.map((b) => ({
        id: b.id,
        reference: b.booking_reference,
        movie: b.movie_title,
        status: b.status,
      })),
    )

    res.json(bookings)
  } catch (error) {
    console.error("❌ Bookings fetch error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Cancel booking - Updates MySQL database
router.post("/:id/cancel", authenticateToken, async (req, res) => {
  const connection = await db.getConnection()

  try {
    const { id } = req.params
    const userId = req.user.id

    console.log("❌ Cancelling booking:", id, "for user:", userId)

    await connection.beginTransaction()

    // Get booking details from MySQL
    const [bookings] = await connection.execute(
      "SELECT user_id, showtime_id, seats_booked, status FROM bookings WHERE id = ?",
      [id],
    )

    if (bookings.length === 0) {
      await connection.rollback()
      console.log("❌ Booking not found:", id)
      return res.status(404).json({ error: "Booking not found" })
    }

    const booking = bookings[0]

    // Check if user owns the booking
    if (booking.user_id !== userId) {
      await connection.rollback()
      console.log("❌ Unauthorized cancellation attempt")
      return res.status(403).json({ error: "Unauthorized" })
    }

    // Check if booking is already cancelled
    if (booking.status === "cancelled") {
      await connection.rollback()
      console.log("❌ Booking already cancelled")
      return res.status(400).json({ error: "Booking already cancelled" })
    }

    // Cancel booking in MySQL
    await connection.execute('UPDATE bookings SET status = "cancelled" WHERE id = ?', [id])

    // Update available seats in MySQL
    await connection.execute("UPDATE showtimes SET available_seats = available_seats + ? WHERE id = ?", [
      booking.seats_booked,
      booking.showtime_id,
    ])

    await connection.commit()

    console.log("✅ Booking cancelled successfully")
    res.json({ message: "Booking cancelled successfully" })
  } catch (error) {
    await connection.rollback()
    console.error("❌ Booking cancellation error:", error)
    res.status(500).json({ error: "Internal server error" })
  } finally {
    connection.release()
  }
})

module.exports = router
