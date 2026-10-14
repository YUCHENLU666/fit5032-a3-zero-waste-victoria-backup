<script setup>
import {
  computed,
  nextTick,
  ref,
} from 'vue'

import {
  sendEmail,
} from '../services/emailService'


// ======================================================
// Form fields
// ======================================================

const to =
  ref('')

const subject =
  ref('')

const message =
  ref('')

const selectedFile =
  ref(null)


// ======================================================
// Input references
//
// Used to move keyboard focus to the first invalid field.
// ======================================================

const recipientInput =
  ref(null)

const subjectInput =
  ref(null)

const messageInput =
  ref(null)

const fileInput =
  ref(null)


// ======================================================
// Submission state
// ======================================================

const isSending =
  ref(false)

const successMessage =
  ref('')

const errorMessage =
  ref('')


// ======================================================
// Validation errors
// ======================================================

const toError =
  ref('')

const subjectError =
  ref('')

const messageError =
  ref('')

const fileError =
  ref('')


// ======================================================
// File limits
// ======================================================

const MAX_FILE_SIZE =
  2 * 1024 * 1024


// ======================================================
// Character counts
// ======================================================

const subjectLength =
  computed(() =>
    subject.value.length,
  )

const messageLength =
  computed(() =>
    message.value.length,
  )


// ======================================================
// Selected file information
// ======================================================

const selectedFileName =
  computed(() =>
    selectedFile.value
      ? selectedFile.value.name
      : '',
  )


const selectedFileSize =
  computed(() => {
    if (
      !selectedFile.value
    ) {
      return ''
    }

    return formatFileSize(
      selectedFile.value.size,
    )
  })


// ======================================================
// File size formatting
// ======================================================

function formatFileSize(
  bytes,
) {
  if (
    bytes < 1024
  ) {
    return `${bytes} B`
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`
}


// ======================================================
// Email validation
// ======================================================

function validateEmail(
  email,
) {
  const pattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  return pattern.test(
    email,
  )
}


// ======================================================
// Clear validation errors
// ======================================================

function clearValidationErrors() {
  toError.value = ''
  subjectError.value = ''
  messageError.value = ''
  fileError.value = ''
}


// ======================================================
// Validate form
// ======================================================

function validateForm() {
  clearValidationErrors()

  let isValid = true


  const trimmedTo =
    to.value.trim()

  const trimmedSubject =
    subject.value.trim()

  const trimmedMessage =
    message.value.trim()


  // --------------------------------------------------
  // Recipient
  // --------------------------------------------------

  if (!trimmedTo) {
    toError.value =
      'Recipient email is required.'

    isValid = false
  } else if (
    !validateEmail(
      trimmedTo,
    )
  ) {
    toError.value =
      'Please enter a valid email address.'

    isValid = false
  }


  // --------------------------------------------------
  // Subject
  // --------------------------------------------------

  if (!trimmedSubject) {
    subjectError.value =
      'Subject is required.'

    isValid = false
  } else if (
    trimmedSubject.length >
    150
  ) {
    subjectError.value =
      'Subject must not exceed 150 characters.'

    isValid = false
  }


  // --------------------------------------------------
  // Message
  // --------------------------------------------------

  if (!trimmedMessage) {
    messageError.value =
      'Message is required.'

    isValid = false
  } else if (
    trimmedMessage.length >
    5000
  ) {
    messageError.value =
      'Message must not exceed 5000 characters.'

    isValid = false
  }


  // --------------------------------------------------
  // Attachment
  // --------------------------------------------------

  if (
    selectedFile.value &&
    selectedFile.value.size >
      MAX_FILE_SIZE
  ) {
    fileError.value =
      'Attachment must be smaller than 2 MB.'

    isValid = false
  }


  return isValid
}


// ======================================================
// Focus first invalid field
// ======================================================

async function focusFirstError() {
  await nextTick()


  if (
    toError.value
  ) {
    recipientInput.value
      ?.focus()

    return
  }


  if (
    subjectError.value
  ) {
    subjectInput.value
      ?.focus()

    return
  }


  if (
    messageError.value
  ) {
    messageInput.value
      ?.focus()

    return
  }


  if (
    fileError.value
  ) {
    fileInput.value
      ?.focus()
  }
}


// ======================================================
// File selection
// ======================================================

async function handleFileChange(
  event,
) {
  fileError.value = ''

  const file =
    event.target.files?.[0]


  if (!file) {
    selectedFile.value =
      null

    return
  }


  if (
    file.size >
    MAX_FILE_SIZE
  ) {
    fileError.value =
      'Attachment must be smaller than 2 MB.'

    selectedFile.value =
      null


    if (
      fileInput.value
    ) {
      fileInput.value.value =
        ''
    }


    await nextTick()

    fileInput.value
      ?.focus()

    return
  }


  selectedFile.value =
    file
}


// ======================================================
// Remove attachment
// ======================================================

function removeFile() {
  selectedFile.value =
    null

  fileError.value =
    ''


  if (
    fileInput.value
  ) {
    fileInput.value.value =
      ''
  }


  fileInput.value
    ?.focus()
}


// ======================================================
// Reset form
// ======================================================

function resetForm() {
  to.value = ''
  subject.value = ''
  message.value = ''

  selectedFile.value =
    null


  clearValidationErrors()


  if (
    fileInput.value
  ) {
    fileInput.value.value =
      ''
  }
}


// ======================================================
// Convert Cloud Function errors into readable messages
// ======================================================

function getErrorMessage(
  error,
) {
  if (
    error?.code ===
    'functions/unauthenticated'
  ) {
    return (
      'You must be signed in to send an email.'
    )
  }


  if (
    error?.code ===
    'functions/invalid-argument'
  ) {
    return (
      error.message ||
      'Please check the email form and try again.'
    )
  }


  if (
    error?.code ===
    'functions/internal'
  ) {
    return (
      error.message ||
      'The email service could not send your message.'
    )
  }


  return (
    error?.message ||
    'Something went wrong while sending the email.'
  )
}


// ======================================================
// Submit email
// ======================================================

async function handleSubmit() {
  successMessage.value =
    ''

  errorMessage.value =
    ''


  // --------------------------------------------------
  // Client-side validation
  // --------------------------------------------------

  const isValid =
    validateForm()


  if (!isValid) {
    await focusFirstError()

    return
  }


  // --------------------------------------------------
  // Send email
  // --------------------------------------------------

  isSending.value =
    true


  try {
    const result =
      await sendEmail({
        to:
          to.value.trim(),

        subject:
          subject.value.trim(),

        message:
          message.value.trim(),

        file:
          selectedFile.value,
      })


    successMessage.value =
      result?.emailId
        ? `Email sent successfully. Email ID: ${result.emailId}`
        : 'Email sent successfully.'


    resetForm()
  } catch (error) {
    console.error(
      'Email sending failed:',
      error,
    )


    errorMessage.value =
      getErrorMessage(
        error,
      )
  } finally {
    isSending.value =
      false
  }
}
</script>


<template>
  <main
    class="email-page"
    aria-labelledby="email-page-title"
  >
    <div
      class="
        container
        py-5
      "
    >
      <div
        class="
          row
          justify-content-center
        "
      >
        <div
          class="
            col-12
            col-lg-8
          "
        >

          <!-- ================================================= -->
          <!-- Header -->
          <!-- ================================================= -->

          <div
            class="
              email-header
              mb-4
            "
          >

            <p
              class="
                email-eyebrow
                mb-2
              "
            >
              ZWV CIRCULAR HUB
            </p>


            <h1
              id="email-page-title"
              class="
                display-6
                fw-bold
                mb-2
              "
            >
              Send an Email
            </h1>


            <p
              class="
                text-secondary
                mb-0
              "
            >
              Send a message securely
              through our Firebase
              Cloud Function and Resend
              email service.
            </p>

          </div>


          <!-- ================================================= -->
          <!-- Success feedback -->
          <!-- ================================================= -->

          <div
            v-if="
              successMessage
            "
            class="
              alert
              alert-success
            "
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {{
              successMessage
            }}
          </div>


          <!-- ================================================= -->
          <!-- Server / network error -->
          <!-- ================================================= -->

          <div
            v-if="
              errorMessage
            "
            class="
              alert
              alert-danger
            "
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            {{
              errorMessage
            }}
          </div>


          <div
            class="
              card
              email-card
              shadow-sm
            "
          >
            <div
              class="
                card-body
                p-4
                p-md-5
              "
            >

              <form
                novalidate
                @submit.prevent="
                  handleSubmit
                "
              >

                <!-- =========================================== -->
                <!-- Recipient -->
                <!-- =========================================== -->

                <div
                  class="mb-4"
                >

                  <label
                    for="email-recipient"
                    class="
                      form-label
                      fw-semibold
                    "
                  >
                    Recipient Email

                    <span
                      class="
                        text-danger
                      "
                      aria-hidden="true"
                    >
                      *
                    </span>

                    <span
                      class="
                        visually-hidden
                      "
                    >
                      required
                    </span>
                  </label>


                  <input
                    id="email-recipient"
                    ref="recipientInput"
                    v-model="to"
                    type="email"
                    class="
                      form-control
                      form-control-lg
                    "
                    :class="{
                      'is-invalid':
                        toError,
                    }"
                    placeholder="recipient@example.com"
                    autocomplete="email"
                    required
                    aria-required="true"
                    :aria-invalid="
                      toError
                        ? 'true'
                        : 'false'
                    "
                    :aria-describedby="
                      toError
                        ? 'recipient-help recipient-error'
                        : 'recipient-help'
                    "
                    :disabled="
                      isSending
                    "
                  />


                  <div
                    id="recipient-help"
                    class="
                      form-text
                    "
                  >
                    Enter the email
                    address that should
                    receive the message.
                  </div>


                  <div
                    v-if="
                      toError
                    "
                    id="recipient-error"
                    class="
                      invalid-feedback
                    "
                    role="alert"
                  >
                    {{
                      toError
                    }}
                  </div>

                </div>


                <!-- =========================================== -->
                <!-- Subject -->
                <!-- =========================================== -->

                <div
                  class="mb-4"
                >

                  <div
                    class="
                      d-flex
                      justify-content-between
                      align-items-center
                      gap-3
                    "
                  >

                    <label
                      for="email-subject"
                      class="
                        form-label
                        fw-semibold
                      "
                    >
                      Subject

                      <span
                        class="
                          text-danger
                        "
                        aria-hidden="true"
                      >
                        *
                      </span>

                      <span
                        class="
                          visually-hidden
                        "
                      >
                        required
                      </span>
                    </label>


                    <small
                      id="subject-count"
                      class="
                        text-secondary
                      "
                    >
                      {{
                        subjectLength
                      }}/150
                    </small>

                  </div>


                  <input
                    id="email-subject"
                    ref="subjectInput"
                    v-model="subject"
                    type="text"
                    maxlength="150"
                    class="
                      form-control
                    "
                    :class="{
                      'is-invalid':
                        subjectError,
                    }"
                    placeholder="Enter email subject"
                    required
                    aria-required="true"
                    :aria-invalid="
                      subjectError
                        ? 'true'
                        : 'false'
                    "
                    :aria-describedby="
                      subjectError
                        ? 'subject-help subject-count subject-error'
                        : 'subject-help subject-count'
                    "
                    :disabled="
                      isSending
                    "
                  />


                  <div
                    id="subject-help"
                    class="
                      form-text
                    "
                  >
                    Maximum
                    150 characters.
                  </div>


                  <div
                    v-if="
                      subjectError
                    "
                    id="subject-error"
                    class="
                      invalid-feedback
                    "
                    role="alert"
                  >
                    {{
                      subjectError
                    }}
                  </div>

                </div>


                <!-- =========================================== -->
                <!-- Message -->
                <!-- =========================================== -->

                <div
                  class="mb-4"
                >

                  <div
                    class="
                      d-flex
                      justify-content-between
                      align-items-center
                      gap-3
                    "
                  >

                    <label
                      for="email-message"
                      class="
                        form-label
                        fw-semibold
                      "
                    >
                      Message

                      <span
                        class="
                          text-danger
                        "
                        aria-hidden="true"
                      >
                        *
                      </span>

                      <span
                        class="
                          visually-hidden
                        "
                      >
                        required
                      </span>
                    </label>


                    <small
                      id="message-count"
                      class="
                        text-secondary
                      "
                    >
                      {{
                        messageLength
                      }}/5000
                    </small>

                  </div>


                  <textarea
                    id="email-message"
                    ref="messageInput"
                    v-model="message"
                    rows="8"
                    maxlength="5000"
                    class="
                      form-control
                    "
                    :class="{
                      'is-invalid':
                        messageError,
                    }"
                    placeholder="Write your message here..."
                    required
                    aria-required="true"
                    :aria-invalid="
                      messageError
                        ? 'true'
                        : 'false'
                    "
                    :aria-describedby="
                      messageError
                        ? 'message-help message-count message-error'
                        : 'message-help message-count'
                    "
                    :disabled="
                      isSending
                    "
                  ></textarea>


                  <div
                    id="message-help"
                    class="
                      form-text
                    "
                  >
                    Maximum
                    5000 characters.
                  </div>


                  <div
                    v-if="
                      messageError
                    "
                    id="message-error"
                    class="
                      invalid-feedback
                    "
                    role="alert"
                  >
                    {{
                      messageError
                    }}
                  </div>

                </div>


                <!-- =========================================== -->
                <!-- Attachment -->
                <!-- =========================================== -->

                <div
                  class="mb-4"
                >

                  <label
                    for="email-attachment"
                    class="
                      form-label
                      fw-semibold
                    "
                  >
                    Attachment

                    <span
                      class="
                        text-secondary
                        fw-normal
                      "
                    >
                      (Optional)
                    </span>
                  </label>


                  <input
                    id="email-attachment"
                    ref="fileInput"
                    type="file"
                    class="
                      form-control
                    "
                    :class="{
                      'is-invalid':
                        fileError,
                    }"
                    accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg"
                    :aria-invalid="
                      fileError
                        ? 'true'
                        : 'false'
                    "
                    :aria-describedby="
                      fileError
                        ? 'attachment-help attachment-error'
                        : 'attachment-help'
                    "
                    :disabled="
                      isSending
                    "
                    @change="
                      handleFileChange
                    "
                  />


                  <div
                    id="attachment-help"
                    class="
                      form-text
                    "
                  >
                    Maximum file size:
                    2 MB.

                    Supported examples:
                    PDF, Word, text and
                    image files.
                  </div>


                  <div
                    v-if="
                      fileError
                    "
                    id="attachment-error"
                    class="
                      invalid-feedback
                    "
                    role="alert"
                  >
                    {{
                      fileError
                    }}
                  </div>


                  <!-- ========================================= -->
                  <!-- Selected attachment -->
                  <!-- ========================================= -->

                  <div
                    v-if="
                      selectedFile
                    "
                    class="
                      selected-file
                      mt-3
                    "
                    role="status"
                    aria-live="polite"
                  >

                    <div>

                      <div
                        class="
                          fw-semibold
                        "
                      >
                        {{
                          selectedFileName
                        }}
                      </div>


                      <small
                        class="
                          text-secondary
                        "
                      >
                        {{
                          selectedFileSize
                        }}
                      </small>

                    </div>


                    <button
                      type="button"
                      class="
                        btn
                        btn-sm
                        btn-outline-danger
                      "
                      :disabled="
                        isSending
                      "
                      :aria-label="
                        `Remove attachment ${selectedFileName}`
                      "
                      @click="
                        removeFile
                      "
                    >
                      Remove
                    </button>

                  </div>

                </div>


                <hr
                  class="my-4"
                />


                <!-- =========================================== -->
                <!-- Actions -->
                <!-- =========================================== -->

                <div
                  class="
                    d-flex
                    flex-column
                    flex-sm-row
                    gap-3
                    justify-content-between
                    align-items-sm-center
                  "
                >

                  <p
                    class="
                      small
                      text-secondary
                      mb-0
                    "
                  >
                    <span
                      class="
                        text-danger
                      "
                      aria-hidden="true"
                    >
                      *
                    </span>

                    Required fields
                  </p>


                  <div
                    class="
                      d-flex
                      gap-2
                    "
                  >

                    <button
                      type="button"
                      class="
                        btn
                        btn-outline-secondary
                      "
                      :disabled="
                        isSending
                      "
                      @click="
                        resetForm
                      "
                    >
                      Clear
                    </button>


                    <button
                      type="submit"
                      class="
                        btn
                        btn-success
                        px-4
                      "
                      :disabled="
                        isSending
                      "
                      :aria-busy="
                        isSending
                          ? 'true'
                          : 'false'
                      "
                    >

                      <span
                        v-if="
                          isSending
                        "
                        class="
                          spinner-border
                          spinner-border-sm
                          me-2
                        "
                        aria-hidden="true"
                      ></span>


                      {{
                        isSending
                          ? 'Sending...'
                          : 'Send Email'
                      }}

                    </button>

                  </div>

                </div>

              </form>

            </div>
          </div>


          <!-- ================================================= -->
          <!-- Security note -->
          <!-- ================================================= -->

          <aside
            class="
              security-note
              mt-4
            "
            aria-labelledby="email-security-title"
          >

            <h2
              id="email-security-title"
              class="
                h6
                fw-semibold
                mb-1
              "
            >
              Secure email delivery
            </h2>


            <p
              class="
                small
                text-secondary
                mb-0
              "
            >
              Emails are processed
              through a protected
              Firebase Cloud Function.

              The Resend API key is
              stored securely in Firebase
              Secret Manager and is never
              exposed to the browser.
            </p>

          </aside>

        </div>
      </div>
    </div>
  </main>
</template>


<style scoped>

/* ===================================================== */
/* Page */
/* ===================================================== */

.email-page {
  min-height:
    calc(
      100vh - 70px
    );

  background:
    linear-gradient(
      180deg,
      #f6fbf7 0%,
      #ffffff 45%
    );
}


/* ===================================================== */
/* Header */
/* ===================================================== */

.email-eyebrow {
  font-size:
    0.78rem;

  font-weight:
    700;

  letter-spacing:
    0.14em;

  /*
    Darker green improves
    contrast on light backgrounds.
  */
  color:
    #146c43;
}


/* ===================================================== */
/* Email card */
/* ===================================================== */

.email-card {
  border:
    1px solid
    rgba(
      25,
      135,
      84,
      0.12
    );

  border-radius:
    18px;
}


/* ===================================================== */
/* Form controls */
/* ===================================================== */

.form-control {
  border-radius:
    10px;
}


.form-control:focus {
  border-color:
    #198754;

  box-shadow:
    0 0 0 0.2rem
    rgba(
      25,
      135,
      84,
      0.15
    );
}


.form-control.is-invalid:focus {
  box-shadow:
    0 0 0 0.2rem
    rgba(
      220,
      53,
      69,
      0.18
    );
}


/* ===================================================== */
/* Selected attachment */
/* ===================================================== */

.selected-file {
  display:
    flex;

  align-items:
    center;

  justify-content:
    space-between;

  gap:
    1rem;

  padding:
    0.9rem 1rem;

  background-color:
    #f8f9fa;

  border:
    1px solid
    #dee2e6;

  border-radius:
    10px;
}


/* ===================================================== */
/* Security note */
/* ===================================================== */

.security-note {
  padding:
    1rem 1.25rem;

  background-color:
    rgba(
      25,
      135,
      84,
      0.06
    );

  border-left:
    4px solid
    #198754;

  border-radius:
    8px;
}


/* ===================================================== */
/* Message area */
/* ===================================================== */

textarea {
  resize:
    vertical;

  min-height:
    180px;
}


/* ===================================================== */
/* Reduced motion fallback */
/* ===================================================== */

@media (
  prefers-reduced-motion: reduce
) {
  *,
  *::before,
  *::after {
    transition:
      none !important;
  }
}


/* ===================================================== */
/* Mobile */
/* ===================================================== */

@media (
  max-width: 576px
) {
  .email-card
  .card-body {
    padding:
      1.5rem !important;
  }
}
</style>