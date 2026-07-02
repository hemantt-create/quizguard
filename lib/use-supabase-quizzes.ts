"use client";

import { useEffect, useState } from "react";
import {
  quizStoreEventName,
  readStoredQuizzes,
} from "@/lib/quiz-storage";
import {
  fetchSupabaseQuizById,
  fetchSupabaseQuizzes,
  sortQuizzesByNewest,
} from "@/lib/supabase-quizzes";
import type { Quiz } from "@/types/quiz";

type QuizSource = "supabase" | "localStorage";

type SupabaseQuizzesState = {
  quizzes: Quiz[];
  hasLoaded: boolean;
  error: string;
  source: QuizSource | null;
};

type SupabaseQuizState = {
  quiz: Quiz | null;
  hasLoaded: boolean;
  error: string;
  source: QuizSource | null;
};

function readLocalQuizzesFallback() {
  return sortQuizzesByNewest(readStoredQuizzes());
}

function readLocalQuizFallback(quizId: number) {
  return (
    readLocalQuizzesFallback().find((storedQuiz) => storedQuiz.id === quizId) ??
    null
  );
}

export function useSupabaseQuizzes() {
  const [state, setState] = useState<SupabaseQuizzesState>({
    quizzes: [],
    hasLoaded: false,
    error: "",
    source: null,
  });

  useEffect(() => {
    let isActive = true;

    async function loadQuizzes() {
      try {
        const result = await fetchSupabaseQuizzes();

        if (!isActive) {
          return;
        }

        if (!result.error) {
          setState({
            quizzes: result.data,
            hasLoaded: true,
            error: "",
            source: "supabase",
          });
          return;
        }

        setState({
          quizzes: readLocalQuizzesFallback(),
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
            quizzes: readLocalQuizzesFallback(),
            hasLoaded: true,
            error: "",
            source: "localStorage",
          });
        } catch {
          setState({
            quizzes: [],
            hasLoaded: true,
            error: "Unable to load quizzes from Supabase or localStorage.",
            source: null,
          });
        }
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadQuizzes();
    }, 0);

    window.addEventListener("storage", loadQuizzes);
    window.addEventListener(quizStoreEventName, loadQuizzes);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
      window.removeEventListener("storage", loadQuizzes);
      window.removeEventListener(quizStoreEventName, loadQuizzes);
    };
  }, []);

  return state;
}

export function useSupabaseQuiz(quizId: number) {
  const [state, setState] = useState<SupabaseQuizState>({
    quiz: null,
    hasLoaded: false,
    error: "",
    source: null,
  });

  useEffect(() => {
    let isActive = true;

    async function loadQuiz() {
      if (!Number.isFinite(quizId)) {
        setState({
          quiz: null,
          hasLoaded: true,
          error: "",
          source: null,
        });
        return;
      }

      try {
        const result = await fetchSupabaseQuizById(quizId);

        if (!isActive) {
          return;
        }

        if (!result.error && result.data) {
          setState({
            quiz: result.data,
            hasLoaded: true,
            error: "",
            source: "supabase",
          });
          return;
        }

        setState({
          quiz: readLocalQuizFallback(quizId),
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
            quiz: readLocalQuizFallback(quizId),
            hasLoaded: true,
            error: "",
            source: "localStorage",
          });
        } catch {
          setState({
            quiz: null,
            hasLoaded: true,
            error: "Unable to load this quiz from Supabase or localStorage.",
            source: null,
          });
        }
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadQuiz();
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [quizId]);

  return state;
}
