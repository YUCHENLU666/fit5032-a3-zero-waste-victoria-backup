<script setup>
import {
  computed,
  ref,
} from 'vue'

import {
  calculateRecyclingImpact,
} from '../services/impactService'


// ======================================================
// Form state
// ======================================================

const material =
  ref('Plastics')

const weight =
  ref('10')

const isLoading =
  ref(false)

const errorMessage =
  ref('')

const result =
  ref(null)


// ======================================================
// Supported materials
// ======================================================
//
// These values intentionally match the material names
// supported by the Cloud Function.
// ======================================================

const materials = [
  'Batteries',
  'E-Waste',
  'Plastics',
  'Clothing',
  'Furniture',
]


// ======================================================
// Form validation
// ======================================================

const numericWeight =
  computed(
    () =>
      Number(
        weight.value,
      ),
  )


const isFormValid =
  computed(
    () =>
      material.value &&
      Number.isFinite(
        numericWeight.value,
      ) &&
      numericWeight.value >
        0 &&
      numericWeight.value <=
        10000,
  )


// ======================================================
// Impact level description
// ======================================================

const impactLevelDescription =
  computed(
    () => {
      if (
        !result.value
      ) {
        return ''
      }


      switch (
        result.value.impactLevel
      ) {
        case 'High':
          return (
            'A strong estimated recycling impact.'
          )

        case 'Moderate':
          return (
            'A meaningful estimated recycling impact.'
          )

        default:
          return (
            'Every recycling action contributes to waste reduction.'
          )
      }
    },
  )


// ======================================================
// Submit calculation
// ======================================================

const handleCalculate =
  async () => {
    errorMessage.value =
      ''

    result.value =
      null


    if (
      !isFormValid.value
    ) {
      errorMessage.value =
        'Please enter a weight between 0 and 10,000 kilograms.'

      return
    }


    isLoading.value =
      true


    try {
      const response =
        await calculateRecyclingImpact({
          material:
            material.value,

          weight:
            numericWeight.value,
        })


      if (
        !response.success
      ) {
        errorMessage.value =
          response.message

        return
      }


      result.value =
        response.data
    } catch (error) {
      console.error(
        'Impact calculation failed:',
        error,
      )


      errorMessage.value =
        'Unable to calculate the recycling impact. Please try again.'
    } finally {
      isLoading.value =
        false
    }
  }


// ======================================================
// Reset calculator
// ======================================================

const resetCalculator =
  () => {
    material.value =
      'Plastics'

    weight.value =
      '10'

    errorMessage.value =
      ''

    result.value =
      null
  }
</script>


<template>
  <main
    class="
      impact-page
      py-5
    "
  >
    <div
      class="
        container
      "
    >

      <!-- ================================================= -->
      <!-- Page header -->
      <!-- ================================================= -->

      <section
        class="
          impact-hero
          mb-4
        "
        aria-labelledby="impact-title"
      >
        <p
          class="
            impact-kicker
            mb-2
          "
        >
          SMART RECYCLING TOOL
        </p>


        <h1
          id="impact-title"
          class="
            display-5
            fw-bold
            mb-3
          "
        >
          Recycling Impact Calculator
        </h1>


        <p
          class="
            lead
            text-secondary
            mb-0
          "
        >
          Estimate how much waste can
          be diverted from landfill and
          the potential CO₂e saving from
          recycling different materials.
        </p>
      </section>


      <div
        class="
          row
          g-4
          align-items-start
        "
      >

        <!-- ================================================= -->
        <!-- Calculator -->
        <!-- ================================================= -->

        <div
          class="
            col-12
            col-lg-5
          "
        >
          <section
            class="
              card
              border-0
              shadow-sm
              impact-card
            "
            aria-labelledby="calculator-heading"
          >
            <div
              class="
                card-body
                p-4
              "
            >
              <h2
                id="calculator-heading"
                class="
                  h3
                  fw-bold
                  mb-4
                "
              >
                Calculate Your Impact
              </h2>


              <form
                @submit.prevent="
                  handleCalculate
                "
              >

                <!-- ======================================= -->
                <!-- Material -->
                <!-- ======================================= -->

                <div
                  class="
                    mb-4
                  "
                >
                  <label
                    for="impact-material"
                    class="
                      form-label
                      fw-semibold
                    "
                  >
                    Recycling Material
                  </label>


                  <select
                    id="impact-material"
                    v-model="
                      material
                    "
                    class="
                      form-select
                    "
                    :disabled="
                      isLoading
                    "
                  >
                    <option
                      v-for="
                        item
                        in
                        materials
                      "
                      :key="
                        item
                      "
                      :value="
                        item
                      "
                    >
                      {{ item }}
                    </option>
                  </select>


                  <div
                    class="
                      form-text
                    "
                  >
                    Choose the material
                    you plan to recycle.
                  </div>
                </div>


                <!-- ======================================= -->
                <!-- Weight -->
                <!-- ======================================= -->

                <div
                  class="
                    mb-4
                  "
                >
                  <label
                    for="impact-weight"
                    class="
                      form-label
                      fw-semibold
                    "
                  >
                    Weight
                  </label>


                  <div
                    class="
                      input-group
                    "
                  >
                    <input
                      id="impact-weight"
                      v-model="
                        weight
                      "
                      type="number"
                      class="
                        form-control
                      "
                      min="0.01"
                      max="10000"
                      step="0.01"
                      inputmode="decimal"
                      :disabled="
                        isLoading
                      "
                      aria-describedby="impact-weight-help"
                      required
                    />


                    <span
                      class="
                        input-group-text
                      "
                    >
                      kg
                    </span>
                  </div>


                  <div
                    id="impact-weight-help"
                    class="
                      form-text
                    "
                  >
                    Enter a value greater
                    than 0 and no more
                    than 10,000 kg.
                  </div>
                </div>


                <!-- ======================================= -->
                <!-- Error -->
                <!-- ======================================= -->

                <div
                  v-if="
                    errorMessage
                  "
                  class="
                    alert
                    alert-danger
                  "
                  role="alert"
                  aria-live="assertive"
                >
                  {{
                    errorMessage
                  }}
                </div>


                <!-- ======================================= -->
                <!-- Actions -->
                <!-- ======================================= -->

                <div
                  class="
                    d-grid
                    gap-2
                  "
                >
                  <button
                    type="submit"
                    class="
                      btn
                      btn-success
                      btn-lg
                    "
                    :disabled="
                      isLoading ||
                      !isFormValid
                    "
                  >
                    <span
                      v-if="
                        isLoading
                      "
                    >
                      <span
                        class="
                          spinner-border
                          spinner-border-sm
                          me-2
                        "
                        aria-hidden="true"
                      ></span>

                      Calculating...
                    </span>


                    <span
                      v-else
                    >
                      Calculate Impact
                    </span>
                  </button>


                  <button
                    type="button"
                    class="
                      btn
                      btn-outline-secondary
                    "
                    :disabled="
                      isLoading
                    "
                    @click="
                      resetCalculator
                    "
                  >
                    Reset
                  </button>
                </div>

              </form>
            </div>
          </section>
        </div>


        <!-- ================================================= -->
        <!-- Result -->
        <!-- ================================================= -->

        <div
          class="
            col-12
            col-lg-7
          "
        >

          <!-- =============================================== -->
          <!-- Empty state -->
          <!-- =============================================== -->

          <section
            v-if="
              !result
            "
            class="
              impact-empty
              p-4
              p-md-5
              rounded-4
            "
            aria-labelledby="result-heading"
          >
            <div
              class="
                impact-empty-icon
                mb-3
              "
              aria-hidden="true"
            >
              ♻
            </div>


            <h2
              id="result-heading"
              class="
                h3
                fw-bold
              "
            >
              Your estimated impact
              will appear here
            </h2>


            <p
              class="
                text-secondary
                mb-0
              "
            >
              Select a material,
              enter its weight and use
              the calculator to request
              an estimate from the
              Firebase Cloud Function.
            </p>
          </section>


          <!-- =============================================== -->
          <!-- Result state -->
          <!-- =============================================== -->

          <section
            v-else
            class="
              result-wrapper
            "
            aria-labelledby="result-heading"
            aria-live="polite"
          >
            <div
              class="
                d-flex
                flex-column
                flex-md-row
                justify-content-between
                align-items-md-center
                gap-2
                mb-4
              "
            >
              <div>
                <p
                  class="
                    impact-kicker
                    mb-1
                  "
                >
                  CLOUD FUNCTION RESULT
                </p>


                <h2
                  id="result-heading"
                  class="
                    h2
                    fw-bold
                    mb-0
                  "
                >
                  Estimated Recycling Impact
                </h2>
              </div>


              <span
                class="
                  badge
                  rounded-pill
                  text-bg-success
                  impact-badge
                "
              >
                {{
                  result.material
                }}
              </span>
            </div>


            <!-- ============================================= -->
            <!-- Metrics -->
            <!-- ============================================= -->

            <div
              class="
                row
                g-3
                mb-4
              "
            >

              <!-- Weight -->

              <div
                class="
                  col-12
                  col-md-4
                "
              >
                <article
                  class="
                    result-card
                    h-100
                  "
                >
                  <p
                    class="
                      result-label
                    "
                  >
                    Material Weight
                  </p>


                  <p
                    class="
                      result-number
                    "
                  >
                    {{
                      result.weightKg
                    }}
                  </p>


                  <p
                    class="
                      result-unit
                    "
                  >
                    kg
                  </p>
                </article>
              </div>


              <!-- Landfill -->

              <div
                class="
                  col-12
                  col-md-4
                "
              >
                <article
                  class="
                    result-card
                    h-100
                  "
                >
                  <p
                    class="
                      result-label
                    "
                  >
                    Landfill Diverted
                  </p>


                  <p
                    class="
                      result-number
                    "
                  >
                    {{
                      result
                        .landfillDivertedKg
                    }}
                  </p>


                  <p
                    class="
                      result-unit
                    "
                  >
                    kg
                  </p>
                </article>
              </div>


              <!-- CO2 -->

              <div
                class="
                  col-12
                  col-md-4
                "
              >
                <article
                  class="
                    result-card
                    h-100
                  "
                >
                  <p
                    class="
                      result-label
                    "
                  >
                    Estimated CO₂e Saving
                  </p>


                  <p
                    class="
                      result-number
                    "
                  >
                    {{
                      result
                        .estimatedCo2eSavedKg
                    }}
                  </p>


                  <p
                    class="
                      result-unit
                    "
                  >
                    kg CO₂e
                  </p>
                </article>
              </div>

            </div>


            <!-- ============================================= -->
            <!-- Impact level -->
            <!-- ============================================= -->

            <article
              class="
                impact-level-card
                mb-3
              "
            >
              <div>
                <p
                  class="
                    result-label
                    mb-1
                  "
                >
                  Impact Level
                </p>


                <h3
                  class="
                    h3
                    fw-bold
                    mb-1
                  "
                >
                  {{
                    result
                      .impactLevel
                  }}
                </h3>


                <p
                  class="
                    mb-0
                    text-secondary
                  "
                >
                  {{
                    impactLevelDescription
                  }}
                </p>
              </div>


              <div
                class="
                  impact-level-icon
                "
                aria-hidden="true"
              >
                🌱
              </div>
            </article>


            <!-- ============================================= -->
            <!-- Recycling tip -->
            <!-- ============================================= -->

            <article
              class="
                tip-card
                mb-3
              "
            >
              <h3
                class="
                  h4
                  fw-bold
                  mb-2
                "
              >
                Recycling Tip
              </h3>


              <p
                class="
                  mb-0
                "
              >
                {{
                  result.tip
                }}
              </p>
            </article>


            <!-- ============================================= -->
            <!-- Disclaimer -->
            <!-- ============================================= -->

            <div
              class="
                alert
                alert-light
                border
                mb-0
              "
              role="note"
            >
              <strong>
                Educational estimate:
              </strong>

              {{
                result.disclaimer
              }}
            </div>
          </section>

        </div>
      </div>


      <!-- ================================================= -->
      <!-- Cloud Function explanation -->
      <!-- ================================================= -->

      <section
        class="
          cloud-function-info
          mt-5
        "
        aria-labelledby="cloud-function-heading"
      >
        <h2
          id="cloud-function-heading"
          class="
            h3
            fw-bold
            mb-3
          "
        >
          How this works
        </h2>


        <div
          class="
            row
            g-3
          "
        >
          <div
            class="
              col-12
              col-md-4
            "
          >
            <article
              class="
                process-card
                h-100
              "
            >
              <span
                class="
                  process-number
                "
                aria-hidden="true"
              >
                1
              </span>

              <h3
                class="
                  h5
                  fw-bold
                "
              >
                Enter Recycling Data
              </h3>

              <p
                class="
                  mb-0
                  text-secondary
                "
              >
                The user selects a
                material and enters its
                weight.
              </p>
            </article>
          </div>


          <div
            class="
              col-12
              col-md-4
            "
          >
            <article
              class="
                process-card
                h-100
              "
            >
              <span
                class="
                  process-number
                "
                aria-hidden="true"
              >
                2
              </span>

              <h3
                class="
                  h5
                  fw-bold
                "
              >
                Server-side Calculation
              </h3>

              <p
                class="
                  mb-0
                  text-secondary
                "
              >
                Firebase validates the
                request and applies the
                recycling impact logic
                in a Cloud Function.
              </p>
            </article>
          </div>


          <div
            class="
              col-12
              col-md-4
            "
          >
            <article
              class="
                process-card
                h-100
              "
            >
              <span
                class="
                  process-number
                "
                aria-hidden="true"
              >
                3
              </span>

              <h3
                class="
                  h5
                  fw-bold
                "
              >
                Display the Result
              </h3>

              <p
                class="
                  mb-0
                  text-secondary
                "
              >
                The structured result is
                returned to Vue and shown
                as accessible impact
                metrics.
              </p>
            </article>
          </div>
        </div>
      </section>

    </div>
  </main>
</template>


<style scoped>

/* ===================================================== */
/* Page */
/* ===================================================== */

.impact-page {
  min-height:
    70vh;

  background:
    linear-gradient(
      180deg,
      #f4fbf6 0%,
      #ffffff 32%
    );
}


/* ===================================================== */
/* Hero */
/* ===================================================== */

.impact-hero {
  max-width:
    900px;
}


.impact-kicker {
  color:
    #146c43;

  font-size:
    0.78rem;

  font-weight:
    800;

  letter-spacing:
    0.1em;
}


/* ===================================================== */
/* Calculator */
/* ===================================================== */

.impact-card {
  border-radius:
    18px;

  background:
    #ffffff;
}


/* ===================================================== */
/* Empty result */
/* ===================================================== */

.impact-empty {
  min-height:
    420px;

  display:
    flex;

  flex-direction:
    column;

  align-items:
    flex-start;

  justify-content:
    center;

  background:
    #f8f9fa;

  border:
    2px dashed
    #adb5bd;
}


.impact-empty-icon {
  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  width:
    72px;

  height:
    72px;

  border-radius:
    50%;

  color:
    #ffffff;

  background:
    #146c43;

  font-size:
    2rem;
}


/* ===================================================== */
/* Results */
/* ===================================================== */

.result-wrapper {
  padding:
    1rem
    0;
}


.impact-badge {
  padding:
    0.65rem
    0.9rem;

  font-size:
    0.78rem;
}


.result-card {
  padding:
    1rem;

  background:
    #ffffff;

  border:
    1px solid
    #dfe5e0;

  border-radius:
    16px;

  box-shadow:
    0 0.15rem
    0.5rem
    rgba(
      0,
      0,
      0,
      0.05
    );
}


.result-label {
  margin-bottom:
    0.35rem;

  color:
    #495057;

  font-size:
    0.76rem;

  font-weight:
    700;
}


.result-number {
  margin:
    0;

  color:
    #0b5d1e;

  font-size:
    2rem;

  font-weight:
    800;

  line-height:
    1.05;
}


.result-unit {
  margin:
    0.3rem
    0
    0;

  color:
    #495057;

  font-size:
    0.72rem;
}


/* ===================================================== */
/* Impact level */
/* ===================================================== */

.impact-level-card {
  display:
    flex;

  align-items:
    center;

  justify-content:
    space-between;

  gap:
    1rem;

  padding:
    1rem
    1.1rem;

  background:
    #eaf7ee;

  border:
    1px solid
    #9bc9a9;

  border-radius:
    16px;
}


.impact-level-icon {
  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  width:
    64px;

  height:
    64px;

  flex:
    0 0 auto;

  background:
    #ffffff;

  border-radius:
    50%;

  font-size:
    1.7rem;
}


/* ===================================================== */
/* Tip */
/* ===================================================== */

.tip-card {
  padding:
    1rem
    1.1rem;

  background:
    #fffdf3;

  border:
    1px solid
    #dfd6a2;

  border-radius:
    16px;
}


/* ===================================================== */
/* How it works */
/* ===================================================== */

.cloud-function-info {
  padding-top:
    1rem;

  border-top:
    1px solid
    #dee2e6;
}


.process-card {
  position:
    relative;

  padding:
    1rem;

  background:
    #ffffff;

  border:
    1px solid
    #dee2e6;

  border-radius:
    16px;
}


.process-number {
  display:
    inline-flex;

  align-items:
    center;

  justify-content:
    center;

  width:
    38px;

  height:
    38px;

  margin-bottom:
    0.8rem;

  color:
    #ffffff;

  background:
    #146c43;

  border-radius:
    50%;

  font-weight:
    800;
}


/* ===================================================== */
/* Responsive */
/* ===================================================== */

@media (
  max-width: 767px
) {
  .impact-empty {
    min-height:
      300px;
  }


  .result-number {
    font-size:
      1.7rem;
  }
}

</style>