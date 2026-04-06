import { NextRequest, NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/server-backend-url";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    const backendUrl = getServerBackendUrl();

    const res = await fetch(`${backendUrl}/api/notifications/announcements/mine/`, {
      headers: authorization ? { Authorization: authorization } : {},
      cache: "no-store",
    });

    const text = await res.text();
    const contentType = res.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      return new NextResponse(text, { status: res.status, headers: { "Content-Type": contentType } });
    }
    return NextResponse.json({ announcements: [] }, { status: res.status });
  } catch (error) {
    console.error("[announcements/mine] error:", error);
    return NextResponse.json({ error: "Unable to load announcements right now." }, { status: 503 });
  }
}
