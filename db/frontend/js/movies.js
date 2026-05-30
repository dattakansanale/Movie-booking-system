// Movies page functionality
let currentFilter = "now_showing"
let movies = []

document.addEventListener("DOMContentLoaded", () => {
  console.log("🎬 Movies page loaded")
  console.log("API Base URL:", window.API_BASE_URL)
  setupEventListeners()
  loadMovies()
})

function setupEventListeners() {
  // Filter buttons
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const filter = e.target.dataset.filter
      setActiveFilter(filter)
      filterMovies(filter)
    })
  })
}

function setActiveFilter(filter) {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active")
  })
  document.querySelector(`[data-filter="${filter}"]`).classList.add("active")
  currentFilter = filter
}

async function loadMovies() {
  const loadingEl = document.getElementById("moviesLoading")
  const gridEl = document.getElementById("moviesGrid")
  const emptyEl = document.getElementById("emptyState")

  try {
    console.log("🔄 Loading movies from:", `${window.API_BASE_URL}/movies`)

    loadingEl.style.display = "flex"
    gridEl.style.display = "none"
    emptyEl.style.display = "none"

    // Test API connection first
    const testResponse = await fetch(`${window.API_BASE_URL}/test`)
    if (!testResponse.ok) {
      throw new Error(`API test failed: ${testResponse.status}`)
    }
    console.log("✅ API connection successful")

    // Fetch all movies
    const [nowShowingRes, comingSoonRes] = await Promise.all([
      fetch(`${window.API_BASE_URL}/movies?status=now_showing`),
      fetch(`${window.API_BASE_URL}/movies?status=coming_soon`),
    ])

    if (!nowShowingRes.ok) {
      throw new Error(`Now showing fetch failed: ${nowShowingRes.status}`)
    }
    if (!comingSoonRes.ok) {
      throw new Error(`Coming soon fetch failed: ${comingSoonRes.status}`)
    }

    const nowShowing = await nowShowingRes.json()
    const comingSoon = await comingSoonRes.json()

    console.log("📽️ Now showing movies:", nowShowing.length)
    console.log("🔮 Coming soon movies:", comingSoon.length)

    movies = [...nowShowing, ...comingSoon]

    loadingEl.style.display = "none"
    filterMovies(currentFilter)

    console.log("✅ Movies loaded successfully")
  } catch (error) {
    console.error("❌ Error loading movies:", error)
    window.showToast(`Failed to load movies: ${error.message}`, "error")

    loadingEl.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Unable to load movies</h3>
        <p>Error: ${error.message}</p>
        <p>Please check if the server is running on port 5000</p>
        <button onclick="loadMovies()" class="btn btn-primary">
          <i class="fas fa-refresh"></i> Try Again
        </button>
      </div>
    `
  }
}

function filterMovies(filter) {
  const gridEl = document.getElementById("moviesGrid")
  const emptyEl = document.getElementById("emptyState")

  const filteredMovies = movies.filter((movie) => movie.status === filter)

  if (filteredMovies.length === 0) {
    gridEl.style.display = "none"
    emptyEl.style.display = "block"
    return
  }

  gridEl.style.display = "grid"
  emptyEl.style.display = "none"
  gridEl.innerHTML = ""

  filteredMovies.forEach((movie, index) => {
    const movieCard = createMovieCard(movie)
    movieCard.style.animationDelay = `${index * 0.1}s`
    gridEl.appendChild(movieCard)
  })
}

function createMovieCard(movie) {
  const card = document.createElement("div")
  card.className = "movie-card"

  const truncatedDescription =
    movie.description.length > 120 ? movie.description.substring(0, 120) + "..." : movie.description

  card.innerHTML = `
    <div class="movie-poster">
      <i class="fas fa-film"></i>
      <div class="movie-status ${movie.status.replace("_", "-")}">${movie.status.replace("_", " ").toUpperCase()}</div>
    </div>
    <div class="movie-info">
      <h3 class="movie-title">${movie.title}</h3>
      <p class="movie-description">${truncatedDescription}</p>
      <div class="movie-details">
        <span><i class="fas fa-clock"></i> ${movie.duration} min</span>
        <span><i class="fas fa-star"></i> ${movie.rating}</span>
      </div>
      <div class="movie-genre">${movie.genre}</div>
      <button class="book-btn" ${movie.status !== "now_showing" ? "disabled" : ""} 
              onclick="bookMovie(${movie.id})">
        <i class="fas fa-ticket-alt"></i>
        ${movie.status === "now_showing" ? "Book Now" : "Coming Soon"}
      </button>
    </div>
  `

  return card
}

function bookMovie(movieId) {
  if (!window.isAuthenticated()) {
    window.showToast("Please login to book tickets", "error")
    setTimeout(() => {
      window.location.href = "login.html"
    }, 1500)
    return
  }

  // Store movie ID and redirect to booking page
  sessionStorage.setItem("selectedMovieId", movieId)
  window.location.href = "booking.html"
}

// Make functions globally available
window.loadMovies = loadMovies
window.bookMovie = bookMovie
