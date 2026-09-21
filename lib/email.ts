import nodemailer from "nodemailer";
import { COMPANY } from "@/lib/constants";

/**
 * getMailTransport
 * Purpose: Creates a nodemailer transport using SMTP settings from env vars.
 * Required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * Falls back to a noop transport if SMTP is not configured (warns in dev).
 */
function getMailTransport() {
  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV === "development") {
      console.warn("SMTP not configured — emails will be logged to console instead of sent");
    }
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * sendWelcomeEmail
 * Purpose: Sends a professional welcome email to a newly created user with
 * their account details. Uses the bank's SMTP configuration.
 * Inputs: user email, full name, account number, account type, temp password
 * Outputs: true on success, false on failure (logged to console)
 */
export async function sendWelcomeEmail({
  email,
  fullName,
  accountNumber,
  accountType,
  temporaryPassword,
}: {
  email: string;
  fullName: string;
  accountNumber?: string;
  accountType?: string;
  temporaryPassword?: string;
}): Promise<boolean> {
  const transport = getMailTransport();
  const accountTypeLabel = accountType
    ? accountType.charAt(0).toUpperCase() + accountType.slice(1).replace(/_/g, " ")
    : "Checking";
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL || "https://riverstoneunion.com";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #0b1120; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
    .card { background: #1a2332; border: 1px solid rgba(255,255,255,0.08);
            border-radius: 16px; padding: 40px 32px; }
    .logo { text-align: center; margin-bottom: 28px; }
    .logo h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.3px; }
    .logo span { color: #3b82f6; }
    h2 { color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 16px 0; }
    p { color: rgba(255,255,255,0.6); font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; }
    .details { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
               border-radius: 12px; padding: 20px; margin: 20px 0; }
    .details dt { color: rgba(255,255,255,0.4); font-size: 12px; margin-top: 12px; }
    .details dd { color: #ffffff; font-size: 14px; font-weight: 600; margin: 4px 0 0 0; }
    .details dd:first-of-type { margin-top: 0; }
    .button { display: inline-block; background: #3b82f6; color: #ffffff;
              text-decoration: none; font-weight: 600; font-size: 14px;
              padding: 14px 32px; border-radius: 12px; text-align: center; }
    .warning { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2);
               border-radius: 12px; padding: 16px; margin: 20px 0; }
    .warning p { color: #fbbf24; font-size: 13px; margin: 0; }
    .footer { margin-top: 28px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.06);
              text-align: center; }
    .footer p { font-size: 12px; color: rgba(255,255,255,0.3); margin: 4px 0; }
    .badge { display: inline-block; background: rgba(59,130,246,0.1); color: #60a5fa;
             font-size: 11px; padding: 4px 12px; border-radius: 20px; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <h1>Riverstone <span>Union</span></h1>
      </div>

      <h2>Welcome to Riverstone Union</h2>
      <p>Dear ${fullName},</p>
      <p>
        Your account has been successfully created. Below are your account details.
        Please keep this information secure and do not share it with anyone.
      </p>

      <div class="details">
        <dt>Account Holder</dt>
        <dd>${fullName}</dd>

        ${accountNumber ? `<dt>Account Number</dt><dd>${accountNumber}</dd>` : ""}

        ${accountType ? `<dt>Account Type</dt><dd>${accountTypeLabel}</dd>` : ""}
      </div>

      <p style="text-align:center; margin: 24px 0;">
        <a href="${loginUrl}/sign-in" class="button">Sign In to Your Account</a>
      </p>

      ${temporaryPassword ? `<div class="warning">
        <p><strong>⚠ Temporary Password</strong></p>
        <p style="margin-top: 8px;">Your temporary password is: <strong>${temporaryPassword}</strong></p>
        <p style="margin-top: 8px;">For security reasons, please change your password after your first sign-in.</p>
      </div>` : ""}

      <p style="font-size: 13px; color: rgba(255,255,255,0.5);">
        If you did not request this account or believe this is an error,
        please contact our support team immediately at ${COMPANY.SUPPORT_EMAIL}.
      </p>

      <div class="footer">
        <div class="badge">🔒 Protected by POV Security</div>
        <p>${COMPANY.LEGAL_NAME}</p>
        <p>${COMPANY.ADDRESS}</p>
        <p>This is an automated message. Do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  if (!transport) {
    // Log the email in development when SMTP is not configured
    console.log(`[EMAIL] Welcome email to ${email}:`, {
      to: email,
      subject: `Welcome to ${COMPANY.NAME} — Your Account is Ready`,
      fullName,
      accountNumber,
    });
    return true;
  }

  try {
    await transport.sendMail({
      from: `"${COMPANY.NAME}" <${process.env.SMTP_FROM || "noreply@riverstoneunion.com"}>`,
      to: email,
      subject: `Welcome to ${COMPANY.NAME} — Your Account is Ready`,
      html,
    });
    return true;
  } catch (err) {
    console.error("Failed to send welcome email:", err);
    return false;
  }
}