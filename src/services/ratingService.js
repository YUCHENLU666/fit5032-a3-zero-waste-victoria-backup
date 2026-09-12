const RATINGS_KEY = 'zwvRatings'


// ======================================================
// Read all ratings
// ======================================================

export function getRatings() {
  try {
    const storedRatings =
      localStorage.getItem(RATINGS_KEY)

    if (!storedRatings) {
      return []
    }

    return JSON.parse(storedRatings)
  } catch (error) {
    console.error(
      'Failed to load ratings:',
      error
    )

    return []
  }
}


// ======================================================
// Save all ratings
// ======================================================

function saveRatings(ratings) {
  localStorage.setItem(
    RATINGS_KEY,
    JSON.stringify(ratings)
  )
}


// ======================================================
// Get all ratings for one recycling location
// ======================================================

export function getRatingsForLocation(locationId) {
  const ratings = getRatings()

  return ratings.filter(
    (rating) =>
      String(rating.locationId) ===
      String(locationId)
  )
}


// ======================================================
// Get the current user's rating for one location
// ======================================================

export function getUserRating(
  locationId,
  userId
) {
  const ratings = getRatings()

  return (
    ratings.find(
      (rating) =>
        String(rating.locationId) ===
          String(locationId) &&
        rating.userId === userId
    ) || null
  )
}


// ======================================================
// Calculate average rating and rating count
// ======================================================

export function getRatingSummary(locationId) {
  const ratings =
    getRatingsForLocation(locationId)

  if (ratings.length === 0) {
    return {
      average: 0,
      count: 0,
    }
  }

  const total = ratings.reduce(
    (sum, rating) =>
      sum + Number(rating.score),
    0
  )

  const average =
    total / ratings.length

  return {
    average: Number(
      average.toFixed(1)
    ),

    count: ratings.length,
  }
}


// ======================================================
// Add or update a user's rating
// ======================================================

export function saveRating(
  locationId,
  userId,
  score
) {
  const numericScore = Number(score)

  // Rating must be between 1 and 5
  if (
    !Number.isInteger(numericScore) ||
    numericScore < 1 ||
    numericScore > 5
  ) {
    return {
      success: false,
      message:
        'Rating must be between 1 and 5.',
    }
  }

  if (!locationId || !userId) {
    return {
      success: false,
      message:
        'Location and user are required.',
    }
  }

  const ratings = getRatings()

  const existingRatingIndex =
    ratings.findIndex(
      (rating) =>
        String(rating.locationId) ===
          String(locationId) &&
        rating.userId === userId
    )


  // ==================================================
  // User has already rated this location
  // → Update existing rating
  // ==================================================

  if (existingRatingIndex !== -1) {

    // Update the existing rating score
    ratings[
      existingRatingIndex
    ].score = numericScore

    // Update the modification time
    ratings[
      existingRatingIndex
    ].updatedAt =
      new Date().toISOString()

    saveRatings(ratings)

    return {
      success: true,
      updated: true,
    }
  }


  // ==================================================
  // First rating from this user
  // → Create a new rating
  // ==================================================

  const newRating = {
    id: crypto.randomUUID(),

    locationId,

    userId,

    score: numericScore,

    updatedAt:
      new Date().toISOString(),
  }

  ratings.push(newRating)

  saveRatings(ratings)

  return {
    success: true,
    updated: false,
  }
}


// ======================================================
// Get all ratings submitted by one user
// Used later by AccountView
// ======================================================

export function getRatingsByUser(userId) {
  const ratings = getRatings()

  return ratings.filter(
    (rating) =>
      rating.userId === userId
  )
}