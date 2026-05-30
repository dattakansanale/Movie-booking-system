const path = require("path")
const mysql = require("mysql2/promise")

require("dotenv").config({ path: path.join(__dirname, "../.env") })

const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "movie_booking_system",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

const pool = mysql.createPool(dbConfig)

const testConnection = async () => {
  try {
    const connection = await pool.getConnection()
    console.log(`MySQL database connected on ${dbConfig.host}:${dbConfig.port}`)
    connection.release()
  } catch (error) {
    console.error("MySQL database connection failed:", error.message || error.code)
    process.exit(1)
  }
}

testConnection()

module.exports = pool
