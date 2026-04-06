import { NextRequest, NextResponse } from "next/server";

import { API_URL } from "@/lib/api";
import { sendPasswordResetEmail } from "@/lib/mailer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const backendUrl = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? API_URL).replace(/\/api$/, "");

    const res = await fetch(`${backendUrl}/api/password-reset/generate-otp/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      let error = "Unable to send password reset email right now. Please try again later.";
      try { error = JSON.parse(text).error ?? error; } catch {}
      return NextResponse.json({ error }, { status: res.status });
    }

    const { otp, first_name, frontend_url } = await res.json();
    const { email } = JSON.parse(body);

    await sendPasswordResetEmail(email, first_name, otp, frontend_url);

    return NextResponse.json({ message: `A 6-digit verification code has been sent to ${email}` });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the backend service right now. Please try again." },
      { status: 503 }
    );
  }
}
