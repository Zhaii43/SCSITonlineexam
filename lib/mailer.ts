import nodemailer from "nodemailer";

export const runtime = "nodejs";

const getRequiredEnv = (key: string): string => {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

const buildTransport = () => {
  const user = getRequiredEnv("MAILER_GMAIL_USER");
  const password = getRequiredEnv("MAILER_GMAIL_APP_PASSWORD").replace(/\s+/g, "");
  return nodemailer.createTransport({ service: "gmail", auth: { user, pass: password } });
};

const buildFromAddress = (): string => {
  const fromEmail = process.env.MAILER_FROM_EMAIL?.trim() || getRequiredEnv("MAILER_GMAIL_USER");
  const fromName = process.env.MAILER_FROM_NAME?.trim();
  return fromName ? `${fromName} <${fromEmail}>` : fromEmail;
};

async function sendMail(recipient: string, subject: string, textBody: string, htmlBody: string) {
  const transporter = buildTransport();
  await transporter.sendMail({
    from: buildFromAddress(),
    to: recipient,
    subject,
    text: textBody,
    html: htmlBody,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  otp: string,
  frontendUrl: string = "https://scsi-tonlineexam.vercel.app"
) {
  await sendMail(
    to,
    "Password Reset Request",
    `Hello ${firstName},\n\nYour SCSIT Online Exam password reset code is: ${otp}\n\nThis code expires in 15 minutes.\n\nReset page: ${frontendUrl}/reset-password?token=${otp}`,
    `<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
      <h2>Password Reset Request</h2>
      <p>Hello ${firstName},</p>
      <p>Your SCSIT Online Exam password reset code is:</p>
      <h1 style="letter-spacing:8px;color:#0f172a">${otp}</h1>
      <p>This code expires in 15 minutes.</p>
      <p><a href="${frontendUrl}/reset-password?token=${otp}" style="background:#0f172a;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Reset Password</a></p>
    </div>`
  );
}

export async function sendEmailChangeOtp(to: string, otp: string) {
  await sendMail(
    to,
    "Verify Your Email - SCSIT Online Exam",
    `Your SCSIT Online Exam verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
    `<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
      <h2>Email Verification</h2>
      <p>Your SCSIT Online Exam verification code is:</p>
      <h1 style="letter-spacing:8px;color:#0f172a">${otp}</h1>
      <p>This code expires in 10 minutes.</p>
    </div>`
  );
}
