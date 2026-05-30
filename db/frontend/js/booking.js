// Booking page functionality
let selectedMovie = null
let selectedShowtime = null
let selectedSeats = []
let seatMap = []

document.addEventListener("DOMContentLoaded", () => {
  // Check authentication
  if (!window.requireAuth()) return

  // Get movie ID from session storage
  const movieId = sessionStorage.getItem("selectedMovieId")
  if (!movieId) {
    window.showToast("No movie selected", "error")
    setTimeout(() => {
      window.location.href = "movies.html"
    }, 1500)
    return
  }

  loadMovieAndInitialize(movieId)
})

async function loadMovieAndInitialize(movieId) {
  try {
    const response = await fetch(`${window.API_BASE_URL}/movies/${movieId}`)
    const movie = await response.json()

    selectedMovie = movie
    displayMovieInfo(movie)
    setupBookingSteps()
  } catch (error) {
    console.error("Error loading movie:", error)
    window.showToast("Failed to load movie details", "error")
    setTimeout(() => {
      window.location.href = "movies.html"
    }, 1500)
  }
}

function displayMovieInfo(movie) {
  const movieInfoEl = document.getElementById("movieInfo")
  movieInfoEl.innerHTML = `
    <div class="movie-poster-small">
      <i class="fas fa-film"></i>
    </div>
    <div class="movie-details-info">
      <h2>${movie.title}</h2>
      <div class="movie-meta">
        <span><i class="fas fa-clock"></i> ${movie.duration} min</span>
        <span><i class="fas fa-star"></i> ${movie.rating}</span>
        <span><i class="fas fa-tag"></i> ${movie.genre}</span>
      </div>
      <p>${movie.description}</p>
    </div>
  `
}

function setupBookingSteps() {
  // Set up date input
  const dateInput = document.getElementById("bookingDate")
  const today = new Date().toISOString().split("T")[0]
  dateInput.value = today
  dateInput.min = today

  dateInput.addEventListener("change", loadShowtimes)

  // Set up confirm booking button
  document.getElementById("confirmBooking").addEventListener("click", confirmBooking)

  // Load initial showtimes
  loadShowtimes()
}

async function loadShowtimes() {
  const date = document.getElementById("bookingDate").value
  if (!date || !selectedMovie) return

  try {
    const response = await fetch(`${window.API_BASE_URL}/movies/${selectedMovie.id}/showtimes?date=${date}`)
    const showtimes = await response.json()

    displayShowtimes(showtimes)
    activateStep("showtimeStep")
  } catch (error) {
    console.error("Error loading showtimes:", error)
    window.showToast("Failed to load showtimes", "error")
  }
}

function displayShowtimes(showtimes) {
  const container = document.getElementById("showtimesList")

  if (showtimes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-calendar-times"></i>
        <h3>No showtimes available</h3>
        <p>Please select a different date</p>
      </div>
    `
    return
  }

  container.innerHTML = ""

  showtimes.forEach((showtime) => {
    const card = document.createElement("div")
    card.className = "showtime-card"
    card.innerHTML = `
      <div class="showtime-time">
        <i class="fas fa-clock"></i>
        ${formatTime(showtime.show_time)}
      </div>
      <div class="showtime-details">
        <div><i class="fas fa-building"></i> ${showtime.theater_name}</div>
        <div><i class="fas fa-map-marker-alt"></i> ${showtime.theater_location}</div>
        <div><i class="fas fa-dollar-sign"></i> $${showtime.price} • <i class="fas fa-chair"></i> ${showtime.available_seats} seats available</div>
      </div>
    `

    card.addEventListener("click", () => selectShowtime(showtime, card))
    container.appendChild(card)
  })
}

async function selectShowtime(showtime, cardElement) {
  // Remove previous selection
  document.querySelectorAll(".showtime-card").forEach((card) => {
    card.classList.remove("selected")
  })

  // Select current showtime
  cardElement.classList.add("selected")
  selectedShowtime = showtime

  // Update pricing info
  document.getElementById("regularPrice").textContent = showtime.price
  document.getElementById("premiumPrice").textContent = (showtime.price * 1.5).toFixed(2)
  document.getElementById("vipPrice").textContent = (showtime.price * 2).toFixed(2)

  // Load seats
  try {
    const response = await fetch(`${window.API_BASE_URL}/showtimes/${showtime.id}/seats`)
    seatMap = await response.json()

    displaySeatMap()
    activateStep("seatStep")
  } catch (error) {
    console.error("Error loading seats:", error)
    window.showToast("Failed to load seats", "error")
  }
}

function displaySeatMap() {
  const container = document.getElementById("seatMap")
  container.innerHTML = ""

  if (seatMap.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-chair"></i>
        <h3>No seats available</h3>
        <p>Please select a different showtime</p>
      </div>
    `
    return
  }

  // Group seats by row
  const seatsByRow = {}
  seatMap.forEach((seat) => {
    const row = seat.seat_number.charAt(0)
    if (!seatsByRow[row]) seatsByRow[row] = []
    seatsByRow[row].push(seat)
  })

  // Create seat rows
  Object.keys(seatsByRow)
    .sort()
    .forEach((row) => {
      seatsByRow[row].sort((a, b) => {
        const numA = Number.parseInt(a.seat_number.slice(1))
        const numB = Number.parseInt(b.seat_number.slice(1))
        return numA - numB
      })

      const rowDiv = document.createElement("div")
      rowDiv.className = "seat-row"

      // Row label
      const rowLabel = document.createElement("div")
      rowLabel.className = "row-label"
      rowLabel.textContent = row
      rowDiv.appendChild(rowLabel)

      // Seats
      seatsByRow[row].forEach((seat) => {
        const seatElement = document.createElement("div")
        seatElement.className = `seat ${seat.is_booked ? "booked" : "available"} ${seat.seat_type}`
        seatElement.textContent = seat.seat_number.slice(1)
        seatElement.dataset.seatId = seat.id

        if (!seat.is_booked) {
          seatElement.addEventListener("click", () => toggleSeat(seat.id, seatElement))
        }

        rowDiv.appendChild(seatElement)
      })

      container.appendChild(rowDiv)
    })
}

function toggleSeat(seatId, seatElement) {
  if (selectedSeats.includes(seatId)) {
    // Deselect seat
    selectedSeats = selectedSeats.filter((id) => id !== seatId)
    seatElement.classList.remove("selected")
    seatElement.classList.add("available")
  } else {
    // Select seat
    selectedSeats.push(seatId)
    seatElement.classList.remove("available")
    seatElement.classList.add("selected")
  }

  updateBookingSummary()
}

function updateBookingSummary() {
  if (selectedSeats.length > 0) {
    let totalAmount = 0

    selectedSeats.forEach((seatId) => {
      const seat = seatMap.find((s) => s.id === seatId)
      if (seat) {
        let seatPrice = selectedShowtime.price
        if (seat.seat_type === "premium") seatPrice *= 1.5
        if (seat.seat_type === "vip") seatPrice *= 2
        totalAmount += seatPrice
      }
    })

    const summaryEl = document.getElementById("bookingSummary")
    summaryEl.innerHTML = `
      <div class="summary-row">
        <span><i class="fas fa-chair"></i> Selected Seats: <strong>${selectedSeats.length}</strong></span>
        <span class="total-amount"><i class="fas fa-dollar-sign"></i> Total: <strong>$${totalAmount.toFixed(2)}</strong></span>
      </div>
      <div class="booking-info">
        <p><strong>${selectedMovie.title}</strong></p>
        <p>${formatDate(selectedShowtime.show_date)} at ${formatTime(selectedShowtime.show_time)}</p>
        <p>${selectedShowtime.theater_name} - ${selectedShowtime.theater_location}</p>
      </div>
    `

    activateStep("summaryStep")
  } else {
    deactivateStep("summaryStep")
  }
}

async function confirmBooking() {
  if (!selectedShowtime || selectedSeats.length === 0) {
    window.showToast("Please select seats", "error")
    return
  }

  const confirmBtn = document.getElementById("confirmBooking")
  const btnText = confirmBtn.querySelector(".btn-text")
  const btnLoading = confirmBtn.querySelector(".btn-loading")

  btnText.style.display = "none"
  btnLoading.style.display = "flex"
  confirmBtn.disabled = true

  try {
    const response = await fetch(`${window.API_BASE_URL}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${window.getAuthToken()}`,
      },
      body: JSON.stringify({
        showtimeId: selectedShowtime.id,
        seatIds: selectedSeats,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      window.showToast(`🎉 Booking successful! Reference: ${data.bookingReference}`, "success")
      sessionStorage.removeItem("selectedMovieId")

      setTimeout(() => {
        window.location.href = "bookings.html"
      }, 2000)
    } else {
      window.showToast(data.error || "Booking failed", "error")
    }
  } catch (error) {
    console.error("Booking error:", error)
    window.showToast("Network error. Please try again.", "error")
  } finally {
    btnText.style.display = "flex"
    btnLoading.style.display = "none"
    confirmBtn.disabled = false
  }
}

function activateStep(stepId) {
  document.getElementById(stepId).classList.add("active")
}

function deactivateStep(stepId) {
  document.getElementById(stepId).classList.remove("active")
}

// Utility functions
function formatTime(timeString) {
  const [hours, minutes] = timeString.split(":")
  const hour = Number.parseInt(hours)
  const ampm = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
