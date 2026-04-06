import { NextRequest, NextResponse } from "next/server";
import { sendExamRejectedEmail } from "@/lib/mailer";

const BACKEND = "https://scsitonlineexambackend.onrender.com";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://scsi-tonlineexam.vercel.app";
export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = request.headers.get("authorization") ?? "";

  const res = await fetch(`${BACKEND}/api/exams/${id}/reject/`, {
    method: "POST",
    headers: { Authorization: authorization },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  if (data.creator_email && data.exam_title) {
    const profileRes = await fetch(`${BACKEND}/api/profile/`, {
      headers: { Authorization: authorization },
    });
    const profile = profileRes.ok ? await profileRes.json().catch(() => ({})) : {};
    const deanName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Dean";

    sendExamRejectedEmail(
      data.creator_email,
      data.creator_first_name ?? "there",
      data.exam_title,
      deanName,
      FRONTEND_URL
    ).catch(() => {});
  }

  return NextResponse.json(data);
}
