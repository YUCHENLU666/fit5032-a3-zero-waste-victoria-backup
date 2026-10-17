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

const logger = require("firebase-functions/logger");

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

const {
  recyclingLocations,
} = require("./data/recyclingLocations");


// ======================================================
// Firebase Admin
// ======================================================

initializeApp();


// ======================================================
// Global Cloud Functions options
// ======================================================

setGlobalOptions({
  maxInstances: 10,
});


// ======================================================
// Resend API secret
// ======================================================

const resendApiKey =
  defineSecret(
      "RESEND_API_KEY",
  );


// ======================================================
// Shared constants
// ======================================================

const EMAIL_FROM =
  "ZWV Circular Hub <onboarding@resend.dev>";

const MAX_BULK_RECIPIENTS =
  100;

const MAX_SUBJECT_LENGTH =
  150;

const MAX_MESSAGE_LENGTH =
  5000;


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
// Helper: validate subject and message
// ======================================================
//
// Both the single-email feature and Bulk Email feature use
// the same server-side validation rules.
//
// This avoids relying only on frontend form validation.
// ======================================================

const validateEmailContent =
  (
      subject,
      message,
  ) => {
    if (
      !subject ||
      typeof subject !==
        "string" ||
      subject.trim().length <
        1 ||
      subject.trim().length >
        MAX_SUBJECT_LENGTH
    ) {
      throw new HttpsError(
          "invalid-argument",
          `Subject must be between 1 and ${MAX_SUBJECT_LENGTH} characters.`,
      );
    }


    if (
      !message ||
      typeof message !==
        "string" ||
      message.trim().length <
        1 ||
      message.trim().length >
        MAX_MESSAGE_LENGTH
    ) {
      throw new HttpsError(
          "invalid-argument",
          `Message must be between 1 and ${MAX_MESSAGE_LENGTH} characters.`,
      );
    }


    return {
      cleanSubject:
        subject.trim(),

      cleanMessage:
        message.trim(),
    };
  };


// ======================================================
// Helper: require administrator
// ======================================================
//
// IMPORTANT:
//
// Vue Router protects /admin on the frontend.
//
// However, client-side route protection must not be the
// only security layer for privileged functionality.
//
// This helper independently verifies:
//
// 1. Firebase Authentication
// 2. Firestore application profile
// 3. role === "admin"
//
// before an administrator-only Cloud Function continues.
// ======================================================

const requireAdministrator =
  async (
      request,
  ) => {
    // ------------------------------------------------------
    // Require Firebase Authentication
    // ------------------------------------------------------

    if (!request.auth) {
      throw new HttpsError(
          "unauthenticated",
          "You must be signed in to use this administrator feature.",
      );
    }


    try {
      const adminProfileSnapshot =
        await getFirestore()
            .collection(
                "users",
            )
            .doc(
                request.auth.uid,
            )
            .get();


      // ----------------------------------------------------
      // Firestore application profile must exist
      // ----------------------------------------------------

      if (
        !adminProfileSnapshot.exists
      ) {
        logger.warn(
            "Blocked admin action because application profile was not found.",
            {
              requesterUid:
                request.auth.uid,
            },
        );


        throw new HttpsError(
            "permission-denied",
            "Administrator access is required.",
        );
      }


      const adminProfile =
        adminProfileSnapshot.data() ||
        {};


      // ----------------------------------------------------
      // Server-side administrator role check
      // ----------------------------------------------------

      if (
        adminProfile.role !==
        "admin"
      ) {
        logger.warn(
            "Blocked admin action because caller is not an administrator.",
            {
              requesterUid:
                request.auth.uid,

              role:
                adminProfile.role ||
                "unknown",
            },
        );


        throw new HttpsError(
            "permission-denied",
            "Administrator access is required.",
        );
      }


      return adminProfile;
    } catch (error) {
      if (
        error instanceof
        HttpsError
      ) {
        throw error;
      }


      logger.error(
          "Unable to verify administrator role.",
          {
            requesterUid:
              request.auth.uid,

            message:
              error.message,
          },
      );


      throw new HttpsError(
          "internal",
          "Unable to verify administrator access.",
      );
    }
  };


// ======================================================
// CLOUD FUNCTION:
// getEmailRecipients
// ======================================================
//
// Purpose:
//
// Return registered ZWV Circular Hub users that can be
// selected as email recipients.
//
// Security:
//
// - Caller must be authenticated.
// - Firestore profiles are checked server-side.
// - Firebase Authentication accounts are verified.
// - Disabled accounts are excluded.
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
        // ==================================================
        // 1. Require authentication
        // ==================================================

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
                        const authUser =
                          await getAuth()
                              .getUser(
                                  userDocument.id,
                              );


                        // Disabled users or users without
                        // email addresses cannot receive mail.

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
                        // Ignore Firestore profiles that no
                        // longer have Firebase Auth accounts.

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
// 2. Frontend sends recipient UID, not arbitrary email.
// 3. UID must exist in Firebase Authentication.
// 4. UID must have a Firestore application profile.
// 5. Disabled accounts cannot receive mail.
// 6. Email address is resolved server-side.
// 7. Email content is validated.
// 8. Resend API key remains in Secret Manager.
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
        // 1. Authentication
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
        } =
          request.data || {};


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
        // 3. Resolve recipient using Firebase Auth
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
        // 4. Reject disabled users
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
        // 5. Verify Firestore application profile
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
        // 6. Resolve recipient email server-side
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
        // 7. Validate email content
        // ==================================================

        const {
          cleanSubject,
          cleanMessage,
        } =
          validateEmailContent(
              subject,
              message,
          );


        // ==================================================
        // 8. Validate optional attachment
        // ==================================================

        const attachments =
          [];


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
        // 9. Send email using Resend
        // ==================================================

        try {
          const resend =
            new Resend(
                resendApiKey.value(),
            );


          const emailData = {
            from:
              EMAIL_FROM,

            to: [
              recipientEmail,
            ],

            subject:
              cleanSubject,

            text:
              cleanMessage,
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
              data?.id ||
              null,

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


// ======================================================
// CLOUD FUNCTION:
// sendBulkEmail
// ======================================================
//
// Purpose:
//
// Allow an administrator to send one email campaign to
// multiple registered community users.
//
// This is an extended innovation feature for the
// administrator dashboard.
//
// Security:
//
// 1. Caller must be authenticated.
// 2. Caller must be an administrator in Firestore.
// 3. Frontend sends Firebase UIDs, not arbitrary emails.
// 4. Duplicate UIDs are removed server-side.
// 5. Firebase Authentication accounts are verified.
// 6. Firestore application profiles are verified.
// 7. Only role === "user" accounts are included.
// 8. Disabled or invalid users are skipped.
// 9. Subject and message are validated server-side.
// 10. Resend API key remains in Firebase Secret Manager.
// 11. Each recipient receives an individual email.
//
// The Batch API does not expose recipients to each other
// through a shared To or CC field.
// ======================================================

exports.sendBulkEmail =
  onCall(
      {
        region:
          "australia-southeast2",

        secrets: [
          resendApiKey,
        ],

        maxInstances:
          3,
      },

      async (request) => {
        // ==================================================
        // 1. Server-side administrator authorisation
        // ==================================================

        await requireAdministrator(
            request,
        );


        // ==================================================
        // 2. Read input
        // ==================================================

        const {
          recipientUids,
          subject,
          message,
        } =
          request.data || {};


        // ==================================================
        // 3. Validate recipient array
        // ==================================================

        if (
          !Array.isArray(
              recipientUids,
          )
        ) {
          throw new HttpsError(
              "invalid-argument",
              "Please select at least one community user.",
          );
        }


        // --------------------------------------------------
        // Keep only string UIDs.
        // Remove surrounding whitespace.
        // Remove empty values.
        // --------------------------------------------------

        const cleanRecipientUids =
          recipientUids
              .filter(
                  (uid) =>
                    typeof uid ===
                    "string",
              )
              .map(
                  (uid) =>
                    uid.trim(),
              )
              .filter(
                  Boolean,
              );


        // --------------------------------------------------
        // Prevent duplicate sends to the same UID.
        // --------------------------------------------------

        const uniqueRecipientUids =
          [
            ...new Set(
                cleanRecipientUids,
            ),
          ];


        if (
          uniqueRecipientUids.length <
          1
        ) {
          throw new HttpsError(
              "invalid-argument",
              "Please select at least one community user.",
          );
        }


        // --------------------------------------------------
        // Resend Batch API supports a maximum campaign size
        // of 100 email objects per request.
        // --------------------------------------------------

        if (
          uniqueRecipientUids.length >
          MAX_BULK_RECIPIENTS
        ) {
          throw new HttpsError(
              "invalid-argument",
              `A maximum of ${MAX_BULK_RECIPIENTS} recipients is supported per bulk email campaign.`,
          );
        }


        // ==================================================
        // 4. Validate campaign subject and message
        // ==================================================

        const {
          cleanSubject,
          cleanMessage,
        } =
          validateEmailContent(
              subject,
              message,
          );


        try {
          const db =
            getFirestore();


          // ==================================================
          // 5. Load Firebase Authentication accounts
          // ==================================================
          //
          // getUsers() allows the server to resolve users by
          // Firebase UID in one Admin SDK operation.
          //
          // Emails are NEVER trusted from the frontend.
          // ==================================================

          const authLookup =
            await getAuth()
                .getUsers(
                    uniqueRecipientUids.map(
                        (uid) => ({
                          uid,
                        }),
                    ),
                );


          const authUsersByUid =
            new Map(
                authLookup.users.map(
                    (user) => [
                      user.uid,
                      user,
                    ],
                ),
            );


          // ==================================================
          // 6. Load Firestore application profiles
          // ==================================================

          const profileReferences =
            uniqueRecipientUids.map(
                (uid) =>
                  db
                      .collection(
                          "users",
                      )
                      .doc(
                          uid,
                      ),
            );


          const profileSnapshots =
            await db.getAll(
                ...profileReferences,
            );


          const profilesByUid =
            new Map(
                profileSnapshots
                    .filter(
                        (
                            snapshot,
                        ) =>
                          snapshot.exists,
                    )
                    .map(
                        (
                            snapshot,
                        ) => [
                          snapshot.id,
                          snapshot.data() ||
                            {},
                        ],
                    ),
            );


          // ==================================================
          // 7. Validate every selected recipient
          // ==================================================

          const validRecipients =
            [];

          const skippedRecipients =
            [];


          uniqueRecipientUids.forEach(
              (uid) => {
                const authUser =
                  authUsersByUid.get(
                      uid,
                  );

                const profile =
                  profilesByUid.get(
                      uid,
                  );


                // ------------------------------------------
                // Firebase Authentication account missing
                // ------------------------------------------

                if (!authUser) {
                  skippedRecipients.push({
                    uid,

                    reason:
                      "Authentication account not found",
                  });

                  return;
                }


                // ------------------------------------------
                // Firestore profile missing
                // ------------------------------------------

                if (!profile) {
                  skippedRecipients.push({
                    uid,

                    reason:
                      "Application profile not found",
                  });

                  return;
                }


                // ------------------------------------------
                // Bulk campaigns are for community users.
                //
                // Administrators are not included.
                // ------------------------------------------

                if (
                  profile.role !==
                  "user"
                ) {
                  skippedRecipients.push({
                    uid,

                    reason:
                      "Recipient is not a community user",
                  });

                  return;
                }


                // ------------------------------------------
                // Disabled Firebase accounts are excluded
                // ------------------------------------------

                if (
                  authUser.disabled
                ) {
                  skippedRecipients.push({
                    uid,

                    reason:
                      "Account is disabled",
                  });

                  return;
                }


                // ------------------------------------------
                // Resolve real email server-side
                // ------------------------------------------

                const email =
                  authUser.email
                      ?.trim()
                      .toLowerCase();


                if (
                  !email ||
                  !isValidEmail(
                      email,
                  )
                ) {
                  skippedRecipients.push({
                    uid,

                    reason:
                      "Valid email address not available",
                  });

                  return;
                }


                validRecipients.push({
                  uid,

                  email,

                  username:
                    profile.username ||
                    authUser.displayName ||
                    "ZWV User",
                });
              },
          );


          // ==================================================
          // 8. Require at least one valid recipient
          // ==================================================

          if (
            validRecipients.length <
            1
          ) {
            throw new HttpsError(
                "failed-precondition",
                "None of the selected accounts can receive this campaign.",
            );
          }


          // ==================================================
          // 9. Build individual emails
          // ==================================================
          //
          // Every registered user receives a separate message.
          //
          // Their email address is NOT exposed to other users
          // through CC or a shared recipient list.
          // ==================================================

          const batchEmails =
            validRecipients.map(
                (
                    recipient,
                ) => ({
                  from:
                    EMAIL_FROM,

                  to: [
                    recipient.email,
                  ],

                  subject:
                    cleanSubject,

                  text:
                    cleanMessage,

                  tags: [
                    {
                      name:
                        "category",

                      value:
                        "admin_bulk_email",
                    },
                  ],
                }),
            );


          // ==================================================
          // 10. Send with Resend Batch API
          // ==================================================

          const resend =
            new Resend(
                resendApiKey.value(),
            );


          const {
            data,
            error,
          } =
            await resend.batch.send(
                batchEmails,
            );


          if (error) {
            logger.error(
                "Resend rejected the bulk email campaign.",
                {
                  error,

                  administratorUid:
                    request.auth.uid,

                  selectedCount:
                    uniqueRecipientUids.length,

                  validCount:
                    validRecipients.length,
                },
            );


            throw new HttpsError(
                "internal",
                "The bulk email campaign could not be sent.",
            );
          }


          // ==================================================
          // 11. Normalise Resend result IDs
          // ==================================================
          //
          // Keep frontend result handling simple even if the
          // SDK response shape changes slightly.
          // ==================================================

          let batchResults =
            [];


          if (
            Array.isArray(
                data,
            )
          ) {
            batchResults =
              data;
          } else if (
            Array.isArray(
                data?.data,
            )
          ) {
            batchResults =
              data.data;
          }


          const emailIds =
            batchResults
                .map(
                    (
                        result,
                    ) =>
                      result?.id,
                )
                .filter(
                    Boolean,
                );


          // ==================================================
          // 12. Log successful campaign
          // ==================================================

          logger.info(
              "Bulk email campaign sent successfully.",
              {
                administratorUid:
                  request.auth.uid,

                selectedCount:
                  uniqueRecipientUids.length,

                sentCount:
                  validRecipients.length,

                skippedCount:
                  skippedRecipients.length,

                emailIds:
                  emailIds,
              },
          );


          // ==================================================
          // 13. Return campaign result
          // ==================================================

          return {
            success:
              true,

            selectedCount:
              uniqueRecipientUids.length,

            sentCount:
              validRecipients.length,

            skippedCount:
              skippedRecipients.length,

            skippedRecipients:
              skippedRecipients,

            emailIds:
              emailIds,

            message:
              `Bulk email sent to ${validRecipients.length} ${
                validRecipients.length === 1
                  ? "user"
                  : "users"
              }.`,
          };
        } catch (error) {
          if (
            error instanceof
            HttpsError
          ) {
            throw error;
          }


          logger.error(
              "Unexpected bulk email error.",
              {
                administratorUid:
                  request.auth.uid,

                message:
                  error.message,
              },
          );


          throw new HttpsError(
              "internal",
              "An unexpected error occurred while sending the bulk email.",
          );
        }
      },
  );


// ======================================================
// CLOUD FUNCTION:
// calculateRecyclingImpact
// ======================================================
//
// Purpose:
//
// Calculate an educational estimate of the environmental
// impact produced by recycling a selected material.
//
// Input:
//
// {
//   material: "Plastics",
//   weight: 10
// }
// ======================================================

exports.calculateRecyclingImpact =
  onCall(
      {
        region:
          "australia-southeast2",

        maxInstances:
          5,
      },

      async (request) => {
        // ==================================================
        // 1. Read input
        // ==================================================

        const {
          material,
          weight,
        } =
          request.data || {};


        // ==================================================
        // 2. Validate material
        // ==================================================

        if (
          !material ||
          typeof material !==
            "string"
        ) {
          throw new HttpsError(
              "invalid-argument",
              "Please select a recycling material.",
          );
        }


        const cleanMaterial =
          material.trim();


        // ==================================================
        // 3. Validate weight
        // ==================================================

        const numericWeight =
          Number(
              weight,
          );


        if (
          !Number.isFinite(
              numericWeight,
          ) ||
          numericWeight <=
            0
        ) {
          throw new HttpsError(
              "invalid-argument",
              "Weight must be greater than 0 kilograms.",
          );
        }


        if (
          numericWeight >
          10000
        ) {
          throw new HttpsError(
              "invalid-argument",
              "Weight must not exceed 10,000 kilograms.",
          );
        }


        // ==================================================
        // 4. Educational environmental factors
        // ==================================================

        const materialFactors = {
          Batteries: {
            co2eFactor:
              0.6,

            tip:
              "Keep batteries separate from general waste and take them to a dedicated battery recycling point.",
          },

          "E-Waste": {
            co2eFactor:
              1.8,

            tip:
              "Reuse or repair electronics where possible, then take unwanted devices to an approved e-waste collection point.",
          },

          Plastics: {
            co2eFactor:
              1.5,

            tip:
              "Check the accepted plastic type before recycling and keep recyclable plastics clean and dry.",
          },

          Clothing: {
            co2eFactor:
              3.2,

            tip:
              "Reuse, donate or repair clothing before recycling textiles that can no longer be worn.",
          },

          Furniture: {
            co2eFactor:
              1.0,

            tip:
              "Consider donating or repairing usable furniture before sending damaged items to an appropriate recovery facility.",
          },
        };


        // ==================================================
        // 5. Confirm supported material
        // ==================================================

        const materialData =
          materialFactors[
              cleanMaterial
          ];


        if (!materialData) {
          throw new HttpsError(
              "invalid-argument",
              "The selected material is not supported.",
          );
        }


        // ==================================================
        // 6. Calculate estimates
        // ==================================================

        const landfillDivertedKg =
          numericWeight;


        const estimatedCo2eSavedKg =
          numericWeight *
          materialData.co2eFactor;


        // ==================================================
        // 7. Determine impact level
        // ==================================================

        let impactLevel;


        if (
          estimatedCo2eSavedKg <
          5
        ) {
          impactLevel =
            "Small";
        } else if (
          estimatedCo2eSavedKg <
          20
        ) {
          impactLevel =
            "Moderate";
        } else {
          impactLevel =
            "High";
        }


        // ==================================================
        // 8. Build result
        // ==================================================

        const result = {
          material:
            cleanMaterial,

          weightKg:
            Number(
                numericWeight
                    .toFixed(
                        2,
                    ),
            ),

          landfillDivertedKg:
            Number(
                landfillDivertedKg
                    .toFixed(
                        2,
                    ),
            ),

          estimatedCo2eSavedKg:
            Number(
                estimatedCo2eSavedKg
                    .toFixed(
                        2,
                    ),
            ),

          impactLevel:
            impactLevel,

          tip:
            materialData.tip,

          disclaimer:
            "Environmental impact values are illustrative educational estimates for the ZWV Circular Hub project and are not official life-cycle assessment figures.",
        };


        logger.info(
            "Recycling impact calculated.",
            {
              material:
                cleanMaterial,

              weightKg:
                numericWeight,

              estimatedCo2eSavedKg:
                result
                    .estimatedCo2eSavedKg,
            },
        );


        return result;
      },
  );


// ======================================================
// CLOUD FUNCTION:
// recommendRecyclingLocations
// ======================================================
//
// Purpose:
//
// Recommend recycling locations using server-side
// filtering, scoring and ranking.
//
// Ranking considers:
//
// 1. Whether the location accepts the selected material
// 2. Exact postcode match
// 3. Whether the location is currently open
// 4. Location rating
// 5. Approximate distance
// ======================================================

exports.recommendRecyclingLocations =
  onCall(
      {
        region:
          "australia-southeast2",

        maxInstances:
          5,
      },

      async (request) => {
        // ==================================================
        // 1. Read input
        // ==================================================

        const {
          material,
          postcode,
        } =
          request.data || {};


        // ==================================================
        // 2. Supported materials
        // ==================================================

        const supportedMaterials = [
          "Batteries",
          "E-Waste",
          "Plastics",
          "Clothing",
          "Furniture",
        ];


        // ==================================================
        // 3. Validate material
        // ==================================================

        if (
          !material ||
          typeof material !==
            "string"
        ) {
          throw new HttpsError(
              "invalid-argument",
              "Please select a recycling material.",
          );
        }


        const cleanMaterial =
          material.trim();


        if (
          !supportedMaterials.includes(
              cleanMaterial,
          )
        ) {
          throw new HttpsError(
              "invalid-argument",
              "The selected recycling material is not supported.",
          );
        }


        // ==================================================
        // 4. Validate postcode
        // ==================================================

        if (
          !postcode ||
          typeof postcode !==
            "string"
        ) {
          throw new HttpsError(
              "invalid-argument",
              "Please enter a Victorian postcode.",
          );
        }


        const cleanPostcode =
          postcode.trim();


        const postcodePattern =
          /^\d{4}$/;


        if (
          !postcodePattern.test(
              cleanPostcode,
          )
        ) {
          throw new HttpsError(
              "invalid-argument",
              "Postcode must contain exactly four digits.",
          );
        }


        // ==================================================
        // 5. Filter by accepted material
        // ==================================================

        const matchingLocations =
          recyclingLocations.filter(
              (
                  location,
              ) =>
                Array.isArray(
                    location
                        .acceptedMaterials,
                ) &&
                location
                    .acceptedMaterials
                    .includes(
                        cleanMaterial,
                    ),
          );


        // ==================================================
        // 6. Score every matching location
        // ==================================================

        const rankedLocations =
          matchingLocations.map(
              (
                  location,
              ) => {
                const samePostcode =
                  location.postcode ===
                  cleanPostcode;


                const isOpen =
                  location.status ===
                  "Open";


                let recommendationScore =
                  0;


                // ------------------------------------------
                // Exact postcode match
                // ------------------------------------------

                if (samePostcode) {
                  recommendationScore +=
                    100;
                }


                // ------------------------------------------
                // Open status
                // ------------------------------------------

                if (isOpen) {
                  recommendationScore +=
                    40;
                }


                // ------------------------------------------
                // Rating bonus
                // ------------------------------------------

                recommendationScore +=
                  Number(
                      location.rating,
                  ) *
                  5;


                // ------------------------------------------
                // Approximate distance bonus
                // ------------------------------------------

                const distanceBonus =
                  Math.max(
                      0,

                      20 -
                      Number(
                          location.distance,
                      ),
                  );


                recommendationScore +=
                  distanceBonus;


                // ------------------------------------------
                // Human-readable recommendation reasons
                // ------------------------------------------

                const reasons = [
                  `Accepts ${cleanMaterial}`,
                ];


                if (samePostcode) {
                  reasons.push(
                      "Same postcode",
                  );
                }


                if (isOpen) {
                  reasons.push(
                      "Currently open",
                  );
                } else {
                  reasons.push(
                      "Currently closed",
                  );
                }


                if (
                  Number(
                      location.rating,
                  ) >=
                  4.5
                ) {
                  reasons.push(
                      "Highly rated",
                  );
                }


                return {
                  ...location,

                  samePostcode:
                    samePostcode,

                  recommendationScore:
                    Number(
                        recommendationScore
                            .toFixed(
                                1,
                            ),
                    ),

                  recommendationReasons:
                    reasons,
                };
              },
          );


        // ==================================================
        // 7. Sort recommendations
        // ==================================================

        rankedLocations.sort(
            (
                first,
                second,
            ) => {
              // ------------------------------------------
              // Exact postcode first
              // ------------------------------------------

              if (
                first.samePostcode !==
                second.samePostcode
              ) {
                return first.samePostcode
                  ? -1
                  : 1;
              }


              // ------------------------------------------
              // Open locations first
              // ------------------------------------------

              if (
                first.status !==
                second.status
              ) {
                if (
                  first.status ===
                  "Open"
                ) {
                  return -1;
                }


                if (
                  second.status ===
                  "Open"
                ) {
                  return 1;
                }
              }


              // ------------------------------------------
              // Higher rating first
              // ------------------------------------------

              if (
                first.rating !==
                second.rating
              ) {
                return (
                  Number(
                      second.rating,
                  ) -
                  Number(
                      first.rating,
                  )
                );
              }


              // ------------------------------------------
              // Shorter approximate distance first
              // ------------------------------------------

              return (
                Number(
                    first.distance,
                ) -
                Number(
                    second.distance,
                )
              );
            },
        );


        // ==================================================
        // 8. Return top five
        // ==================================================

        const recommendations =
          rankedLocations.slice(
              0,
              5,
          );


        // ==================================================
        // 9. Log result
        // ==================================================

        logger.info(
            "Recycling location recommendations generated.",
            {
              material:
                cleanMaterial,

              postcode:
                cleanPostcode,

              totalMatches:
                matchingLocations.length,

              returned:
                recommendations.length,
            },
        );


        // ==================================================
        // 10. Return structured response
        // ==================================================

        return {
          material:
            cleanMaterial,

          postcode:
            cleanPostcode,

          totalMatches:
            matchingLocations.length,

          returnedCount:
            recommendations.length,

          recommendations:
            recommendations,

          rankingExplanation:
            "Locations are ranked by postcode match, open status, rating and approximate distance.",
        };
      },
  );


// ======================================================
// CLOUD FUNCTION:
// calculateRouteSustainability
// ======================================================
//
// Purpose:
//
// Analyse the sustainability of a route calculated by
// the Recycling Map.
//
// The frontend first uses Mapbox to calculate:
//
// - Travel mode
// - Route distance
// - Route duration
//
// These values are then sent to this Firebase callable
// Cloud Function for independent server-side analysis.
//
// Supported travel modes:
//
// - driving
// - walking
// - cycling
// ======================================================

exports.calculateRouteSustainability =
  onCall(
      {
        region:
          "australia-southeast2",

        maxInstances:
          5,
      },

      async (request) => {
        // ==================================================
        // 1. Read input
        // ==================================================

        const {
          travelMode,
          distanceMeters,
          durationSeconds,
        } =
          request.data || {};


        // ==================================================
        // 2. Validate travel mode
        // ==================================================

        const supportedTravelModes = [
          "driving",
          "walking",
          "cycling",
        ];


        if (
          !travelMode ||
          typeof travelMode !==
            "string" ||
          !supportedTravelModes.includes(
              travelMode,
          )
        ) {
          throw new HttpsError(
              "invalid-argument",
              "Travel mode must be driving, walking or cycling.",
          );
        }


        // ==================================================
        // 3. Validate route distance
        // ==================================================

        const numericDistanceMeters =
          Number(
              distanceMeters,
          );


        if (
          !Number.isFinite(
              numericDistanceMeters,
          ) ||
          numericDistanceMeters <=
            0
        ) {
          throw new HttpsError(
              "invalid-argument",
              "Route distance must be greater than zero.",
          );
        }


        // Protect function from unrealistic values.

        if (
          numericDistanceMeters >
          1000000
        ) {
          throw new HttpsError(
              "invalid-argument",
              "Route distance is outside the supported range.",
          );
        }


        // ==================================================
        // 4. Validate route duration
        // ==================================================

        const numericDurationSeconds =
          Number(
              durationSeconds,
          );


        if (
          !Number.isFinite(
              numericDurationSeconds,
          ) ||
          numericDurationSeconds <=
            0
        ) {
          throw new HttpsError(
              "invalid-argument",
              "Route duration must be greater than zero.",
          );
        }


        if (
          numericDurationSeconds >
          86400
        ) {
          throw new HttpsError(
              "invalid-argument",
              "Route duration is outside the supported range.",
          );
        }


        // ==================================================
        // 5. Convert route values
        // ==================================================

        const distanceKm =
          numericDistanceMeters /
          1000;


        const durationMinutes =
          numericDurationSeconds /
          60;


        // ==================================================
        // 6. Educational emission factors
        // ==================================================
        //
        // Illustrative estimates for the university project.
        //
        // kg CO2e per kilometre:
        //
        // driving = 0.192
        // walking = 0
        // cycling = 0
        // ==================================================

        const emissionFactors = {
          driving:
            0.192,

          walking:
            0,

          cycling:
            0,
        };


        const emissionFactor =
          emissionFactors[
              travelMode
          ];


        // ==================================================
        // 7. Calculate estimated emissions
        // ==================================================

        const estimatedCo2eKg =
          distanceKm *
          emissionFactor;


        // ==================================================
        // 8. Calculate Eco Score
        // ==================================================

        let ecoScore;


        if (
          travelMode ===
            "walking" ||
          travelMode ===
            "cycling"
        ) {
          ecoScore =
            100;
        } else {
          ecoScore =
            Math.max(
                15,

                Math.round(
                    70 -
                    distanceKm *
                    3.5,
                ),
            );
        }


        // ==================================================
        // 9. Sustainability level
        // ==================================================

        let sustainabilityLevel;


        if (
          ecoScore >=
          80
        ) {
          sustainabilityLevel =
            "Excellent";
        } else if (
          ecoScore >=
          60
        ) {
          sustainabilityLevel =
            "Good";
        } else if (
          ecoScore >=
          40
        ) {
          sustainabilityLevel =
            "Moderate";
        } else {
          sustainabilityLevel =
            "High Impact";
        }


        // ==================================================
        // 10. Greener alternative
        // ==================================================

        let greenerAlternative =
          null;


        let potentialCo2eSavingKg =
          0;


        let resultMessage;


        if (
          travelMode ===
          "driving"
        ) {
          if (
            distanceKm <=
            2
          ) {
            greenerAlternative =
              "walking";

            resultMessage =
              "For this short journey, walking may be a practical lower-emission alternative.";
          } else {
            greenerAlternative =
              "cycling";

            resultMessage =
              "Cycling could reduce direct travel emissions for this journey if the route is practical and safe.";
          }


          potentialCo2eSavingKg =
            estimatedCo2eKg;
        } else if (
          travelMode ===
          "cycling"
        ) {
          resultMessage =
            "Cycling is a strong low-emission travel choice for this route.";
        } else {
          resultMessage =
            "Walking is a strong low-emission travel choice for this route.";
        }


        // ==================================================
        // 11. Travel mode label
        // ==================================================

        const travelModeLabels = {
          driving:
            "Driving",

          walking:
            "Walking",

          cycling:
            "Cycling",
        };


        // ==================================================
        // 12. Build structured response
        // ==================================================

        const result = {
          travelMode:
            travelMode,

          travelModeLabel:
            travelModeLabels[
                travelMode
            ],

          distanceKm:
            Number(
                distanceKm
                    .toFixed(
                        2,
                    ),
            ),

          durationMinutes:
            Number(
                durationMinutes
                    .toFixed(
                        1,
                    ),
            ),

          estimatedCo2eKg:
            Number(
                estimatedCo2eKg
                    .toFixed(
                        3,
                    ),
            ),

          ecoScore:
            ecoScore,

          sustainabilityLevel:
            sustainabilityLevel,

          greenerAlternative:
            greenerAlternative,

          potentialCo2eSavingKg:
            Number(
                potentialCo2eSavingKg
                    .toFixed(
                        3,
                    ),
            ),

          message:
            resultMessage,

          disclaimer:
            "Travel emissions and Eco Scores are illustrative educational estimates for the ZWV Circular Hub project and are not official transport emissions calculations.",
        };


        // ==================================================
        // 13. Log successful analysis
        // ==================================================

        logger.info(
            "Route sustainability calculated.",
            {
              travelMode:
                travelMode,

              distanceKm:
                result.distanceKm,

              durationMinutes:
                result.durationMinutes,

              estimatedCo2eKg:
                result.estimatedCo2eKg,

              ecoScore:
                result.ecoScore,

              sustainabilityLevel:
                result
                    .sustainabilityLevel,
            },
        );


        // ==================================================
        // 14. Return result
        // ==================================================

        return result;
      },
  );