import { NextRequest, NextResponse } from "next/server";

import { API_URL } from "@/lib/api";
import { sendEmailChangeOtp } from "@/lib/mailer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const backendUrl = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? API_URL).replace(/\/api$/, "");
    const authorization = request.headers.get("authorization");

    const res = await fetch(`${backendUrl}/api/profile/email-change/generate-otp/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body,
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      let error = "Failed to resend code";
      try { error = JSON.parse(text).error ?? error; } catch {}
      return NextResponse.json({ error }, { status: res.status });
    }

    const { otp, email } = await res.json();
    await sendEmailChangeOtp(email, otp);

    return NextResponse.json({ message: `Verification code resent.`, email });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the backend service right now. Please try again." },
      { status: 503 }
    );
  }
}
