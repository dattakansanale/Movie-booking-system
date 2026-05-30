// Login page functionality
document.addEventListener("DOMContentLoaded", () => {
  // Redirect if already logged in
  if (window.isAuthenticated && window.isAuthenticated()) {
    window.location.href = "movies.html"
    return
  }

  setupLoginForm()
})

function setupLoginForm() {
  const form = document.getElementById("loginForm")

  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const submitBtn = form.querySelector('button[type="submit"]')
    const btnText = submitBtn.querySelector(".btn-text")
    const btnLoading = submitBtn.querySelector(".btn-loading")

    // Show loading state
    btnText.style.display = "none"
    btnLoading.style.display = "flex"
    submitBtn.disabled = true

    const formData = new FormData(form)
    const email = formData.get("email")
    const password = formData.get("password")

    // Basic validation
    if (!email || !password) {
      window.showToast("Please fill in all fields", "error")
      resetButton()
      return
    }

    try {
      console.log("🔐 Attempting login...")
      const response = await fetch(`${window.API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log("Login response:", data)

      if (response.ok) {
        window.setAuthData(data.token, data.user)
        window.showToast("Login successful! Welcome back! 🎉", "success")
        console.log("✅ Login successful for:", data.user.name)

        setTimeout(() => {
          window.location.href = "movies.html"
        }, 1000)
      } else {
        console.error("❌ Login failed:", data.error)
        window.showToast(data.error || "Login failed", "error")
      }
    } catch (error) {
      console.error("❌ Login network error:", error)
      window.showToast("Network error. Please check if the server is running.", "error")
    } finally {
      resetButton()
    }

    function resetButton() {
      btnText.style.display = "flex"
      btnLoading.style.display = "none"
      submitBtn.disabled = false
    }
  })
}
