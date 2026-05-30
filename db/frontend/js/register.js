// Register page functionality
document.addEventListener("DOMContentLoaded", () => {
  // Redirect if already logged in
  if (window.isAuthenticated && window.isAuthenticated()) {
    window.location.href = "movies.html"
    return
  }

  setupRegisterForm()
})

function setupRegisterForm() {
  const form = document.getElementById("registerForm")

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
    const name = formData.get("name")
    const email = formData.get("email")
    const phone = formData.get("phone")
    const password = formData.get("password")

    // Basic validation
    if (!name || !email || !password) {
      window.showToast("Please fill in all required fields", "error")
      resetButton()
      return
    }

    if (password.length < 6) {
      window.showToast("Password must be at least 6 characters long", "error")
      resetButton()
      return
    }

    try {
      console.log("📝 Attempting registration...")
      const response = await fetch(`${window.API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, phone, password }),
      })

      const data = await response.json()
      console.log("Registration response:", data)

      if (response.ok) {
        window.setAuthData(data.token, data.user)
        window.showToast("Registration successful! Welcome to MovieBook! 🎊", "success")
        console.log("✅ Registration successful for:", data.user.name)

        setTimeout(() => {
          window.location.href = "movies.html"
        }, 1000)
      } else {
        console.error("❌ Registration failed:", data.error)
        window.showToast(data.error || "Registration failed", "error")
      }
    } catch (error) {
      console.error("❌ Registration network error:", error)
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
