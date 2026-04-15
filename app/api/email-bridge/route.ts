import { NextResponse } from "next/server";

import {
  sendAnnouncementEmail,
  sendBulkImportEmail,
  sendDeanExamCreatedEmail,
  sendEmailVerificationOtp,
  sendExamRejectedEmail,
  sendExamScheduledEmail,
  sendIssueReportEmail,
  sendIssueReportReplyEmail,
  sendMasterlistApprovedEmail,
  sendPasswordResetEmail,
  sendResultsPublishedEmail,
  sendStaffApprovalEmail,
  sendStudentApprovalEmail,
  sendStudentRejectedEmail,
  sendTimeExtensionEmail,
} from "@/lib/mailer";

export const runtime = "nodejs";

const getRequiredEnv = (key: string): string => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const formatError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return "Failed to send email.";
  }
  const message = error.message.trim();
  const lowered = message.toLowerCase();
  const err = error as Error & { code?: string };

  if (message.startsWith("Missing required environment variable:")) {
    return message;
  }
  if (
    err.code === "EAUTH" ||
    lowered.includes("invalid login") ||
    lowered.includes("username and password not accepted")
  ) {
    return "Gmail authentication failed. Check MAILER_GMAIL_USER and MAILER_GMAIL_APP_PASSWORD.";
  }
  if (lowered.includes("daily user sending quota exceeded")) {
    return "The Gmail sending limit was reached. Try again later.";
  }
  return message || "Failed to send email.";
};

export async function POST(request: Request) {
  try {
    const expectedSecret = getRequiredEnv("EMAIL_BRIDGE_SECRET");
    const receivedSecret = request.headers.get("x-email-bridge-secret")?.trim();

    if (!receivedSecret || receivedSecret !== expectedSecret) {
      return NextResponse.json({ detail: "Unauthorized email bridge request." }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await request.json()) as Record<string, any>;
    const { emailType, ...data } = body;

    if (!emailType) {
      return NextResponse.json({ detail: "emailType is required." }, { status: 400 });
    }

    switch (emailType as string) {
      case "password_reset":
        await sendPasswordResetEmail(data.to, data.firstName, data.otp, data.frontendUrl);
        break;

      case "email_verification_otp":
        await sendEmailVerificationOtp(data.to, data.firstName, data.otp);
        break;

      case "student_approval":
        await sendStudentApprovalEmail(
          data.to,
          {
            firstName: data.firstName,
            fullName: data.fullName,
            username: data.username,
            email: data.email,
            schoolId: data.schoolId,
            department: data.department,
            yearLevel: data.yearLevel,
            approvedAt: data.approvedAt,
          },
          data.frontendUrl,
        );
        break;

      case "staff_approval":
        await sendStaffApprovalEmail(data.to, data.firstName, data.role, data.frontendUrl);
        break;

      case "student_rejected":
        await sendStudentRejectedEmail(
          data.to,
          {
            firstName: data.firstName,
            fullName: data.fullName,
            schoolId: data.schoolId,
            department: data.department,
            yearLevel: data.yearLevel,
            rejectionReason: data.rejectionReason ?? null,
          },
          data.frontendUrl,
        );
        break;

      case "exam_scheduled":
        await sendExamScheduledEmail(
          data.to,
          {
            firstName: data.firstName,
            fullName: data.fullName,
          },
          data.exam,
          data.frontendUrl,
        );
        break;

      case "dean_exam_created":
        await sendDeanExamCreatedEmail(data.to, data.fullName, data.exam, data.frontendUrl);
        break;

      case "results_published":
        await sendResultsPublishedEmail(data.to, data.firstName, data.result, data.frontendUrl);
        break;

      case "masterlist_approval":
        await sendMasterlistApprovedEmail(
          data.to,
          data.firstName,
          data.username,
          data.schoolId,
          data.frontendUrl,
          data.enrolledSubjects ?? [],
          data.department ?? "",
          data.yearLevel ?? "",
        );
        break;

      case "bulk_import":
        await sendBulkImportEmail(data.to, data.firstName, data.setPasswordToken, data.frontendUrl);
        break;

      case "announcement":
        await sendAnnouncementEmail(
          data.to,
          {
            firstName: data.firstName,
            fullName: data.fullName,
          },
          data.announcement,
          data.frontendUrl,
        );
        break;

      case "time_extension":
        await sendTimeExtensionEmail(data.to, data.firstName, data.exam, data.extraMinutes, data.reason, data.frontendUrl);
        break;

      case "exam_rejected":
        await sendExamRejectedEmail(data.to, data.firstName, data.examTitle, data.deanName, data.frontendUrl);
        break;

      case "issue_report":
        await sendIssueReportEmail(data.to, data.firstName, data.report, data.actorName, data.role, data.frontendUrl);
        break;

      case "issue_report_reply":
        await sendIssueReportReplyEmail(data.to, data.firstName, data.report, data.actorName, data.messageText, data.frontendUrl);
        break;

      default:
        return NextResponse.json({ detail: `Unknown emailType: ${emailType}` }, { status: 400 });
    }

    return NextResponse.json({ message: "Email sent." }, { status: 200 });
  } catch (error) {
    console.error("[email-bridge] error:", error);
    return NextResponse.json({ detail: formatError(error) }, { status: 500 });
  }
}
