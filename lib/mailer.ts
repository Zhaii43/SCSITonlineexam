import * as nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST ?? "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT ?? 587),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER!,
    pass: process.env.EMAIL_PASS!,
  },
});

const FROM = process.env.EMAIL_FROM ?? `SCSIT Online Exam <${process.env.EMAIL_USER}>`;

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  otp: string,
  frontendUrl: string
) {
  await transporter.sendMail({
    from: FROM,
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
  await transporter.sendMail({
    from: FROM,
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
