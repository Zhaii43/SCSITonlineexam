import { NextResponse } from "next/server";

import { API_URL } from "@/lib/api";
export async function GET() {
  try {
    const backendUrl = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? API_URL).replace(/\/api$/, "");
    const res = await fetch(`${backendUrl}/api/exams/public-stats/`, {
      cache: "no-store",
    });

    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !contentType.includes("application/json")) {
      return NextResponse.json(
        { active_exams: 0, total_users: 0, violations_today: 0, live_exam: null, activity: [] },
        { status: 200 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { active_exams: 0, total_users: 0, violations_today: 0, live_exam: null, activity: [] },
      { status: 200 }
    );
  }
}
