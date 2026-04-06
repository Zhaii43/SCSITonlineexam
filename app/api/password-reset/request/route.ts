import { NextRequest, NextResponse } from "next/server";

import { sendPasswordResetEmail } from "@/lib/mailer";
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

    const res = await fetch(`${backendUrl}/api/password-reset/request/`, {
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
        { error: data.error ?? "Unable to send password reset email right now. Please try again later." },
        { status: res.status }
      );
    }

    const legacyRes = await fetch(`${backendUrl}/api/password-reset/generate-otp/`, {
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
        { error: legacyData.error ?? data.error ?? "Unable to send password reset email right now. Please try again later." },
        { status: legacyRes.status }
      );
    }

    const { otp, first_name, frontend_url } = legacyData;
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
