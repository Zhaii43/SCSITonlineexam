import { NextRequest, NextResponse } from "next/server";
import { sendIssueReportEmail } from "@/lib/mailer";
import { getServerBackendUrl } from "@/lib/server-backend-url";

export const runtime = "nodejs";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://scsi-tonlineexam.vercel.app";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = request.headers.get("authorization") ?? "";
  const body = await request.json().catch(() => ({}));
  const backendUrl = getServerBackendUrl();

  const res = await fetch(`${backendUrl}/api/exams/${id}/issue-report/`, {
    method: "POST",
    headers: { Authorization: authorization, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const e = data.instructor_email_data;
  if (e?.to) {
    try {
      await sendIssueReportEmail(
        e.to,
        e.firstName ?? "there",
        {
          id: e.reportId,
          examTitle: e.examTitle,
          questionOrder: e.questionOrder,
          issueType: e.issueType,
          reportedAnswer: e.reportedAnswer ?? null,
          description: e.description,
        },
        e.actorName,
        e.role === "dean" ? "dean" : "instructor",
        FRONTEND_URL
      );
    } catch (err) {
      console.error("[exam/issue-report] email error:", err);
    }
  }

  return NextResponse.json(data, { status: res.status });
}
