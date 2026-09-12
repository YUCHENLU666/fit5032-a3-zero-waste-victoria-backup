<script setup>
import { computed } from 'vue'
import {
  getCurrentUser,
  getUsers,
} from '../services/authService'

// Current logged-in user only contains safe information
const currentUser = getCurrentUser()

// Read full account list so we can also get createdAt
const users = getUsers()

// Find the full account that matches the logged-in user
const account = computed(() => {
  return (
    users.find(
      (user) => user.id === currentUser?.id
    ) || currentUser
  )
})

// Display joining date in a readable format
const joinedDate = computed(() => {
  if (!account.value?.createdAt) {
    return 'Not available'
  }

  return new Date(
    account.value.createdAt
  ).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
})

// Human-readable role name
const roleLabel = computed(() => {
  return account.value?.role === 'admin'
    ? 'Administrator'
    : 'Community User'
})
</script>


<template>
  <main class="bg-light py-5">
    <div class="container">

      <!-- ========================= -->
      <!-- Page header -->
      <!-- ========================= -->

      <div class="mb-4">
        <p class="text-success fw-semibold mb-2">
          MY ACCOUNT
        </p>

        <h1 class="fw-bold mb-2">
          Welcome, {{ account?.username }}
        </h1>

        <p class="text-muted mb-0">
          View your ZWV Circular Hub account information.
        </p>
      </div>


      <div class="row g-4">

        <!-- ========================= -->
        <!-- Account information -->
        <!-- ========================= -->

        <div class="col-12 col-lg-8">

          <div class="card border-0 shadow-sm">
            <div class="card-body p-4">

              <h2 class="h4 fw-bold mb-4">
                Account Details
              </h2>


              <!-- Username -->
              <div class="row py-3 border-bottom">

                <div class="col-5 text-muted">
                  Username
                </div>

                <div class="col-7 fw-semibold">
                  {{ account?.username }}
                </div>

              </div>


              <!-- Email -->
              <div class="row py-3 border-bottom">

                <div class="col-5 text-muted">
                  Email
                </div>

                <div class="col-7 fw-semibold">
                  {{ account?.email }}
                </div>

              </div>


              <!-- Role -->
              <div class="row py-3 border-bottom">

                <div class="col-5 text-muted">
                  Account Type
                </div>

                <div class="col-7">

                  <span
                    v-if="account?.role === 'admin'"
                    class="badge bg-dark"
                  >
                    {{ roleLabel }}
                  </span>

                  <span
                    v-else
                    class="badge bg-success"
                  >
                    {{ roleLabel }}
                  </span>

                </div>

              </div>


              <!-- Member since -->
              <div class="row py-3">

                <div class="col-5 text-muted">
                  Member Since
                </div>

                <div class="col-7 fw-semibold">
                  {{ joinedDate }}
                </div>

              </div>

            </div>
          </div>

        </div>


        <!-- ========================= -->
        <!-- Account access status -->
        <!-- ========================= -->

        <div class="col-12 col-lg-4">

          <div class="card border-0 shadow-sm h-100">
            <div class="card-body p-4">

              <h2 class="h5 fw-bold mb-4">
                Account Access
              </h2>


              <div class="d-flex align-items-center mb-3">

                <span class="fs-4 me-3">
                  ✅
                </span>

                <div>
                  <div class="fw-semibold">
                    Signed In
                  </div>

                  <small class="text-muted">
                    Your account is authenticated.
                  </small>
                </div>

              </div>


              <div class="d-flex align-items-center mb-3">

                <span class="fs-4 me-3">
                  🔐
                </span>

                <div>
                  <div class="fw-semibold">
                    Protected Account
                  </div>

                  <small class="text-muted">
                    This page requires authentication.
                  </small>
                </div>

              </div>


              <div class="d-flex align-items-center">

                <span class="fs-4 me-3">
                  ♻️
                </span>

                <div>
                  <div class="fw-semibold">
                    Circular Hub Member
                  </div>

                  <small class="text-muted">
                    You can participate in community features.
                  </small>
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>


      <!-- ========================= -->
      <!-- Future rating area -->
      <!-- ========================= -->

      <div class="card border-0 shadow-sm mt-4">
        <div class="card-body p-4">

          <h2 class="h5 fw-bold mb-2">
            My Community Activity
          </h2>

          <p class="text-muted mb-0">
            Your recycling location ratings will appear here.
          </p>

        </div>
      </div>

    </div>
  </main>
</template>