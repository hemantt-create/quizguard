"use client";

import { useEffect, useState } from "react";
import { readStoredAttempts } from "@/lib/quiz-storage";
import type { QuizAttempt } from "@/types/quiz";

type StoredAttemptsState = {
  attempts: QuizAttempt[];
  hasLoaded: boolean;
};

function getSortedStoredAttempts() {
  return readStoredAttempts().sort(
    (firstAttempt, secondAttempt) =>
      secondAttempt.attemptId - firstAttempt.attemptId,
  );
}

export function useStoredAttempts() {
  const [state, setState] = useState<StoredAttemptsState>({
    attempts: [],
    hasLoaded: false,
  });

  useEffect(() => {
    let isActive = true;

    const timeoutId = window.setTimeout(() => {
      if (!isActive) {
        return;
      }

      setState({
        attempts: getSortedStoredAttempts(),
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
