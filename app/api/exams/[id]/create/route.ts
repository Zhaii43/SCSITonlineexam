import { NextRequest, NextResponse } from "next/server";
import { sendDeanExamCreatedEmail } from "@/lib/mailer";
import { getServerBackendUrl } from "@/lib/server-backend-url";

export const runtime = "nodejs";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://scsi-tonlineexam.vercel.app";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const body = await request.json().catch(() => ({}));
  const backendUrl = getServerBackendUrl();

  const res = await fetch(`${backendUrl}/api/exams/create/`, {
    method: "POST",
    headers: { Authorization: authorization, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) return new NextResponse(text, { status: res.status });

  const data = JSON.parse(text);

  if (data.dean_email_data?.to) {
    const e = data.dean_email_data;
    sendDeanExamCreatedEmail(e.to, e.fullName, {
      id: e.examId, title: e.examTitle, subject: e.subject,
      department: e.department, examType: e.examType,
      scheduledDate: e.scheduledDate, yearLevel: e.yearLevel,
    }, FRONTEND_URL).catch(() => {});
  }

  return NextResponse.json(data, { status: res.status });
}
