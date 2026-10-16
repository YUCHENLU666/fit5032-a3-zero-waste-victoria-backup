<script setup>
import {
  onUnmounted,
  ref,
} from 'vue'

import {
  RouterLink,
  useRouter,
} from 'vue-router'

import {
  logoutUser,
  subscribeToAuthState,
} from '../services/authService'


const router =
  useRouter()


const currentUser =
  ref(null)


const logoutError =
  ref('')


// ======================================================
// Listen for Firebase authentication changes
// ======================================================
//
// Firebase authentication state can change asynchronously.
//
// The navbar therefore subscribes directly to the
// authentication service and updates automatically when
// the user signs in or signs out.
// ======================================================

const unsubscribe =
  subscribeToAuthState(
    (user) => {
      currentUser.value =
        user
    },
  )


// Stop listening when this component is destroyed.

onUnmounted(
  () => {
    unsubscribe()
  },
)


// ======================================================
// Logout
// ======================================================

const handleLogout =
  async () => {
    logoutError.value =
      ''

    try {
      await logoutUser()

      await router.push(
        '/',
      )
    } catch (error) {
      console.error(
        'Logout failed:',
        error,
      )

      logoutError.value =
        'Unable to log out. Please try again.'
    }
  }
</script>


<template>
  <nav
    class="
      navbar
      navbar-expand-lg
      navbar-light
      bg-white
      border-bottom
      sticky-top
    "
    aria-label="Main navigation"
  >
    <div
      class="container"
    >

      <!-- ================================================= -->
      <!-- Brand -->
      <!-- ================================================= -->

      <RouterLink
        class="
          navbar-brand
          fw-bold
        "
        to="/"
        aria-label="ZWV Circular Hub home"
      >
        <span
          aria-hidden="true"
        >
          ♻
        </span>


        <span>
          ZWV Circular Hub
        </span>
      </RouterLink>


      <!-- ================================================= -->
      <!-- Mobile navigation toggle -->
      <!-- ================================================= -->

      <button
        class="
          navbar-toggler
        "
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNavbar"
        aria-controls="mainNavbar"
        aria-expanded="false"
        aria-label="Toggle main navigation"
      >
        <span
          class="
            navbar-toggler-icon
          "
          aria-hidden="true"
        ></span>
      </button>


      <!-- ================================================= -->
      <!-- Main navigation -->
      <!-- ================================================= -->

      <div
        id="mainNavbar"
        class="
          collapse
          navbar-collapse
        "
      >
        <ul
          class="
            navbar-nav
            ms-auto
            align-items-lg-center
          "
        >

          <!-- ================================================= -->
          <!-- Public navigation -->
          <!-- ================================================= -->

          <li
            class="nav-item"
          >
            <RouterLink
              class="
                nav-link
              "
              to="/"
            >
              Home
            </RouterLink>
          </li>


          <!-- Recycle & Reuse -->

          <li
            class="nav-item"
          >
            <RouterLink
              class="
                nav-link
              "
              to="/recycle"
            >
              Recycle & Reuse
            </RouterLink>
          </li>


          <!-- Data Explorer -->

          <li
            class="nav-item"
          >
            <RouterLink
              class="
                nav-link
              "
              to="/data-explorer"
            >
              Data Explorer
            </RouterLink>
          </li>


          <!-- Recycling Map -->

          <li
            class="nav-item"
          >
            <RouterLink
              class="
                nav-link
              "
              to="/map"
            >
              Recycling Map
            </RouterLink>
          </li>


          <!-- ================================================= -->
          <!-- Recycling Impact Calculator -->
          <!-- ================================================= -->
          <!--
            Public serverless feature.

            The page calls the Firebase callable Cloud Function:

            calculateRecyclingImpact
          -->

          <li
            class="nav-item"
          >
            <RouterLink
              class="
                nav-link
              "
              to="/impact"
            >
              Impact Calculator
            </RouterLink>
          </li>


          <!-- ================================================= -->
          <!-- Guest navigation -->
          <!-- ================================================= -->

          <template
            v-if="
              !currentUser
            "
          >

            <!-- Login -->

            <li
              class="nav-item"
            >
              <RouterLink
                class="
                  nav-link
                "
                to="/login"
              >
                Login
              </RouterLink>
            </li>


            <!-- Register -->

            <li
              class="
                nav-item
                ms-lg-2
              "
            >
              <RouterLink
                class="
                  btn
                  btn-success
                  px-3
                  mt-2
                  mt-lg-0
                "
                to="/register"
              >
                Register
              </RouterLink>
            </li>

          </template>


          <!-- ================================================= -->
          <!-- Authenticated navigation -->
          <!-- ================================================= -->

          <template
            v-else
          >

            <!-- Email -->

            <li
              class="nav-item"
            >
              <RouterLink
                class="
                  nav-link
                "
                to="/email"
              >
                Email
              </RouterLink>
            </li>


            <!-- ================================================= -->
            <!-- Administrator only -->
            <!-- ================================================= -->

            <li
              v-if="
                currentUser.role ===
                'admin'
              "
              class="nav-item"
            >
              <RouterLink
                class="
                  nav-link
                "
                to="/admin"
              >
                Admin
              </RouterLink>
            </li>


            <!-- My Account -->

            <li
              class="nav-item"
            >
              <RouterLink
                class="
                  nav-link
                "
                to="/account"
              >
                My Account
              </RouterLink>
            </li>


            <!-- ================================================= -->
            <!-- Current signed-in user -->
            <!-- ================================================= -->

            <li
              class="nav-item"
            >
              <span
                class="
                  nav-link
                  text-success
                  fw-semibold
                "
              >
                <span
                  class="
                    visually-hidden
                  "
                >
                  Current signed-in user:
                </span>


                Hi,
                {{
                  currentUser.username
                }}
              </span>
            </li>


            <!-- ================================================= -->
            <!-- Logout -->
            <!-- ================================================= -->

            <li
              class="
                nav-item
                ms-lg-2
              "
            >
              <button
                type="button"
                class="
                  btn
                  btn-outline-success
                  px-3
                  mt-2
                  mt-lg-0
                "
                @click="
                  handleLogout
                "
              >
                Logout
              </button>
            </li>

          </template>

        </ul>
      </div>


      <!-- ================================================= -->
      <!-- Logout error -->
      <!-- ================================================= -->

      <div
        v-if="
          logoutError
        "
        class="
          visually-hidden
        "
        role="alert"
        aria-live="assertive"
      >
        {{
          logoutError
        }}
      </div>

    </div>
  </nav>
</template>