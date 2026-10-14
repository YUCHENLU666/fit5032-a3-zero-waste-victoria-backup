<script setup>
import {
  nextTick,
  ref,
} from 'vue'

import {
  RouterLink,
  useRoute,
  useRouter,
} from 'vue-router'

import {
  loginUser,
} from '../services/authService'


// ======================================================
// Router
// ======================================================

const router =
  useRouter()

const route =
  useRoute()


// ======================================================
// Form fields
// ======================================================

const email =
  ref('')

const password =
  ref('')


// ======================================================
// Input references
//
// Used to move keyboard focus to the first invalid
// field after validation fails.
// ======================================================

const emailInput =
  ref(null)

const passwordInput =
  ref(null)


// ======================================================
// Validation and submission state
// ======================================================

const emailError =
  ref('')

const passwordError =
  ref('')

const loginError =
  ref('')

const isSubmitting =
  ref(false)


// ======================================================
// Registration success message
// ======================================================

const successMessage =
  ref(
    route.query.registered ===
      'true'
      ? 'Account created successfully. Please log in.'
      : '',
  )


// ======================================================
// Clear validation errors
// ======================================================

function clearErrors() {
  emailError.value = ''
  passwordError.value = ''
  loginError.value = ''
}


// ======================================================
// Validate login form
// ======================================================

function validateForm() {
  clearErrors()

  let isValid = true

  const cleanEmail =
    email.value.trim()


  // --------------------------------------------------
  // Email
  // --------------------------------------------------

  if (!cleanEmail) {
    emailError.value =
      'Please enter your email address.'

    isValid = false
  } else {
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (
      !emailPattern.test(
        cleanEmail,
      )
    ) {
      emailError.value =
        'Please enter a valid email address.'

      isValid = false
    }
  }


  // --------------------------------------------------
  // Password
  // --------------------------------------------------

  if (!password.value) {
    passwordError.value =
      'Please enter your password.'

    isValid = false
  }


  return isValid
}


// ======================================================
// Focus first invalid field
// ======================================================

async function focusFirstError() {
  await nextTick()

  if (
    emailError.value
  ) {
    emailInput.value?.focus()
    return
  }

  if (
    passwordError.value
  ) {
    passwordInput.value?.focus()
  }
}


// ======================================================
// Login
// ======================================================

const handleLogin =
  async () => {
    successMessage.value =
      ''

    loginError.value =
      ''


    // --------------------------------------------------
    // Client-side validation
    // --------------------------------------------------

    const isValid =
      validateForm()

    if (!isValid) {
      await focusFirstError()
      return
    }


    const cleanEmail =
      email.value.trim()


    // --------------------------------------------------
    // Submit
    // --------------------------------------------------

    isSubmitting.value =
      true

    try {
      const result =
        await loginUser(
          cleanEmail,
          password.value,
        )


      // ------------------------------------------------
      // Login failed
      // ------------------------------------------------

      if (!result.success) {
        loginError.value =
          result.message ||
          'Unable to log in. Please check your details and try again.'

        return
      }


      // ------------------------------------------------
      // Protected-route redirect
      //
      // If the user originally attempted to access a
      // protected route, return them there after login.
      // ------------------------------------------------

      const redirectPath =
        route.query.redirect

      if (
        typeof redirectPath ===
          'string' &&
        redirectPath.startsWith(
          '/',
        )
      ) {
        await router.push(
          redirectPath,
        )

        return
      }


      // ------------------------------------------------
      // Administrator
      // ------------------------------------------------

      if (
        result.user.role ===
        'admin'
      ) {
        await router.push(
          '/admin',
        )

        return
      }


      // ------------------------------------------------
      // Normal user
      // ------------------------------------------------

      await router.push(
        '/account',
      )
    } catch (error) {
      console.error(
        'Login failed:',
        error,
      )

      loginError.value =
        'Unable to log in. Please try again.'
    } finally {
      isSubmitting.value =
        false
    }
  }
</script>


<template>
  <main
    class="
      bg-light
      py-5
    "
    aria-labelledby="login-title"
  >
    <div class="container">

      <div
        class="
          row
          justify-content-center
        "
      >
        <div
          class="
            col-12
            col-md-8
            col-lg-5
          "
        >

          <div
            class="
              card
              border-0
              shadow-sm
            "
          >
            <div
              class="
                card-body
                p-4
                p-md-5
              "
            >

              <!-- ================================================= -->
              <!-- Header -->
              <!-- ================================================= -->

              <div
                class="
                  text-center
                  mb-4
                "
              >

                <!-- Decorative icon -->
                <div
                  class="
                    fs-1
                    mb-2
                  "
                  aria-hidden="true"
                >
                  ♻️
                </div>


                <h1
                  id="login-title"
                  class="
                    h3
                    fw-bold
                  "
                >
                  Welcome Back
                </h1>


                <p
                  class="
                    text-muted
                    mb-0
                  "
                >
                  Log in to your
                  ZWV Circular Hub account.
                </p>

              </div>


              <!-- ================================================= -->
              <!-- Registration success -->
              <!-- ================================================= -->

              <div
                v-if="
                  successMessage
                "
                class="
                  alert
                  alert-success
                "
                role="status"
                aria-live="polite"
              >
                {{
                  successMessage
                }}
              </div>


              <!-- ================================================= -->
              <!-- Login/server error -->
              <!-- ================================================= -->

              <div
                v-if="
                  loginError
                "
                class="
                  alert
                  alert-danger
                "
                role="alert"
                aria-live="assertive"
              >
                {{
                  loginError
                }}
              </div>


              <!-- ================================================= -->
              <!-- Login form -->
              <!-- ================================================= -->

              <form
                novalidate
                @submit.prevent="
                  handleLogin
                "
              >

                <!-- =============================================== -->
                <!-- Email -->
                <!-- =============================================== -->

                <div
                  class="mb-3"
                >
                  <label
                    for="email"
                    class="
                      form-label
                      fw-semibold
                    "
                  >
                    Email

                    <span
                      class="
                        text-danger
                      "
                      aria-hidden="true"
                    >
                      *
                    </span>

                    <span
                      class="
                        visually-hidden
                      "
                    >
                      required
                    </span>
                  </label>


                  <input
                    id="email"
                    ref="emailInput"
                    v-model="email"
                    type="email"
                    class="
                      form-control
                    "
                    :class="{
                      'is-invalid':
                        emailError,
                    }"
                    placeholder="name@example.com"
                    autocomplete="email"
                    required
                    aria-required="true"
                    :aria-invalid="
                      emailError
                        ? 'true'
                        : 'false'
                    "
                    :aria-describedby="
                      emailError
                        ? 'login-email-help login-email-error'
                        : 'login-email-help'
                    "
                  />


                  <div
                    v-if="
                      emailError
                    "
                    id="login-email-error"
                    class="
                      invalid-feedback
                    "
                  >
                    {{
                      emailError
                    }}
                  </div>


                  <div
                    id="login-email-help"
                    class="
                      form-text
                    "
                  >
                    Enter the email
                    address associated
                    with your account.
                  </div>

                </div>


                <!-- =============================================== -->
                <!-- Password -->
                <!-- =============================================== -->

                <div
                  class="mb-4"
                >
                  <label
                    for="password"
                    class="
                      form-label
                      fw-semibold
                    "
                  >
                    Password

                    <span
                      class="
                        text-danger
                      "
                      aria-hidden="true"
                    >
                      *
                    </span>

                    <span
                      class="
                        visually-hidden
                      "
                    >
                      required
                    </span>
                  </label>


                  <input
                    id="password"
                    ref="passwordInput"
                    v-model="password"
                    type="password"
                    class="
                      form-control
                    "
                    :class="{
                      'is-invalid':
                        passwordError,
                    }"
                    placeholder="Enter your password"
                    autocomplete="current-password"
                    required
                    aria-required="true"
                    :aria-invalid="
                      passwordError
                        ? 'true'
                        : 'false'
                    "
                    :aria-describedby="
                      passwordError
                        ? 'login-password-help login-password-error'
                        : 'login-password-help'
                    "
                  />


                  <div
                    v-if="
                      passwordError
                    "
                    id="login-password-error"
                    class="
                      invalid-feedback
                    "
                  >
                    {{
                      passwordError
                    }}
                  </div>


                  <div
                    id="login-password-help"
                    class="
                      form-text
                    "
                  >
                    Enter your account
                    password.
                  </div>

                </div>


                <!-- =============================================== -->
                <!-- Submit -->
                <!-- =============================================== -->

                <button
                  type="submit"
                  class="
                    btn
                    btn-success
                    w-100
                    py-2
                  "
                  :disabled="
                    isSubmitting
                  "
                  :aria-busy="
                    isSubmitting
                      ? 'true'
                      : 'false'
                  "
                >
                  <span
                    v-if="
                      isSubmitting
                    "
                  >
                    <span
                      class="
                        spinner-border
                        spinner-border-sm
                        me-2
                      "
                      aria-hidden="true"
                    ></span>

                    Logging in...
                  </span>

                  <span v-else>
                    Log In
                  </span>
                </button>

              </form>


              <hr
                class="my-4"
              />


              <!-- ================================================= -->
              <!-- Register link -->
              <!-- ================================================= -->

              <p
                class="
                  text-center
                  text-muted
                  mb-0
                "
              >
                Don't have an account?

                <RouterLink
                  to="/register"
                  class="
                    text-success
                    fw-semibold
                  "
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


<style scoped>
.card {
  border-radius:
    16px;
}


/* ===================================================== */
/* Form focus */
/* ===================================================== */

.form-control:focus {
  border-color:
    var(--bs-success);

  box-shadow:
    0 0 0 0.25rem
    rgba(
      25,
      135,
      84,
      0.15
    );
}


/* ===================================================== */
/* Invalid input */
/* ===================================================== */

.form-control.is-invalid:focus {
  box-shadow:
    0 0 0 0.25rem
    rgba(
      220,
      53,
      69,
      0.15
    );
}


/* ===================================================== */
/* Button */
/* ===================================================== */

.btn {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}


.btn:hover:not(:disabled) {
  transform:
    translateY(-1px);
}
</style>