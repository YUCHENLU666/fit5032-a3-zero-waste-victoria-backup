<script setup>
import {
  nextTick,
  ref,
} from 'vue'

import {
  useRouter,
} from 'vue-router'


const router =
  useRouter()


// ======================================================
// Form fields
// ======================================================

const item =
  ref('')

const postcode =
  ref('')


// ======================================================
// Input references
//
// Used to move keyboard focus to the first invalid field
// when form validation fails.
// ======================================================

const itemInput =
  ref(null)

const postcodeInput =
  ref(null)


// ======================================================
// Validation state
// ======================================================

const itemError =
  ref('')

const postcodeError =
  ref('')


// ======================================================
// Recent searches
//
// Search history is stored locally in the browser.
// Only the five most recent searches are kept.
// ======================================================

const recentSearches =
  ref(
    JSON.parse(
      localStorage.getItem(
        'zwvRecentSearches',
      ) || '[]',
    ),
  )


// ======================================================
// Supported recycling categories
// ======================================================

const categories = [
  'Batteries',
  'E-Waste',
  'Clothing',
  'Furniture',
  'Plastics',
]


// ======================================================
// Material input rule
//
// Rules:
// - Must start with a letter or number
// - Only letters, numbers, spaces and hyphens
// - Maximum 50 characters
// ======================================================

const itemPattern =
  /^[A-Za-z0-9][A-Za-z0-9 -]{0,49}$/


// ======================================================
// Quick category selection
// ======================================================

const selectCategory =
  (category) => {
    item.value =
      category

    itemError.value =
      ''
  }


// ======================================================
// Use recent search
// ======================================================

const useRecentSearch =
  (search) => {
    item.value =
      search.item

    postcode.value =
      search.postcode

    itemError.value =
      ''

    postcodeError.value =
      ''
  }


// ======================================================
// Clear recent searches
// ======================================================

const clearRecentSearches =
  () => {
    recentSearches.value =
      []

    localStorage.removeItem(
      'zwvRecentSearches',
    )
  }


// ======================================================
// Clear validation errors
// ======================================================

function clearErrors() {
  itemError.value = ''
  postcodeError.value = ''
}


// ======================================================
// Validate form
// ======================================================

function validateForm() {
  clearErrors()

  let isValid = true


  // --------------------------------------------------
  // Material validation
  // --------------------------------------------------

  const cleanItem =
    item.value.trim()

  if (!cleanItem) {
    itemError.value =
      'Please enter an item or select a category.'

    isValid = false
  } else if (
    cleanItem.length > 50
  ) {
    itemError.value =
      'Item must be 50 characters or fewer.'

    isValid = false
  } else if (
    !itemPattern.test(
      cleanItem,
    )
  ) {
    itemError.value =
      'Item contains invalid characters.'

    isValid = false
  }


  // --------------------------------------------------
  // Postcode validation
  // --------------------------------------------------

  const cleanPostcode =
    postcode.value.trim()

  const postcodePattern =
    /^\d{4}$/

  if (
    !cleanPostcode ||
    !postcodePattern.test(
      cleanPostcode,
    )
  ) {
    postcodeError.value =
      'Please enter a valid 4-digit postcode.'

    isValid = false
  } else {
    const postcodeNumber =
      Number(
        cleanPostcode,
      )

    if (
      postcodeNumber < 3000 ||
      postcodeNumber > 3999
    ) {
      postcodeError.value =
        'Please enter a postcode in the current service area (3000–3999).'

      isValid = false
    }
  }


  return isValid
}


// ======================================================
// Focus first invalid field
// ======================================================

async function focusFirstError() {
  await nextTick()

  if (
    itemError.value
  ) {
    itemInput.value?.focus()
    return
  }

  if (
    postcodeError.value
  ) {
    postcodeInput.value?.focus()
  }
}


// ======================================================
// Form submission
// ======================================================

const handleSubmit =
  async () => {

    const isValid =
      validateForm()


    // --------------------------------------------------
    // Invalid form
    // --------------------------------------------------

    if (!isValid) {
      await focusFirstError()
      return
    }


    const cleanItem =
      item.value.trim()

    const cleanPostcode =
      postcode.value.trim()


    // --------------------------------------------------
    // Create current search
    // --------------------------------------------------

    const currentSearch = {
      item:
        cleanItem,

      postcode:
        cleanPostcode,
    }


    // --------------------------------------------------
    // Remove duplicate searches
    // --------------------------------------------------

    recentSearches.value =
      recentSearches.value.filter(
        (search) => {
          return !(
            search.item
              .toLowerCase() ===
              currentSearch.item
                .toLowerCase() &&
            search.postcode ===
              currentSearch.postcode
          )
        },
      )


    // --------------------------------------------------
    // Put newest search first
    // --------------------------------------------------

    recentSearches.value.unshift(
      currentSearch,
    )


    // --------------------------------------------------
    // Keep only five recent searches
    // --------------------------------------------------

    recentSearches.value =
      recentSearches.value.slice(
        0,
        5,
      )


    // --------------------------------------------------
    // Persist recent searches
    // --------------------------------------------------

    localStorage.setItem(
      'zwvRecentSearches',

      JSON.stringify(
        recentSearches.value,
      ),
    )


    // --------------------------------------------------
    // Navigate to results
    // --------------------------------------------------

    await router.push({
      path:
        '/results',

      query: {
        item:
          cleanItem,

        postcode:
          cleanPostcode,
      },
    })
  }
</script>


<template>
  <main
    aria-labelledby="recycling-finder-title"
  >

    <!-- ================================================= -->
    <!-- Page header -->
    <!-- ================================================= -->

    <section
      class="
        bg-light
        py-5
      "
    >
      <div
        class="
          container
          text-center
          py-lg-4
        "
      >

        <p
          class="
            text-success
            fw-bold
            text-uppercase
            mb-2
          "
        >
          Recycling Finder
        </p>


        <h1
          id="recycling-finder-title"
          class="
            display-5
            fw-bold
            mb-3
          "
        >
          Find the right place
          for your item
        </h1>


        <p
          class="
            lead
            text-secondary
            mx-auto
            finder-intro
          "
        >
          Tell us what you want
          to recycle and your
          postcode, and we’ll help
          you find suitable
          recycling and reuse
          options.
        </p>

      </div>
    </section>


    <!-- ================================================= -->
    <!-- Finder -->
    <!-- ================================================= -->

    <section
      class="py-5"
      aria-labelledby="finder-form-title"
    >
      <div class="container">

        <div
          class="
            row
            justify-content-center
          "
        >

          <div
            class="col-lg-8"
          >

            <div
              class="
                card
                border-0
                shadow-sm
                rounded-4
              "
            >

              <div
                class="
                  card-body
                  p-4
                  p-md-5
                "
              >

                <h2
                  id="finder-form-title"
                  class="
                    h4
                    fw-bold
                    mb-4
                  "
                >
                  Search recycling options
                </h2>


                <form
                  novalidate
                  @submit.prevent="
                    handleSubmit
                  "
                >

                  <!-- =========================================== -->
                  <!-- Material -->
                  <!-- =========================================== -->

                  <div
                    class="mb-4"
                  >

                    <label
                      for="item"
                      class="
                        form-label
                        fw-semibold
                      "
                    >
                      What would you
                      like to recycle?

                      <span
                        class="
                          text-danger
                        "
                        aria-hidden="true"
                      >
                        *
                      </span>

                      <span
                        class="
                          visually-hidden
                        "
                      >
                        required
                      </span>
                    </label>


                    <input
                      id="item"
                      ref="itemInput"
                      v-model.trim="
                        item
                      "
                      type="text"
                      maxlength="50"
                      class="
                        form-control
                        form-control-lg
                      "
                      :class="{
                        'is-invalid':
                          itemError,
                      }"
                      placeholder="e.g. Batteries"
                      autocomplete="off"
                      required
                      aria-required="true"
                      :aria-invalid="
                        itemError
                          ? 'true'
                          : 'false'
                      "
                      :aria-describedby="
                        itemError
                          ? 'item-help item-error'
                          : 'item-help'
                      "
                    />


                    <div
                      v-if="
                        itemError
                      "
                      id="item-error"
                      class="
                        invalid-feedback
                      "
                      role="alert"
                    >
                      {{
                        itemError
                      }}
                    </div>


                    <div
                      id="item-help"
                      class="
                        form-text
                      "
                    >
                      Enter an item or
                      choose a category
                      below. Maximum
                      50 characters.
                    </div>

                  </div>


                  <!-- =========================================== -->
                  <!-- Quick categories -->
                  <!-- =========================================== -->

                  <fieldset
                    class="
                      mb-4
                      border-0
                      p-0
                    "
                  >

                    <legend
                      class="
                        fs-6
                        fw-semibold
                        mb-2
                      "
                    >
                      Quick Categories
                    </legend>


                    <p
                      id="category-help"
                      class="
                        small
                        text-secondary
                        mb-3
                      "
                    >
                      Select a category
                      to fill the material
                      field automatically.
                    </p>


                    <div
                      class="
                        d-flex
                        flex-wrap
                        gap-2
                      "
                      aria-describedby="category-help"
                    >

                      <button
                        v-for="
                          category in
                          categories
                        "
                        :key="
                          category
                        "
                        type="button"
                        class="btn"
                        :class="
                          item ===
                          category
                            ? 'btn-success'
                            : 'btn-outline-success'
                        "
                        :aria-pressed="
                          item ===
                          category
                            ? 'true'
                            : 'false'
                        "
                        @click="
                          selectCategory(
                            category,
                          )
                        "
                      >
                        {{
                          category
                        }}
                      </button>

                    </div>

                  </fieldset>


                  <!-- =========================================== -->
                  <!-- Postcode -->
                  <!-- =========================================== -->

                  <div
                    class="mb-4"
                  >

                    <label
                      for="postcode"
                      class="
                        form-label
                        fw-semibold
                      "
                    >
                      Postcode

                      <span
                        class="
                          text-danger
                        "
                        aria-hidden="true"
                      >
                        *
                      </span>

                      <span
                        class="
                          visually-hidden
                        "
                      >
                        required
                      </span>
                    </label>


                    <input
                      id="postcode"
                      ref="postcodeInput"
                      v-model.trim="
                        postcode
                      "
                      type="text"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      maxlength="4"
                      class="
                        form-control
                        form-control-lg
                      "
                      :class="{
                        'is-invalid':
                          postcodeError,
                      }"
                      placeholder="e.g. 3168"
                      autocomplete="postal-code"
                      required
                      aria-required="true"
                      :aria-invalid="
                        postcodeError
                          ? 'true'
                          : 'false'
                      "
                      :aria-describedby="
                        postcodeError
                          ? 'postcode-help postcode-error'
                          : 'postcode-help'
                      "
                    />


                    <div
                      v-if="
                        postcodeError
                      "
                      id="postcode-error"
                      class="
                        invalid-feedback
                      "
                      role="alert"
                    >
                      {{
                        postcodeError
                      }}
                    </div>


                    <div
                      id="postcode-help"
                      class="
                        form-text
                      "
                    >
                      Enter a postcode
                      in the current
                      Victorian service
                      area (3000–3999).
                    </div>

                  </div>


                  <!-- =========================================== -->
                  <!-- Submit -->
                  <!-- =========================================== -->

                  <div
                    class="
                      d-grid
                      d-sm-flex
                      justify-content-sm-end
                    "
                  >
                    <button
                      type="submit"
                      class="
                        btn
                        btn-success
                        btn-lg
                        px-4
                      "
                    >
                      Find Recycling
                      Options
                    </button>
                  </div>


                  <!-- =========================================== -->
                  <!-- Recent searches -->
                  <!-- =========================================== -->

                  <section
                    v-if="
                      recentSearches.length >
                      0
                    "
                    class="
                      mt-4
                      pt-4
                      border-top
                    "
                    aria-labelledby="recent-searches-title"
                  >

                    <div
                      class="
                        d-flex
                        justify-content-between
                        align-items-center
                        gap-3
                        mb-3
                      "
                    >

                      <div>

                        <h2
                          id="recent-searches-title"
                          class="
                            h6
                            fw-semibold
                            mb-0
                          "
                        >
                          Recent Searches
                        </h2>


                        <small
                          class="
                            text-secondary
                          "
                        >
                          Select a previous
                          search to use it
                          again.
                        </small>

                      </div>


                      <button
                        type="button"
                        class="
                          btn
                          btn-sm
                          btn-outline-secondary
                        "
                        aria-label="Clear all recent searches"
                        @click="
                          clearRecentSearches
                        "
                      >
                        Clear
                      </button>

                    </div>


                    <div
                      class="
                        d-flex
                        flex-wrap
                        gap-2
                      "
                    >

                      <button
                        v-for="
                          search in
                          recentSearches
                        "
                        :key="
                          `${search.item}-${search.postcode}`
                        "
                        type="button"
                        class="
                          btn
                          btn-light
                          border
                        "
                        :aria-label="
                          `Use recent search ${search.item}, postcode ${search.postcode}`
                        "
                        @click="
                          useRecentSearch(
                            search,
                          )
                        "
                      >
                        {{
                          search.item
                        }}

                        <span
                          class="
                            text-secondary
                          "
                        >
                          ·
                          {{
                            search.postcode
                          }}
                        </span>
                      </button>

                    </div>

                  </section>

                </form>

              </div>
            </div>


            <!-- ================================================= -->
            <!-- Information cards -->
            <!-- ================================================= -->

            <div
              class="
                row
                g-4
                mt-4
              "
            >

              <div
                class="
                  col-md-6
                "
              >

                <div
                  class="
                    p-4
                    bg-light
                    rounded-4
                    h-100
                  "
                >

                  <h2
                    class="
                      h5
                      fw-bold
                    "
                  >
                    <span
                      aria-hidden="true"
                    >
                      ♻
                    </span>

                    Why recycle
                    correctly?
                  </h2>


                  <p
                    class="
                      text-secondary
                      mb-0
                    "
                  >
                    Correct disposal
                    helps recover useful
                    materials and reduces
                    unnecessary waste
                    going to landfill.
                  </p>

                </div>

              </div>


              <div
                class="
                  col-md-6
                "
              >

                <div
                  class="
                    p-4
                    bg-light
                    rounded-4
                    h-100
                  "
                >

                  <h2
                    class="
                      h5
                      fw-bold
                    "
                  >
                    <span
                      aria-hidden="true"
                    >
                      📍
                    </span>

                    Local options
                  </h2>


                  <p
                    class="
                      text-secondary
                      mb-0
                    "
                  >
                    Search results will
                    show suitable services
                    based on the material
                    and postcode you
                    provide.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>

  </main>
</template>


<style scoped>
.finder-intro {
  max-width:
    700px;
}


/* ===================================================== */
/* Cards */
/* ===================================================== */

.card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}


.card:hover {
  transform:
    translateY(-2px);
}


/* ===================================================== */
/* Buttons */
/* ===================================================== */

.btn {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}


.btn:hover:not(:disabled) {
  transform:
    translateY(-1px);
}


/* ===================================================== */
/* Form focus */
/* ===================================================== */

.form-control:focus {
  border-color:
    var(--bs-success);

  box-shadow:
    0 0 0 0.25rem
    rgba(
      25,
      135,
      84,
      0.15
    );
}


/* ===================================================== */
/* Invalid field focus */
/* ===================================================== */

.form-control.is-invalid:focus {
  box-shadow:
    0 0 0 0.25rem
    rgba(
      220,
      53,
      69,
      0.15
    );
}


/* ===================================================== */
/* Fieldset */
/* ===================================================== */

fieldset {
  min-width:
    0;
}


/* ===================================================== */
/* Reduced motion */
/*
  Global accessibility.css already handles this.
  This fallback also protects this component if used
  independently.
*/
/* ===================================================== */

@media (
  prefers-reduced-motion: reduce
) {
  .card,
  .btn {
    transition:
      none;
  }

  .card:hover,
  .btn:hover {
    transform:
      none;
  }
}
</style>