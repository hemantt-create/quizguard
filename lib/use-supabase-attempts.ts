"use client";

import { useEffect, useState } from "react";
import { readStoredAttempts } from "@/lib/quiz-storage";
import {
  fetchSupabaseAttempts,
  sortAttemptsByNewest,
} from "@/lib/supabase-attempts";
import type { QuizAttempt } from "@/types/quiz";

type SupabaseAttemptsState = {
  attempts: QuizAttempt[];
  hasLoaded: boolean;
  isLocalFallback: boolean;
  error: string;
};

function readLocalAttemptsFallback() {
  return sortAttemptsByNewest(readStoredAttempts());
}

export function useSupabaseAttempts() {
  const [state, setState] = useState<SupabaseAttemptsState>({
    attempts: [],
    hasLoaded: false,
    isLocalFallback: false,
    error: "",
  });

  useEffect(() => {
    let isActive = true;

    async function loadAttempts() {
      try {
        const result = await fetchSupabaseAttempts();

        if (!isActive) {
          return;
        }

        if (!result.error) {
          setState({
            attempts: result.data,
            hasLoaded: true,
            isLocalFallback: false,
            error: "",
          });
          return;
        }

        setState({
          attempts: readLocalAttemptsFallback(),
          hasLoaded: true,
          isLocalFallback: true,
          error: "",
        });
      } catch {
        if (!isActive) {
          return;
        }

        try {
          setState({
            attempts: readLocalAttemptsFallback(),
            hasLoaded: true,
            isLocalFallback: true,
            error: "",
          });
        } catch {
          setState({
            attempts: [],
            hasLoaded: true,
            isLocalFallback: false,
            error: "Unable to load results from Supabase or localStorage.",
          });
        }
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadAttempts();
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

  return state;
}
