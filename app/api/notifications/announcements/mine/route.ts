import { NextRequest, NextResponse } from "next/server";

import { getServerBackendUrl } from "@/lib/server-backend-url";
import { extractUpstreamMessage } from "@/lib/upstream-response";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    const backendUrl = getServerBackendUrl();

    const res = await fetch(`${backendUrl}/api/notifications/announcements/mine/`, {
      method: "GET",
      headers: authorization ? { Authorization: authorization } : undefined,
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
        { error: extractUpstreamMessage(text, "Failed to load announcements.") },
        { status: res.status }
      );
    }

    return NextResponse.json(
      { message: extractUpstreamMessage(text, "Announcements loaded.") },
      { status: res.status }
    );
  } catch (error) {
    console.error("[notifications/announcements/mine] error:", error);
    return NextResponse.json(
      { error: "Unable to reach the announcement service right now. Please try again." },
      { status: 503 }
    );
  }
}
