import {
  httpsCallable,
} from 'firebase/functions'

import {
  functions,
} from '../firebase'


// ======================================================
// Attachment limit
// ======================================================

const MAX_ATTACHMENT_SIZE =
  2 * 1024 * 1024


// ======================================================
// Convert a file to Base64
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
// The browser does not read the Firestore users collection
// directly.
//
// Instead, an authenticated callable Cloud Function returns
// the limited recipient information required by EmailView.
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
// Send email
// ======================================================
//
// recipientUid is used instead of an arbitrary email.
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