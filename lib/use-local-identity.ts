"use client";

import { useEffect, useState } from "react";
import {
  readStoredAdmin,
  readStoredStudent,
} from "@/lib/quiz-storage";
import type { AdminIdentity, StudentIdentity } from "@/types/quiz";

type StudentIdentityState = {
  student: StudentIdentity | null;
  hasLoaded: boolean;
};

type AdminIdentityState = {
  admin: AdminIdentity | null;
  hasLoaded: boolean;
};

export function useStoredStudentIdentity() {
  const [state, setState] = useState<StudentIdentityState>({
    student: null,
    hasLoaded: false,
  });

  useEffect(() => {
    let isActive = true;

    const timeoutId = window.setTimeout(() => {
      if (!isActive) {
        return;
      }

      setState({
        student: readStoredStudent(),
        hasLoaded: true,
      });
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

  return state;
}

export function useStoredAdminIdentity() {
  const [state, setState] = useState<AdminIdentityState>({
    admin: null,
    hasLoaded: false,
  });

  useEffect(() => {
    let isActive = true;

    const timeoutId = window.setTimeout(() => {
      if (!isActive) {
        return;
      }

      setState({
        admin: readStoredAdmin(),
        hasLoaded: true,
      });
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

  return state;
}
