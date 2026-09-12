<script setup>
import { ref, watch } from 'vue'
import {
  RouterLink,
  useRoute,
  useRouter,
} from 'vue-router'

import {
  getCurrentUser,
  logoutUser,
} from '../services/authService'

const route = useRoute()
const router = useRouter()

// Store the current logged-in user
const currentUser = ref(null)

// Read the latest login state from localStorage
const refreshCurrentUser = () => {
  currentUser.value = getCurrentUser()
}

// Refresh authentication state whenever the route changes.
// This allows the navbar to update immediately after login/register.
watch(
  () => route.fullPath,
  () => {
    refreshCurrentUser()
  },
  {
    immediate: true,
  }
)

// Log the current user out
const handleLogout = () => {
  // Remove the current user from localStorage
  logoutUser()

  // Immediately update navbar state
  currentUser.value = null

  // Return to homepage
  router.push('/')
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
  >
    <div class="container">

      <!-- ========================= -->
      <!-- Brand -->
      <!-- ========================= -->

      <RouterLink
        class="navbar-brand fw-bold"
        to="/"
      >
        ♻ ZWV Circular Hub
      </RouterLink>


      <!-- ========================= -->
      <!-- Mobile navigation button -->
      <!-- ========================= -->

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNavbar"
        aria-controls="mainNavbar"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>


      <!-- ========================= -->
      <!-- Navigation links -->
      <!-- ========================= -->

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


          <!-- ================================================== -->
          <!-- Guest navigation -->
          <!-- ================================================== -->

          <template v-if="!currentUser">

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
            <li class="nav-item ms-lg-2">
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


          <!-- ================================================== -->
          <!-- Logged-in user navigation -->
          <!-- ================================================== -->

          <template v-else>

            <!-- Admin page:
                 only visible to administrators -->
            <li
              v-if="currentUser.role === 'admin'"
              class="nav-item"
            >
              <RouterLink
                class="nav-link"
                to="/admin"
              >
                Admin
              </RouterLink>
            </li>


            <!-- User account -->
            <li class="nav-item">
              <RouterLink
                class="nav-link"
                to="/account"
              >
                My Account
              </RouterLink>
            </li>


            <!-- Current username -->
            <li class="nav-item">
              <span
                class="
                  nav-link
                  text-success
                  fw-semibold
                "
              >
                Hi, {{ currentUser.username }}
              </span>
            </li>


            <!-- Logout -->
            <li class="nav-item ms-lg-2">
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