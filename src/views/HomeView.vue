<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div>
    <!-- ================= HERO SECTION ================= -->
    <section class="py-5 bg-light">
      <div class="container py-lg-5">
        <div class="row align-items-center g-5">

          <!-- Left -->
          <div class="col-lg-7">
            <p class="text-success fw-bold text-uppercase mb-2">
              Zero Waste Victoria
            </p>

            <h1 class="display-3 fw-bold mb-4">
              Waste less.<br />
              <span class="text-success">Live circular.</span>
            </h1>

            <p class="lead text-secondary mb-4">
              Find trusted recycling and reuse options across Melbourne
              and make better choices for the things you no longer need.
            </p>

            <div class="d-flex flex-wrap gap-3">
              <RouterLink
                to="/recycle"
                class="btn btn-success btn-lg px-4"
              >
                Find a Recycler
              </RouterLink>

              <a
                href="#features"
                class="btn btn-outline-success btn-lg px-4"
              >
                Learn More
              </a>
            </div>
          </div>


          <!-- Right -->
          <div class="col-lg-5">
            <div
              class="bg-success text-white rounded-4 p-5 shadow-sm text-center"
            >
              <div class="display-1 mb-3">
                ♻
              </div>

              <h2 class="fw-bold">
                Circular Melbourne
              </h2>

              <p class="mb-4">
                Small actions can keep valuable materials
                out of landfill.
              </p>

              <div class="row g-2">
                <div class="col-6">
                  <div class="bg-white bg-opacity-25 rounded-3 p-3">
                    Reduce
                  </div>
                </div>

                <div class="col-6">
                  <div class="bg-white bg-opacity-25 rounded-3 p-3">
                    Reuse
                  </div>
                </div>

                <div class="col-6">
                  <div class="bg-white bg-opacity-25 rounded-3 p-3">
                    Repair
                  </div>
                </div>

                <div class="col-6">
                  <div class="bg-white bg-opacity-25 rounded-3 p-3">
                    Recycle
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>


    <!-- ================= FEATURES ================= -->
    <section id="features" class="py-5">
      <div class="container py-lg-4">

        <div class="text-center mb-5">
          <p class="text-success fw-bold text-uppercase mb-2">
            Take Action
          </p>

          <h2 class="fw-bold">
            What can Circular Hub help you do?
          </h2>

          <p class="text-secondary">
            Simple tools and information to make low-waste choices easier.
          </p>
        </div>


        <div class="row g-4">

          <!-- Card 1 -->
          <div class="col-md-4">
            <div class="card h-100 border-0 shadow-sm rounded-4">
              <div class="card-body p-4">
                <div class="fs-1 mb-3">
                  ♻
                </div>

                <h3 class="h4 fw-bold">
                  Find Recycling
                </h3>

                <p class="text-secondary">
                  Search by item and postcode to find suitable
                  recycling and reuse options near you.
                </p>

                <RouterLink
                  to="/recycle"
                  class="text-success fw-semibold text-decoration-none"
                >
                  Search options →
                </RouterLink>
              </div>
            </div>
          </div>


          <!-- Card 2 -->
          <div class="col-md-4">
            <div class="card h-100 border-0 shadow-sm rounded-4">
              <div class="card-body p-4">
                <div class="fs-1 mb-3">
                  ↻
                </div>

                <h3 class="h4 fw-bold">
                  Reuse & Repair
                </h3>

                <p class="text-secondary">
                  Explore practical ways to extend the life of
                  everyday items before sending them to landfill.
                </p>

                <span class="text-secondary small">
                  More resources coming soon
                </span>
              </div>
            </div>
          </div>


          <!-- Card 3 -->
          <div class="col-md-4">
            <div class="card h-100 border-0 shadow-sm rounded-4">
              <div class="card-body p-4">
                <div class="fs-1 mb-3">
                  🌱
                </div>

                <h3 class="h4 fw-bold">
                  Community Action
                </h3>

                <p class="text-secondary">
                  Discover local sustainability initiatives,
                  community events and opportunities to take action.
                </p>

                <span class="text-secondary small">
                  Community resources coming soon
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>


    <!-- ================= POPULAR MATERIALS ================= -->
    <section class="py-5 bg-light">
      <div class="container">

        <div class="row align-items-center g-4">

          <div class="col-lg-5">
            <p class="text-success fw-bold text-uppercase mb-2">
              Quick Search
            </p>

            <h2 class="fw-bold">
              Popular materials
            </h2>

            <p class="text-secondary mb-0">
              Not sure where something belongs?
              Start with one of these common categories.
            </p>
          </div>


          <div class="col-lg-7">
            <div class="d-flex flex-wrap gap-3">

              <button
                type="button"
                class="btn btn-outline-success px-4"
              >
                Batteries
              </button>

              <button
                type="button"
                class="btn btn-outline-success px-4"
              >
                E-Waste
              </button>

              <button
                type="button"
                class="btn btn-outline-success px-4"
              >
                Clothing
              </button>

              <button
                type="button"
                class="btn btn-outline-success px-4"
              >
                Furniture
              </button>

              <button
                type="button"
                class="btn btn-outline-success px-4"
              >
                Plastics
              </button>

            </div>
          </div>

        </div>
      </div>
    </section>


    <!-- ================= FINAL CTA ================= -->
    <section class="py-5">
      <div class="container">
        <div
          class="bg-success-subtle rounded-4 p-5 text-center"
        >
          <p class="text-success fw-bold text-uppercase mb-2">
            Recycling Finder
          </p>

          <h2 class="fw-bold">
            Not sure where it goes?
          </h2>

          <p class="text-secondary mx-auto mb-4">
            Use our Recycling Finder to get clear and practical
            guidance for disposing of your item responsibly.
          </p>

          <RouterLink
            to="/recycle"
            class="btn btn-success btn-lg"
          >
            Find Recycling Options
          </RouterLink>

        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
}

.btn {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

section {
  scroll-margin-top: 80px;
}
</style>