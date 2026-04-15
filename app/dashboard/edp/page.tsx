"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EdpShell from "@/components/EdpShell";
import { useToast } from "@/components/ToastProvider";
import { API_URL, apiFetch } from "@/lib/api";

type EdpProfile = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department: string;
  school_id: string;
  is_approved: boolean;
};

type EnrolledRecord = {
  id: number;
  school_id: string;
  first_name: string;
  last_name: string;
  department: string;
  year_level: string;
  course: string;
  enrolled_subjects: string[];
  email: string | null;
  contact_number: string | null;
  added_at: string;
  source?: string;
};

type ImportResult = {
  error?: string;
  success_count?: number;
  error_count?: number;
  errors?: Array<{ row: number | string; error: string }>;
};


const initialAddForm = {
  school_id: "",
  first_name: "",
  last_name: "",
  year_level: "",
  course: "",
  subjects: "",
  email: "",
  contact_number: "",
};



const masterlistColumns = [
  "school_id",
  "email",
  "first_name",
  "last_name",
  "year_level",
  "course",
  "subjects",
  "contact_number",
];

const flowSteps = [
  "Upload the official CSV masterlist from EDP.",
  "The system reads student identity, year, course, and subject data.",
  "Dean reviews imported student accounts before login access is granted.",
  "Imported subjects are reused for instructor subject assignments.",
  "Clean masterlist data keeps exam eligibility accurate.",
];

const noteItems = [
  "Use consistent course names such as BSIT so department mapping stays reliable.",
  "Keep subject labels standardized because instructor assignments and student eligibility depend on them.",
  "Dean approval still controls whether imported students can access the system.",
];

const addFormFields = [
  { key: "school_id", label: "School ID *" },
  { key: "first_name", label: "First Name *" },
  { key: "last_name", label: "Last Name *" },
  { key: "year_level", label: "Year Level * (1st-4th)" },
  { key: "course", label: "Course *" },
  { key: "subjects", label: "Subjects * (pipe-separated)" },
  { key: "email", label: "Email" },
  { key: "contact_number", label: "Contact Number" },
] as const;

const cardClass = "rounded-2xl border border-slate-200 bg-white shadow-md";

export default function EdpDashboard() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<EdpProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [records, setRecords] = useState<EnrolledRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordSearch, setRecordSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(initialAddForm);
  const [addLoading, setAddLoading] = useState(false);
  const fetchRecords = async (query?: string) => {
    const trimmedQuery = (query ?? recordSearch).trim();
    setRecordsLoading(true);
    try {
      const url = trimmedQuery
        ? `${API_URL}/enrolled-records/?search=${encodeURIComponent(trimmedQuery)}`
        : `${API_URL}/enrolled-records/`;
      const res = await apiFetch(url);
      if (!res.ok) throw new Error("Failed to load records.");
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load records.";
      toast.error(message);
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.replace("/login"); return; }
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/profile/`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        if (data.role !== "edp") { router.replace("/dashboard"); return; }
        if (!data.is_approved) { setError("Your account is pending approval."); setLoading(false); return; }
        setProfile(data);
        await fetchRecords("");
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const handleDownloadTemplate = async () => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${API_URL}/students/template/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to download template");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "masterlist_import_template.csv";
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to download template"); }
  };

  const handleImportStudents = async () => {
    if (!importFile) { toast.error("Select a CSV file first."); return; }
    setImportLoading(true); setImportResult(null);
    const token = localStorage.getItem("access_token");
    const formData = new FormData();
    formData.append("file", importFile);
    try {
      const res = await fetch(`${API_URL}/enrolled-records/import/`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      const data: ImportResult = await res.json().catch(() => ({}));
      setImportResult(data);
      if (!res.ok) throw new Error(data.error || "Import failed");
      setImportFile(null);
      setImportResult(null);
      toast.success(`Imported ${data.success_count || 0} entries. Syncing accounts...`);
      // Auto-sync after successful import
      const syncRes = await fetch(`${API_URL}/enrolled-records/sync-accounts/`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      const syncData = await syncRes.json().catch(() => ({}));
      if (syncRes.ok) toast.success(syncData.message || "Accounts synced.");
      await fetchRecords("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      setImportResult({ error: message }); toast.error(message);
    } finally { setImportLoading(false); }
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm("Delete this masterlist entry? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await apiFetch(`${API_URL}/enrolled-records/${id}/delete/`, { method: "DELETE" });
      if (res.ok) {
        await fetchRecords("");
        toast.success("Record deleted.");
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Failed to delete.");
      }
    } catch { toast.error("Failed to delete record."); }
    finally { setDeletingId(null); }
  };

  const handleAddRecord = async () => {
    const { school_id, first_name, last_name, year_level, course, subjects } = addForm;
    if (!school_id || !first_name || !last_name || !year_level || !course || !subjects) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setAddLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/enrolled-records/add/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || "Failed to add record."); return; }
      toast.success("Masterlist entry added.");
      setShowAddForm(false);
      setAddForm(initialAddForm);
      await fetchRecords("");
    } catch { toast.error("Failed to add record."); }
    finally { setAddLoading(false); }
  };


  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.username ||
    "EDP";
  const totalRecords = records.length;
  const uniqueCourses = new Set(records.map((record) => record.course).filter(Boolean)).size;
  const uniqueSubjects = new Set(
    records.flatMap((record) => record.enrolled_subjects || []).filter(Boolean)
  ).size;
  const latestImportCount = importResult?.success_count || 0;
  const latestImportErrors = importResult?.error_count ?? importResult?.errors?.length ?? 0;

  const statCards = [
    {
      label: "Masterlist entries",
      value: recordsLoading ? "Loading..." : String(totalRecords),
      accent: "bg-sky-50 text-sky-700 border-sky-100",
      note: "Live masterlist rows currently loaded in the workspace.",
    },
    {
      label: "Unique courses",
      value: recordsLoading ? "..." : String(uniqueCourses),
      accent: "bg-emerald-50 text-emerald-700 border-emerald-100",
      note: "Course groupings represented in the current masterlist.",
    },
    {
      label: "Imported this run",
      value: importLoading ? "Working..." : String(latestImportCount),
      accent: "bg-violet-50 text-violet-700 border-violet-100",
      note: latestImportErrors > 0 ? `${latestImportErrors} row errors need review.` : "Latest import feedback appears below the uploader.",
    },
    {
      label: "Sync status",
      value: "Auto",
      accent: "bg-amber-50 text-amber-700 border-amber-100",
      note: "Accounts are synced automatically on import.",
    },
  ];

  const formatAddedAt = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Recently added";
    return parsed.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-200 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.12),transparent_45%)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
          </div>
          <p className="mt-4 text-sm text-slate-600">Loading EDP Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-sky-200 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.12),transparent_45%)] flex items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 border border-red-200 text-red-600">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Access Error</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-200 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.12),transparent_45%)]">
      <div className="relative">
        <Header />
        <EdpShell>
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" style={{ fontFamily: "'Space Grotesk', 'Manrope', sans-serif" }}>

            {/* Page Header */}
            <div className="mb-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl shadow-slate-200/60 p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">EDP Dashboard</p>
                  <h1 className="mt-2 text-3xl font-semibold text-slate-900">Welcome, {displayName}</h1>
                  <p className="mt-1 text-slate-600">{profile?.department || "EDP"} | {profile?.school_id || profile?.email}</p>
                </div>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {statCards.map((item) => (
                <div key={item.label} className={`${cardClass} p-5`}>
                  <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${item.accent}`}>
                    {item.label}
                  </div>
                  <p className="mt-3 text-3xl font-bold text-slate-900">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.note}</p>
                </div>
              ))}
            </div>

            {/* Masterlist Management */}
            <div className="space-y-4">

              {/* Import section */}
              <section className="space-y-4">
                {/* Info strip — required columns, flow, notes in one horizontal row */}
                <div className={`${cardClass} p-5`}>
                  <div className="grid gap-6 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    {/* Required columns */}
                    <div className="pb-4 md:pb-0 md:pr-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black mb-3">Required columns</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {masterlistColumns.map((column) => (
                          <div key={column} className="flex items-center gap-1.5 text-xs text-black">
                            <svg className="h-3 w-3 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            {column}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Process flow */}
                    <div className="pt-4 md:pt-0 md:px-6 pb-4 md:pb-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black mb-3">Process flow</p>
                      <div className="space-y-2">
                        {flowSteps.map((step, index) => (
                          <div key={step} className="flex items-start gap-2">
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[9px] font-bold text-white mt-0.5">{index + 1}</span>
                            <p className="text-xs leading-4 text-black">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="pt-4 md:pt-0 md:pl-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black mb-3">Notes</p>
                      <ul className="space-y-2">
                        {noteItems.map((note) => (
                          <li key={note} className="flex items-start gap-2 text-xs leading-4 text-black">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Upload card — full width, compact */}
                <div className={`${cardClass} p-6`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">CSV Import</p>
                      <h2 className="mt-1 text-xl font-semibold text-slate-900">Upload the official masterlist</h2>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                    >
                      Download Template
                    </button>
                  </div>

                  {/* File picker + actions in one row */}
                  <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-sky-200 bg-sky-50/80 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Selected file</p>
                      <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
                        {importFile?.name || "No CSV file selected yet"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50">
                        Choose File
                        <input type="file" accept=".csv" onChange={(e) => { setImportFile(e.target.files?.[0] || null); setImportResult(null); }} className="sr-only" />
                      </label>
                      <button
                        type="button"
                        onClick={handleImportStudents}
                        disabled={importLoading || !importFile}
                        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {importLoading ? "Importing..." : "Import"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setImportFile(null); setImportResult(null); }}
                        disabled={!importFile && !importResult}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {importResult && (
                    <div
                      className={`mt-6 rounded-[24px] border p-5 ${
                        importResult.error
                          ? "border-red-200 bg-red-50"
                          : "border-emerald-200 bg-emerald-50"
                      }`}
                    >
                      {importResult.error ? (
                        <div>
                          <p className="text-sm font-semibold text-red-700">Import failed</p>
                          <p className="mt-2 text-sm text-red-700">{importResult.error}</p>
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="rounded-2xl border border-emerald-200 bg-white/70 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Imported</p>
                            <p className="mt-2 text-3xl font-semibold text-slate-900">{importResult.success_count || 0}</p>
                          </div>
                          <div className="rounded-2xl border border-amber-200 bg-white/70 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Rows with issues</p>
                            <p className="mt-2 text-3xl font-semibold text-slate-900">{importResult.error_count || 0}</p>
                          </div>
                        </div>
                      )}

                      {Array.isArray(importResult.errors) && importResult.errors.length > 0 && (
                        <div className="mt-5 rounded-[22px] border border-yellow-200 bg-yellow-50/70 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-yellow-900">Row-level import feedback</h3>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-yellow-800">
                              {importResult.errors.length} issue{importResult.errors.length === 1 ? "" : "s"}
                            </span>
                          </div>
                          <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
                            {importResult.errors.map((item, index) => (
                              <div
                                key={`${item.row}-${index}`}
                                className="rounded-2xl border border-yellow-200 bg-white px-4 py-3 text-sm text-slate-700"
                              >
                                <p className="font-semibold text-slate-900">Row {item.row}</p>
                                <p className="mt-1 text-sm text-slate-600">{item.error}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Masterlist table section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-semibold text-slate-900">Masterlist</h2>
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs text-slate-500">{records.length} {records.length === 1 ? "entry" : "entries"}</span>
                </div>
                {/* Actions bar */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input value={recordSearch} onChange={e => setRecordSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchRecords()} placeholder="Search by name or school ID..." className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" />
                    {recordSearch && <button onClick={() => { setRecordSearch(""); fetchRecords(); }} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>}
                  </div>
                  <button type="button" onClick={() => fetchRecords()} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Search</button>
                  <button onClick={() => setShowAddForm(v => !v)} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                    {showAddForm ? "Cancel" : "+ Add Entry"}
                  </button>
                </div>

                {/* Sync result */}

                {/* Add form */}
                {showAddForm && (
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-6">
                    <h3 className="mb-4 text-base font-semibold text-slate-900">Add Masterlist Entry</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        { key: "school_id", label: "School ID *" },
                        { key: "first_name", label: "First Name *" },
                        { key: "last_name", label: "Last Name *" },
                        { key: "year_level", label: "Year Level * (1st–4th)" },
                        { key: "course", label: "Course *" },
                        { key: "subjects", label: "Subjects * (pipe-separated)" },
                        { key: "email", label: "Email" },
                        { key: "contact_number", label: "Contact Number" },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
                          <input
                            value={(addForm as any)[key]}
                            onChange={e => setAddForm(prev => ({ ...prev, [key]: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>
                      ))}
                    </div>
                    <button onClick={handleAddRecord} disabled={addLoading} className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                      {addLoading ? "Saving..." : "Save Record"}
                    </button>
                  </div>
                )}

                {/* Records table */}
                <div className="rounded-2xl border border-slate-200 bg-white/90 overflow-hidden shadow-md">
                  <div className="hidden md:grid grid-cols-[1fr_1.4fr_0.8fr_0.8fr_1.2fr_80px] gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                    <span>School ID</span><span>Name</span><span>Year</span><span>Course</span><span>Subjects</span><span className="text-right">Action</span>
                  </div>
                  {recordsLoading ? (
                    <div className="py-12 text-center text-sm text-slate-500">Loading masterlist...</div>
                  ) : records.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-500">No masterlist entries found.</div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {records.map(r => (
                        <div key={r.id} className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr_0.8fr_0.8fr_1.2fr_80px] gap-4 px-5 py-3 items-center hover:bg-slate-50 transition-all">
                          <p className="text-sm font-semibold text-black">{r.school_id}</p>
                          <p className="text-sm text-black">{r.first_name} {r.last_name}</p>
                          <p className="text-sm text-black">{r.year_level || "—"}</p>
                          <p className="text-sm text-black">{r.course || "—"}</p>
                          <p className="text-xs text-black truncate">{(r.enrolled_subjects || []).join(", ") || "—"}</p>
                          <div className="flex justify-end">
                            <button onClick={() => handleDeleteRecord(r.id)} disabled={deletingId === r.id} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
                              {deletingId === r.id ? "..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </main>
        </EdpShell>
        <Footer />
      </div>
    </div>
  );
}
