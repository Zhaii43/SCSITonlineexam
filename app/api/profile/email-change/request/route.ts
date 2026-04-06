import { NextRequest, NextResponse } from "next/server";

import { sendEmailChangeOtp } from "@/lib/mailer";

const BACKEND = "https://scsitonlineexambackend.onrender.com";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authorization = request.headers.get("authorization");

    const res = await fetch(`${BACKEND}/api/profile/email-change/generate-otp/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? "Failed to send verification code" },
        { status: res.status }
      );
    }

    const { otp, email } = data;
    await sendEmailChangeOtp(email, otp);

    return NextResponse.json({ message: `OTP sent to ${email}`, email });
  } catch (err) {
    console.error("[email-change/request] error:", err);
    return NextResponse.json(
      { error: "Unable to reach the backend service right now. Please try again." },
      { status: 503 }
    );
  }
}
