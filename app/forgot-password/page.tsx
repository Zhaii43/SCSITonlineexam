"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Step = 1 | 2 | 3;

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const directToken = searchParams.get("token");
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (directToken) {
      router.replace(`/reset-password?token=${encodeURIComponent(directToken)}`);
    }
  }, [directToken, router]);

  const safeJson = async (res: Response) => {
    try {
      return await res.json();
    } catch {
      return {};
    }
  };

  // Step 1 — send code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/password-reset/request/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await safeJson(res);
      if (!res.ok) { setError(data.error || "Failed to send code."); return; }
      setStep(2);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/password-reset/verify-code/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await safeJson(res);
      if (!res.ok) { setError(data.error || "Invalid code."); return; }
      setToken(data.token);
      router.push(`/reset-password?token=${encodeURIComponent(data.token)}`);
      return;
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/password-reset/reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await safeJson(res);
      if (!res.ok) { setError(data.error || "Failed to reset password."); return; }
      setDone(true);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ["Enter Email", "Verify Code", "New Password"];

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
        <div className="relative"><Header />
          <div className="flex items-center justify-center py-20 px-4">
            <div className="max-w-md w-full bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-sky-200/50 p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Password Reset!</h2>
              <p className="text-slate-600 mb-6">Your password has been changed successfully. You can now log in.</p>
              <Link href="/login" className="bg-gradient-to-r from-sky-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all inline-block">
                Back to Login
              </Link>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.15),transparent_50%)]" />
      <div className="relative">
        <Header />
        <main className="flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full space-y-6">

            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-1">Reset Password</h2>
              <p className="text-slate-500 text-sm">Follow the steps to reset your password</p>
            </div>

            {/* Step indicator */}
            <div className="flex items-start justify-between relative">
              {/* connecting line */}
              <div className="absolute top-4 left-[calc(16.66%)] right-[calc(16.66%)] h-0.5 bg-slate-200 z-0" />
              <div
                className="absolute top-4 h-0.5 bg-sky-500 z-0 transition-all duration-300"
                style={{ left: 'calc(16.66%)', width: step === 1 ? '0%' : step === 2 ? '33.33%' : '66.66%' }}
              />
              {stepLabels.map((label, i) => {
                const n = (i + 1) as Step;
                const active = step === n;
                const isDone = step > n;
                return (
                  <div key={n} className="flex flex-col items-center z-10" style={{ width: '33.33%' }}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                      ${isDone ? 'bg-sky-500 border-sky-500 text-white' : active ? 'bg-white border-sky-500 text-sky-600' : 'bg-white border-slate-300 text-slate-400'}`}>
                      {isDone ? '✓' : n}
                    </div>
                    <span className={`text-xs mt-1 font-medium text-center ${active ? 'text-sky-600' : isDone ? 'text-sky-500' : 'text-slate-400'}`}>{label}</span>
                  </div>
                );
              })}
            </div>

            <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-sky-200/50 p-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                  {error}
                </div>
              )}

              {/* Step 1 */}
              {step === 1 && (
                <form onSubmit={handleSendCode} className="space-y-5">
                  <div className="text-center mb-2">
                    <div className="text-4xl mb-2">📧</div>
                    <p className="text-slate-600 text-sm">Enter your registered email address and we&apos;ll send you a 6-digit verification code.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full px-4 py-3 border border-sky-200 rounded-xl bg-white/80 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      placeholder="your@email.com" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-gradient-to-r from-sky-500 to-blue-500 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50">
                    {loading ? "Sending..." : "Send Verification Code"}
                  </button>
                  <div className="text-center">
                    <Link href="/login" className="text-sky-600 hover:text-sky-700 text-sm font-medium">← Back to Login</Link>
                  </div>
                </form>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <div className="text-center mb-2">
                    <div className="text-4xl mb-2">🔢</div>
                    <p className="text-slate-600 text-sm">Enter the 6-digit code sent to <span className="font-semibold text-slate-800">{email}</span></p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Verification Code</label>
                    <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required maxLength={6}
                      className="w-full px-4 py-3 border border-sky-200 rounded-xl bg-white/80 text-slate-900 text-center text-2xl tracking-widest font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      placeholder="000000" />
                  </div>
                  <button type="submit" disabled={loading || code.length !== 6}
                    className="w-full bg-gradient-to-r from-sky-500 to-blue-500 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50">
                    {loading ? "Verifying..." : "Verify Code"}
                  </button>
                  <div className="flex justify-between text-sm">
                    <button type="button" onClick={() => { setStep(1); setCode(""); setError(""); }} className="text-slate-500 hover:text-slate-700">← Back</button>
                    <button type="button" onClick={() => { setCode(""); setError(""); handleSendCode({ preventDefault: () => {} } as any); }}
                      className="text-sky-600 hover:text-sky-700 font-medium">Resend code</button>
                  </div>
                </form>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="text-center mb-2">
                    <div className="text-4xl mb-2">🔐</div>
                    <p className="text-slate-600 text-sm">Create a new password for your account.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                        className="w-full px-4 py-3 pr-16 border border-sky-200 rounded-xl bg-white/80 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        placeholder="Minimum 8 characters" />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sky-600 font-medium">
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                    <div className="relative">
                      <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                        className="w-full px-4 py-3 pr-16 border border-sky-200 rounded-xl bg-white/80 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        placeholder="Repeat password" />
                      <button type="button" onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sky-600 font-medium">
                        {showConfirm ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-gradient-to-r from-sky-500 to-blue-500 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50">
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default function ForgotPassword() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
