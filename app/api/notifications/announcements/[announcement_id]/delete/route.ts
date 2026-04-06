import { NextRequest, NextResponse } from "next/server";

import { getServerBackendUrl } from "@/lib/server-backend-url";
import { extractUpstreamMessage } from "@/lib/upstream-response";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    announcement_id: string;
  }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { announcement_id } = await context.params;
    const authorization = request.headers.get("authorization");
    const backendUrl = getServerBackendUrl();

    const res = await fetch(`${backendUrl}/api/notifications/announcements/${announcement_id}/delete/`, {
      method: "DELETE",
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
        { error: extractUpstreamMessage(text, "Failed to delete announcement.") },
        { status: res.status }
      );
    }

    return NextResponse.json(
      { message: extractUpstreamMessage(text, "Announcement deleted.") },
      { status: res.status }
    );
  } catch (error) {
    console.error("[notifications/announcements/delete] error:", error);
    return NextResponse.json(
      { error: "Unable to reach the announcement service right now. Please try again." },
      { status: 503 }
    );
  }
}
