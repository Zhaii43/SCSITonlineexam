import { NextRequest, NextResponse } from "next/server";
import { sendResultsPublishedEmail } from "@/lib/mailer";
import { getServerBackendUrl } from "@/lib/server-backend-url";

export const runtime = "nodejs";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://scsi-tonlineexam.vercel.app";

export async function POST(request: NextRequest, { params }: { params: Promise<{ resultId: string }> }) {
  const { resultId } = await params;
  const authorization = request.headers.get("authorization") ?? "";
  const body = await request.json().catch(() => ({}));
  const backendUrl = getServerBackendUrl();

  const res = await fetch(`${backendUrl}/api/exams/result/${resultId}/grade/`, {
    method: "POST",
    headers: { Authorization: authorization, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  const contentType = res.headers.get("content-type") ?? "";

  if (!res.ok) {
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": contentType || "application/json" } });
  }

  const data = JSON.parse(text);

  if (data.email_data?.to) {
    const e = data.email_data;
    try {
      await sendResultsPublishedEmail(e.to, e.firstName, {
        examTitle: e.examTitle, subject: e.subject,
        score: e.score, totalItems: e.totalItems,
        percentage: e.percentage, passed: e.passed, dateTaken: e.dateTaken,
      }, FRONTEND_URL);
    } catch (err) {
      console.error("[exam/grade] email error:", err);
    }
  }

  return NextResponse.json(data, { status: res.status });
}
