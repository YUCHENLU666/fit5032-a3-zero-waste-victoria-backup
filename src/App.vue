<script setup>
import {
  nextTick,
  ref,
  watch,
} from 'vue'

import {
  RouterView,
  useRoute,
} from 'vue-router'

import AppNavbar
  from './components/AppNavbar.vue'

import AppFooter
  from './components/AppFooter.vue'

import AccessibilityPanel
  from './components/AccessibilityPanel.vue'


const route =
  useRoute()


const pageContent =
  ref(null)


// ======================================================
// SPA route focus management
// ======================================================
//
// Vue Router changes pages without reloading the browser.
//
// After navigation, keyboard and screen-reader users
// should be informed that new page content is available.
//
// Focus therefore moves to the new page's H1.
// ======================================================

watch(
  () =>
    route.fullPath,

  async () => {
    await nextTick()


    const pageHeading =
      pageContent.value
        ?.querySelector(
          'h1',
        )


    if (!pageHeading) {
      return
    }


    pageHeading.setAttribute(
      'tabindex',
      '-1',
    )


    pageHeading.focus({
      preventScroll:
        true,
    })
  },
)
</script>


<template>
  <div
    class="
      d-flex
      flex-column
      min-vh-100
    "
  >

    <!-- ================================================= -->
    <!-- Skip navigation -->
    <!-- ================================================= -->

    <a
      class="skip-link"
      href="#main-content"
    >
      Skip to main content
    </a>


    <!-- ================================================= -->
    <!-- Navigation -->
    <!-- ================================================= -->

    <AppNavbar />


    <!-- ================================================= -->
    <!-- Route content -->
    <!-- ================================================= -->

    <div
      id="main-content"
      ref="pageContent"
      class="
        flex-grow-1
      "
      tabindex="-1"
    >
      <RouterView />
    </div>


    <!-- ================================================= -->
    <!-- Footer -->
    <!-- ================================================= -->

    <AppFooter />


    <!-- ================================================= -->
    <!-- Global accessibility preferences -->
    <!-- ================================================= -->
    <!--
      Available on every page.

      Does not require authentication.
    -->

    <AccessibilityPanel />

  </div>
</template>