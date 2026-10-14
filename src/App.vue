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


const route = useRoute()

const pageContent =
  ref(null)


// ======================================================
// SPA route focus management
// ======================================================
//
// Vue Router changes pages without reloading the browser.
//
// After navigation, keyboard and screen-reader users should
// be informed that new page content is available.
//
// We move focus to the new page's H1 after navigation.
// ======================================================

watch(
  () => route.fullPath,

  async () => {
    await nextTick()

    const pageHeading =
      pageContent.value
        ?.querySelector('h1')

    if (!pageHeading) {
      return
    }

    pageHeading.setAttribute(
      'tabindex',
      '-1',
    )

    pageHeading.focus({
      preventScroll: true,
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
    <!--
      Hidden until focused with the keyboard.

      Allows keyboard and screen-reader users
      to bypass the navigation menu.
    -->

    <a
      class="skip-link"
      href="#main-content"
    >
      Skip to main content
    </a>


    <AppNavbar />


    <!-- ================================================= -->
    <!-- Route content -->
    <!-- ================================================= -->
    <!--
      This wrapper is intentionally NOT a <main> element.

      Each route view contains its own semantic <main>,
      preventing nested main landmarks.
    -->

    <div
      id="main-content"
      ref="pageContent"
      class="flex-grow-1"
      tabindex="-1"
    >
      <RouterView />
    </div>


    <AppFooter />

  </div>
</template>