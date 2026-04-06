import { NextRequest, NextResponse } from "next/server";
import { sendExamScheduledEmail } from "@/lib/mailer";

const BACKEND = "https://scsitonlineexambackend.onrender.com";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://scsi-tonlineexam.vercel.app";
export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = request.headers.get("authorization") ?? "";

  // Fetch eligible students before approving so we can email them
  const studentsRes = await fetch(`${BACKEND}/api/exams/${id}/dean-detail/`, {
    headers: { Authorization: authorization },
  });
  const examDetail = studentsRes.ok ? await studentsRes.json().catch(() => ({})) : {};

  const res = await fetch(`${BACKEND}/api/exams/${id}/approve/`, {
    method: "POST",
    headers: { Authorization: authorization },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  // Send exam scheduled email to all eligible students
  const students: Array<{ email: string; first_name: string }> = examDetail?.eligible_students ?? [];
  const exam = examDetail?.exam;
  if (exam && students.length > 0) {
    const examPayload = {
      title: exam.title,
      subject: exam.subject,
      department: exam.department,
      examType: exam.exam_type,
      scheduledDate: new Date(exam.scheduled_date).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
      duration: exam.duration_minutes,
      yearLevel: exam.year_level,
    };
    for (const student of students) {
      if (student.email) {
        sendExamScheduledEmail(student.email, student.first_name ?? "there", examPayload, FRONTEND_URL).catch(() => {});
      }
    }
  }

  return NextResponse.json(data);
}
