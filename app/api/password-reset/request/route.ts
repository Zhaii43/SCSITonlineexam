import { NextRequest, NextResponse } from "next/server";

import { sendPasswordResetEmail } from "@/lib/mailer";

const BACKEND = "https://scsitonlineexambackend.onrender.com";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let email = "";
  try {
    const body = await request.json();
    email = (body.email ?? "").trim().toLowerCase();

    const res = await fetch(`${BACKEND}/api/password-reset/generate-otp/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? "Unable to send password reset email right now. Please try again later." },
        { status: res.status }
      );
    }

    const { otp, first_name, frontend_url } = data;
    await sendPasswordResetEmail(email, first_name ?? "there", otp, frontend_url ?? "https://scsi-tonlineexam.vercel.app");

    return NextResponse.json({ message: `A 6-digit verification code has been sent to ${email}` });
  } catch (err) {
    console.error("[password-reset/request] error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: 503 }
    );
  }
}
