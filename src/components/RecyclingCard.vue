<script setup>
defineProps({
  location: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="card h-100 border-0 shadow-sm rounded-4 result-card">
    <div class="card-body p-4">
      <!-- Location name and status -->
      <div class="d-flex justify-content-between align-items-start gap-3 mb-2">
        <div>
          <h2 class="h4 fw-bold mb-1">
            {{ location.name }}
          </h2>

          <p class="text-secondary mb-0">📍 {{ location.suburb }} VIC {{ location.postcode }}</p>
        </div>

        <span
          class="badge rounded-pill"
          :class="location.status === 'Open' ? 'text-bg-success' : 'text-bg-secondary'"
        >
          {{ location.status }}
        </span>
      </div>

      <hr />

      <!-- Distance and rating -->
      <div class="d-flex flex-wrap gap-4 mb-3">
        <div>
          <span class="text-secondary small d-block"> Distance </span>

          <span class="fw-semibold"> {{ location.distance }} km </span>
        </div>

        <div>
          <span class="text-secondary small d-block"> Community Rating </span>

          <span class="fw-semibold"> ⭐ {{ location.rating }} </span>
        </div>
      </div>

      <!-- Accepted materials -->
      <div class="mb-3">
        <p class="fw-semibold mb-2">Accepted Materials</p>

        <div class="d-flex flex-wrap gap-2">
          <span
            v-for="material in location.acceptedMaterials"
            :key="material"
            class="badge text-bg-light border text-success px-3 py-2"
          >
            {{ material }}
          </span>
        </div>
      </div>

      <!-- Description -->
      <p class="text-secondary mb-0">
        {{ location.description }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.result-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.result-card:hover {
  transform: translateY(-3px);
}
</style>
