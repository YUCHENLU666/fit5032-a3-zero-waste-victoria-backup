<script setup>
import {
  computed,
  ref,
  watch,
} from 'vue'

import {
  sendBulkEmail,
} from '../services/emailService'


// ======================================================
// Props
// ======================================================
//
// AdminView already loads registered users from Firestore.
//
// Instead of requesting the same data again, this component
// receives the existing user list from AdminView.
// ======================================================

const props =
  defineProps({
    users: {
      type: Array,

      default:
        () => [],
    },
  })


// ======================================================
// Campaign form state
// ======================================================

const searchQuery =
  ref('')

const selectedUids =
  ref([])

const subject =
  ref('')

const message =
  ref('')


// ======================================================
// UI state
// ======================================================

const isSending =
  ref(false)

const showPreview =
  ref(false)

const successMessage =
  ref('')

const errorMessage =
  ref('')

const campaignResult =
  ref(null)


// ======================================================
// Form limits
// ======================================================

const MAX_SUBJECT_LENGTH =
  150

const MAX_MESSAGE_LENGTH =
  5000

const MAX_RECIPIENTS =
  100


// ======================================================
// Community users
// ======================================================
//
// Bulk Email is intended for normal community users.
//
// Administrator accounts are deliberately excluded from
// the selectable campaign audience.
// ======================================================

const communityUsers =
  computed(() => {
    return props.users.filter(
      (user) => {
        return (
          user &&
          user.id &&
          user.role ===
            'user'
        )
      },
    )
  })


// ======================================================
// Search users
// ======================================================

const filteredUsers =
  computed(() => {
    const query =
      searchQuery.value
        .trim()
        .toLowerCase()


    if (!query) {
      return communityUsers.value
    }


    return communityUsers.value.filter(
      (user) => {
        const username =
          (
            user.username ||
            ''
          ).toLowerCase()

        const email =
          (
            user.email ||
            ''
          ).toLowerCase()


        return (
          username.includes(
            query,
          ) ||
          email.includes(
            query,
          )
        )
      },
    )
  })


// ======================================================
// Selected users
// ======================================================

const selectedUsers =
  computed(() => {
    const selectedSet =
      new Set(
        selectedUids.value,
      )


    return communityUsers.value.filter(
      (user) =>
        selectedSet.has(
          user.id,
        ),
    )
  })


// ======================================================
// Selected recipient count
// ======================================================

const selectedCount =
  computed(() => {
    return selectedUsers.value.length
  })


// ======================================================
// Character counts
// ======================================================

const subjectLength =
  computed(() => {
    return subject.value.length
  })


const messageLength =
  computed(() => {
    return message.value.length
  })


// ======================================================
// Maximum selectable users
// ======================================================

const selectableUserCount =
  computed(() => {
    return Math.min(
      communityUsers.value.length,
      MAX_RECIPIENTS,
    )
  })


// ======================================================
// Form validity
// ======================================================

const isFormValid =
  computed(() => {
    const cleanSubject =
      subject.value.trim()

    const cleanMessage =
      message.value.trim()


    return (
      selectedCount.value >
        0 &&
      selectedCount.value <=
        MAX_RECIPIENTS &&
      cleanSubject.length >
        0 &&
      cleanSubject.length <=
        MAX_SUBJECT_LENGTH &&
      cleanMessage.length >
        0 &&
      cleanMessage.length <=
        MAX_MESSAGE_LENGTH
    )
  })


// ======================================================
// Check whether maximum selectable users are selected
// ======================================================

const allCommunityUsersSelected =
  computed(() => {
    if (
      selectableUserCount.value ===
      0
    ) {
      return false
    }


    const selectableIds =
      communityUsers.value
        .slice(
          0,
          MAX_RECIPIENTS,
        )
        .map(
          (user) =>
            user.id,
        )


    return selectableIds.every(
      (uid) =>
        selectedUids.value.includes(
          uid,
        ),
    )
  })


// ======================================================
// Clean selected IDs when user data changes
// ======================================================
//
// For example, if the administrator refreshes the user
// list, any selected UID that no longer exists is removed.
// ======================================================

watch(
  communityUsers,

  (users) => {
    const validIds =
      new Set(
        users.map(
          (user) =>
            user.id,
        ),
      )


    selectedUids.value =
      selectedUids.value.filter(
        (uid) =>
          validIds.has(
            uid,
          ),
      )
  },
)


// ======================================================
// Clear status messages
// ======================================================

function clearStatus() {
  successMessage.value =
    ''

  errorMessage.value =
    ''

  campaignResult.value =
    null
}


// ======================================================
// Handle campaign content changes
// ======================================================
//
// Using a dedicated handler avoids placing multiple
// JavaScript statements inside a Vue template directive.
// ======================================================

function handleContentChange() {
  showPreview.value =
    false

  clearStatus()
}


// ======================================================
// Select all available community users
// ======================================================

function selectAllUsers() {
  clearStatus()

  showPreview.value =
    false


  selectedUids.value =
    communityUsers.value
      .slice(
        0,
        MAX_RECIPIENTS,
      )
      .map(
        (user) =>
          user.id,
      )
}


// ======================================================
// Clear selected users
// ======================================================

function clearSelection() {
  clearStatus()

  selectedUids.value =
    []

  showPreview.value =
    false
}


// ======================================================
// Toggle one recipient
// ======================================================

function handleRecipientChange() {
  clearStatus()

  showPreview.value =
    false
}


// ======================================================
// Open campaign preview
// ======================================================

function openPreview() {
  clearStatus()


  if (
    selectedCount.value <
    1
  ) {
    errorMessage.value =
      'Please select at least one community user.'

    return
  }


  if (
    selectedCount.value >
    MAX_RECIPIENTS
  ) {
    errorMessage.value =
      `A maximum of ${MAX_RECIPIENTS} recipients can be selected.`

    return
  }


  const cleanSubject =
    subject.value.trim()

  const cleanMessage =
    message.value.trim()


  if (
    cleanSubject.length <
      1 ||
    cleanSubject.length >
      MAX_SUBJECT_LENGTH
  ) {
    errorMessage.value =
      `Subject must be between 1 and ${MAX_SUBJECT_LENGTH} characters.`

    return
  }


  if (
    cleanMessage.length <
      1 ||
    cleanMessage.length >
      MAX_MESSAGE_LENGTH
  ) {
    errorMessage.value =
      `Message must be between 1 and ${MAX_MESSAGE_LENGTH} characters.`

    return
  }


  showPreview.value =
    true
}


// ======================================================
// Close preview
// ======================================================

function closePreview() {
  showPreview.value =
    false
}


// ======================================================
// Send Bulk Email campaign
// ======================================================

async function handleSendBulkEmail() {
  clearStatus()


  if (
    !isFormValid.value
  ) {
    errorMessage.value =
      'Please complete the campaign form before sending.'

    showPreview.value =
      false

    return
  }


  isSending.value =
    true


  try {
    const result =
      await sendBulkEmail({
        recipientUids:
          selectedUsers.value.map(
            (user) =>
              user.id,
          ),

        subject:
          subject.value,

        message:
          message.value,
      })


    campaignResult.value =
      result


    successMessage.value =
      result?.message ||
      `Bulk email sent to ${result?.sentCount || selectedCount.value} users.`


    // Close preview after successful delivery.

    showPreview.value =
      false


    // Clear campaign form after successful send.

    selectedUids.value =
      []

    subject.value =
      ''

    message.value =
      ''

    searchQuery.value =
      ''
  } catch (error) {
    console.error(
      'Bulk email campaign failed:',
      error,
    )


    errorMessage.value =
      error?.message ||
      'Unable to send the bulk email campaign. Please try again.'


    showPreview.value =
      false
  } finally {
    isSending.value =
      false
  }
}


// ======================================================
// Reset complete campaign form
// ======================================================

function resetCampaign() {
  selectedUids.value =
    []

  searchQuery.value =
    ''

  subject.value =
    ''

  message.value =
    ''

  showPreview.value =
    false

  clearStatus()
}
</script>


<template>
  <section
    class="
      bulk-email-card
      card
      border-0
      shadow-sm
    "
    aria-labelledby="bulk-email-title"
  >
    <div
      class="
        card-body
        p-4
        p-lg-5
      "
    >

      <!-- ================================================= -->
      <!-- Header -->
      <!-- ================================================= -->

      <div
        class="
          d-flex
          flex-column
          flex-lg-row
          justify-content-between
          align-items-lg-start
          gap-3
          mb-4
        "
      >
        <div>

          <div
            class="
              d-flex
              align-items-center
              gap-2
              mb-2
            "
          >
            <span
              class="
                feature-icon
              "
              aria-hidden="true"
            >
              ✉️
            </span>


            <p
              class="
                text-success
                fw-semibold
                small
                text-uppercase
                mb-0
              "
            >
              Administrator Tool
            </p>
          </div>


          <h2
            id="bulk-email-title"
            class="
              h3
              fw-bold
              mb-2
            "
          >
            Bulk Email Campaign
          </h2>


          <p
            class="
              text-muted
              mb-0
            "
          >
            Send an announcement to multiple registered
            ZWV Circular Hub community users.
          </p>

        </div>


        <span
          class="
            badge
            rounded-pill
            text-bg-success
            px-3
            py-2
          "
        >
          Admin only
        </span>
      </div>


      <!-- ================================================= -->
      <!-- Security explanation -->
      <!-- ================================================= -->

      <div
        class="
          alert
          alert-light
          border
          mb-4
        "
        role="note"
      >
        <div
          class="
            d-flex
            gap-3
          "
        >
          <span
            aria-hidden="true"
            class="
              fs-4
            "
          >
            🔐
          </span>


          <div>
            <strong>
              Secure server-side delivery
            </strong>


            <p
              class="
                small
                text-muted
                mb-0
                mt-1
              "
            >
              Recipient email addresses are verified by
              Firebase on the server. The Cloud Function
              independently checks administrator access
              before sending the campaign.
            </p>
          </div>
        </div>
      </div>


      <!-- ================================================= -->
      <!-- Success message -->
      <!-- ================================================= -->

      <div
        v-if="successMessage"
        class="
          alert
          alert-success
        "
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <strong>
          Campaign completed.
        </strong>

        {{ successMessage }}


        <div
          v-if="campaignResult"
          class="
            small
            mt-2
          "
        >
          <span
            v-if="
              campaignResult.sentCount !==
              undefined
            "
          >
            Sent:
            <strong>
              {{ campaignResult.sentCount }}
            </strong>
          </span>


          <span
            v-if="
              campaignResult.skippedCount !==
              undefined
            "
            class="
              ms-3
            "
          >
            Skipped:
            <strong>
              {{ campaignResult.skippedCount }}
            </strong>
          </span>
        </div>
      </div>


      <!-- ================================================= -->
      <!-- Error message -->
      <!-- ================================================= -->

      <div
        v-if="errorMessage"
        class="
          alert
          alert-danger
        "
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        {{ errorMessage }}
      </div>


      <!-- ================================================= -->
      <!-- No community users -->
      <!-- ================================================= -->

      <div
        v-if="
          communityUsers.length ===
          0
        "
        class="
          bg-light
          rounded-3
          text-center
          p-5
        "
      >
        <div
          class="
            fs-1
            mb-3
          "
          aria-hidden="true"
        >
          👥
        </div>


        <h3
          class="
            h5
            fw-bold
          "
        >
          No community users available
        </h3>


        <p
          class="
            text-muted
            mb-0
          "
        >
          Registered community users will appear here when
          they are available.
        </p>
      </div>


      <!-- ================================================= -->
      <!-- Campaign form -->
      <!-- ================================================= -->

      <form
        v-else
        @submit.prevent="openPreview"
      >

        <!-- =============================================== -->
        <!-- Recipient selection -->
        <!-- =============================================== -->

        <section
          class="
            mb-5
          "
          aria-labelledby="recipient-selection-title"
        >
          <div
            class="
              d-flex
              flex-column
              flex-md-row
              justify-content-between
              align-items-md-center
              gap-3
              mb-3
            "
          >
            <div>

              <h3
                id="recipient-selection-title"
                class="
                  h5
                  fw-bold
                  mb-1
                "
              >
                1. Select recipients
              </h3>


              <p
                class="
                  text-muted
                  small
                  mb-0
                "
              >
                Only registered community users are eligible.
              </p>

            </div>


            <div
              class="
                d-flex
                flex-wrap
                gap-2
              "
            >
              <button
                type="button"
                class="
                  btn
                  btn-sm
                  btn-outline-success
                "
                :disabled="
                  allCommunityUsersSelected
                "
                @click="selectAllUsers"
              >
                Select All Community Users
              </button>


              <button
                type="button"
                class="
                  btn
                  btn-sm
                  btn-outline-secondary
                "
                :disabled="
                  selectedCount === 0
                "
                @click="clearSelection"
              >
                Clear Selection
              </button>
            </div>
          </div>


          <!-- ============================================= -->
          <!-- Search -->
          <!-- ============================================= -->

          <div
            class="
              mb-3
            "
          >
            <label
              for="bulk-email-user-search"
              class="
                form-label
                fw-semibold
              "
            >
              Search community users
            </label>


            <input
              id="bulk-email-user-search"
              v-model="searchQuery"
              type="search"
              class="
                form-control
              "
              placeholder="Search by username or email"
              autocomplete="off"
            >
          </div>


          <!-- ============================================= -->
          <!-- Recipient summary -->
          <!-- ============================================= -->

          <div
            class="
              recipient-summary
              d-flex
              flex-wrap
              justify-content-between
              align-items-center
              gap-2
              rounded-3
              mb-3
              px-3
              py-2
            "
          >
            <span
              class="
                fw-semibold
              "
            >
              {{ selectedCount }}

              {{
                selectedCount === 1
                  ? 'recipient'
                  : 'recipients'
              }}

              selected
            </span>


            <span
              class="
                text-muted
                small
              "
            >
              Maximum {{ MAX_RECIPIENTS }} recipients
            </span>
          </div>


          <!-- ============================================= -->
          <!-- Recipient list -->
          <!-- ============================================= -->

          <div
            class="
              recipient-list
              border
              rounded-3
              overflow-hidden
            "
            role="group"
            aria-label="Community email recipients"
          >

            <div
              v-if="
                filteredUsers.length ===
                0
              "
              class="
                text-center
                text-muted
                py-4
                px-3
              "
            >
              No users match your search.
            </div>


            <template v-else>

              <label
                v-for="
                  user in
                  filteredUsers
                "
                :key="user.id"
                class="
                  recipient-row
                  d-flex
                  align-items-center
                  gap-3
                  px-3
                  py-3
                "
              >
                <input
                  v-model="selectedUids"
                  class="
                    form-check-input
                    flex-shrink-0
                  "
                  type="checkbox"
                  :value="user.id"
                  @change="handleRecipientChange"
                >


                <span
                  class="
                    flex-grow-1
                    overflow-hidden
                  "
                >
                  <span
                    class="
                      d-block
                      fw-semibold
                    "
                  >
                    {{
                      user.username ||
                      'Community User'
                    }}
                  </span>


                  <span
                    class="
                      d-block
                      text-muted
                      small
                      text-break
                    "
                  >
                    {{
                      user.email ||
                      'Email verified server-side'
                    }}
                  </span>
                </span>


                <span
                  class="
                    badge
                    text-bg-light
                    border
                  "
                >
                  User
                </span>
              </label>

            </template>
          </div>
        </section>


        <!-- =============================================== -->
        <!-- Campaign content -->
        <!-- =============================================== -->

        <section
          class="
            mb-4
          "
          aria-labelledby="campaign-content-title"
        >
          <h3
            id="campaign-content-title"
            class="
              h5
              fw-bold
              mb-3
            "
          >
            2. Compose campaign
          </h3>


          <!-- ============================================= -->
          <!-- Subject -->
          <!-- ============================================= -->

          <div
            class="
              mb-4
            "
          >
            <div
              class="
                d-flex
                justify-content-between
                gap-3
              "
            >
              <label
                for="bulk-email-subject"
                class="
                  form-label
                  fw-semibold
                "
              >
                Subject
              </label>


              <span
                class="
                  text-muted
                  small
                "
              >
                {{ subjectLength }}/{{ MAX_SUBJECT_LENGTH }}
              </span>
            </div>


            <input
              id="bulk-email-subject"
              v-model="subject"
              type="text"
              class="
                form-control
              "
              maxlength="150"
              placeholder="e.g. Zero Waste Victoria Community Update"
              @input="handleContentChange"
            >
          </div>


          <!-- ============================================= -->
          <!-- Message -->
          <!-- ============================================= -->

          <div
            class="
              mb-3
            "
          >
            <div
              class="
                d-flex
                justify-content-between
                gap-3
              "
            >
              <label
                for="bulk-email-message"
                class="
                  form-label
                  fw-semibold
                "
              >
                Message
              </label>


              <span
                class="
                  text-muted
                  small
                "
              >
                {{ messageLength }}/{{ MAX_MESSAGE_LENGTH }}
              </span>
            </div>


            <textarea
              id="bulk-email-message"
              v-model="message"
              class="
                form-control
              "
              rows="8"
              maxlength="5000"
              placeholder="Write the community announcement here..."
              @input="handleContentChange"
            ></textarea>
          </div>
        </section>


        <!-- =============================================== -->
        <!-- Form actions -->
        <!-- =============================================== -->

        <div
          class="
            d-flex
            flex-column
            flex-sm-row
            justify-content-between
            gap-3
          "
        >
          <button
            type="button"
            class="
              btn
              btn-outline-secondary
            "
            :disabled="isSending"
            @click="resetCampaign"
          >
            Reset Campaign
          </button>


          <button
            type="submit"
            class="
              btn
              btn-success
              px-4
            "
            :disabled="
              !isFormValid ||
              isSending
            "
          >
            Preview Campaign
          </button>
        </div>
      </form>


      <!-- ================================================= -->
      <!-- Campaign confirmation / preview -->
      <!-- ================================================= -->

      <section
        v-if="showPreview"
        class="
          campaign-preview
          mt-5
          rounded-4
          p-4
        "
        aria-labelledby="campaign-preview-title"
      >
        <div
          class="
            d-flex
            justify-content-between
            align-items-start
            gap-3
            mb-4
          "
        >
          <div>

            <p
              class="
                text-success
                text-uppercase
                fw-semibold
                small
                mb-1
              "
            >
              Confirmation
            </p>


            <h3
              id="campaign-preview-title"
              class="
                h4
                fw-bold
                mb-1
              "
            >
              Review Bulk Email Campaign
            </h3>


            <p
              class="
                text-muted
                mb-0
              "
            >
              Confirm the details before sending.
            </p>

          </div>


          <button
            type="button"
            class="
              btn-close
            "
            aria-label="Close campaign preview"
            :disabled="isSending"
            @click="closePreview"
          ></button>
        </div>


        <!-- =============================================== -->
        <!-- Recipient preview -->
        <!-- =============================================== -->

        <div
          class="
            preview-section
            mb-3
          "
        >
          <p
            class="
              fw-semibold
              mb-2
            "
          >
            Recipients
          </p>


          <div
            class="
              d-flex
              flex-wrap
              gap-2
            "
          >
            <span
              v-for="
                user in
                selectedUsers
              "
              :key="user.id"
              class="
                badge
                rounded-pill
                text-bg-light
                border
                px-3
                py-2
              "
            >
              {{
                user.username ||
                user.email
              }}
            </span>
          </div>


          <p
            class="
              small
              text-muted
              mt-2
              mb-0
            "
          >
            {{ selectedCount }}

            {{
              selectedCount === 1
                ? 'individual email'
                : 'individual emails'
            }}

            will be requested.
          </p>
        </div>


        <!-- =============================================== -->
        <!-- Subject preview -->
        <!-- =============================================== -->

        <div
          class="
            preview-section
            mb-3
          "
        >
          <p
            class="
              fw-semibold
              mb-1
            "
          >
            Subject
          </p>


          <p
            class="
              mb-0
            "
          >
            {{ subject.trim() }}
          </p>
        </div>


        <!-- =============================================== -->
        <!-- Message preview -->
        <!-- =============================================== -->

        <div
          class="
            preview-section
            mb-4
          "
        >
          <p
            class="
              fw-semibold
              mb-2
            "
          >
            Message
          </p>


          <div
            class="
              message-preview
              bg-white
              border
              rounded-3
              p-3
            "
          >
            {{ message.trim() }}
          </div>
        </div>


        <!-- =============================================== -->
        <!-- Warning -->
        <!-- =============================================== -->

        <div
          class="
            alert
            alert-warning
          "
          role="note"
        >
          <strong>
            Ready to send?
          </strong>

          This action will send the campaign to

          {{ selectedCount }}

          {{
            selectedCount === 1
              ? 'registered user'
              : 'registered users'
          }}.
        </div>


        <!-- =============================================== -->
        <!-- Confirmation buttons -->
        <!-- =============================================== -->

        <div
          class="
            d-flex
            flex-column
            flex-sm-row
            justify-content-end
            gap-2
          "
        >
          <button
            type="button"
            class="
              btn
              btn-outline-secondary
            "
            :disabled="isSending"
            @click="closePreview"
          >
            Go Back
          </button>


          <button
            type="button"
            class="
              btn
              btn-success
              px-4
            "
            :disabled="isSending"
            :aria-busy="
              isSending
                ? 'true'
                : 'false'
            "
            @click="handleSendBulkEmail"
          >
            <template
              v-if="
                isSending
              "
            >
              <span
                class="
                  spinner-border
                  spinner-border-sm
                  me-2
                "
                aria-hidden="true"
              ></span>

              Sending...
            </template>


            <template v-else>
              Send Bulk Email to

              {{ selectedCount }}

              {{
                selectedCount === 1
                  ? 'User'
                  : 'Users'
              }}
            </template>
          </button>
        </div>
      </section>
    </div>
  </section>
</template>


<style scoped>

/* ===================================================== */
/* Main card */
/* ===================================================== */

.bulk-email-card {
  border-radius:
    1rem;
}


/* ===================================================== */
/* Header */
/* ===================================================== */

.feature-icon {
  font-size:
    1.5rem;
}


/* ===================================================== */
/* Recipient summary */
/* ===================================================== */

.recipient-summary {
  background:
    rgba(
      25,
      135,
      84,
      0.08
    );
}


/* ===================================================== */
/* Recipient list */
/* ===================================================== */

.recipient-list {
  max-height:
    420px;

  overflow-y:
    auto;

  background:
    #ffffff;
}


.recipient-row {
  cursor:
    pointer;

  border-bottom:
    1px solid
    #eeeeee;

  transition:
    background-color
    0.15s
    ease;
}


.recipient-row:last-child {
  border-bottom:
    0;
}


.recipient-row:hover {
  background-color:
    #f8f9fa;
}


.recipient-row:focus-within {
  background-color:
    #f1f8f4;

  outline:
    2px solid
    #198754;

  outline-offset:
    -2px;
}


/* ===================================================== */
/* Campaign preview */
/* ===================================================== */

.campaign-preview {
  background:
    #f5faf7;

  border:
    1px solid
    rgba(
      25,
      135,
      84,
      0.25
    );
}


.preview-section {
  padding-bottom:
    1rem;

  border-bottom:
    1px solid
    #dee2e6;
}


.message-preview {
  white-space:
    pre-wrap;

  word-break:
    break-word;

  min-height:
    100px;
}


/* ===================================================== */
/* Accessible reduced motion */
/* ===================================================== */

@media (
  prefers-reduced-motion: reduce
) {

  .recipient-row {
    transition:
      none;
  }


  .spinner-border {
    animation:
      none !important;
  }

}
</style>