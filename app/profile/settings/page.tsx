"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RoleShell from "@/components/RoleShell";
import Cropper, { type Area } from "react-easy-crop";

import { API_URL } from "@/lib/api";

interface Profile {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  role: string;
  department?: string | null;
  school_id?: string | null;
  profile_picture?: string | null;
  id_photo?: string | null;
  id_verified?: boolean;
  is_approved?: boolean;
  study_load?: string | null;
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function ProfileSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [profileData, setProfileData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    contact_number: "",
  });

  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [studyLoad, setStudyLoad] = useState<File | null>(null);
  const [studyLoadMessage, setStudyLoadMessage] = useState<{ type: string; text: string } | null>(null);
  const [uploadingStudyLoad, setUploadingStudyLoad] = useState(false);
  const [emailChange, setEmailChange] = useState({
    pending: false,
    email: "",
    code: "",
    sending: false,
    verifying: false,
    message: "",
  });

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch profile");

      const data = await res.json();
      setProfile(data);
      setProfileData({
        username: data.username || "",
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        contact_number: data.contact_number || "",
      });
      setLoading(false);
    } catch {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const token = localStorage.getItem("access_token");
    const nextEmail = profileData.email.trim().toLowerCase();
    const currentEmail = (profile?.email || "").trim().toLowerCase();
    const emailChanged = !!nextEmail && nextEmail !== currentEmail;
    
    try {
      const formData = new FormData();

      if (!emailChanged) {
        formData.append("email", profileData.email);
      }
      formData.append("contact_number", profileData.contact_number);
      
      if (profilePicture) {
        formData.append("profile_picture", profilePicture);
      }

      const profileRes = await fetch(`${API_URL}/profile/update/`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const profileResData = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileResData.error || "Failed to update profile");
      if (profileResData.user) {
        setProfile((prev) => (prev ? { ...prev, ...profileResData.user } : profileResData.user));
        if (!emailChanged) {
          setProfileData({
            username: profileResData.user.username || "",
            first_name: profileResData.user.first_name || "",
            last_name: profileResData.user.last_name || "",
            email: profileResData.user.email || "",
            contact_number: profileResData.user.contact_number || "",
          });
        }
      }

      if (emailChanged) {
        setEmailChange((prev) => ({ ...prev, sending: true, message: "" }));
        const emailRes = await fetch(`/api/profile/email-change/request/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: profileData.email }),
        });
        const emailResData = await emailRes.json();
        if (!emailRes.ok) throw new Error(emailResData.error || "Failed to send verification code");
        setEmailChange({
          pending: true,
          email: profileData.email,
          code: "",
          sending: false,
          verifying: false,
          message: `Verification code sent to ${profileData.email}`,
        });
      }

      if (passwordData.old_password && passwordData.new_password) {
        if (passwordData.new_password !== passwordData.confirm_password) {
          throw new Error("New passwords do not match");
        }

        const passwordRes = await fetch(`${API_URL}/profile/change-password/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            old_password: passwordData.old_password,
            new_password: passwordData.new_password,
          }),
        });

        const passwordData_response = await passwordRes.json();
        if (!passwordRes.ok) throw new Error(passwordData_response.error || "Failed to change password");
        
        setPasswordData({ old_password: "", new_password: "", confirm_password: "" });
      }

      if (!emailChanged) {
        setShowSuccessModal(true);
      }
      setProfilePicture(null);
      setPreviewUrl(null);
      if (!emailChanged) {
        await fetchProfile();
      }
      if (!emailChanged) {
        window.setTimeout(() => {
          const role = profile?.role;
          if (role === "instructor") {
            router.push("/dashboard/teacher");
          } else if (role) {
            router.push(`/dashboard/${role}`);
          } else {
            router.push("/dashboard");
          }
        }, 1500);
      }
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err, "Failed to save changes") });
    } finally {
      setSaving(false);
      setEmailChange((prev) => ({ ...prev, sending: false }));
    }
  };

  const handleVerifyEmailChange = async () => {
    if (!emailChange.code.trim()) {
      setEmailChange((prev) => ({ ...prev, message: "Please enter the verification code." }));
      return;
    }
    const token = localStorage.getItem("access_token");
    setEmailChange((prev) => ({ ...prev, verifying: true, message: "" }));
    try {
      const res = await fetch(`/api/profile/email-change/verify/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: emailChange.email, code: emailChange.code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify code");
      setEmailChange({ pending: false, email: "", code: "", sending: false, verifying: false, message: "" });
      setShowSuccessModal(true);
      await fetchProfile();
      window.setTimeout(() => {
        const role = profile?.role;
        if (role === "instructor") {
          router.push("/dashboard/teacher");
        } else if (role) {
          router.push(`/dashboard/${role}`);
        } else {
          router.push("/dashboard");
        }
      }, 1500);
    } catch (err) {
      setEmailChange((prev) => ({ ...prev, message: getErrorMessage(err, "Verification failed") }));
    } finally {
      setEmailChange((prev) => ({ ...prev, verifying: false }));
    }
  };

  const handleResendEmailChange = async () => {
    const token = localStorage.getItem("access_token");
    setEmailChange((prev) => ({ ...prev, sending: true, message: "" }));
    try {
      const res = await fetch(`/api/profile/email-change/resend/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: emailChange.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend code");
      setEmailChange((prev) => ({ ...prev, message: `Verification code resent to ${emailChange.email}` }));
    } catch (err) {
      setEmailChange((prev) => ({ ...prev, message: getErrorMessage(err, "Failed to resend code") }));
    } finally {
      setEmailChange((prev) => ({ ...prev, sending: false }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setCropImageSrc(reader.result as string);
      setShowCropModal(true);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    });
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const createImage = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, cropPixels: Area) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    canvas.width = cropPixels.width;
    canvas.height = cropPixels.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(
      image,
      cropPixels.x,
      cropPixels.y,
      cropPixels.width,
      cropPixels.height,
      0,
      0,
      cropPixels.width,
      cropPixels.height
    );
    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    });
  };

  const handleCropSave = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    const blob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
    if (!blob) return;
    const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
    setProfilePicture(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowCropModal(false);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setCropImageSrc(null);
  };

  const handleUploadStudyLoad = async () => {
    if (!studyLoad) return;
    setUploadingStudyLoad(true);
    setStudyLoadMessage(null);
    const token = localStorage.getItem("access_token");
    const formData = new FormData();
    formData.append("study_load", studyLoad);
    try {
      const res = await fetch(`${API_URL}/profile/upload-documents/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setStudyLoadMessage({ type: "success", text: "Study load uploaded! Waiting for dean approval." });
      setStudyLoad(null);
      await fetchProfile();
    } catch (err) {
      setStudyLoadMessage({ type: "error", text: getErrorMessage(err, "Upload failed") });
    } finally {
      setUploadingStudyLoad(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-100 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.12),transparent_45%)] flex items-center justify-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-xl shadow-slate-200/70 border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-sky-500"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const profileImageSrc = previewUrl || profile.profile_picture || undefined;

  return (
    <div className="min-h-screen bg-sky-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(251,146,60,0.14),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.12),transparent_45%)]" />
      
      <div className="relative">
        <Header />
        <RoleShell>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10" style={{ fontFamily: "'Space Grotesk', 'Manrope', sans-serif" }}>
          {showCropModal && cropImageSrc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-900">Crop Profile Picture</h2>
                  <button
                    onClick={handleCropCancel}
                    className="text-slate-400 hover:text-slate-700 text-2xl"
                  >
                    x
                  </button>
                </div>
                <div className="relative h-[360px] bg-slate-900">
                  <Cropper
                    image={cropImageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Zoom</label>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.01}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full accent-sky-600"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCropCancel}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCropSave}
                      className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Use Photo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {emailChange.pending && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Verify New Email</h2>
                    <p className="text-xs text-slate-500">We sent a code to {emailChange.email}</p>
                  </div>
                  <button
                    onClick={() => setEmailChange((prev) => ({ ...prev, pending: false }))}
                    className="text-slate-400 hover:text-slate-700 text-2xl"
                  >
                    x
                  </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                  {emailChange.message && (
                    <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-sky-700">
                      {emailChange.message}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Verification Code</label>
                    <input
                      type="text"
                      value={emailChange.code}
                      onChange={(e) => setEmailChange((prev) => ({ ...prev, code: e.target.value }))}
                      className="w-full px-4 py-3 border border-sky-200 rounded-xl bg-white/90 focus:ring-2 focus:ring-sky-500 text-slate-900"
                      placeholder="Enter 6-digit code"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleResendEmailChange}
                      disabled={emailChange.sending}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {emailChange.sending ? "Sending..." : "Resend Code"}
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyEmailChange}
                      disabled={emailChange.verifying}
                      className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                      {emailChange.verifying ? "Verifying..." : "Verify Email"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="mb-4 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-lg shadow-slate-200/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link 
                href={profile.role === 'instructor' ? '/dashboard/teacher' : `/dashboard/${profile.role}`} 
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-[11px] font-semibold tracking-[0.18em] uppercase"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
                  <svg className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </span>
                Back to Dashboard
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 text-sky-700 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                {profile.role} Profile
              </span>
            </div>
            <div className="mt-4">
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Profile Settings</h1>
              <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-sky-500 to-blue-500" />
              <p className="mt-2 text-xs text-slate-600">{profile.email}</p>
            </div>
          </div>

          {message && message.type === "error" && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
              {message.text}
            </div>
          )}

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200 p-6">
            <form onSubmit={handleSaveChanges} className="space-y-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                      {profileImageSrc ? (
                        <img src={profileImageSrc} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span>{profile.first_name?.[0]}{profile.last_name?.[0]}</span>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-sky-600 text-white p-2 rounded-full cursor-pointer hover:bg-sky-700 transition-all">
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </label>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">Click camera icon to upload photo</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
                  <div className="rounded-2xl border border-sky-200/70 bg-gradient-to-br from-white via-white to-sky-50 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Profile Details</p>
                        <h2 className="text-lg font-semibold text-slate-900">Make it yours</h2>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                        Editable
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-900 mb-2">Username</label>
                        <input
                          type="text"
                          value={profileData.username}
                          disabled
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">First Name</label>
                        <input
                          type="text"
                          value={profileData.first_name}
                          disabled
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">Last Name</label>
                        <input
                          type="text"
                          value={profileData.last_name}
                          disabled
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-900 mb-2">Email Address</label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="w-full px-4 py-3 border border-sky-200 rounded-xl bg-white/90 focus:ring-2 focus:ring-sky-500 text-slate-900"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-900 mb-2">Contact Number</label>
                        <input
                          type="text"
                          value={profileData.contact_number}
                          onChange={(e) => setProfileData({ ...profileData, contact_number: e.target.value })}
                          className="w-full px-4 py-3 border border-sky-200 rounded-xl bg-white/90 focus:ring-2 focus:ring-sky-500 text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Account Snapshot</p>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Role</p>
                        <p className="text-sm font-semibold text-slate-900 capitalize">{profile.role}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Department</p>
                        <p className="text-sm font-semibold text-slate-900">{profile.department || "—"}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">
                          {profile.role === "instructor" ? "Employee ID" : profile.role === "dean" ? "Dean ID" : profile.role === "edp" ? "EDP ID" : "School ID"}
                        </p>
                        <p className="text-sm font-semibold text-slate-900">{profile.school_id || "—"}</p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl bg-sky-50 border border-sky-100 px-3 py-3 text-xs text-sky-700">
                      Tip: Use a clear username so instructors and admins can recognize you quickly.
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Change Password (Optional)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">Current Password</label>
                      <input
                        type="password"
                        value={passwordData.old_password}
                        onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                        className="w-full px-4 py-3 border border-sky-200 rounded-xl bg-white/80 focus:ring-2 focus:ring-sky-500 text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">New Password</label>
                        <input
                          type="password"
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                          minLength={8}
                          className="w-full px-4 py-3 border border-sky-200 rounded-xl bg-white/80 focus:ring-2 focus:ring-sky-500 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          value={passwordData.confirm_password}
                          onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                          className="w-full px-4 py-3 border border-sky-200 rounded-xl bg-white/80 focus:ring-2 focus:ring-sky-500 text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-slate-900 text-white py-3 rounded-xl hover:bg-slate-800 transition-all font-medium disabled:opacity-50 shadow-lg shadow-slate-900/20"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>

          {/* ID Photo Upload for all students */}
          {profile.role === 'student' && (
            <div className="mt-6 bg-white/90 border border-slate-200 rounded-3xl shadow-xl p-8">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">🪪</span>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">ID Photo</h2>
                  <p className="text-sm text-slate-600 mt-1">Submitted during registration and reviewed by your dean during student verification.</p>
                </div>
              </div>
              {profile.id_photo && (
                <div className="mb-4">
                  <img src={profile.id_photo} alt="ID Photo" className="w-48 h-32 object-cover rounded-xl border border-slate-200" />
                  <p className={`text-xs mt-1 font-semibold ${profile.id_verified ? 'text-green-600' : 'text-amber-600'}`}>
                    {profile.id_verified ? '✓ Verified' : 'Pending verification'}
                  </p>
                </div>
              )}
              {!profile.id_photo && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  No ID photo was found on your registration. Contact your dean or re-register if this was submitted incorrectly.
                </div>
              )}
            </div>
          )}

          {/* Study Load Upload — only for bulk-imported pending students */}
          {profile.role === 'student' && !profile.is_approved && (
            <div className="mt-6 bg-white/90 border border-amber-200 rounded-3xl shadow-xl p-8">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h2 className="text-xl font-bold text-amber-900">Action Required: Upload Study Load</h2>
                  <p className="text-sm text-amber-700 mt-1">Your account is pending approval. Please upload your study load so the dean can verify and approve your account.</p>
                </div>
              </div>

              {studyLoadMessage && (
                <div className={`mb-4 p-4 rounded-xl ${
                  studyLoadMessage.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
                }`}>
                  {studyLoadMessage.text}
                </div>
              )}

              <div className="p-4 rounded-xl border border-amber-200 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-semibold text-slate-900">Study Load</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    profile.study_load ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {profile.study_load ? 'Uploaded — Pending Approval' : 'Missing'}
                  </span>
                </div>
                {profile.study_load && (
                  <a href={profile.study_load} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 underline mb-2 block">View uploaded file</a>
                )}
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setStudyLoad(e.target.files?.[0] || null)}
                  className="block text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                />
                {studyLoad && <p className="text-xs text-slate-500 mt-1">Selected: {studyLoad.name}</p>}
              </div>

              <button
                onClick={handleUploadStudyLoad}
                disabled={!studyLoad || uploadingStudyLoad}
                className="mt-4 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl hover:shadow-xl transition-all font-medium disabled:opacity-50"
              >
                {uploadingStudyLoad ? 'Uploading...' : 'Upload Study Load'}
              </button>
            </div>
          )}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Changes saved successfully!</h3>
                <p className="mt-2 text-sm text-slate-600">Taking you back to your dashboard...</p>
              </div>
            </div>
          </div>
        )}

        </main>
        </RoleShell>
        <Footer />
      </div>
    </div>
  );
}
