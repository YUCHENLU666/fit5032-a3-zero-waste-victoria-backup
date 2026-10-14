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

const router = useRouter()

const currentUser = ref(null)


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
onUnmounted(() => {
  unsubscribe()
})


// ======================================================
// Logout
// ======================================================

const handleLogout =
  async () => {
    try {
      await logoutUser()

      await router.push('/')
    } catch (error) {
      console.error(
        'Logout failed:',
        error,
      )
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
    <div class="container">

      <!-- Brand -->
      <RouterLink
        class="navbar-brand fw-bold"
        to="/"
      >
        ♻ ZWV Circular Hub
      </RouterLink>


      <!-- Mobile navigation -->
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNavbar"
        aria-controls="mainNavbar"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span
          class="navbar-toggler-icon"
        ></span>
      </button>


      <div
        id="mainNavbar"
        class="collapse navbar-collapse"
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

          <!-- Home -->
          <li class="nav-item">
            <RouterLink
              class="nav-link"
              to="/"
            >
              Home
            </RouterLink>
          </li>


          <!-- Recycling Finder -->
          <li class="nav-item">
            <RouterLink
              class="nav-link"
              to="/recycle"
            >
              Recycle & Reuse
            </RouterLink>
          </li>


          <!-- Interactive Data Explorer -->
          <li class="nav-item">
            <RouterLink
              class="nav-link"
              to="/data-explorer"
            >
              Data Explorer
            </RouterLink>
          </li>


          <!-- ================================================= -->
          <!-- Guest navigation -->
          <!-- ================================================= -->

          <template
            v-if="!currentUser"
          >
            <!-- Login -->
            <li class="nav-item">
              <RouterLink
                class="nav-link"
                to="/login"
              >
                Login
              </RouterLink>
            </li>


            <!-- Register -->
            <li
              class="nav-item ms-lg-2"
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

          <template v-else>

            <!-- Email -->
            <li class="nav-item">
              <RouterLink
                class="nav-link"
                to="/email"
              >
                Email
              </RouterLink>
            </li>


            <!-- Admin only -->
            <li
              v-if="
                currentUser.role ===
                'admin'
              "
              class="nav-item"
            >
              <RouterLink
                class="nav-link"
                to="/admin"
              >
                Admin
              </RouterLink>
            </li>


            <!-- Account -->
            <li class="nav-item">
              <RouterLink
                class="nav-link"
                to="/account"
              >
                My Account
              </RouterLink>
            </li>


            <!-- Username -->
            <li class="nav-item">
              <span
                class="
                  nav-link
                  text-success
                  fw-semibold
                "
                aria-label="Current signed-in user"
              >
                Hi,
                {{ currentUser.username }}
              </span>
            </li>


            <!-- Logout -->
            <li
              class="nav-item ms-lg-2"
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
                @click="handleLogout"
              >
                Logout
              </button>
            </li>

          </template>

        </ul>
      </div>

    </div>
  </nav>
</template>