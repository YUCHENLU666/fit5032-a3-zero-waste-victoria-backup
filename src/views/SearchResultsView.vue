<script setup>
import {
  computed,
  ref,
  watch,
} from 'vue'

import {
  RouterLink,
  useRoute,
} from 'vue-router'

import RecyclingCard
  from '../components/RecyclingCard.vue'

import {
  recommendRecyclingLocations,
} from '../services/recommendationService'


const route =
  useRoute()


// ======================================================
// Search parameters
// ======================================================

const searchItem =
  computed(
    () => {
      return (
        route.query.item ||
        ''
      )
    },
  )


const searchPostcode =
  computed(
    () => {
      return (
        route.query.postcode ||
        ''
      )
    },
  )


// ======================================================
// Result state
// ======================================================

const recommendations =
  ref([])


const totalMatches =
  ref(0)


const rankingExplanation =
  ref('')


const isLoading =
  ref(false)


const errorMessage =
  ref('')


// ======================================================
// Material aliases
// ======================================================
//
// The Recycle & Reuse form allows free text.
//
// The backend Cloud Function accepts five canonical
// categories:
//
// Batteries
// E-Waste
// Plastics
// Clothing
// Furniture
//
// This mapping makes the finder more user friendly.
//
// Examples:
//
// battery     -> Batteries
// electronics -> E-Waste
// plastic     -> Plastics
// clothes     -> Clothing
// ======================================================

const materialAliases = {
  battery:
    'Batteries',

  batteries:
    'Batteries',

  'e-waste':
    'E-Waste',

  'e waste':
    'E-Waste',

  ewaste:
    'E-Waste',

  electronic:
    'E-Waste',

  electronics:
    'E-Waste',

  'electronic waste':
    'E-Waste',

  plastic:
    'Plastics',

  plastics:
    'Plastics',

  clothing:
    'Clothing',

  clothes:
    'Clothing',

  cloth:
    'Clothing',

  textile:
    'Clothing',

  textiles:
    'Clothing',

  furniture:
    'Furniture',
}


// ======================================================
// Canonical material
// ======================================================

const canonicalMaterial =
  computed(
    () => {
      const cleanItem =
        searchItem.value
          .trim()
          .toLowerCase()


      return (
        materialAliases[
          cleanItem
        ] ||
        ''
      )
    },
  )


// ======================================================
// Postcode validation
// ======================================================

const cleanPostcode =
  computed(
    () =>
      searchPostcode.value
        .trim(),
  )


const isPostcodeValid =
  computed(
    () => {
      if (
        !/^\d{4}$/.test(
          cleanPostcode.value,
        )
      ) {
        return false
      }


      const postcodeNumber =
        Number(
          cleanPostcode.value,
        )


      return (
        postcodeNumber >=
          3000 &&
        postcodeNumber <=
          3999
      )
    },
  )


// ======================================================
// Load smart recommendations
// ======================================================
//
// The page no longer filters recycling location data
// locally.
//
// Instead:
//
// Vue frontend
//      ↓
// recommendationService
//      ↓
// recommendRecyclingLocations
//      ↓
// Firebase Cloud Function
//
// The Cloud Function performs:
//
// 1. Material filtering
// 2. Postcode matching
// 3. Open / closed prioritisation
// 4. Rating comparison
// 5. Approximate distance comparison
// 6. Recommendation scoring
// 7. Top-five result selection
// ======================================================

const loadRecommendations =
  async () => {
    recommendations.value =
      []

    totalMatches.value =
      0

    rankingExplanation.value =
      ''

    errorMessage.value =
      ''


    // --------------------------------------------------
    // Missing query values
    // --------------------------------------------------

    if (
      !searchItem.value ||
      !searchPostcode.value
    ) {
      errorMessage.value =
        'Search information is missing. Please start a new recycling search.'

      return
    }


    // --------------------------------------------------
    // Unsupported material
    // --------------------------------------------------

    if (
      !canonicalMaterial.value
    ) {
      errorMessage.value =
        'This item does not match a supported recycling category. Please try Batteries, E-Waste, Plastics, Clothing or Furniture.'

      return
    }


    // --------------------------------------------------
    // Invalid Victorian postcode
    // --------------------------------------------------

    if (
      !isPostcodeValid.value
    ) {
      errorMessage.value =
        'Please enter a valid Victorian postcode between 3000 and 3999.'

      return
    }


    // --------------------------------------------------
    // Start request
    // --------------------------------------------------

    isLoading.value =
      true


    try {
      const response =
        await recommendRecyclingLocations({
          material:
            canonicalMaterial.value,

          postcode:
            cleanPostcode.value,
        })


      if (
        !response.success
      ) {
        errorMessage.value =
          response.message ||
          'Unable to load recycling recommendations.'

        return
      }


      recommendations.value =
        response.data
          ?.recommendations ||
        []


      totalMatches.value =
        response.data
          ?.totalMatches ||
        0


      rankingExplanation.value =
        response.data
          ?.rankingExplanation ||
        'Locations are ranked using material compatibility, postcode, opening status, rating and approximate distance.'
    } catch (error) {
      console.error(
        'Unable to load recycling recommendations:',
        error,
      )


      errorMessage.value =
        'Unable to load recycling recommendations. Please try again.'
    } finally {
      isLoading.value =
        false
    }
  }


// ======================================================
// Reload when URL search parameters change
// ======================================================

watch(
  [
    searchItem,
    searchPostcode,
  ],

  () => {
    loadRecommendations()
  },

  {
    immediate:
      true,
  },
)


// ======================================================
// Recommendation rank
// ======================================================

const getRankLabel =
  (index) => {
    if (
      index ===
      0
    ) {
      return (
        'Best Match'
      )
    }


    return (
      `Recommendation ${index + 1}`
    )
  }
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
        results-hero
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
          Recommended Recycling Options
        </h1>


        <p
          class="
            lead
            text-secondary
            mb-0
            results-intro
          "
        >
          Smart recommendations for

          <strong>
            {{
              searchItem
            }}
          </strong>

          near postcode

          <strong>
            {{
              searchPostcode
            }}
          </strong>.
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
      :aria-busy="
        isLoading
          ? 'true'
          : 'false'
      "
    >
      <div
        class="
          container
        "
      >

        <!-- ================================================= -->
        <!-- Results heading -->
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
                h3
                fw-bold
                mb-1
              "
            >
              Recommended locations
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
              <template
                v-if="
                  isLoading
                "
              >
                Finding the best
                recycling options...
              </template>


              <template
                v-else-if="
                  !errorMessage
                "
              >
                {{
                  totalMatches
                }}

                {{
                  totalMatches ===
                    1
                    ? 'matching location found'
                    : 'matching locations found'
                }}

                <template
                  v-if="
                    recommendations.length >
                    0
                  "
                >
                  · Showing top
                  {{
                    recommendations.length
                  }}
                </template>
              </template>
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
        <!-- Loading -->
        <!-- ================================================= -->

        <section
          v-if="
            isLoading
          "
          class="
            loading-state
            text-center
            rounded-4
            p-5
          "
          role="status"
          aria-live="polite"
        >
          <div
            class="
              spinner-border
              text-success
              mb-3
            "
            aria-hidden="true"
          ></div>


          <h2
            class="
              h4
              fw-bold
            "
          >
            Finding your best matches
          </h2>


          <p
            class="
              text-secondary
              mb-0
            "
          >
            Recycling locations are
            being filtered and ranked
            by our Firebase Cloud
            Function.
          </p>
        </section>


        <!-- ================================================= -->
        <!-- Error -->
        <!-- ================================================= -->

        <section
          v-else-if="
            errorMessage
          "
          class="
            alert
            alert-warning
            rounded-4
            p-4
          "
          role="alert"
        >
          <h2
            class="
              h4
              fw-bold
            "
          >
            Unable to show recommendations
          </h2>


          <p
            class="
              mb-3
            "
          >
            {{
              errorMessage
            }}
          </p>


          <RouterLink
            to="/recycle"
            class="
              btn
              btn-success
            "
          >
            Start a New Search
          </RouterLink>
        </section>


        <!-- ================================================= -->
        <!-- Results available -->
        <!-- ================================================= -->

        <template
          v-else-if="
            recommendations.length >
            0
          "
        >

          <!-- =============================================== -->
          <!-- Smart ranking explanation -->
          <!-- =============================================== -->

          <aside
            class="
              server-ranking-info
              mb-4
            "
            aria-labelledby="smart-ranking-title"
          >
            <div
              class="
                ranking-icon
              "
              aria-hidden="true"
            >
              ⚡
            </div>


            <div>
              <h2
                id="smart-ranking-title"
                class="
                  h5
                  fw-bold
                  mb-1
                "
              >
                Smart server-side ranking
              </h2>


              <p
                class="
                  text-secondary
                  mb-0
                "
              >
                {{
                  rankingExplanation
                }}
              </p>
            </div>
          </aside>


          <!-- =============================================== -->
          <!-- Recommendation cards -->
          <!-- =============================================== -->

          <div
            class="
              row
              g-4
            "
            aria-label="Recommended recycling locations"
          >

            <div
              v-for="
                (
                  location,
                  index
                )
                in
                recommendations
              "
              :key="
                location.id
              "
              class="
                col-12
                col-xxl-6
              "
            >

              <article
                class="
                  recommendation-wrapper
                "
                :class="{
                  'best-match':
                    index === 0,
                }"
              >

                <!-- ========================================= -->
                <!-- Recommendation ribbon -->
                <!-- ========================================= -->

                <header
                  class="
                    recommendation-header
                  "
                >
                  <div
                    class="
                      d-flex
                      flex-wrap
                      align-items-center
                      gap-2
                    "
                  >

                    <!-- Rank -->

                    <span
                      class="
                        badge
                        rank-badge
                        rounded-pill
                      "
                    >
                      {{
                        getRankLabel(
                          index,
                        )
                      }}
                    </span>


                    <!-- Same postcode -->

                    <span
                      v-if="
                        location.samePostcode
                      "
                      class="
                        badge
                        rounded-pill
                        postcode-badge
                      "
                    >
                      Same Postcode
                    </span>

                  </div>


                  <!-- Score -->

                  <div
                    class="
                      score-box
                    "
                    :aria-label="
                      `Recommendation match score ${location.recommendationScore}`
                    "
                  >
                    <strong
                      class="
                        score-number
                      "
                    >
                      {{
                        location
                          .recommendationScore
                      }}
                    </strong>


                    <span
                      class="
                        score-label
                      "
                    >
                      Match Score
                    </span>
                  </div>
                </header>


                <!-- ========================================= -->
                <!-- Existing location card -->
                <!-- ========================================= -->

                <div
                  class="
                    location-card-wrapper
                  "
                >
                  <RecyclingCard
                    :location="
                      location
                    "
                  />
                </div>


                <!-- ========================================= -->
                <!-- Recommendation reasons -->
                <!-- ========================================= -->

                <section
                  class="
                    recommendation-reasons
                  "
                  :aria-labelledby="
                    `reasons-${location.id}`
                  "
                >
                  <h3
                    :id="
                      `reasons-${location.id}`
                    "
                    class="
                      h6
                      fw-bold
                      mb-2
                    "
                  >
                    Why is this recommended?
                  </h3>


                  <ul
                    class="
                      reason-list
                      mb-0
                    "
                  >
                    <li
                      v-for="
                        reason
                        in
                        location
                          .recommendationReasons
                      "
                      :key="
                        reason
                      "
                    >
                      <span
                        class="
                          reason-check
                        "
                        aria-hidden="true"
                      >
                        ✓
                      </span>


                      <span>
                        {{
                          reason
                        }}
                      </span>
                    </li>
                  </ul>
                </section>

              </article>
            </div>

          </div>


          <!-- =============================================== -->
          <!-- How recommendation works -->
          <!-- =============================================== -->

          <section
            class="
              cloud-function-note
              mt-5
            "
            aria-labelledby="cloud-ranking-title"
          >
            <div
              class="
                mb-4
              "
            >
              <p
                class="
                  section-eyebrow
                  fw-bold
                  text-uppercase
                  mb-1
                "
              >
                Serverless Recommendation
              </p>


              <h2
                id="cloud-ranking-title"
                class="
                  h3
                  fw-bold
                  mb-2
                "
              >
                How recommendations are generated
              </h2>


              <p
                class="
                  text-secondary
                  mb-0
                "
              >
                The ranking process runs
                inside Firebase Cloud
                Functions rather than
                directly in the browser.
              </p>
            </div>


            <div
              class="
                row
                g-3
              "
            >

              <!-- Step 1 -->

              <div
                class="
                  col-12
                  col-md-6
                  col-xl-3
                "
              >
                <article
                  class="
                    process-step
                    h-100
                  "
                >
                  <span
                    class="
                      process-number
                    "
                    aria-hidden="true"
                  >
                    1
                  </span>


                  <strong>
                    Material Match
                  </strong>


                  <span
                    class="
                      text-secondary
                    "
                  >
                    Only locations that
                    accept the selected
                    material continue to
                    ranking.
                  </span>
                </article>
              </div>


              <!-- Step 2 -->

              <div
                class="
                  col-12
                  col-md-6
                  col-xl-3
                "
              >
                <article
                  class="
                    process-step
                    h-100
                  "
                >
                  <span
                    class="
                      process-number
                    "
                    aria-hidden="true"
                  >
                    2
                  </span>


                  <strong>
                    Postcode Priority
                  </strong>


                  <span
                    class="
                      text-secondary
                    "
                  >
                    Locations matching
                    the requested postcode
                    receive the strongest
                    priority.
                  </span>
                </article>
              </div>


              <!-- Step 3 -->

              <div
                class="
                  col-12
                  col-md-6
                  col-xl-3
                "
              >
                <article
                  class="
                    process-step
                    h-100
                  "
                >
                  <span
                    class="
                      process-number
                    "
                    aria-hidden="true"
                  >
                    3
                  </span>


                  <strong>
                    Quality Ranking
                  </strong>


                  <span
                    class="
                      text-secondary
                    "
                  >
                    Open status,
                    community rating
                    and approximate
                    distance improve the
                    ranking.
                  </span>
                </article>
              </div>


              <!-- Step 4 -->

              <div
                class="
                  col-12
                  col-md-6
                  col-xl-3
                "
              >
                <article
                  class="
                    process-step
                    h-100
                  "
                >
                  <span
                    class="
                      process-number
                    "
                    aria-hidden="true"
                  >
                    4
                  </span>


                  <strong>
                    Top Results
                  </strong>


                  <span
                    class="
                      text-secondary
                    "
                  >
                    Firebase returns the
                    five strongest
                    recommendations to
                    the Vue frontend.
                  </span>
                </article>
              </div>

            </div>
          </section>

        </template>


        <!-- ================================================= -->
        <!-- No results -->
        <!-- ================================================= -->

        <section
          v-else
          class="
            no-results
            text-center
            rounded-4
            p-5
          "
          aria-labelledby="no-results-title"
        >

          <div
            class="
              no-results-icon
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
            No locations in the current
            dataset accept this material.

            Try another recycling
            category or postcode.
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
/* Hero */
/* ===================================================== */

.results-hero {
  background:
    linear-gradient(
      180deg,
      #f3faf5 0%,
      #f8f9fa 100%
    );

  border-bottom:
    1px solid
    #e6ebe7;
}


.results-intro {
  max-width:
    900px;
}


.section-eyebrow {
  color:
    #146c43;

  letter-spacing:
    0.06em;
}


/* ===================================================== */
/* Loading */
/* ===================================================== */

.loading-state {
  min-height:
    300px;

  display:
    flex;

  flex-direction:
    column;

  align-items:
    center;

  justify-content:
    center;

  background:
    #f8f9fa;

  border:
    1px solid
    #dee2e6;
}


/* ===================================================== */
/* Server-side ranking information */
/* ===================================================== */

.server-ranking-info {
  display:
    flex;

  align-items:
    center;

  gap:
    1rem;

  padding:
    1rem
    1.1rem;

  background:
    #eef8f1;

  border:
    1px solid
    #9bc9a9;

  border-radius:
    16px;
}


.ranking-icon {
  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  width:
    52px;

  height:
    52px;

  flex:
    0 0 auto;

  color:
    #ffffff;

  background:
    #146c43;

  border-radius:
    50%;

  font-size:
    1.25rem;
}


/* ===================================================== */
/* Recommendation container */
/* ===================================================== */
/*
  Important:

  This is no longer another visual card.

  RecyclingCard already provides the main card UI.

  This wrapper only groups:

  recommendation ribbon
  + RecyclingCard
  + recommendation explanation
*/

.recommendation-wrapper {
  display:
    flex;

  flex-direction:
    column;

  height:
    100%;

  padding:
    0;

  background:
    transparent;

  border:
    0;

  box-shadow:
    none;
}


/* ===================================================== */
/* Prevent RecyclingCard from stretching */
/* ===================================================== */
/*
  RecyclingCard contains Bootstrap h-100.

  Inside the recommendation layout that caused large
  blank vertical spaces.

  This override keeps the existing component unchanged
  for every other page while allowing it to size
  naturally here.
*/

.location-card-wrapper {
  flex:
    0 0 auto;
}


.location-card-wrapper
:deep(.result-card) {
  height:
    auto !important;

  min-height:
    0 !important;

  flex:
    0 0 auto;
}


/* ===================================================== */
/* Recommendation ribbon */
/* ===================================================== */

.recommendation-header {
  display:
    flex;

  align-items:
    center;

  justify-content:
    space-between;

  gap:
    1rem;

  margin-bottom:
    0.65rem;

  padding:
    0.7rem
    0.85rem;

  background:
    #eef8f1;

  border:
    1px solid
    #a9cfb3;

  border-radius:
    14px;
}


.best-match
.recommendation-header {
  background:
    #e4f5e9;

  border:
    2px solid
    #146c43;
}


/* ===================================================== */
/* Rank */
/* ===================================================== */

.rank-badge {
  color:
    #0b5d1e;

  background:
    #ffffff;

  border:
    1px solid
    #9bc9a9;

  font-weight:
    800;
}


/* ===================================================== */
/* Same postcode */
/* ===================================================== */

.postcode-badge {
  color:
    #ffffff;

  background:
    #175cd3;

  border:
    1px solid
    #175cd3;

  font-weight:
    700;
}


/* ===================================================== */
/* Match score */
/* ===================================================== */

.score-box {
  display:
    flex;

  flex-direction:
    column;

  align-items:
    center;

  justify-content:
    center;

  min-width:
    100px;

  padding:
    0.45rem
    0.65rem;

  background:
    #ffffff;

  border:
    1px solid
    #9bc9a9;

  border-radius:
    11px;
}


.score-number {
  color:
    #0b5d1e;

  font-size:
    1rem;

  font-weight:
    800;

  line-height:
    1;
}


.score-label {
  margin-top:
    0.2rem;

  color:
    #495057;

  font-size:
    0.56rem;

  font-weight:
    700;

  white-space:
    nowrap;
}


/* ===================================================== */
/* Recommendation reasons */
/* ===================================================== */

.recommendation-reasons {
  margin-top:
    0.65rem;

  padding:
    0.8rem
    0.9rem;

  background:
    #fffdf3;

  border:
    1px solid
    #dfd6a2;

  border-radius:
    12px;
}


.reason-list {
  display:
    flex;

  flex-wrap:
    wrap;

  gap:
    0.5rem
    1rem;

  padding:
    0;

  list-style:
    none;
}


.reason-list li {
  display:
    inline-flex;

  align-items:
    center;

  gap:
    0.3rem;

  color:
    #343a40;

  font-size:
    0.7rem;

  font-weight:
    600;
}


.reason-check {
  color:
    #146c43;

  font-weight:
    900;
}


/* ===================================================== */
/* Cloud Function explanation */
/* ===================================================== */

.cloud-function-note {
  padding-top:
    1.5rem;

  border-top:
    1px solid
    #dee2e6;
}


.process-step {
  display:
    flex;

  flex-direction:
    column;

  gap:
    0.5rem;

  padding:
    1rem;

  background:
    #ffffff;

  border:
    1px solid
    #dee2e6;

  border-radius:
    14px;
}


.process-number {
  display:
    inline-flex;

  align-items:
    center;

  justify-content:
    center;

  width:
    38px;

  height:
    38px;

  color:
    #ffffff;

  background:
    #146c43;

  border-radius:
    50%;

  font-weight:
    800;
}


/* ===================================================== */
/* No results */
/* ===================================================== */

.no-results {
  background:
    #f8f9fa;

  border:
    1px solid
    #dee2e6;
}


.no-results-icon {
  font-size:
    2.5rem;
}


/* ===================================================== */
/* Buttons */
/* ===================================================== */

.btn {
  transition:
    transform
    0.2s
    ease,
    box-shadow
    0.2s
    ease;
}


.btn:hover {
  transform:
    translateY(
      -1px
    );
}


/* ===================================================== */
/* Responsive */
/* ===================================================== */

@media (
  max-width: 767px
) {
  .recommendation-header {
    align-items:
      flex-start;

    flex-direction:
      column;
  }


  .score-box {
    align-items:
      flex-start;

    width:
      100%;

    min-width:
      0;
  }


  .server-ranking-info {
    align-items:
      flex-start;
  }


  .ranking-icon {
    width:
      46px;

    height:
      46px;
  }
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