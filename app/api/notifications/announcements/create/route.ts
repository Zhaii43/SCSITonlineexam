import { NextRequest, NextResponse } from "next/server";

import { getServerBackendUrl } from "@/lib/server-backend-url";
import { extractUpstreamMessage } from "@/lib/upstream-response";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const authorization = request.headers.get("authorization");
    const backendUrl = getServerBackendUrl();

    const res = await fetch(`${backendUrl}/api/notifications/announcements/create/`, {
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
        { error: extractUpstreamMessage(text, "Failed to post announcement.") },
        { status: res.status }
      );
    }

    return NextResponse.json(
      { message: extractUpstreamMessage(text, "Announcement posted successfully.") },
      { status: res.status }
    );
  } catch (error) {
    console.error("[notifications/announcements/create] error:", error);
    return NextResponse.json(
      { error: "Unable to reach the announcement service right now. Please try again." },
      { status: 503 }
    );
  }
}
