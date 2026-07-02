"use client";

import { useEffect, useState } from "react";
import {
  quizStoreEventName,
  readStoredQuizzes,
} from "@/lib/quiz-storage";
import type { Quiz } from "@/types/quiz";

type StoredQuizzesState = {
  quizzes: Quiz[];
  hasLoaded: boolean;
};

function getSortedStoredQuizzes() {
  return readStoredQuizzes().sort(
    (firstQuiz, secondQuiz) => secondQuiz.id - firstQuiz.id,
  );
}

export function useStoredQuizzes() {
  const [state, setState] = useState<StoredQuizzesState>({
    quizzes: [],
    hasLoaded: false,
  });

  useEffect(() => {
    let isActive = true;

    function loadQuizzes() {
      if (!isActive) {
        return;
      }

      setState({
        quizzes: getSortedStoredQuizzes(),
        hasLoaded: true,
      });
    }

    const timeoutId = window.setTimeout(loadQuizzes, 0);
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
