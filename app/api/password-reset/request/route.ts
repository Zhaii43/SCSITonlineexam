import { NextRequest, NextResponse } from "next/server";

import { API_URL } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const backendUrl = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? API_URL).replace(/\/api$/, "");
    const res = await fetch(`${backendUrl}/api/password-reset/request-direct/`, {
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
        { error: text.trim() || "Unable to send password reset email right now. Please try again later." },
        { status: res.status }
      );
    }

    return NextResponse.json(
      { message: text.trim() || "Verification code sent." },
      { status: res.status }
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the backend service right now. Please try again." },
      { status: 503 }
    );
  }
}
