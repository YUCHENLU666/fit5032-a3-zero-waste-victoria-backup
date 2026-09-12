<script setup>
import { ref } from 'vue'

import {
  getCurrentUser,
} from '../services/authService'

import {
  getRatingSummary,
  getUserRating,
  saveRating,
} from '../services/ratingService'


// ======================================================
// Component properties
// ======================================================

const props = defineProps({
  location: {
    type: Object,
    required: true,
  },
})


// ======================================================
// Current logged-in user
// ======================================================

// If no user is logged in,
// currentUser will be null.
const currentUser = getCurrentUser()


// ======================================================
// Rating state
// ======================================================

// Get the aggregated community rating
// for this recycling location.
const ratingSummary = ref(
  getRatingSummary(props.location.id)
)


// Store the rating submitted by
// the currently logged-in user.
const existingUserRating = currentUser
  ? getUserRating(
      props.location.id,
      currentUser.id
    )
  : null

const userRating = ref(
  existingUserRating
    ? existingUserRating.score
    : 0
)


// Used when the mouse moves across stars
// to provide visual feedback.
const hoverRating = ref(0)


// Success/error feedback shown
// after the user submits a rating.
const ratingMessage = ref('')


// ======================================================
// Refresh aggregated rating information
// ======================================================

const refreshRatingSummary = () => {
  ratingSummary.value =
    getRatingSummary(props.location.id)
}


// ======================================================
// Save or update rating
// ======================================================

const handleRating = (score) => {

  // Anonymous visitors cannot submit ratings.
  if (!currentUser) {
    return
  }

  const result = saveRating(
    props.location.id,
    currentUser.id,
    score
  )

  if (!result.success) {
    ratingMessage.value =
      result.message

    return
  }

  // Immediately update selected stars
  userRating.value = score

  // Refresh average and number of ratings
  refreshRatingSummary()

  // Show appropriate feedback
  ratingMessage.value =
    result.updated
      ? 'Your rating has been updated.'
      : 'Thank you for your rating.'
}


// ======================================================
// Determine whether a star should appear filled
// ======================================================

const isStarActive = (star) => {

  // While hovering, use the hover value.
  if (hoverRating.value > 0) {
    return star <= hoverRating.value
  }

  // Otherwise show the user's saved rating.
  return star <= userRating.value
}
</script>


<template>
  <div
    class="
      card
      h-100
      border-0
      shadow-sm
      rounded-4
      result-card
    "
  >
    <div class="card-body p-4">

      <!-- ================================================= -->
      <!-- Location name and opening status -->
      <!-- ================================================= -->

      <div
        class="
          d-flex
          justify-content-between
          align-items-start
          gap-3
          mb-2
        "
      >
        <div>

          <h2 class="h4 fw-bold mb-1">
            {{ location.name }}
          </h2>

          <p class="text-secondary mb-0">
            📍
            {{ location.suburb }}
            VIC
            {{ location.postcode }}
          </p>

        </div>


        <!-- Open / Closed badge -->
        <span
          class="badge rounded-pill"
          :class="
            location.status === 'Open'
              ? 'text-bg-success'
              : 'text-bg-secondary'
          "
        >
          {{ location.status }}
        </span>

      </div>


      <hr />


      <!-- ================================================= -->
      <!-- Distance and community rating -->
      <!-- ================================================= -->

      <div class="row g-3 mb-4">

        <!-- Distance -->
        <div class="col-12 col-sm-4">

          <span
            class="text-secondary small d-block"
          >
            Distance
          </span>

          <span class="fw-semibold">
            {{ location.distance }} km
          </span>

        </div>


        <!-- Aggregated community rating -->
        <div class="col-12 col-sm-8">

          <span
            class="text-secondary small d-block"
          >
            Community Rating
          </span>


          <!-- No ratings yet -->
          <div
            v-if="ratingSummary.count === 0"
            class="fw-semibold"
          >
            No ratings yet
          </div>


          <!-- Existing aggregated rating -->
          <div v-else>

            <span class="fw-semibold">
              ⭐
              {{ ratingSummary.average }}
              / 5
            </span>

            <span class="text-secondary ms-2">
              (
              {{ ratingSummary.count }}
              {{
                ratingSummary.count === 1
                  ? 'rating'
                  : 'ratings'
              }}
              )
            </span>

          </div>

        </div>

      </div>


      <!-- ================================================= -->
      <!-- User rating controls -->
      <!-- ================================================= -->

      <div class="rating-panel rounded-3 p-3 mb-4">

        <p class="fw-semibold mb-1">
          Your Rating
        </p>


        <!-- =============================================== -->
        <!-- Logged-in user -->
        <!-- =============================================== -->

        <template v-if="currentUser">

          <p class="small text-secondary mb-2">

            <span v-if="userRating > 0">
              You rated this location
              {{ userRating }}/5.
              Select another star to update it.
            </span>

            <span v-else>
              Select a star to rate this location.
            </span>

          </p>


          <!-- Interactive 1–5 star rating -->
          <div
            class="
              d-flex
              align-items-center
              gap-1
            "
            @mouseleave="hoverRating = 0"
          >

            <button
              v-for="star in 5"
              :key="star"
              type="button"
              class="star-button"
              :class="{
                active: isStarActive(star)
              }"
              :aria-label="`Rate ${star} out of 5`"
              @mouseenter="hoverRating = star"
              @focus="hoverRating = star"
              @blur="hoverRating = 0"
              @click="handleRating(star)"
            >
              ★
            </button>

          </div>


          <!-- Rating feedback -->
          <div
            v-if="ratingMessage"
            class="
              small
              text-success
              fw-semibold
              mt-2
            "
            aria-live="polite"
          >
            {{ ratingMessage }}
          </div>

        </template>


        <!-- =============================================== -->
        <!-- Anonymous visitor -->
        <!-- =============================================== -->

        <template v-else>

          <p class="text-secondary small mb-2">
            Log in to contribute to the
            community rating.
          </p>

          <RouterLink
            to="/login"
            class="
              btn
              btn-outline-success
              btn-sm
            "
          >
            Log in to rate
          </RouterLink>

        </template>

      </div>


      <!-- ================================================= -->
      <!-- Accepted materials -->
      <!-- ================================================= -->

      <div class="mb-3">

        <p class="fw-semibold mb-2">
          Accepted Materials
        </p>

        <div class="d-flex flex-wrap gap-2">

          <span
            v-for="material in location.acceptedMaterials"
            :key="material"
            class="
              badge
              text-bg-light
              border
              text-success
              px-3
              py-2
            "
          >
            {{ material }}
          </span>

        </div>

      </div>


      <!-- ================================================= -->
      <!-- Location description -->
      <!-- ================================================= -->

      <p class="text-secondary mb-0">
        {{ location.description }}
      </p>

    </div>
  </div>
</template>


<style scoped>
/* Recycling result card hover animation */
.result-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.result-card:hover {
  transform: translateY(-3px);
}


/* Light background for rating section */
.rating-panel {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
}


/* Individual star button */
.star-button {
  border: 0;
  background: transparent;
  padding: 0 0.1rem;

  font-size: 1.8rem;
  line-height: 1;

  color: #adb5bd;

  cursor: pointer;

  transition:
    transform 0.15s ease,
    color 0.15s ease;
}


/* Filled / selected star */
.star-button.active {
  color: #f0ad4e;
}


/* Star hover feedback */
.star-button:hover {
  transform: scale(1.15);
}


/* Keyboard accessibility */
.star-button:focus-visible {
  outline: 2px solid #198754;
  outline-offset: 3px;
  border-radius: 3px;
}
</style>