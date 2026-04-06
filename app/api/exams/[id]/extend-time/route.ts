import { NextRequest, NextResponse } from "next/server";
import { sendTimeExtensionEmail } from "@/lib/mailer";
import { getServerBackendUrl } from "@/lib/server-backend-url";

export const runtime = "nodejs";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://scsi-tonlineexam.vercel.app";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = request.headers.get("authorization") ?? "";
  const body = await request.json().catch(() => ({}));
  const backendUrl = getServerBackendUrl();

  const res = await fetch(`${backendUrl}/api/exams/${id}/extend-time/`, {
    method: "POST",
    headers: { Authorization: authorization, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) return new NextResponse(text, { status: res.status });

  const data = JSON.parse(text);

  const emailList: Array<{ to: string; firstName: string; examTitle: string; examSubject: string; scheduledDate: string; extraMinutes: number; reason: string }> = data.email_data ?? [];
  for (const e of emailList) {
    if (e.to) {
      try {
        await sendTimeExtensionEmail(e.to, e.firstName, {
          title: e.examTitle, subject: e.examSubject, scheduledDate: e.scheduledDate,
        }, e.extraMinutes, e.reason, FRONTEND_URL);
      } catch (err) {
        console.error("[exam/extend-time] email error for", e.to, err);
      }
    }
  }

  return NextResponse.json(data, { status: res.status });
}
