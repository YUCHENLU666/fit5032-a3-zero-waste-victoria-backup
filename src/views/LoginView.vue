<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { loginUser } from '../services/authService'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')

const errorMessage = ref('')
const isSubmitting = ref(false)

// Show success message after registration
const successMessage = ref(
  route.query.registered === 'true'
    ? 'Account created successfully. Please log in.'
    : ''
)

const handleLogin = async () => {
  errorMessage.value = ''

  const cleanEmail = email.value.trim()

  // Email cannot be empty
  if (!cleanEmail) {
    errorMessage.value =
      'Please enter your email address.'
    return
  }

  // Email format validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailPattern.test(cleanEmail)) {
    errorMessage.value =
      'Please enter a valid email address.'
    return
  }

  // Password cannot be empty
  if (!password.value) {
    errorMessage.value =
      'Please enter your password.'
    return
  }

  isSubmitting.value = true

  try {
    const result = await loginUser(
      cleanEmail,
      password.value
    )

    // Login failed
    if (!result.success) {
      errorMessage.value = result.message
      return
    }

    // If user originally tried to visit a protected page,
    // send them back there after successful login.
    const redirectPath = route.query.redirect

    if (
      typeof redirectPath === 'string' &&
      redirectPath.startsWith('/')
    ) {
      router.push(redirectPath)
      return
    }

    // Administrator goes to admin dashboard
    if (result.user.role === 'admin') {
      router.push('/admin')
      return
    }

    // Normal user goes to account page
    router.push('/account')

  } catch (error) {
    console.error(error)

    errorMessage.value =
      'Unable to log in. Please try again.'
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

              <!-- Header -->
              <div class="text-center mb-4">
                <div class="fs-1 mb-2">
                  ♻️
                </div>

                <h1 class="h3 fw-bold">
                  Welcome Back
                </h1>

                <p class="text-muted mb-0">
                  Log in to your ZWV Circular Hub account.
                </p>
              </div>


              <!-- Registration success message -->
              <div
                v-if="successMessage"
                class="alert alert-success"
                role="alert"
              >
                {{ successMessage }}
              </div>


              <!-- Login error message -->
              <div
                v-if="errorMessage"
                class="alert alert-danger"
                role="alert"
              >
                {{ errorMessage }}
              </div>


              <!-- Login form -->
              <form @submit.prevent="handleLogin">

                <!-- Email -->
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


                <!-- Password -->
                <div class="mb-4">
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
                    autocomplete="current-password"
                    required
                  />
                </div>


                <!-- Submit button -->
                <button
                  type="submit"
                  class="btn btn-success w-100 py-2"
                  :disabled="isSubmitting"
                >
                  <span v-if="isSubmitting">
                    Logging in...
                  </span>

                  <span v-else>
                    Log In
                  </span>
                </button>

              </form>


              <hr class="my-4" />


              <!-- Register link -->
              <p class="text-center text-muted mb-0">
                Don't have an account?

                <RouterLink
                  to="/register"
                  class="text-success fw-semibold text-decoration-none"
                >
                  Create account
                </RouterLink>
              </p>

            </div>
          </div>

        </div>
      </div>

    </div>
  </main>
</template>