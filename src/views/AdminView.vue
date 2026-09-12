<script setup>
import { computed } from 'vue'
import {
  getUsers,
  getCurrentUser,
} from '../services/authService'

const currentUser = getCurrentUser()
const users = getUsers()

// Total number of registered accounts
const totalUsers = computed(() => users.length)

// Number of normal users
const normalUsers = computed(() =>
  users.filter((user) => user.role === 'user').length
)

// Number of administrators
const adminUsers = computed(() =>
  users.filter((user) => user.role === 'admin').length
)

// Make ISO date easier to read
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
</script>


<template>
  <main class="bg-light py-5">
    <div class="container">

      <!-- ========================= -->
      <!-- Page header -->
      <!-- ========================= -->

      <div class="mb-4">
        <p class="text-success fw-semibold mb-2">
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
          Manage and review ZWV Circular Hub users.
        </p>
      </div>


      <!-- ========================= -->
      <!-- Statistics -->
      <!-- ========================= -->

      <div class="row g-3 mb-5">

        <!-- Total accounts -->
        <div class="col-12 col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body p-4">

              <div class="d-flex justify-content-between align-items-center">

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


        <!-- Normal users -->
        <div class="col-12 col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body p-4">

              <div class="d-flex justify-content-between align-items-center">

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


        <!-- Admin users -->
        <div class="col-12 col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body p-4">

              <div class="d-flex justify-content-between align-items-center">

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


      <!-- ========================= -->
      <!-- User table -->
      <!-- ========================= -->

      <div class="card border-0 shadow-sm">

        <div class="card-body p-4">

          <div class="mb-4">
            <h2 class="h4 fw-bold mb-1">
              Registered Users
            </h2>

            <p class="text-muted mb-0">
              Accounts currently registered with the
              ZWV Circular Hub.
            </p>
          </div>


          <div class="table-responsive">

            <table class="table align-middle">

              <thead class="table-light">

                <tr>
                  <th>
                    Username
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Joined
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
                      v-if="user.role === 'admin'"
                      class="badge bg-dark"
                    >
                      Admin
                    </span>

                    <span
                      v-else
                      class="badge bg-success"
                    >
                      User
                    </span>

                  </td>


                  <!-- Created date -->
                  <td class="text-muted">
                    {{ formatDate(user.createdAt) }}
                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </div>

      </div>


      <!-- ========================= -->
      <!-- Security notice -->
      <!-- ========================= -->

      <div class="alert alert-success mt-4 mb-0">

        <strong>
          Role-protected page
        </strong>

        <div class="small mt-1">
          This dashboard can only be accessed by
          authenticated administrator accounts.
        </div>

      </div>

    </div>
  </main>
</template>