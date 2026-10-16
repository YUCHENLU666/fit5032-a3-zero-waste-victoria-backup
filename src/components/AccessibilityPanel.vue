<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'

import {
  accessibilitySettings,
  resetAccessibilitySettings,
  setHighContrast,
  setReadableSpacing,
  setReduceMotion,
  setTextSize,
} from '../services/accessibilityService'


// ======================================================
// Panel state
// ======================================================

const isOpen =
  ref(false)


const triggerButton =
  ref(null)


const closeButton =
  ref(null)


// ======================================================
// Current text size description
// ======================================================

const currentTextSizeLabel =
  computed(
    () => {
      switch (
        accessibilitySettings.textSize
      ) {
        case 'large':
          return (
            'Large, 24 pixels'
          )

        case 'extra-large':
          return (
            'Extra Large, 26 pixels'
          )

        default:
          return (
            'Standard, 22 pixels'
          )
      }
    },
  )


// ======================================================
// Open panel
// ======================================================

async function openPanel() {
  isOpen.value =
    true


  await nextTick()


  closeButton.value
    ?.focus()
}


// ======================================================
// Close panel
// ======================================================

function closePanel() {
  isOpen.value =
    false


  nextTick(
    () => {
      triggerButton.value
        ?.focus()
    },
  )
}


// ======================================================
// Toggle panel
// ======================================================

function togglePanel() {
  if (
    isOpen.value
  ) {
    closePanel()
  } else {
    openPanel()
  }
}


// ======================================================
// Escape key support
// ======================================================

function handleGlobalKeydown(
  event,
) {
  if (
    event.key ===
      'Escape' &&
    isOpen.value
  ) {
    closePanel()
  }
}


onMounted(
  () => {
    window.addEventListener(
      'keydown',
      handleGlobalKeydown,
    )
  },
)


onBeforeUnmount(
  () => {
    window.removeEventListener(
      'keydown',
      handleGlobalKeydown,
    )
  },
)


// ======================================================
// Text size
// ======================================================

function handleTextSize(
  value,
) {
  setTextSize(
    value,
  )
}


// ======================================================
// High contrast
// ======================================================

function handleHighContrast(
  event,
) {
  setHighContrast(
    event.target.checked,
  )
}


// ======================================================
// Reduce motion
// ======================================================

function handleReduceMotion(
  event,
) {
  setReduceMotion(
    event.target.checked,
  )
}


// ======================================================
// Readable spacing
// ======================================================

function handleReadableSpacing(
  event,
) {
  setReadableSpacing(
    event.target.checked,
  )
}


// ======================================================
// Reset
// ======================================================

function handleReset() {
  resetAccessibilitySettings()
}
</script>


<template>
  <div
    class="accessibility-widget"
  >

    <!-- ================================================= -->
    <!-- Floating accessibility button -->
    <!-- ================================================= -->

    <button
      ref="triggerButton"
      type="button"
      class="accessibility-trigger"
      :aria-expanded="
        isOpen
          ? 'true'
          : 'false'
      "
      aria-controls="accessibility-panel"
      :aria-label="
        isOpen
          ? 'Close accessibility settings'
          : 'Open accessibility settings'
      "
      @click="
        togglePanel
      "
    >
      <span
        class="
          accessibility-trigger-icon
        "
        aria-hidden="true"
      >
        Aa
      </span>


      <span
        class="
          accessibility-trigger-text
        "
      >
        Accessibility
      </span>
    </button>


    <!-- ================================================= -->
    <!-- Accessibility settings panel -->
    <!-- ================================================= -->

    <section
      v-if="
        isOpen
      "
      id="accessibility-panel"
      class="accessibility-panel"
      aria-labelledby="accessibility-panel-title"
    >

      <!-- =============================================== -->
      <!-- Header -->
      <!-- =============================================== -->

      <div
        class="
          accessibility-panel-header
        "
      >
        <div>
          <p
            class="
              accessibility-eyebrow
            "
          >
            GLOBAL SETTINGS
          </p>


          <h2
            id="accessibility-panel-title"
            class="
              accessibility-panel-title
            "
          >
            Accessibility
          </h2>
        </div>


        <button
          ref="closeButton"
          type="button"
          class="
            accessibility-close
          "
          aria-label="Close accessibility settings"
          @click="
            closePanel
          "
        >
          ×
        </button>
      </div>


      <p
        class="
          accessibility-intro
        "
      >
        Adjust the website to make
        reading and navigation more
        comfortable.

        Your preferences are saved
        on this device.
      </p>


      <!-- ================================================= -->
      <!-- Text size -->
      <!-- ================================================= -->

      <fieldset
        class="
          accessibility-group
        "
      >
        <legend
          class="
            accessibility-group-title
          "
        >
          Text Size
        </legend>


        <p
          class="
            accessibility-current
          "
        >
          Current:
          {{
            currentTextSizeLabel
          }}
        </p>


        <div
          class="
            text-size-options
          "
        >

          <!-- Standard -->

          <label
            class="
              text-size-option
            "
            :class="{
              active:
                accessibilitySettings.textSize ===
                'standard',
            }"
          >
            <input
              type="radio"
              name="global-text-size"
              value="standard"
              :checked="
                accessibilitySettings.textSize ===
                'standard'
              "
              @change="
                handleTextSize(
                  'standard',
                )
              "
            />


            <span
              class="
                text-size-option-content
              "
            >
              <strong>
                Standard
              </strong>

              <small>
                22 px
              </small>
            </span>
          </label>


          <!-- Large -->

          <label
            class="
              text-size-option
            "
            :class="{
              active:
                accessibilitySettings.textSize ===
                'large',
            }"
          >
            <input
              type="radio"
              name="global-text-size"
              value="large"
              :checked="
                accessibilitySettings.textSize ===
                'large'
              "
              @change="
                handleTextSize(
                  'large',
                )
              "
            />


            <span
              class="
                text-size-option-content
              "
            >
              <strong>
                Large
              </strong>

              <small>
                24 px
              </small>
            </span>
          </label>


          <!-- Extra Large -->

          <label
            class="
              text-size-option
            "
            :class="{
              active:
                accessibilitySettings.textSize ===
                'extra-large',
            }"
          >
            <input
              type="radio"
              name="global-text-size"
              value="extra-large"
              :checked="
                accessibilitySettings.textSize ===
                'extra-large'
              "
              @change="
                handleTextSize(
                  'extra-large',
                )
              "
            />


            <span
              class="
                text-size-option-content
              "
            >
              <strong>
                Extra Large
              </strong>

              <small>
                26 px
              </small>
            </span>
          </label>

        </div>
      </fieldset>


      <!-- ================================================= -->
      <!-- High Contrast -->
      <!-- ================================================= -->

      <label
        class="
          accessibility-switch-row
        "
      >
        <span>
          <strong>
            High Contrast
          </strong>

          <small>
            Increase contrast for
            text, borders and controls.
          </small>
        </span>


        <input
          type="checkbox"
          class="
            accessibility-checkbox
          "
          :checked="
            accessibilitySettings.highContrast
          "
          @change="
            handleHighContrast
          "
        />
      </label>


      <!-- ================================================= -->
      <!-- Reduce Motion -->
      <!-- ================================================= -->

      <label
        class="
          accessibility-switch-row
        "
      >
        <span>
          <strong>
            Reduce Motion
          </strong>

          <small>
            Minimise animations and
            interface transitions.
          </small>
        </span>


        <input
          type="checkbox"
          class="
            accessibility-checkbox
          "
          :checked="
            accessibilitySettings.reduceMotion
          "
          @change="
            handleReduceMotion
          "
        />
      </label>


      <!-- ================================================= -->
      <!-- Readable Spacing -->
      <!-- ================================================= -->

      <label
        class="
          accessibility-switch-row
        "
      >
        <span>
          <strong>
            Readable Spacing
          </strong>

          <small>
            Increase line, word and
            letter spacing.
          </small>
        </span>


        <input
          type="checkbox"
          class="
            accessibility-checkbox
          "
          :checked="
            accessibilitySettings.readableSpacing
          "
          @change="
            handleReadableSpacing
          "
        />
      </label>


      <!-- ================================================= -->
      <!-- Reset -->
      <!-- ================================================= -->

      <button
        type="button"
        class="
          accessibility-reset
        "
        @click="
          handleReset
        "
      >
        Reset Settings
      </button>

    </section>

  </div>
</template>


<style scoped>

/* ===================================================== */
/* Widget */
/* ===================================================== */

.accessibility-widget {
  position:
    fixed;

  right:
    1rem;

  bottom:
    1rem;

  z-index:
    1055;
}


/* ===================================================== */
/* Floating button */
/* ===================================================== */

.accessibility-trigger {
  display:
    inline-flex;

  align-items:
    center;

  gap:
    0.55rem;

  min-height:
    52px;

  padding:
    0.65rem
    0.9rem;

  color:
    #ffffff;

  background:
    #0b5d1e;

  border:
    2px solid
    #ffffff;

  border-radius:
    999px;

  box-shadow:
    0 0.35rem 1rem
    rgba(
      0,
      0,
      0,
      0.24
    );

  font-weight:
    700;

  cursor:
    pointer;
}


.accessibility-trigger:hover {
  background:
    #084b18;
}


/* ===================================================== */
/* Aa icon */
/* ===================================================== */

.accessibility-trigger-icon {
  display:
    inline-flex;

  align-items:
    center;

  justify-content:
    center;

  min-width:
    2rem;

  min-height:
    2rem;

  padding:
    0.2rem;

  color:
    #0b5d1e;

  background:
    #ffffff;

  border-radius:
    50%;

  font-size:
    0.9rem;

  font-weight:
    800;
}


/* ===================================================== */
/* Panel */
/* ===================================================== */

.accessibility-panel {
  position:
    absolute;

  right:
    0;

  bottom:
    calc(
      100% + 0.75rem
    );

  width:
    min(
      430px,
      calc(
        100vw - 2rem
      )
    );

  max-height:
    min(
      760px,
      calc(
        100vh - 6rem
      )
    );

  overflow-y:
    auto;

  padding:
    1.15rem;

  color:
    #212529;

  background:
    #ffffff;

  border:
    2px solid
    #146c43;

  border-radius:
    16px;

  box-shadow:
    0 0.5rem 1.5rem
    rgba(
      0,
      0,
      0,
      0.24
    );
}


/* ===================================================== */
/* Panel header */
/* ===================================================== */

.accessibility-panel-header {
  display:
    flex;

  align-items:
    flex-start;

  justify-content:
    space-between;

  gap:
    1rem;
}


.accessibility-eyebrow {
  margin:
    0 0 0.2rem;

  color:
    #146c43;

  font-size:
    0.68rem;

  font-weight:
    800;

  letter-spacing:
    0.1em;
}


.accessibility-panel-title {
  margin:
    0;

  font-size:
    1.25rem;

  font-weight:
    800;
}


.accessibility-intro {
  margin:
    0.8rem
    0
    1rem;

  color:
    #495057;

  font-size:
    0.85rem;

  line-height:
    1.5;
}


/* ===================================================== */
/* Close button */
/* ===================================================== */

.accessibility-close {
  display:
    inline-flex;

  align-items:
    center;

  justify-content:
    center;

  width:
    44px;

  height:
    44px;

  flex:
    0 0 auto;

  color:
    #212529;

  background:
    #ffffff;

  border:
    1px solid
    #6c757d;

  border-radius:
    10px;

  font-size:
    1.45rem;

  line-height:
    1;

  cursor:
    pointer;
}


.accessibility-close:hover {
  background:
    #f1f3f5;
}


/* ===================================================== */
/* Groups */
/* ===================================================== */

.accessibility-group {
  margin:
    0 0 1rem;

  padding:
    0;

  border:
    0;
}


.accessibility-group-title {
  margin:
    0;

  font-size:
    0.95rem;

  font-weight:
    800;
}


.accessibility-current {
  margin:
    0.25rem
    0
    0.65rem;

  color:
    #495057;

  font-size:
    0.78rem;
}


/* ===================================================== */
/* Text size options */
/* ===================================================== */
/*
  One option per row.

  This layout is intentionally used because the global
  text sizes are large (22 / 24 / 26 px), so labels should
  not be forced into narrow three-column cards.
*/

.text-size-options {
  display:
    grid;

  grid-template-columns:
    1fr;

  gap:
    0.6rem;
}


.text-size-option {
  display:
    flex;

  flex-direction:
    row;

  align-items:
    center;

  justify-content:
    flex-start;

  gap:
    0.8rem;

  min-height:
    68px;

  width:
    100%;

  padding:
    0.7rem
    0.85rem;

  text-align:
    left;

  background:
    #ffffff;

  border:
    2px solid
    #ced4da;

  border-radius:
    12px;

  cursor:
    pointer;

  transition:
    background-color
    0.15s
    ease,
    border-color
    0.15s
    ease;
}


.text-size-option:hover {
  border-color:
    #6c757d;

  background:
    #f8f9fa;
}


.text-size-option.active {
  background:
    #eaf7ee;

  border-color:
    #146c43;
}


/* Radio */

.text-size-option input {
  width:
    22px;

  height:
    22px;

  flex:
    0 0 auto;

  margin:
    0;

  accent-color:
    #146c43;
}


/* Label + px */

.text-size-option-content {
  display:
    flex;

  flex-direction:
    row;

  align-items:
    center;

  justify-content:
    space-between;

  gap:
    1rem;

  width:
    100%;

  min-width:
    0;
}


.text-size-option strong {
  font-size:
    0.82rem;

  white-space:
    nowrap;
}


.text-size-option small {
  flex:
    0 0 auto;

  color:
    #495057;

  font-size:
    0.72rem;

  white-space:
    nowrap;
}


/* ===================================================== */
/* Option rows */
/* ===================================================== */

.accessibility-switch-row {
  display:
    flex;

  align-items:
    center;

  justify-content:
    space-between;

  gap:
    1rem;

  margin:
    0 0 0.65rem;

  padding:
    0.75rem;

  background:
    #f8f9fa;

  border:
    1px solid
    #ced4da;

  border-radius:
    12px;

  cursor:
    pointer;
}


.accessibility-switch-row:hover {
  border-color:
    #6c757d;
}


.accessibility-switch-row span {
  display:
    flex;

  flex-direction:
    column;

  gap:
    0.15rem;

  min-width:
    0;
}


.accessibility-switch-row strong {
  font-size:
    0.82rem;
}


.accessibility-switch-row small {
  color:
    #495057;

  font-size:
    0.7rem;

  line-height:
    1.45;
}


.accessibility-checkbox {
  width:
    24px;

  height:
    24px;

  flex:
    0 0 auto;

  accent-color:
    #146c43;
}


/* ===================================================== */
/* Reset */
/* ===================================================== */

.accessibility-reset {
  width:
    100%;

  min-height:
    48px;

  margin-top:
    0.3rem;

  color:
    #0b5d1e;

  background:
    #ffffff;

  border:
    2px solid
    #0b5d1e;

  border-radius:
    10px;

  font-weight:
    800;

  cursor:
    pointer;
}


.accessibility-reset:hover {
  color:
    #ffffff;

  background:
    #0b5d1e;
}


/* ===================================================== */
/* Mobile */
/* ===================================================== */

@media (
  max-width: 576px
) {
  .accessibility-widget {
    right:
      0.65rem;

    bottom:
      0.65rem;
  }


  .accessibility-trigger-text {
    display:
      none;
  }


  .accessibility-trigger {
    width:
      58px;

    height:
      58px;

    padding:
      0;

    justify-content:
      center;
  }


  .accessibility-panel {
    width:
      calc(
        100vw - 1.3rem
      );

    max-height:
      calc(
        100vh - 5rem
      );

    padding:
      1rem;
  }


  .text-size-option {
    min-height:
      64px;

    padding:
      0.65rem
      0.75rem;
  }


  .text-size-option-content {
    gap:
      0.6rem;
  }
}

</style>