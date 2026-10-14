<script setup>
import {
  RouterLink,
} from 'vue-router'
</script>


<template>
  <footer
    class="
      bg-light
      border-top
      mt-auto
    "
    aria-label="Site footer"
  >
    <div
      class="
        container
        py-5
      "
    >
      <div
        class="
          row
          g-4
        "
      >

        <!-- ================================================= -->
        <!-- Brand -->
        <!-- ================================================= -->

        <div
          class="
            col-md-7
          "
        >

          <RouterLink
            to="/"
            class="
              footer-brand
              text-dark
              fw-bold
              fs-5
            "
            aria-label="ZWV Circular Hub home"
          >
            <span
              aria-hidden="true"
            >
              ♻
            </span>

            <span>
              ZWV Circular Hub
            </span>
          </RouterLink>


          <p
            class="
              text-secondary
              mt-3
              mb-0
            "
          >
            Helping Melbourne reduce,
            reuse, repair and recycle
            through practical information
            and local action.
          </p>

        </div>


        <!-- ================================================= -->
        <!-- Footer navigation -->
        <!-- ================================================= -->

        <div
          class="
            col-md-5
          "
        >

          <nav
            aria-labelledby="footer-links-title"
          >

            <h2
              id="footer-links-title"
              class="
                h6
                fw-bold
                mb-3
              "
            >
              Quick Links
            </h2>


            <div
              class="
                d-flex
                flex-column
                gap-2
              "
            >

              <RouterLink
                to="/"
                class="
                  footer-link
                  text-secondary
                "
              >
                Home
              </RouterLink>


              <RouterLink
                to="/recycle"
                class="
                  footer-link
                  text-secondary
                "
              >
                Recycle & Reuse
              </RouterLink>

            </div>

          </nav>

        </div>

      </div>


      <hr
        class="my-4"
      />


      <!-- ================================================= -->
      <!-- Footer legal / supporting information -->
      <!-- ================================================= -->

      <div
        class="
          d-flex
          flex-column
          flex-md-row
          justify-content-between
          align-items-md-center
          gap-2
        "
      >

        <p
          class="
            text-secondary
            small
            mb-0
          "
        >
          © 2026 Zero Waste Victoria
          Circular Hub
        </p>


        <p
          class="
            text-secondary
            small
            mb-0
          "
        >
          Built to support a more
          circular Victoria.
        </p>

      </div>

    </div>
  </footer>
</template>


<style scoped>

/* ===================================================== */
/* Footer brand */
/* ===================================================== */

.footer-brand {
  display:
    inline-flex;

  align-items:
    center;

  gap:
    0.35rem;

  text-decoration:
    none;

  transition:
    color 0.2s ease;
}


.footer-brand:hover {
  color:
    var(--bs-success)
    !important;
}


/* ===================================================== */
/* Footer links */
/* ===================================================== */

.footer-link {
  width:
    fit-content;

  text-decoration-line:
    underline;

  text-decoration-thickness:
    0.08em;

  text-underline-offset:
    0.18em;

  transition:
    color 0.2s ease;
}


.footer-link:hover {
  color:
    var(--bs-success)
    !important;
}


/* ===================================================== */
/* Keyboard focus */
/* ===================================================== */

.footer-brand:focus-visible,
.footer-link:focus-visible {
  outline:
    3px solid
    #0b5d1e;

  outline-offset:
    3px;

  border-radius:
    3px;
}


/* ===================================================== */
/* Reduced motion */
/* ===================================================== */

@media (
  prefers-reduced-motion: reduce
) {

  .footer-brand,
  .footer-link {
    transition:
      none;
  }

}
</style>