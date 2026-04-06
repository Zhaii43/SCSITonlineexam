import { NextRequest, NextResponse } from "next/server";
import { sendStudentRejectedEmail } from "@/lib/mailer";
import { getServerBackendUrl } from "@/lib/server-backend-url";

export const runtime = "nodejs";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://scsi-tonlineexam.vercel.app";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = request.headers.get("authorization") ?? "";
  const body = await request.json().catch(() => ({}));
  const backendUrl = getServerBackendUrl();

  const res = await fetch(`${backendUrl}/api/students/${id}/reject/`, {
    method: "POST",
    headers: { Authorization: authorization, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  if (data.student_email) {
    try {
      await sendStudentRejectedEmail(data.student_email, data.student_first_name ?? "there", data.rejection_reason ?? null, FRONTEND_URL);
    } catch (err) {
      console.error("[student/reject] email error:", err);
    }
  }

  return NextResponse.json(data);
}
