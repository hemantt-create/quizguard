"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { StatusBadge } from "@/app/_components/status-badge";
import { StudentGuard } from "@/app/student/_components/student-guard";
import { formatSeconds } from "@/lib/quiz-storage";
import { useAttemptResult } from "@/lib/use-student-attempts";

function StudentQuizResultContent() {
  const searchParams = useSearchParams();
  const attemptId = useMemo(
    () => Number(searchParams.get("attemptId")),
    [searchParams],
  );
  const { attempt, hasLoaded, error, source } = useAttemptResult(attemptId);

  return (
    <main className="min-h-dvh bg-[#f6f7fb] px-6 py-10 text-[#17202a] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-3 border-b border-[#dfe5ec] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#64748b]">
              QuizGuard - Electrical Department, UIT RGPV Bhopal
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#101828]">
              Quiz Result
            </h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/student/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[#cbd5e1] bg-white px-5 text-sm font-semibold text-[#17202a] transition hover:border-[#94a3b8] hover:bg-[#f8fafc]"
            >
              Back to Student Dashboard
            </Link>
            <Link
              href="/student/dashboard#available-quizzes"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#101828] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#253044]"
            >
              View Available Quizzes
            </Link>
          </div>
        </header>

        {!hasLoaded ? (
          <section className="mt-8 rounded-lg border border-dashed border-[#cbd5e1] bg-white p-6 text-sm text-[#64748b] shadow-sm">
            Loading quiz result...
          </section>
        ) : error ? (
          <section className="mt-8 rounded-lg border border-[#fecaca] bg-[#fff1f2] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#b42318]">
              Unable to load result
            </h2>
            <p className="mt-2 text-sm font-medium text-[#b42318]">
              {error}
            </p>
          </section>
        ) : !attempt ? (
          <section className="mt-8 rounded-lg border border-dashed border-[#cbd5e1] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#101828]">
              Attempt not found
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">
              This result could not be found in Supabase or this browser.
            </p>
          </section>
        ) : (
          <section className="mt-8 rounded-lg border border-[#dfe5ec] bg-white p-5 shadow-sm sm:p-6">
            {source === "localStorage" ? (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                Showing locally stored result because Supabase fetch failed or
                no Supabase result was found.
              </div>
            ) : null}

            <div className="border-b border-[#e5eaf0] pb-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#101828]">
                    {attempt.quizTitle}
                  </h2>
                  <p className="mt-2 text-sm text-[#64748b]">
                    {attempt.subject} - {attempt.semester}
                  </p>
                </div>
                <StatusBadge status={attempt.status} />
              </div>

              <div className="mt-6 rounded-lg bg-[#101828] p-5 text-white shadow-sm">
                <p className="text-sm font-semibold text-white/70">
                  Final Score
                </p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <p className="text-5xl font-bold leading-none">
                    {attempt.score}
                    <span className="text-2xl text-white/70">
                      /{attempt.totalMarks}
                    </span>
                  </p>
                  <p className="text-sm font-semibold text-white/75">
                    {attempt.totalMarks > 0
                      ? Math.round((attempt.score / attempt.totalMarks) * 100)
                      : 0}
                    % scored
                  </p>
                </div>
              </div>

              <p className="mt-2 text-sm text-[#64748b]">
                Result generated automatically after quiz submission.
              </p>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg bg-[#f8fafc] p-3">
                  <p className="font-medium text-[#64748b]">Student Name</p>
                  <p className="mt-1 font-semibold text-[#101828]">
                    {attempt.studentName || "Unknown Student"}
                  </p>
                </div>
                <div className="rounded-lg bg-[#f8fafc] p-3">
                  <p className="font-medium text-[#64748b]">Roll Number</p>
                  <p className="mt-1 font-semibold text-[#101828]">
                    {attempt.rollNumber || "Not Added"}
                  </p>
                </div>
              </div>
            </div>

            {attempt.status === "Suspicious" ? (
              <div className="mt-6 rounded-lg border border-[#fecaca] bg-[#fff1f2] px-5 py-4 text-sm text-[#b42318]">
                <p className="font-bold">Suspicious Attempt</p>
                <p className="mt-1 font-medium leading-6">
                  This attempt was marked suspicious due to repeated tab/window
                  switching or fullscreen exit.
                </p>
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-[#f8fafc] p-4">
                <p className="text-sm font-medium text-[#64748b]">Score</p>
                <p className="mt-1 text-2xl font-bold text-[#101828]">
                  {attempt.score}
                </p>
              </div>
              <div className="rounded-lg bg-[#f8fafc] p-4">
                <p className="text-sm font-medium text-[#64748b]">
                  Total marks
                </p>
                <p className="mt-1 text-2xl font-bold text-[#101828]">
                  {attempt.totalMarks}
                </p>
              </div>
              <div className="rounded-lg bg-[#f8fafc] p-4">
                <p className="text-sm font-medium text-[#64748b]">
                  Correct answers
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">
                  {attempt.correctCount}
                </p>
              </div>
              <div className="rounded-lg bg-[#f8fafc] p-4">
                <p className="text-sm font-medium text-[#64748b]">
                  Wrong answers
                </p>
                <p className="mt-1 text-2xl font-bold text-[#b42318]">
                  {attempt.wrongCount}
                </p>
              </div>
              <div className="rounded-lg bg-[#f8fafc] p-4">
                <p className="text-sm font-medium text-[#64748b]">
                  Unanswered
                </p>
                <p className="mt-1 text-2xl font-bold text-[#101828]">
                  {attempt.unansweredCount}
                </p>
              </div>
              <div className="rounded-lg bg-[#f8fafc] p-4">
                <p className="text-sm font-medium text-[#64748b]">
                  Time taken
                </p>
                <p className="mt-1 text-2xl font-bold text-[#101828]">
                  {formatSeconds(attempt.timeTakenSeconds)}
                </p>
              </div>
              <div className="rounded-lg bg-[#f8fafc] p-4">
                <p className="text-sm font-medium text-[#64748b]">Status</p>
                <div className="mt-2">
                  <StatusBadge status={attempt.status} />
                </div>
              </div>
              <div className="rounded-lg bg-[#f8fafc] p-4">
                <p className="text-sm font-medium text-[#64748b]">
                  Tab switches
                </p>
                <p className="mt-1 text-2xl font-bold text-[#101828]">
                  {attempt.tabSwitchCount}
                </p>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/student/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-[#cbd5e1] bg-white px-5 text-sm font-semibold text-[#17202a] transition hover:border-[#94a3b8] hover:bg-[#f8fafc]"
              >
                Back to Student Dashboard
              </Link>
              <Link
                href="/student/dashboard#available-quizzes"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#101828] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#253044]"
              >
                View Available Quizzes
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default function StudentQuizResultPage() {
  return (
    <StudentGuard>
      <StudentQuizResultContent />
    </StudentGuard>
  );
}
