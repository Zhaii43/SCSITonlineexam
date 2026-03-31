"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page is superseded by the pendingStudents tab on the main dean dashboard.
// Redirect to avoid confusion.
export default function DeanStudentsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/dean#pending-students"); }, [router]);
  return null;
}
