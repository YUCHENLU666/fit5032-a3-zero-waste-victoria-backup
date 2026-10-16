import {
  calculateRecyclingImpact,
} from './impactService'


// ======================================================
// Storage keys
// ======================================================

const IMPACT_GOAL_KEY =
  'zwv.impactPlanner.monthlyGoal'

const IMPACT_PLAN_KEY =
  'zwv.impactPlanner.plan'


// ======================================================
// Default planner data
// ======================================================

const DEFAULT_GOAL =
  50

const DEFAULT_PLAN = [
  {
    id:
      1,

    material:
      'Plastics',

    weight:
      10,
  },

  {
    id:
      2,

    material:
      'E-Waste',

    weight:
      4,
  },

  {
    id:
      3,

    material:
      'Clothing',

    weight:
      8,
  },
]


// ======================================================
// Read saved monthly goal
// ======================================================

export function getSavedImpactGoal() {
  try {
    const savedValue =
      localStorage.getItem(
        IMPACT_GOAL_KEY,
      )


    const numericValue =
      Number(
        savedValue,
      )


    if (
      Number.isFinite(
        numericValue,
      ) &&
      numericValue >
        0
    ) {
      return numericValue
    }
  } catch (error) {
    console.warn(
      'Unable to load impact goal:',
      error,
    )
  }


  return DEFAULT_GOAL
}


// ======================================================
// Save monthly goal
// ======================================================

export function saveImpactGoal(
  goal,
) {
  const numericGoal =
    Number(
      goal,
    )


  if (
    !Number.isFinite(
      numericGoal,
    ) ||
    numericGoal <=
      0 ||
    numericGoal >
      100000
  ) {
    return {
      success:
        false,

      message:
        'Monthly goal must be greater than 0.',
    }
  }


  try {
    localStorage.setItem(
      IMPACT_GOAL_KEY,
      String(
        numericGoal,
      ),
    )


    return {
      success:
        true,

      value:
        numericGoal,
    }
  } catch (error) {
    console.error(
      'Unable to save impact goal:',
      error,
    )


    return {
      success:
        false,

      message:
        'Unable to save the monthly goal.',
    }
  }
}


// ======================================================
// Read saved recycling plan
// ======================================================

export function getSavedImpactPlan() {
  try {
    const storedPlan =
      localStorage.getItem(
        IMPACT_PLAN_KEY,
      )


    if (!storedPlan) {
      return DEFAULT_PLAN.map(
        (item) => ({
          ...item,
        }),
      )
    }


    const parsedPlan =
      JSON.parse(
        storedPlan,
      )


    if (
      !Array.isArray(
        parsedPlan,
      ) ||
      parsedPlan.length ===
        0
    ) {
      throw new Error(
        'Invalid saved impact plan.',
      )
    }


    return parsedPlan
  } catch (error) {
    console.warn(
      'Unable to load saved impact plan:',
      error,
    )


    return DEFAULT_PLAN.map(
      (item) => ({
        ...item,
      }),
    )
  }
}


// ======================================================
// Save recycling plan
// ======================================================

export function saveImpactPlan(
  plan,
) {
  try {
    localStorage.setItem(
      IMPACT_PLAN_KEY,
      JSON.stringify(
        plan,
      ),
    )


    return {
      success:
        true,
    }
  } catch (error) {
    console.error(
      'Unable to save impact plan:',
      error,
    )


    return {
      success:
        false,
    }
  }
}


// ======================================================
// Validate planner item
// ======================================================

function validatePlanItem(
  item,
) {
  const weight =
    Number(
      item.weight,
    )


  return (
    item.material &&
    Number.isFinite(
      weight,
    ) &&
    weight >
      0 &&
    weight <=
      10000
  )
}


// ======================================================
// Analyse complete recycling plan
// ======================================================
//
// Each material is analysed by the existing Firebase
// calculateRecyclingImpact Cloud Function.
//
// Promise.all allows the independent serverless
// calculations to run concurrently.
// ======================================================

export async function analyseImpactPlan(
  plan,
) {
  if (
    !Array.isArray(
      plan,
    ) ||
    plan.length ===
      0
  ) {
    return {
      success:
        false,

      message:
        'Add at least one material to the recycling plan.',
    }
  }


  if (
    !plan.every(
      validatePlanItem,
    )
  ) {
    return {
      success:
        false,

      message:
        'Each material must have a valid weight between 0 and 10,000 kg.',
    }
  }


  try {
    const responses =
      await Promise.all(
        plan.map(
          (item) =>
            calculateRecyclingImpact({
              material:
                item.material,

              weight:
                Number(
                  item.weight,
                ),
            }),
        ),
      )


    const failedResponse =
      responses.find(
        (response) =>
          !response.success,
      )


    if (failedResponse) {
      return {
        success:
          false,

        message:
          failedResponse.message ||
          'Unable to analyse the recycling plan.',
      }
    }


    const items =
      responses.map(
        (
          response,
          index,
        ) => ({
          id:
            plan[index].id,

          ...response.data,
        }),
      )


    const totalWeightKg =
      items.reduce(
        (
          total,
          item,
        ) =>
          total +
          Number(
            item.weightKg ||
            0,
          ),

        0,
      )


    const totalLandfillDivertedKg =
      items.reduce(
        (
          total,
          item,
        ) =>
          total +
          Number(
            item.landfillDivertedKg ||
            0,
          ),

        0,
      )


    const totalCo2eSavedKg =
      items.reduce(
        (
          total,
          item,
        ) =>
          total +
          Number(
            item.estimatedCo2eSavedKg ||
            0,
          ),

        0,
      )


    const strongestMaterial =
      [...items]
        .sort(
          (
            first,
            second,
          ) =>
            Number(
              second
                .estimatedCo2eSavedKg ||
              0,
            ) -
            Number(
              first
                .estimatedCo2eSavedKg ||
              0,
            ),
        )[0]


    return {
      success:
        true,

      data: {
        items,

        totalWeightKg:
          Number(
            totalWeightKg
              .toFixed(
                2,
              ),
          ),

        totalLandfillDivertedKg:
          Number(
            totalLandfillDivertedKg
              .toFixed(
                2,
              ),
          ),

        totalCo2eSavedKg:
          Number(
            totalCo2eSavedKg
              .toFixed(
                2,
              ),
          ),

        materialCount:
          items.length,

        strongestMaterial:
          strongestMaterial ||
          null,
      },
    }
  } catch (error) {
    console.error(
      'Unable to analyse impact plan:',
      error,
    )


    return {
      success:
        false,

      message:
        'Unable to analyse the recycling plan.',
    }
  }
}


// ======================================================
// What-if scenario
// ======================================================
//
// Example multiplier:
//
// 1.10 = recycle 10% more
// 1.25 = recycle 25% more
// 1.50 = recycle 50% more
// ======================================================

export async function analyseImpactScenario(
  plan,
  multiplier,
) {
  const numericMultiplier =
    Number(
      multiplier,
    )


  if (
    !Number.isFinite(
      numericMultiplier,
    ) ||
    numericMultiplier <=
      1
  ) {
    return {
      success:
        false,

      message:
        'Scenario multiplier must be greater than 1.',
    }
  }


  const scenarioPlan =
    plan.map(
      (item) => ({
        ...item,

        weight:
          Number(
            (
              Number(
                item.weight,
              ) *
              numericMultiplier
            ).toFixed(
              2,
            ),
          ),
      }),
    )


  return analyseImpactPlan(
    scenarioPlan,
  )
}