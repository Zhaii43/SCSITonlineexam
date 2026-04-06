import { NextRequest, NextResponse } from "next/server";
import { sendStudentApprovalEmail } from "@/lib/mailer";

const BACKEND = "https://scsitonlineexambackend.onrender.com";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://scsi-tonlineexam.vercel.app";
export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = request.headers.get("authorization") ?? "";

  const res = await fetch(`${BACKEND}/api/students/${id}/approve/`, {
    method: "POST",
    headers: { Authorization: authorization },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  if (data.student_email) {
    sendStudentApprovalEmail(data.student_email, data.student_first_name ?? "there", FRONTEND_URL).catch(() => {});
  }

  return NextResponse.json(data);
}
