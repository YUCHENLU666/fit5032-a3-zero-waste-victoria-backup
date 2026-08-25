<script setup>
import { RouterView } from 'vue-router'
import AppNavbar from './components/AppNavbar.vue'
import AppFooter from './components/AppFooter.vue'
</script>

<template>
  <div class="d-flex flex-column min-vh-100">
    <AppNavbar />

    <main class="flex-grow-1">
      <RouterView />
    </main>

    <AppFooter />
  </div>
</template>