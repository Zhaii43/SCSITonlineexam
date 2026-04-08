import nodemailer from "nodemailer";

export const runtime = "nodejs";

type StudentApprovalEmail = {
  firstName: string;
  fullName?: string;
  username?: string;
  email?: string;
  schoolId?: string;
  department?: string;
  yearLevel?: string;
  approvedAt?: string;
};

type StudentRejectedEmail = {
  firstName: string;
  fullName?: string;
  schoolId?: string;
  department?: string;
  yearLevel?: string;
  rejectionReason?: string | null;
};

type ExamScheduledEmail = {
  id?: number;
  title: string;
  subject: string;
  department: string;
  examType: string;
  questionType?: string;
  scheduledDate: string;
  expirationTime?: string;
  duration: number;
  totalPoints?: number;
  passingScore?: number;
  yearLevel: string;
  instructions?: string;
};

type AnnouncementEmail = {
  title: string;
  message: string;
  createdBy: string;
  createdAt: string;
  targetAudience?: string;
  department?: string;
  linkPath?: string;
};

type ResultsPublishedEmail = {
  examTitle: string;
  subject: string;
  score: number;
  totalItems: number;
  percentage: number;
  passed: boolean;
  dateTaken: string;
};

type DeanExamCreatedEmail = {
  id: number;
  title: string;
  subject: string;
  department: string;
  examType: string;
  scheduledDate: string;
  yearLevel: string;
};

type IssueReportEmail = {
  id: number;
  examTitle: string;
  questionOrder: number;
  issueType: string;
  reportedAnswer: string | null;
  description: string;
};

type IssueReportReplyEmail = {
  id: number;
  examTitle: string;
  questionOrder: number;
  status: string;
};

const getRequiredEnv = (key: string): string => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const buildTransport = () => {
  const user = getRequiredEnv("MAILER_GMAIL_USER");
  const password = getRequiredEnv("MAILER_GMAIL_APP_PASSWORD").replace(/\s+/g, "");
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass: password },
  });
};

const buildFromAddress = (): string => {
  const fromEmail = process.env.MAILER_FROM_EMAIL?.trim() || getRequiredEnv("MAILER_GMAIL_USER");
  const fromName = process.env.MAILER_FROM_NAME?.trim() || "SCSIT Online Exam";
  return `${fromName} <${fromEmail}>`;
};

function fullName(firstName: string, fallback?: string) {
  return fallback?.trim() || firstName.trim() || "there";
}

function formatMaybe(value: string | number | null | undefined, fallback = "Not specified") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return String(value);
}

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

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
          <tr>
            <td style="background:#0f172a;padding:24px 32px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:bold;">SCSIT Online Exam</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#0f172a;line-height:1.7;font-size:15px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:16px 32px;text-align:center;font-size:12px;color:#94a3b8;">
              &copy; ${new Date().getFullYear()} SCSIT Online Exam. This is an automated message, please do not reply.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function btn(href: string, label: string, secondary = false): string {
  return `<a href="${href}" style="display:inline-block;background:${secondary ? "#e2e8f0" : "#0f172a"};color:${secondary ? "#0f172a" : "#ffffff"};padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;margin-right:8px;">${label}</a>`;
}

function otpBlock(otp: string): string {
  return `<div style="background:#f1f5f9;border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
    <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Your verification code</p>
    <p style="margin:0;font-size:36px;font-weight:bold;letter-spacing:12px;color:#0f172a;">${otp}</p>
  </div>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:14px;color:#64748b;width:180px;vertical-align:top;">${label}</td>
    <td style="padding:6px 0;font-size:14px;color:#0f172a;font-weight:600;">${value}</td>
  </tr>`;
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  otp: string,
  frontendUrl = "https://scsi-tonlineexam.vercel.app",
) {
  const resetLink = `${frontendUrl}/reset-password?token=${otp}`;
  await sendMail(
    to,
    "Password Reset Request - SCSIT Online Exam",
    `Hello ${firstName},\n\nYour password reset code is: ${otp}\n\nThis code expires in 15 minutes.\n\nReset page: ${resetLink}`,
    layout(
      "Password Reset Request",
      `
      <h2 style="margin:0 0 8px;">Password Reset Request</h2>
      <p>Hello <strong>${firstName}</strong>,</p>
      <p>We received a request to reset your SCSIT Online Exam password. Use the code below to continue. It expires in <strong>15 minutes</strong>.</p>
      ${otpBlock(otp)}
      <p style="margin-top:24px;">${btn(resetLink, "Reset Password")}</p>
      <p style="font-size:13px;color:#64748b;margin-top:16px;">If you did not request a password reset, you can safely ignore this email.</p>
    `,
    ),
  );
}

export async function sendEmailChangeOtp(to: string, otp: string) {
  await sendMail(
    to,
    "Verify Your Email - SCSIT Online Exam",
    `Your SCSIT Online Exam email verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
    layout(
      "Email Verification",
      `
      <h2 style="margin:0 0 8px;">Verify Your Email Address</h2>
      <p>Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
      ${otpBlock(otp)}
      <p style="font-size:13px;color:#64748b;">If you did not request this, you can safely ignore this email.</p>
    `,
    ),
  );
}

export async function sendEmailVerificationOtp(to: string, firstName: string, otp: string) {
  await sendMail(
    to,
    "Verify Your Email - SCSIT Online Exam",
    `Hello ${firstName},\n\nYour SCSIT Online Exam verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
    layout(
      "Email Verification",
      `
      <h2 style="margin:0 0 8px;">Verify Your Email Address</h2>
      <p>Hello <strong>${firstName}</strong>,</p>
      <p>Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
      ${otpBlock(otp)}
      <p style="font-size:13px;color:#64748b;">If you did not request this, you can safely ignore this email.</p>
    `,
    ),
  );
}

export async function sendStudentApprovalEmail(to: string, account: StudentApprovalEmail, frontendUrl: string) {
  const name = fullName(account.firstName, account.fullName);
  await sendMail(
    to,
    "Your Account Has Been Approved - SCSIT Online Exam",
    `Hello ${name},\n\nYour SCSIT Online Exam student account has been approved.\n\nUsername: ${formatMaybe(account.username)}\nEmail: ${formatMaybe(account.email, to)}\nSchool ID: ${formatMaybe(account.schoolId)}\nDepartment: ${formatMaybe(account.department)}\nYear Level: ${formatMaybe(account.yearLevel)}\nApproved At: ${formatMaybe(account.approvedAt, "Recently approved")}\n\nLogin: ${frontendUrl}/login`,
    layout(
      "Account Approved",
      `
      <h2 style="margin:0 0 8px;">Your Account Has Been Approved</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your SCSIT Online Exam student account has been reviewed and <strong>approved</strong>. You can now sign in and access the system.</p>
      <table cellpadding="0" cellspacing="0" style="margin:20px 0;width:100%;">
        ${detailRow("Username", formatMaybe(account.username))}
        ${detailRow("Email", formatMaybe(account.email, to))}
        ${detailRow("School ID", formatMaybe(account.schoolId))}
        ${detailRow("Department", formatMaybe(account.department))}
        ${detailRow("Year Level", formatMaybe(account.yearLevel))}
        ${detailRow("Approved At", formatMaybe(account.approvedAt, "Recently approved"))}
      </table>
      <p style="margin-top:24px;">${btn(`${frontendUrl}/login`, "Log In Now")}</p>
    `,
    ),
  );
}

export async function sendStaffApprovalEmail(to: string, firstName: string, role: string, frontendUrl: string) {
  await sendMail(
    to,
    "Your Staff Account Has Been Approved - SCSIT Online Exam",
    `Hello ${firstName},\n\nYour SCSIT Online Exam staff account (${role}) has been approved.\n\nLogin: ${frontendUrl}/login`,
    layout(
      "Staff Account Approved",
      `
      <h2 style="margin:0 0 8px;">Staff Account Approved</h2>
      <p>Hello <strong>${firstName}</strong>,</p>
      <p>Your SCSIT Online Exam staff account has been approved with the role of <strong>${role}</strong>. You can now log in and access your dashboard.</p>
      <p style="margin-top:24px;">${btn(`${frontendUrl}/login`, "Go to Dashboard")}</p>
    `,
    ),
  );
}

export async function sendStudentRejectedEmail(to: string, rejection: StudentRejectedEmail, frontendUrl: string) {
  const name = fullName(rejection.firstName, rejection.fullName);
  const reason = rejection.rejectionReason || "No reason provided.";
  await sendMail(
    to,
    "Your Account Registration Was Not Approved - SCSIT Online Exam",
    `Hello ${name},\n\nYour SCSIT Online Exam registration was not approved.\n\nSchool ID: ${formatMaybe(rejection.schoolId)}\nDepartment: ${formatMaybe(rejection.department)}\nYear Level: ${formatMaybe(rejection.yearLevel)}\nReason: ${reason}\n\nPlease review your submitted details and coordinate with your department administrator.\n\nLogin: ${frontendUrl}/login`,
    layout(
      "Registration Not Approved",
      `
      <h2 style="margin:0 0 8px;">Registration Not Approved</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your SCSIT Online Exam registration was reviewed and <strong>not approved</strong> at this time.</p>
      <table cellpadding="0" cellspacing="0" style="margin:20px 0;width:100%;">
        ${detailRow("School ID", formatMaybe(rejection.schoolId))}
        ${detailRow("Department", formatMaybe(rejection.department))}
        ${detailRow("Year Level", formatMaybe(rejection.yearLevel))}
      </table>
      <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;border-radius:4px;margin:16px 0;"><strong>Reason:</strong> ${reason}</div>
      <p>Please correct the submitted details and coordinate with your department administrator if needed.</p>
      <p style="margin-top:24px;">${btn(`${frontendUrl}/login`, "Back to Login", true)}</p>
    `,
    ),
  );
}

export async function sendExamScheduledEmail(
  to: string,
  recipient: { firstName: string; fullName?: string },
  exam: ExamScheduledEmail,
  frontendUrl: string,
) {
  const name = fullName(recipient.firstName, recipient.fullName);
  const examLink = exam.id ? `${frontendUrl}/exam/${exam.id}/instructions` : `${frontendUrl}/dashboard/student`;
  await sendMail(
    to,
    `New Exam Scheduled: ${exam.title} - SCSIT Online Exam`,
    `Hello ${name},\n\nA new exam has been scheduled for you.\n\nTitle: ${exam.title}\nSubject: ${exam.subject}\nDepartment: ${exam.department}\nExam Type: ${exam.examType}\nQuestion Type: ${formatMaybe(exam.questionType)}\nScheduled Date: ${exam.scheduledDate}\nExpiration Time: ${formatMaybe(exam.expirationTime)}\nDuration: ${exam.duration} minutes\nTotal Points: ${formatMaybe(exam.totalPoints)}\nPassing Score: ${formatMaybe(exam.passingScore)}\nYear Level: ${exam.yearLevel}\nInstructions: ${formatMaybe(exam.instructions, "See the dashboard for full instructions.")}\n\nOpen exam details: ${examLink}`,
    layout(
      `New Exam Scheduled: ${exam.title}`,
      `
      <h2 style="margin:0 0 8px;">New Exam Scheduled</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>A new exam has been scheduled for you. Please review the details below and prepare accordingly.</p>
      <table cellpadding="0" cellspacing="0" style="margin:20px 0;width:100%;">
        ${detailRow("Exam Title", exam.title)}
        ${detailRow("Subject", exam.subject)}
        ${detailRow("Department", exam.department)}
        ${detailRow("Exam Type", exam.examType)}
        ${detailRow("Question Type", formatMaybe(exam.questionType))}
        ${detailRow("Scheduled Date", exam.scheduledDate)}
        ${detailRow("Expiration Time", formatMaybe(exam.expirationTime))}
        ${detailRow("Duration", `${exam.duration} minutes`)}
        ${detailRow("Total Points", formatMaybe(exam.totalPoints))}
        ${detailRow("Passing Score", formatMaybe(exam.passingScore))}
        ${detailRow("Year Level", exam.yearLevel)}
      </table>
      ${
        exam.instructions
          ? `<div style="background:#f8fafc;border-left:4px solid #0f172a;padding:12px 16px;border-radius:4px;margin:0 0 20px;"><strong>Instructions:</strong><br>${exam.instructions}</div>`
          : ""
      }
      <p style="margin-top:24px;">${btn(examLink, "View Exam Details")}</p>
    `,
    ),
  );
}

export async function sendDeanExamCreatedEmail(to: string, fullNameValue: string, exam: DeanExamCreatedEmail, frontendUrl: string) {
  const examLink = `${frontendUrl}/exam/questions/${exam.id}`;
  const dashboardLink = `${frontendUrl}/dashboard/dean`;
  await sendMail(
    to,
    `Exam Created Successfully: ${exam.title} - SCSIT Online Exam`,
    `Hello ${fullNameValue},\n\nYour exam '${exam.title}' was created and auto-approved.\n\nSubject: ${exam.subject}\nDepartment: ${exam.department}\nType: ${exam.examType}\nScheduled: ${exam.scheduledDate}\nYear Level: ${exam.yearLevel}\n\nAdd questions: ${examLink}`,
    layout(
      `Exam Created: ${exam.title}`,
      `
      <h2 style="margin:0 0 8px;">Exam Created Successfully</h2>
      <p>Hello <strong>${fullNameValue}</strong>,</p>
      <p>Your exam has been created and <strong>automatically approved</strong>. You can now add questions.</p>
      <table cellpadding="0" cellspacing="0" style="margin:20px 0;width:100%;">
        ${detailRow("Exam Title", exam.title)}
        ${detailRow("Subject", exam.subject)}
        ${detailRow("Department", exam.department)}
        ${detailRow("Exam Type", exam.examType)}
        ${detailRow("Scheduled Date", exam.scheduledDate)}
        ${detailRow("Year Level", exam.yearLevel)}
      </table>
      <p style="margin-top:24px;">${btn(examLink, "Add Questions")}${btn(dashboardLink, "Open Dashboard", true)}</p>
    `,
    ),
  );
}

export async function sendResultsPublishedEmail(to: string, firstName: string, result: ResultsPublishedEmail, frontendUrl: string) {
  const badge = result.passed
    ? `<span style="background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;">PASSED</span>`
    : `<span style="background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;">FAILED</span>`;
  await sendMail(
    to,
    `Results Available: ${result.examTitle} - SCSIT Online Exam`,
    `Hello ${firstName},\n\nYour results for '${result.examTitle}' are now available.\n\nScore: ${result.score}/${result.totalItems} (${result.percentage}%)\nResult: ${result.passed ? "PASSED" : "FAILED"}\nDate Taken: ${result.dateTaken}\n\nView results: ${frontendUrl}/dashboard/student/results`,
    layout(
      `Results: ${result.examTitle}`,
      `
      <h2 style="margin:0 0 8px;">Exam Results Available</h2>
      <p>Hello <strong>${firstName}</strong>,</p>
      <p>Your results for <strong>${result.examTitle}</strong> have been published. ${badge}</p>
      <table cellpadding="0" cellspacing="0" style="margin:20px 0;width:100%;">
        ${detailRow("Exam", result.examTitle)}
        ${detailRow("Subject", result.subject)}
        ${detailRow("Score", `${result.score} / ${result.totalItems}`)}
        ${detailRow("Percentage", `${result.percentage}%`)}
        ${detailRow("Date Taken", result.dateTaken)}
      </table>
      <p style="margin-top:24px;">${btn(`${frontendUrl}/dashboard/student/results`, "View Full Results")}</p>
    `,
    ),
  );
}

export async function sendBulkImportEmail(to: string, firstName: string, setPasswordToken: string, frontendUrl: string) {
  const setPasswordLink = `${frontendUrl}/forgot-password?token=${setPasswordToken}`;
  await sendMail(
    to,
    "Your Student Account Has Been Approved - SCSIT Online Exam",
    `Hello ${firstName},\n\nYour SCSIT Online Exam account has been approved.\n\nSet your password here: ${setPasswordLink}\n\nAfter that, log in using your Student ID and new password.`,
    layout(
      "Account Approved",
      `
      <h2 style="margin:0 0 8px;">Your Student Account Is Approved</h2>
      <p>Hello <strong>${firstName}</strong>,</p>
      <p>Your SCSIT Online Exam account has been approved. Click the button below to set your password and activate your access.</p>
      <p style="margin-top:24px;">${btn(setPasswordLink, "Set Password")}</p>
      <p style="font-size:13px;color:#64748b;margin-top:16px;">After setting your password, log in using your <strong>Student ID</strong> and new password.</p>
    `,
    ),
  );
}

export async function sendAnnouncementEmail(
  to: string,
  recipient: { firstName: string; fullName?: string },
  announcement: AnnouncementEmail,
  frontendUrl: string,
) {
  const name = fullName(recipient.firstName, recipient.fullName);
  const announcementLink = `${frontendUrl}${announcement.linkPath || "/dashboard"}`;
  await sendMail(
    to,
    `New Announcement: ${announcement.title} - SCSIT Online Exam`,
    `Hello ${name},\n\n${announcement.title}\n\n${announcement.message}\n\nPosted by: ${announcement.createdBy}\nPosted at: ${announcement.createdAt}\nTarget audience: ${formatMaybe(announcement.targetAudience, "Everyone")}\nDepartment: ${formatMaybe(announcement.department, "All Departments")}\n\nView: ${announcementLink}`,
    layout(
      `Announcement: ${announcement.title}`,
      `
      <h2 style="margin:0 0 8px;">New Announcement</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <h3 style="margin:16px 0 8px;">${announcement.title}</h3>
      <div style="background:#f8fafc;border-left:4px solid #0f172a;padding:12px 16px;border-radius:4px;margin:0 0 16px;">${announcement.message}</div>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%;">
        ${detailRow("Posted by", announcement.createdBy)}
        ${detailRow("Posted at", announcement.createdAt)}
        ${detailRow("Target audience", formatMaybe(announcement.targetAudience, "Everyone"))}
        ${detailRow("Department", formatMaybe(announcement.department, "All Departments"))}
      </table>
      <p>${btn(announcementLink, "View Dashboard", true)}</p>
    `,
    ),
  );
}

export async function sendTimeExtensionEmail(
  to: string,
  firstName: string,
  exam: { title: string; subject: string; scheduledDate: string },
  extraMinutes: number,
  reason: string,
  frontendUrl: string,
) {
  await sendMail(
    to,
    `Exam Time Extended: ${exam.title} - SCSIT Online Exam`,
    `Hello ${firstName},\n\nThe time for '${exam.title}' has been extended by ${extraMinutes} minutes.\n\nReason: ${reason || "No reason provided."}\n\nView exams: ${frontendUrl}/dashboard/student/exams`,
    layout(
      `Time Extended: ${exam.title}`,
      `
      <h2 style="margin:0 0 8px;">Exam Time Extended</h2>
      <p>Hello <strong>${firstName}</strong>,</p>
      <p>The duration for your upcoming exam has been extended. Please note the updated time.</p>
      <table cellpadding="0" cellspacing="0" style="margin:20px 0;width:100%;">
        ${detailRow("Exam Title", exam.title)}
        ${detailRow("Subject", exam.subject)}
        ${detailRow("Scheduled Date", exam.scheduledDate)}
        ${detailRow("Extra Time Added", `${extraMinutes} minutes`)}
        ${detailRow("Reason", reason || "No reason provided.")}
      </table>
      <p style="margin-top:24px;">${btn(`${frontendUrl}/dashboard/student/exams`, "View My Exams")}</p>
    `,
    ),
  );
}

export async function sendExamRejectedEmail(to: string, firstName: string, examTitle: string, deanName: string, frontendUrl: string) {
  await sendMail(
    to,
    `Exam Rejected: ${examTitle} - SCSIT Online Exam`,
    `Hello ${firstName},\n\nYour exam '${examTitle}' was reviewed and rejected by ${deanName}.\n\nPlease revise and resubmit.\n\nDashboard: ${frontendUrl}/dashboard/teacher`,
    layout(
      `Exam Rejected: ${examTitle}`,
      `
      <h2 style="margin:0 0 8px;">Exam Rejected</h2>
      <p>Hello <strong>${firstName}</strong>,</p>
      <p>Your exam <strong>${examTitle}</strong> was reviewed by <strong>${deanName}</strong> and has been <strong>rejected</strong>.</p>
      <p>Please revise your exam and resubmit it for approval.</p>
      <p style="margin-top:24px;">${btn(`${frontendUrl}/dashboard/teacher`, "Go to My Exams")}</p>
    `,
    ),
  );
}

export async function sendIssueReportEmail(
  to: string,
  firstName: string,
  report: IssueReportEmail,
  actorName: string,
  role: "instructor" | "dean",
  frontendUrl: string,
) {
  const reportLink =
    role === "instructor"
      ? `${frontendUrl}/dashboard/teacher/reports?report=${report.id}`
      : `${frontendUrl}/dashboard/dean/reports?report=${report.id}`;
  await sendMail(
    to,
    `Issue Report: ${report.examTitle} - Question ${report.questionOrder}`,
    `Hello ${firstName},\n\n${actorName} submitted an issue report.\n\nExam: ${report.examTitle}\nQuestion: #${report.questionOrder}\nIssue Type: ${report.issueType}\nReported Answer: ${report.reportedAnswer || "N/A"}\nDescription: ${report.description}\n\nView: ${reportLink}`,
    layout(
      `Issue Report: ${report.examTitle}`,
      `
      <h2 style="margin:0 0 8px;">New Exam Issue Report</h2>
      <p>Hello <strong>${firstName}</strong>,</p>
      <p><strong>${actorName}</strong> submitted an issue report that requires your attention.</p>
      <table cellpadding="0" cellspacing="0" style="margin:20px 0;width:100%;">
        ${detailRow("Exam", report.examTitle)}
        ${detailRow("Question", `#${report.questionOrder}`)}
        ${detailRow("Issue Type", report.issueType)}
        ${detailRow("Reported Answer", report.reportedAnswer || "N/A")}
      </table>
      <div style="background:#f8fafc;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:0 0 20px;"><strong>Description:</strong><br>${report.description}</div>
      <p>${btn(reportLink, "Open Issue Report")}</p>
    `,
    ),
  );
}

export async function sendIssueReportReplyEmail(
  to: string,
  firstName: string,
  report: IssueReportReplyEmail,
  actorName: string,
  messageText: string,
  frontendUrl: string,
) {
  const reportLink = `${frontendUrl}/dashboard/student/reports?report=${report.id}`;
  await sendMail(
    to,
    `Issue Report Reply: ${report.examTitle} - Question ${report.questionOrder}`,
    `Hello ${firstName},\n\n${actorName} replied to your issue report.\n\nExam: ${report.examTitle}\nQuestion: #${report.questionOrder}\nStatus: ${report.status}\nReply: ${messageText}\n\nView: ${reportLink}`,
    layout(
      `Issue Report Reply: ${report.examTitle}`,
      `
      <h2 style="margin:0 0 8px;">Update on Your Issue Report</h2>
      <p>Hello <strong>${firstName}</strong>,</p>
      <p><strong>${actorName}</strong> replied to your issue report for <strong>${report.examTitle}</strong>.</p>
      <table cellpadding="0" cellspacing="0" style="margin:20px 0;width:100%;">
        ${detailRow("Exam", report.examTitle)}
        ${detailRow("Question", `#${report.questionOrder}`)}
        ${detailRow("Status", report.status)}
      </table>
      <div style="background:#f8fafc;border-left:4px solid #0f172a;padding:12px 16px;border-radius:4px;margin:0 0 20px;"><strong>Reply:</strong><br>${messageText}</div>
      <p>${btn(reportLink, "View My Report")}</p>
    `,
    ),
  );
}
