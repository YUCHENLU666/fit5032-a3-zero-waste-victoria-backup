<script setup>
import {
  computed,
  reactive,
  ref,
  watch,
} from 'vue'

import {
  exportTableToCsv,
  exportTableToPdf,
} from '../services/exportService.js'


// ======================================================
// Props
// ======================================================
//
// rows:
//   Array of table records.
//
// columns:
//   Example:
//   [
//     {
//       key: 'name',
//       label: 'Location',
//       sortable: true,
//       searchable: true,
//     },
//   ]
//
// title:
//   Accessible table title.
//
// pageSize:
//   D.3 requires 10 rows per page.
// ======================================================

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },

  columns: {
    type: Array,
    required: true,
  },

  title: {
    type: String,
    default:
      'Interactive Data Table',
  },

  pageSize: {
    type: Number,
    default: 10,
  },
})


// ======================================================
// Search and sorting state
// ======================================================

const globalSearch =
  ref('')

const columnFilters =
  reactive({})

const sortKey =
  ref('')

const sortDirection =
  ref('asc')

const currentPage =
  ref(1)


// ======================================================
// Export state
// ======================================================

const exportMessage =
  ref('')

const exportError =
  ref('')


// ======================================================
// Accessible IDs
// ======================================================
//
// Convert the table title into a safe HTML ID.
//
// Example:
// "Recycling Locations"
// becomes:
// "recycling-locations"
// ======================================================

const safeTableId =
  computed(() =>
    props.title
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        '-',
      )
      .replace(
        /^-+|-+$/g,
        '',
      ),
  )


const globalSearchId =
  computed(
    () =>
      `${safeTableId.value}-global-search`,
  )


function getColumnFilterId(
  column,
) {
  return `${safeTableId.value}-${column.key}-filter`
}


// ======================================================
// Helpers
// ======================================================

function getCellValue(
  row,
  column,
) {
  if (
    typeof column.getValue ===
    'function'
  ) {
    return column.getValue(
      row,
    )
  }

  return row[column.key]
}


function normaliseValue(
  value,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return ''
  }

  if (
    Array.isArray(value)
  ) {
    return value
      .join(' ')
      .toLowerCase()
  }

  return String(value)
    .toLowerCase()
}


function formatValue(
  row,
  column,
) {
  const value =
    getCellValue(
      row,
      column,
    )

  if (
    typeof column.format ===
    'function'
  ) {
    return column.format(
      value,
      row,
    )
  }

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—'
  }

  if (
    Array.isArray(value)
  ) {
    return value.join(', ')
  }

  return value
}


// ======================================================
// Global + individual-column filtering
// ======================================================

const filteredRows =
  computed(() => {
    const globalTerm =
      globalSearch.value
        .trim()
        .toLowerCase()

    return props.rows.filter(
      (row) => {

        // ----------------------------------------------
        // Global search
        // ----------------------------------------------

        if (globalTerm) {
          const matchesGlobal =
            props.columns.some(
              (column) => {
                const value =
                  getCellValue(
                    row,
                    column,
                  )

                return normaliseValue(
                  value,
                ).includes(
                  globalTerm,
                )
              },
            )

          if (
            !matchesGlobal
          ) {
            return false
          }
        }


        // ----------------------------------------------
        // Individual column search
        // ----------------------------------------------

        const matchesColumns =
          props.columns.every(
            (column) => {

              if (
                column.searchable ===
                false
              ) {
                return true
              }

              const filter =
                (
                  columnFilters[
                    column.key
                  ] || ''
                )
                  .trim()
                  .toLowerCase()

              if (!filter) {
                return true
              }

              const value =
                getCellValue(
                  row,
                  column,
                )

              return normaliseValue(
                value,
              ).includes(
                filter,
              )
            },
          )

        return matchesColumns
      },
    )
  })


// ======================================================
// Sorting
// ======================================================

const sortedRows =
  computed(() => {
    const result = [
      ...filteredRows.value,
    ]

    if (
      !sortKey.value
    ) {
      return result
    }

    const column =
      props.columns.find(
        (item) =>
          item.key ===
          sortKey.value,
      )

    if (!column) {
      return result
    }

    result.sort(
      (
        rowA,
        rowB,
      ) => {
        const rawA =
          getCellValue(
            rowA,
            column,
          )

        const rawB =
          getCellValue(
            rowB,
            column,
          )


        // ----------------------------------------------
        // Numeric sorting
        // ----------------------------------------------

        if (
          typeof rawA ===
            'number' &&
          typeof rawB ===
            'number'
        ) {
          return sortDirection.value ===
            'asc'
            ? rawA - rawB
            : rawB - rawA
        }


        // ----------------------------------------------
        // String / array sorting
        // ----------------------------------------------

        const valueA =
          Array.isArray(rawA)
            ? rawA.join(', ')
            : String(
                rawA ?? '',
              )

        const valueB =
          Array.isArray(rawB)
            ? rawB.join(', ')
            : String(
                rawB ?? '',
              )

        const compareResult =
          valueA.localeCompare(
            valueB,
            undefined,
            {
              numeric: true,
              sensitivity:
                'base',
            },
          )

        return sortDirection.value ===
          'asc'
          ? compareResult
          : -compareResult
      },
    )

    return result
  })


// ======================================================
// Sorting controls
// ======================================================

function sortBy(
  column,
) {
  if (
    column.sortable ===
    false
  ) {
    return
  }

  if (
    sortKey.value ===
    column.key
  ) {
    sortDirection.value =
      sortDirection.value ===
        'asc'
        ? 'desc'
        : 'asc'
  } else {
    sortKey.value =
      column.key

    sortDirection.value =
      'asc'
  }

  currentPage.value = 1
}


function getSortIcon(
  column,
) {
  if (
    sortKey.value !==
    column.key
  ) {
    return '↕'
  }

  return sortDirection.value ===
    'asc'
    ? '↑'
    : '↓'
}


function getAriaSort(
  column,
) {
  if (
    column.sortable ===
    false
  ) {
    return undefined
  }

  if (
    sortKey.value !==
    column.key
  ) {
    return 'none'
  }

  return sortDirection.value ===
    'asc'
    ? 'ascending'
    : 'descending'
}


// ======================================================
// Pagination
// ======================================================

const totalRows =
  computed(
    () =>
      sortedRows.value.length,
  )


const totalPages =
  computed(() =>
    Math.max(
      1,

      Math.ceil(
        totalRows.value /
          props.pageSize,
      ),
    ),
  )


const paginatedRows =
  computed(() => {
    const start =
      (
        currentPage.value -
        1
      ) *
      props.pageSize

    const end =
      start +
      props.pageSize

    return sortedRows.value.slice(
      start,
      end,
    )
  })


const pageNumbers =
  computed(() =>
    Array.from(
      {
        length:
          totalPages.value,
      },

      (
        _,
        index,
      ) =>
        index + 1,
    ),
  )


const firstVisibleRow =
  computed(() => {
    if (
      totalRows.value ===
      0
    ) {
      return 0
    }

    return (
      (
        currentPage.value -
        1
      ) *
        props.pageSize +
      1
    )
  })


const lastVisibleRow =
  computed(() => {
    if (
      totalRows.value ===
      0
    ) {
      return 0
    }

    return Math.min(
      currentPage.value *
        props.pageSize,

      totalRows.value,
    )
  })


function goToPage(
  page,
) {
  if (
    page < 1 ||
    page >
      totalPages.value
  ) {
    return
  }

  currentPage.value =
    page
}


function previousPage() {
  goToPage(
    currentPage.value -
      1,
  )
}


function nextPage() {
  goToPage(
    currentPage.value +
      1,
  )
}


// ======================================================
// Export helpers
// ======================================================
//
// Export uses sortedRows instead of paginatedRows.
//
// This means:
// - Global search is respected.
// - Column filters are respected.
// - Current sorting is respected.
// - All matching records are exported,
//   not only the current 10-row page.
// ======================================================

const exportHeaders =
  computed(() =>
    props.columns.map(
      (column) =>
        column.label,
    ),
  )


const exportRows =
  computed(() =>
    sortedRows.value.map(
      (row) =>
        props.columns.map(
          (column) => {
            const value =
              formatValue(
                row,
                column,
              )

            if (
              value === null ||
              value ===
                undefined
            ) {
              return ''
            }

            return String(
              value,
            )
          },
        ),
    ),
  )


// ======================================================
// Clear export messages
// ======================================================

function clearExportMessages() {
  exportMessage.value =
    ''

  exportError.value =
    ''
}


// ======================================================
// CSV export
// ======================================================

function handleExportCsv() {
  clearExportMessages()

  try {
    exportTableToCsv({
      title:
        props.title,

      headers:
        exportHeaders.value,

      rows:
        exportRows.value,
    })

    exportMessage.value =
      `${totalRows.value} record(s) exported to CSV successfully.`
  } catch (error) {
    exportError.value =
      error.message ||
      'Unable to export CSV.'
  }
}


// ======================================================
// PDF export
// ======================================================

function handleExportPdf() {
  clearExportMessages()

  try {
    exportTableToPdf({
      title:
        props.title,

      headers:
        exportHeaders.value,

      rows:
        exportRows.value,
    })

    exportMessage.value =
      `${totalRows.value} record(s) exported to PDF successfully.`
  } catch (error) {
    exportError.value =
      error.message ||
      'Unable to export PDF.'
  }
}


// ======================================================
// Clear filters
// ======================================================

function clearFilters() {
  globalSearch.value = ''

  Object.keys(
    columnFilters,
  ).forEach(
    (key) => {
      columnFilters[key] =
        ''
    },
  )

  sortKey.value = ''

  sortDirection.value =
    'asc'

  currentPage.value = 1

  clearExportMessages()
}


// ======================================================
// Reset pagination when search data changes
// ======================================================

watch(
  globalSearch,
  () => {
    currentPage.value = 1
    clearExportMessages()
  },
)


watch(
  columnFilters,
  () => {
    currentPage.value = 1
    clearExportMessages()
  },
  {
    deep: true,
  },
)


watch(
  () => props.rows,
  () => {
    currentPage.value = 1
    clearExportMessages()
  },
  {
    deep: true,
  },
)
</script>


<template>
  <section
    class="interactive-table"
    :aria-label="title"
  >

    <!-- ================================================= -->
    <!-- Table controls -->
    <!-- ================================================= -->

    <div
      class="
        table-controls
        d-flex
        flex-column
        flex-lg-row
        justify-content-between
        align-items-lg-end
        gap-3
        mb-3
      "
    >

      <!-- Global search -->
      <div class="flex-grow-1">

        <label
          :for="
            globalSearchId
          "
          class="
            form-label
            fw-semibold
          "
        >
          Search all columns
        </label>

        <input
          :id="
            globalSearchId
          "
          v-model="
            globalSearch
          "
          type="search"
          class="form-control"
          placeholder="Search this table..."
        />

        <div
          class="form-text"
        >
          Search across all
          displayed columns.
        </div>

      </div>


      <!-- Control buttons -->
      <div
        class="
          table-action-buttons
          d-flex
          flex-wrap
          gap-2
        "
      >

        <!-- Export CSV -->
        <button
          type="button"
          class="
            btn
            btn-success
            text-nowrap
          "
          :disabled="
            totalRows === 0
          "
          @click="
            handleExportCsv
          "
        >
          ↓ Export CSV
        </button>


        <!-- Export PDF -->
        <button
          type="button"
          class="
            btn
            btn-outline-success
            text-nowrap
          "
          :disabled="
            totalRows === 0
          "
          @click="
            handleExportPdf
          "
        >
          ↓ Export PDF
        </button>


        <!-- Clear -->
        <button
          type="button"
          class="
            btn
            btn-outline-secondary
            text-nowrap
          "
          @click="
            clearFilters
          "
        >
          Clear Filters
        </button>

      </div>
    </div>


    <!-- ================================================= -->
    <!-- Export feedback -->
    <!-- ================================================= -->

    <div
      class="
        export-feedback
        mb-3
      "
    >
      <div
        v-if="
          exportMessage
        "
        class="
          alert
          alert-success
          py-2
          mb-2
        "
        role="status"
        aria-live="polite"
      >
        {{ exportMessage }}
      </div>

      <div
        v-if="
          exportError
        "
        class="
          alert
          alert-danger
          py-2
          mb-2
        "
        role="alert"
        aria-live="assertive"
      >
        {{ exportError }}
      </div>
    </div>


    <!-- ================================================= -->
    <!-- Result summary -->
    <!-- ================================================= -->

    <div
      class="
        d-flex
        flex-column
        flex-sm-row
        justify-content-between
        align-items-sm-center
        gap-2
        mb-3
      "
      aria-live="polite"
    >
      <p
        class="
          mb-0
          fw-semibold
        "
      >
        {{ totalRows }}
        record(s) found
      </p>

      <p
        class="
          mb-0
          small
          text-secondary
        "
      >
        Showing
        {{ firstVisibleRow }}
        –
        {{ lastVisibleRow }}
        of
        {{ totalRows }}
      </p>
    </div>


    <!-- ================================================= -->
    <!-- Data table -->
    <!-- ================================================= -->

    <div
      class="
        table-responsive
        border
        rounded-4
      "
    >
      <table
        class="
          table
          table-hover
          align-middle
          mb-0
        "
      >
        <caption
          class="visually-hidden"
        >
          {{ title }}.
          Use the global search
          or individual column
          filters to find records.
          Sortable column headings
          can be activated using
          keyboard or mouse.
          Filtered and sorted
          results can be exported
          to CSV or PDF.
        </caption>


        <!-- =============================================== -->
        <!-- Column headings -->
        <!-- =============================================== -->

        <thead
          class="table-light"
        >
          <tr>
            <th
              v-for="
                column in columns
              "
              :key="
                column.key
              "
              scope="col"
              :aria-sort="
                getAriaSort(
                  column,
                )
              "
            >
              <button
                v-if="
                  column.sortable !==
                  false
                "
                type="button"
                class="
                  sort-button
                "
                :aria-label="
                  `Sort by ${column.label}`
                "
                @click="
                  sortBy(
                    column,
                  )
                "
              >
                <span>
                  {{
                    column.label
                  }}
                </span>

                <span
                  class="
                    sort-icon
                  "
                  aria-hidden="true"
                >
                  {{
                    getSortIcon(
                      column,
                    )
                  }}
                </span>
              </button>

              <span
                v-else
                class="fw-bold"
              >
                {{
                  column.label
                }}
              </span>
            </th>
          </tr>


          <!-- ============================================= -->
          <!-- Individual column searches -->
          <!-- ============================================= -->

          <tr
            class="
              column-filter-row
            "
          >
            <th
              v-for="
                column in columns
              "
              :key="
                `filter-${column.key}`
              "
              scope="col"
            >
              <label
                v-if="
                  column.searchable !==
                  false
                "
                :for="
                  getColumnFilterId(
                    column,
                  )
                "
                class="
                  visually-hidden
                "
              >
                Search
                {{
                  column.label
                }}
              </label>

              <input
                v-if="
                  column.searchable !==
                  false
                "
                :id="
                  getColumnFilterId(
                    column,
                  )
                "
                v-model="
                  columnFilters[
                    column.key
                  ]
                "
                type="search"
                class="
                  form-control
                  form-control-sm
                "
                :placeholder="
                  `Filter ${column.label}`
                "
              />

              <span
                v-else
                class="
                  text-secondary
                  small
                "
              >
                —
              </span>
            </th>
          </tr>
        </thead>


        <!-- =============================================== -->
        <!-- Table body -->
        <!-- =============================================== -->

        <tbody>
          <tr
            v-for="
              row in
              paginatedRows
            "
            :key="
              row.id
            "
          >
            <td
              v-for="
                column in columns
              "
              :key="
                `${row.id}-${column.key}`
              "
            >
              {{
                formatValue(
                  row,
                  column,
                )
              }}
            </td>
          </tr>


          <!-- ============================================= -->
          <!-- Empty state -->
          <!-- ============================================= -->

          <tr
            v-if="
              paginatedRows.length ===
              0
            "
          >
            <td
              :colspan="
                columns.length
              "
              class="
                text-center
                py-5
              "
            >
              <div
                class="
                  empty-state
                "
              >
                <div
                  class="
                    display-6
                    mb-3
                  "
                  aria-hidden="true"
                >
                  🔎
                </div>

                <p
                  class="
                    fw-bold
                    mb-1
                  "
                >
                  No matching records
                </p>

                <p
                  class="
                    text-secondary
                    mb-3
                  "
                >
                  Try changing or
                  clearing your
                  search filters.
                </p>

                <button
                  type="button"
                  class="
                    btn
                    btn-outline-success
                    btn-sm
                  "
                  @click="
                    clearFilters
                  "
                >
                  Clear Filters
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>


    <!-- ================================================= -->
    <!-- Pagination -->
    <!-- ================================================= -->

    <div
      v-if="
        totalRows > 0
      "
      class="
        d-flex
        flex-column
        flex-md-row
        justify-content-between
        align-items-md-center
        gap-3
        mt-4
      "
    >
      <p
        class="
          small
          text-secondary
          mb-0
        "
      >
        {{
          pageSize
        }}
        rows per page
      </p>


      <nav
        :aria-label="
          `${title} pagination`
        "
      >
        <ul
          class="
            pagination
            mb-0
            flex-wrap
          "
        >

          <!-- Previous -->
          <li
            class="page-item"
            :class="{
              disabled:
                currentPage === 1,
            }"
          >
            <button
              type="button"
              class="page-link"
              :disabled="
                currentPage === 1
              "
              aria-label="Previous page"
              @click="
                previousPage
              "
            >
              Previous
            </button>
          </li>


          <!-- Page numbers -->
          <li
            v-for="
              page in
              pageNumbers
            "
            :key="
              page
            "
            class="page-item"
            :class="{
              active:
                currentPage ===
                page,
            }"
          >
            <button
              type="button"
              class="page-link"
              :aria-current="
                currentPage ===
                page
                  ? 'page'
                  : undefined
              "
              :aria-label="
                `Go to page ${page}`
              "
              @click="
                goToPage(
                  page,
                )
              "
            >
              {{ page }}
            </button>
          </li>


          <!-- Next -->
          <li
            class="page-item"
            :class="{
              disabled:
                currentPage ===
                totalPages,
            }"
          >
            <button
              type="button"
              class="page-link"
              :disabled="
                currentPage ===
                totalPages
              "
              aria-label="Next page"
              @click="
                nextPage
              "
            >
              Next
            </button>
          </li>

        </ul>
      </nav>
    </div>

  </section>
</template>


<style scoped>
.interactive-table {
  width: 100%;
}


/* ===================================================== */
/* Controls */
/* ===================================================== */

.table-action-buttons {
  justify-content: flex-end;
}

.table-action-buttons
.btn {
  min-width: 125px;
}


/* ===================================================== */
/* Table */
/* ===================================================== */

.table-responsive {
  background-color:
    #ffffff;
}

table {
  min-width: 900px;
}

thead th {
  vertical-align:
    middle;

  white-space:
    nowrap;
}


/* ===================================================== */
/* Sorting */
/* ===================================================== */

.sort-button {
  display:
    inline-flex;

  align-items:
    center;

  justify-content:
    space-between;

  gap:
    0.5rem;

  width:
    100%;

  padding:
    0;

  color:
    inherit;

  font-weight:
    700;

  text-align:
    left;

  background:
    transparent;

  border:
    0;
}

.sort-button:hover {
  color:
    var(--bs-success);
}

.sort-button:focus-visible {
  outline:
    3px solid
    rgba(
      25,
      135,
      84,
      0.35
    );

  outline-offset:
    4px;

  border-radius:
    4px;
}

.sort-icon {
  min-width:
    1rem;

  color:
    var(--bs-success);

  font-weight:
    700;
}


/* ===================================================== */
/* Column filters */
/* ===================================================== */

.column-filter-row th {
  padding-top:
    0.5rem;

  padding-bottom:
    0.75rem;

  background-color:
    #f8f9fa;
}

.column-filter-row input {
  min-width:
    120px;
}


/* ===================================================== */
/* Form controls */
/* ===================================================== */

.form-control:focus {
  border-color:
    var(--bs-success);

  box-shadow:
    0 0 0 0.2rem
    rgba(
      25,
      135,
      84,
      0.15
    );
}


/* ===================================================== */
/* Export feedback */
/* ===================================================== */

.export-feedback {
  min-height:
    0;
}

.alert {
  border-radius:
    10px;
}


/* ===================================================== */
/* Pagination */
/* ===================================================== */

/*
  Pagination controls use larger touch targets
  to support users with reduced motor precision
  and satisfy accessible touch-target guidance.
*/

.pagination {
  display:
    flex;

  align-items:
    center;

  gap:
    0.5rem;
}


.page-item {
  margin:
    0;
}


.page-link {
  display:
    inline-flex;

  align-items:
    center;

  justify-content:
    center;

  min-width:
    48px;

  min-height:
    48px;

  padding:
    0.65rem 0.8rem;

  color:
    #146c43;

  font-weight:
    600;

  line-height:
    1;

  background-color:
    #ffffff;

  border:
    1px solid
    #ced4da;

  border-radius:
    0.5rem !important;
}


.page-link:hover {
  color:
    #0b5d1e;

  background-color:
    #eef7f1;

  border-color:
    #146c43;
}


.page-item.active
.page-link {
  color:
    #ffffff;

  background-color:
    #146c43;

  border-color:
    #146c43;
}


.page-link:focus,
.page-link:focus-visible {
  position:
    relative;

  z-index:
    2;

  outline:
    3px solid
    #0b5d1e;

  outline-offset:
    3px;

  box-shadow:
    none;
}


.page-link:disabled {
  color:
    #6c757d;

  cursor:
    not-allowed;

  background-color:
    #f8f9fa;

  border-color:
    #dee2e6;

  opacity:
    0.7;
}


/*
  Previous and Next use a slightly wider
  target because their labels contain text.
*/

.page-item:first-child
.page-link,
.page-item:last-child
.page-link {
  min-width:
    88px;
}


/* ===================================================== */
/* Empty state */
/* ===================================================== */

.empty-state {
  max-width:
    420px;

  margin:
    0 auto;
}


/* ===================================================== */
/* Responsive */
/* ===================================================== */

@media (
  max-width: 991px
) {
  .table-action-buttons {
    justify-content:
      flex-start;
  }
}


@media (
  max-width: 768px
) {
  .table-controls {
    align-items:
      stretch;
  }

  .table-action-buttons {
    width:
      100%;
  }

  .table-action-buttons
  .btn {
    flex:
      1 1 140px;
  }
}
</style>