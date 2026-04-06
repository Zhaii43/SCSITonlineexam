import { NextRequest, NextResponse } from "next/server";
import { sendStudentApprovalEmail } from "@/lib/mailer";
import { getServerBackendUrl } from "@/lib/server-backend-url";

export const runtime = "nodejs";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://scsi-tonlineexam.vercel.app";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const body = await request.json().catch(() => ({}));
  const backendUrl = getServerBackendUrl();

  // Get student details before approving so we have their emails
  const studentIds: number[] = body.student_ids ?? [];

  const res = await fetch(`${backendUrl}/api/students/bulk-approve/`, {
    method: "POST",
    headers: { Authorization: authorization, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) return new NextResponse(text, { status: res.status });

  const data = JSON.parse(text);

  // Fetch student emails and send approval emails
  if (studentIds.length > 0 && data.count > 0) {
    fetch(`${backendUrl}/api/department/users/`, {
      headers: { Authorization: authorization },
    }).then(r => r.json()).then(users => {
      const students: Array<{
        id: number;
        email: string;
        first_name?: string;
        last_name?: string;
        username?: string;
        school_id?: string;
        department?: string;
        year_level?: string;
      }> = users.students ?? [];
      for (const s of students) {
        if (studentIds.includes(s.id) && s.email) {
          sendStudentApprovalEmail(
            s.email,
            {
              firstName: s.first_name ?? "there",
              fullName: [s.first_name, s.last_name].filter(Boolean).join(" ") || undefined,
              username: s.username,
              email: s.email,
              schoolId: s.school_id,
              department: s.department,
              yearLevel: s.year_level,
            },
            FRONTEND_URL,
          ).catch(() => {});
        }
      }
    }).catch(() => {});
  }

  return NextResponse.json(data, { status: res.status });
}
