<script setup>
import {
  nextTick,
  ref,
} from 'vue'

import {
  RouterLink,
  useRouter,
} from 'vue-router'

import {
  registerUser,
} from '../services/authService'


// ======================================================
// Router
// ======================================================

const router =
  useRouter()


// ======================================================
// Form fields
// ======================================================

const username =
  ref('')

const email =
  ref('')

const password =
  ref('')

const confirmPassword =
  ref('')


// ======================================================
// Input references
//
// Used to move keyboard focus to the first invalid field
// after validation fails.
// ======================================================

const usernameInput =
  ref(null)

const emailInput =
  ref(null)

const passwordInput =
  ref(null)

const confirmPasswordInput =
  ref(null)


// ======================================================
// Validation state
// ======================================================

const usernameError =
  ref('')

const emailError =
  ref('')

const passwordError =
  ref('')

const confirmPasswordError =
  ref('')

const registerError =
  ref('')

const isSubmitting =
  ref(false)


// ======================================================
// Clear validation errors
// ======================================================

function clearErrors() {
  usernameError.value = ''
  emailError.value = ''
  passwordError.value = ''
  confirmPasswordError.value = ''
  registerError.value = ''
}


// ======================================================
// Validate registration form
// ======================================================

function validateForm() {
  clearErrors()

  let isValid = true

  const cleanUsername =
    username.value.trim()

  const cleanEmail =
    email.value.trim()


  // --------------------------------------------------
  // Username validation
  // --------------------------------------------------

  if (!cleanUsername) {
    usernameError.value =
      'Please enter a username.'

    isValid = false
  } else if (
    cleanUsername.length < 3 ||
    cleanUsername.length > 20
  ) {
    usernameError.value =
      'Username must be between 3 and 20 characters.'

    isValid = false
  } else {
    const usernamePattern =
      /^[A-Za-z0-9 _-]+$/

    if (
      !usernamePattern.test(
        cleanUsername,
      )
    ) {
      usernameError.value =
        'Username can only contain letters, numbers, spaces, underscores and hyphens.'

      isValid = false
    }
  }


  // --------------------------------------------------
  // Email validation
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
  // Password validation
  // --------------------------------------------------

  if (!password.value) {
    passwordError.value =
      'Please enter a password.'

    isValid = false
  } else if (
    password.value.length < 8
  ) {
    passwordError.value =
      'Password must contain at least 8 characters.'

    isValid = false
  } else {
    const hasUppercase =
      /[A-Z]/.test(
        password.value,
      )

    const hasLowercase =
      /[a-z]/.test(
        password.value,
      )

    const hasNumber =
      /[0-9]/.test(
        password.value,
      )

    if (
      !hasUppercase ||
      !hasLowercase ||
      !hasNumber
    ) {
      passwordError.value =
        'Password must contain at least one uppercase letter, one lowercase letter, and one number.'

      isValid = false
    }
  }


  // --------------------------------------------------
  // Confirm password validation
  // --------------------------------------------------

  if (!confirmPassword.value) {
    confirmPasswordError.value =
      'Please confirm your password.'

    isValid = false
  } else if (
    password.value !==
    confirmPassword.value
  ) {
    confirmPasswordError.value =
      'Passwords do not match.'

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
    usernameError.value
  ) {
    usernameInput.value?.focus()
    return
  }

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
    return
  }

  if (
    confirmPasswordError.value
  ) {
    confirmPasswordInput.value?.focus()
  }
}


// ======================================================
// Register
// ======================================================

const handleRegister =
  async () => {

    registerError.value = ''

    const isValid =
      validateForm()

    if (!isValid) {
      await focusFirstError()
      return
    }


    const cleanUsername =
      username.value.trim()

    const cleanEmail =
      email.value.trim()


    isSubmitting.value =
      true

    try {
      const result =
        await registerUser(
          cleanUsername,
          cleanEmail,
          password.value,
        )


      // ------------------------------------------------
      // Registration failed
      // ------------------------------------------------

      if (!result.success) {
        registerError.value =
          result.message ||
          'Unable to create account. Please check your details and try again.'

        return
      }


      // ------------------------------------------------
      // Registration successful
      //
      // Navigate to Login and show a success message.
      // ------------------------------------------------

      await router.push({
        path: '/login',

        query: {
          registered:
            'true',
        },
      })
    } catch (error) {
      console.error(
        'Registration failed:',
        error,
      )

      registerError.value =
        'Unable to create account. Please try again.'
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
    aria-labelledby="register-title"
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
                  id="register-title"
                  class="
                    h3
                    fw-bold
                  "
                >
                  Create Account
                </h1>


                <p
                  class="
                    text-muted
                    mb-0
                  "
                >
                  Join the
                  ZWV Circular Hub
                  community.
                </p>

              </div>


              <!-- ================================================= -->
              <!-- Registration/server error -->
              <!-- ================================================= -->

              <div
                v-if="
                  registerError
                "
                class="
                  alert
                  alert-danger
                "
                role="alert"
                aria-live="assertive"
              >
                {{
                  registerError
                }}
              </div>


              <!-- ================================================= -->
              <!-- Registration form -->
              <!-- ================================================= -->

              <form
                novalidate
                @submit.prevent="
                  handleRegister
                "
              >

                <!-- =============================================== -->
                <!-- Username -->
                <!-- =============================================== -->

                <div
                  class="mb-3"
                >
                  <label
                    for="username"
                    class="
                      form-label
                      fw-semibold
                    "
                  >
                    Username

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
                    id="username"
                    ref="usernameInput"
                    v-model="username"
                    type="text"
                    class="
                      form-control
                    "
                    :class="{
                      'is-invalid':
                        usernameError,
                    }"
                    placeholder="Enter your username"
                    autocomplete="username"
                    minlength="3"
                    maxlength="20"
                    required
                    aria-required="true"
                    :aria-invalid="
                      usernameError
                        ? 'true'
                        : 'false'
                    "
                    :aria-describedby="
                      usernameError
                        ? 'username-help username-error'
                        : 'username-help'
                    "
                  />


                  <div
                    v-if="
                      usernameError
                    "
                    id="username-error"
                    class="
                      invalid-feedback
                    "
                  >
                    {{
                      usernameError
                    }}
                  </div>


                  <div
                    id="username-help"
                    class="
                      form-text
                    "
                  >
                    3–20 characters.
                    Letters, numbers,
                    spaces, underscores
                    and hyphens only.
                  </div>

                </div>


                <!-- =============================================== -->
                <!-- Email -->
                <!-- =============================================== -->

                <div
                  class="mb-3"
                >
                  <label
                    for="register-email"
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
                    id="register-email"
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
                        ? 'register-email-help register-email-error'
                        : 'register-email-help'
                    "
                  />


                  <div
                    v-if="
                      emailError
                    "
                    id="register-email-error"
                    class="
                      invalid-feedback
                    "
                  >
                    {{
                      emailError
                    }}
                  </div>


                  <div
                    id="register-email-help"
                    class="
                      form-text
                    "
                  >
                    Enter a valid
                    email address.
                  </div>

                </div>


                <!-- =============================================== -->
                <!-- Password -->
                <!-- =============================================== -->

                <div
                  class="mb-3"
                >
                  <label
                    for="register-password"
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
                    id="register-password"
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
                    autocomplete="new-password"
                    minlength="8"
                    required
                    aria-required="true"
                    :aria-invalid="
                      passwordError
                        ? 'true'
                        : 'false'
                    "
                    :aria-describedby="
                      passwordError
                        ? 'password-help password-error'
                        : 'password-help'
                    "
                  />


                  <div
                    v-if="
                      passwordError
                    "
                    id="password-error"
                    class="
                      invalid-feedback
                    "
                  >
                    {{
                      passwordError
                    }}
                  </div>


                  <div
                    id="password-help"
                    class="
                      form-text
                    "
                  >
                    Minimum 8 characters,
                    including uppercase,
                    lowercase and a number.
                  </div>

                </div>


                <!-- =============================================== -->
                <!-- Confirm password -->
                <!-- =============================================== -->

                <div
                  class="mb-4"
                >
                  <label
                    for="confirmPassword"
                    class="
                      form-label
                      fw-semibold
                    "
                  >
                    Confirm Password

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
                    id="confirmPassword"
                    ref="confirmPasswordInput"
                    v-model="
                      confirmPassword
                    "
                    type="password"
                    class="
                      form-control
                    "
                    :class="{
                      'is-invalid':
                        confirmPasswordError,
                    }"
                    placeholder="Enter your password again"
                    autocomplete="new-password"
                    required
                    aria-required="true"
                    :aria-invalid="
                      confirmPasswordError
                        ? 'true'
                        : 'false'
                    "
                    :aria-describedby="
                      confirmPasswordError
                        ? 'confirm-password-help confirm-password-error'
                        : 'confirm-password-help'
                    "
                  />


                  <div
                    v-if="
                      confirmPasswordError
                    "
                    id="confirm-password-error"
                    class="
                      invalid-feedback
                    "
                  >
                    {{
                      confirmPasswordError
                    }}
                  </div>


                  <div
                    id="confirm-password-help"
                    class="
                      form-text
                    "
                  >
                    Re-enter the same
                    password for
                    confirmation.
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

                    Creating account...
                  </span>

                  <span v-else>
                    Create Account
                  </span>
                </button>

              </form>


              <hr
                class="my-4"
              />


              <!-- ================================================= -->
              <!-- Login link -->
              <!-- ================================================= -->

              <p
                class="
                  text-center
                  text-muted
                  mb-0
                "
              >
                Already have an account?

                <RouterLink
                  to="/login"
                  class="
                    text-success
                    fw-semibold
                  "
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
/* Buttons */
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