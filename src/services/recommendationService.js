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
// This frontend service does not perform recommendation
// logic itself.
//
// It sends the user's material and postcode to the
// Firebase Cloud Function:
//
// recommendRecyclingLocations
//
// Filtering, scoring and ranking are performed
// server-side.
// ======================================================

const recommendRecyclingLocationsFunction =
  httpsCallable(
    functions,
    'recommendRecyclingLocations',
  )


// ======================================================
// Request recycling location recommendations
// ======================================================

export async function recommendRecyclingLocations({
  material,
  postcode,
}) {
  try {
    const response =
      await recommendRecyclingLocationsFunction({
        material,
        postcode,
      })


    return {
      success:
        true,

      data:
        response.data,
    }
  } catch (error) {
    console.error(
      'Unable to get recycling location recommendations:',
      error,
    )


    // Firebase callable functions normally provide
    // a readable backend error message.

    return {
      success:
        false,

      message:
        error?.message ||
        'Unable to generate recycling recommendations.',
    }
  }
}