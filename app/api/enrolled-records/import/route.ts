import { NextRequest, NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/server-backend-url";
import { sendMasterlistApprovedEmail } from "@/lib/mailer";

export const runtime = "nodejs";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://scsi-tonlineexam.vercel.app";
type DeliveryResult = {
  email: string;
  school_id: string;
  status: "sent" | "failed";
  error?: string;
};

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

    const deliveryResults: DeliveryResult[] = data.email_candidates.map((candidate: {
      to: string;
      school_id: string;
    }, index: number) => {
      const result = emailResults[index];
      if (result.status === "fulfilled") {
        return { email: candidate.to, school_id: candidate.school_id, status: "sent" };
      }
      const reason = result.reason instanceof Error ? result.reason.message : "Email send failed";
      return { email: candidate.to, school_id: candidate.school_id, status: "failed", error: reason };
    });

    const failedEmails = deliveryResults.filter((item) => item.status === "failed").length;
    const sentEmails = deliveryResults.filter((item) => item.status === "sent").length;
    data.email_sent_count = sentEmails;
    data.email_error_count = failedEmails;

    if (typeof data.import_run_id === "number") {
      await fetch(`${backendUrl}/api/enrolled-records/import-history/${data.import_run_id}/email-status/`, {
        method: "POST",
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ results: deliveryResults }),
        cache: "no-store",
      }).catch(() => null);
    }

    if (failedEmails > 0) {
      data.message = `${data.message || "Import completed."} Email delivery failed for ${failedEmails} account(s).`;
    } else {
      data.message = `${data.message || "Import completed."} Email delivery succeeded for ${sentEmails} account(s).`;
    }
  }

  delete data.email_candidates;
  return NextResponse.json(data, { status: res.status });
}
