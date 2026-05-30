// Authentication utilities
const API_BASE_URL = window.location.origin + "/api"

// Check if user is authenticated
function isAuthenticated() {
  const token = localStorage.getItem("moviebook_token")
  const user = localStorage.getItem("moviebook_user")
  return token && user
}

// Get current user
function getCurrentUser() {
  const user = localStorage.getItem("moviebook_user")
  return user ? JSON.parse(user) : null
}

// Get auth token
function getAuthToken() {
  return localStorage.getItem("moviebook_token")
}

// Set authentication data
function setAuthData(token, user) {
  localStorage.setItem("moviebook_token", token)
  localStorage.setItem("moviebook_user", JSON.stringify(user))
  updateUserSection() // Update UI immediately
}

// Clear authentication data
function clearAuthData() {
  localStorage.removeItem("moviebook_token")
  localStorage.removeItem("moviebook_user")
  updateUserSection() // Update UI immediately
}

// Update user section in navigation
function updateUserSection() {
  const userSection = document.getElementById("userSection")
  if (!userSection) return

  if (isAuthenticated()) {
    const user = getCurrentUser()
    userSection.innerHTML = `
      <div class="user-info" style="display: flex; align-items: center; gap: 1rem;">
        <span class="user-name" style="color: var(--text-secondary);">Welcome, ${user.name}</span>
        <a href="bookings.html" class="nav-link">
          <i class="fas fa-ticket-alt"></i> My Bookings
        </a>
        <button onclick="logout()" class="nav-link logout-btn" style="background: var(--danger); color: white; border: none; padding: 0.5rem 1rem; border-radius: 2rem;">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    `
  } else {
    userSection.innerHTML = `
      <a href="login.html" class="nav-link login-btn">
        <i class="fas fa-user"></i> Login
      </a>
    `
  }
}

// Logout function
function logout() {
  clearAuthData()
  showToast("Logged out successfully! 👋", "success")
  setTimeout(() => {
    window.location.href = "index.html"
  }, 1000)
}

// Show toast notification
function showToast(message, type = "info") {
  const toast = document.getElementById("toast")
  if (!toast) {
    console.log(`${type}: ${message}`)
    return
  }

  toast.textContent = message
  toast.className = `toast ${type}`
  toast.classList.add("show")

  setTimeout(() => {
    toast.classList.remove("show")
  }, 4000)
}

// Protect pages that require authentication
function requireAuth() {
  if (!isAuthenticated()) {
    showToast("Please login to access this page", "error")
    setTimeout(() => {
      window.location.href = "login.html"
    }, 1500)
    return false
  }
  return true
}

// Initialize auth on page load
document.addEventListener("DOMContentLoaded", () => {
  updateUserSection()
})

// Make functions globally available
window.logout = logout
window.showToast = showToast
window.requireAuth = requireAuth
window.isAuthenticated = isAuthenticated
window.getCurrentUser = getCurrentUser
window.getAuthToken = getAuthToken
window.setAuthData = setAuthData
window.clearAuthData = clearAuthData
window.updateUserSection = updateUserSection
window.API_BASE_URL = API_BASE_URL
