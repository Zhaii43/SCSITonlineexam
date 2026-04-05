import { NextRequest, NextResponse } from "next/server";

import { API_URL } from "@/lib/api";
import { extractUpstreamMessage } from "@/lib/upstream-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const backendUrl = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? API_URL).replace(/\/api$/, "");
    const authorization = request.headers.get("authorization");
    const res = await fetch(`${backendUrl}/api/profile/email-change/verify/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
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
        { error: extractUpstreamMessage(text, "Failed to verify code") },
        { status: res.status }
      );
    }

    return NextResponse.json(
      { message: extractUpstreamMessage(text, "Email verified successfully.") },
      { status: res.status }
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the backend service right now. Please try again." },
      { status: 503 }
    );
  }
}
