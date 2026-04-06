import { NextRequest, NextResponse } from "next/server";

import { getServerBackendUrl } from "@/lib/server-backend-url";
import { extractUpstreamMessage } from "@/lib/upstream-response";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const backendUrl = getServerBackendUrl();
    const res = await fetch(`${backendUrl}/api/password-reset/request/`, {
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
        { error: extractUpstreamMessage(text, "Unable to send password reset email right now. Please try again later.") },
        { status: res.status }
      );
    }

    return NextResponse.json(
      { message: extractUpstreamMessage(text, "A password reset code has been sent if the account exists.") },
      { status: res.status }
    );
  } catch (error) {
    console.error("[password-reset/request] error:", error);
    return NextResponse.json(
      { error: "Unable to reach the password reset service right now. Please try again." },
      { status: 503 }
    );
  }
}
