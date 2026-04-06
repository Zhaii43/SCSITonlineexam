import { NextRequest, NextResponse } from "next/server";
import { sendExamRejectedEmail } from "@/lib/mailer";
import { getServerBackendUrl } from "@/lib/server-backend-url";

export const runtime = "nodejs";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://scsi-tonlineexam.vercel.app";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = request.headers.get("authorization") ?? "";
  const backendUrl = getServerBackendUrl();

  const res = await fetch(`${backendUrl}/api/exams/${id}/reject/`, {
    method: "POST",
    headers: { Authorization: authorization },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  if (data.creator_email && data.exam_title) {
    const profileRes = await fetch(`${backendUrl}/api/profile/`, {
      headers: { Authorization: authorization },
      cache: "no-store",
    });
    const profile = profileRes.ok ? await profileRes.json().catch(() => ({})) : {};
    const deanName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Dean";

    try {
      await sendExamRejectedEmail(
        data.creator_email,
        data.creator_first_name ?? "there",
        data.exam_title,
        deanName,
        FRONTEND_URL
      );
    } catch (err) {
      console.error("[exam/reject] email error:", err);
    }
  }

  return NextResponse.json(data);
}
