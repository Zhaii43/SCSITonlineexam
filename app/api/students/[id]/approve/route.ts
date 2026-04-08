import { NextRequest, NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/server-backend-url";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = request.headers.get("authorization") ?? "";
  const backendUrl = getServerBackendUrl();

  const res = await fetch(`${backendUrl}/api/students/${id}/approve/`, {
    method: "POST",
    headers: { Authorization: authorization },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  return NextResponse.json(data);
}
