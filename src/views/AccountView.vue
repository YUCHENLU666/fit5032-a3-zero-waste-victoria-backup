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
      account.value =
        user
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
  <main
    class="
      bg-light
      py-5
    "
    aria-labelledby="account-page-title"
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
          mb-4
        "
      >

        <p
          class="
            account-eyebrow
            fw-semibold
            mb-2
          "
        >
          MY ACCOUNT
        </p>


        <h1
          id="account-page-title"
          class="
            fw-bold
            mb-2
          "
        >
          Welcome,
          {{
            account?.username ||
            'Member'
          }}
        </h1>


        <p
          class="
            text-muted
            mb-0
          "
        >
          View your ZWV Circular Hub
          account information.
        </p>

      </header>


      <!-- ================================================= -->
      <!-- Account loaded -->
      <!-- ================================================= -->

      <div
        v-if="
          account
        "
        class="
          row
          g-4
        "
      >

        <!-- ================================================= -->
        <!-- Account information -->
        <!-- ================================================= -->

        <section
          class="
            col-12
            col-lg-8
          "
          aria-labelledby="account-details-title"
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

              <h2
                id="account-details-title"
                class="
                  h4
                  fw-bold
                  mb-4
                "
              >
                Account Details
              </h2>


              <!-- =========================================== -->
              <!-- Semantic definition list -->
              <!-- =========================================== -->

              <dl
                class="
                  account-details
                  mb-0
                "
              >

                <!-- Username -->

                <div
                  class="
                    account-detail-row
                    border-bottom
                  "
                >
                  <dt>
                    Username
                  </dt>

                  <dd>
                    {{
                      account.username
                    }}
                  </dd>
                </div>


                <!-- Email -->

                <div
                  class="
                    account-detail-row
                    border-bottom
                  "
                >
                  <dt>
                    Email
                  </dt>

                  <dd
                    class="
                      text-break
                    "
                  >
                    {{
                      account.email
                    }}
                  </dd>
                </div>


                <!-- Role -->

                <div
                  class="
                    account-detail-row
                    border-bottom
                  "
                >
                  <dt>
                    Account Type
                  </dt>

                  <dd>

                    <span
                      v-if="
                        account.role ===
                        'admin'
                      "
                      class="
                        badge
                        bg-dark
                      "
                    >
                      {{
                        roleLabel
                      }}
                    </span>


                    <span
                      v-else
                      class="
                        badge
                        bg-success
                      "
                    >
                      {{
                        roleLabel
                      }}
                    </span>

                  </dd>
                </div>


                <!-- Member since -->

                <div
                  class="
                    account-detail-row
                  "
                >
                  <dt>
                    Member Since
                  </dt>

                  <dd>
                    {{
                      joinedDate
                    }}
                  </dd>
                </div>

              </dl>

            </div>
          </div>

        </section>


        <!-- ================================================= -->
        <!-- Authentication status -->
        <!-- ================================================= -->

        <section
          class="
            col-12
            col-lg-4
          "
          aria-labelledby="account-access-title"
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

              <h2
                id="account-access-title"
                class="
                  h5
                  fw-bold
                  mb-4
                "
              >
                Account Access
              </h2>


              <!-- =========================================== -->
              <!-- Firebase signed in -->
              <!-- =========================================== -->

              <div
                class="
                  d-flex
                  align-items-start
                  mb-4
                "
              >

                <span
                  class="
                    fs-4
                    me-3
                  "
                  aria-hidden="true"
                >
                  ✅
                </span>


                <div>

                  <div
                    class="
                      fw-semibold
                    "
                  >
                    Firebase Signed In
                  </div>


                  <small
                    class="
                      text-muted
                    "
                  >
                    Your identity is
                    authenticated using
                    Firebase
                    Authentication.
                  </small>

                </div>

              </div>


              <!-- =========================================== -->
              <!-- Protected route -->
              <!-- =========================================== -->

              <div
                class="
                  d-flex
                  align-items-start
                  mb-4
                "
              >

                <span
                  class="
                    fs-4
                    me-3
                  "
                  aria-hidden="true"
                >
                  🔐
                </span>


                <div>

                  <div
                    class="
                      fw-semibold
                    "
                  >
                    Protected Account
                  </div>


                  <small
                    class="
                      text-muted
                    "
                  >
                    This page is
                    protected by a
                    Vue Router
                    authentication
                    guard.
                  </small>

                </div>

              </div>


              <!-- =========================================== -->
              <!-- Firestore profile -->
              <!-- =========================================== -->

              <div
                class="
                  d-flex
                  align-items-start
                "
              >

                <span
                  class="
                    fs-4
                    me-3
                  "
                  aria-hidden="true"
                >
                  ☁️
                </span>


                <div>

                  <div
                    class="
                      fw-semibold
                    "
                  >
                    Firestore Profile
                  </div>


                  <small
                    class="
                      text-muted
                    "
                  >
                    Your application
                    profile and role
                    are stored in
                    Cloud Firestore.
                  </small>

                </div>

              </div>

            </div>
          </div>

        </section>

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
        aria-live="assertive"
        aria-atomic="true"
      >
        Your account information is
        currently unavailable.
      </div>


      <!-- ================================================= -->
      <!-- Community activity -->
      <!-- ================================================= -->

      <section
        v-if="
          account
        "
        class="
          card
          border-0
          shadow-sm
          mt-4
        "
        aria-labelledby="community-activity-title"
      >
        <div
          class="
            card-body
            p-4
          "
        >

          <h2
            id="community-activity-title"
            class="
              h5
              fw-bold
              mb-2
            "
          >
            My Community Activity
          </h2>


          <p
            class="
              text-muted
              mb-0
            "
          >
            Your recycling location
            ratings and future
            community activity will
            appear here.
          </p>

        </div>
      </section>

    </div>
  </main>
</template>


<style scoped>

/* ===================================================== */
/* Header colour */
/* ===================================================== */

.account-eyebrow {
  color:
    #146c43;
}


/* ===================================================== */
/* Account definition list */
/* ===================================================== */

.account-details {
  width:
    100%;
}


.account-detail-row {
  display:
    grid;

  grid-template-columns:
    minmax(
      120px,
      35%
    )
    1fr;

  gap:
    1rem;

  padding:
    1rem 0;
}


.account-detail-row dt {
  margin:
    0;

  color:
    #5c636a;

  font-weight:
    500;
}


.account-detail-row dd {
  margin:
    0;

  font-weight:
    600;
}


/* ===================================================== */
/* Responsive layout */
/* ===================================================== */

@media (
  max-width: 576px
) {

  .account-detail-row {
    grid-template-columns:
      1fr;

    gap:
      0.25rem;
  }

}
</style>