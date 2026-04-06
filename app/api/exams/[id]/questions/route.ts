import { NextRequest, NextResponse } from "next/server";
import { sendExamScheduledEmail } from "@/lib/mailer";
import { getServerBackendUrl } from "@/lib/server-backend-url";

export const runtime = "nodejs";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://scsi-tonlineexam.vercel.app";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = request.headers.get("authorization") ?? "";
  const body = await request.json().catch(() => ({}));
  const backendUrl = getServerBackendUrl();

  // Save questions to Django
  const res = await fetch(`${backendUrl}/api/exams/${id}/questions/`, {
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

  // Fetch exam details + eligible students to send scheduled emails
  try {
    const detailRes = await fetch(`${backendUrl}/api/exams/${id}/dean-detail/`, {
      headers: { Authorization: authorization },
      cache: "no-store",
    });

    if (detailRes.ok) {
      const examDetail = await detailRes.json().catch(() => ({}));
      const exam = examDetail?.exam;
      const students: Array<{ email: string; first_name: string }> = examDetail?.eligible_students ?? [];

      if (exam && students.length > 0) {
        const examPayload = {
          id: exam.id,
          title: exam.title,
          subject: exam.subject,
          department: exam.department,
          examType: exam.exam_type,
          questionType: exam.question_type,
          scheduledDate: new Date(exam.scheduled_date).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
          }),
          expirationTime: exam.expiration_time
            ? new Date(exam.expiration_time).toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
              })
            : undefined,
          duration: exam.duration_minutes,
          totalPoints: exam.total_points,
          passingScore: exam.passing_score,
          yearLevel: exam.year_level,
          instructions: exam.instructions,
        };

        for (const student of students) {
          if (student.email) {
            try {
              await sendExamScheduledEmail(
                student.email,
                { firstName: student.first_name ?? "there" },
                examPayload,
                FRONTEND_URL
              );
            } catch (err) {
              console.error("[exam/questions] email error for", student.email, err);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("[exam/questions] failed to send scheduled emails:", err);
  }

  return new NextResponse(text, { status: res.status, headers: { "Content-Type": contentType || "application/json" } });
}
