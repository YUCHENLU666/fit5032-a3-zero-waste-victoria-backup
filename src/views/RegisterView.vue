<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { registerUser } from '../services/authService'

const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const errorMessage = ref('')
const isSubmitting = ref(false)

const handleRegister = async () => {
  errorMessage.value = ''

  const cleanUsername = username.value.trim()
  const cleanEmail = email.value.trim()

  // Username validation
  if (cleanUsername.length < 3 || cleanUsername.length > 20) {
    errorMessage.value =
      'Username must be between 3 and 20 characters.'
    return
  }

  // Only letters, numbers, spaces, underscore and hyphen
  const usernamePattern = /^[A-Za-z0-9 _-]+$/

  if (!usernamePattern.test(cleanUsername)) {
    errorMessage.value =
      'Username contains invalid characters.'
    return
  }

  // Email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailPattern.test(cleanEmail)) {
    errorMessage.value =
      'Please enter a valid email address.'
    return
  }

  // Password validation
  if (password.value.length < 8) {
    errorMessage.value =
      'Password must contain at least 8 characters.'
    return
  }

  const hasUppercase = /[A-Z]/.test(password.value)
  const hasLowercase = /[a-z]/.test(password.value)
  const hasNumber = /[0-9]/.test(password.value)

  if (!hasUppercase || !hasLowercase || !hasNumber) {
    errorMessage.value =
      'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value =
      'Passwords do not match.'
    return
  }

  isSubmitting.value = true

  try {
    const result = await registerUser(
      cleanUsername,
      cleanEmail,
      password.value
    )

    if (!result.success) {
      errorMessage.value = result.message
      return
    }

    // Registration successful:
    // navigate to login page and show success message there
    router.push({
      path: '/login',
      query: {
        registered: 'true'
      }
    })
  } catch (error) {
    console.error(error)

    errorMessage.value =
      'Unable to create account. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="bg-light py-5">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-5">

          <div class="card border-0 shadow-sm">
            <div class="card-body p-4 p-md-5">

              <div class="text-center mb-4">
                <div class="fs-1 mb-2">
                  ♻️
                </div>

                <h1 class="h3 fw-bold">
                  Create Account
                </h1>

                <p class="text-muted mb-0">
                  Join the ZWV Circular Hub community.
                </p>
              </div>

              <div
                v-if="errorMessage"
                class="alert alert-danger"
                role="alert"
              >
                {{ errorMessage }}
              </div>

              <form @submit.prevent="handleRegister">

                <div class="mb-3">
                  <label
                    for="username"
                    class="form-label fw-semibold"
                  >
                    Username
                  </label>

                  <input
                    id="username"
                    v-model="username"
                    type="text"
                    class="form-control"
                    placeholder="Enter your username"
                    autocomplete="username"
                    required
                  />

                  <div class="form-text">
                    3–20 characters. Letters, numbers, spaces,
                    underscores and hyphens only.
                  </div>
                </div>

                <div class="mb-3">
                  <label
                    for="email"
                    class="form-label fw-semibold"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    v-model="email"
                    type="email"
                    class="form-control"
                    placeholder="name@example.com"
                    autocomplete="email"
                    required
                  />
                </div>

                <div class="mb-3">
                  <label
                    for="password"
                    class="form-label fw-semibold"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    v-model="password"
                    type="password"
                    class="form-control"
                    placeholder="Enter your password"
                    autocomplete="new-password"
                    required
                  />

                  <div class="form-text">
                    Minimum 8 characters, including uppercase,
                    lowercase and a number.
                  </div>
                </div>

                <div class="mb-4">
                  <label
                    for="confirmPassword"
                    class="form-label fw-semibold"
                  >
                    Confirm Password
                  </label>

                  <input
                    id="confirmPassword"
                    v-model="confirmPassword"
                    type="password"
                    class="form-control"
                    placeholder="Enter your password again"
                    autocomplete="new-password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  class="btn btn-success w-100 py-2"
                  :disabled="isSubmitting"
                >
                  <span v-if="isSubmitting">
                    Creating account...
                  </span>

                  <span v-else>
                    Create Account
                  </span>
                </button>
              </form>

              <hr class="my-4" />

              <p class="text-center text-muted mb-0">
                Already have an account?

                <RouterLink
                  to="/login"
                  class="text-success fw-semibold text-decoration-none"
                >
                  Log in
                </RouterLink>
              </p>

            </div>
          </div>

        </div>
      </div>
    </div>
  </main>
</template>