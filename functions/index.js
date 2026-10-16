const {
  onCall,
  HttpsError,
} = require("firebase-functions/v2/https");

const {
  setGlobalOptions,
} = require("firebase-functions/v2");

const {
  defineSecret,
} = require("firebase-functions/params");

const logger =
  require("firebase-functions/logger");

const {
  initializeApp,
} = require("firebase-admin/app");

const {
  getAuth,
} = require("firebase-admin/auth");

const {
  getFirestore,
} = require("firebase-admin/firestore");

const {
  Resend,
} = require("resend");

const {
  Buffer,
} = require("node:buffer");


// ======================================================
// Firebase Admin
// ======================================================
//
// Firebase Admin runs only in the trusted Cloud Function
// environment.
//
// It is used to:
//
// 1. Read registered user profiles from Firestore.
// 2. Verify Firebase Authentication accounts.
// 3. Resolve a selected user UID to the real email
//    address on the server.
//
// The browser never decides the final recipient email.
// ======================================================

initializeApp();


// ======================================================
// Global options
// ======================================================

setGlobalOptions({
  maxInstances: 10,
});


// ======================================================
// Resend secret
// ======================================================

const resendApiKey =
  defineSecret(
      "RESEND_API_KEY",
  );


// ======================================================
// Helper: validate email
// ======================================================

const isValidEmail =
  (email) => {
    const pattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return pattern.test(
        email,
    );
  };


// ======================================================
// CLOUD FUNCTION:
// getEmailRecipients
// ======================================================
//
// Purpose:
//
// Return registered ZWV Circular Hub users who may be
// selected as email recipients.
//
// Security:
//
// - Caller must be authenticated.
// - User information is read server-side.
// - Disabled / invalid Authentication accounts are not
//   returned.
// - Only minimal information needed by the email page
//   is returned.
// ======================================================

exports.getEmailRecipients =
  onCall(
      {
        region:
          "australia-southeast2",

        maxInstances:
          5,
      },

      async (request) => {
        // ----------------------------------------------
        // Authentication
        // ----------------------------------------------

        if (!request.auth) {
          throw new HttpsError(
              "unauthenticated",
              "You must be signed in to view registered recipients.",
          );
        }


        try {
          const db =
            getFirestore();

          const snapshot =
            await db
                .collection(
                    "users",
                )
                .get();


          const recipientResults =
            await Promise.all(
                snapshot.docs.map(
                    async (
                        userDocument,
                    ) => {
                      const profile =
                        userDocument.data() ||
                        {};

                      try {
                        // --------------------------------
                        // Confirm the corresponding
                        // Firebase Authentication account.
                        // --------------------------------

                        const authUser =
                          await getAuth()
                              .getUser(
                                  userDocument.id,
                              );


                        // --------------------------------
                        // Disabled accounts are not valid
                        // email recipients.
                        // --------------------------------

                        if (
                          authUser.disabled ||
                          !authUser.email
                        ) {
                          return null;
                        }


                        const email =
                          authUser.email
                              .trim()
                              .toLowerCase();


                        if (
                          !isValidEmail(
                              email,
                          )
                        ) {
                          return null;
                        }


                        return {
                          uid:
                            authUser.uid,

                          username:
                            profile.username ||
                            authUser.displayName ||
                            "ZWV User",

                          email:
                            email,
                        };
                      } catch (error) {
                        // --------------------------------
                        // Ignore orphan Firestore
                        // profiles that no longer have an
                        // Authentication account.
                        // --------------------------------

                        if (
                          error.code ===
                          "auth/user-not-found"
                        ) {
                          logger.warn(
                              "Ignoring Firestore profile without Firebase Auth account.",
                              {
                                uid:
                                  userDocument.id,
                              },
                          );

                          return null;
                        }


                        throw error;
                      }
                    },
                ),
            );


          const recipients =
            recipientResults
                .filter(
                    Boolean,
                )
                .sort(
                    (
                        first,
                        second,
                    ) => {
                      const firstName =
                        first.username ||
                        first.email;

                      const secondName =
                        second.username ||
                        second.email;

                      return firstName
                          .localeCompare(
                              secondName,
                          );
                    },
                );


          logger.info(
              "Registered email recipients loaded.",
              {
                requesterUid:
                  request.auth.uid,

                count:
                  recipients.length,
              },
          );


          return {
            recipients,
          };
        } catch (error) {
          if (
            error instanceof
            HttpsError
          ) {
            throw error;
          }


          logger.error(
              "Unable to load registered email recipients.",
              {
                requesterUid:
                  request.auth.uid,

                message:
                  error.message,
              },
          );


          throw new HttpsError(
              "internal",
              "Unable to load registered users.",
          );
        }
      },
  );


// ======================================================
// CLOUD FUNCTION:
// sendEmail
// ======================================================
//
// Security flow:
//
// 1. Sender must be authenticated.
// 2. Frontend provides recipient UID, NOT arbitrary email.
// 3. UID must exist in Firebase Authentication.
// 4. UID must have a matching Firestore user profile.
// 5. Disabled accounts cannot receive email.
// 6. Recipient email is resolved by the server.
// 7. Subject/message/attachment are validated.
// 8. Resend API key stays in Secret Manager.
// ======================================================

exports.sendEmail =
  onCall(
      {
        region:
          "australia-southeast2",

        secrets: [
          resendApiKey,
        ],

        maxInstances:
          5,
      },

      async (request) => {
        // ==================================================
        // 1. Sender authentication
        // ==================================================

        if (!request.auth) {
          throw new HttpsError(
              "unauthenticated",
              "You must be signed in to send an email.",
          );
        }


        const {
          recipientUid,
          subject,
          message,
          attachment,
        } = request.data || {};


        // ==================================================
        // 2. Validate recipient UID
        // ==================================================

        if (
          !recipientUid ||
          typeof recipientUid !==
            "string"
        ) {
          throw new HttpsError(
              "invalid-argument",
              "Please select a registered ZWV Circular Hub user.",
          );
        }


        const cleanRecipientUid =
          recipientUid.trim();


        if (
          cleanRecipientUid.length <
          1
        ) {
          throw new HttpsError(
              "invalid-argument",
              "Please select a registered ZWV Circular Hub user.",
          );
        }


        // ==================================================
        // 3. Resolve recipient from Firebase Authentication
        // ==================================================

        let recipientUser;


        try {
          recipientUser =
            await getAuth()
                .getUser(
                    cleanRecipientUid,
                );
        } catch (error) {
          if (
            error.code ===
            "auth/user-not-found"
          ) {
            logger.warn(
                "Blocked email to unknown recipient UID.",
                {
                  senderUid:
                    request.auth.uid,

                  recipientUid:
                    cleanRecipientUid,
                },
            );


            throw new HttpsError(
                "not-found",
                "The selected recipient is not a registered ZWV Circular Hub user.",
            );
          }


          logger.error(
              "Unable to verify recipient Authentication account.",
              {
                senderUid:
                  request.auth.uid,

                recipientUid:
                  cleanRecipientUid,

                message:
                  error.message,
              },
          );


          throw new HttpsError(
              "internal",
              "Unable to verify the recipient account.",
          );
        }


        // ==================================================
        // 4. Disabled accounts cannot receive messages
        // ==================================================

        if (
          recipientUser.disabled
        ) {
          throw new HttpsError(
              "failed-precondition",
              "The selected recipient account is disabled.",
          );
        }


        // ==================================================
        // 5. Recipient must have a Firestore profile
        // ==================================================

        try {
          const profileSnapshot =
            await getFirestore()
                .collection(
                    "users",
                )
                .doc(
                    recipientUser.uid,
                )
                .get();


          if (
            !profileSnapshot.exists
          ) {
            logger.warn(
                "Blocked email because recipient has no application profile.",
                {
                  senderUid:
                    request.auth.uid,

                  recipientUid:
                    recipientUser.uid,
                },
            );


            throw new HttpsError(
                "not-found",
                "The selected recipient is not a registered ZWV Circular Hub user.",
            );
          }
        } catch (error) {
          if (
            error instanceof
            HttpsError
          ) {
            throw error;
          }


          logger.error(
              "Unable to verify recipient Firestore profile.",
              {
                senderUid:
                  request.auth.uid,

                recipientUid:
                  recipientUser.uid,

                message:
                  error.message,
              },
          );


          throw new HttpsError(
              "internal",
              "Unable to verify the recipient profile.",
          );
        }


        // ==================================================
        // 6. Resolve final email server-side
        // ==================================================

        const recipientEmail =
          recipientUser.email
              ?.trim()
              .toLowerCase();


        if (
          !recipientEmail ||
          !isValidEmail(
              recipientEmail,
          )
        ) {
          throw new HttpsError(
              "failed-precondition",
              "The selected user does not have a valid email address.",
          );
        }


        // ==================================================
        // 7. Validate subject
        // ==================================================

        if (
          !subject ||
          typeof subject !==
            "string" ||
          subject.trim().length <
            1 ||
          subject.trim().length >
            150
        ) {
          throw new HttpsError(
              "invalid-argument",
              "Subject must be between 1 and 150 characters.",
          );
        }


        // ==================================================
        // 8. Validate message
        // ==================================================

        if (
          !message ||
          typeof message !==
            "string" ||
          message.trim().length <
            1 ||
          message.trim().length >
            5000
        ) {
          throw new HttpsError(
              "invalid-argument",
              "Message must be between 1 and 5000 characters.",
          );
        }


        // ==================================================
        // 9. Validate attachment
        // ==================================================

        const attachments = [];


        if (attachment) {
          if (
            typeof attachment.filename !==
              "string" ||
            typeof attachment.content !==
              "string"
          ) {
            throw new HttpsError(
                "invalid-argument",
                "The attachment is invalid.",
            );
          }


          const maxBase64Length =
            3 * 1024 * 1024;


          if (
            attachment.content.length >
            maxBase64Length
          ) {
            throw new HttpsError(
                "invalid-argument",
                "The attachment is too large.",
            );
          }


          attachments.push({
            filename:
              attachment.filename,

            content:
              Buffer.from(
                  attachment.content,
                  "base64",
              ),
          });
        }


        // ==================================================
        // 10. Send email using Resend
        // ==================================================

        try {
          const resend =
            new Resend(
                resendApiKey.value(),
            );


          const emailData = {
            from:
              "ZWV Circular Hub <onboarding@resend.dev>",

            to: [
              recipientEmail,
            ],

            subject:
              subject.trim(),

            text:
              message.trim(),
          };


          if (
            attachments.length >
            0
          ) {
            emailData.attachments =
              attachments;
          }


          const {
            data,
            error,
          } =
            await resend.emails.send(
                emailData,
            );


          if (error) {
            logger.error(
                "Resend rejected the email request.",
                {
                  error,

                  senderUid:
                    request.auth.uid,

                  recipientUid:
                    recipientUser.uid,
                },
            );


            throw new HttpsError(
                "internal",
                "The email could not be sent.",
            );
          }


          logger.info(
              "Email sent successfully.",
              {
                senderUid:
                  request.auth.uid,

                recipientUid:
                  recipientUser.uid,

                emailId:
                  data?.id,
              },
          );


          return {
            success:
              true,

            emailId:
              data?.id || null,

            recipientUid:
              recipientUser.uid,

            message:
              "Email sent successfully to a registered ZWV Circular Hub user.",
          };
        } catch (error) {
          if (
            error instanceof
            HttpsError
          ) {
            throw error;
          }


          logger.error(
              "Unexpected email sending error.",
              {
                senderUid:
                  request.auth.uid,

                recipientUid:
                  recipientUser.uid,

                message:
                  error.message,
              },
          );


          throw new HttpsError(
              "internal",
              "An unexpected error occurred while sending the email.",
          );
        }
      },
  );