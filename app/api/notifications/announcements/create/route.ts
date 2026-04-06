import { NextRequest, NextResponse } from "next/server";
import { sendAnnouncementEmail } from "@/lib/mailer";

const BACKEND = "https://scsitonlineexambackend.onrender.com";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://scsi-tonlineexam.vercel.app";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const body = await request.json().catch(() => ({}));

  const res = await fetch(`${BACKEND}/api/notifications/announcements/create/`, {
    method: "POST",
    headers: { Authorization: authorization, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  // Get recipients to email — fetch eligible users based on target_audience + department
  try {
    const profileRes = await fetch(`${BACKEND}/api/profile/`, {
      headers: { Authorization: authorization },
    });
    const profile = profileRes.ok ? await profileRes.json().catch(() => ({})) : {};
    const createdBy = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || profile.username || "Dean";

    const usersRes = await fetch(`${BACKEND}/api/department/users/`, {
      headers: { Authorization: authorization },
    });
    if (usersRes.ok) {
      const usersData = await usersRes.json().catch(() => ({}));
      const targetAudience: string = body.target_audience ?? "all";
      const department: string | null = body.department || null;

      let recipients: Array<{ email: string; first_name: string }> = [];
      if (targetAudience === "all" || targetAudience === "student") {
        recipients = recipients.concat(usersData.students ?? []);
      }
      if (targetAudience === "all" || targetAudience === "instructor") {
        recipients = recipients.concat(usersData.instructors ?? []);
      }

      // Filter by department if specified
      if (department) {
        recipients = recipients.filter((u: any) => !u.department || u.department === department);
      }

      const announcement = {
        title: body.title,
        message: body.message,
        createdBy,
        createdAt: new Date().toLocaleDateString("en-US", {
          year: "numeric", month: "long", day: "numeric",
          hour: "2-digit", minute: "2-digit",
        }),
      };

      for (const recipient of recipients) {
        if (recipient.email) {
          sendAnnouncementEmail(recipient.email, recipient.first_name ?? "there", announcement, FRONTEND_URL).catch(() => {});
        }
      }
    }
  } catch {
    // Email sending failure should not affect the response
  }

  return NextResponse.json(data, { status: 201 });
}
