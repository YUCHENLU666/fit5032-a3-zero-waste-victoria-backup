<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  watch,
} from 'vue'

import Chart from 'chart.js/auto'

import {
  calculateRecyclingImpact,
} from '../services/impactService'

import {
  analyseImpactPlan,
  analyseImpactScenario,
  getSavedImpactGoal,
  getSavedImpactPlan,
  saveImpactGoal,
  saveImpactPlan,
} from '../services/impactPlannerService'


// ======================================================
// Supported materials
// ======================================================

const materials = [
  'Batteries',
  'E-Waste',
  'Plastics',
  'Clothing',
  'Furniture',
]


// ======================================================
// Single impact calculator state
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
// Single calculator validation
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
// Single calculation
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
          response.message ||
          'Unable to calculate the recycling impact.'

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
// Reset single calculator
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


// ======================================================
// Load Smart Impact Planner
// ======================================================

const loadedPlannerItems =
  getSavedImpactPlan()


let nextPlannerItemId =
  loadedPlannerItems.reduce(
    (
      highestId,
      item,
    ) => {
      const numericId =
        Number(
          item.id,
        )


      if (
        Number.isFinite(
          numericId,
        )
      ) {
        return Math.max(
          highestId,
          numericId,
        )
      }


      return highestId
    },

    0,
  ) +
  1


const plannerItems =
  ref(
    loadedPlannerItems.map(
      (
        item,
        index,
      ) => ({
        id:
          item.id ||
          index + 1,

        material:
          item.material,

        weight:
          String(
            item.weight,
          ),
      }),
    ),
  )


// ======================================================
// Planner state
// ======================================================

const plannerSummary =
  ref(null)

const plannerError =
  ref('')

const plannerMessage =
  ref('')

const isPlannerLoading =
  ref(false)


// ======================================================
// Planner validation
// ======================================================

const isPlannerValid =
  computed(
    () => {
      if (
        plannerItems.value.length ===
        0
      ) {
        return false
      }


      return plannerItems.value.every(
        (item) => {
          const numericValue =
            Number(
              item.weight,
            )


          return (
            item.material &&
            Number.isFinite(
              numericValue,
            ) &&
            numericValue >
              0 &&
            numericValue <=
              10000
          )
        },
      )
    },
  )


// ======================================================
// Prevent duplicate materials
// ======================================================

function materialOptionsFor(
  currentItem,
) {
  const usedMaterials =
    plannerItems.value
      .filter(
        (item) =>
          item.id !==
          currentItem.id,
      )
      .map(
        (item) =>
          item.material,
      )


  return materials.filter(
    (item) =>
      item ===
        currentItem.material ||
      !usedMaterials.includes(
        item,
      ),
  )
}


const canAddPlannerItem =
  computed(
    () => {
      const usedMaterials =
        new Set(
          plannerItems.value.map(
            (item) =>
              item.material,
          ),
        )


      return (
        plannerItems.value.length <
          materials.length &&
        materials.some(
          (item) =>
            !usedMaterials.has(
              item,
            ),
        )
      )
    },
  )


// ======================================================
// Add planner material
// ======================================================

function addPlannerItem() {
  const usedMaterials =
    new Set(
      plannerItems.value.map(
        (item) =>
          item.material,
      ),
    )


  const availableMaterial =
    materials.find(
      (item) =>
        !usedMaterials.has(
          item,
        ),
    )


  if (
    !availableMaterial
  ) {
    return
  }


  plannerItems.value.push({
    id:
      nextPlannerItemId++,

    material:
      availableMaterial,

    weight:
      '5',
  })
}


// ======================================================
// Remove planner material
// ======================================================

function removePlannerItem(
  itemId,
) {
  if (
    plannerItems.value.length <=
    1
  ) {
    return
  }


  plannerItems.value =
    plannerItems.value.filter(
      (item) =>
        item.id !==
        itemId,
    )
}


// ======================================================
// Impact chart
// ======================================================

const impactChartCanvas =
  ref(null)

let impactChart =
  null


const chartMetric =
  ref('co2')


const chartMetricOptions = [
  {
    value:
      'co2',

    label:
      'CO₂e Saved',

    field:
      'estimatedCo2eSavedKg',

    unit:
      'kg CO₂e',
  },

  {
    value:
      'landfill',

    label:
      'Landfill Diverted',

    field:
      'landfillDivertedKg',

    unit:
      'kg',
  },

  {
    value:
      'weight',

    label:
      'Material Weight',

    field:
      'weightKg',

    unit:
      'kg',
  },
]


const selectedChartMetric =
  computed(
    () => {
      return (
        chartMetricOptions.find(
          (option) =>
            option.value ===
            chartMetric.value,
        ) ||
        chartMetricOptions[0]
      )
    },
  )


// ======================================================
// Destroy existing chart
// ======================================================

function destroyImpactChart() {
  if (
    impactChart
  ) {
    impactChart.destroy()

    impactChart =
      null
  }
}


// ======================================================
// Render interactive Chart.js chart
// ======================================================

function renderImpactChart() {
  destroyImpactChart()


  if (
    !plannerSummary.value ||
    !impactChartCanvas.value
  ) {
    return
  }


  const metric =
    selectedChartMetric.value


  const labels =
    plannerSummary.value
      .items
      .map(
        (item) =>
          item.material,
      )


  const values =
    plannerSummary.value
      .items
      .map(
        (item) =>
          Number(
            item[
              metric.field
            ] ||
            0,
          ),
      )


  impactChart =
    new Chart(
      impactChartCanvas.value,
      {
        type:
          'bar',

        data: {
          labels,

          datasets: [
            {
              label:
                metric.label,

              data:
                values,

              backgroundColor:
                'rgba(25, 135, 84, 0.72)',

              borderColor:
                '#146c43',

              borderWidth:
                1,

              borderRadius:
                8,
            },
          ],
        },

        options: {
          indexAxis:
            'y',

          responsive:
            true,

          maintainAspectRatio:
            false,

          interaction: {
            intersect:
              false,

            mode:
              'nearest',
          },

          plugins: {
            legend: {
              display:
                false,
            },

            tooltip: {
              callbacks: {
                label:
                  (context) =>
                    `${metric.label}: ${context.raw} ${metric.unit}`,
              },
            },
          },

          scales: {
            x: {
              beginAtZero:
                true,

              title: {
                display:
                  true,

                text:
                  metric.unit,
              },
            },

            y: {
              grid: {
                display:
                  false,
              },
            },
          },
        },
      },
    )
}


// ======================================================
// Monthly sustainability goal
// ======================================================

const savedGoal =
  ref(
    getSavedImpactGoal(),
  )


const goalInput =
  ref(
    String(
      savedGoal.value,
    ),
  )


const goalMessage =
  ref('')

const goalError =
  ref('')


const isGoalValid =
  computed(
    () => {
      const value =
        Number(
          goalInput.value,
        )


      return (
        Number.isFinite(
          value,
        ) &&
        value >
          0 &&
        value <=
          100000
      )
    },
  )


// ======================================================
// Goal progress
// ======================================================

const goalProgressPercent =
  computed(
    () => {
      if (
        !plannerSummary.value ||
        !savedGoal.value
      ) {
        return 0
      }


      return Math.round(
        (
          plannerSummary.value
            .totalCo2eSavedKg /
          savedGoal.value
        ) *
        100,
      )
    },
  )


const goalBarPercent =
  computed(
    () =>
      Math.min(
        100,
        Math.max(
          0,
          goalProgressPercent.value,
        ),
      ),
  )


const goalRemaining =
  computed(
    () => {
      if (
        !plannerSummary.value
      ) {
        return savedGoal.value
      }


      return Math.max(
        0,

        Number(
          (
            savedGoal.value -
            plannerSummary.value
              .totalCo2eSavedKg
          ).toFixed(
            2,
          ),
        ),
      )
    },
  )


const hasReachedGoal =
  computed(
    () =>
      Boolean(
        plannerSummary.value &&
        plannerSummary.value
          .totalCo2eSavedKg >=
          savedGoal.value,
      ),
  )


// ======================================================
// Save goal
// ======================================================

function handleSaveGoal() {
  goalMessage.value =
    ''

  goalError.value =
    ''


  if (
    !isGoalValid.value
  ) {
    goalError.value =
      'Enter a monthly goal greater than 0.'

    return
  }


  const response =
    saveImpactGoal(
      goalInput.value,
    )


  if (
    !response.success
  ) {
    goalError.value =
      response.message ||
      'Unable to save the goal.'

    return
  }


  savedGoal.value =
    response.value


  goalMessage.value =
    'Monthly sustainability goal saved.'
}


// ======================================================
// What-if scenario
// ======================================================

const scenarioOptions = [
  {
    percent:
      10,

    multiplier:
      1.1,
  },

  {
    percent:
      25,

    multiplier:
      1.25,
  },

  {
    percent:
      50,

    multiplier:
      1.5,
  },
]


const activeScenarioPercent =
  ref(null)

const scenarioResult =
  ref(null)

const scenarioError =
  ref('')

const isScenarioLoading =
  ref(false)


// ======================================================
// Scenario additional saving
// ======================================================

const scenarioAdditionalCo2e =
  computed(
    () => {
      if (
        !plannerSummary.value ||
        !scenarioResult.value
      ) {
        return 0
      }


      return Number(
        (
          scenarioResult.value
            .totalCo2eSavedKg -
          plannerSummary.value
            .totalCo2eSavedKg
        ).toFixed(
          2,
        ),
      )
    },
  )


// ======================================================
// Analyse monthly planner
// ======================================================

async function handleAnalysePlanner() {
  plannerError.value =
    ''

  plannerMessage.value =
    ''

  scenarioError.value =
    ''

  scenarioResult.value =
    null

  activeScenarioPercent.value =
    null


  if (
    !isPlannerValid.value
  ) {
    plannerError.value =
      'Each material must have a valid weight between 0 and 10,000 kg.'

    return
  }


  isPlannerLoading.value =
    true


  try {
    const response =
      await analyseImpactPlan(
        plannerItems.value,
      )


    if (
      !response.success
    ) {
      plannerError.value =
        response.message ||
        'Unable to analyse your monthly recycling plan.'

      return
    }


    plannerSummary.value =
      response.data


    plannerMessage.value =
      'Monthly recycling plan analysed successfully using Firebase Cloud Functions.'


    await nextTick()


    renderImpactChart()
  } catch (error) {
    console.error(
      'Impact planner failed:',
      error,
    )


    plannerError.value =
      'Unable to analyse your monthly recycling plan.'
  } finally {
    isPlannerLoading.value =
      false
  }
}


// ======================================================
// Run what-if scenario
// ======================================================

async function handleScenario(
  scenario,
) {
  if (
    !plannerSummary.value
  ) {
    return
  }


  scenarioError.value =
    ''

  scenarioResult.value =
    null

  activeScenarioPercent.value =
    scenario.percent

  isScenarioLoading.value =
    true


  try {
    const response =
      await analyseImpactScenario(
        plannerItems.value,
        scenario.multiplier,
      )


    if (
      !response.success
    ) {
      scenarioError.value =
        response.message ||
        'Unable to calculate the scenario.'

      return
    }


    scenarioResult.value =
      response.data
  } catch (error) {
    console.error(
      'What-if scenario failed:',
      error,
    )


    scenarioError.value =
      'Unable to calculate the what-if scenario.'
  } finally {
    isScenarioLoading.value =
      false
  }
}


// ======================================================
// Planner changes
// ======================================================
//
// Save the plan automatically.
//
// If the user changes the plan after analysis,
// old results are cleared so stale figures are
// never presented as current.
// ======================================================

watch(
  plannerItems,

  () => {
    saveImpactPlan(
      plannerItems.value,
    )


    if (
      plannerSummary.value
    ) {
      plannerSummary.value =
        null

      plannerMessage.value =
        ''

      scenarioResult.value =
        null

      activeScenarioPercent.value =
        null

      destroyImpactChart()
    }
  },

  {
    deep:
      true,
  },
)


// ======================================================
// Chart metric changes
// ======================================================

watch(
  chartMetric,

  async () => {
    if (
      plannerSummary.value
    ) {
      await nextTick()

      renderImpactChart()
    }
  },
)


// ======================================================
// Cleanup
// ======================================================

onBeforeUnmount(
  () => {
    destroyImpactChart()
  },
)
</script>


<template>
  <main
    class="
      impact-page
      py-5
    "
    aria-labelledby="impact-title"
  >
    <div
      class="container"
    >

      <!-- ================================================= -->
      <!-- Page header -->
      <!-- ================================================= -->

      <section
        class="
          impact-hero
          mb-5
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
          Recycling Impact
          Calculator & Planner
        </h1>


        <p
          class="
            lead
            text-secondary
            mb-0
          "
        >
          Calculate an individual
          recycling impact or build a
          multi-material monthly plan,
          visualise its contribution,
          track a sustainability goal
          and explore what-if scenarios.
        </p>
      </section>


      <!-- ================================================= -->
      <!-- QUICK CALCULATOR -->
      <!-- ================================================= -->

      <section
        aria-labelledby="quick-calculator-title"
      >

        <div
          class="
            section-heading
            mb-4
          "
        >
          <p
            class="
              impact-kicker
              mb-1
            "
          >
            QUICK ESTIMATE
          </p>


          <h2
            id="quick-calculator-title"
            class="
              h2
              fw-bold
              mb-2
            "
          >
            Single Material Calculator
          </h2>


          <p
            class="
              text-secondary
              mb-0
            "
          >
            Start with one material
            and request an educational
            estimate from Firebase.
          </p>
        </div>


        <div
          class="
            row
            g-4
            align-items-start
          "
        >

          <!-- =============================================== -->
          <!-- Calculator -->
          <!-- =============================================== -->

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

                <h3
                  id="calculator-heading"
                  class="
                    h3
                    fw-bold
                    mb-4
                  "
                >
                  Calculate Your Impact
                </h3>


                <form
                  @submit.prevent="
                    handleCalculate
                  "
                >

                  <div
                    class="mb-4"
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
                        {{
                          item
                        }}
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


                  <div
                    class="mb-4"
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


                  <div
                    v-if="
                      errorMessage
                    "
                    class="
                      alert
                      alert-danger
                    "
                    role="alert"
                  >
                    {{
                      errorMessage
                    }}
                  </div>


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
                      <template
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
                      </template>


                      <template
                        v-else
                      >
                        Calculate Impact
                      </template>
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


          <!-- =============================================== -->
          <!-- Single result -->
          <!-- =============================================== -->

          <div
            class="
              col-12
              col-lg-7
            "
          >

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


              <h3
                id="result-heading"
                class="
                  h3
                  fw-bold
                "
              >
                Your estimated impact
                will appear here
              </h3>


              <p
                class="
                  text-secondary
                  mb-0
                "
              >
                Select a material,
                enter its weight and
                request a server-side
                impact estimate.
              </p>
            </section>


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


                  <h3
                    id="result-heading"
                    class="
                      h2
                      fw-bold
                      mb-0
                    "
                  >
                    Estimated Recycling
                    Impact
                  </h3>
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


              <div
                class="
                  row
                  g-3
                  mb-4
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
                      Estimated CO₂e
                      Saving
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


                  <h4
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
                  </h4>


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


              <article
                class="
                  tip-card
                  mb-3
                "
              >
                <h4
                  class="
                    h4
                    fw-bold
                    mb-2
                  "
                >
                  Recycling Tip
                </h4>


                <p
                  class="mb-0"
                >
                  {{
                    result.tip
                  }}
                </p>
              </article>


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
      </section>


      <!-- ================================================= -->
      <!-- SMART IMPACT PLANNER -->
      <!-- ================================================= -->

      <section
        class="
          planner-section
          mt-5
          pt-5
        "
        aria-labelledby="planner-title"
      >

        <div
          class="
            planner-heading
            mb-4
          "
        >
          <p
            class="
              impact-kicker
              mb-1
            "
          >
            EXTENDED INNOVATIVE FEATURE
          </p>


          <h2
            id="planner-title"
            class="
              display-6
              fw-bold
              mb-2
            "
          >
            Smart Recycling
            Impact Planner
          </h2>


          <p
            class="
              lead
              text-secondary
              mb-0
            "
          >
            Combine multiple materials
            into one monthly recycling
            plan and analyse them
            concurrently using the
            existing Firebase Cloud
            Function.
          </p>
        </div>


        <div
          class="
            row
            g-4
            align-items-start
          "
        >

          <!-- =============================================== -->
          <!-- Plan builder -->
          <!-- =============================================== -->

          <div
            class="
              col-12
              col-xl-5
            "
          >
            <section
              class="
                planner-card
                p-4
              "
              aria-labelledby="plan-builder-title"
            >
              <div
                class="
                  d-flex
                  justify-content-between
                  align-items-start
                  gap-3
                  mb-4
                "
              >
                <div>
                  <h3
                    id="plan-builder-title"
                    class="
                      h3
                      fw-bold
                      mb-1
                    "
                  >
                    Build Your Monthly Plan
                  </h3>


                  <p
                    class="
                      text-secondary
                      mb-0
                    "
                  >
                    Your plan is saved
                    automatically in this
                    browser.
                  </p>
                </div>


                <span
                  class="
                    planner-count
                  "
                >
                  {{
                    plannerItems.length
                  }}
                  /
                  {{
                    materials.length
                  }}
                </span>
              </div>


              <div
                class="
                  d-grid
                  gap-3
                "
              >
                <article
                  v-for="
                    (
                      item,
                      index
                    )
                    in
                    plannerItems
                  "
                  :key="
                    item.id
                  "
                  class="
                    planner-item
                  "
                >
                  <div
                    class="
                      planner-item-number
                    "
                    aria-hidden="true"
                  >
                    {{
                      index + 1
                    }}
                  </div>


                  <div
                    class="
                      planner-item-fields
                    "
                  >
                    <div>
                      <label
                        :for="
                          `planner-material-${item.id}`
                        "
                        class="
                          form-label
                          fw-semibold
                        "
                      >
                        Material
                      </label>


                      <select
                        :id="
                          `planner-material-${item.id}`
                        "
                        v-model="
                          item.material
                        "
                        class="
                          form-select
                        "
                        :disabled="
                          isPlannerLoading
                        "
                      >
                        <option
                          v-for="
                            option
                            in
                            materialOptionsFor(
                              item,
                            )
                          "
                          :key="
                            option
                          "
                          :value="
                            option
                          "
                        >
                          {{
                            option
                          }}
                        </option>
                      </select>
                    </div>


                    <div>
                      <label
                        :for="
                          `planner-weight-${item.id}`
                        "
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
                          :id="
                            `planner-weight-${item.id}`
                          "
                          v-model="
                            item.weight
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
                            isPlannerLoading
                          "
                        />


                        <span
                          class="
                            input-group-text
                          "
                        >
                          kg
                        </span>
                      </div>
                    </div>
                  </div>


                  <button
                    type="button"
                    class="
                      btn
                      btn-outline-danger
                      planner-remove
                    "
                    :disabled="
                      plannerItems.length ===
                        1 ||
                      isPlannerLoading
                    "
                    :aria-label="
                      `Remove ${item.material} from the plan`
                    "
                    @click="
                      removePlannerItem(
                        item.id,
                      )
                    "
                  >
                    Remove
                  </button>
                </article>
              </div>


              <button
                type="button"
                class="
                  btn
                  btn-outline-success
                  w-100
                  mt-3
                "
                :disabled="
                  !canAddPlannerItem ||
                  isPlannerLoading
                "
                @click="
                  addPlannerItem
                "
              >
                + Add Material
              </button>


              <p
                v-if="
                  !canAddPlannerItem
                "
                class="
                  small
                  text-secondary
                  mt-2
                  mb-0
                "
              >
                All supported material
                categories have been
                added.
              </p>


              <div
                v-if="
                  plannerError
                "
                class="
                  alert
                  alert-danger
                  mt-3
                  mb-0
                "
                role="alert"
              >
                {{
                  plannerError
                }}
              </div>


              <div
                v-if="
                  plannerMessage
                "
                class="
                  alert
                  alert-success
                  mt-3
                  mb-0
                "
                role="status"
                aria-live="polite"
              >
                {{
                  plannerMessage
                }}
              </div>


              <button
                type="button"
                class="
                  btn
                  btn-success
                  btn-lg
                  w-100
                  mt-4
                "
                :disabled="
                  !isPlannerValid ||
                  isPlannerLoading
                "
                @click="
                  handleAnalysePlanner
                "
              >
                <template
                  v-if="
                    isPlannerLoading
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

                  Analysing Plan...
                </template>


                <template
                  v-else
                >
                  Analyse My Monthly Plan
                </template>
              </button>

            </section>
          </div>


          <!-- =============================================== -->
          <!-- Planner summary -->
          <!-- =============================================== -->

          <div
            class="
              col-12
              col-xl-7
            "
          >

            <section
              v-if="
                !plannerSummary
              "
              class="
                planner-empty
                p-4
                p-md-5
              "
              aria-labelledby="planner-empty-title"
            >
              <div
                class="
                  planner-empty-icon
                  mb-3
                "
                aria-hidden="true"
              >
                📊
              </div>


              <h3
                id="planner-empty-title"
                class="
                  h3
                  fw-bold
                "
              >
                Your monthly dashboard
                will appear here
              </h3>


              <p
                class="
                  text-secondary
                  mb-0
                "
              >
                Add recycling materials
                and analyse the plan to
                generate aggregated
                impact metrics, an
                interactive chart,
                sustainability goal
                progress and what-if
                modelling.
              </p>
            </section>


            <section
              v-else
              class="
                planner-dashboard
              "
              aria-labelledby="planner-summary-title"
              aria-live="polite"
            >
              <p
                class="
                  impact-kicker
                  mb-1
                "
              >
                MONTHLY IMPACT SUMMARY
              </p>


              <h3
                id="planner-summary-title"
                class="
                  h2
                  fw-bold
                  mb-4
                "
              >
                Your Recycling Plan
              </h3>


              <div
                class="
                  row
                  g-3
                  mb-4
                "
              >

                <div
                  class="
                    col-6
                    col-lg-3
                  "
                >
                  <article
                    class="
                      planner-stat
                      h-100
                    "
                  >
                    <span
                      class="
                        planner-stat-value
                      "
                    >
                      {{
                        plannerSummary
                          .totalWeightKg
                      }}
                    </span>


                    <span
                      class="
                        planner-stat-unit
                      "
                    >
                      kg
                    </span>


                    <span
                      class="
                        planner-stat-label
                      "
                    >
                      Total Recycled
                    </span>
                  </article>
                </div>


                <div
                  class="
                    col-6
                    col-lg-3
                  "
                >
                  <article
                    class="
                      planner-stat
                      h-100
                    "
                  >
                    <span
                      class="
                        planner-stat-value
                      "
                    >
                      {{
                        plannerSummary
                          .totalLandfillDivertedKg
                      }}
                    </span>


                    <span
                      class="
                        planner-stat-unit
                      "
                    >
                      kg
                    </span>


                    <span
                      class="
                        planner-stat-label
                      "
                    >
                      Landfill Diverted
                    </span>
                  </article>
                </div>


                <div
                  class="
                    col-6
                    col-lg-3
                  "
                >
                  <article
                    class="
                      planner-stat
                      planner-stat-highlight
                      h-100
                    "
                  >
                    <span
                      class="
                        planner-stat-value
                      "
                    >
                      {{
                        plannerSummary
                          .totalCo2eSavedKg
                      }}
                    </span>


                    <span
                      class="
                        planner-stat-unit
                      "
                    >
                      kg CO₂e
                    </span>


                    <span
                      class="
                        planner-stat-label
                      "
                    >
                      Estimated Saving
                    </span>
                  </article>
                </div>


                <div
                  class="
                    col-6
                    col-lg-3
                  "
                >
                  <article
                    class="
                      planner-stat
                      h-100
                    "
                  >
                    <span
                      class="
                        planner-stat-value
                      "
                    >
                      {{
                        plannerSummary
                          .materialCount
                      }}
                    </span>


                    <span
                      class="
                        planner-stat-unit
                      "
                    >
                      types
                    </span>


                    <span
                      class="
                        planner-stat-label
                      "
                    >
                      Materials
                    </span>
                  </article>
                </div>

              </div>


              <div
                v-if="
                  plannerSummary
                    .strongestMaterial
                "
                class="
                  strongest-material
                  mb-4
                "
              >
                <span
                  aria-hidden="true"
                >
                  🌟
                </span>


                <div>
                  <strong>
                    Strongest CO₂e
                    contribution:
                  </strong>

                  {{
                    plannerSummary
                      .strongestMaterial
                      .material
                  }}

                  —

                  {{
                    plannerSummary
                      .strongestMaterial
                      .estimatedCo2eSavedKg
                  }}

                  kg CO₂e
                </div>
              </div>

            </section>

          </div>
        </div>


        <!-- ================================================= -->
        <!-- Interactive chart -->
        <!-- ================================================= -->

        <section
          v-if="
            plannerSummary
          "
          class="
            chart-card
            mt-4
            p-4
          "
          aria-labelledby="impact-chart-title"
        >

          <div
            class="
              d-flex
              flex-column
              flex-lg-row
              justify-content-between
              align-items-lg-end
              gap-3
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
                INTERACTIVE CHART
              </p>


              <h3
                id="impact-chart-title"
                class="
                  h2
                  fw-bold
                  mb-1
                "
              >
                Impact Breakdown
              </h3>


              <p
                class="
                  text-secondary
                  mb-0
                "
              >
                Change the metric to
                compare the contribution
                of each material.
              </p>
            </div>


            <div
              class="
                chart-controls
              "
              role="group"
              aria-label="Select chart metric"
            >
              <button
                v-for="
                  option
                  in
                  chartMetricOptions
                "
                :key="
                  option.value
                "
                type="button"
                class="
                  btn
                  chart-metric-button
                "
                :class="
                  chartMetric ===
                    option.value
                    ? 'btn-success'
                    : 'btn-outline-success'
                "
                :aria-pressed="
                  chartMetric ===
                    option.value
                    ? 'true'
                    : 'false'
                "
                @click="
                  chartMetric =
                    option.value
                "
              >
                {{
                  option.label
                }}
              </button>
            </div>
          </div>


          <div
            class="
              chart-shell
            "
          >
            <canvas
              ref="impactChartCanvas"
              role="img"
              :aria-label="
                `${selectedChartMetric.label} breakdown by recycling material. Detailed values are provided in the table below.`
              "
              aria-describedby="impact-breakdown-table"
            >
              Impact breakdown chart.
              A detailed data table is
              available below.
            </canvas>
          </div>


          <!-- =============================================== -->
          <!-- Accessible chart data -->
          <!-- =============================================== -->

          <div
            class="
              table-responsive
              mt-4
            "
            tabindex="0"
            role="region"
            aria-label="Impact breakdown data table"
          >
            <table
              id="impact-breakdown-table"
              class="
                table
                table-hover
                align-middle
                mb-0
              "
            >
              <caption
                class="
                  visually-hidden
                "
              >
                Detailed recycling
                impact values used in
                the interactive chart.
              </caption>


              <thead
                class="
                  table-light
                "
              >
                <tr>
                  <th
                    scope="col"
                  >
                    Material
                  </th>

                  <th
                    scope="col"
                  >
                    Weight
                  </th>

                  <th
                    scope="col"
                  >
                    Landfill Diverted
                  </th>

                  <th
                    scope="col"
                  >
                    CO₂e Saving
                  </th>
                </tr>
              </thead>


              <tbody>
                <tr
                  v-for="
                    item
                    in
                    plannerSummary.items
                  "
                  :key="
                    item.id
                  "
                >
                  <th
                    scope="row"
                  >
                    {{
                      item.material
                    }}
                  </th>

                  <td>
                    {{
                      item.weightKg
                    }}
                    kg
                  </td>

                  <td>
                    {{
                      item
                        .landfillDivertedKg
                    }}
                    kg
                  </td>

                  <td>
                    {{
                      item
                        .estimatedCo2eSavedKg
                    }}
                    kg CO₂e
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </section>


        <!-- ================================================= -->
        <!-- Goal + Scenario -->
        <!-- ================================================= -->

        <div
          v-if="
            plannerSummary
          "
          class="
            row
            g-4
            mt-1
          "
        >

          <!-- =============================================== -->
          <!-- Monthly goal -->
          <!-- =============================================== -->

          <div
            class="
              col-12
              col-xl-6
            "
          >
            <section
              class="
                goal-card
                h-100
                p-4
              "
              aria-labelledby="goal-title"
            >
              <p
                class="
                  impact-kicker
                  mb-1
                "
              >
                PERSISTENT GOAL TRACKING
              </p>


              <h3
                id="goal-title"
                class="
                  h2
                  fw-bold
                  mb-2
                "
              >
                Monthly Sustainability
                Goal
              </h3>


              <p
                class="
                  text-secondary
                  mb-4
                "
              >
                Set a monthly CO₂e
                saving target. Your goal
                is saved locally and
                remains available after
                refreshing the page.
              </p>


              <div
                class="
                  goal-input-row
                  mb-4
                "
              >
                <div
                  class="
                    flex-grow-1
                  "
                >
                  <label
                    for="monthly-impact-goal"
                    class="
                      form-label
                      fw-semibold
                    "
                  >
                    Monthly CO₂e goal
                  </label>


                  <div
                    class="
                      input-group
                    "
                  >
                    <input
                      id="monthly-impact-goal"
                      v-model="
                        goalInput
                      "
                      type="number"
                      class="
                        form-control
                      "
                      min="0.01"
                      max="100000"
                      step="0.1"
                    />


                    <span
                      class="
                        input-group-text
                      "
                    >
                      kg CO₂e
                    </span>
                  </div>
                </div>


                <button
                  type="button"
                  class="
                    btn
                    btn-outline-success
                    goal-save-button
                  "
                  :disabled="
                    !isGoalValid
                  "
                  @click="
                    handleSaveGoal
                  "
                >
                  Save Goal
                </button>
              </div>


              <div
                v-if="
                  goalError
                "
                class="
                  alert
                  alert-danger
                "
                role="alert"
              >
                {{
                  goalError
                }}
              </div>


              <div
                v-if="
                  goalMessage
                "
                class="
                  alert
                  alert-success
                "
                role="status"
              >
                {{
                  goalMessage
                }}
              </div>


              <div
                class="
                  goal-summary
                  mb-3
                "
              >
                <div>
                  <span
                    class="
                      goal-value
                    "
                  >
                    {{
                      plannerSummary
                        .totalCo2eSavedKg
                    }}
                  </span>

                  <span
                    class="
                      goal-total
                    "
                  >
                    /
                    {{
                      savedGoal
                    }}
                    kg CO₂e
                  </span>
                </div>


                <strong>
                  {{
                    goalProgressPercent
                  }}%
                </strong>
              </div>


              <div
                class="
                  goal-progress
                  mb-3
                "
                role="progressbar"
                aria-label="Monthly sustainability goal progress"
                aria-valuemin="0"
                :aria-valuemax="
                  savedGoal
                "
                :aria-valuenow="
                  plannerSummary
                    .totalCo2eSavedKg
                "
              >
                <div
                  class="
                    goal-progress-bar
                  "
                  :style="{
                    width:
                      `${goalBarPercent}%`,
                  }"
                ></div>
              </div>


              <div
                v-if="
                  hasReachedGoal
                "
                class="
                  goal-achieved
                "
              >
                🎉 Monthly target
                achieved. Your current
                plan reaches or exceeds
                the saved sustainability
                goal.
              </div>


              <p
                v-else
                class="
                  text-secondary
                  mb-0
                "
              >
                <strong>
                  {{
                    goalRemaining
                  }}
                  kg CO₂e
                </strong>

                remaining to reach this
                monthly target.
              </p>

            </section>
          </div>


          <!-- =============================================== -->
          <!-- What-if -->
          <!-- =============================================== -->

          <div
            class="
              col-12
              col-xl-6
            "
          >
            <section
              class="
                scenario-card
                h-100
                p-4
              "
              aria-labelledby="scenario-title"
            >
              <p
                class="
                  impact-kicker
                  mb-1
                "
              >
                SCENARIO MODELLING
              </p>


              <h3
                id="scenario-title"
                class="
                  h2
                  fw-bold
                  mb-2
                "
              >
                What If I Recycle More?
              </h3>


              <p
                class="
                  text-secondary
                  mb-4
                "
              >
                Model how increasing
                every material in your
                current plan could
                change the estimated
                environmental impact.
              </p>


              <div
                class="
                  d-flex
                  flex-wrap
                  gap-2
                  mb-4
                "
                role="group"
                aria-label="What-if recycling scenarios"
              >
                <button
                  v-for="
                    scenario
                    in
                    scenarioOptions
                  "
                  :key="
                    scenario.percent
                  "
                  type="button"
                  class="
                    btn
                    scenario-button
                  "
                  :class="
                    activeScenarioPercent ===
                      scenario.percent
                      ? 'btn-success'
                      : 'btn-outline-success'
                  "
                  :disabled="
                    isScenarioLoading
                  "
                  :aria-pressed="
                    activeScenarioPercent ===
                      scenario.percent
                      ? 'true'
                      : 'false'
                  "
                  @click="
                    handleScenario(
                      scenario,
                    )
                  "
                >
                  +
                  {{
                    scenario.percent
                  }}%
                </button>
              </div>


              <div
                v-if="
                  isScenarioLoading
                "
                class="
                  scenario-loading
                "
                role="status"
                aria-live="polite"
              >
                <span
                  class="
                    spinner-border
                    spinner-border-sm
                    text-success
                    me-2
                  "
                  aria-hidden="true"
                ></span>

                Recalculating the plan
                with Firebase...
              </div>


              <div
                v-if="
                  scenarioError
                "
                class="
                  alert
                  alert-danger
                "
                role="alert"
              >
                {{
                  scenarioError
                }}
              </div>


              <div
                v-if="
                  scenarioResult &&
                  !isScenarioLoading
                "
                class="
                  scenario-results
                "
                aria-live="polite"
              >

                <div
                  class="
                    scenario-comparison
                  "
                >
                  <div>
                    <span
                      class="
                        scenario-label
                      "
                    >
                      Current Plan
                    </span>


                    <strong>
                      {{
                        plannerSummary
                          .totalCo2eSavedKg
                      }}
                      kg CO₂e
                    </strong>
                  </div>


                  <div
                    class="
                      scenario-arrow
                    "
                    aria-hidden="true"
                  >
                    →
                  </div>


                  <div>
                    <span
                      class="
                        scenario-label
                      "
                    >
                      +
                      {{
                        activeScenarioPercent
                      }}%
                      Scenario
                    </span>


                    <strong>
                      {{
                        scenarioResult
                          .totalCo2eSavedKg
                      }}
                      kg CO₂e
                    </strong>
                  </div>
                </div>


                <div
                  class="
                    additional-impact
                    mt-3
                  "
                >
                  <span>
                    Additional estimated
                    CO₂e saving
                  </span>


                  <strong>
                    +
                    {{
                      scenarioAdditionalCo2e
                    }}
                    kg CO₂e
                  </strong>
                </div>


                <p
                  class="
                    small
                    text-secondary
                    mt-3
                    mb-0
                  "
                >
                  The what-if scenario
                  recalculates every
                  material using the
                  same server-side
                  Firebase Cloud
                  Function rather than
                  estimating only in
                  the browser.
                </p>

              </div>

            </section>
          </div>
        </div>

      </section>


      <!-- ================================================= -->
      <!-- Architecture explanation -->
      <!-- ================================================= -->

      <section
        class="
          cloud-function-info
          mt-5
          pt-5
        "
        aria-labelledby="cloud-function-heading"
      >
        <p
          class="
            impact-kicker
            mb-1
          "
        >
          TECHNICAL WORKFLOW
        </p>


        <h2
          id="cloud-function-heading"
          class="
            h2
            fw-bold
            mb-4
          "
        >
          How the Smart Impact
          Planner Works
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
              col-md-6
              col-xl-3
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
                Build a Plan
              </h3>


              <p
                class="
                  mb-0
                  text-secondary
                "
              >
                The user combines
                multiple recycling
                materials and weights
                into one monthly plan.
              </p>
            </article>
          </div>


          <div
            class="
              col-12
              col-md-6
              col-xl-3
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
                Concurrent Cloud Calls
              </h3>


              <p
                class="
                  mb-0
                  text-secondary
                "
              >
                Promise.all sends
                independent material
                calculations to the
                Firebase Cloud Function
                concurrently.
              </p>
            </article>
          </div>


          <div
            class="
              col-12
              col-md-6
              col-xl-3
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
                Visualise & Track
              </h3>


              <p
                class="
                  mb-0
                  text-secondary
                "
              >
                Results are aggregated
                into an interactive
                Chart.js visualisation
                and persistent monthly
                goal tracker.
              </p>
            </article>
          </div>


          <div
            class="
              col-12
              col-md-6
              col-xl-3
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
                4
              </span>


              <h3
                class="
                  h5
                  fw-bold
                "
              >
                Model Scenarios
              </h3>


              <p
                class="
                  mb-0
                  text-secondary
                "
              >
                Users compare +10%,
                +25% and +50% recycling
                scenarios through new
                server-side
                calculations.
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
      #ffffff 24%
    );
}


.impact-hero,
.planner-heading {
  max-width:
    980px;
}


.impact-kicker {
  color:
    #146c43;

  font-size:
    0.76rem;

  font-weight:
    800;

  letter-spacing:
    0.1em;
}


/* ===================================================== */
/* Main cards */
/* ===================================================== */

.impact-card,
.planner-card,
.chart-card,
.goal-card,
.scenario-card {
  background:
    #ffffff;

  border:
    1px solid
    #dfe5e0;

  border-radius:
    18px;

  box-shadow:
    0 0.3rem
    1rem
    rgba(
      0,
      0,
      0,
      0.045
    );
}


.impact-card {
  overflow:
    hidden;
}


/* ===================================================== */
/* Empty states */
/* ===================================================== */

.impact-empty,
.planner-empty {
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


.planner-empty {
  border-radius:
    18px;
}


.impact-empty-icon,
.planner-empty-icon {
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

  color:
    #ffffff;

  background:
    #146c43;

  border-radius:
    50%;

  font-size:
    2rem;
}


/* ===================================================== */
/* Single result */
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
/* Planner */
/* ===================================================== */

.planner-section {
  border-top:
    1px solid
    #e5e8e6;
}


.planner-count {
  display:
    inline-flex;

  align-items:
    center;

  justify-content:
    center;

  min-width:
    54px;

  height:
    40px;

  color:
    #146c43;

  background:
    #edf7f0;

  border:
    1px solid
    #9bc9a9;

  border-radius:
    999px;

  font-weight:
    800;
}


.planner-item {
  position:
    relative;

  display:
    grid;

  grid-template-columns:
    auto
    1fr;

  gap:
    0.85rem;

  padding:
    1rem;

  background:
    #f8faf9;

  border:
    1px solid
    #dee5e0;

  border-radius:
    14px;
}


.planner-item-number {
  display:
    inline-flex;

  align-items:
    center;

  justify-content:
    center;

  width:
    34px;

  height:
    34px;

  color:
    #ffffff;

  background:
    #146c43;

  border-radius:
    50%;

  font-weight:
    800;
}


.planner-item-fields {
  display:
    grid;

  grid-template-columns:
    minmax(
      0,
      1fr
    )
    minmax(
      130px,
      0.7fr
    );

  gap:
    0.75rem;
}


.planner-remove {
  grid-column:
    2;

  justify-self:
    start;
}


.planner-dashboard {
  padding:
    0.5rem
    0;
}


.planner-stat {
  display:
    flex;

  flex-direction:
    column;

  justify-content:
    center;

  padding:
    1rem;

  background:
    #ffffff;

  border:
    1px solid
    #dfe5e0;

  border-radius:
    14px;
}


.planner-stat-highlight {
  background:
    #eaf7ee;

  border-color:
    #9bc9a9;
}


.planner-stat-value {
  color:
    #0b5d1e;

  font-size:
    1.6rem;

  font-weight:
    800;

  line-height:
    1;
}


.planner-stat-unit {
  margin-top:
    0.25rem;

  color:
    #495057;

  font-size:
    0.68rem;

  font-weight:
    700;
}


.planner-stat-label {
  margin-top:
    0.65rem;

  color:
    #495057;

  font-size:
    0.7rem;
}


.strongest-material {
  display:
    flex;

  align-items:
    flex-start;

  gap:
    0.65rem;

  padding:
    1rem;

  background:
    #fffdf3;

  border:
    1px solid
    #dfd6a2;

  border-radius:
    14px;
}


/* ===================================================== */
/* Interactive chart */
/* ===================================================== */

.chart-controls {
  display:
    flex;

  flex-wrap:
    wrap;

  gap:
    0.5rem;
}


.chart-metric-button {
  min-height:
    42px;
}


.chart-shell {
  position:
    relative;

  width:
    100%;

  height:
    340px;

  padding:
    0.75rem;

  background:
    #f8faf9;

  border:
    1px solid
    #e0e6e2;

  border-radius:
    14px;
}


/* ===================================================== */
/* Goal */
/* ===================================================== */

.goal-card {
  background:
    linear-gradient(
      180deg,
      #f5fbf7 0%,
      #ffffff 55%
    );
}


.goal-input-row {
  display:
    flex;

  align-items:
    flex-end;

  gap:
    0.75rem;
}


.goal-save-button {
  min-height:
    44px;

  white-space:
    nowrap;
}


.goal-summary {
  display:
    flex;

  align-items:
    flex-end;

  justify-content:
    space-between;

  gap:
    1rem;
}


.goal-value {
  color:
    #0b5d1e;

  font-size:
    2rem;

  font-weight:
    800;
}


.goal-total {
  color:
    #495057;

  font-weight:
    700;
}


.goal-progress {
  width:
    100%;

  height:
    18px;

  overflow:
    hidden;

  background:
    #e1e7e3;

  border-radius:
    999px;
}


.goal-progress-bar {
  height:
    100%;

  background:
    #198754;

  border-radius:
    999px;

  transition:
    width
    0.35s
    ease;
}


.goal-achieved {
  padding:
    0.9rem
    1rem;

  color:
    #0b5d1e;

  background:
    #eaf7ee;

  border:
    1px solid
    #9bc9a9;

  border-radius:
    12px;

  font-weight:
    700;
}


/* ===================================================== */
/* Scenario */
/* ===================================================== */

.scenario-button {
  min-width:
    88px;

  min-height:
    44px;
}


.scenario-loading {
  padding:
    1rem;

  background:
    #f8f9fa;

  border:
    1px solid
    #dee2e6;

  border-radius:
    12px;
}


.scenario-results {
  padding:
    1rem;

  background:
    #f8faf9;

  border:
    1px solid
    #dfe5e0;

  border-radius:
    14px;
}


.scenario-comparison {
  display:
    grid;

  grid-template-columns:
    1fr
    auto
    1fr;

  align-items:
    center;

  gap:
    1rem;
}


.scenario-comparison > div:not(
  .scenario-arrow
) {
  display:
    flex;

  flex-direction:
    column;

  gap:
    0.35rem;
}


.scenario-label {
  color:
    #495057;

  font-size:
    0.7rem;

  font-weight:
    700;
}


.scenario-arrow {
  color:
    #146c43;

  font-size:
    1.5rem;

  font-weight:
    800;
}


.additional-impact {
  display:
    flex;

  justify-content:
    space-between;

  gap:
    1rem;

  padding:
    0.8rem;

  color:
    #0b5d1e;

  background:
    #eaf7ee;

  border:
    1px solid
    #9bc9a9;

  border-radius:
    12px;
}


/* ===================================================== */
/* Workflow */
/* ===================================================== */

.cloud-function-info {
  border-top:
    1px solid
    #dee2e6;
}


.process-card {
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
/* Inputs and buttons */
/* ===================================================== */

.btn {
  min-height:
    44px;
}


.form-control:focus,
.form-select:focus {
  border-color:
    #146c43;

  box-shadow:
    0 0 0
    0.2rem
    rgba(
      20,
      108,
      67,
      0.18
    );
}


/* ===================================================== */
/* Reduced motion */
/* ===================================================== */

@media (
  prefers-reduced-motion: reduce
) {
  .goal-progress-bar {
    transition:
      none;
  }
}


/* ===================================================== */
/* Responsive */
/* ===================================================== */

@media (
  max-width: 767px
) {
  .impact-empty,
  .planner-empty {
    min-height:
      300px;
  }


  .result-number {
    font-size:
      1.7rem;
  }


  .planner-item-fields {
    grid-template-columns:
      1fr;
  }


  .goal-input-row {
    align-items:
      stretch;

    flex-direction:
      column;
  }


  .goal-save-button {
    width:
      100%;
  }


  .scenario-comparison {
    grid-template-columns:
      1fr;
  }


  .scenario-arrow {
    transform:
      rotate(
        90deg
      );

    justify-self:
      start;
  }


  .additional-impact {
    flex-direction:
      column;
  }


  .chart-shell {
    height:
      400px;
  }
}

</style>