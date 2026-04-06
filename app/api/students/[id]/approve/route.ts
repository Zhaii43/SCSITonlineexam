import { NextRequest, NextResponse } from "next/server";
import { sendStudentApprovalEmail } from "@/lib/mailer";
import { getServerBackendUrl } from "@/lib/server-backend-url";

export const runtime = "nodejs";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://scsi-tonlineexam.vercel.app";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = request.headers.get("authorization") ?? "";
  const backendUrl = getServerBackendUrl();

  const res = await fetch(`${backendUrl}/api/students/${id}/approve/`, {
    method: "POST",
    headers: { Authorization: authorization },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  if (data.student_email) {
    try {
      await sendStudentApprovalEmail(data.student_email, data.student_first_name ?? "there", FRONTEND_URL);
      console.log("[approve] email sent to", data.student_email);
    } catch (err) {
      console.error("[approve] email failed:", err);
    }
  }

  return NextResponse.json(data);
}
