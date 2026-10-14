<script setup>
import {
  computed,
} from 'vue'

import {
  RouterLink,
  useRoute,
} from 'vue-router'

import RecyclingCard
  from '../components/RecyclingCard.vue'

import {
  recyclingLocations,
} from '../data/recyclingLocations.js'


const route =
  useRoute()


// ======================================================
// Search parameters
// ======================================================

const searchItem =
  computed(() => {
    return (
      route.query.item ||
      ''
    )
  })


const searchPostcode =
  computed(() => {
    return (
      route.query.postcode ||
      ''
    )
  })


// ======================================================
// Filter locations
//
// 1. Match the selected material.
// 2. Prioritise an exact postcode match.
// 3. Sort remaining locations by distance.
// ======================================================

const filteredLocations =
  computed(() => {
    const item =
      searchItem.value
        .trim()
        .toLowerCase()

    const postcode =
      searchPostcode.value
        .trim()


    if (!item) {
      return []
    }


    // --------------------------------------------------
    // Match accepted material
    // --------------------------------------------------

    const matches =
      recyclingLocations.filter(
        (location) => {
          return (
            location
              .acceptedMaterials
              .some(
                (material) =>
                  material
                    .toLowerCase() ===
                  item,
              )
          )
        },
      )


    // --------------------------------------------------
    // Sort:
    // exact postcode first,
    // then nearest distance
    // --------------------------------------------------

    return matches.sort(
      (
        a,
        b,
      ) => {
        const aMatchesPostcode =
          a.postcode ===
          postcode
            ? 1
            : 0

        const bMatchesPostcode =
          b.postcode ===
          postcode
            ? 1
            : 0


        if (
          aMatchesPostcode !==
          bMatchesPostcode
        ) {
          return (
            bMatchesPostcode -
            aMatchesPostcode
          )
        }


        return (
          a.distance -
          b.distance
        )
      },
    )
  })
</script>


<template>
  <main
    aria-labelledby="search-results-title"
  >

    <!-- ================================================= -->
    <!-- Header -->
    <!-- ================================================= -->

    <section
      class="
        bg-light
        py-5
      "
      aria-labelledby="search-results-title"
    >
      <div
        class="
          container
          py-lg-4
        "
      >

        <p
          class="
            section-eyebrow
            fw-bold
            text-uppercase
            mb-2
          "
        >
          Recycling Finder
        </p>


        <h1
          id="search-results-title"
          class="
            display-5
            fw-bold
            mb-3
          "
        >
          Search Results
        </h1>


        <p
          class="
            lead
            text-secondary
            mb-0
          "
        >
          Showing recycling
          options for

          <strong>
            {{
              searchItem
            }}
          </strong>,

          with postcode

          <strong>
            {{
              searchPostcode
            }}
          </strong>

          prioritised.
        </p>

      </div>
    </section>


    <!-- ================================================= -->
    <!-- Results -->
    <!-- ================================================= -->

    <section
      class="
        py-5
      "
      aria-labelledby="available-locations-title"
    >
      <div
        class="
          container
        "
      >

        <!-- ================================================= -->
        <!-- Results summary -->
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
              id="available-locations-title"
              class="
                h4
                fw-bold
                mb-1
              "
            >
              Available locations
            </h2>


            <p
              class="
                text-secondary
                mb-0
              "
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {{
                filteredLocations.length
              }}

              {{
                filteredLocations.length ===
                1
                  ? 'recycling option found'
                  : 'recycling options found'
              }}
            </p>

          </div>


          <RouterLink
            to="/recycle"
            class="
              btn
              btn-outline-success
            "
          >
            <span
              aria-hidden="true"
            >
              ←
            </span>

            Change Search
          </RouterLink>

        </div>


        <!-- ================================================= -->
        <!-- Results available -->
        <!-- ================================================= -->

        <div
          v-if="
            filteredLocations.length >
            0
          "
          class="
            row
            g-4
          "
          aria-label="Matching recycling locations"
        >

          <div
            v-for="
              location in
              filteredLocations
            "
            :key="
              location.id
            "
            class="
              col-lg-6
            "
          >
            <RecyclingCard
              :location="
                location
              "
            />
          </div>

        </div>


        <!-- ================================================= -->
        <!-- No results -->
        <!-- ================================================= -->

        <section
          v-else
          class="
            text-center
            bg-light
            rounded-4
            p-5
          "
          aria-labelledby="no-results-title"
        >

          <div
            class="
              display-4
              mb-3
            "
            aria-hidden="true"
          >
            ♻
          </div>


          <h2
            id="no-results-title"
            class="
              h4
              fw-bold
            "
          >
            No matching locations found
          </h2>


          <p
            class="
              text-secondary
              mb-4
            "
          >
            Try another material or
            postcode to explore more
            recycling options.
          </p>


          <RouterLink
            to="/recycle"
            class="
              btn
              btn-success
            "
          >
            Search Again
          </RouterLink>

        </section>

      </div>
    </section>

  </main>
</template>


<style scoped>

/* ===================================================== */
/* Accessible colour */
/* ===================================================== */

.section-eyebrow {
  color:
    #146c43;
}


/* ===================================================== */
/* Buttons */
/* ===================================================== */

.btn {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}


.btn:hover {
  transform:
    translateY(-1px);
}


/* ===================================================== */
/* Reduced motion */
/* ===================================================== */

@media (
  prefers-reduced-motion: reduce
) {

  .btn {
    transition:
      none;
  }


  .btn:hover {
    transform:
      none;
  }

}
</style>