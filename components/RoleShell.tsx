// components/RoleShell.tsx
"use client";

import { useSyncExternalStore } from "react";
import InstructorShell from "@/components/InstructorShell";
import DeanShell from "@/components/DeanShell";

type Role = "" | "instructor" | "dean";

export default function RoleShell({ children }: { children: React.ReactNode }) {
  const role = useSyncExternalStore(
    () => () => {},
    () => {
      const stored = window.localStorage.getItem("user_role");
      return stored === "instructor" || stored === "dean" ? stored : "";
    },
    () => ""
  ) as Role;

  if (role === "instructor") {
    return <InstructorShell>{children}</InstructorShell>;
  }
  if (role === "dean") {
    return <DeanShell>{children}</DeanShell>;
  }
  return <>{children}</>;
}
