import { NextRequest, NextResponse } from "next/server";

import { sendPasswordResetEmail } from "@/lib/mailer";
import { getServerBackendUrl } from "@/lib/server-backend-url";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let email = "";
  try {
    const body = await request.json();
    email = body.email ?? "";
    const backendUrl = getServerBackendUrl();

    const res = await fetch(`${backendUrl}/api/password-reset/generate-otp/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.error ?? "Unable to send password reset email right now. Please try again later." },
        { status: res.status }
      );
    }

    const { otp, first_name, frontend_url } = await res.json();
    const resolvedFrontendUrl =
      String(frontend_url || process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/+$/, "");

    try {
      await sendPasswordResetEmail(email, first_name, otp, resolvedFrontendUrl);
    } catch (mailError) {
      console.error("[password-reset/request] mail error:", mailError);

      const errorMessage =
        mailError instanceof Error && mailError.message.includes("Missing required email configuration")
          ? "Password reset email is not configured. Check EMAIL_USER, EMAIL_PASS, and EMAIL_FROM."
          : "Unable to send the password reset email right now. Please try again.";

      return NextResponse.json({ error: errorMessage }, { status: 503 });
    }

    return NextResponse.json({ message: `A 6-digit verification code has been sent to ${email}` });
  } catch (err) {
    console.error("[password-reset/request] error:", err);
    return NextResponse.json(
      { error: "Unable to reach the password reset service right now. Please try again." },
      { status: 503 }
    );
  }
}
