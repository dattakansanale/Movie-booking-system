const express = require("express")
const db = require("../config/database")

const router = express.Router()

// Get all theaters from MySQL
router.get("/", async (req, res) => {
  try {
    const [theaters] = await db.execute("SELECT id, name, location, total_seats FROM theaters ORDER BY name")

    res.json(theaters)
  } catch (error) {
    console.error("Theaters fetch error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get theater by ID from MySQL
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params

    const [theaters] = await db.execute("SELECT id, name, location, total_seats FROM theaters WHERE id = ?", [id])

    if (theaters.length === 0) {
      return res.status(404).json({ error: "Theater not found" })
    }

    res.json(theaters[0])
  } catch (error) {
    console.error("Theater fetch error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get seats for a theater from MySQL
router.get("/:id/seats", async (req, res) => {
  try {
    const { id } = req.params

    const [seats] = await db.execute(
      "SELECT id, seat_number, seat_type FROM seats WHERE theater_id = ? ORDER BY seat_number",
      [id],
    )

    res.json(seats)
  } catch (error) {
    console.error("Theater seats fetch error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

module.exports = router
