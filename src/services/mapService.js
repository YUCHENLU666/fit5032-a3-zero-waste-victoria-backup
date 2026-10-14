// ======================================================
// Mapbox service
//
// Responsibilities:
//
// 1. Read the Mapbox public access token.
// 2. Get the user's current browser location.
// 3. Request routes from Mapbox Directions API.
// 4. Support driving, walking and cycling.
// 5. Return route geometry, distance and duration.
// ======================================================

const MAPBOX_ACCESS_TOKEN =
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN


// ======================================================
// Supported travel modes
// ======================================================

export const travelModes = [
  {
    value: 'driving',
    label: 'Driving',
  },

  {
    value: 'walking',
    label: 'Walking',
  },

  {
    value: 'cycling',
    label: 'Cycling',
  },
]


// ======================================================
// Check Mapbox configuration
// ======================================================

export function isMapboxConfigured() {
  return Boolean(
    MAPBOX_ACCESS_TOKEN &&
    MAPBOX_ACCESS_TOKEN.trim(),
  )
}


// ======================================================
// Validate coordinates
// ======================================================

function validateCoordinates({
  latitude,
  longitude,
}) {
  const lat =
    Number(latitude)

  const lng =
    Number(longitude)

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    throw new Error(
      'Invalid map coordinates.',
    )
  }

  if (
    lat < -90 ||
    lat > 90
  ) {
    throw new Error(
      'Latitude must be between -90 and 90.',
    )
  }

  if (
    lng < -180 ||
    lng > 180
  ) {
    throw new Error(
      'Longitude must be between -180 and 180.',
    )
  }

  return {
    latitude: lat,
    longitude: lng,
  }
}


// ======================================================
// Get browser geolocation
// ======================================================
//
// navigator.geolocation requires:
//
// - User permission
// - localhost OR HTTPS
//
// The production cloud deployment must therefore use
// HTTPS for this feature to work.
// ======================================================

export function getCurrentLocation() {
  return new Promise(
    (resolve, reject) => {
      if (
        !navigator.geolocation
      ) {
        reject(
          new Error(
            'Geolocation is not supported by this browser.',
          ),
        )

        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude:
              position.coords
                .latitude,

            longitude:
              position.coords
                .longitude,

            accuracy:
              position.coords
                .accuracy,
          })
        },

        (error) => {
          switch (
            error.code
          ) {
            case error.PERMISSION_DENIED:
              reject(
                new Error(
                  'Location permission was denied. Please allow location access and try again.',
                ),
              )
              break

            case error.POSITION_UNAVAILABLE:
              reject(
                new Error(
                  'Your current location is unavailable.',
                ),
              )
              break

            case error.TIMEOUT:
              reject(
                new Error(
                  'Getting your location timed out. Please try again.',
                ),
              )
              break

            default:
              reject(
                new Error(
                  'Unable to determine your current location.',
                ),
              )
          }
        },

        {
          enableHighAccuracy: true,

          timeout: 10000,

          maximumAge: 60000,
        },
      )
    },
  )
}


// ======================================================
// Request route from Mapbox Directions API
// ======================================================
//
// origin:
// {
//   latitude: number,
//   longitude: number,
// }
//
// destination:
// {
//   latitude: number,
//   longitude: number,
// }
//
// profile:
// driving | walking | cycling
// ======================================================

export async function getDirections({
  origin,
  destination,
  profile = 'driving',
}) {
  if (
    !isMapboxConfigured()
  ) {
    throw new Error(
      'Mapbox access token is not configured.',
    )
  }


  // --------------------------------------------------
  // Validate travel mode
  // --------------------------------------------------

  const validProfiles = [
    'driving',
    'walking',
    'cycling',
  ]

  if (
    !validProfiles.includes(
      profile,
    )
  ) {
    throw new Error(
      'Unsupported travel mode.',
    )
  }


  // --------------------------------------------------
  // Validate origin and destination
  // --------------------------------------------------

  const validOrigin =
    validateCoordinates(
      origin,
    )

  const validDestination =
    validateCoordinates(
      destination,
    )


  // --------------------------------------------------
  // Mapbox coordinate format:
  //
  // longitude,latitude
  //
  // NOT latitude,longitude
  // --------------------------------------------------

  const coordinates =
    [
      `${validOrigin.longitude},${validOrigin.latitude}`,
      `${validDestination.longitude},${validDestination.latitude}`,
    ].join(';')


  const endpoint =
    `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}`


  const parameters =
    new URLSearchParams({
      access_token:
        MAPBOX_ACCESS_TOKEN,

      geometries:
        'geojson',

      overview:
        'full',

      steps:
        'true',

      alternatives:
        'false',
    })


  const url =
    `${endpoint}?${parameters.toString()}`


  // --------------------------------------------------
  // Request directions
  // --------------------------------------------------

  const response =
    await fetch(url)


  if (!response.ok) {
    let message =
      'Unable to retrieve directions from Mapbox.'

    try {
      const errorData =
        await response.json()

      if (
        errorData?.message
      ) {
        message =
          errorData.message
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(
      message,
    )
  }


  const data =
    await response.json()


  // --------------------------------------------------
  // Validate response
  // --------------------------------------------------

  if (
    !Array.isArray(
      data.routes,
    ) ||
    data.routes.length === 0
  ) {
    throw new Error(
      'No route could be found between these locations.',
    )
  }


  const route =
    data.routes[0]


  if (
    !route.geometry
  ) {
    throw new Error(
      'Mapbox returned a route without map geometry.',
    )
  }


  // --------------------------------------------------
  // Return simplified data for Vue components
  // --------------------------------------------------

  return {
    geometry:
      route.geometry,

    distanceMetres:
      route.distance,

    durationSeconds:
      route.duration,

    distanceKm:
      route.distance / 1000,

    durationMinutes:
      route.duration / 60,

    legs:
      route.legs || [],

    profile,

    raw:
      route,
  }
}


// ======================================================
// Format distance
// ======================================================

export function formatDistance(
  metres,
) {
  const value =
    Number(metres)

  if (
    !Number.isFinite(value)
  ) {
    return '—'
  }

  if (value < 1000) {
    return `${Math.round(
      value,
    )} m`
  }

  return `${(
    value / 1000
  ).toFixed(1)} km`
}


// ======================================================
// Format duration
// ======================================================

export function formatDuration(
  seconds,
) {
  const value =
    Number(seconds)

  if (
    !Number.isFinite(value)
  ) {
    return '—'
  }


  const totalMinutes =
    Math.round(
      value / 60,
    )


  if (
    totalMinutes < 60
  ) {
    return `${totalMinutes} min`
  }


  const hours =
    Math.floor(
      totalMinutes / 60,
    )

  const minutes =
    totalMinutes % 60


  if (
    minutes === 0
  ) {
    return `${hours} hr`
  }


  return `${hours} hr ${minutes} min`
}