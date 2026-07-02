"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminGuard } from "@/app/admin/_components/admin-guard";
import {
  AdminQuizForm,
  type QuizFormValues,
} from "@/app/admin/_components/admin-quiz-form";
import { readStoredQuizzes, saveStoredQuizzes } from "@/lib/quiz-storage";
import { supabase } from "@/src/lib/supabase";
import type { Quiz } from "@/types/quiz";

function CreateQuizContent() {
  const router = useRouter();
  const [success, setSuccess] = useState("");
  const [warning, setWarning] = useState("");

  async function saveQuiz(values: QuizFormValues) {
    setSuccess("");
    setWarning("");

    const quiz: Quiz = {
      id: Date.now(),
      ...values,
      createdAt: new Date().toISOString(),
    };

    saveStoredQuizzes([...readStoredQuizzes(), quiz]);

    if (!supabase) {
      console.error("Supabase quiz insert failed", {
        message: "Supabase client is not configured.",
      });
      setWarning("Quiz saved locally, but Supabase save failed.");
      return;
    }

    try {
      const { error } = await supabase.from("quizzes").insert({
        id: String(quiz.id),
        title: quiz.title,
        subject: quiz.subjectName,
        semester: quiz.semester,
        duration_minutes: quiz.durationMinutes,
        max_tab_switches: quiz.maxTabSwitches,
        start_at: quiz.startDateTime,
        end_at: quiz.endDateTime,
        questions: quiz.questions,
        created_at: quiz.createdAt,
      });

      if (error) {
        console.error("Supabase quiz insert failed", error);
        setWarning("Quiz saved locally, but Supabase save failed.");
        return;
      }
    } catch (error) {
      console.error("Supabase quiz insert failed", error);
      setWarning("Quiz saved locally, but Supabase save failed.");
      return;
    }

    setSuccess("Quiz saved successfully.");
    window.setTimeout(() => {
      router.push("/admin/dashboard");
    }, 900);
  }

  return (
    <AdminQuizForm
      heading="Create Weekly Quiz"
      description="Prepare an internal MCQ assessment with timing and tab-switch limits for department students."
      backHref="/admin/dashboard"
      cancelHref="/admin/dashboard"
      submitLabel="Save Quiz"
      success={success}
      warning={warning}
      onSave={saveQuiz}
    />
  );
}

export default function CreateQuizPage() {
  return (
    <AdminGuard>
      <CreateQuizContent />
    </AdminGuard>
  );
}
