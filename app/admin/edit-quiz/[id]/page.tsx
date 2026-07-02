"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AdminQuizForm,
  type QuizFormValues,
} from "@/app/admin/_components/admin-quiz-form";
import { AdminGuard } from "@/app/admin/_components/admin-guard";
import { readStoredQuizzes, saveStoredQuizzes } from "@/lib/quiz-storage";
import { updateSupabaseQuiz } from "@/lib/supabase-quizzes";
import { useSupabaseQuiz } from "@/lib/use-supabase-quizzes";
import type { Quiz } from "@/types/quiz";

function EditQuizContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const quizId = useMemo(() => Number(params.id), [params.id]);
  const { quiz, hasLoaded, error, source } = useSupabaseQuiz(quizId);
  const [success, setSuccess] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function saveChanges(values: QuizFormValues) {
    if (!quiz) {
      return;
    }

    if (isSaving) {
      return;
    }

    setSuccess("");
    setSaveError("");
    setIsSaving(true);

    const updatedQuiz: Quiz = {
      ...quiz,
      ...values,
    };

    try {
      const result = await updateSupabaseQuiz(updatedQuiz);

      if (result.error) {
        setSaveError(`Supabase update failed: ${result.error}`);
        return;
      }
    } catch (error) {
      setSaveError(
        `Supabase update failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      return;
    } finally {
      setIsSaving(false);
    }


    const storedQuizzes = readStoredQuizzes();
    const hasStoredQuiz = storedQuizzes.some(
      (storedQuiz) => storedQuiz.id === quiz.id,
    );

    if (hasStoredQuiz) {
      saveStoredQuizzes(
        storedQuizzes.map((storedQuiz) =>
          storedQuiz.id === quiz.id ? updatedQuiz : storedQuiz,
        ),
      );
    }

    setSuccess("Quiz changes saved for the Electrical Department.");
    window.setTimeout(() => {
      router.push("/admin/manage-questions");
    }, 900);
  }

  if (!hasLoaded) {
    return (
      <main className="min-h-dvh bg-[#f6f7fb] px-6 py-10 text-[#17202a] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-white p-6 text-sm text-[#64748b] shadow-sm">
            Loading quiz...
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-dvh bg-[#f6f7fb] px-6 py-10 text-[#17202a] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <section className="rounded-lg border border-[#fecaca] bg-[#fff1f2] p-6 shadow-sm">
            <p className="text-sm font-medium text-[#b42318]">
              QuizGuard - Electrical Department, UIT RGPV Bhopal
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#b42318]">
              Unable to load quiz
            </h1>
            <p className="mt-3 text-sm font-medium text-[#b42318]">
              {error}
            </p>
            <Link
              href="/admin/manage-questions"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[#101828] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#253044]"
            >
              Back to Manage Quizzes
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (!quiz || !Number.isFinite(quizId)) {
    return (
      <main className="min-h-dvh bg-[#f6f7fb] px-6 py-10 text-[#17202a] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <section className="rounded-lg border border-dashed border-[#cbd5e1] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-[#64748b]">
              QuizGuard - Electrical Department, UIT RGPV Bhopal
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#101828]">
              Quiz not found
            </h1>
            <p className="mt-3 text-sm text-[#64748b]">
              The selected quiz is not available in Supabase or localStorage.
            </p>
            <Link
              href="/admin/manage-questions"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[#101828] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#253044]"
            >
              Back to Manage Quizzes
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <AdminQuizForm
      key={quiz.id}
      heading="Edit Weekly Quiz"
      description="Update quiz details, timing, tab-switch limit, and MCQ questions for the department assessment."
      backHref="/admin/manage-questions"
      cancelHref="/admin/manage-questions"
      submitLabel={isSaving ? "Saving..." : "Save Changes"}
      success={success}
      errorMessage={saveError}
      warning={
        source === "localStorage"
          ? "Showing locally stored quiz because Supabase fetch failed or the quiz was not found there."
          : undefined
      }
      initialQuiz={quiz}
      onSave={saveChanges}
    />
  );
}

export default function EditQuizPage() {
  return (
    <AdminGuard>
      <EditQuizContent />
    </AdminGuard>
  );
}
