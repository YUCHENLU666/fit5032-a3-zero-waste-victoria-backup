import {
  httpsCallable,
} from 'firebase/functions'

import {
  functions,
} from '../firebase'


// ======================================================
// Email limits
// ======================================================

const MAX_ATTACHMENT_SIZE =
  2 * 1024 * 1024

const MAX_BULK_RECIPIENTS =
  100


// ======================================================
// Convert a file to Base64
// ======================================================
//
// Used by the existing single-recipient email feature.
//
// Bulk email does not use attachments because the
// campaign is sent using the Resend Batch API.
// ======================================================

function fileToBase64(
  file,
) {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const reader =
        new FileReader()


      reader.onload =
        () => {
          const result =
            reader.result


          if (
            typeof result !==
            'string'
          ) {
            reject(
              new Error(
                'Unable to read the selected file.',
              ),
            )

            return
          }


          const base64 =
            result.split(
              ',',
            )[1]


          if (!base64) {
            reject(
              new Error(
                'Unable to process the selected file.',
              ),
            )

            return
          }


          resolve(
            base64,
          )
        }


      reader.onerror =
        () => {
          reject(
            new Error(
              'Unable to read the selected file.',
            ),
          )
        }


      reader.readAsDataURL(
        file,
      )
    },
  )
}


// ======================================================
// Load registered email recipients
// ======================================================
//
// The browser does not read Firebase Authentication
// accounts directly.
//
// Instead, an authenticated Firebase callable function
// returns the limited recipient information required by
// the email feature.
// ======================================================

export async function getEmailRecipients() {
  const getRecipientsFunction =
    httpsCallable(
      functions,
      'getEmailRecipients',
    )


  const result =
    await getRecipientsFunction()


  return (
    result.data?.recipients ||
    []
  )
}


// ======================================================
// Send single email
// ======================================================
//
// This is the original individual email feature.
//
// recipientUid is used instead of an arbitrary email
// address.
//
// The Cloud Function resolves the actual recipient email
// from Firebase Authentication on the server.
// ======================================================

export async function sendEmail({
  recipientUid,
  subject,
  message,
  file = null,
}) {
  let attachment =
    null


  // ------------------------------------------------------
  // Optional attachment
  // ------------------------------------------------------

  if (file) {
    if (
      file.size >
      MAX_ATTACHMENT_SIZE
    ) {
      throw new Error(
        'Attachment must be smaller than 2 MB.',
      )
    }


    const content =
      await fileToBase64(
        file,
      )


    attachment = {
      filename:
        file.name,

      content,
    }
  }


  // ------------------------------------------------------
  // Firebase callable function
  // ------------------------------------------------------

  const sendEmailFunction =
    httpsCallable(
      functions,
      'sendEmail',
    )


  const result =
    await sendEmailFunction({
      recipientUid,
      subject,
      message,
      attachment,
    })


  return result.data
}


// ======================================================
// Send Bulk Email
// ======================================================
//
// Administrator-only extended feature.
//
// The frontend sends:
// - Firebase recipient UIDs
// - Subject
// - Message
//
// It deliberately does NOT send trusted email addresses.
//
// The Firebase Cloud Function:
//
// 1. Checks Firebase Authentication.
// 2. Checks the caller's Firestore role.
// 3. Requires role === "admin".
// 4. Verifies every recipient.
// 5. Resolves recipient emails server-side.
// 6. Sends the campaign using Resend Batch API.
//
// Server-side validation remains the authoritative
// security layer.
// ======================================================

export async function sendBulkEmail({
  recipientUids,
  subject,
  message,
}) {
  // ------------------------------------------------------
  // Basic client-side validation
  // ------------------------------------------------------
  //
  // These checks improve UX only.
  //
  // The Cloud Function performs the same important
  // validation independently.
  // ------------------------------------------------------

  if (
    !Array.isArray(
      recipientUids,
    ) ||
    recipientUids.length ===
      0
  ) {
    throw new Error(
      'Please select at least one community user.',
    )
  }


  // ------------------------------------------------------
  // Remove invalid / empty / duplicate UIDs
  // ------------------------------------------------------

  const cleanRecipientUids =
    [
      ...new Set(
        recipientUids
          .filter(
            (uid) =>
              typeof uid ===
              'string',
          )
          .map(
            (uid) =>
              uid.trim(),
          )
          .filter(
            Boolean,
          ),
      ),
    ]


  if (
    cleanRecipientUids.length ===
    0
  ) {
    throw new Error(
      'Please select at least one community user.',
    )
  }


  // ------------------------------------------------------
  // Maximum campaign size
  // ------------------------------------------------------

  if (
    cleanRecipientUids.length >
    MAX_BULK_RECIPIENTS
  ) {
    throw new Error(
      `A maximum of ${MAX_BULK_RECIPIENTS} recipients can be selected.`,
    )
  }


  // ------------------------------------------------------
  // Subject validation
  // ------------------------------------------------------

  const cleanSubject =
    typeof subject ===
    'string'
      ? subject.trim()
      : ''


  if (
    cleanSubject.length <
      1 ||
    cleanSubject.length >
      150
  ) {
    throw new Error(
      'Subject must be between 1 and 150 characters.',
    )
  }


  // ------------------------------------------------------
  // Message validation
  // ------------------------------------------------------

  const cleanMessage =
    typeof message ===
    'string'
      ? message.trim()
      : ''


  if (
    cleanMessage.length <
      1 ||
    cleanMessage.length >
      5000
  ) {
    throw new Error(
      'Message must be between 1 and 5000 characters.',
    )
  }


  // ------------------------------------------------------
  // Firebase callable function
  // ------------------------------------------------------

  const sendBulkEmailFunction =
    httpsCallable(
      functions,
      'sendBulkEmail',
    )


  const result =
    await sendBulkEmailFunction({
      recipientUids:
        cleanRecipientUids,

      subject:
        cleanSubject,

      message:
        cleanMessage,
    })


  return result.data
}