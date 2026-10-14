<script setup>
import {
  RouterLink,
} from 'vue-router'
</script>


<template>
  <main
    aria-labelledby="home-title"
  >

    <!-- ================================================= -->
    <!-- Hero section -->
    <!-- ================================================= -->

    <section
      class="
        py-5
        bg-light
      "
      aria-labelledby="home-title"
    >
      <div
        class="
          container
          py-lg-5
        "
      >
        <div
          class="
            row
            align-items-center
            g-5
          "
        >

          <!-- ================================================= -->
          <!-- Hero content -->
          <!-- ================================================= -->

          <div
            class="
              col-lg-7
            "
          >

            <p
              class="
                section-eyebrow
                fw-bold
                text-uppercase
                mb-2
              "
            >
              Zero Waste Victoria
            </p>


            <h1
              id="home-title"
              class="
                display-3
                fw-bold
                mb-4
              "
            >
              Waste less.

              <br />

              <span
                class="
                  hero-accent
                "
              >
                Live circular.
              </span>
            </h1>


            <p
              class="
                lead
                text-secondary
                mb-4
              "
            >
              Find trusted recycling
              and reuse options across
              Melbourne and make better
              choices for the things you
              no longer need.
            </p>


            <div
              class="
                d-flex
                flex-wrap
                gap-3
              "
            >

              <RouterLink
                to="/recycle"
                class="
                  btn
                  btn-success
                  btn-lg
                  px-4
                "
              >
                Find a Recycler
              </RouterLink>


              <a
                href="#features"
                class="
                  btn
                  btn-outline-success
                  btn-lg
                  px-4
                "
              >
                Learn More
              </a>

            </div>

          </div>


          <!-- ================================================= -->
          <!-- Hero visual -->
          <!-- ================================================= -->

          <div
            class="
              col-lg-5
            "
          >

            <div
              class="
                circular-hero-card
                text-white
                rounded-4
                p-5
                shadow-sm
                text-center
              "
            >

              <!-- Decorative recycling icon -->

              <div
                class="
                  display-1
                  mb-3
                "
                aria-hidden="true"
              >
                ♻
              </div>


              <h2
                class="
                  fw-bold
                "
              >
                Circular Melbourne
              </h2>


              <p
                class="
                  mb-4
                "
              >
                Small actions can keep
                valuable materials out
                of landfill.
              </p>


              <div
                class="
                  row
                  g-2
                "
                role="group"
                aria-label="Circular economy actions"
              >

                <div
                  class="
                    col-6
                  "
                >
                  <div
                    class="
                      circular-action
                      rounded-3
                      p-3
                    "
                  >
                    Reduce
                  </div>
                </div>


                <div
                  class="
                    col-6
                  "
                >
                  <div
                    class="
                      circular-action
                      rounded-3
                      p-3
                    "
                  >
                    Reuse
                  </div>
                </div>


                <div
                  class="
                    col-6
                  "
                >
                  <div
                    class="
                      circular-action
                      rounded-3
                      p-3
                    "
                  >
                    Repair
                  </div>
                </div>


                <div
                  class="
                    col-6
                  "
                >
                  <div
                    class="
                      circular-action
                      rounded-3
                      p-3
                    "
                  >
                    Recycle
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </div>
    </section>


    <!-- ================================================= -->
    <!-- Features -->
    <!-- ================================================= -->

    <section
      id="features"
      class="
        py-5
      "
      aria-labelledby="features-title"
    >
      <div
        class="
          container
          py-lg-4
        "
      >

        <div
          class="
            text-center
            mb-5
          "
        >

          <p
            class="
              section-eyebrow
              fw-bold
              text-uppercase
              mb-2
            "
          >
            Take Action
          </p>


          <h2
            id="features-title"
            class="
              fw-bold
            "
          >
            What can Circular Hub
            help you do?
          </h2>


          <p
            class="
              text-secondary
            "
          >
            Simple tools and
            information to make
            low-waste choices easier.
          </p>

        </div>


        <div
          class="
            row
            g-4
          "
        >

          <!-- ================================================= -->
          <!-- Find recycling -->
          <!-- ================================================= -->

          <div
            class="
              col-md-4
            "
          >

            <article
              class="
                card
                h-100
                border-0
                shadow-sm
                rounded-4
              "
              aria-labelledby="find-recycling-title"
            >

              <div
                class="
                  card-body
                  p-4
                "
              >

                <div
                  class="
                    fs-1
                    mb-3
                  "
                  aria-hidden="true"
                >
                  ♻
                </div>


                <h3
                  id="find-recycling-title"
                  class="
                    h4
                    fw-bold
                  "
                >
                  Find Recycling
                </h3>


                <p
                  class="
                    text-secondary
                  "
                >
                  Search by item and
                  postcode to find
                  suitable recycling
                  and reuse options
                  near you.
                </p>


                <RouterLink
                  to="/recycle"
                  class="
                    feature-link
                    fw-semibold
                  "
                >
                  Search options

                  <span
                    aria-hidden="true"
                  >
                    →
                  </span>
                </RouterLink>

              </div>

            </article>

          </div>


          <!-- ================================================= -->
          <!-- Reuse and repair -->
          <!-- ================================================= -->

          <div
            class="
              col-md-4
            "
          >

            <article
              class="
                card
                h-100
                border-0
                shadow-sm
                rounded-4
              "
              aria-labelledby="reuse-repair-title"
            >

              <div
                class="
                  card-body
                  p-4
                "
              >

                <div
                  class="
                    fs-1
                    mb-3
                  "
                  aria-hidden="true"
                >
                  ↻
                </div>


                <h3
                  id="reuse-repair-title"
                  class="
                    h4
                    fw-bold
                  "
                >
                  Reuse & Repair
                </h3>


                <p
                  class="
                    text-secondary
                  "
                >
                  Explore practical
                  ways to extend the
                  life of everyday
                  items before sending
                  them to landfill.
                </p>


                <span
                  class="
                    text-secondary
                    small
                  "
                >
                  More resources
                  coming soon
                </span>

              </div>

            </article>

          </div>


          <!-- ================================================= -->
          <!-- Community action -->
          <!-- ================================================= -->

          <div
            class="
              col-md-4
            "
          >

            <article
              class="
                card
                h-100
                border-0
                shadow-sm
                rounded-4
              "
              aria-labelledby="community-action-title"
            >

              <div
                class="
                  card-body
                  p-4
                "
              >

                <div
                  class="
                    fs-1
                    mb-3
                  "
                  aria-hidden="true"
                >
                  🌱
                </div>


                <h3
                  id="community-action-title"
                  class="
                    h4
                    fw-bold
                  "
                >
                  Community Action
                </h3>


                <p
                  class="
                    text-secondary
                  "
                >
                  Discover local
                  sustainability
                  initiatives,
                  community events
                  and opportunities
                  to take action.
                </p>


                <span
                  class="
                    text-secondary
                    small
                  "
                >
                  Community resources
                  coming soon
                </span>

              </div>

            </article>

          </div>

        </div>

      </div>
    </section>


    <!-- ================================================= -->
    <!-- Common materials -->
    <!-- ================================================= -->

    <section
      class="
        py-5
        bg-light
      "
      aria-labelledby="materials-title"
    >
      <div
        class="
          container
        "
      >
        <div
          class="
            row
            align-items-center
            g-4
          "
        >

          <div
            class="
              col-lg-5
            "
          >

            <p
              class="
                section-eyebrow
                fw-bold
                text-uppercase
                mb-2
              "
            >
              Common Materials
            </p>


            <h2
              id="materials-title"
              class="
                fw-bold
              "
            >
              Popular recycling
              categories
            </h2>


            <p
              class="
                text-secondary
                mb-0
              "
            >
              These are some common
              materials supported by
              the Recycling Finder.
            </p>

          </div>


          <div
            class="
              col-lg-7
            "
          >

            <ul
              class="
                material-list
                list-unstyled
                d-flex
                flex-wrap
                gap-3
                mb-0
              "
              aria-label="Popular recycling categories"
            >

              <li>
                <span
                  class="
                    material-pill
                  "
                >
                  Batteries
                </span>
              </li>


              <li>
                <span
                  class="
                    material-pill
                  "
                >
                  E-Waste
                </span>
              </li>


              <li>
                <span
                  class="
                    material-pill
                  "
                >
                  Clothing
                </span>
              </li>


              <li>
                <span
                  class="
                    material-pill
                  "
                >
                  Furniture
                </span>
              </li>


              <li>
                <span
                  class="
                    material-pill
                  "
                >
                  Plastics
                </span>
              </li>

            </ul>

          </div>

        </div>
      </div>
    </section>


    <!-- ================================================= -->
    <!-- Final call to action -->
    <!-- ================================================= -->

    <section
      class="
        py-5
      "
      aria-labelledby="finder-cta-title"
    >
      <div
        class="
          container
        "
      >

        <div
          class="
            bg-success-subtle
            rounded-4
            p-5
            text-center
          "
        >

          <p
            class="
              section-eyebrow
              fw-bold
              text-uppercase
              mb-2
            "
          >
            Recycling Finder
          </p>


          <h2
            id="finder-cta-title"
            class="
              fw-bold
            "
          >
            Not sure where it goes?
          </h2>


          <p
            class="
              text-secondary
              mx-auto
              mb-4
              cta-description
            "
          >
            Use our Recycling Finder
            to get clear and practical
            guidance for disposing of
            your item responsibly.
          </p>


          <RouterLink
            to="/recycle"
            class="
              btn
              btn-success
              btn-lg
            "
          >
            Find Recycling Options
          </RouterLink>

        </div>

      </div>
    </section>

  </main>
</template>


<style scoped>

/* ===================================================== */
/* Accessible colour helpers */
/* ===================================================== */

.section-eyebrow,
.hero-accent {
  color:
    #146c43;
}


/* ===================================================== */
/* Accessible circular hero */
/* ===================================================== */

/*
  Darker green gives white text
  reliable WCAG AA contrast.
*/

.circular-hero-card {
  background-color:
    #146c43;
}


/*
  The old Bootstrap combination:
  bg-white + bg-opacity-25 + white text
  produced insufficient contrast.

  White background with dark text
  provides a strong accessible contrast.
*/

.circular-action {
  color:
    #212529;

  font-weight:
    600;

  background-color:
    #ffffff;

  border:
    1px solid
    rgba(
      0,
      0,
      0,
      0.12
    );
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
    translateY(-4px);
}


/* ===================================================== */
/* Buttons */
/* ===================================================== */

.btn {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}


.btn:hover {
  transform:
    translateY(-1px);
}

/* ===================================================== */
/* Feature links */
/* ===================================================== */

.feature-link {
  color:
    #146c43;

  text-decoration-line:
    underline;

  text-decoration-thickness:
    0.08em;

  text-underline-offset:
    0.18em;
}


.feature-link:hover {
  color:
    #0b5d1e;
}


/* ===================================================== */
/* Material category list */
/* ===================================================== */

.material-list {
  padding-left:
    0;
}


.material-pill {
  display:
    inline-block;

  padding:
    0.6rem 1.25rem;

  border:
    1px solid
    #146c43;

  border-radius:
    999px;

  color:
    #146c43;

  background-color:
    #ffffff;

  font-weight:
    500;
}


/* ===================================================== */
/* CTA */
/* ===================================================== */

.cta-description {
  max-width:
    700px;
}


/* ===================================================== */
/* Anchor positioning */
/* ===================================================== */

section {
  scroll-margin-top:
    80px;
}


/* ===================================================== */
/* Reduced motion */
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