import nodemailer from "nodemailer";
import { getAcademySettings } from "@/lib/academy-settings";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function getProviderName() {
  return process.env.EMAIL_PROVIDER?.trim() || "console";
}

export async function sendEmail({ to, subject, html: _html, text }: EmailPayload) {
  const providerName = getProviderName();
  const academy = await getAcademySettings();

  if (providerName === "console" && process.env.NODE_ENV !== "production") {
    console.info(`[email:${providerName}] ${subject} -> ${to}`);
    console.info(text);
    return { ok: true, provider: providerName };
  }

  const host = process.env.EMAIL_HOST?.trim();
  const port = Number(process.env.EMAIL_PORT || 587);
  if (providerName !== "smtp" || !host || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Email delivery requires EMAIL_PROVIDER=smtp, a valid EMAIL_HOST, and a valid EMAIL_PORT.");
  }

  const user = process.env.EMAIL_USER?.trim();
  const password = process.env.EMAIL_PASS;
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    ...(user && password ? { auth: { user, pass: password } } : {}),
  });
  const from = process.env.EMAIL_FROM?.trim() || user || academy.email;
  const result = await transporter.sendMail({
    ...(from ? { from } : {}),
    to,
    subject,
    html: _html,
    text,
  });
  return { ok: true, provider: providerName, messageId: result.messageId };
}

export async function sendVerificationEmail({ name, email, verificationUrl }: { name: string; email: string; verificationUrl: string }) {
  const academy = await getAcademySettings();
  const subject = "Verify your email address";
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0f172a;">
      <div style="background:#0f172a;border-radius:12px;padding:24px 28px;color:#fff;">
        <h2 style="margin:0 0 8px;font-size:24px;">${academy.name}</h2>
        <p style="margin:0;color:#cbd5e1;">Welcome to your learning journey.</p>
      </div>
      <div style="padding:24px 0;">
        <p style="font-size:16px;">Hi ${name || "there"},</p>
        <p>Thanks for creating your account. Please verify your email address to activate your account.</p>
        <p><a href="${verificationUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700;">Verify email</a></p>
        <p style="color:#475569;">This link expires in 24 hours. If you did not create an account, you can safely ignore this email.</p>
      </div>
    </div>
  `;
  const text = `Hi ${name || "there"},\n\nPlease verify your account here: ${verificationUrl}\n\nThis link expires in 24 hours.`;

  return sendEmail({ to: email, subject, html, text });
}

export async function sendPasswordResetEmail({ name, email, resetUrl }: { name: string; email: string; resetUrl: string }) {
  const academy = await getAcademySettings();
  const subject = "Reset your password";
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0f172a;">
      <div style="background:#0f172a;border-radius:12px;padding:24px 28px;color:#fff;">
        <h2 style="margin:0 0 8px;font-size:24px;">${academy.name}</h2>
        <p style="margin:0;color:#cbd5e1;">Secure account recovery</p>
      </div>
      <div style="padding:24px 0;">
        <p style="font-size:16px;">Hi ${name || "there"},</p>
        <p>We received a request to reset your password. Use the secure link below to continue.</p>
        <p><a href="${resetUrl}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700;">Reset password</a></p>
        <p style="color:#475569;">This link expires in 30 minutes. If you did not request a password reset, you can ignore this message.</p>
      </div>
    </div>
  `;
  const text = `Hi ${name || "there"},\n\nReset your password here: ${resetUrl}\n\nThis link expires in 30 minutes.`;

  return sendEmail({ to: email, subject, html, text });
}

export async function sendWelcomeEmail({ name, email }: { name: string; email: string }) {
  const academy = await getAcademySettings();
  return sendEmail({
    to: email,
    subject: `Welcome to ${academy.name}`,
    html: `<div style="font-family:Arial,sans-serif;...">Welcome ${name || "friend"}</div>`,
    text: `Welcome ${name || "friend"}! Your account is active and ready to explore ${academy.name}.`,
  });
}
