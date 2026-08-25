<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const item = ref('')
const postcode = ref('')

const itemError = ref('')
const postcodeError = ref('')

// ================= RECENT SEARCHES =================
// Load saved searches from localStorage
const recentSearches = ref(JSON.parse(localStorage.getItem('zwvRecentSearches') || '[]'))

const categories = ['Batteries', 'E-Waste', 'Clothing', 'Furniture', 'Plastics']

// ================= QUICK CATEGORY =================
const selectCategory = (category) => {
  item.value = category
  itemError.value = ''
}

// ================= USE RECENT SEARCH =================
const useRecentSearch = (search) => {
  item.value = search.item
  postcode.value = search.postcode

  itemError.value = ''
  postcodeError.value = ''
}

// ================= CLEAR RECENT SEARCHES =================
const clearRecentSearches = () => {
  recentSearches.value = []
  localStorage.removeItem('zwvRecentSearches')
}

// ================= FORM SUBMISSION =================
const handleSubmit = () => {
  // ================= ITEM VALIDATION =================
  if (!item.value) {
    itemError.value = 'Please enter an item or select a category.'
  } else {
    itemError.value = ''
  }

  // ================= POSTCODE VALIDATION =================
  const postcodePattern = /^\d{4}$/

  // Step 1: Check 4-digit format
  if (!postcode.value || !postcodePattern.test(postcode.value)) {
    postcodeError.value = 'Please enter a valid 4-digit postcode.'
  } else {
    const postcodeNumber = Number(postcode.value)

    // Step 2: Check Victorian project scope
    if (postcodeNumber < 3000 || postcodeNumber > 3999) {
      postcodeError.value = 'Please enter a Victorian postcode.'
    } else {
      postcodeError.value = ''
    }
  }

  // ================= SUCCESS =================
  if (!itemError.value && !postcodeError.value) {
    const currentSearch = {
      item: item.value,
      postcode: postcode.value,
    }

    // Remove duplicate searches
    recentSearches.value = recentSearches.value.filter((search) => {
      return !(
        search.item.toLowerCase() === currentSearch.item.toLowerCase() &&
        search.postcode === currentSearch.postcode
      )
    })

    // Put the newest search first
    recentSearches.value.unshift(currentSearch)

    // Keep only the latest 5 searches
    recentSearches.value = recentSearches.value.slice(0, 5)

    // Save to localStorage
    localStorage.setItem('zwvRecentSearches', JSON.stringify(recentSearches.value))

    // Navigate to results
    router.push({
      path: '/results',
      query: {
        item: item.value,
        postcode: postcode.value,
      },
    })
  }
}
</script>

<template>
  <div>
    <!-- ================= PAGE HEADER ================= -->
    <section class="bg-light py-5">
      <div class="container text-center py-lg-4">
        <p class="text-success fw-bold text-uppercase mb-2">Recycling Finder</p>

        <h1 class="display-5 fw-bold mb-3">Find the right place for your item</h1>

        <p class="lead text-secondary mx-auto finder-intro">
          Tell us what you want to recycle and your postcode, and we’ll help you find suitable
          recycling and reuse options.
        </p>
      </div>
    </section>

    <!-- ================= FINDER ================= -->
    <section class="py-5">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-8">
            <div class="card border-0 shadow-sm rounded-4">
              <div class="card-body p-4 p-md-5">
                <form @submit.prevent="handleSubmit" novalidate>
                  <!-- ================= MATERIAL ================= -->
                  <div class="mb-4">
                    <label for="item" class="form-label fw-semibold">
                      What would you like to recycle?
                      <span class="text-danger">*</span>
                    </label>

                    <input
                      id="item"
                      v-model.trim="item"
                      type="text"
                      class="form-control form-control-lg"
                      :class="{ 'is-invalid': itemError }"
                      placeholder="e.g. Batteries"
                    />

                    <div v-if="itemError" class="invalid-feedback">
                      {{ itemError }}
                    </div>

                    <div class="form-text">Enter an item or choose a category below.</div>
                  </div>

                  <!-- ================= QUICK CATEGORIES ================= -->
                  <div class="mb-4">
                    <p class="fw-semibold mb-2">Quick Categories</p>

                    <div class="d-flex flex-wrap gap-2">
                      <button
                        v-for="category in categories"
                        :key="category"
                        type="button"
                        class="btn"
                        :class="item === category ? 'btn-success' : 'btn-outline-success'"
                        @click="selectCategory(category)"
                      >
                        {{ category }}
                      </button>
                    </div>
                  </div>

                  <!-- ================= POSTCODE ================= -->
                  <div class="mb-4">
                    <label for="postcode" class="form-label fw-semibold">
                      Postcode
                      <span class="text-danger">*</span>
                    </label>

                    <input
                      id="postcode"
                      v-model.trim="postcode"
                      type="text"
                      inputmode="numeric"
                      maxlength="4"
                      class="form-control form-control-lg"
                      :class="{ 'is-invalid': postcodeError }"
                      placeholder="e.g. 3168"
                    />

                    <div v-if="postcodeError" class="invalid-feedback">
                      {{ postcodeError }}
                    </div>

                    <div class="form-text">Enter a 4-digit Victorian postcode.</div>
                  </div>

                  <!-- ================= SUBMIT ================= -->
                  <div class="d-grid d-sm-flex justify-content-sm-end">
                    <button type="submit" class="btn btn-success btn-lg px-4">
                      Find Recycling Options
                    </button>
                  </div>

                  <!-- ================= RECENT SEARCHES ================= -->
                  <div v-if="recentSearches.length > 0" class="mt-4 pt-4 border-top">
                    <div class="d-flex justify-content-between align-items-center gap-3 mb-3">
                      <div>
                        <p class="fw-semibold mb-0">Recent Searches</p>

                        <small class="text-secondary">
                          Select a previous search to use it again.
                        </small>
                      </div>

                      <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary"
                        @click="clearRecentSearches"
                      >
                        Clear
                      </button>
                    </div>

                    <div class="d-flex flex-wrap gap-2">
                      <button
                        v-for="search in recentSearches"
                        :key="`${search.item}-${search.postcode}`"
                        type="button"
                        class="btn btn-light border"
                        @click="useRecentSearch(search)"
                      >
                        {{ search.item }}

                        <span class="text-secondary"> · {{ search.postcode }} </span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <!-- ================= INFORMATION ================= -->
            <div class="row g-4 mt-4">
              <div class="col-md-6">
                <div class="p-4 bg-light rounded-4 h-100">
                  <h2 class="h5 fw-bold">♻ Why recycle correctly?</h2>

                  <p class="text-secondary mb-0">
                    Correct disposal helps recover useful materials and reduces unnecessary waste
                    going to landfill.
                  </p>
                </div>
              </div>

              <div class="col-md-6">
                <div class="p-4 bg-light rounded-4 h-100">
                  <h2 class="h5 fw-bold">📍 Local options</h2>

                  <p class="text-secondary mb-0">
                    Search results will show suitable services based on the material and postcode
                    you provide.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.finder-intro {
  max-width: 700px;
}

.card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
}

.btn {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.form-control:focus {
  border-color: var(--bs-success);
  box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.15);
}
</style>
