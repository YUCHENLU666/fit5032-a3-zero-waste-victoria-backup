<script setup>
import {
  computed,
  ref,
} from 'vue'

import {
  RouterLink,
} from 'vue-router'

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

const props =
  defineProps({
    location: {
      type: Object,
      required: true,
    },
  })


// ======================================================
// Accessible IDs
// ======================================================

const locationHeadingId =
  computed(() =>
    `recycling-location-${props.location.id}-title`,
  )

const ratingHelpId =
  computed(() =>
    `recycling-location-${props.location.id}-rating-help`,
  )


// ======================================================
// Current logged-in user
// ======================================================
//
// If no user is logged in,
// currentUser will be null.
// ======================================================

const currentUser =
  getCurrentUser()


// ======================================================
// Rating state
// ======================================================

const ratingSummary =
  ref(
    getRatingSummary(
      props.location.id,
    ),
  )


// Store the rating submitted by
// the currently logged-in user.

const existingUserRating =
  currentUser
    ? getUserRating(
        props.location.id,
        currentUser.id,
      )
    : null


const userRating =
  ref(
    existingUserRating
      ? existingUserRating.score
      : 0,
  )


// ======================================================
// Hover / keyboard preview
// ======================================================

const hoverRating =
  ref(0)


// ======================================================
// Rating feedback
// ======================================================

const ratingMessage =
  ref('')

const ratingMessageType =
  ref('success')


// ======================================================
// Refresh aggregated rating information
// ======================================================

const refreshRatingSummary =
  () => {
    ratingSummary.value =
      getRatingSummary(
        props.location.id,
      )
  }


// ======================================================
// Save or update rating
// ======================================================

const handleRating =
  (score) => {

    // Anonymous visitors cannot
    // submit ratings.
    if (!currentUser) {
      return
    }


    ratingMessage.value =
      ''

    ratingMessageType.value =
      'success'


    const result =
      saveRating(
        props.location.id,
        currentUser.id,
        score,
      )


    // --------------------------------------------------
    // Rating failed
    // --------------------------------------------------

    if (!result.success) {
      ratingMessageType.value =
        'error'

      ratingMessage.value =
        result.message ||
        'Unable to save your rating.'

      return
    }


    // --------------------------------------------------
    // Immediately update selected stars
    // --------------------------------------------------

    userRating.value =
      score


    // --------------------------------------------------
    // Refresh average and number of ratings
    // --------------------------------------------------

    refreshRatingSummary()


    // --------------------------------------------------
    // Show success feedback
    // --------------------------------------------------

    ratingMessageType.value =
      'success'

    ratingMessage.value =
      result.updated
        ? 'Your rating has been updated.'
        : 'Thank you for your rating.'
  }


// ======================================================
// Determine whether a star appears filled
// ======================================================

const isStarActive =
  (star) => {

    // While hovering / focusing,
    // show preview rating.
    if (
      hoverRating.value >
      0
    ) {
      return (
        star <=
        hoverRating.value
      )
    }


    // Otherwise show the
    // user's saved rating.
    return (
      star <=
      userRating.value
    )
  }
</script>


<template>

  <!-- ================================================= -->
  <!-- Recycling location card -->
  <!-- ================================================= -->

  <article
    class="
      card
      h-100
      border-0
      shadow-sm
      rounded-4
      result-card
    "
    :aria-labelledby="
      locationHeadingId
    "
  >

    <div
      class="
        card-body
        p-4
      "
    >

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

          <h2
            :id="
              locationHeadingId
            "
            class="
              h4
              fw-bold
              mb-1
            "
          >
            {{
              location.name
            }}
          </h2>


          <p
            class="
              text-secondary
              mb-0
            "
          >

            <span
              aria-hidden="true"
            >
              📍
            </span>

            {{
              location.suburb
            }}

            VIC

            {{
              location.postcode
            }}

          </p>

        </div>


        <!-- ================================================= -->
        <!-- Open / Closed badge -->
        <!-- ================================================= -->

        <span
          class="
            badge
            rounded-pill
          "
          :class="
            location.status ===
            'Open'
              ? 'text-bg-success'
              : 'text-bg-secondary'
          "
          :aria-label="
            `Location status: ${location.status}`
          "
        >
          {{
            location.status
          }}
        </span>

      </div>


      <hr />


      <!-- ================================================= -->
      <!-- Distance and community rating -->
      <!-- ================================================= -->

      <div
        class="
          row
          g-3
          mb-4
        "
      >

        <!-- Distance -->

        <div
          class="
            col-12
            col-sm-4
          "
        >

          <span
            class="
              text-secondary
              small
              d-block
            "
          >
            Distance
          </span>


          <span
            class="
              fw-semibold
            "
          >
            {{
              location.distance
            }}
            km
          </span>

        </div>


        <!-- ================================================= -->
        <!-- Aggregated community rating -->
        <!-- ================================================= -->

        <div
          class="
            col-12
            col-sm-8
          "
        >

          <span
            class="
              text-secondary
              small
              d-block
            "
          >
            Community Rating
          </span>


          <!-- No ratings yet -->

          <div
            v-if="
              ratingSummary.count ===
              0
            "
            class="
              fw-semibold
            "
          >
            No ratings yet
          </div>


          <!-- Existing rating -->

          <div v-else>

            <span
              class="
                fw-semibold
              "
            >

              <span
                aria-hidden="true"
              >
                ⭐
              </span>

              {{
                ratingSummary.average
              }}
              / 5

            </span>


            <span
              class="
                text-secondary
                ms-2
              "
            >
              (
              {{
                ratingSummary.count
              }}

              {{
                ratingSummary.count ===
                  1
                  ? 'rating'
                  : 'ratings'
              }}
              )
            </span>


            <!-- Screen-reader-friendly rating description -->

            <span
              class="
                visually-hidden
              "
            >
              Community rating
              {{
                ratingSummary.average
              }}
              out of 5,
              based on
              {{
                ratingSummary.count
              }}
              {{
                ratingSummary.count ===
                  1
                  ? 'rating'
                  : 'ratings'
              }}.
            </span>

          </div>

        </div>

      </div>


      <!-- ================================================= -->
      <!-- User rating controls -->
      <!-- ================================================= -->

      <section
        class="
          rating-panel
          rounded-3
          p-3
          mb-4
        "
        aria-labelledby="
          `${locationHeadingId}-rating-title`
        "
      >

        <h3
          :id="
            `${locationHeadingId}-rating-title`
          "
          class="
            h6
            fw-semibold
            mb-1
          "
        >
          Your Rating
        </h3>


        <!-- ================================================= -->
        <!-- Logged-in user -->
        <!-- ================================================= -->

        <template
          v-if="
            currentUser
          "
        >

          <p
            :id="
              ratingHelpId
            "
            class="
              small
              text-secondary
              mb-2
            "
          >

            <span
              v-if="
                userRating > 0
              "
            >
              You rated this
              location
              {{
                userRating
              }}/5.
              Select another
              star to update it.
            </span>


            <span v-else>
              Select a star to
              rate this location.
            </span>

          </p>


          <!-- ================================================= -->
          <!-- Current rating for assistive technologies -->
          <!-- ================================================= -->

          <p
            class="
              visually-hidden
            "
            aria-live="polite"
          >
            {{
              userRating > 0
                ? `Your current rating is ${userRating} out of 5.`
                : 'You have not rated this location yet.'
            }}
          </p>


          <!-- ================================================= -->
          <!-- Interactive 1–5 star rating -->
          <!-- ================================================= -->

          <div
            class="
              d-flex
              align-items-center
              gap-1
            "
            role="group"
            :aria-label="
              `Rate ${location.name}`
            "
            :aria-describedby="
              ratingHelpId
            "
            @mouseleave="
              hoverRating = 0
            "
          >

            <button
              v-for="
                star in 5
              "
              :key="
                star
              "
              type="button"
              class="
                star-button
              "
              :class="{
                active:
                  isStarActive(
                    star,
                  ),
              }"
              :aria-label="
                userRating === star
                  ? `${star} out of 5 stars, current rating`
                  : `Rate ${star} out of 5 stars`
              "
              @mouseenter="
                hoverRating =
                  star
              "
              @focus="
                hoverRating =
                  star
              "
              @blur="
                hoverRating =
                  0
              "
              @click="
                handleRating(
                  star,
                )
              "
            >
              <span
                aria-hidden="true"
              >
                ★
              </span>
            </button>

          </div>


          <!-- ================================================= -->
          <!-- Rating feedback -->
          <!-- ================================================= -->

          <div
            v-if="
              ratingMessage
            "
            class="
              small
              fw-semibold
              mt-2
            "
            :class="
              ratingMessageType ===
              'error'
                ? 'text-danger'
                : 'text-success'
            "
            :role="
              ratingMessageType ===
              'error'
                ? 'alert'
                : 'status'
            "
            :aria-live="
              ratingMessageType ===
              'error'
                ? 'assertive'
                : 'polite'
            "
          >
            {{
              ratingMessage
            }}
          </div>

        </template>


        <!-- ================================================= -->
        <!-- Anonymous visitor -->
        <!-- ================================================= -->

        <template v-else>

          <p
            class="
              text-secondary
              small
              mb-2
            "
          >
            Log in to contribute
            to the community
            rating.
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

      </section>


      <!-- ================================================= -->
      <!-- Accepted materials -->
      <!-- ================================================= -->

      <section
        class="mb-3"
        :aria-labelledby="
          `${locationHeadingId}-materials-title`
        "
      >

        <h3
          :id="
            `${locationHeadingId}-materials-title`
          "
          class="
            h6
            fw-semibold
            mb-2
          "
        >
          Accepted Materials
        </h3>


        <div
          class="
            d-flex
            flex-wrap
            gap-2
          "
        >

          <span
            v-for="
              material in
              location.acceptedMaterials
            "
            :key="
              material
            "
            class="
              badge
              text-bg-light
              border
              text-success
              px-3
              py-2
            "
          >
            {{
              material
            }}
          </span>

        </div>

      </section>


      <!-- ================================================= -->
      <!-- Location description -->
      <!-- ================================================= -->

      <p
        class="
          text-secondary
          mb-0
        "
      >
        {{
          location.description
        }}
      </p>

    </div>

  </article>
</template>


<style scoped>

/* ===================================================== */
/* Recycling card */
/* ===================================================== */

.result-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}


.result-card:hover {
  transform:
    translateY(-3px);
}


/* ===================================================== */
/* Rating panel */
/* ===================================================== */

.rating-panel {
  background-color:
    #f8f9fa;

  border:
    1px solid
    #e9ecef;
}


/* ===================================================== */
/* Individual star button */
/* ===================================================== */

.star-button {
  min-width:
    2.4rem;

  min-height:
    2.4rem;

  border:
    0;

  background:
    transparent;

  padding:
    0.1rem;

  font-size:
    1.8rem;

  line-height:
    1;

  /*
    Darker than the previous #adb5bd
    to provide better visibility.
  */
  color:
    #6c757d;

  cursor:
    pointer;

  transition:
    transform 0.15s ease,
    color 0.15s ease;
}


/* ===================================================== */
/* Filled / selected star */
/* ===================================================== */

.star-button.active {
  color:
    #8a5a00;
}


/* ===================================================== */
/* Star hover feedback */
/* ===================================================== */

.star-button:hover {
  transform:
    scale(1.15);
}


/* ===================================================== */
/* Keyboard focus */
/* ===================================================== */

.star-button:focus-visible {
  outline:
    3px solid
    #198754;

  outline-offset:
    3px;

  border-radius:
    4px;
}


/* ===================================================== */
/* Reduced motion */
/* ===================================================== */

@media (
  prefers-reduced-motion: reduce
) {

  .result-card,
  .star-button {
    transition:
      none;
  }


  .result-card:hover,
  .star-button:hover {
    transform:
      none;
  }

}
</style>