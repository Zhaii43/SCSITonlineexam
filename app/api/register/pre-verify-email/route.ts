import { NextRequest, NextResponse } from "next/server";

import { sendEmailVerificationOtp } from "@/lib/mailer";
import { getServerBackendUrl } from "@/lib/server-backend-url";

const EMAIL_BRIDGE_SECRET = process.env.EMAIL_BRIDGE_SECRET?.trim() ?? "";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let email = "";
  try {
    const body = await request.json();
    email = (body.email ?? "").trim().toLowerCase();

    const backendUrl = getServerBackendUrl();
    const payload = JSON.stringify({ email });

    const res = await fetch(`${backendUrl}/api/register/pre-verify-email/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    if (res.status < 500 || !EMAIL_BRIDGE_SECRET) {
      return NextResponse.json(
        { error: data.error ?? "Unable to send OTP email right now. Please try again later." },
        { status: res.status }
      );
    }

    const legacyRes = await fetch(`${backendUrl}/api/register/generate-pre-verify-otp/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-email-bridge-secret": EMAIL_BRIDGE_SECRET,
      },
      body: payload,
      cache: "no-store",
    });
    const legacyData = await legacyRes.json().catch(() => ({}));

    if (!legacyRes.ok) {
      return NextResponse.json(
        { error: legacyData.error ?? data.error ?? "Unable to send OTP email right now. Please try again later." },
        { status: legacyRes.status }
      );
    }

    await sendEmailVerificationOtp(email, "there", legacyData.otp);

    return NextResponse.json({ message: `OTP sent to ${email}` });
  } catch (err) {
    console.error("[register/pre-verify-email] error:", err);
    const message = err instanceof Error ? err.message : "Unable to send OTP. Please try again.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
