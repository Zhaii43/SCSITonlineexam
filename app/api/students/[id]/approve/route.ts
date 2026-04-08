import { NextRequest, NextResponse } from "next/server";
import { sendBulkImportEmail, sendStudentApprovalEmail } from "@/lib/mailer";
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
      if (data.student_account_source === "masterlist_import" && data.student_reset_token) {
        await sendBulkImportEmail(
          data.student_email,
          data.student_first_name ?? "there",
          data.student_reset_token,
          FRONTEND_URL,
        );
      } else {
        await sendStudentApprovalEmail(data.student_email, {
          firstName: data.student_first_name ?? "there",
          fullName: `${data.student_first_name ?? ""} ${data.student_last_name ?? ""}`.trim() || undefined,
          username: data.student_username,
          email: data.student_email,
          schoolId: data.student_school_id,
          department: data.student_department,
          yearLevel: data.student_year_level,
          approvedAt: data.student_approved_at,
        }, FRONTEND_URL);
      }
    } catch (err) {
      console.error("[student/approve] email error:", err);
    }
  }

  return NextResponse.json(data);
}
