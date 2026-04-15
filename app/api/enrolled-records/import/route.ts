import { NextRequest, NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/server-backend-url";
import { sendMasterlistApprovedEmail } from "@/lib/mailer";

export const runtime = "nodejs";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://scsi-tonlineexam.vercel.app";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const backendUrl = getServerBackendUrl();

  const incomingFormData = await request.formData();
  const formData = new FormData();
  for (const [key, value] of incomingFormData.entries()) {
    formData.append(key, value);
  }

  const res = await fetch(`${backendUrl}/api/enrolled-records/import/`, {
    method: "POST",
    headers: { Authorization: authorization },
    body: formData,
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") ?? "application/json";
  const rawText = await res.text();
  const data = (() => {
    try {
      return rawText ? JSON.parse(rawText) : null;
    } catch {
      return null;
    }
  })();
  if (!data) {
    return new NextResponse(rawText || "{}", {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  }

  if (res.ok && Array.isArray(data.email_candidates) && data.email_candidates.length > 0) {
    const emailResults = await Promise.allSettled(
      data.email_candidates.map((candidate: {
        to: string;
        first_name: string;
        username: string;
        school_id: string;
        department?: string;
        year_level?: string;
        enrolled_subjects?: string[];
      }) =>
        sendMasterlistApprovedEmail(
          candidate.to,
          candidate.first_name || "there",
          candidate.username || candidate.school_id || "",
          candidate.school_id || "",
          FRONTEND_URL,
          candidate.enrolled_subjects || [],
          candidate.department || "",
          candidate.year_level || "",
        ),
      ),
    );

    const failedEmails = emailResults.filter((result) => result.status === "rejected").length;
    if (failedEmails > 0) {
      data.email_error_count = failedEmails;
      data.message = `${data.message || "Import completed."} Email delivery failed for ${failedEmails} account(s).`;
    }
  }

  delete data.email_candidates;
  return NextResponse.json(data, { status: res.status });
}
