<script setup>
import {
  computed,
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
  loginWithGoogle,
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

const isGoogleSubmitting =
  ref(false)


// ======================================================
// Prevent multiple authentication requests
// ======================================================

const isBusy =
  computed(
    () =>
      isSubmitting.value ||
      isGoogleSubmitting.value,
  )


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
  emailError.value =
    ''

  passwordError.value =
    ''

  loginError.value =
    ''
}


// ======================================================
// Validate email/password form
// ======================================================

function validateForm() {
  clearErrors()


  let isValid =
    true


  const cleanEmail =
    email.value.trim()


  // --------------------------------------------------
  // Email
  // --------------------------------------------------

  if (
    !cleanEmail
  ) {
    emailError.value =
      'Please enter your email address.'

    isValid =
      false
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

      isValid =
        false
    }
  }


  // --------------------------------------------------
  // Password
  // --------------------------------------------------

  if (
    !password.value
  ) {
    passwordError.value =
      'Please enter your password.'

    isValid =
      false
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
    emailInput.value
      ?.focus()

    return
  }


  if (
    passwordError.value
  ) {
    passwordInput.value
      ?.focus()
  }
}


// ======================================================
// Redirect authenticated user
// ======================================================
//
// The same redirect behaviour is used for:
//
// - Email/password login
// - Google login
//
// Protected route requests are returned to the original
// page. Administrators go to /admin. Normal users go to
// /account.
// ======================================================

async function redirectAfterLogin(
  user,
) {
  const redirectPath =
    route.query.redirect


  // --------------------------------------------------
  // Original protected route
  // --------------------------------------------------

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


  // --------------------------------------------------
  // Administrator
  // --------------------------------------------------

  if (
    user?.role ===
    'admin'
  ) {
    await router.push(
      '/admin',
    )

    return
  }


  // --------------------------------------------------
  // Normal user
  // --------------------------------------------------

  await router.push(
    '/account',
  )
}


// ======================================================
// Email/password login
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


    if (
      !isValid
    ) {
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


      if (
        !result.success
      ) {
        loginError.value =
          result.message ||
          'Unable to log in. Please check your details and try again.'

        return
      }


      await redirectAfterLogin(
        result.user,
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


// ======================================================
// Google login
// ======================================================

const handleGoogleLogin =
  async () => {
    successMessage.value =
      ''

    clearErrors()


    isGoogleSubmitting.value =
      true


    try {
      const result =
        await loginWithGoogle()


      if (
        !result.success
      ) {
        loginError.value =
          result.message ||
          'Unable to sign in with Google.'

        return
      }


      await redirectAfterLogin(
        result.user,
      )
    } catch (error) {
      console.error(
        'Google login failed:',
        error,
      )


      loginError.value =
        'Unable to sign in with Google. Please try again.'
    } finally {
      isGoogleSubmitting.value =
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
    <div
      class="container"
    >
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
              <!-- Authentication error -->
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
                aria-atomic="true"
              >
                {{
                  loginError
                }}
              </div>


              <!-- ================================================= -->
              <!-- Email/password login -->
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
                    v-model="
                      email
                    "
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
                    :disabled="
                      isBusy
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
                    role="alert"
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
                    v-model="
                      password
                    "
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
                    :disabled="
                      isBusy
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
                    role="alert"
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
                <!-- Email login button -->
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
                    isBusy
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

                  <span
                    v-else
                  >
                    Log In
                  </span>
                </button>
              </form>


              <!-- ================================================= -->
              <!-- Divider -->
              <!-- ================================================= -->

              <div
                class="
                  login-divider
                  my-4
                "
                aria-hidden="true"
              >
                <span>
                  or
                </span>
              </div>


              <!-- ================================================= -->
              <!-- Google Sign-In -->
              <!-- ================================================= -->

              <button
                type="button"
                class="
                  btn
                  btn-outline-dark
                  google-login-button
                  w-100
                  py-2
                "
                :disabled="
                  isBusy
                "
                :aria-busy="
                  isGoogleSubmitting
                    ? 'true'
                    : 'false'
                "
                @click="
                  handleGoogleLogin
                "
              >
                <span
                  v-if="
                    isGoogleSubmitting
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

                  Connecting to Google...
                </span>


                <span
                  v-else
                  class="
                    d-inline-flex
                    align-items-center
                    justify-content-center
                    gap-2
                  "
                >
                  <span
                    class="
                      google-badge
                    "
                    aria-hidden="true"
                  >
                    G
                  </span>

                  Continue with Google
                </span>
              </button>


              <p
                class="
                  small
                  text-muted
                  text-center
                  mt-2
                  mb-0
                "
              >
                New Google users are
                automatically registered
                with a standard ZWV account.
              </p>


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
/* Divider */
/* ===================================================== */

.login-divider {
  display:
    flex;

  align-items:
    center;

  gap:
    0.9rem;

  color:
    #6c757d;

  font-size:
    0.9rem;
}


.login-divider::before,
.login-divider::after {
  content:
    '';

  flex:
    1;

  height:
    1px;

  background-color:
    #dee2e6;
}


/* ===================================================== */
/* Google button */
/* ===================================================== */

.google-login-button {
  min-height:
    46px;

  background-color:
    #ffffff;
}


.google-login-button:hover:not(:disabled) {
  background-color:
    #f8f9fa;

  color:
    #212529;
}


.google-badge {
  display:
    inline-flex;

  align-items:
    center;

  justify-content:
    center;

  width:
    24px;

  height:
    24px;

  border-radius:
    50%;

  background-color:
    #ffffff;

  border:
    1px solid
    #ced4da;

  font-weight:
    700;

  line-height:
    1;
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


/* ===================================================== */
/* Reduced motion */
/* ===================================================== */

@media (
  prefers-reduced-motion: reduce
) {
  .btn {
    transition:
      none;
  }


  .btn:hover:not(:disabled) {
    transform:
      none;
  }
}

</style>