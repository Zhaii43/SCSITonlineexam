import { NextRequest, NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/server-backend-url";
import { sendAnnouncementEmail } from "@/lib/mailer";

export const runtime = "nodejs";

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://scsi-tonlineexam.vercel.app";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    const body = await request.json().catch(() => ({}));
    const backendUrl = getServerBackendUrl();

    const res = await fetch(`${backendUrl}/api/notifications/announcements/create/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await res.text();
    const contentType = res.headers.get("content-type") ?? "";

    if (!res.ok) {
      if (contentType.includes("application/json")) {
        return new NextResponse(text, { status: res.status, headers: { "Content-Type": contentType } });
      }
      return NextResponse.json({ error: "Failed to post announcement." }, { status: res.status });
    }

    // Fire emails in background — never block the response
    if (authorization) {
      sendAnnouncementEmails(authorization, body, backendUrl).catch(() => {});
    }

    if (contentType.includes("application/json")) {
      return new NextResponse(text, { status: res.status, headers: { "Content-Type": contentType } });
    }
    return NextResponse.json({ message: "Announcement posted." }, { status: res.status });
  } catch (error) {
    console.error("[announcements/create] error:", error);
    return NextResponse.json({ error: "Unable to post announcement right now. Please try again." }, { status: 503 });
  }
}

async function sendAnnouncementEmails(authorization: string, body: Record<string, unknown>, backendUrl: string) {
  const [profileRes, usersRes] = await Promise.all([
    fetch(`${backendUrl}/api/profile/`, { headers: { Authorization: authorization } }),
    fetch(`${backendUrl}/api/department/users/`, { headers: { Authorization: authorization } }),
  ]);

  const profile = profileRes.ok ? await profileRes.json().catch(() => ({})) : {};
  const createdBy = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || profile.username || "Staff";

  if (!usersRes.ok) return;
  const usersData = await usersRes.json().catch(() => ({}));

  const targetAudience = String(body.target_audience ?? "all");
  const department = String(body.department ?? "");

  let recipients: Array<{ email?: string; first_name?: string; last_name?: string; department?: string }> = [];
  if (targetAudience === "all" || targetAudience === "student") {
    recipients = recipients.concat(usersData.students ?? []);
  }
  if (targetAudience === "all" || targetAudience === "instructor") {
    recipients = recipients.concat(usersData.instructors ?? []);
  }
  if (department) {
    recipients = recipients.filter((u) => !u.department || u.department === department);
  }

  const announcement = {
    title: String(body.title ?? ""),
    message: String(body.message ?? ""),
    createdBy,
    createdAt: new Date().toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    }),
    targetAudience,
    department: department || "All Departments",
  };

  await Promise.allSettled(
    recipients
      .filter((r) => r.email)
      .map((r) =>
        sendAnnouncementEmail(
          r.email!,
          {
            firstName: r.first_name ?? "there",
            fullName: [r.first_name, r.last_name].filter(Boolean).join(" ") || undefined,
          },
          announcement,
          FRONTEND_URL,
        )
      )
  );
}
