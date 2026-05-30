// Bookings page functionality
document.addEventListener("DOMContentLoaded", () => {
  console.log("📋 Bookings page loaded")

  // Check authentication
  if (!window.requireAuth()) return

  // Debug auth status
  console.log("User authenticated:", window.isAuthenticated())
  console.log("Current user:", window.getCurrentUser())
  console.log("Auth token:", window.getAuthToken() ? "Present" : "Missing")

  loadBookings()
})

async function loadBookings() {
  const loadingEl = document.getElementById("bookingsLoading")
  const listEl = document.getElementById("bookingsList")
  const emptyEl = document.getElementById("emptyState")

  console.log("🔄 Loading bookings...")

  try {
    loadingEl.style.display = "flex"
    listEl.style.display = "none"
    emptyEl.style.display = "none"

    const token = window.getAuthToken()
    console.log("Making request with token:", token ? "Present" : "Missing")

    const response = await fetch(`${window.API_BASE_URL}/bookings`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    console.log("Response status:", response.status)
    console.log("Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Response error:", errorData)
      throw new Error(`HTTP error! status: ${response.status} - ${errorData}`)
    }

    const bookings = await response.json()
    console.log("✅ Bookings loaded:", bookings.length, "bookings")
    console.log("Bookings data:", bookings)

    loadingEl.style.display = "none"

    if (bookings.length === 0) {
      console.log("📭 No bookings found")
      emptyEl.style.display = "block"
    } else {
      console.log("📋 Displaying bookings")
      displayBookings(bookings)
      listEl.style.display = "flex"
    }
  } catch (error) {
    console.error("❌ Error loading bookings:", error)
    loadingEl.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Failed to load bookings</h3>
        <p>Error: ${error.message}</p>
        <p>Please check your connection and try again</p>
        <button onclick="loadBookings()" class="btn btn-primary">
          <i class="fas fa-refresh"></i> Try Again
        </button>
      </div>
    `
    window.showToast(`Failed to load bookings: ${error.message}`, "error")
  }
}

function displayBookings(bookings) {
  const container = document.getElementById("bookingsList")
  container.innerHTML = ""

  console.log("🎨 Rendering", bookings.length, "booking cards")

  bookings.forEach((booking, index) => {
    console.log("Rendering booking:", booking.booking_reference)

    const bookingCard = document.createElement("div")
    bookingCard.className = `booking-card ${booking.status}`
    bookingCard.style.animationDelay = `${index * 0.1}s`

    bookingCard.innerHTML = `
      <div class="booking-header">
        <div class="booking-movie">${booking.movie_title}</div>
        <div class="booking-status ${booking.status}">${booking.status.toUpperCase()}</div>
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

  console.log("✅ All booking cards rendered")
}

async function cancelBooking(bookingId) {
  if (!confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) {
    return
  }

  console.log("❌ Cancelling booking:", bookingId)

  try {
    const response = await fetch(`${window.API_BASE_URL}/bookings/${bookingId}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${window.getAuthToken()}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (response.ok) {
      window.showToast("Booking cancelled successfully", "success")
      console.log("✅ Booking cancelled successfully")
      loadBookings() // Refresh the list
    } else {
      console.error("❌ Cancel failed:", data.error)
      window.showToast(data.error || "Failed to cancel booking", "error")
    }
  } catch (error) {
    console.error("❌ Cancel booking error:", error)
    window.showToast("Network error. Please try again.", "error")
  }
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

// Make functions globally available
window.loadBookings = loadBookings
window.cancelBooking = cancelBooking
