import { NextRequest, NextResponse } from "next/server";

import { getServerBackendUrl } from "@/lib/server-backend-url";
import { extractUpstreamMessage } from "@/lib/upstream-response";

export const runtime = "nodejs";

async function proxyBackendResetRequest(backendUrl: string, body: unknown) {
  const response = await fetch(`${backendUrl}/api/password-reset/request/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": contentType },
    });
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: extractUpstreamMessage(text, "Unable to send password reset email right now. Please try again later.") },
      { status: response.status }
    );
  }

  return NextResponse.json(
    { message: extractUpstreamMessage(text, "A 6-digit verification code has been sent.") },
    { status: response.status }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = getServerBackendUrl();
    return await proxyBackendResetRequest(backendUrl, body);
  } catch (err) {
    console.error("[password-reset/request] error:", err);
    return NextResponse.json(
      { error: "Unable to reach the password reset service right now. Please try again." },
      { status: 503 }
    );
  }
}
