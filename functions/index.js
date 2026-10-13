const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const {Resend} = require("resend");
const {Buffer} = require("node:buffer");

setGlobalOptions({
  maxInstances: 10,
});

const resendApiKey = defineSecret("RESEND_API_KEY");

const isValidEmail = (email) => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
};

exports.sendEmail = onCall(
    {
      region: "australia-southeast2",
      secrets: [resendApiKey],
      maxInstances: 5,
    },
    async (request) => {
      // Only signed-in Firebase users can send emails.
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "You must be signed in to send an email.",
        );
      }

      const {
        to,
        subject,
        message,
        attachment,
      } = request.data || {};

      // Validate recipient.
      if (!to || typeof to !== "string" || !isValidEmail(to.trim())) {
        throw new HttpsError(
            "invalid-argument",
            "Please provide a valid recipient email address.",
        );
      }

      // Validate subject.
      if (
        !subject ||
        typeof subject !== "string" ||
        subject.trim().length < 1 ||
        subject.trim().length > 150
      ) {
        throw new HttpsError(
            "invalid-argument",
            "Subject must be between 1 and 150 characters.",
        );
      }

      // Validate message.
      if (
        !message ||
        typeof message !== "string" ||
        message.trim().length < 1 ||
        message.trim().length > 5000
      ) {
        throw new HttpsError(
            "invalid-argument",
            "Message must be between 1 and 5000 characters.",
        );
      }

      const attachments = [];

      if (attachment) {
        if (
          typeof attachment.filename !== "string" ||
          typeof attachment.content !== "string"
        ) {
          throw new HttpsError(
              "invalid-argument",
              "The attachment is invalid.",
          );
        }

        // Roughly limit the Base64 attachment payload.
        const maxBase64Length = 3 * 1024 * 1024;

        if (attachment.content.length > maxBase64Length) {
          throw new HttpsError(
              "invalid-argument",
              "The attachment is too large.",
          );
        }

        attachments.push({
          filename: attachment.filename,
          content: Buffer.from(
              attachment.content,
              "base64",
          ),
        });
      }

      try {
        const resend = new Resend(resendApiKey.value());

        const emailData = {
          from: "ZWV Circular Hub <onboarding@resend.dev>",
          to: [to.trim()],
          subject: subject.trim(),
          text: message.trim(),
        };

        if (attachments.length > 0) {
          emailData.attachments = attachments;
        }

        const {data, error} = await resend.emails.send(emailData);

        if (error) {
          logger.error("Resend rejected the email request", {
            error,
            uid: request.auth.uid,
          });

          throw new HttpsError(
              "internal",
              "The email could not be sent.",
          );
        }

        logger.info("Email sent successfully", {
          uid: request.auth.uid,
          emailId: data?.id,
        });

        return {
          success: true,
          emailId: data?.id || null,
          message: "Email sent successfully.",
        };
      } catch (error) {
        if (error instanceof HttpsError) {
          throw error;
        }

        logger.error("Unexpected email sending error", {
          message: error.message,
          uid: request.auth.uid,
        });

        throw new HttpsError(
            "internal",
            "An unexpected error occurred while sending the email.",
        );
      }
    },
);