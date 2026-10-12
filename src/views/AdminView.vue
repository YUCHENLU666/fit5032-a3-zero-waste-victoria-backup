<script setup>
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
} from 'vue'

import {
  getCurrentUser,
  getUsers,
  subscribeToAuthState,
} from '../services/authService'


// ======================================================
// Current administrator
// ======================================================

const currentUser =
  ref(
    getCurrentUser(),
  )


const unsubscribe =
  subscribeToAuthState(
    (user) => {
      currentUser.value =
        user
    },
  )


onUnmounted(() => {
  unsubscribe()
})


// ======================================================
// User data from Firestore
// ======================================================

const users =
  ref([])

const isLoading =
  ref(true)

const loadError =
  ref('')


// ======================================================
// Load registered users
// ======================================================

const loadUsers =
  async () => {
    isLoading.value = true
    loadError.value = ''

    try {
      users.value =
        await getUsers()
    } catch (error) {
      console.error(
        'Failed to load Firestore users:',
        error,
      )

      loadError.value =
        'Unable to load registered users from Firestore.'
    } finally {
      isLoading.value =
        false
    }
  }


onMounted(() => {
  loadUsers()
})


// ======================================================
// Dashboard statistics
// ======================================================

const totalUsers =
  computed(() => {
    return users.value.length
  })


const normalUsers =
  computed(() => {
    return users.value.filter(
      (user) =>
        user.role === 'user',
    ).length
  })


const adminUsers =
  computed(() => {
    return users.value.filter(
      (user) =>
        user.role === 'admin',
    ).length
  })


// ======================================================
// Date formatting
// ======================================================

const formatDate =
  (createdAt) => {
    if (!createdAt) {
      return 'Not available'
    }


    // Support both ISO strings
    // and Firestore Timestamp objects.
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
  }
</script>


<template>
  <main class="bg-light py-5">
    <div class="container">

      <!-- ================================================= -->
      <!-- Page header -->
      <!-- ================================================= -->

      <div
        class="
          d-flex
          flex-column
          flex-md-row
          justify-content-between
          align-items-md-end
          gap-3
          mb-4
        "
      >

        <div>
          <p
            class="
              text-success
              fw-semibold
              mb-2
            "
          >
            ADMINISTRATION
          </p>

          <h1 class="fw-bold mb-2">
            Admin Dashboard
          </h1>

          <p class="text-muted mb-0">
            Welcome back,

            <strong>
              {{ currentUser?.username }}
            </strong>.

            Manage and review
            ZWV Circular Hub users.
          </p>
        </div>


        <!-- Refresh users -->
        <button
          type="button"
          class="
            btn
            btn-outline-success
          "
          :disabled="isLoading"
          @click="loadUsers"
        >
          <span v-if="isLoading">
            Loading...
          </span>

          <span v-else>
            Refresh Users
          </span>
        </button>

      </div>


      <!-- ================================================= -->
      <!-- Firestore error -->
      <!-- ================================================= -->

      <div
        v-if="loadError"
        class="alert alert-danger"
        role="alert"
        aria-live="polite"
      >
        {{ loadError }}
      </div>


      <!-- ================================================= -->
      <!-- Statistics -->
      <!-- ================================================= -->

      <div class="row g-3 mb-5">

        <!-- Total accounts -->
        <div class="col-12 col-md-4">

          <div
            class="
              card
              border-0
              shadow-sm
              h-100
            "
          >
            <div class="card-body p-4">

              <div
                class="
                  d-flex
                  justify-content-between
                  align-items-center
                "
              >

                <div>
                  <p class="text-muted mb-1">
                    Registered Accounts
                  </p>

                  <h2 class="fw-bold mb-0">
                    {{ totalUsers }}
                  </h2>
                </div>

                <div class="fs-1">
                  👥
                </div>

              </div>

            </div>
          </div>

        </div>


        <!-- Community users -->
        <div class="col-12 col-md-4">

          <div
            class="
              card
              border-0
              shadow-sm
              h-100
            "
          >
            <div class="card-body p-4">

              <div
                class="
                  d-flex
                  justify-content-between
                  align-items-center
                "
              >

                <div>
                  <p class="text-muted mb-1">
                    Community Users
                  </p>

                  <h2 class="fw-bold mb-0">
                    {{ normalUsers }}
                  </h2>
                </div>

                <div class="fs-1">
                  ♻️
                </div>

              </div>

            </div>
          </div>

        </div>


        <!-- Administrators -->
        <div class="col-12 col-md-4">

          <div
            class="
              card
              border-0
              shadow-sm
              h-100
            "
          >
            <div class="card-body p-4">

              <div
                class="
                  d-flex
                  justify-content-between
                  align-items-center
                "
              >

                <div>
                  <p class="text-muted mb-1">
                    Administrators
                  </p>

                  <h2 class="fw-bold mb-0">
                    {{ adminUsers }}
                  </h2>
                </div>

                <div class="fs-1">
                  🔐
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>


      <!-- ================================================= -->
      <!-- User table -->
      <!-- ================================================= -->

      <div
        class="
          card
          border-0
          shadow-sm
        "
      >

        <div class="card-body p-4">

          <div
            class="
              d-flex
              flex-column
              flex-md-row
              justify-content-between
              align-items-md-center
              gap-3
              mb-4
            "
          >

            <div>
              <h2 class="h4 fw-bold mb-1">
                Registered Users
              </h2>

              <p class="text-muted mb-0">
                Firebase authenticated users
                with application profiles
                stored in Cloud Firestore.
              </p>
            </div>


            <span
              class="
                badge
                text-bg-light
                border
                px-3
                py-2
              "
            >
              {{ totalUsers }}
              account(s)
            </span>

          </div>


          <!-- ================================================= -->
          <!-- Loading -->
          <!-- ================================================= -->

          <div
            v-if="isLoading"
            class="
              text-center
              py-5
            "
            aria-live="polite"
          >
            <div
              class="
                spinner-border
                text-success
                mb-3
              "
              role="status"
            >
              <span class="visually-hidden">
                Loading users
              </span>
            </div>

            <p class="text-muted mb-0">
              Loading users from Firestore...
            </p>
          </div>


          <!-- ================================================= -->
          <!-- Users available -->
          <!-- ================================================= -->

          <div
            v-else-if="
              users.length > 0
            "
            class="table-responsive"
          >

            <table
              class="
                table
                align-middle
                table-hover
              "
            >

              <thead class="table-light">
                <tr>
                  <th scope="col">
                    Username
                  </th>

                  <th scope="col">
                    Email
                  </th>

                  <th scope="col">
                    Role
                  </th>

                  <th scope="col">
                    Joined
                  </th>

                  <th scope="col">
                    Firebase UID
                  </th>
                </tr>
              </thead>


              <tbody>

                <tr
                  v-for="user in users"
                  :key="user.id"
                >

                  <!-- Username -->
                  <td class="fw-semibold">
                    {{ user.username }}
                  </td>


                  <!-- Email -->
                  <td>
                    {{ user.email }}
                  </td>


                  <!-- Role -->
                  <td>

                    <span
                      v-if="
                        user.role ===
                        'admin'
                      "
                      class="badge bg-dark"
                    >
                      Admin
                    </span>

                    <span
                      v-else
                      class="
                        badge
                        bg-success
                      "
                    >
                      User
                    </span>

                  </td>


                  <!-- Joined -->
                  <td class="text-muted">
                    {{
                      formatDate(
                        user.createdAt,
                      )
                    }}
                  </td>


                  <!-- Firebase UID -->
                  <td>
                    <code
                      class="
                        small
                        text-break
                      "
                    >
                      {{ user.id }}
                    </code>
                  </td>

                </tr>

              </tbody>

            </table>

          </div>


          <!-- ================================================= -->
          <!-- Empty Firestore collection -->
          <!-- ================================================= -->

          <div
            v-else
            class="
              text-center
              bg-light
              rounded-3
              py-5
              px-3
            "
          >
            <div class="fs-1 mb-3">
              👥
            </div>

            <h3 class="h5 fw-bold">
              No users found
            </h3>

            <p class="text-muted mb-0">
              Registered Firebase users
              will appear here after
              their Firestore profiles
              have been created.
            </p>
          </div>

        </div>

      </div>


      <!-- ================================================= -->
      <!-- Security notice -->
      <!-- ================================================= -->

      <div
        class="
          alert
          alert-success
          mt-4
          mb-0
        "
        role="status"
      >

        <strong>
          🔐 Role-protected Firebase page
        </strong>

        <div class="small mt-1">
          This dashboard requires Firebase Authentication
          and an administrator role stored in Cloud Firestore.
          Firestore security rules will also enforce access
          to protected user data.
        </div>

      </div>

    </div>
  </main>
</template>