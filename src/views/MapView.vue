<script setup>
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
} from 'vue'

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import {
  recyclingLocations,
} from '../data/recyclingLocations.js'

import {
  formatDistance,
  formatDuration,
  getCurrentLocation,
  getDirections,
  isMapboxConfigured,
  travelModes,
} from '../services/mapService.js'


// ======================================================
// Map configuration
// ======================================================

const MAPBOX_ACCESS_TOKEN =
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

const ROUTE_SOURCE_ID =
  'zwv-route-source'

const ROUTE_LAYER_ID =
  'zwv-route-layer'


// ======================================================
// References
// ======================================================

const mapContainer = ref(null)

let map = null

const locationMarkers =
  new Map()

let userMarker = null


// ======================================================
// Page state
// ======================================================

const searchTerm = ref('')

const selectedLocation =
  ref(null)

const userLocation =
  ref(null)

const travelMode =
  ref('driving')

const routeInfo =
  ref(null)

const mapReady =
  ref(false)

const isLocating =
  ref(false)

const isRouting =
  ref(false)

const errorMessage =
  ref('')

const statusMessage =
  ref('')


// ======================================================
// POI search
// ======================================================

const filteredLocations =
  computed(() => {
    const term =
      searchTerm.value
        .trim()
        .toLowerCase()

    if (!term) {
      return recyclingLocations
    }

    return recyclingLocations.filter(
      (location) => {
        const searchableText = [
          location.name,
          location.suburb,
          location.postcode,
          location.status,
          ...location.acceptedMaterials,
        ]
          .join(' ')
          .toLowerCase()

        return searchableText.includes(
          term,
        )
      },
    )
  })


// ======================================================
// Selected location helpers
// ======================================================

const selectedMaterials =
  computed(() => {
    if (
      !selectedLocation.value
    ) {
      return ''
    }

    return selectedLocation.value
      .acceptedMaterials
      .join(', ')
  })


const selectedCoordinates =
  computed(() => {
    if (
      !selectedLocation.value
    ) {
      return ''
    }

    return [
      selectedLocation.value
        .latitude,
      selectedLocation.value
        .longitude,
    ].join(', ')
  })


// ======================================================
// Clear messages
// ======================================================

function clearMessages() {
  errorMessage.value = ''
  statusMessage.value = ''
}


// ======================================================
// Popup content
// ======================================================

function createLocationPopup(
  location,
) {
  const wrapper =
    document.createElement('div')

  wrapper.className =
    'zwv-popup'

  const title =
    document.createElement('strong')

  title.textContent =
    location.name

  const suburb =
    document.createElement('div')

  suburb.textContent =
    `${location.suburb} ${location.postcode}`

  const materials =
    document.createElement('div')

  materials.textContent =
    location.acceptedMaterials
      .join(', ')

  const status =
    document.createElement('div')

  status.textContent =
    `Status: ${location.status}`

  wrapper.append(
    title,
    suburb,
    materials,
    status,
  )

  return wrapper
}


// ======================================================
// Add recycling location markers
// ======================================================

function addLocationMarkers() {
  if (!map) {
    return
  }

  recyclingLocations.forEach(
    (location) => {
      const popup =
        new mapboxgl.Popup({
          offset: 24,
        })
          .setDOMContent(
            createLocationPopup(
              location,
            ),
          )

      const marker =
        new mapboxgl.Marker({
          color:
            location.status ===
            'Open'
              ? '#198754'
              : '#6c757d',
        })
          .setLngLat([
            location.longitude,
            location.latitude,
          ])
          .setPopup(popup)
          .addTo(map)

      marker
        .getElement()
        .setAttribute(
          'aria-label',
          `Select ${location.name}`,
        )

      marker
        .getElement()
        .setAttribute(
          'tabindex',
          '0',
        )

      marker
        .getElement()
        .addEventListener(
          'click',
          () => {
            selectLocation(
              location,
              false,
            )
          },
        )

      marker
        .getElement()
        .addEventListener(
          'keydown',
          (event) => {
            if (
              event.key ===
                'Enter' ||
              event.key === ' '
            ) {
              event.preventDefault()

              selectLocation(
                location,
                false,
              )

              marker.togglePopup()
            }
          },
        )

      locationMarkers.set(
        location.id,
        marker,
      )
    },
  )
}


// ======================================================
// Select destination
// ======================================================

function selectLocation(
  location,
  moveMap = true,
) {
  clearMessages()

  selectedLocation.value =
    location

  routeInfo.value = null

  clearRoute()

  if (
    moveMap &&
    map
  ) {
    map.flyTo({
      center: [
        location.longitude,
        location.latitude,
      ],

      zoom: 14,

      essential: true,
    })
  }

  const marker =
    locationMarkers.get(
      location.id,
    )

  if (
    marker &&
    !marker
      .getPopup()
      .isOpen()
  ) {
    marker.togglePopup()
  }

  statusMessage.value =
    `${location.name} selected as the destination.`
}


// ======================================================
// Locate user
// ======================================================

async function handleUseMyLocation() {
  clearMessages()

  isLocating.value = true

  try {
    const location =
      await getCurrentLocation()

    userLocation.value =
      location

    if (userMarker) {
      userMarker.remove()
    }

    const popupContent =
      document.createElement(
        'div',
      )

    const title =
      document.createElement(
        'strong',
      )

    title.textContent =
      'Your Location'

    const accuracy =
      document.createElement(
        'div',
      )

    accuracy.textContent =
      `Accuracy: approximately ${Math.round(
        location.accuracy,
      )} m`

    popupContent.append(
      title,
      accuracy,
    )

    userMarker =
      new mapboxgl.Marker({
        color: '#0d6efd',
      })
        .setLngLat([
          location.longitude,
          location.latitude,
        ])
        .setPopup(
          new mapboxgl.Popup({
            offset: 24,
          }).setDOMContent(
            popupContent,
          ),
        )
        .addTo(map)

    map.flyTo({
      center: [
        location.longitude,
        location.latitude,
      ],

      zoom: 13,

      essential: true,
    })

    statusMessage.value =
      'Your current location has been added to the map.'

    routeInfo.value = null

    clearRoute()
  } catch (error) {
    errorMessage.value =
      error.message
  } finally {
    isLocating.value =
      false
  }
}


// ======================================================
// Route layer
// ======================================================

function clearRoute() {
  if (
    !map ||
    !mapReady.value
  ) {
    return
  }

  if (
    map.getLayer(
      ROUTE_LAYER_ID,
    )
  ) {
    map.removeLayer(
      ROUTE_LAYER_ID,
    )
  }

  if (
    map.getSource(
      ROUTE_SOURCE_ID,
    )
  ) {
    map.removeSource(
      ROUTE_SOURCE_ID,
    )
  }
}


// ======================================================
// Draw route
// ======================================================

function drawRoute(geometry) {
  if (
    !map ||
    !mapReady.value
  ) {
    return
  }

  clearRoute()

  map.addSource(
    ROUTE_SOURCE_ID,
    {
      type: 'geojson',

      data: {
        type: 'Feature',

        properties: {},

        geometry,
      },
    },
  )

  map.addLayer({
    id: ROUTE_LAYER_ID,

    type: 'line',

    source: ROUTE_SOURCE_ID,

    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },

    paint: {
      'line-color': '#198754',
      'line-width': 6,
      'line-opacity': 0.85,
    },
  })
}


// ======================================================
// Fit map to route
// ======================================================

function fitMapToRoute(
  geometry,
) {
  if (
    !map ||
    !geometry?.coordinates
  ) {
    return
  }

  const coordinates =
    geometry.coordinates

  if (
    coordinates.length === 0
  ) {
    return
  }

  const bounds =
    coordinates.reduce(
      (
        currentBounds,
        coordinate,
      ) =>
        currentBounds.extend(
          coordinate,
        ),

      new mapboxgl.LngLatBounds(
        coordinates[0],
        coordinates[0],
      ),
    )

  map.fitBounds(
    bounds,
    {
      padding: 80,
      maxZoom: 15,
      duration: 900,
    },
  )
}


// ======================================================
// Plan route
// ======================================================

async function handlePlanRoute() {
  clearMessages()

  if (
    !userLocation.value
  ) {
    errorMessage.value =
      'Please use "Use My Location" before planning a route.'

    return
  }

  if (
    !selectedLocation.value
  ) {
    errorMessage.value =
      'Please select a recycling location first.'

    return
  }

  isRouting.value = true

  try {
    const route =
      await getDirections({
        origin: {
          latitude:
            userLocation.value
              .latitude,

          longitude:
            userLocation.value
              .longitude,
        },

        destination: {
          latitude:
            selectedLocation.value
              .latitude,

          longitude:
            selectedLocation.value
              .longitude,
        },

        profile:
          travelMode.value,
      })

    routeInfo.value =
      route

    drawRoute(
      route.geometry,
    )

    fitMapToRoute(
      route.geometry,
    )

    statusMessage.value =
      `Route to ${selectedLocation.value.name} calculated successfully.`
  } catch (error) {
    errorMessage.value =
      error.message
  } finally {
    isRouting.value =
      false
  }
}


// ======================================================
// Clear destination and route
// ======================================================

function clearSelection() {
  clearMessages()

  selectedLocation.value =
    null

  routeInfo.value = null

  searchTerm.value = ''

  clearRoute()

  statusMessage.value =
    'Destination selection cleared.'
}


// ======================================================
// Initialise Mapbox
// ======================================================

onMounted(async () => {
  if (
    !isMapboxConfigured()
  ) {
    errorMessage.value =
      'Mapbox is not configured. Check VITE_MAPBOX_ACCESS_TOKEN in your .env file.'

    return
  }

  mapboxgl.accessToken =
    MAPBOX_ACCESS_TOKEN

  await nextTick()

  map =
    new mapboxgl.Map({
      container:
        mapContainer.value,

      style:
        'mapbox://styles/mapbox/streets-v12',

      center: [
        145.13,
        -37.92,
      ],

      zoom: 10.5,
    })


  // Map navigation buttons
  map.addControl(
    new mapboxgl.NavigationControl(),

    'top-right',
  )


  // Scale
  map.addControl(
    new mapboxgl.ScaleControl({
      maxWidth: 120,
      unit: 'metric',
    }),

    'bottom-left',
  )


  map.on(
    'load',
    () => {
      mapReady.value = true

      addLocationMarkers()
    },
  )
})


// ======================================================
// Cleanup
// ======================================================

onUnmounted(() => {
  locationMarkers.forEach(
    (marker) => {
      marker.remove()
    },
  )

  locationMarkers.clear()

  if (userMarker) {
    userMarker.remove()
    userMarker = null
  }

  if (map) {
    map.remove()
    map = null
  }
})
</script>


<template>
  <main class="map-page">

    <!-- ================================================= -->
    <!-- Header -->
    <!-- ================================================= -->

    <section
      class="map-header py-5"
      aria-labelledby="map-title"
    >
      <div class="container py-lg-4">

        <p
          class="
            text-success
            fw-bold
            text-uppercase
            mb-2
          "
        >
          Recycling Map
        </p>

        <h1
          id="map-title"
          class="
            display-5
            fw-bold
            mb-3
          "
        >
          Find and Navigate to
          Recycling Locations
        </h1>

        <p
          class="
            lead
            text-secondary
            map-intro
            mb-0
          "
        >
          Explore recycling points,
          search for suitable
          locations, use your current
          position and calculate a
          driving, walking or cycling
          route.
        </p>

      </div>
    </section>


    <!-- ================================================= -->
    <!-- Main map -->
    <!-- ================================================= -->

    <section class="py-5">
      <div class="container">

        <!-- Error -->
        <div
          v-if="errorMessage"
          class="alert alert-danger"
          role="alert"
          aria-live="assertive"
        >
          {{ errorMessage }}
        </div>


        <!-- Status -->
        <div
          v-if="statusMessage"
          class="alert alert-success"
          role="status"
          aria-live="polite"
        >
          {{ statusMessage }}
        </div>


        <div class="row g-4">

          <!-- ============================================= -->
          <!-- Controls -->
          <!-- ============================================= -->

          <div class="col-lg-4">

            <div
              class="
                control-card
                p-4
              "
            >

              <!-- POI search -->
              <div class="mb-4">

                <label
                  for="poi-search"
                  class="
                    form-label
                    fw-semibold
                  "
                >
                  Search Recycling
                  Locations
                </label>

                <input
                  id="poi-search"
                  v-model="searchTerm"
                  type="search"
                  class="form-control"
                  placeholder="Search by name, suburb, postcode or material..."
                />

                <div class="form-text">
                  Search across all
                  {{ recyclingLocations.length }}
                  recycling points.
                </div>

              </div>


              <!-- Search results -->
              <div
                class="
                  poi-results
                  mb-4
                "
                aria-label="Recycling location search results"
              >
                <p
                  class="
                    small
                    fw-semibold
                    mb-2
                  "
                  aria-live="polite"
                >
                  {{
                    filteredLocations.length
                  }}
                  location(s)
                </p>


                <div
                  v-if="
                    filteredLocations.length >
                    0
                  "
                  class="
                    d-grid
                    gap-2
                  "
                >
                  <button
                    v-for="
                      location in
                      filteredLocations
                    "
                    :key="location.id"
                    type="button"
                    class="
                      location-result
                      text-start
                    "
                    :class="{
                      selected:
                        selectedLocation?.id ===
                        location.id,
                    }"
                    @click="
                      selectLocation(
                        location,
                      )
                    "
                  >
                    <span
                      class="
                        d-block
                        fw-semibold
                      "
                    >
                      {{ location.name }}
                    </span>

                    <span
                      class="
                        d-block
                        small
                        text-secondary
                      "
                    >
                      {{ location.suburb }}
                      ·
                      {{ location.postcode }}
                      ·
                      {{ location.status }}
                    </span>
                  </button>
                </div>


                <div
                  v-else
                  class="
                    text-secondary
                    small
                    p-3
                    bg-light
                    rounded-3
                  "
                >
                  No matching recycling
                  locations found.
                </div>
              </div>


              <!-- My location -->
              <div class="mb-4">

                <h2
                  class="
                    h6
                    fw-bold
                    mb-2
                  "
                >
                  Your Location
                </h2>

                <button
                  type="button"
                  class="
                    btn
                    btn-outline-primary
                    w-100
                  "
                  :disabled="
                    isLocating
                  "
                  @click="
                    handleUseMyLocation
                  "
                >
                  <span
                    v-if="
                      isLocating
                    "
                    class="
                      spinner-border
                      spinner-border-sm
                      me-2
                    "
                    aria-hidden="true"
                  />

                  {{
                    isLocating
                      ? 'Locating...'
                      : '📍 Use My Location'
                  }}
                </button>


                <div
                  v-if="
                    userLocation
                  "
                  class="
                    location-success
                    mt-2
                  "
                >
                  <small
                    class="
                      text-secondary
                    "
                  >
                    Location available
                    · accuracy approximately
                    {{
                      Math.round(
                        userLocation.accuracy,
                      )
                    }}
                    m
                  </small>
                </div>

              </div>


              <!-- Travel mode -->
              <fieldset
                class="mb-4"
              >
                <legend
                  class="
                    h6
                    fw-bold
                    mb-2
                  "
                >
                  Travel Mode
                </legend>


                <div
                  class="
                    d-grid
                    gap-2
                  "
                >
                  <label
                    v-for="
                      mode in
                      travelModes
                    "
                    :key="
                      mode.value
                    "
                    class="
                      travel-option
                    "
                    :class="{
                      active:
                        travelMode ===
                        mode.value,
                    }"
                  >
                    <input
                      v-model="
                        travelMode
                      "
                      type="radio"
                      name="travel-mode"
                      :value="
                        mode.value
                      "
                    />

                    <span>
                      {{
                        mode.label
                      }}
                    </span>
                  </label>
                </div>
              </fieldset>


              <!-- Route button -->
              <button
                type="button"
                class="
                  btn
                  btn-success
                  w-100
                  mb-2
                "
                :disabled="
                  isRouting
                "
                @click="
                  handlePlanRoute
                "
              >
                <span
                  v-if="
                    isRouting
                  "
                  class="
                    spinner-border
                    spinner-border-sm
                    me-2
                  "
                  aria-hidden="true"
                />

                {{
                  isRouting
                    ? 'Planning Route...'
                    : 'Plan Route'
                }}
              </button>


              <button
                type="button"
                class="
                  btn
                  btn-outline-secondary
                  w-100
                "
                @click="
                  clearSelection
                "
              >
                Clear Selection
              </button>

            </div>


            <!-- =========================================== -->
            <!-- Selected location -->
            <!-- =========================================== -->

            <div
              v-if="
                selectedLocation
              "
              class="
                selected-card
                mt-4
                p-4
              "
            >
              <p
                class="
                  section-label
                  mb-2
                "
              >
                SELECTED LOCATION
              </p>

              <h2
                class="
                  h5
                  fw-bold
                  mb-3
                "
              >
                {{
                  selectedLocation.name
                }}
              </h2>


              <dl
                class="
                  selected-details
                  mb-0
                "
              >
                <div>
                  <dt>
                    Suburb
                  </dt>

                  <dd>
                    {{
                      selectedLocation.suburb
                    }}
                    {{
                      selectedLocation.postcode
                    }}
                  </dd>
                </div>


                <div>
                  <dt>
                    Status
                  </dt>

                  <dd>
                    {{
                      selectedLocation.status
                    }}
                  </dd>
                </div>


                <div>
                  <dt>
                    Rating
                  </dt>

                  <dd>
                    {{
                      selectedLocation.rating
                    }}
                    / 5
                  </dd>
                </div>


                <div>
                  <dt>
                    Materials
                  </dt>

                  <dd>
                    {{
                      selectedMaterials
                    }}
                  </dd>
                </div>


                <div>
                  <dt>
                    Coordinates
                  </dt>

                  <dd>
                    {{
                      selectedCoordinates
                    }}
                  </dd>
                </div>
              </dl>
            </div>


            <!-- =========================================== -->
            <!-- Trip info -->
            <!-- =========================================== -->

            <div
              v-if="routeInfo"
              class="
                route-card
                mt-4
                p-4
              "
              aria-live="polite"
            >
              <p
                class="
                  section-label
                  mb-2
                "
              >
                TRIP INFORMATION
              </p>

              <h2
                class="
                  h5
                  fw-bold
                  mb-3
                "
              >
                Route Summary
              </h2>


              <div
                class="
                  row
                  g-3
                "
              >
                <div
                  class="
                    col-6
                  "
                >
                  <div
                    class="
                      route-stat
                    "
                  >
                    <span
                      class="
                        stat-value
                      "
                    >
                      {{
                        formatDistance(
                          routeInfo
                            .distanceMetres,
                        )
                      }}
                    </span>

                    <span
                      class="
                        stat-label
                      "
                    >
                      Distance
                    </span>
                  </div>
                </div>


                <div
                  class="
                    col-6
                  "
                >
                  <div
                    class="
                      route-stat
                    "
                  >
                    <span
                      class="
                        stat-value
                      "
                    >
                      {{
                        formatDuration(
                          routeInfo
                            .durationSeconds,
                        )
                      }}
                    </span>

                    <span
                      class="
                        stat-label
                      "
                    >
                      Estimated time
                    </span>
                  </div>
                </div>
              </div>


              <p
                class="
                  small
                  text-secondary
                  mt-3
                  mb-0
                "
              >
                Travel mode:
                <strong>
                  {{
                    routeInfo.profile
                  }}
                </strong>
              </p>
            </div>

          </div>


          <!-- ============================================= -->
          <!-- Map -->
          <!-- ============================================= -->

          <div class="col-lg-8">

            <div
              class="
                map-card
                overflow-hidden
              "
            >
              <div
                ref="mapContainer"
                class="map-container"
                role="application"
                aria-label="Interactive Mapbox recycling locations map"
              />

              <!-- Legend -->
              <div
                class="
                  map-legend
                "
                aria-label="Map legend"
              >
                <div>
                  <span
                    class="
                      legend-dot
                      open
                    "
                  ></span>
                  Open location
                </div>

                <div>
                  <span
                    class="
                      legend-dot
                      closed
                    "
                  ></span>
                  Closed location
                </div>

                <div>
                  <span
                    class="
                      legend-dot
                      user
                    "
                  ></span>
                  Your location
                </div>
              </div>
            </div>


            <div
              class="
                map-note
                mt-3
              "
            >
              <strong>
                Demo data notice:
              </strong>

              Recycling location names
              and coordinates are
              demonstration data for
              this university project
              and should not be treated
              as official facility
              addresses.
            </div>

          </div>

        </div>

      </div>
    </section>

  </main>
</template>


<style scoped>
.map-page {
  min-height: 100vh;
  background-color: #ffffff;
}

.map-header {
  background:
    linear-gradient(
      135deg,
      #f2faf5 0%,
      #ffffff 65%
    );
}

.map-intro {
  max-width: 820px;
}


/* ===================================================== */
/* Cards */
/* ===================================================== */

.control-card,
.selected-card,
.route-card,
.map-card {
  background-color: #ffffff;

  border:
    1px solid #e9ecef;

  border-radius: 18px;

  box-shadow:
    0 0.4rem 1.4rem
    rgba(
      0,
      0,
      0,
      0.045
    );
}


/* ===================================================== */
/* Search results */
/* ===================================================== */

.poi-results {
  max-height: 320px;
  overflow-y: auto;
}

.location-result {
  width: 100%;

  padding:
    0.75rem 0.9rem;

  background-color:
    #ffffff;

  border:
    1px solid #dee2e6;

  border-radius: 10px;

  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    transform 0.15s ease;
}

.location-result:hover {
  background-color:
    #f7fbf8;

  border-color:
    var(--bs-success);

  transform:
    translateY(-1px);
}

.location-result:focus-visible {
  outline:
    3px solid
    rgba(
      25,
      135,
      84,
      0.25
    );

  outline-offset: 2px;
}

.location-result.selected {
  background-color:
    rgba(
      25,
      135,
      84,
      0.08
    );

  border-color:
    var(--bs-success);
}


/* ===================================================== */
/* Travel options */
/* ===================================================== */

.travel-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  padding:
    0.7rem 0.9rem;

  cursor: pointer;

  background-color:
    #ffffff;

  border:
    1px solid #dee2e6;

  border-radius: 10px;
}

.travel-option.active {
  background-color:
    rgba(
      25,
      135,
      84,
      0.08
    );

  border-color:
    var(--bs-success);
}

.travel-option input {
  accent-color:
    var(--bs-success);
}


/* ===================================================== */
/* Location / route cards */
/* ===================================================== */

.section-label {
  color:
    var(--bs-success);

  font-size: 0.72rem;
  font-weight: 700;

  letter-spacing:
    0.12em;
}

.selected-details {
  display: grid;
  gap: 0.9rem;
}

.selected-details div {
  display: grid;

  grid-template-columns:
    100px 1fr;

  gap: 1rem;
}

.selected-details dt {
  color: #6c757d;
  font-size: 0.85rem;
}

.selected-details dd {
  margin: 0;

  font-size: 0.9rem;
  font-weight: 500;
}

.route-stat {
  padding: 1rem;

  text-align: center;

  background-color:
    #f8f9fa;

  border-radius: 12px;
}

.stat-value {
  display: block;

  margin-bottom:
    0.2rem;

  font-size: 1.3rem;
  font-weight: 700;
}

.stat-label {
  color: #6c757d;

  font-size: 0.8rem;
}


/* ===================================================== */
/* Map */
/* ===================================================== */

.map-card {
  position: relative;
}

.map-container {
  width: 100%;
  height: 680px;
}

.map-legend {
  position: absolute;

  left: 1rem;
  bottom: 2.5rem;

  display: grid;
  gap: 0.35rem;

  padding:
    0.7rem 0.9rem;

  font-size: 0.8rem;

  background-color:
    rgba(
      255,
      255,
      255,
      0.94
    );

  border-radius: 10px;

  box-shadow:
    0 0.2rem 0.8rem
    rgba(
      0,
      0,
      0,
      0.12
    );
}

.legend-dot {
  display:
    inline-block;

  width: 10px;
  height: 10px;

  margin-right:
    0.4rem;

  border-radius: 50%;
}

.legend-dot.open {
  background-color: #198754;
}

.legend-dot.closed {
  background-color: #6c757d;
}

.legend-dot.user {
  background-color: #0d6efd;
}


/* ===================================================== */
/* Other */
/* ===================================================== */

.map-note {
  padding:
    0.9rem 1rem;

  color: #6c757d;

  font-size: 0.85rem;

  background-color:
    #f8f9fa;

  border-radius: 10px;
}

.form-control:focus {
  border-color:
    var(--bs-success);

  box-shadow:
    0 0 0 0.2rem
    rgba(
      25,
      135,
      84,
      0.15
    );
}


/* ===================================================== */
/* Responsive */
/* ===================================================== */

@media (
  max-width: 991px
) {
  .map-container {
    height: 550px;
  }
}

@media (
  max-width: 576px
) {
  .map-container {
    height: 480px;
  }

  .selected-details div {
    grid-template-columns:
      1fr;
    gap: 0.15rem;
  }
}
</style>