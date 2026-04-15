"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { API_URL, WS_URL } from "@/lib/api";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number | null>(null);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/notifications/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }, []);

  useEffect(() => {
    const initialFetchTimer = window.setTimeout(() => {
      void fetchNotifications();
    }, 0);
    const interval = setInterval(fetchNotifications, 30000);

    let active = true;
    const connectSocket = () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const wsUrl = `${WS_URL}/ws/notifications/?token=${token}`;
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.type === "notification" && data.notification) {
            setNotifications((prev) => {
              if (prev.some((n) => n.id === data.notification.id)) return prev;
              return [data.notification, ...prev];
            });
            if (typeof data.unread_count === "number") {
              setUnreadCount(data.unread_count);
            } else if (data.notification?.is_read === false) {
              setUnreadCount((c) => c + 1);
            }
          }
        } catch {
          // Ignore invalid payloads
        }
      };

      ws.onclose = () => {
        if (!active) return;
        reconnectRef.current = window.setTimeout(connectSocket, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectSocket();

    return () => {
      active = false;
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
      window.clearTimeout(initialFetchTimer);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: number) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      await fetch(`${API_URL}/notifications/${notificationId}/read/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      await fetch(`${API_URL}/notifications/mark-all-read/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const clearAllNotifications = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    if (!confirm("Are you sure you want to clear all notifications?")) return;

    try {
      await fetch(`${API_URL}/notifications/clear-all/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (err) {
      console.error("Failed to clear notifications", err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      const token = localStorage.getItem("access_token");
      let target = notification.link;
      const role = localStorage.getItem("user_role");
      if (role === "instructor" && target.startsWith("/exam/") && target.endsWith("/detail")) {
        target = target.replace(/\/detail$/, "/edit");
      }
      if (target === "/login" && token) {
        if (role === "student") target = "/dashboard/student";
        else if (role === "instructor") target = "/dashboard/teacher";
        else if (role === "dean") target = "/dashboard/dean";
        else if (role === "edp") target = "/dashboard/edp";
        else target = "/dashboard";
      }
      router.push(target);
    }
    setShowDropdown(false);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-slate-600 hover:text-sky-600 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-20 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-sky-600 hover:text-sky-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear All
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <svg className="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                      !notification.is_read ? "bg-sky-50" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium text-slate-900 text-sm">
                        {notification.title}
                      </h4>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-sky-600 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-400">
                      {getTimeAgo(notification.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
