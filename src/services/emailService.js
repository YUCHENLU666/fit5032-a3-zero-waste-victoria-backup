import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result

      if (typeof result !== 'string') {
        reject(
          new Error(
            'Unable to read the selected file.',
          ),
        )
        return
      }

      const base64 = result.split(',')[1]

      if (!base64) {
        reject(
          new Error(
            'Unable to process the selected file.',
          ),
        )
        return
      }

      resolve(base64)
    }

    reader.onerror = () => {
      reject(
        new Error(
          'Unable to read the selected file.',
        ),
      )
    }

    reader.readAsDataURL(file)
  })
}

export async function sendEmail({
  to,
  subject,
  message,
  file = null,
}) {
  let attachment = null

  if (file) {
    if (file.size > MAX_ATTACHMENT_SIZE) {
      throw new Error(
        'Attachment must be smaller than 2 MB.',
      )
    }

    const content = await fileToBase64(file)

    attachment = {
      filename: file.name,
      content,
    }
  }

  const sendEmailFunction = httpsCallable(
    functions,
    'sendEmail',
  )

  const result = await sendEmailFunction({
    to,
    subject,
    message,
    attachment,
  })

  return result.data
}