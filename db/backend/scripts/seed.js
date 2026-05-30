const mysql = require("mysql2/promise")
const path = require("path")

require("dotenv").config({ path: path.join(__dirname, "../.env") })

const seedDatabase = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "movie_booking_system",
  })

  try {
    console.log("🌱 Starting MySQL database seeding...")

    // Clear existing data
    await connection.execute("SET FOREIGN_KEY_CHECKS = 0")
    await connection.execute("TRUNCATE TABLE booking_seats")
    await connection.execute("TRUNCATE TABLE bookings")
    await connection.execute("TRUNCATE TABLE showtimes")
    await connection.execute("TRUNCATE TABLE seats")
    await connection.execute("TRUNCATE TABLE theaters")
    await connection.execute("TRUNCATE TABLE movies")
    await connection.execute("TRUNCATE TABLE users")
    await connection.execute("SET FOREIGN_KEY_CHECKS = 1")

    // Insert sample movies into MySQL
    const movies = [
      [
        "Avengers: Endgame",
        "The epic conclusion to the Infinity Saga.",
        181,
        "Action/Adventure",
        8.4,
        "https://via.placeholder.com/300x400",
        "2024-01-15",
        "now_showing",
      ],
      [
        "The Dark Knight",
        "Batman raises the stakes in his war on crime.",
        152,
        "Action/Crime",
        9.0,
        "https://via.placeholder.com/300x400",
        "2024-01-20",
        "now_showing",
      ],
      [
        "Inception",
        "A thief who steals corporate secrets through dream-sharing technology.",
        148,
        "Sci-Fi/Thriller",
        8.8,
        "https://via.placeholder.com/300x400",
        "2024-02-01",
        "now_showing",
      ],
      [
        "Interstellar",
        "A team of explorers travel through a wormhole in space.",
        169,
        "Sci-Fi/Drama",
        8.6,
        "https://via.placeholder.com/300x400",
        "2024-02-15",
        "now_showing",
      ],
      [
        "The Matrix",
        "A computer programmer is led to fight an underground war.",
        136,
        "Sci-Fi/Action",
        8.7,
        "https://via.placeholder.com/300x400",
        "2024-03-01",
        "coming_soon",
      ],
      [
        "Pulp Fiction",
        "The lives of two mob hitmen intertwine in four tales.",
        154,
        "Crime/Drama",
        8.9,
        "https://via.placeholder.com/300x400",
        "2024-03-15",
        "coming_soon",
      ],
    ]

    for (const movie of movies) {
      await connection.execute(
        "INSERT INTO movies (title, description, duration, genre, rating, poster_url, release_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        movie,
      )
    }

    // Insert theaters into MySQL
    const theaters = [
      ["Grand Cinema Hall 1", "Downtown Plaza, Screen 1", 100],
      ["Grand Cinema Hall 2", "Downtown Plaza, Screen 2", 120],
      ["Multiplex Theater A", "Mall Complex, Theater A", 150],
      ["Multiplex Theater B", "Mall Complex, Theater B", 80],
      ["IMAX Theater", "Entertainment District", 200],
    ]

    for (const theater of theaters) {
      await connection.execute("INSERT INTO theaters (name, location, total_seats) VALUES (?, ?, ?)", theater)
    }

    // Generate seats for each theater in MySQL
    const [theaterResults] = await connection.execute("SELECT id, total_seats FROM theaters")

    for (const theater of theaterResults) {
      for (let i = 1; i <= theater.total_seats; i++) {
        const row = String.fromCharCode(65 + Math.floor((i - 1) / 10))
        const seatNum = String(((i - 1) % 10) + 1).padStart(2, "0")
        const seatNumber = `${row}${seatNum}`

        let seatType = "regular"
        if (i > theater.total_seats * 0.6 && i <= theater.total_seats * 0.9) {
          seatType = "premium"
        } else if (i > theater.total_seats * 0.9) {
          seatType = "vip"
        }

        await connection.execute("INSERT INTO seats (theater_id, seat_number, seat_type) VALUES (?, ?, ?)", [
          theater.id,
          seatNumber,
          seatType,
        ])
      }
    }

    // Generate showtimes for the next 7 days in MySQL
    const [movieResults] = await connection.execute('SELECT id FROM movies WHERE status = "now_showing"')
    const times = ["10:00:00", "13:00:00", "16:00:00", "19:00:00", "22:00:00"]

    for (let day = 0; day < 7; day++) {
      const date = new Date()
      date.setDate(date.getDate() + day)
      const showDate = date.toISOString().split("T")[0]

      for (const movie of movieResults) {
        for (const theater of theaterResults) {
          for (const time of times) {
            const price = theater.id === 5 ? 25.0 : 15.0

            await connection.execute(
              "INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, price, available_seats) VALUES (?, ?, ?, ?, ?, ?)",
              [movie.id, theater.id, showDate, time, price, theater.total_seats],
            )
          }
        }
      }
    }

    console.log("✅ MySQL Database seeded successfully!")
    console.log(`📊 Inserted:`)
    console.log(`   - ${movies.length} movies`)
    console.log(`   - ${theaters.length} theaters`)
    console.log(`   - ${theaterResults.reduce((sum, t) => sum + t.total_seats, 0)} seats`)
    console.log(`   - ${movieResults.length * theaterResults.length * times.length * 7} showtimes`)
  } catch (error) {
    console.error("❌ MySQL Seeding failed:", error)
  } finally {
    await connection.end()
  }
}

if (require.main === module) {
  seedDatabase()
}

module.exports = seedDatabase
