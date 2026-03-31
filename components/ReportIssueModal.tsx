"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

type QuestionLike = {
  id: number;
  question: string;
  order?: number;
};

type ReportIssueModalProps = {
  examId: string | number;
  question: QuestionLike;
  reportedAnswer?: string;
  onClose: () => void;
  onSubmitted?: () => void;
};

const ISSUE_TYPES = [
  { value: "missing_choice", label: "Correct answer not in choices" },
  { value: "unclear_question", label: "Question is unclear" },
  { value: "typo", label: "Typo or formatting issue" },
  { value: "missing_asset", label: "Missing image or asset" },
  { value: "grading_concern", label: "Grading concern" },
  { value: "other", label: "Other" },
];

export default function ReportIssueModal({
  examId,
  question,
  reportedAnswer = "",
  onClose,
  onSubmitted,
}: ReportIssueModalProps) {
  const toast = useToast();
  const [issueType, setIssueType] = useState("missing_choice");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Please describe the issue.");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("You need to log in again.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/exams/${examId}/report-issues/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question_id: question.id,
          issue_type: issueType,
          description: description.trim(),
          reported_answer: reportedAnswer,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit report.");
      }
      toast.success("Issue report submitted.");
      onSubmitted?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Report Issue</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              Question {question.order ?? ""}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
            aria-label="Close report issue modal"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">Question</p>
            <p className="mt-2 text-sm text-slate-700">{question.question}</p>
            {reportedAnswer && (
              <p className="mt-3 text-xs text-slate-500">
                Your answer: <span className="font-semibold text-slate-700">{reportedAnswer}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Issue Type</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              {ISSUE_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Describe the issue</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Example: The correct answer should be present, but none of the choices match the formula shown in the question."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 resize-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
