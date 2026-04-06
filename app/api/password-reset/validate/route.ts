import { NextRequest, NextResponse } from "next/server";

import { getServerBackendUrl } from "@/lib/server-backend-url";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const backendUrl = getServerBackendUrl();
    const res = await fetch(`${backendUrl}/api/password-reset/validate/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });

    const text = await res.text();
    const contentType = res.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      return new NextResponse(text, {
        status: res.status,
        headers: { "Content-Type": contentType },
      });
    }

    if (!res.ok) {
      return NextResponse.json(
        { valid: false, error: text.trim() || "Unable to validate reset token right now." },
        { status: res.status }
      );
    }

    return NextResponse.json(
      { valid: true, message: text.trim() || "Token validated." },
      { status: res.status }
    );
  } catch (error) {
    console.error("[password-reset/validate] error:", error);
    return NextResponse.json(
      { error: "Unable to reach the password reset service right now. Please try again." },
      { status: 503 }
    );
  }
}
