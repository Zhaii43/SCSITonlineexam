import { NextRequest, NextResponse } from "next/server";
import { sendBulkImportEmail, sendStudentApprovalEmail } from "@/lib/mailer";
import { getServerBackendUrl } from "@/lib/server-backend-url";

export const runtime = "nodejs";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://scsi-tonlineexam.vercel.app";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const body = await request.json().catch(() => ({}));
  const backendUrl = getServerBackendUrl();

  const res = await fetch(`${backendUrl}/api/students/bulk-approve/`, {
    method: "POST",
    headers: { Authorization: authorization, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) return new NextResponse(text, { status: res.status });

  const data = JSON.parse(text);

  const approvedStudents: Array<{
    id: number;
    email?: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    school_id?: string;
    department?: string;
    year_level?: string;
    account_source?: string;
    reset_token?: string;
  }> = Array.isArray(data.approved_students) ? data.approved_students : [];

  if (approvedStudents.length > 0) {
    Promise.allSettled(
      approvedStudents
        .filter((student) => !!student.email)
        .map((student) => {
          if (student.reset_token) {
            return sendBulkImportEmail(
              student.email!,
              student.first_name ?? "there",
              student.reset_token,
              FRONTEND_URL,
            );
          }

          return sendStudentApprovalEmail(
            student.email!,
            {
              firstName: student.first_name ?? "there",
              fullName: [student.first_name, student.last_name].filter(Boolean).join(" ") || undefined,
              username: student.username,
              email: student.email,
              schoolId: student.school_id,
              department: student.department,
              yearLevel: student.year_level,
            },
            FRONTEND_URL,
          );
        }),
    ).catch(() => {});
  }

  return NextResponse.json(data, { status: res.status });
}
