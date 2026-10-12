<script setup>
import {
  computed,
  onUnmounted,
  ref,
} from 'vue'

import {
  getCurrentUser,
  subscribeToAuthState,
} from '../services/authService'


// ======================================================
// Current authenticated Firebase user
// ======================================================
//
// The router waits for Firebase Authentication to finish
// restoring the session before this protected page opens.
//
// We still subscribe to authentication changes so that
// this page stays in sync if the Firebase session changes.
// ======================================================

const account =
  ref(
    getCurrentUser(),
  )


const unsubscribe =
  subscribeToAuthState(
    (user) => {
      account.value = user
    },
  )


onUnmounted(() => {
  unsubscribe()
})


// ======================================================
// Member since
// ======================================================

const joinedDate =
  computed(() => {
    const createdAt =
      account.value?.createdAt

    if (!createdAt) {
      return 'Not available'
    }


    // Support both:
    // 1. ISO date strings
    // 2. Firestore Timestamp objects
    const date =
      typeof createdAt?.toDate ===
      'function'
        ? createdAt.toDate()
        : new Date(createdAt)


    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return 'Not available'
    }


    return date.toLocaleDateString(
      'en-AU',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    )
  })


// ======================================================
// Human-readable role
// ======================================================

const roleLabel =
  computed(() => {
    return (
      account.value?.role ===
      'admin'
        ? 'Administrator'
        : 'Community User'
    )
  })
</script>


<template>
  <main class="bg-light py-5">
    <div class="container">

      <!-- ================================================= -->
      <!-- Page header -->
      <!-- ================================================= -->

      <div class="mb-4">
        <p
          class="
            text-success
            fw-semibold
            mb-2
          "
        >
          MY ACCOUNT
        </p>

        <h1 class="fw-bold mb-2">
          Welcome,
          {{ account?.username }}
        </h1>

        <p class="text-muted mb-0">
          View your ZWV Circular Hub account information.
        </p>
      </div>


      <!-- ================================================= -->
      <!-- Account loaded -->
      <!-- ================================================= -->

      <div
        v-if="account"
        class="row g-4"
      >

        <!-- ================================================= -->
        <!-- Account information -->
        <!-- ================================================= -->

        <div class="col-12 col-lg-8">

          <div
            class="
              card
              border-0
              shadow-sm
              h-100
            "
          >
            <div class="card-body p-4">

              <h2 class="h4 fw-bold mb-4">
                Account Details
              </h2>


              <!-- Username -->
              <div
                class="
                  row
                  py-3
                  border-bottom
                "
              >
                <div
                  class="
                    col-5
                    text-muted
                  "
                >
                  Username
                </div>

                <div
                  class="
                    col-7
                    fw-semibold
                  "
                >
                  {{ account.username }}
                </div>
              </div>


              <!-- Email -->
              <div
                class="
                  row
                  py-3
                  border-bottom
                "
              >
                <div
                  class="
                    col-5
                    text-muted
                  "
                >
                  Email
                </div>

                <div
                  class="
                    col-7
                    fw-semibold
                    text-break
                  "
                >
                  {{ account.email }}
                </div>
              </div>


              <!-- Role -->
              <div
                class="
                  row
                  py-3
                  border-bottom
                "
              >
                <div
                  class="
                    col-5
                    text-muted
                  "
                >
                  Account Type
                </div>

                <div class="col-7">

                  <span
                    v-if="
                      account.role ===
                      'admin'
                    "
                    class="badge bg-dark"
                  >
                    {{ roleLabel }}
                  </span>

                  <span
                    v-else
                    class="
                      badge
                      bg-success
                    "
                  >
                    {{ roleLabel }}
                  </span>

                </div>
              </div>


              <!-- Member since -->
              <div
                class="
                  row
                  py-3
                "
              >
                <div
                  class="
                    col-5
                    text-muted
                  "
                >
                  Member Since
                </div>

                <div
                  class="
                    col-7
                    fw-semibold
                  "
                >
                  {{ joinedDate }}
                </div>
              </div>

            </div>
          </div>

        </div>


        <!-- ================================================= -->
        <!-- Authentication status -->
        <!-- ================================================= -->

        <div class="col-12 col-lg-4">

          <div
            class="
              card
              border-0
              shadow-sm
              h-100
            "
          >
            <div class="card-body p-4">

              <h2 class="h5 fw-bold mb-4">
                Account Access
              </h2>


              <!-- Signed in -->
              <div
                class="
                  d-flex
                  align-items-center
                  mb-4
                "
              >
                <span class="fs-4 me-3">
                  ✅
                </span>

                <div>
                  <div class="fw-semibold">
                    Firebase Signed In
                  </div>

                  <small class="text-muted">
                    Your identity is authenticated
                    using Firebase Authentication.
                  </small>
                </div>
              </div>


              <!-- Protected route -->
              <div
                class="
                  d-flex
                  align-items-center
                  mb-4
                "
              >
                <span class="fs-4 me-3">
                  🔐
                </span>

                <div>
                  <div class="fw-semibold">
                    Protected Account
                  </div>

                  <small class="text-muted">
                    This page is protected by
                    a Vue Router authentication guard.
                  </small>
                </div>
              </div>


              <!-- Firestore profile -->
              <div
                class="
                  d-flex
                  align-items-center
                "
              >
                <span class="fs-4 me-3">
                  ☁️
                </span>

                <div>
                  <div class="fw-semibold">
                    Firestore Profile
                  </div>

                  <small class="text-muted">
                    Your application profile and role
                    are stored in Cloud Firestore.
                  </small>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>


      <!-- ================================================= -->
      <!-- Profile unavailable -->
      <!-- ================================================= -->

      <div
        v-else
        class="
          alert
          alert-warning
        "
        role="alert"
      >
        Your account information is currently unavailable.
      </div>


      <!-- ================================================= -->
      <!-- Community activity -->
      <!-- ================================================= -->

      <div
        v-if="account"
        class="
          card
          border-0
          shadow-sm
          mt-4
        "
      >
        <div class="card-body p-4">

          <h2 class="h5 fw-bold mb-2">
            My Community Activity
          </h2>

          <p class="text-muted mb-0">
            Your recycling location ratings
            and future community activity
            will appear here.
          </p>

        </div>
      </div>

    </div>
  </main>
</template>