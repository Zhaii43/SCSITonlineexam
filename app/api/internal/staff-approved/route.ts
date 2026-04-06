import { NextRequest, NextResponse } from "next/server";
import { sendStaffApprovalEmail } from "@/lib/mailer";

export const runtime = "nodejs";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://scsi-tonlineexam.vercel.app";
const SECRET = process.env.EMAIL_BRIDGE_SECRET ?? "";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-email-bridge-secret") ?? "";
  if (!SECRET || secret !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { to, firstName, role } = body;

  if (!to) return NextResponse.json({ error: "to is required" }, { status: 400 });

  try {
    await sendStaffApprovalEmail(to, firstName ?? "there", role ?? "Staff", FRONTEND_URL);
    return NextResponse.json({ message: "Email sent." });
  } catch (err) {
    console.error("[internal/staff-approved] email error:", err);
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }
}
