import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://scsitonlineexambackend.onrender.com";
export const runtime = "nodejs";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = request.headers.get("authorization") ?? "";
  const res = await fetch(`${BACKEND}/api/notifications/announcements/${id}/delete/`, {
    method: "DELETE",
    headers: { Authorization: authorization },
  });
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return new NextResponse(null, { status: res.status });
  }
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
