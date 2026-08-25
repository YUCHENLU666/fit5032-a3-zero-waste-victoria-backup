<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="bg-light border-top mt-auto">
    <div class="container py-5">
      <div class="row g-4">

        <!-- Brand -->
        <div class="col-md-7">
          <RouterLink
            to="/"
            class="text-decoration-none text-dark fw-bold fs-5"
          >
            ♻ ZWV Circular Hub
          </RouterLink>

          <p class="text-secondary mt-3 mb-0">
            Helping Melbourne reduce, reuse, repair and recycle
            through practical information and local action.
          </p>
        </div>

        <!-- Navigation -->
        <div class="col-md-5">
          <h2 class="h6 fw-bold mb-3">
            Quick Links
          </h2>

          <div class="d-flex flex-column gap-2">
            <RouterLink
              to="/"
              class="text-secondary text-decoration-none"
            >
              Home
            </RouterLink>

            <RouterLink
              to="/recycle"
              class="text-secondary text-decoration-none"
            >
              Recycle & Reuse
            </RouterLink>
          </div>
        </div>

      </div>

      <hr class="my-4" />

      <div
        class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2"
      >
        <p class="text-secondary small mb-0">
          © 2026 Zero Waste Victoria Circular Hub
        </p>

        <p class="text-secondary small mb-0">
          Built to support a more circular Victoria.
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
footer a {
  transition: color 0.2s ease;
}

footer a:hover {
  color: var(--bs-success) !important;
}
</style>