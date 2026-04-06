import { NextRequest, NextResponse } from "next/server";

import { sendEmailVerificationOtp } from "@/lib/mailer";

const BACKEND = "https://scsitonlineexambackend.onrender.com";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let email = "";
  try {
    const body = await request.json();
    email = (body.email ?? "").trim().toLowerCase();

    const res = await fetch(`${BACKEND}/api/register/generate-pre-verify-otp/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? "Unable to send OTP email right now. Please try again later." },
        { status: res.status }
      );
    }

    await sendEmailVerificationOtp(email, "there", data.otp);

    return NextResponse.json({ message: `OTP sent to ${email}` });
  } catch (err) {
    console.error("[register/pre-verify-email] error:", err);
    const message = err instanceof Error ? err.message : "Unable to send OTP. Please try again.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
