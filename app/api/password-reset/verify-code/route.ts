import { NextRequest, NextResponse } from "next/server";

import { getServerBackendUrl } from "@/lib/server-backend-url";
import { extractUpstreamMessage } from "@/lib/upstream-response";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const backendUrl = getServerBackendUrl();
    const res = await fetch(`${backendUrl}/api/password-reset/verify-code/`, {
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
        { error: extractUpstreamMessage(text, "Unable to verify the reset code right now.") },
        { status: res.status }
      );
    }

    return NextResponse.json(
      { message: extractUpstreamMessage(text, "Code verified.") },
      { status: res.status }
    );
  } catch (error) {
    console.error("[password-reset/verify-code] error:", error);
    return NextResponse.json(
      { error: "Unable to reach the password reset service right now. Please try again." },
      { status: 503 }
    );
  }
}
