"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

type Role = "student" | "instructor" | "dean";

interface ReportSummary {
  id: number;
  exam_id: number;
  exam_title: string;
  question_id: number;
  question_order: number;
  question_preview: string;
  student_id: number;
  student_name: string;
  student_school_id: string | null;
  issue_type: string;
  issue_type_label: string;
  status: string;
  status_label: string;
  reported_answer: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  latest_message: string;
  latest_message_at: string;
}

interface ReportDetail extends ReportSummary {
  description: string;
  exam_result_id: number | null;
  messages: Array<{
    id: number;
    sender_id: number;
    sender_name: string;
    sender_role: string;
    message: string;
    created_at: string;
    is_mine: boolean;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  under_review: "bg-sky-100 text-sky-700",
  resolved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

const STATUS_OPTIONS = ["under_review", "resolved", "rejected"];

export default function IssueReportsPanel({ role }: { role: Role }) {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const reportFromQuery = useMemo(() => {
    const raw = searchParams.get("report");
    return raw ? Number(raw) : null;
  }, [searchParams]);

  const fetchReportDetail = useCallback(async (reportId: number) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_URL}/exams/report-issues/${reportId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load report.");
      setSelectedReport(data.report || null);
      setSelectedId(reportId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load report.");
    } finally {
      setDetailLoading(false);
    }
  }, [toast]);

  const fetchReports = useCallback(async (preferredId?: number | null) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setLoading(true);
    try {
      const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
      const res = await fetch(`${API_URL}/exams/report-issues/${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load reports.");
      const nextReports = Array.isArray(data.reports) ? data.reports : [];
      setReports(nextReports);

      const nextSelectedId =
        preferredId ||
        reportFromQuery ||
        selectedId ||
        (nextReports.length > 0 ? nextReports[0].id : null);
      setSelectedId(nextSelectedId);
      if (nextSelectedId) {
        fetchReportDetail(nextSelectedId);
      } else {
        setSelectedReport(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, [fetchReportDetail, reportFromQuery, selectedId, statusFilter, toast]);

  useEffect(() => {
    fetchReports(reportFromQuery);
  }, [fetchReports, reportFromQuery]);

  const handleReply = async () => {
    if (!selectedReport || !reply.trim()) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setSendingReply(true);
    try {
      const res = await fetch(`${API_URL}/exams/report-issues/${selectedReport.id}/messages/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: reply.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to send reply.");
      setReply("");
      setSelectedReport(data.report || null);
      fetchReports(selectedReport.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reply.");
    } finally {
      setSendingReply(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <section className="rounded-3xl border border-slate-200 bg-white/90 shadow-lg shadow-slate-200/60">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Issue Reports</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">{reports.length} record(s)</h2>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No reports found.</div>
          ) : (
            reports.map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => fetchReportDetail(report.id)}
                className={`w-full px-5 py-4 text-left transition-colors hover:bg-slate-50 ${
                  selectedId === report.id ? "bg-sky-50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{report.exam_title}</p>
                    <p className="mt-1 text-xs text-slate-500 truncate">
                      Q{report.question_order}: {report.question_preview}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_COLORS[report.status] || "bg-slate-100 text-slate-600"}`}>
                    {report.status_label}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-700 line-clamp-2">{report.latest_message}</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{role === "student" ? report.issue_type_label : report.student_name}</span>
                  <span>{getTimeAgo(report.updated_at)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/90 shadow-lg shadow-slate-200/60">
        {!selectedReport ? (
          <div className="p-8 text-sm text-slate-500">Select a report to view the conversation.</div>
        ) : detailLoading ? (
          <div className="p-8 text-sm text-slate-500">Loading report...</div>
        ) : (
          <>
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">{selectedReport.exam_title}</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">
                    Question {selectedReport.question_order} Report
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">{selectedReport.question_preview}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{selectedReport.issue_type_label}</span>
                    <span>•</span>
                    <span>{selectedReport.student_name}</span>
                    {selectedReport.student_school_id && (
                      <>
                        <span>•</span>
                        <span>{selectedReport.student_school_id}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${STATUS_COLORS[selectedReport.status] || "bg-slate-100 text-slate-600"}`}>
                  {selectedReport.status_label}
                </span>
              </div>
            </div>

            <div className="border-b border-slate-200 px-6 py-5 bg-slate-50/70">
              <p className="text-sm font-medium text-slate-700">Original report</p>
              <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">{selectedReport.description}</p>
              {selectedReport.reported_answer && (
                <p className="mt-3 text-xs text-slate-500">
                  Reported answer: <span className="font-semibold text-slate-700">{selectedReport.reported_answer}</span>
                </p>
              )}
            </div>

            <div className="max-h-[45vh] overflow-y-auto px-6 py-5 space-y-4">
              {selectedReport.messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-3xl rounded-2xl px-4 py-3 ${
                    message.is_mine
                      ? "ml-auto bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[11px]">
                    <span className={message.is_mine ? "text-white/80" : "text-slate-500"}>
                      {message.sender_name} • {message.sender_role}
                    </span>
                    <span className={message.is_mine ? "text-white/70" : "text-slate-400"}>
                      {getTimeAgo(message.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{message.message}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 px-6 py-5">
              <div className="space-y-3">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={4}
                  placeholder={role === "student" ? "Add more details or respond to updates..." : "Reply to this report..."}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 resize-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={sendingReply || !reply.trim()}
                    onClick={handleReply}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {sendingReply ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
