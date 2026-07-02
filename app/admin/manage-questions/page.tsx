"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/app/_components/empty-state";
import { QuestionImage } from "@/app/_components/question-image";
import { AdminGuard } from "@/app/admin/_components/admin-guard";
import {
  formatDateTime,
  getTotalMarks,
  readStoredQuizzes,
  saveStoredQuizzes,
} from "@/lib/quiz-storage";
import { deleteSupabaseQuiz } from "@/lib/supabase-quizzes";
import { useSupabaseQuizzes } from "@/lib/use-supabase-quizzes";
import type { Quiz } from "@/types/quiz";

function ManageQuestionsContent() {
  const { quizzes, hasLoaded, error, source } = useSupabaseQuizzes();
  const [visibleQuizzes, setVisibleQuizzes] = useState<Quiz[]>([]);
  const [expandedQuizIds, setExpandedQuizIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [deleteError, setDeleteError] = useState("");
  const [deletingQuizId, setDeletingQuizId] = useState<number | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setVisibleQuizzes(quizzes);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [quizzes]);

  function toggleQuestions(quizId: number) {
    setExpandedQuizIds((current) => {
      const nextExpandedQuizIds = new Set(current);

      if (nextExpandedQuizIds.has(quizId)) {
        nextExpandedQuizIds.delete(quizId);
      } else {
        nextExpandedQuizIds.add(quizId);
      }

      return nextExpandedQuizIds;
    });
  }

  async function deleteQuiz(quizId: number) {
    const quiz = visibleQuizzes.find((currentQuiz) => currentQuiz.id === quizId);
    const shouldDelete = window.confirm(
      `Delete "${quiz?.title || "this quiz"}"? This cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    setDeleteError("");
    setDeletingQuizId(quizId);

    try {
      const result = await deleteSupabaseQuiz(quizId);

      if (result.error) {
        setDeleteError(`Supabase delete failed: ${result.error}`);
        return;
      }
    } catch (error) {
      setDeleteError(
        `Supabase delete failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      return;
    } finally {
      setDeletingQuizId(null);
    }

    saveStoredQuizzes(
      readStoredQuizzes().filter((storedQuiz) => storedQuiz.id !== quizId),
    );
    setVisibleQuizzes((currentQuizzes) =>
      currentQuizzes.filter((currentQuiz) => currentQuiz.id !== quizId),
    );

    setExpandedQuizIds((current) => {
      const nextExpandedQuizIds = new Set(current);
      nextExpandedQuizIds.delete(quizId);
      return nextExpandedQuizIds;
    });
  }

  return (
    <main className="min-h-dvh bg-[#f6f7fb] px-6 py-10 text-[#17202a] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-[#dfe5ec] pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[#64748b]">
              Electrical Department, UIT RGPV Bhopal
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#101828]">
              Manage Quizzes and Questions
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748b]">
              Review, edit, and remove weekly department quiz papers stored on
              this device.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin/create-quiz"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#101828] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#253044]"
            >
              Create Quiz
            </Link>
            <Link
              href="/admin/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[#cbd5e1] bg-white px-5 text-sm font-semibold text-[#17202a] transition hover:border-[#94a3b8] hover:bg-[#f8fafc]"
            >
              Back to Dashboard
            </Link>
          </div>
        </header>

        {source === "localStorage" ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            Showing locally stored quizzes because Supabase fetch failed.
          </div>
        ) : null}

        {deleteError ? (
          <div className="mt-6 rounded-lg border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm font-medium text-[#b42318]">
            {deleteError}
          </div>
        ) : null}

        {!hasLoaded ? (
          <div className="mt-8 rounded-lg border border-dashed border-[#cbd5e1] bg-white p-6 text-sm text-[#64748b] shadow-sm">
            Loading quizzes...
          </div>
        ) : error ? (
          <div className="mt-8 rounded-lg border border-[#fecaca] bg-[#fff1f2] p-6 text-sm font-medium text-[#b42318] shadow-sm">
            {error}
          </div>
        ) : visibleQuizzes.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="No quizzes created yet"
              description="Create a weekly subject quiz first, then return here to manage questions, edit details, or delete old drafts."
              action={
                <Link
                  href="/admin/create-quiz"
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-[#101828] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#253044]"
                >
                  Create Quiz
                </Link>
              }
            />
          </div>
        ) : (
          <section className="mt-8 grid gap-5">
            {visibleQuizzes.map((quiz) => {
              const isExpanded = expandedQuizIds.has(quiz.id);
              const isDeleting = deletingQuizId === quiz.id;

              return (
                <article
                  key={quiz.id}
                  className="rounded-lg border border-[#dfe5ec] bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-[#101828]">
                        {quiz.title}
                      </h2>
                      <p className="mt-2 text-sm text-[#64748b]">
                        {quiz.subjectName} - {quiz.semester}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => toggleQuestions(quiz.id)}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-[#cbd5e1] bg-white px-4 text-sm font-semibold text-[#17202a] transition hover:border-[#94a3b8] hover:bg-[#f8fafc]"
                      >
                        {isExpanded ? "Hide Questions" : "View Questions"}
                      </button>
                      <Link
                        href={`/admin/edit-quiz/${quiz.id}`}
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-[#101828] px-4 text-sm font-semibold text-white transition hover:bg-[#253044]"
                      >
                        Edit Quiz
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          void deleteQuiz(quiz.id);
                        }}
                        disabled={isDeleting}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-[#fecaca] bg-white px-4 text-sm font-semibold text-[#b42318] transition hover:bg-[#fff1f2] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDeleting ? "Deleting..." : "Delete Quiz"}
                      </button>
                    </div>
                  </div>

                  <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="font-medium text-[#64748b]">Subject</dt>
                      <dd className="mt-1 text-[#17202a]">
                        {quiz.subjectName}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-[#64748b]">Semester</dt>
                      <dd className="mt-1 text-[#17202a]">{quiz.semester}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-[#64748b]">Duration</dt>
                      <dd className="mt-1 text-[#17202a]">
                        {quiz.durationMinutes} minutes
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-[#64748b]">Questions</dt>
                      <dd className="mt-1 text-[#17202a]">
                        {quiz.questions.length}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-[#64748b]">
                        Total marks
                      </dt>
                      <dd className="mt-1 text-[#17202a]">
                        {getTotalMarks(quiz)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-[#64748b]">
                        Start date/time
                      </dt>
                      <dd className="mt-1 text-[#17202a]">
                        {formatDateTime(quiz.startDateTime)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-[#64748b]">
                        End date/time
                      </dt>
                      <dd className="mt-1 text-[#17202a]">
                        {formatDateTime(quiz.endDateTime)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-[#64748b]">
                        Max tab switches
                      </dt>
                      <dd className="mt-1 text-[#17202a]">
                        {quiz.maxTabSwitches ?? 3}
                      </dd>
                    </div>
                  </dl>

                  {isExpanded ? (
                    <div className="mt-6 border-t border-[#e5eaf0] pt-5">
                      <h3 className="text-base font-semibold text-[#101828]">
                        Questions
                      </h3>

                      {quiz.questions.length === 0 ? (
                        <p className="mt-4 rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-sm text-[#64748b]">
                          No questions are attached to this quiz.
                        </p>
                      ) : (
                        <div className="mt-4 divide-y divide-[#e5eaf0] rounded-lg border border-[#e5eaf0]">
                          {quiz.questions.map((question, questionIndex) => (
                            <div
                              key={question.id}
                              className="bg-[#fbfcfe] p-4 first:rounded-t-lg last:rounded-b-lg"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <p className="font-semibold text-[#101828]">
                                  {questionIndex + 1}. {question.text}
                                </p>
                                <span className="inline-flex w-fit rounded-full bg-[#eef2f6] px-3 py-1 text-xs font-semibold text-[#334155]">
                                  {question.marks} marks
                                </span>
                              </div>

                              {question.imageUrl ? (
                                <div className="mt-4 rounded-lg border border-[#dfe5ec] bg-white p-3">
                                  <QuestionImage
                                    src={question.imageUrl}
                                    alt="Question diagram"
                                    className="mx-auto max-h-80 w-full max-w-3xl rounded-lg object-contain"
                                  />
                                </div>
                              ) : null}

                              <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                                <div>
                                  <dt className="font-medium text-[#64748b]">
                                    Option A
                                  </dt>
                                  <dd className="mt-1 text-[#17202a]">
                                    {question.optionA}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="font-medium text-[#64748b]">
                                    Option B
                                  </dt>
                                  <dd className="mt-1 text-[#17202a]">
                                    {question.optionB}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="font-medium text-[#64748b]">
                                    Option C
                                  </dt>
                                  <dd className="mt-1 text-[#17202a]">
                                    {question.optionC}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="font-medium text-[#64748b]">
                                    Option D
                                  </dt>
                                  <dd className="mt-1 text-[#17202a]">
                                    {question.optionD}
                                  </dd>
                                </div>
                                <div className="md:col-span-2">
                                  <dt className="font-medium text-[#64748b]">
                                    Correct option
                                  </dt>
                                  <dd className="mt-1 font-semibold text-[#101828]">
                                    {question.correctOption}
                                  </dd>
                                </div>
                              </dl>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

export default function ManageQuestionsPage() {
  return (
    <AdminGuard>
      <ManageQuestionsContent />
    </AdminGuard>
  );
}
