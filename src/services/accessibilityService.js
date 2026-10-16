import {
  reactive,
} from 'vue'


// ======================================================
// Storage
// ======================================================

const STORAGE_KEY =
  'zwv.accessibilityPreferences'


// ======================================================
// Default accessibility settings
// ======================================================
//
// Default text size is intentionally large.
//
// Standard     = 22 px
// Large        = 24 px
// Extra Large  = 26 px
// ======================================================

export const DEFAULT_ACCESSIBILITY_SETTINGS = {
  textSize:
    'standard',

  highContrast:
    false,

  reduceMotion:
    false,

  readableSpacing:
    false,
}


// ======================================================
// Allowed text sizes
// ======================================================

const ALLOWED_TEXT_SIZES =
  new Set([
    'standard',
    'large',
    'extra-large',
  ])


// ======================================================
// Load saved preferences
// ======================================================

function loadSavedSettings() {
  if (
    typeof window ===
    'undefined'
  ) {
    return {
      ...DEFAULT_ACCESSIBILITY_SETTINGS,
    }
  }


  try {
    const raw =
      window.localStorage.getItem(
        STORAGE_KEY,
      )


    if (!raw) {
      return {
        ...DEFAULT_ACCESSIBILITY_SETTINGS,
      }
    }


    const saved =
      JSON.parse(
        raw,
      )


    return {
      textSize:
        ALLOWED_TEXT_SIZES.has(
          saved?.textSize,
        )
          ? saved.textSize
          : DEFAULT_ACCESSIBILITY_SETTINGS.textSize,

      highContrast:
        saved?.highContrast ===
        true,

      reduceMotion:
        saved?.reduceMotion ===
        true,

      readableSpacing:
        saved?.readableSpacing ===
        true,
    }
  } catch (error) {
    console.error(
      'Unable to load accessibility preferences:',
      error,
    )


    return {
      ...DEFAULT_ACCESSIBILITY_SETTINGS,
    }
  }
}


// ======================================================
// Reactive global settings
// ======================================================

export const accessibilitySettings =
  reactive(
    loadSavedSettings(),
  )


// ======================================================
// Apply settings globally
// ======================================================
//
// Settings are written to <html> as data attributes.
//
// Example:
//
// <html
//   data-text-size="large"
//   data-high-contrast="true"
//   data-reduced-motion="false"
//   data-readable-spacing="true"
// >
//
// accessibility.css then applies styles globally.
// ======================================================

export function applyAccessibilitySettings() {
  if (
    typeof document ===
    'undefined'
  ) {
    return
  }


  const root =
    document.documentElement


  root.dataset.textSize =
    accessibilitySettings.textSize


  root.dataset.highContrast =
    accessibilitySettings.highContrast
      ? 'true'
      : 'false'


  root.dataset.reducedMotion =
    accessibilitySettings.reduceMotion
      ? 'true'
      : 'false'


  root.dataset.readableSpacing =
    accessibilitySettings.readableSpacing
      ? 'true'
      : 'false'
}


// ======================================================
// Save preferences
// ======================================================

function saveAccessibilitySettings() {
  if (
    typeof window ===
    'undefined'
  ) {
    return
  }


  try {
    window.localStorage.setItem(
      STORAGE_KEY,

      JSON.stringify({
        textSize:
          accessibilitySettings.textSize,

        highContrast:
          accessibilitySettings.highContrast,

        reduceMotion:
          accessibilitySettings.reduceMotion,

        readableSpacing:
          accessibilitySettings.readableSpacing,
      }),
    )
  } catch (error) {
    console.error(
      'Unable to save accessibility preferences:',
      error,
    )
  }
}


// ======================================================
// Apply + save
// ======================================================

function commitSettings() {
  applyAccessibilitySettings()

  saveAccessibilitySettings()
}


// ======================================================
// Text size
// ======================================================

export function setTextSize(
  textSize,
) {
  if (
    !ALLOWED_TEXT_SIZES.has(
      textSize,
    )
  ) {
    return
  }


  accessibilitySettings.textSize =
    textSize


  commitSettings()
}


// ======================================================
// High contrast
// ======================================================

export function setHighContrast(
  enabled,
) {
  accessibilitySettings.highContrast =
    Boolean(
      enabled,
    )


  commitSettings()
}


// ======================================================
// Reduced motion
// ======================================================

export function setReduceMotion(
  enabled,
) {
  accessibilitySettings.reduceMotion =
    Boolean(
      enabled,
    )


  commitSettings()
}


// ======================================================
// Readable spacing
// ======================================================

export function setReadableSpacing(
  enabled,
) {
  accessibilitySettings.readableSpacing =
    Boolean(
      enabled,
    )


  commitSettings()
}


// ======================================================
// Reset accessibility preferences
// ======================================================

export function resetAccessibilitySettings() {
  accessibilitySettings.textSize =
    DEFAULT_ACCESSIBILITY_SETTINGS.textSize


  accessibilitySettings.highContrast =
    DEFAULT_ACCESSIBILITY_SETTINGS.highContrast


  accessibilitySettings.reduceMotion =
    DEFAULT_ACCESSIBILITY_SETTINGS.reduceMotion


  accessibilitySettings.readableSpacing =
    DEFAULT_ACCESSIBILITY_SETTINGS.readableSpacing


  commitSettings()
}


// ======================================================
// Apply saved settings immediately
// ======================================================
//
// When the application loads or the page refreshes,
// saved preferences are restored automatically.
// ======================================================

applyAccessibilitySettings()