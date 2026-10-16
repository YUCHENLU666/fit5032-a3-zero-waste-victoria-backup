import {
  httpsCallable,
} from 'firebase/functions'

import {
  functions,
} from '../firebase'


// ======================================================
// Callable Cloud Function
// ======================================================
//
// Route calculation itself is handled by Mapbox.
//
// This Firebase Cloud Function analyses the resulting:
//
// - Travel mode
// - Distance
// - Duration
//
// and returns sustainability information.
// ======================================================

const calculateRouteSustainabilityFunction =
  httpsCallable(
    functions,
    'calculateRouteSustainability',
  )


// ======================================================
// Calculate route sustainability
// ======================================================

export async function calculateRouteSustainability({
  travelMode,
  distanceMeters,
  durationSeconds,
}) {
  try {
    const response =
      await calculateRouteSustainabilityFunction({
        travelMode,
        distanceMeters,
        durationSeconds,
      })


    return {
      success:
        true,

      data:
        response.data,
    }
  } catch (error) {
    console.error(
      'Unable to calculate route sustainability:',
      error,
    )


    return {
      success:
        false,

      message:
        error?.message ||
        'Unable to analyse route sustainability.',
    }
  }
}