import { NextRequest, NextResponse } from "next/server";
import { sendStudentRejectedEmail } from "@/lib/mailer";

const BACKEND = "https://scsitonlineexambackend.onrender.com";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://scsi-tonlineexam.vercel.app";
export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = request.headers.get("authorization") ?? "";
  const body = await request.json().catch(() => ({}));

  const res = await fetch(`${BACKEND}/api/students/${id}/reject/`, {
    method: "POST",
    headers: { Authorization: authorization, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  if (data.student_email) {
    sendStudentRejectedEmail(
      data.student_email,
      {
        firstName: data.student_first_name ?? "there",
        fullName: [data.student_first_name, data.student_last_name].filter(Boolean).join(" ") || undefined,
        schoolId: data.student_school_id,
        department: data.student_department,
        yearLevel: data.student_year_level,
        rejectionReason: data.rejection_reason ?? null,
      },
      FRONTEND_URL,
    ).catch(() => {});
  }

  return NextResponse.json(data);
}
