import { mailtrapClient, sender } from "../configs/mailtrap.config.js";
import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
} from "./emailTemplates.js";

export const sendVerificationEmail = async (email, verificationToken) => {
  const recipient = [{ email }];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Verify your email",
      html: VERIFICATION_EMAIL_TEMPLATE.replace(
        "{verificationCode}",
        verificationToken
      ),
      category: "Email Verification",
    });
    console.log("Email sent successfully:", response);
  } catch (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

export const sendWelcomeEmail = async (email, fullname) => {
  const recipient = [{ email }];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Welcome to Our Service",
      html: `<p>Hi ${fullname},</p><p>Welcome to our service! We're glad to have you on board.</p>`,
      category: "Welcome Email",
    });
    console.log("Welcome email sent successfully:", response);
  } catch (error) {
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};

export const sendPasswordResetEmail = async (email, resetURL) => {
  const recipient = [{ email }];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Password Reset Request",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
      category: "Password Reset",
    });
    console.log("Password reset email sent successfully:", response);
  } catch (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

export const sendResetSuccessEmail = async (email) => {
  const recipient = [{ email }];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Password Reset Successful",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
      category: "Password Reset Success",
    });
    console.log("Password reset success email sent successfully:", response);
  } catch (error) {
    throw new Error(`Failed to send password reset success email: ${error.message}`);
  };
};