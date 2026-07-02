"use client";

import { useEffect, useMemo, useState } from "react";
import { readStoredAttempts } from "@/lib/quiz-storage";
import {
  fetchSupabaseAttemptById,
  fetchSupabaseAttemptForStudent,
  fetchSupabaseAttemptsForStudent,
  sortAttemptsByNewest,
} from "@/lib/supabase-attempts";
import type { QuizAttempt } from "@/types/quiz";

type AttemptSource = "supabase" | "localStorage";

type StudentAttemptsState = {
  attempts: QuizAttempt[];
  hasLoaded: boolean;
  error: string;
  source: AttemptSource | null;
};

type StudentAttemptState = {
  attempt: QuizAttempt | null;
  hasLoaded: boolean;
  error: string;
  source: AttemptSource | null;
};

function normalizeRollNumber(rollNumber?: string | null) {
  return rollNumber?.trim() ?? "";
}

function readLocalAttemptsForStudent(rollNumber: string) {
  return sortAttemptsByNewest(
    readStoredAttempts().filter(
      (attempt) => attempt.rollNumber?.trim() === rollNumber,
    ),
  );
}

function readLocalAttemptForStudent(quizId: number, rollNumber: string) {
  return (
    readLocalAttemptsForStudent(rollNumber).find(
      (attempt) => attempt.quizId === quizId,
    ) ?? null
  );
}

function readLocalAttemptById(attemptId: number, quizId?: number) {
  return (
    readStoredAttempts().find((attempt) => {
      const matchesAttempt = attempt.attemptId === attemptId;
      const matchesQuiz = !Number.isFinite(quizId) || attempt.quizId === quizId;

      return matchesAttempt && matchesQuiz;
    }) ?? null
  );
}

export function useStudentAttempts(rollNumber?: string | null) {
  const normalizedRollNumber = normalizeRollNumber(rollNumber);
  const [state, setState] = useState<StudentAttemptsState>({
    attempts: [],
    hasLoaded: false,
    error: "",
    source: null,
  });

  useEffect(() => {
    let isActive = true;

    async function loadAttempts() {
      if (!normalizedRollNumber) {
        setState({
          attempts: [],
          hasLoaded: true,
          error: "",
          source: null,
        });
        return;
      }

      try {
        const result =
          await fetchSupabaseAttemptsForStudent(normalizedRollNumber);

        if (!isActive) {
          return;
        }

        if (!result.error) {
          setState({
            attempts: result.data,
            hasLoaded: true,
            error: "",
            source: "supabase",
          });
          return;
        }

        setState({
          attempts: readLocalAttemptsForStudent(normalizedRollNumber),
          hasLoaded: true,
          error: "",
          source: "localStorage",
        });
      } catch {
        if (!isActive) {
          return;
        }

        try {
          setState({
            attempts: readLocalAttemptsForStudent(normalizedRollNumber),
            hasLoaded: true,
            error: "",
            source: "localStorage",
          });
        } catch {
          setState({
            attempts: [],
            hasLoaded: true,
            error: "Unable to load attempts from Supabase or localStorage.",
            source: null,
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
  }, [normalizedRollNumber]);

  const attemptsByQuizId = useMemo(() => {
    return state.attempts.reduce<Record<number, QuizAttempt>>(
      (attemptsByQuiz, attempt) => {
        if (!attemptsByQuiz[attempt.quizId]) {
          attemptsByQuiz[attempt.quizId] = attempt;
        }

        return attemptsByQuiz;
      },
      {},
    );
  }, [state.attempts]);

  return {
    ...state,
    attemptsByQuizId,
  };
}

export function useStudentQuizAttempt(
  quizId: number,
  rollNumber?: string | null,
) {
  const normalizedRollNumber = normalizeRollNumber(rollNumber);
  const [state, setState] = useState<StudentAttemptState>({
    attempt: null,
    hasLoaded: false,
    error: "",
    source: null,
  });

  useEffect(() => {
    let isActive = true;

    async function loadAttempt() {
      if (!normalizedRollNumber || !Number.isFinite(quizId)) {
        setState({
          attempt: null,
          hasLoaded: true,
          error: "",
          source: null,
        });
        return;
      }

      try {
        const result = await fetchSupabaseAttemptForStudent(
          quizId,
          normalizedRollNumber,
        );

        if (!isActive) {
          return;
        }

        if (!result.error) {
          setState({
            attempt: result.data,
            hasLoaded: true,
            error: "",
            source: "supabase",
          });
          return;
        }

        setState({
          attempt: readLocalAttemptForStudent(quizId, normalizedRollNumber),
          hasLoaded: true,
          error: "",
          source: "localStorage",
        });
      } catch {
        if (!isActive) {
          return;
        }

        try {
          setState({
            attempt: readLocalAttemptForStudent(quizId, normalizedRollNumber),
            hasLoaded: true,
            error: "",
            source: "localStorage",
          });
        } catch {
          setState({
            attempt: null,
            hasLoaded: true,
            error: "Unable to load attempt status from Supabase or localStorage.",
            source: null,
          });
        }
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadAttempt();
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [normalizedRollNumber, quizId]);

  return state;
}

export function useAttemptResult(attemptId: number, quizId?: number) {
  const [state, setState] = useState<StudentAttemptState>({
    attempt: null,
    hasLoaded: false,
    error: "",
    source: null,
  });

  useEffect(() => {
    let isActive = true;

    async function loadAttempt() {
      if (!Number.isFinite(attemptId)) {
        setState({
          attempt: null,
          hasLoaded: true,
          error: "",
          source: null,
        });
        return;
      }

      try {
        const result = await fetchSupabaseAttemptById(attemptId);

        if (!isActive) {
          return;
        }

        if (!result.error && result.data) {
          const matchesQuiz =
            !Number.isFinite(quizId) || result.data.quizId === quizId;

          setState({
            attempt: matchesQuiz ? result.data : null,
            hasLoaded: true,
            error: "",
            source: "supabase",
          });
          return;
        }

        setState({
          attempt: readLocalAttemptById(attemptId, quizId),
          hasLoaded: true,
          error: "",
          source: "localStorage",
        });
      } catch {
        if (!isActive) {
          return;
        }

        try {
          setState({
            attempt: readLocalAttemptById(attemptId, quizId),
            hasLoaded: true,
            error: "",
            source: "localStorage",
          });
        } catch {
          setState({
            attempt: null,
            hasLoaded: true,
            error: "Unable to load result from Supabase or localStorage.",
            source: null,
          });
        }
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadAttempt();
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [attemptId, quizId]);

  return state;
}
