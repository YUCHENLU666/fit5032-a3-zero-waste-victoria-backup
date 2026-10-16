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
                        // Ignore orphan Firestore
                        // profiles that no longer have
                        // Firebase Authentication accounts.

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
        // 9. Validate optional attachment
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
// calculateRecyclingImpact
// ======================================================
//
// Purpose:
//
// Calculate an educational estimate of the environmental
// impact produced by recycling a selected material.
//
// This is an independent non-email Cloud Function.
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
//
// This is independent non-email Cloud Function #2.
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
              (location) =>
                Array.isArray(
                    location.acceptedMaterials,
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
              (location) => {
                const samePostcode =
                  location.postcode ===
                  cleanPostcode;


                const isOpen =
                  location.status ===
                  "Open";


                let recommendationScore =
                  0;


                // ------------------------------------------
                // Exact postcode
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
                // Rating
                //
                // Example:
                // 4.8 stars = 24 points
                // ------------------------------------------

                recommendationScore +=
                  Number(
                      location.rating,
                  ) * 5;


                // ------------------------------------------
                // Approximate distance bonus
                //
                // Existing project dataset already includes
                // an approximate distance field.
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
                // Human-readable reasons
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
              // Open before closed
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
        // 9. Log successful recommendation
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
//
// This is independent non-email Cloud Function #3.
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


        // Protect the function from unrealistic values.

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
        // These values are illustrative estimates used
        // for this university project.
        //
        // They are NOT official transport emissions
        // accounting figures.
        //
        // kg CO2e per kilometre:
        //
        // driving = 0.192
        // walking = 0 direct travel emissions
        // cycling = 0 direct travel emissions
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
        //
        // Walking and cycling receive the highest score
        // because the model considers direct travel
        // emissions only.
        //
        // Driving begins at a lower score and decreases
        // as route distance increases.
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


        let message;


        if (
          travelMode ===
          "driving"
        ) {
          // -----------------------------------------------
          // Short routes:
          // walking may be practical.
          // -----------------------------------------------

          if (
            distanceKm <=
            2
          ) {
            greenerAlternative =
              "walking";

            message =
              "For this short journey, walking may be a practical lower-emission alternative.";
          } else {
            // ---------------------------------------------
            // Longer local routes:
            // cycling may be more practical than walking.
            // ---------------------------------------------

            greenerAlternative =
              "cycling";

            message =
              "Cycling could reduce direct travel emissions for this journey if the route is practical and safe.";
          }


          potentialCo2eSavingKg =
            estimatedCo2eKg;
        } else if (
          travelMode ===
          "cycling"
        ) {
          message =
            "Cycling is a strong low-emission travel choice for this route.";
        } else {
          message =
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
            message,

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