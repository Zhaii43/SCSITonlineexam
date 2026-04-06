import { NextRequest, NextResponse } from "next/server";
import { sendExamScheduledEmail } from "@/lib/mailer";
import { getServerBackendUrl } from "@/lib/server-backend-url";

export const runtime = "nodejs";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://scsi-tonlineexam.vercel.app";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = request.headers.get("authorization") ?? "";
  const backendUrl = getServerBackendUrl();

  // Fetch eligible students BEFORE approving
  const detailRes = await fetch(`${backendUrl}/api/exams/${id}/dean-detail/`, {
    headers: { Authorization: authorization },
    cache: "no-store",
  });
  const examDetail = detailRes.ok ? await detailRes.json().catch(() => ({})) : {};

  const res = await fetch(`${backendUrl}/api/exams/${id}/approve/`, {
    method: "POST",
    headers: { Authorization: authorization },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const students: Array<{ email: string; first_name: string }> = examDetail?.eligible_students ?? [];
  const exam = examDetail?.exam;

  if (exam && students.length > 0) {
    const examPayload = {
      title: exam.title,
      subject: exam.subject,
      department: exam.department,
      examType: exam.exam_type,
      scheduledDate: new Date(exam.scheduled_date).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
      }),
      duration: exam.duration_minutes,
      yearLevel: exam.year_level,
    };

    for (const student of students) {
      if (student.email) {
        try {
          await sendExamScheduledEmail(student.email, student.first_name ?? "there", examPayload, FRONTEND_URL);
        } catch (err) {
          console.error("[exam/approve] email error for", student.email, err);
        }
      }
    }
  }

  return NextResponse.json(data);
}
