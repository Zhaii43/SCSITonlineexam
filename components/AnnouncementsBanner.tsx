"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";

interface Announcement {
  id: number;
  title: string;
  message: string;
  target_audience: string;
  department: string | null;
  created_by: string;
  created_by_role: string;
  created_at: string;
}

const ROLE_LABEL: Record<string, { label: string; cls: string }> = {
  dean:       { label: "Dean",       cls: "bg-purple-100 text-purple-700" },
  instructor: { label: "Instructor", cls: "bg-sky-100 text-sky-700" },
};

type AnnouncementsBannerProps = {
  onMarkAllAsRead?: (timestamp: string) => void;
};

export default function AnnouncementsBanner({ onMarkAllAsRead }: AnnouncementsBannerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [lastReadAtOverride, setLastReadAtOverride] = useState<string | null>(null);
  const lastReadAt = useSyncExternalStore(
    () => () => {},
    () => lastReadAtOverride ?? window.localStorage.getItem("announcements_read_all_at"),
    () => null
  );
  const userRole = useSyncExternalStore(
    () => () => {},
    () => window.localStorage.getItem("user_role") || "",
    () => ""
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchAnnouncements = () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      fetch(`${API_URL}/notifications/announcements/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => { if (data.announcements) setAnnouncements(data.announcements); })
        .catch(() => {});
    };
    fetchAnnouncements();
    const timer = setTimeout(fetchAnnouncements, 1000);
    return () => clearTimeout(timer);
  }, []);

  const isUnread = (a: Announcement) =>
    !lastReadAt || new Date(a.created_at).getTime() > new Date(lastReadAt).getTime();
  const visible = announcements.filter((a) => !dismissed.includes(a.id));
  const unreadCount = visible.filter((a) => isUnread(a)).length;
  if (visible.length === 0) return null;

  const getTimeAgo = (dateString: string) => {
    const seconds = Math.floor((nowMs - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Date(dateString).toLocaleDateString();
  };

  const handleDismiss = (id: number) => {
    setDismissed((p) => [...p, id]);
    setExpanded(false);
    setCurrent((c) => {
      const next = visible.filter((a) => a.id !== id);
      return Math.min(c, Math.max(next.length - 1, 0));
    });
  };

  const handlePrev = () => { setCurrent((c) => Math.max(c - 1, 0)); setExpanded(false); };
  const handleNext = () => { setCurrent((c) => Math.min(c + 1, visible.length - 1)); setExpanded(false); };
  const handleMarkAllAsRead = () => {
    const now = new Date().toISOString();
    localStorage.setItem("announcements_read_all_at", now);
    setLastReadAtOverride(now);
    setExpanded(false);
    setShowAll(false);
    setHidden(false);
    setCurrent(0);
    onMarkAllAsRead?.(now);
  };

  const manageHref =
    userRole === "dean"
      ? "/dashboard/dean/announcements"
      : userRole === "instructor"
      ? "/dashboard/teacher/announcements"
      : null;

  const a = visible[Math.min(current, visible.length - 1)];

  return (
    <div className="mb-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">📢</span>
          <span className="text-sm font-semibold text-amber-800">Announcements</span>
          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {unreadCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {manageHref && (
            <Link
              href={manageHref}
              className="text-xs font-semibold text-amber-800 hover:underline"
            >
              Manage
            </Link>
          )}
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs text-amber-700 font-semibold hover:underline"
          >
            Mark all as read
          </button>
          {!hidden && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="text-xs text-amber-700 font-medium hover:underline"
            >
              {showAll ? "Show less ▲" : "View all ▼"}
            </button>
          )}
          <button
            onClick={() => { setHidden((h) => !h); setShowAll(false); setExpanded(false); }}
            className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 font-semibold px-2.5 py-1 rounded-lg transition-colors"
          >
            {hidden ? "Show ▼" : "Hide ▲"}
          </button>
        </div>
      </div>

      {/* ── Content (hidden when collapsed) ── */}
      {!hidden && (
        <>
          {!showAll ? (
            /* Single card view */
            <div className={`bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm ${isUnread(a) ? "" : "opacity-80"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-amber-900 truncate">{a.title}</span>
                    {a.department && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        {a.department}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isUnread(a) ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {isUnread(a) ? "New" : "Read"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs text-amber-600">by {a.created_by}</span>
                    {ROLE_LABEL[a.created_by_role] && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_LABEL[a.created_by_role].cls}`}>
                        {ROLE_LABEL[a.created_by_role].label}
                      </span>
                    )}
                    <span className="text-amber-300">·</span>
                    <span className="text-xs text-amber-500">{getTimeAgo(a.created_at)}</span>
                  </div>
                  <p className={`text-sm text-amber-800 leading-relaxed ${expanded ? "whitespace-pre-wrap" : "line-clamp-2"}`}>
                    {a.message}
                  </p>
                  {a.message.length > 120 && (
                    <button
                      onClick={() => setExpanded((e) => !e)}
                      className="text-xs text-amber-700 font-semibold mt-1 hover:underline"
                    >
                      {expanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleDismiss(a.id)}
                  className="text-amber-400 hover:text-amber-600 text-xl leading-none shrink-0 mt-0.5"
                  title="Dismiss"
                >
                  ×
                </button>
              </div>

              {visible.length > 1 && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-amber-200">
                  <button onClick={handlePrev} disabled={current === 0} className="text-xs text-amber-700 font-semibold disabled:opacity-30 hover:underline">
                    ← Prev
                  </button>
                  <div className="flex items-center gap-1">
                    {visible.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => { setCurrent(i); setExpanded(false); }}
                        className={`h-2 rounded-full transition-all ${i === current ? "bg-amber-500 w-4" : "bg-amber-300 w-2"}`}
                      />
                    ))}
                  </div>
                  <button onClick={handleNext} disabled={current === visible.length - 1} className="text-xs text-amber-700 font-semibold disabled:opacity-30 hover:underline">
                    Next →
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Expanded list view */
            <div className="space-y-3">
              {visible.map((ann) => (
                <div key={ann.id} className={`bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm ${isUnread(ann) ? "" : "opacity-80"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-amber-900">{ann.title}</span>
                        {ann.department && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                            {ann.department}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isUnread(ann) ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                          {isUnread(ann) ? "New" : "Read"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs text-amber-600">by {ann.created_by}</span>
                        {ROLE_LABEL[ann.created_by_role] && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_LABEL[ann.created_by_role].cls}`}>
                            {ROLE_LABEL[ann.created_by_role].label}
                          </span>
                        )}
                        <span className="text-amber-300">·</span>
                        <span className="text-xs text-amber-500">{getTimeAgo(ann.created_at)}</span>
                      </div>
                      <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-wrap">{ann.message}</p>
                    </div>
                    <button
                      onClick={() => handleDismiss(ann.id)}
                      className="text-amber-400 hover:text-amber-600 text-xl leading-none shrink-0 mt-0.5"
                      title="Dismiss"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
