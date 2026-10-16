import {
  httpsCallable,
} from 'firebase/functions'

import {
  functions,
} from '../firebase'


// ======================================================
// Callable Cloud Function
// ======================================================

const calculateRecyclingImpactFunction =
  httpsCallable(
    functions,
    'calculateRecyclingImpact',
  )


// ======================================================
// Calculate recycling impact
// ======================================================

export async function calculateRecyclingImpact({
  material,
  weight,
}) {
  try {
    const response =
      await calculateRecyclingImpactFunction({
        material,
        weight,
      })


    return {
      success:
        true,

      data:
        response.data,
    }
  } catch (error) {
    console.error(
      'Unable to calculate recycling impact:',
      error,
    )


    return {
      success:
        false,

      message:
        error?.message ||
        'Unable to calculate recycling impact.',
    }
  }
}