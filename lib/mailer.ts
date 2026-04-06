import * as nodemailer from "nodemailer";

function requireEnv(name: "EMAIL_USER" | "EMAIL_PASS") {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required email configuration: ${name}`);
  }
  return value;
}

function createTransporter() {
  const user = requireEnv("EMAIL_USER");
  const pass = requireEnv("EMAIL_PASS");

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST ?? "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT ?? 587),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user,
      pass,
    },
  });
}

function getFromAddress() {
  const configured = process.env.EMAIL_FROM?.trim();
  if (configured) {
    return configured;
  }

  const user = process.env.EMAIL_USER?.trim();
  if (user) {
    return `SCSIT Online Exam <${user}>`;
  }

  throw new Error("Missing required email configuration: EMAIL_FROM or EMAIL_USER");
}

export function hasPasswordResetMailerConfig() {
  return Boolean(process.env.EMAIL_USER?.trim() && process.env.EMAIL_PASS?.trim());
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  otp: string,
  frontendUrl: string
) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject: "Password Reset Request",
    html: `
      <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
        <h2>Password Reset Request</h2>
        <p>Hello ${firstName},</p>
        <p>Your SCSIT Online Exam password reset code is:</p>
        <h1 style="letter-spacing:8px;color:#0f172a">${otp}</h1>
        <p>This code expires in 15 minutes.</p>
        <p><a href="${frontendUrl}/reset-password?token=${otp}" style="background:#0f172a;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Reset Password</a></p>
      </div>`,
    text: `Hello ${firstName},\n\nYour password reset code is: ${otp}\n\nThis code expires in 15 minutes.\n\nReset page: ${frontendUrl}/reset-password?token=${otp}`,
  });
}

export async function sendEmailChangeOtp(to: string, otp: string) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject: "Verify Your Email - SCSIT Online Exam",
    html: `
      <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
        <h2>Email Verification</h2>
        <p>Your SCSIT Online Exam verification code is:</p>
        <h1 style="letter-spacing:8px;color:#0f172a">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
      </div>`,
    text: `Your SCSIT Online Exam verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
  });
}
