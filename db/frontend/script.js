// API Configuration
const API_BASE_URL = window.location.origin + "/api"

// Global State
let currentUser = null
let currentToken = null
let selectedMovie = null
let selectedShowtime = null
let selectedSeats = []
let seatMap = []

// DOM Elements
const authModal = document.getElementById("authModal")
const bookingModal = document.getElementById("bookingModal")
const loginBtn = document.getElementById("loginBtn")
const logoutBtn = document.getElementById("logoutBtn")
const userMenu = document.getElementById("userMenu")
const userName = document.getElementById("userName")
const moviesTab = document.getElementById("moviesTab")
const bookingsTab = document.getElementById("bookingsTab")
const moviesSection = document.getElementById("moviesSection")
const bookingsSection = document.getElementById("bookingsSection")

// Add this function at the beginning of the file after the DOM elements
function forceStyleRefresh() {
  // Force a reflow to ensure all styles are applied
  document.body.offsetHeight

  // Add a class to trigger any CSS animations
  document.body.classList.add("styles-loaded")

  // Remove and re-add stylesheets to force refresh
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]')
  stylesheets.forEach((sheet) => {
    const href = sheet.href
    sheet.href = ""
    setTimeout(() => {
      sheet.href = href
    }, 10)
  })
}

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 MovieBook App initializing...")
  initializeApp()
  setupEventListeners()
  checkAuthStatus()
})

function initializeApp() {
  testAPIConnection()
  fetchMovies()
  showSection("movies") // Show movies by default
  forceStyleRefresh() // Force style refresh
}

async function testAPIConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/test`)
    const data = await response.json()
    console.log("✅ API Connection successful:", data)
  } catch (error) {
    console.error("❌ API Connection failed:", error)
    showToast("Unable to connect to server. Please check if the backend is running.", "error")
  }
}

function setupEventListeners() {
  // Navigation
  moviesTab.addEventListener("click", () => switchTab("movies"))
  bookingsTab.addEventListener("click", () => switchTab("bookings"))

  // Auth
  loginBtn.addEventListener("click", () => openAuthModal())
  logoutBtn.addEventListener("click", logout)

  // Auth Modal
  document.getElementById("loginTab").addEventListener("click", () => switchAuthTab("login"))
  document.getElementById("registerTab").addEventListener("click", () => switchAuthTab("register"))
  document.getElementById("loginForm").addEventListener("submit", handleLogin)
  document.getElementById("registerForm").addEventListener("submit", handleRegister)

  // Booking Modal
  document.getElementById("bookingDate").addEventListener("change", handleDateChange)
  document.getElementById("cancelBooking").addEventListener("click", closeBookingModal)
  document.getElementById("confirmBooking").addEventListener("click", handleBookingConfirm)

  // Modal Close
  document.querySelectorAll(".close").forEach((closeBtn) => {
    closeBtn.addEventListener("click", (e) => {
      e.target.closest(".modal").style.display = "none"
    })
  })

  // Click outside modal to close
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none"
    }
  })
}

function checkAuthStatus() {
  const token = localStorage.getItem("moviebook_token")
  const user = localStorage.getItem("moviebook_user")

  if (token && user) {
    try {
      currentToken = token
      currentUser = JSON.parse(user)
      updateAuthUI()
      console.log("✅ User logged in:", currentUser.name)
    } catch (error) {
      console.error("Error parsing stored user data:", error)
      localStorage.removeItem("moviebook_token")
      localStorage.removeItem("moviebook_user")
    }
  }
}

function updateAuthUI() {
  if (currentUser) {
    loginBtn.style.display = "none"
    userMenu.style.display = "flex"
    bookingsTab.style.display = "block"
    userName.textContent = `Welcome, ${currentUser.name}`
  } else {
    loginBtn.style.display = "block"
    userMenu.style.display = "none"
    bookingsTab.style.display = "none"
  }
}

function showSection(sectionName) {
  // Hide all sections
  moviesSection.style.display = "none"
  bookingsSection.style.display = "none"

  // Show requested section with animation
  if (sectionName === "movies") {
    moviesSection.style.display = "block"
    moviesSection.style.opacity = "0"
    moviesSection.style.transform = "translateY(20px)"

    setTimeout(() => {
      moviesSection.style.transition = "all 0.5s ease-out"
      moviesSection.style.opacity = "1"
      moviesSection.style.transform = "translateY(0)"
    }, 50)
  } else if (sectionName === "bookings") {
    bookingsSection.style.display = "block"
    bookingsSection.style.opacity = "0"
    bookingsSection.style.transform = "translateY(20px)"

    setTimeout(() => {
      bookingsSection.style.transition = "all 0.5s ease-out"
      bookingsSection.style.opacity = "1"
      bookingsSection.style.transform = "translateY(0)"
    }, 50)
  }
}

function switchTab(tab) {
  if (tab === "movies") {
    showSection("movies")
    moviesTab.classList.add("active")
    bookingsTab.classList.remove("active")
  } else if (tab === "bookings") {
    if (!currentUser) {
      showToast("Please login to view bookings", "error")
      return
    }
    showSection("bookings")
    moviesTab.classList.remove("active")
    bookingsTab.classList.add("active")
    fetchBookings()
  }
}

function openAuthModal() {
  authModal.style.display = "block"
  document.body.style.overflow = "hidden" // Prevent background scrolling
}

function closeAuthModal() {
  authModal.style.display = "none"
  document.body.style.overflow = "auto"
}

function switchAuthTab(tab) {
  const loginTab = document.getElementById("loginTab")
  const registerTab = document.getElementById("registerTab")
  const loginForm = document.getElementById("loginForm")
  const registerForm = document.getElementById("registerForm")

  if (tab === "login") {
    loginTab.classList.add("active")
    registerTab.classList.remove("active")
    loginForm.style.display = "block"
    registerForm.style.display = "none"
  } else {
    loginTab.classList.remove("active")
    registerTab.classList.add("active")
    loginForm.style.display = "none"
    registerForm.style.display = "block"
  }
}

async function handleLogin(e) {
  e.preventDefault()
  console.log("🔐 Attempting login...")

  const submitBtn = e.target.querySelector(".submit-btn")
  const btnText = submitBtn.querySelector(".btn-text")
  const btnLoading = submitBtn.querySelector(".btn-loading")

  btnText.style.display = "none"
  btnLoading.style.display = "flex"
  submitBtn.disabled = true

  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (response.ok) {
      currentToken = data.token
      currentUser = data.user
      localStorage.setItem("moviebook_token", data.token)
      localStorage.setItem("moviebook_user", JSON.stringify(data.user))
      updateAuthUI()
      closeAuthModal()
      showToast("Login successful! Welcome back! 🎉", "success")
      console.log("✅ Login successful for:", data.user.name)
    } else {
      showToast(data.error || "Login failed", "error")
      console.error("❌ Login failed:", data.error)
    }
  } catch (error) {
    console.error("❌ Login network error:", error)
    showToast("Network error. Please check if the server is running.", "error")
  } finally {
    btnText.style.display = "flex"
    btnLoading.style.display = "none"
    submitBtn.disabled = false
  }
}

async function handleRegister(e) {
  e.preventDefault()
  console.log("📝 Attempting registration...")

  const submitBtn = e.target.querySelector(".submit-btn")
  const btnText = submitBtn.querySelector(".btn-text")
  const btnLoading = submitBtn.querySelector(".btn-loading")

  btnText.style.display = "none"
  btnLoading.style.display = "flex"
  submitBtn.disabled = true

  const name = document.getElementById("registerName").value
  const email = document.getElementById("registerEmail").value
  const phone = document.getElementById("registerPhone").value
  const password = document.getElementById("registerPassword").value

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, phone, password }),
    })

    const data = await response.json()

    if (response.ok) {
      currentToken = data.token
      currentUser = data.user
      localStorage.setItem("moviebook_token", data.token)
      localStorage.setItem("moviebook_user", JSON.stringify(data.user))
      updateAuthUI()
      closeAuthModal()
      showToast("Registration successful! Welcome to MovieBook! 🎊", "success")
      console.log("✅ Registration successful for:", data.user.name)
    } else {
      showToast(data.error || "Registration failed", "error")
      console.error("❌ Registration failed:", data.error)
    }
  } catch (error) {
    console.error("❌ Registration network error:", error)
    showToast("Network error. Please check if the server is running.", "error")
  } finally {
    btnText.style.display = "flex"
    btnLoading.style.display = "none"
    submitBtn.disabled = false
  }
}

function logout() {
  currentToken = null
  currentUser = null
  localStorage.removeItem("moviebook_token")
  localStorage.removeItem("moviebook_user")
  updateAuthUI()
  switchTab("movies")
  showToast("Logged out successfully. See you soon! 👋", "success")
  console.log("👋 User logged out")
}

async function fetchMovies() {
  const moviesLoading = document.getElementById("moviesLoading")
  const moviesContent = document.getElementById("moviesContent")

  try {
    console.log("🎬 Fetching movies...")
    moviesLoading.style.display = "flex"
    moviesContent.style.display = "none"

    // Fetch now showing movies
    const nowShowingResponse = await fetch(`${API_BASE_URL}/movies?status=now_showing`)
    if (!nowShowingResponse.ok) {
      throw new Error(`HTTP error! status: ${nowShowingResponse.status}`)
    }
    const nowShowingMovies = await nowShowingResponse.json()

    // Fetch coming soon movies
    const comingSoonResponse = await fetch(`${API_BASE_URL}/movies?status=coming_soon`)
    if (!comingSoonResponse.ok) {
      throw new Error(`HTTP error! status: ${comingSoonResponse.status}`)
    }
    const comingSoonMovies = await comingSoonResponse.json()

    renderMovies(nowShowingMovies, "nowShowingMovies")
    renderMovies(comingSoonMovies, "comingSoonMovies")

    moviesLoading.style.display = "none"
    moviesContent.style.display = "block"
    console.log("✅ Movies loaded successfully")
  } catch (error) {
    console.error("❌ Error fetching movies:", error)
    showToast("Failed to load movies. Please check if the server is running.", "error")
    moviesLoading.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Unable to load movies</h3>
        <p>Please check if the server is running and try again.</p>
        <button onclick="fetchMovies()" class="book-btn" style="max-width: 200px; margin-top: 1rem;">
          <i class="fas fa-refresh"></i> Try Again
        </button>
      </div>
    `
  }
}

function renderMovies(movies, containerId) {
  const container = document.getElementById(containerId)
  container.innerHTML = ""

  if (movies.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-film"></i>
        <h3>No movies available</h3>
        <p>Check back later for new releases!</p>
      </div>
    `
    return
  }

  movies.forEach((movie, index) => {
    const movieCard = createMovieCard(movie)
    movieCard.style.animationDelay = `${index * 0.1}s`
    container.appendChild(movieCard)
  })
}

function createMovieCard(movie) {
  const card = document.createElement("div")
  card.className = "movie-card"

  const truncatedDescription =
    movie.description.length > 120 ? movie.description.substring(0, 120) + "..." : movie.description

  card.innerHTML = `
    <div class="movie-status status-${movie.status.replace("_", "-")}">${movie.status.replace("_", " ").toUpperCase()}</div>
    <div class="movie-poster">
      <i class="fas fa-film"></i>
    </div>
    <div class="movie-info">
      <h3 class="movie-title">${movie.title}</h3>
      <p class="movie-description">${truncatedDescription}</p>
      <div class="movie-details">
        <span><i class="fas fa-clock"></i> ${movie.duration} min</span>
        <span><i class="fas fa-star"></i> ${movie.rating}</span>
      </div>
      <div class="movie-genre">${movie.genre}</div>
      <button class="book-btn" ${movie.status !== "now_showing" ? "disabled" : ""}>
        <i class="fas fa-ticket-alt"></i>
        ${movie.status === "now_showing" ? "Book Now" : "Coming Soon"}
      </button>
    </div>
  `

  if (movie.status === "now_showing") {
    card.querySelector(".book-btn").addEventListener("click", () => openBookingModal(movie))
  }

  return card
}

function openBookingModal(movie) {
  if (!currentUser) {
    showToast("Please login to book tickets", "error")
    openAuthModal()
    return
  }

  console.log("🎫 Opening booking modal for:", movie.title)
  selectedMovie = movie
  selectedShowtime = null
  selectedSeats = []

  document.getElementById("bookingMovieTitle").textContent = `Book Tickets - ${movie.title}`

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0]
  document.getElementById("bookingDate").value = today
  document.getElementById("bookingDate").min = today

  // Reset booking steps
  document.getElementById("showtimeStep").style.display = "none"
  document.getElementById("seatStep").style.display = "none"
  document.getElementById("bookingSummary").style.display = "none"

  bookingModal.style.display = "block"
  document.body.style.overflow = "hidden"

  // Load showtimes for today
  handleDateChange()
}

function closeBookingModal() {
  bookingModal.style.display = "none"
  document.body.style.overflow = "auto"
  selectedMovie = null
  selectedShowtime = null
  selectedSeats = []
}

async function handleDateChange() {
  const date = document.getElementById("bookingDate").value
  if (!date || !selectedMovie) return

  console.log("📅 Loading showtimes for date:", date)

  try {
    const response = await fetch(`${API_BASE_URL}/movies/${selectedMovie.id}/showtimes?date=${date}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const showtimes = await response.json()
    renderShowtimes(showtimes)
    document.getElementById("showtimeStep").style.display = "block"

    // Smooth scroll to showtimes
    document.getElementById("showtimeStep").scrollIntoView({ behavior: "smooth", block: "nearest" })
  } catch (error) {
    console.error("❌ Error fetching showtimes:", error)
    showToast("Failed to load showtimes", "error")
  }
}

function renderShowtimes(showtimes) {
  const container = document.getElementById("showtimesList")
  container.innerHTML = ""

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

  showtimes.forEach((showtime, index) => {
    const showtimeCard = document.createElement("div")
    showtimeCard.className = "showtime-card"
    showtimeCard.style.animationDelay = `${index * 0.1}s`

    showtimeCard.innerHTML = `
      <div class="showtime-time">
        <i class="fas fa-clock"></i>
        ${formatTime(showtime.show_time)}
      </div>
      <div class="showtime-details">
        <div><i class="fas fa-building"></i> <strong>${showtime.theater_name}</strong></div>
        <div><i class="fas fa-map-marker-alt"></i> ${showtime.theater_location}</div>
        <div><i class="fas fa-dollar-sign"></i> $${showtime.price} • <i class="fas fa-chair"></i> ${showtime.available_seats} seats available</div>
      </div>
    `

    showtimeCard.addEventListener("click", () => selectShowtime(showtime, showtimeCard))
    container.appendChild(showtimeCard)
  })
}

async function selectShowtime(showtime, cardElement) {
  console.log("🎭 Selecting showtime:", showtime)

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
    console.log("🪑 Loading seats for showtime:", showtime.id)
    const response = await fetch(`${API_BASE_URL}/showtimes/${showtime.id}/seats`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    seatMap = await response.json()
    console.log("Seats data:", seatMap)

    renderSeatMap()
    document.getElementById("seatStep").style.display = "block"

    // Smooth scroll to seat selection
    document.getElementById("seatStep").scrollIntoView({ behavior: "smooth", block: "nearest" })
  } catch (error) {
    console.error("❌ Error fetching seats:", error)
    showToast("Failed to load seats", "error")
  }
}

function renderSeatMap() {
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

  // Sort rows alphabetically and seats numerically within each row
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
        seatElement.setAttribute("tabindex", seat.is_booked ? "-1" : "0")
        seatElement.setAttribute("role", "button")
        seatElement.setAttribute(
          "aria-label",
          `Seat ${seat.seat_number}, ${seat.seat_type}, ${seat.is_booked ? "booked" : "available"}`,
        )

        if (!seat.is_booked) {
          seatElement.addEventListener("click", () => toggleSeat(seat.id, seatElement))
          seatElement.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              toggleSeat(seat.id, seatElement)
            }
          })
        }

        rowDiv.appendChild(seatElement)
      })

      container.appendChild(rowDiv)
    })
}

function toggleSeat(seatId, seatElement) {
  console.log("🪑 Toggling seat:", seatId)

  if (selectedSeats.includes(seatId)) {
    // Deselect seat
    selectedSeats = selectedSeats.filter((id) => id !== seatId)
    seatElement.classList.remove("selected")
    seatElement.classList.add("available")
    seatElement.setAttribute("aria-pressed", "false")
  } else {
    // Select seat
    selectedSeats.push(seatId)
    seatElement.classList.remove("available")
    seatElement.classList.add("selected")
    seatElement.setAttribute("aria-pressed", "true")
  }

  console.log("Selected seats:", selectedSeats)
  updateBookingSummary()
}

function updateBookingSummary() {
  const summaryDiv = document.getElementById("bookingSummary")
  const seatsCountSpan = document.getElementById("selectedSeatsCount")
  const totalAmountSpan = document.getElementById("totalAmount")

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

    seatsCountSpan.textContent = selectedSeats.length
    totalAmountSpan.textContent = totalAmount.toFixed(2)
    summaryDiv.style.display = "block"

    // Smooth scroll to summary
    setTimeout(() => {
      summaryDiv.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }, 100)
  } else {
    summaryDiv.style.display = "none"
  }
}

async function handleBookingConfirm() {
  if (!selectedShowtime || selectedSeats.length === 0) {
    showToast("Please select seats", "error")
    return
  }

  console.log("🎫 Confirming booking...")

  const confirmBtn = document.getElementById("confirmBooking")
  const btnText = confirmBtn.querySelector(".btn-text")
  const btnLoading = confirmBtn.querySelector(".btn-loading")

  btnText.style.display = "none"
  btnLoading.style.display = "flex"
  confirmBtn.disabled = true

  try {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify({
        showtimeId: selectedShowtime.id,
        seatIds: selectedSeats,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      showToast(`🎉 Booking successful! Reference: ${data.bookingReference}`, "success")
      closeBookingModal()
      switchTab("bookings")
      console.log("✅ Booking successful:", data.bookingReference)
    } else {
      showToast(data.error || "Booking failed", "error")
      console.error("❌ Booking failed:", data.error)
    }
  } catch (error) {
    console.error("❌ Booking network error:", error)
    showToast("Network error. Please try again.", "error")
  } finally {
    btnText.style.display = "flex"
    btnLoading.style.display = "none"
    confirmBtn.disabled = false
  }
}

async function fetchBookings() {
  if (!currentToken) return

  console.log("📋 Fetching bookings...")

  try {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const bookings = await response.json()
    renderBookings(bookings)
  } catch (error) {
    console.error("❌ Error fetching bookings:", error)
    showToast("Failed to load bookings", "error")
  }
}

function renderBookings(bookings) {
  const container = document.getElementById("bookingsList")
  container.innerHTML = ""

  if (bookings.length === 0) {
    container.innerHTML = `
      <div class="booking-card">
        <div class="empty-state">
          <i class="fas fa-ticket-alt"></i>
          <h3>No bookings found</h3>
          <p>Book your first movie ticket to see it here!</p>
          <button onclick="switchTab('movies')" class="book-btn" style="max-width: 200px; margin-top: 1rem;">
            <i class="fas fa-film"></i> Browse Movies
          </button>
        </div>
      </div>
    `
    return
  }

  bookings.forEach((booking, index) => {
    const bookingCard = document.createElement("div")
    bookingCard.className = `booking-card ${booking.status}`
    bookingCard.style.animationDelay = `${index * 0.1}s`

    bookingCard.innerHTML = `
      <div class="booking-header">
        <div class="booking-movie">${booking.movie_title}</div>
        <div class="booking-status status-${booking.status}">${booking.status.toUpperCase()}</div>
      </div>
      <div class="booking-details">
        <div><i class="fas fa-calendar"></i> ${formatDate(booking.show_date)}</div>
        <div><i class="fas fa-clock"></i> ${formatTime(booking.show_time)}</div>
        <div><i class="fas fa-map-marker-alt"></i> ${booking.theater_name}</div>
        <div><i class="fas fa-chair"></i> ${booking.seats_booked} seats</div>
        <div><i class="fas fa-dollar-sign"></i> $${booking.total_amount}</div>
        <div><i class="fas fa-hashtag"></i> ${booking.booking_reference}</div>
      </div>
      ${
        booking.status === "confirmed"
          ? `
          <div class="booking-actions">
            <button class="cancel-booking-btn" onclick="cancelBooking(${booking.id})">
              <i class="fas fa-times"></i> Cancel Booking
            </button>
          </div>
        `
          : ""
      }
    `

    container.appendChild(bookingCard)
  })
}

async function cancelBooking(bookingId) {
  if (!confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) return

  console.log("❌ Cancelling booking:", bookingId)

  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    })

    const data = await response.json()

    if (response.ok) {
      showToast("Booking cancelled successfully", "success")
      fetchBookings() // Refresh bookings list
      console.log("✅ Booking cancelled successfully")
    } else {
      showToast(data.error || "Failed to cancel booking", "error")
      console.error("❌ Cancel failed:", data.error)
    }
  } catch (error) {
    console.error("❌ Cancel network error:", error)
    showToast("Network error. Please try again.", "error")
  }
}

// Utility Functions
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

function showToast(message, type = "info") {
  const toast = document.getElementById("toast")
  toast.textContent = message
  toast.className = `toast ${type}`
  toast.classList.add("show")

  setTimeout(() => {
    toast.classList.remove("show")
  }, 4000)
}

// Global functions for HTML onclick handlers
window.cancelBooking = cancelBooking
window.fetchMovies = fetchMovies
window.switchTab = switchTab

// Add keyboard navigation for accessibility
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (authModal.style.display === "block") {
      closeAuthModal()
    }
    if (bookingModal.style.display === "block") {
      closeBookingModal()
    }
  }
})
