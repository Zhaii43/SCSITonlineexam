// components/Header.tsx
"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, LogOut, User, Settings } from "lucide-react";
import NotificationBell from "./NotificationBell";
import { useToast } from "@/components/ToastProvider";
import { API_URL } from "@/lib/api";

interface HeaderProps {
  variant?: "default" | "minimal";
}

export default function Header({ variant: _variant = "default" }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const storedIsLoggedIn = useSyncExternalStore(
    () => () => {},
    () => !!window.localStorage.getItem("access_token"),
    () => false
  );
  const storedUserName = useSyncExternalStore(
    () => () => {},
    () => window.localStorage.getItem("user_name") || "User",
    () => "User"
  );
  const storedUserRole = useSyncExternalStore(
    () => () => {},
    () => window.localStorage.getItem("user_role") || "",
    () => ""
  );
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [profileIdentity, setProfileIdentity] = useState<{ userName: string; userRole: string } | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === "undefined") return 0;
    return window.innerWidth >= 1024 ? 240 : 0;
  });
  const isLoggedIn = storedIsLoggedIn;
  const userName = profileIdentity?.userName || storedUserName;
  const userRole = profileIdentity?.userRole || storedUserRole;

  useEffect(() => {
    const handleWidth = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail && typeof detail.width === "number") {
        setSidebarWidth(detail.width);
      }
    };
    window.addEventListener("instructor-sidebar-width", handleWidth as EventListener);
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarWidth(0);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("instructor-sidebar-width", handleWidth as EventListener);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    const fetchProfileName = async () => {
      try {
        const res = await fetch(`${API_URL}/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const displayName = data.first_name || data.username || "User";
        setProfileIdentity({ userName: displayName, userRole: data.role || storedUserRole });
        localStorage.setItem("user_name", displayName);
        if (data.role) localStorage.setItem("user_role", data.role);
      } catch {}
    };
    fetchProfileName();
  }, [storedUserRole]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_role");
    setProfileIdentity(null);
    toast.success("Logged out successfully.");
    router.push("/login");
  };

  const getDashboardLink = () => {
    if (userRole === "student") return "/dashboard/student";
    if (userRole === "instructor") return "/dashboard/teacher";
    if (userRole === "dean") return "/dashboard/dean";
    return "/dashboard";
  };

  const navItems = [
    { label: "About", href: "/about" },
    { label: "Features", href: "/features" },
    { label: "Help", href: "/help" },
  ];
  const dashboardChromeRoutes = [
    "/dashboard/teacher",
    "/exam/create",
    "/exam/questions",
    "/exam/",
    "/profile/settings",
    "/help",
    "/privacy",
    "/terms",
    "/contact",
    "/dashboard/dean",
    "/dashboard/dean/students",
    "/dashboard/dean/announcements",
    "/dashboard/dean/reports",
    "/dashboard/teacher/reports",
  ];
  const useDashboardChrome =
    mounted &&
    (userRole === "instructor" || userRole === "dean") &&
    pathname &&
    dashboardChromeRoutes.some((route) => pathname.startsWith(route));
  const dashboardRoleLabel = userRole === "dean" ? "Dean" : "Instructor";

  return (
    <header className="relative z-50">
      {/* Admin-style header for instructor dashboard */}
      {useDashboardChrome ? (
        <div className="border-b border-slate-200 bg-white relative z-30 transition-[padding] duration-300" style={{ paddingLeft: sidebarWidth }}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <button
                  className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  aria-label="Toggle sidebar"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("toggle-instructor-sidebar"));
                    }
                  }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <span className="text-sm font-semibold text-slate-700">{dashboardRoleLabel}</span>
              </div>
              <div className="flex items-center gap-3">
                <NotificationBell />
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                    aria-label="User menu"
                  >
                    <User size={18} />
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                        <p className="text-sm font-semibold text-slate-900">{userName}</p>
                        <p className="text-xs text-slate-600 capitalize">{userRole}</p>
                      </div>
                      <Link
                        href="/profile/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 border-b border-slate-100"
                      >
                        <Settings size={16} />
                        Profile Settings
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowLogoutModal(true);
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
      <>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        {/* Glass effect background */}
        <div className="absolute inset-0 bg-white/75 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/10" />
        
        <div className="relative flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image
                src="/logo.png"
                alt="SCSIT Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="hidden sm:inline text-xl font-bold text-slate-900 tracking-tight">
              SCSIT Online Exam
            </span>
            <span className="sm:hidden text-base font-bold text-slate-900 tracking-tight">
              SCSIT Exam
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Auth buttons / User menu - desktop */}
          <div className="hidden md:flex items-center gap-4">
            {!mounted ? (
              <div className="h-10 w-56 rounded-xl bg-slate-100 border border-slate-200" />
            ) : isLoggedIn ? (
              <>
                <NotificationBell />
                <Link
                  href={getDashboardLink()}
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Dashboard
                </Link>
                
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all"
                  >
                    <User size={16} />
                    <span>{userName}</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                        <p className="text-sm font-semibold text-slate-900">{userName}</p>
                        <p className="text-xs text-slate-600 capitalize">{userRole}</p>
                      </div>
                      <Link
                        href="/profile/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 border-b border-slate-100"
                      >
                        <Settings size={16} />
                        Profile Settings
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowLogoutModal(true);
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile actions */}
          <div className="md:hidden flex items-center gap-2">
            {isLoggedIn && <NotificationBell />}
            <button
              className="text-slate-700 p-2 rounded-xl border border-slate-200 bg-white/80 shadow-sm"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Toggle menu"
            >
              {isMobileOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-xl">
          <div className="px-5 py-6 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-2 text-base font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                onClick={() => setIsMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <div className="border-t border-slate-200 my-4" />

            {isLoggedIn ? (
              <>
                <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-sm font-semibold text-slate-900">{userName}</p>
                  <p className="text-xs text-slate-600 capitalize">{userRole}</p>
                </div>
                
                <Link
                  href={getDashboardLink()}
                  className="block py-3 px-4 text-center text-sm font-semibold bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 transition-all"
                  onClick={() => setIsMobileOpen(false)}
                >
                  Go to Dashboard
                </Link>
                
                <Link
                  href="/profile/settings"
                  className="block py-3 px-4 text-center text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Settings size={16} />
                  Profile Settings
                </Link>
                
                <button
                  onClick={() => {
                    setIsMobileOpen(false);
                    setShowLogoutModal(true);
                  }}
                  className="w-full py-3 px-4 text-center text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block py-3 text-center text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  onClick={() => setIsMobileOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="block py-3 text-center text-sm font-semibold bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 transition-all"
                  onClick={() => setIsMobileOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      </>
      )}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <LogOut size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Confirm Logout</h3>
              <p className="mt-2 text-sm text-slate-600">Are you sure you want to log out of your account?</p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  handleLogout();
                }}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
