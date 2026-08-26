<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top">
    <div class="container">
      <!-- Brand -->
      <RouterLink class="navbar-brand fw-bold" to="/"> ♻ ZWV Circular Hub </RouterLink>

      <!-- Mobile toggle -->
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNavbar"
        aria-controls="mainNavbar"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Navigation links -->
      <div id="mainNavbar" class="collapse navbar-collapse">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <RouterLink class="nav-link" to="/"> Home </RouterLink>
          </li>

          <li class="nav-item">
            <RouterLink class="nav-link" to="/recycle"> Recycle & Reuse </RouterLink>
          </li>

          <li class="nav-item">
            <span class="nav-link"> </span>
          </li>

          <li class="nav-item">
            <span class="nav-link"> </span>
          </li>

          <li class="nav-item">
            <span class="nav-link"> </span>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>
