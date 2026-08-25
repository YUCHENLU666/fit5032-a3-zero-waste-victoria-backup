<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

import RecyclingCard from '../components/RecyclingCard.vue'
import { recyclingLocations } from '../data/recyclingLocations.js'

const route = useRoute()

// Get the searched material from the URL query
const searchItem = computed(() => {
  return route.query.item || ''
})

// Get the searched postcode from the URL query
const searchPostcode = computed(() => {
  return route.query.postcode || ''
})

// Filter by material,
// prioritise exact postcode matches,
// then sort by distance
const filteredLocations = computed(() => {
  const item = searchItem.value.trim().toLowerCase()
  const postcode = searchPostcode.value.trim()

  if (!item) {
    return []
  }

  // Step 1: Filter locations by accepted material
  const matches = recyclingLocations.filter((location) => {
    return location.acceptedMaterials.some((material) => material.toLowerCase() === item)
  })

  // Step 2:
  // First priority: exact postcode match
  // Second priority: shortest distance
  return matches.sort((a, b) => {
    const aMatchesPostcode = a.postcode === postcode ? 1 : 0
    const bMatchesPostcode = b.postcode === postcode ? 1 : 0

    if (aMatchesPostcode !== bMatchesPostcode) {
      return bMatchesPostcode - aMatchesPostcode
    }

    return a.distance - b.distance
  })
})
</script>

<template>
  <div>
    <!-- ================= HEADER ================= -->
    <section class="bg-light py-5">
      <div class="container py-lg-4">
        <p class="text-success fw-bold text-uppercase mb-2">Recycling Finder</p>

        <h1 class="display-5 fw-bold mb-3">Search Results</h1>

        <p class="lead text-secondary mb-0">
          Showing recycling options for
          <strong>{{ searchItem }}</strong>
          near postcode
          <strong>{{ searchPostcode }}</strong
          >.
        </p>
      </div>
    </section>

    <!-- ================= RESULTS ================= -->
    <section class="py-5">
      <div class="container">
        <!-- Results summary -->
        <div
          class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4"
        >
          <div>
            <h2 class="h4 fw-bold mb-1">Available locations</h2>

            <p class="text-secondary mb-0">
              {{ filteredLocations.length }}
              recycling option(s) found
            </p>
          </div>

          <RouterLink to="/recycle" class="btn btn-outline-success"> ← Change Search </RouterLink>
        </div>

        <!-- ================= RESULTS EXIST ================= -->
        <div v-if="filteredLocations.length > 0" class="row g-4">
          <div v-for="location in filteredLocations" :key="location.id" class="col-lg-6">
            <RecyclingCard :location="location" />
          </div>
        </div>

        <!-- ================= NO RESULTS ================= -->
        <div v-else class="text-center bg-light rounded-4 p-5">
          <div class="display-4 mb-3">♻</div>

          <h2 class="h4 fw-bold">No matching locations found</h2>

          <p class="text-secondary mb-4">
            Try another material or postcode to explore more recycling options.
          </p>

          <RouterLink to="/recycle" class="btn btn-success"> Search Again </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.btn {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
}
</style>
