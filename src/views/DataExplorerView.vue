<script setup>
import {
  computed,
} from 'vue'

import InteractiveDataTable
  from '../components/InteractiveDataTable.vue'

import {
  recyclingLocations,
} from '../data/recyclingLocations.js'

import {
  recyclingMaterials,
} from '../data/recyclingMaterials.js'


// ======================================================
// Recycling Location table columns
// ======================================================
//
// Each column defines:
//
// key:
//   Property name in the dataset.
//
// label:
//   Text displayed in the table header.
//
// sortable:
//   Enables ascending / descending sorting.
//
// searchable:
//   Enables individual-column filtering.
//
// format:
//   Optional display formatting.
// ======================================================

const locationColumns = [
  {
    key: 'name',
    label: 'Location',
    sortable: true,
    searchable: true,
  },

  {
    key: 'suburb',
    label: 'Suburb',
    sortable: true,
    searchable: true,
  },

  {
    key: 'postcode',
    label: 'Postcode',
    sortable: true,
    searchable: true,
  },

  {
    key: 'distance',
    label: 'Distance',
    sortable: true,
    searchable: true,

    format(value) {
      return `${value} km`
    },
  },

  {
    key: 'rating',
    label: 'Rating',
    sortable: true,
    searchable: true,

    format(value) {
      return `${value} / 5`
    },
  },

  {
    key: 'status',
    label: 'Status',
    sortable: true,
    searchable: true,
  },

  {
    key: 'acceptedMaterials',
    label: 'Accepted Materials',
    sortable: true,
    searchable: true,

    format(value) {
      if (!Array.isArray(value)) {
        return value
      }

      return value.join(', ')
    },
  },
]


// ======================================================
// Recycling Materials table columns
// ======================================================

const materialColumns = [
  {
    key: 'material',
    label: 'Material',
    sortable: true,
    searchable: true,
  },

  {
    key: 'category',
    label: 'Category',
    sortable: true,
    searchable: true,
  },

  {
    key: 'recyclable',
    label: 'Recyclable',
    sortable: true,
    searchable: true,
  },

  {
    key: 'disposalMethod',
    label: 'Disposal Method',
    sortable: true,
    searchable: true,
  },

  {
    key: 'dropOffType',
    label: 'Drop-off Type',
    sortable: true,
    searchable: true,
  },

  {
    key: 'riskLevel',
    label: 'Risk Level',
    sortable: true,
    searchable: true,
  },
]


// ======================================================
// Summary statistics
// ======================================================

const locationCount =
  computed(() =>
    recyclingLocations.length,
  )


const materialCount =
  computed(() =>
    recyclingMaterials.length,
  )


const openLocationCount =
  computed(() =>
    recyclingLocations.filter(
      (location) =>
        location.status ===
        'Open',
    ).length,
  )


const materialCategoryCount =
  computed(() => {
    const categories =
      new Set(
        recyclingMaterials.map(
          (material) =>
            material.category,
        ),
      )

    return categories.size
  })
</script>


<template>
  <main class="data-explorer-page">

    <!-- ================================================= -->
    <!-- Page header -->
    <!-- ================================================= -->

    <section
      class="data-header py-5"
      aria-labelledby="data-explorer-title"
    >
      <div class="container py-lg-4">

        <p
          class="
            text-success
            fw-bold
            text-uppercase
            mb-2
          "
        >
          Interactive Data Explorer
        </p>

        <h1
          id="data-explorer-title"
          class="
            display-5
            fw-bold
            mb-3
          "
        >
          Explore Recycling Data
        </h1>

        <p
          class="
            lead
            text-secondary
            explorer-intro
            mb-0
          "
        >
          Search, filter, sort and
          browse recycling locations
          and recycling guidance data
          across two interactive
          datasets.
        </p>

      </div>
    </section>


    <!-- ================================================= -->
    <!-- Summary cards -->
    <!-- ================================================= -->

    <section
      class="py-4 border-bottom"
      aria-label="Data summary"
    >
      <div class="container">

        <div class="row g-3">

          <!-- Locations -->
          <div
            class="
              col-6
              col-lg-3
            "
          >
            <div
              class="
                summary-card
                h-100
              "
            >
              <div
                class="
                  summary-value
                "
              >
                {{ locationCount }}
              </div>

              <div
                class="
                  summary-label
                "
              >
                Recycling Locations
              </div>
            </div>
          </div>


          <!-- Open locations -->
          <div
            class="
              col-6
              col-lg-3
            "
          >
            <div
              class="
                summary-card
                h-100
              "
            >
              <div
                class="
                  summary-value
                  text-success
                "
              >
                {{ openLocationCount }}
              </div>

              <div
                class="
                  summary-label
                "
              >
                Open Locations
              </div>
            </div>
          </div>


          <!-- Materials -->
          <div
            class="
              col-6
              col-lg-3
            "
          >
            <div
              class="
                summary-card
                h-100
              "
            >
              <div
                class="
                  summary-value
                "
              >
                {{ materialCount }}
              </div>

              <div
                class="
                  summary-label
                "
              >
                Material Records
              </div>
            </div>
          </div>


          <!-- Categories -->
          <div
            class="
              col-6
              col-lg-3
            "
          >
            <div
              class="
                summary-card
                h-100
              "
            >
              <div
                class="
                  summary-value
                "
              >
                {{
                  materialCategoryCount
                }}
              </div>

              <div
                class="
                  summary-label
                "
              >
                Material Categories
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>


    <!-- ================================================= -->
    <!-- Main content -->
    <!-- ================================================= -->

    <section class="py-5">
      <div class="container">

        <!-- =============================================== -->
        <!-- Help / feature explanation -->
        <!-- =============================================== -->

        <div
          class="
            explorer-help
            mb-5
          "
        >
          <div
            class="
              d-flex
              flex-column
              flex-lg-row
              justify-content-between
              gap-4
            "
          >

            <div>
              <h2
                class="
                  h5
                  fw-bold
                  mb-2
                "
              >
                How to use the data tables
              </h2>

              <p
                class="
                  text-secondary
                  mb-0
                "
              >
                Each table supports
                global searching,
                individual column
                filters, sortable
                headings and
                pagination.
              </p>
            </div>


            <div
              class="
                d-flex
                flex-wrap
                gap-2
                align-content-start
              "
              aria-label="Available table features"
            >
              <span
                class="
                  badge
                  rounded-pill
                  text-bg-light
                  border
                "
              >
                Global Search
              </span>

              <span
                class="
                  badge
                  rounded-pill
                  text-bg-light
                  border
                "
              >
                Column Filters
              </span>

              <span
                class="
                  badge
                  rounded-pill
                  text-bg-light
                  border
                "
              >
                Sorting
              </span>

              <span
                class="
                  badge
                  rounded-pill
                  text-bg-light
                  border
                "
              >
                10 Rows / Page
              </span>

              <span
                class="
                  badge
                  rounded-pill
                  text-bg-light
                  border
                "
              >
                Keyboard Accessible
              </span>
            </div>

          </div>
        </div>


        <!-- =============================================== -->
        <!-- Table 1 -->
        <!-- Recycling Locations -->
        <!-- =============================================== -->

        <section
          class="
            data-section
            mb-5
          "
          aria-labelledby="locations-table-title"
        >
          <div
            class="
              section-heading
              mb-4
            "
          >
            <div>
              <p
                class="
                  section-number
                  mb-2
                "
              >
                TABLE 01
              </p>

              <h2
                id="locations-table-title"
                class="
                  h3
                  fw-bold
                  mb-2
                "
              >
                Recycling Locations
              </h2>

              <p
                class="
                  text-secondary
                  mb-0
                "
              >
                Compare recycling
                locations by suburb,
                postcode, distance,
                rating, status and
                accepted materials.
              </p>
            </div>
          </div>


          <div
            class="
              data-card
              p-3
              p-lg-4
            "
          >
            <InteractiveDataTable
              title="Recycling Locations"
              :rows="
                recyclingLocations
              "
              :columns="
                locationColumns
              "
              :page-size="10"
            />
          </div>
        </section>


        <!-- =============================================== -->
        <!-- Table 2 -->
        <!-- Recycling Materials -->
        <!-- =============================================== -->

        <section
          class="data-section"
          aria-labelledby="materials-table-title"
        >
          <div
            class="
              section-heading
              mb-4
            "
          >
            <div>
              <p
                class="
                  section-number
                  mb-2
                "
              >
                TABLE 02
              </p>

              <h2
                id="materials-table-title"
                class="
                  h3
                  fw-bold
                  mb-2
                "
              >
                Recycling Materials Directory
              </h2>

              <p
                class="
                  text-secondary
                  mb-0
                "
              >
                Explore material
                categories, recycling
                status, disposal
                guidance, drop-off
                types and handling
                risk levels.
              </p>
            </div>
          </div>


          <div
            class="
              data-card
              p-3
              p-lg-4
            "
          >
            <InteractiveDataTable
              title="Recycling Materials Directory"
              :rows="
                recyclingMaterials
              "
              :columns="
                materialColumns
              "
              :page-size="10"
            />
          </div>
        </section>

      </div>
    </section>


    <!-- ================================================= -->
    <!-- Accessibility note -->
    <!-- ================================================= -->

    <section
      class="
        accessibility-section
        py-5
      "
      aria-labelledby="accessibility-title"
    >
      <div class="container">

        <div
          class="
            accessibility-card
          "
        >
          <h2
            id="accessibility-title"
            class="
              h5
              fw-bold
              mb-2
            "
          >
            Accessible data exploration
          </h2>

          <p
            class="
              text-secondary
              mb-0
            "
          >
            Table controls use
            semantic labels,
            keyboard-accessible
            buttons, accessible
            sorting information and
            responsive layouts to
            support a wider range of
            users.
          </p>
        </div>

      </div>
    </section>

  </main>
</template>


<style scoped>
.data-explorer-page {
  min-height: 100vh;

  background-color:
    #ffffff;
}


.data-header {
  background:
    linear-gradient(
      135deg,
      #f2faf5 0%,
      #ffffff 65%
    );
}


.explorer-intro {
  max-width: 780px;
}


/* ===================================================== */
/* Summary cards */
/* ===================================================== */

.summary-card {
  padding: 1.25rem;

  background-color:
    #ffffff;

  border:
    1px solid
    rgba(
      25,
      135,
      84,
      0.12
    );

  border-radius: 16px;

  box-shadow:
    0 0.2rem 0.8rem
    rgba(
      0,
      0,
      0,
      0.035
    );
}


.summary-value {
  margin-bottom: 0.25rem;

  font-size: 2rem;
  font-weight: 700;
  line-height: 1.1;
}


.summary-label {
  color: #6c757d;

  font-size: 0.9rem;
}


/* ===================================================== */
/* Feature helper */
/* ===================================================== */

.explorer-help {
  padding: 1.25rem 1.5rem;

  background-color:
    #f8f9fa;

  border-radius: 16px;
}


/* ===================================================== */
/* Table sections */
/* ===================================================== */

.section-number {
  color:
    var(--bs-success);

  font-size: 0.75rem;
  font-weight: 700;

  letter-spacing:
    0.15em;
}


.section-heading {
  max-width: 800px;
}


.data-card {
  background-color:
    #ffffff;

  border:
    1px solid
    #e9ecef;

  border-radius: 20px;

  box-shadow:
    0 0.5rem 1.5rem
    rgba(
      0,
      0,
      0,
      0.04
    );
}


/* ===================================================== */
/* Accessibility section */
/* ===================================================== */

.accessibility-section {
  background-color:
    #f8f9fa;
}


.accessibility-card {
  padding: 1.5rem;

  background-color:
    rgba(
      25,
      135,
      84,
      0.06
    );

  border-left:
    4px solid
    var(--bs-success);

  border-radius: 10px;
}


/* ===================================================== */
/* Responsive design */
/* ===================================================== */

@media (
  max-width: 768px
) {
  .summary-value {
    font-size: 1.6rem;
  }

  .data-card {
    padding:
      1rem !important;
  }
}
</style>