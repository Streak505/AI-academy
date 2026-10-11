import nodemailer, { type Transporter } from "nodemailer";
import { academy as fallbackAcademy } from "@/config/academy";
import { getAcademySettings } from "@/lib/academy-settings";

type EmailPayload = { to: string; subject: string; html: string; text: string };
type EmailAcademy = { name: string; whatsappNumber: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

async function getEmailAcademy(): Promise<EmailAcademy> {
  try {
    const settings = await getAcademySettings();
    return { name: settings.name, whatsappNumber: settings.whatsappNumber };
  } catch (error) {
    console.error("Unable to load academy email settings; using configured fallback:", error);
    return { name: fallbackAcademy.name, whatsappNumber: fallbackAcademy.whatsappNumber };
  }
}

function whatsappLink(phone: string, message: string) {
  const number = phone.replace(/\D/g, "");
  if (!/^\d{7,15}$/.test(number) || phone.startsWith("TODO_REPLACE")) return "";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function renderEmail(academyName: string, whatsappNumber: string, body: string) {
  const link = whatsappLink(whatsappNumber, `Hello ${academyName}, I have a question about my request.`);
  return `${body}${link ? `<hr style="border:0;border-top:1px solid #e2e8f0;margin:24px 0"><p style="font:14px Arial,sans-serif;color:#475569">Need help? <a href="${link}" style="color:#0f766e;font-weight:700">Chat with us on WhatsApp</a>.</p>` : ""}<p style="font:12px Arial,sans-serif;color:#64748b">${escapeHtml(academyName)}</p>`;
}

export async function sendEmail({ to, subject, html, text }: EmailPayload) {
  let transporter: Transporter | undefined;
  try {
    const provider = process.env.EMAIL_PROVIDER?.trim() || "console";
    const emailAcademy = await getEmailAcademy();
    const bodyHtml = html || `<pre style="white-space:pre-wrap;font:14px Arial,sans-serif">${escapeHtml(text)}</pre>`;
    const safeHtml = renderEmail(emailAcademy.name, emailAcademy.whatsappNumber, bodyHtml);
    const link = whatsappLink(emailAcademy.whatsappNumber, `Hello ${emailAcademy.name}, I have a question about my request.`);
    const emailText = `${text}${link ? `\n\nContact us on WhatsApp: ${link}` : ""}\n\n${emailAcademy.name}`;

    if (provider === "console" && process.env.NODE_ENV !== "production") {
      console.info(`[email:${provider}] ${subject} -> ${to}`);
      console.info(emailText);
      return { ok: true, provider };
    }
    if (provider !== "smtp") throw new Error("Set EMAIL_PROVIDER=smtp to deliver email outside local development.");

    const host = process.env.EMAIL_HOST?.trim();
    const port = Number(process.env.EMAIL_PORT || 587);
    const user = process.env.EMAIL_USER?.trim();
    const password = process.env.EMAIL_PASS;
    const from = process.env.EMAIL_FROM?.trim() || user;
    if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !from) {
      throw new Error("SMTP delivery requires valid EMAIL_HOST, EMAIL_PORT, and EMAIL_FROM settings.");
    }

    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 20000,
          ...(user && password ? { auth: { user, pass: password } } : {}),
        });
        const result = await transporter.sendMail({ from, to, subject, html: safeHtml, text: emailText });
        return { ok: true, provider, messageId: result.messageId };
      } catch (error) {
        lastError = error;
        if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 250));
      } finally {
        transporter?.close();
        transporter = undefined;
      }
    }
    console.error("SMTP email delivery failed after one retry:", lastError);
    return { ok: false, provider };
  } catch (error) {
    transporter?.close();
    console.error("Email delivery could not be completed:", error);
    return { ok: false, provider: process.env.EMAIL_PROVIDER?.trim() || "console" };
  }
}

function template(title: string, greeting: string, paragraphs: string[]) {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0f172a"><h1 style="font-size:22px">${escapeHtml(title)}</h1><p>${escapeHtml(greeting)}</p>${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}</div>`;
}

async function sendTemplate(to: string, subject: string, title: string, greeting: string, paragraphs: string[]) {
  const emailAcademy = await getEmailAcademy();
  const content = template(title, greeting, paragraphs);
  const text = [greeting, ...paragraphs, emailAcademy.name].join("\n\n");
  return sendEmail({ to, subject: `${subject} — ${emailAcademy.name}`, html: content, text });
}

export async function sendAdmissionReceivedEmail(input: { to: string; guardianName: string; studentName: string; reference: string; program: string }) {
  return sendTemplate(input.to, "Admission application received", "Application received", `Hello ${input.guardianName},`, [
    `We received the admission application for ${input.studentName}.`,
    `Program: ${input.program}. Reference: ${input.reference}.`,
    "The admissions team will review the application and contact you about the next steps.",
  ]);
}

export async function sendAdmissionApprovedEmail(input: { to: string; guardianName: string; studentName: string; reference: string }) {
  return sendTemplate(input.to, "Admission application approved", "Application approved", `Hello ${input.guardianName},`, [
    `The admission application for ${input.studentName} (${input.reference}) has been approved.`,
    "The academy will share enrollment and account details with you after enrollment is completed.",
  ]);
}

export async function sendEnrollmentEmail(input: {
  to: string; reference: string; regNo: string; studentEmail: string; studentPassword: string;
  parentEmail: string; parentPassword?: string;
}) {
  const parentLine = input.parentPassword
    ? `Parent login: ${input.parentEmail}; temporary password: ${input.parentPassword}.`
    : `Your existing parent account is linked: ${input.parentEmail}.`;
  return sendTemplate(input.to, "Enrollment complete", "Enrollment complete", `Application ${input.reference} is now enrolled.`, [
    `Student registration number: ${input.regNo}.`,
    `Student login: ${input.studentEmail}; temporary password: ${input.studentPassword}.`,
    parentLine,
    "Change temporary passwords immediately after signing in.",
  ]);
}

export async function sendChallanGeneratedEmail(input: { to: string; parentName: string; studentName: string; challanNo: string; amountPkr: number }) {
  return sendTemplate(input.to, "New fee challan", "Fee challan generated", `Hello ${input.parentName || "Parent"},`, [
    `A fee challan was generated for ${input.studentName}.`,
    `Challan: ${input.challanNo}. Amount due: PKR ${input.amountPkr.toLocaleString("en-PK")}.`,
    "Sign in to the parent or student portal to view and download the challan.",
  ]);
}

export async function sendPaymentStatusEmail(input: { to: string; parentName: string; studentName: string; status: "Verified" | "Rejected"; detail: string }) {
  return sendTemplate(input.to, `Fee payment ${input.status.toLowerCase()}`, `Payment ${input.status.toLowerCase()}`, `Hello ${input.parentName || "Parent"},`, [
    `The fee payment for ${input.studentName} was ${input.status.toLowerCase()}.`,
    input.detail,
    input.status === "Rejected" ? "Please review the note in the portal and contact the academy if you need help." : "The updated balance is available in the portal.",
  ]);
}

export async function sendAbsenceAlertEmail(input: { to: string; parentName: string; studentName: string; date: string }) {
  return sendTemplate(input.to, "Attendance update", "Attendance update", `Hello ${input.parentName || "Parent"},`, [
    `${input.studentName} was marked absent on ${input.date}.`,
    "Please contact the academy if you believe this record needs review.",
  ]);
}

export async function sendCounselingConfirmationEmail(input: { to: string; name: string; type: string; date: string; time: string; status: string; note?: string }) {
  return sendTemplate(input.to, `Counseling session ${input.status.toLowerCase()}`, "Counseling session update", `Hello ${input.name},`, [
    `Your ${input.type} session is ${input.status.toLowerCase()}.`,
    `Date: ${input.date}. Time: ${input.time} Pakistan time.`,
    ...(input.note ? [`Note: ${input.note}`] : []),
  ]);
}

export async function sendContactAutoReplyEmail(input: { to: string; name: string; subject: string }) {
  return sendTemplate(input.to, "We received your message", "Message received", `Hello ${input.name},`, [
    `We received your message about "${input.subject}".`,
    "Our team will review it and reply as soon as possible.",
  ]);
}

export async function sendVerificationEmail({ name, email, verificationUrl }: { name: string; email: string; verificationUrl: string }) {
  return sendTemplate(email, "Verify your email address", "Verify your email", `Hello ${name || "there"},`, [
    `Verify your account using this link: ${verificationUrl}`,
    "This link expires in 24 hours. If you did not create an account, you can ignore this message.",
  ]);
}

export async function sendPasswordResetEmail({ name, email, resetUrl }: { name: string; email: string; resetUrl: string }) {
  return sendTemplate(email, "Reset your password", "Secure account recovery", `Hello ${name || "there"},`, [
    `Use this secure link to reset your password: ${resetUrl}`,
    "This link expires in 30 minutes. If you did not request a password reset, you can ignore this message.",
  ]);
}

export async function sendWelcomeEmail({ name, email }: { name: string; email: string }) {
  return sendTemplate(email, "Welcome", "Welcome", `Hello ${name || "friend"},`, [
    "Your account is active and ready to explore learning programs.",
  ]);
}
