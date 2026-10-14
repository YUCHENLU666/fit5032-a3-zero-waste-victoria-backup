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
    isLoading.value =
      true

    loadError.value =
      ''

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


// Load users when page opens.
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
        user.role ===
        'user',
    ).length
  })


const adminUsers =
  computed(() => {
    return users.value.filter(
      (user) =>
        user.role ===
        'admin',
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


    // Support both:
    // 1. ISO date strings
    // 2. Firestore Timestamp objects.

    const date =
      typeof createdAt?.toDate ===
      'function'
        ? createdAt.toDate()
        : new Date(
            createdAt,
          )


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
        day:
          '2-digit',

        month:
          'short',

        year:
          'numeric',
      },
    )
  }
</script>


<template>
  <main
    class="
      bg-light
      py-5
    "
    aria-labelledby="admin-page-title"
  >
    <div
      class="
        container
      "
    >

      <!-- ================================================= -->
      <!-- Page header -->
      <!-- ================================================= -->

      <header
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
              admin-eyebrow
              fw-semibold
              mb-2
            "
          >
            ADMINISTRATION
          </p>


          <h1
            id="admin-page-title"
            class="
              fw-bold
              mb-2
            "
          >
            Admin Dashboard
          </h1>


          <p
            class="
              text-muted
              mb-0
            "
          >
            Welcome back,

            <strong>
              {{
                currentUser?.username ||
                'Administrator'
              }}
            </strong>.

            Manage and review
            ZWV Circular Hub users.
          </p>

        </div>


        <!-- ================================================= -->
        <!-- Refresh users -->
        <!-- ================================================= -->

        <button
          type="button"
          class="
            btn
            btn-outline-success
          "
          :disabled="
            isLoading
          "
          :aria-busy="
            isLoading
              ? 'true'
              : 'false'
          "
          @click="
            loadUsers
          "
        >

          <template
            v-if="
              isLoading
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

            Refreshing...

          </template>


          <template v-else>
            Refresh Users
          </template>

        </button>

      </header>


      <!-- ================================================= -->
      <!-- Firestore error -->
      <!-- ================================================= -->

      <div
        v-if="
          loadError
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
          loadError
        }}
      </div>


      <!-- ================================================= -->
      <!-- Dashboard statistics -->
      <!-- ================================================= -->

      <section
        class="
          mb-5
        "
        aria-labelledby="admin-statistics-title"
      >

        <h2
          id="admin-statistics-title"
          class="
            visually-hidden
          "
        >
          User account statistics
        </h2>


        <div
          class="
            row
            g-3
          "
        >

          <!-- ================================================= -->
          <!-- Total accounts -->
          <!-- ================================================= -->

          <div
            class="
              col-12
              col-md-4
            "
          >

            <div
              class="
                card
                border-0
                shadow-sm
                h-100
              "
            >
              <div
                class="
                  card-body
                  p-4
                "
              >

                <div
                  class="
                    d-flex
                    justify-content-between
                    align-items-center
                  "
                >

                  <div>

                    <p
                      class="
                        text-muted
                        mb-1
                      "
                    >
                      Registered Accounts
                    </p>


                    <p
                      class="
                        statistic-value
                        fw-bold
                        mb-0
                      "
                      aria-label="Total registered accounts"
                    >
                      {{
                        totalUsers
                      }}
                    </p>

                  </div>


                  <div
                    class="
                      fs-1
                    "
                    aria-hidden="true"
                  >
                    👥
                  </div>

                </div>

              </div>
            </div>

          </div>


          <!-- ================================================= -->
          <!-- Community users -->
          <!-- ================================================= -->

          <div
            class="
              col-12
              col-md-4
            "
          >

            <div
              class="
                card
                border-0
                shadow-sm
                h-100
              "
            >
              <div
                class="
                  card-body
                  p-4
                "
              >

                <div
                  class="
                    d-flex
                    justify-content-between
                    align-items-center
                  "
                >

                  <div>

                    <p
                      class="
                        text-muted
                        mb-1
                      "
                    >
                      Community Users
                    </p>


                    <p
                      class="
                        statistic-value
                        fw-bold
                        mb-0
                      "
                      aria-label="Total community users"
                    >
                      {{
                        normalUsers
                      }}
                    </p>

                  </div>


                  <div
                    class="
                      fs-1
                    "
                    aria-hidden="true"
                  >
                    ♻️
                  </div>

                </div>

              </div>
            </div>

          </div>


          <!-- ================================================= -->
          <!-- Administrators -->
          <!-- ================================================= -->

          <div
            class="
              col-12
              col-md-4
            "
          >

            <div
              class="
                card
                border-0
                shadow-sm
                h-100
              "
            >
              <div
                class="
                  card-body
                  p-4
                "
              >

                <div
                  class="
                    d-flex
                    justify-content-between
                    align-items-center
                  "
                >

                  <div>

                    <p
                      class="
                        text-muted
                        mb-1
                      "
                    >
                      Administrators
                    </p>


                    <p
                      class="
                        statistic-value
                        fw-bold
                        mb-0
                      "
                      aria-label="Total administrators"
                    >
                      {{
                        adminUsers
                      }}
                    </p>

                  </div>


                  <div
                    class="
                      fs-1
                    "
                    aria-hidden="true"
                  >
                    🔐
                  </div>

                </div>

              </div>
            </div>

          </div>

        </div>

      </section>


      <!-- ================================================= -->
      <!-- Registered users -->
      <!-- ================================================= -->

      <section
        class="
          card
          border-0
          shadow-sm
        "
        aria-labelledby="registered-users-title"
      >

        <div
          class="
            card-body
            p-4
          "
        >

          <!-- ================================================= -->
          <!-- Table heading -->
          <!-- ================================================= -->

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

              <h2
                id="registered-users-title"
                class="
                  h4
                  fw-bold
                  mb-1
                "
              >
                Registered Users
              </h2>


              <p
                id="registered-users-description"
                class="
                  text-muted
                  mb-0
                "
              >
                Firebase authenticated
                users with application
                profiles stored in
                Cloud Firestore.
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
              :aria-label="
                `${totalUsers} registered accounts`
              "
            >
              {{
                totalUsers
              }}

              {{
                totalUsers === 1
                  ? 'account'
                  : 'accounts'
              }}
            </span>

          </div>


          <!-- ================================================= -->
          <!-- Loading -->
          <!-- ================================================= -->

          <div
            v-if="
              isLoading
            "
            class="
              text-center
              py-5
            "
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >

            <div
              class="
                spinner-border
                text-success
                mb-3
              "
              aria-hidden="true"
            ></div>


            <p
              class="
                text-muted
                mb-0
              "
            >
              Loading users from
              Firestore...
            </p>

          </div>


          <!-- ================================================= -->
          <!-- Users available -->
          <!-- ================================================= -->

          <div
            v-else-if="
              users.length >
              0
            "
            class="
              table-responsive
            "
            tabindex="0"
            role="region"
            aria-label="Registered users table. Scroll horizontally if required."
            aria-describedby="registered-users-description"
          >

            <table
              class="
                table
                align-middle
                table-hover
                mb-0
              "
            >

              <!-- ============================================= -->
              <!-- Accessible table caption -->
              <!-- ============================================= -->

              <caption
                class="
                  visually-hidden
                "
              >
                Registered ZWV Circular
                Hub users, including
                username, email,
                account role, join date
                and Firebase UID.
              </caption>


              <thead
                class="
                  table-light
                "
              >
                <tr>

                  <th
                    scope="col"
                  >
                    Username
                  </th>


                  <th
                    scope="col"
                  >
                    Email
                  </th>


                  <th
                    scope="col"
                  >
                    Role
                  </th>


                  <th
                    scope="col"
                  >
                    Joined
                  </th>


                  <th
                    scope="col"
                  >
                    Firebase UID
                  </th>

                </tr>
              </thead>


              <tbody>

                <tr
                  v-for="
                    user in
                    users
                  "
                  :key="
                    user.id
                  "
                >

                  <!-- ========================================= -->
                  <!-- Username / row heading -->
                  <!-- ========================================= -->

                  <th
                    scope="row"
                    class="
                      fw-semibold
                    "
                  >
                    {{
                      user.username
                    }}
                  </th>


                  <!-- ========================================= -->
                  <!-- Email -->
                  <!-- ========================================= -->

                  <td
                    class="
                      text-break
                    "
                  >
                    {{
                      user.email
                    }}
                  </td>


                  <!-- ========================================= -->
                  <!-- Role -->
                  <!-- ========================================= -->

                  <td>

                    <span
                      v-if="
                        user.role ===
                        'admin'
                      "
                      class="
                        badge
                        bg-dark
                      "
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


                  <!-- ========================================= -->
                  <!-- Joined -->
                  <!-- ========================================= -->

                  <td
                    class="
                      text-muted
                    "
                  >
                    {{
                      formatDate(
                        user.createdAt,
                      )
                    }}
                  </td>


                  <!-- ========================================= -->
                  <!-- Firebase UID -->
                  <!-- ========================================= -->

                  <td>

                    <code
                      class="
                        small
                        text-break
                      "
                    >
                      {{
                        user.id
                      }}
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
            role="status"
            aria-live="polite"
          >

            <div
              class="
                fs-1
                mb-3
              "
              aria-hidden="true"
            >
              👥
            </div>


            <h3
              class="
                h5
                fw-bold
              "
            >
              No users found
            </h3>


            <p
              class="
                text-muted
                mb-0
              "
            >
              Registered Firebase
              users will appear here
              after their Firestore
              profiles have been
              created.
            </p>

          </div>

        </div>

      </section>


      <!-- ================================================= -->
      <!-- Security notice -->
      <!-- ================================================= -->

      <aside
        class="
          alert
          alert-success
          mt-4
          mb-0
        "
        aria-labelledby="admin-security-title"
      >

        <h2
          id="admin-security-title"
          class="
            h6
            fw-bold
            mb-1
          "
        >

          <span
            aria-hidden="true"
          >
            🔐
          </span>

          Role-protected Firebase page
        </h2>


        <p
          class="
            small
            mb-0
          "
        >
          This dashboard requires
          Firebase Authentication and
          an administrator role stored
          in Cloud Firestore.

          Firestore security rules also
          enforce access to protected
          user data.
        </p>

      </aside>

    </div>
  </main>
</template>


<style scoped>

/* ===================================================== */
/* Accessible colour helpers */
/* ===================================================== */

.admin-eyebrow {
  color:
    #146c43;
}


/*
  Bootstrap muted text is slightly
  light on some pale backgrounds.
  A darker value gives more reliable
  WCAG AA contrast.
*/

.text-muted {
  color:
    #495057 !important;
}


/* ===================================================== */
/* Statistics */
/* ===================================================== */

.statistic-value {
  font-size:
    2rem;

  line-height:
    1.15;
}


/* ===================================================== */
/* Table */
/* ===================================================== */

.table-responsive {
  border-radius:
    0.5rem;
}


/*
  The responsive table can become
  horizontally scrollable on narrow
  screens.

  tabindex="0" allows keyboard users
  to focus and scroll this region.
*/

.table-responsive:focus-visible {
  outline:
    3px solid
    #0b5d1e;

  outline-offset:
    4px;
}


/* ===================================================== */
/* Firebase UID */
/* ===================================================== */

code {
  color:
    #343a40;
}


/* ===================================================== */
/* Reduced motion */
/* ===================================================== */

@media (
  prefers-reduced-motion: reduce
) {

  .spinner-border {
    animation:
      none !important;
  }

}
</style>