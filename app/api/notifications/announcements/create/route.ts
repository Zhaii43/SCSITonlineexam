import { NextRequest, NextResponse } from "next/server";
import { sendAnnouncementEmail } from "@/lib/mailer";
import { getServerBackendUrl } from "@/lib/server-backend-url";

export const runtime = "nodejs";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://scsi-tonlineexam.vercel.app";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const body = await request.json().catch(() => ({}));
  const backendUrl = getServerBackendUrl();

  const res = await fetch(`${backendUrl}/api/notifications/announcements/create/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  const contentType = res.headers.get("content-type") ?? "";

  if (!res.ok) {
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": contentType || "application/json" },
    });
  }

  // Send emails to all recipients
  try {
    const [profileRes, usersRes] = await Promise.all([
      fetch(`${backendUrl}/api/profile/`, { headers: { Authorization: authorization }, cache: "no-store" }),
      fetch(`${backendUrl}/api/department/users/`, { headers: { Authorization: authorization }, cache: "no-store" }),
    ]);

    const profile = profileRes.ok ? await profileRes.json().catch(() => ({})) : {};
    const createdBy = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || profile.username || "Staff";

    if (usersRes.ok) {
      const usersData = await usersRes.json().catch(() => ({}));
      const targetAudience = String(body.target_audience ?? "all");
      const department = String(body.department ?? "");
      const yearLevel = String(body.year_level ?? "");

      let recipients: Array<{ email?: string; first_name?: string; department?: string; year_level?: string }> = [];
      if (targetAudience === "all" || targetAudience === "student") {
        recipients = recipients.concat(usersData.students ?? []);
      }
      if (targetAudience === "all" || targetAudience === "instructor") {
        recipients = recipients.concat(usersData.instructors ?? []);
      }
      if (department) {
        recipients = recipients.filter((u) => !u.department || u.department === department);
      }
      if (yearLevel && targetAudience !== "instructor") {
        recipients = recipients.filter((u) => !(usersData.students ?? []).includes(u) || !u.year_level || u.year_level === yearLevel);
      }

      const announcement = {
        title: String(body.title ?? ""),
        message: String(body.message ?? ""),
        createdBy,
        createdAt: new Date().toLocaleDateString("en-US", {
          year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
        }),
      };

      for (const r of recipients) {
        if (r.email) {
          try {
            await sendAnnouncementEmail(r.email, { firstName: r.first_name ?? "there" }, announcement, FRONTEND_URL);
          } catch (err) {
            console.error("[announcement/create] email error for", r.email, err);
          }
        }
      }
    }
  } catch (err) {
    console.error("[announcement/create] email sending failed:", err);
  }

  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": contentType || "application/json" },
  });
}
