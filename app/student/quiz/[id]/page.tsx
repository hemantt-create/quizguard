"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { StatusBadge } from "@/app/_components/status-badge";
import { StudentGuard } from "@/app/student/_components/student-guard";
import { getQuizAvailabilityStatus } from "@/lib/quiz-availability";
import {
  formatDateTime,
  getTotalMarks,
} from "@/lib/quiz-storage";
import { useStoredStudentIdentity } from "@/lib/use-local-identity";
import { useStudentQuizAttempt } from "@/lib/use-student-attempts";
import { useSupabaseQuiz } from "@/lib/use-supabase-quizzes";

function StudentQuizDetailsContent() {
  const params = useParams<{ id: string }>();
  const quizId = useMemo(() => Number(params.id), [params.id]);
  const { quiz, hasLoaded, error } = useSupabaseQuiz(quizId);
  const { student, hasLoaded: hasLoadedStudent } = useStoredStudentIdentity();
  const {
    attempt,
    hasLoaded: hasLoadedAttempt,
    source: attemptSource,
  } = useStudentQuizAttempt(quizId, student?.rollNumber);
  const availabilityStatus = quiz
    ? getQuizAvailabilityStatus(quiz)
    : "Closed";
  const canCheckAttempt =
    !hasLoadedStudent || student?.rollNumber ? hasLoadedAttempt : true;

  return (
    <main className="min-h-dvh bg-[#f6f7fb] px-6 py-8 text-[#17202a] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-5 border-b border-[#dfe5ec] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#64748b]">
              QuizGuard - Electrical Department, UIT RGPV Bhopal
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#101828]">
              Quiz Details
            </h1>
          </div>
          <Link
            href="/student/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#cbd5e1] bg-white px-5 text-sm font-semibold text-[#17202a] transition hover:border-[#94a3b8] hover:bg-[#f8fafc]"
          >
            Back to Dashboard
          </Link>
        </header>

        {!hasLoaded ? (
          <section className="mt-8 rounded-lg border border-dashed border-[#cbd5e1] bg-white p-6 text-sm text-[#64748b] shadow-sm">
            Loading quiz details...
          </section>
        ) : error ? (
          <section className="mt-8 rounded-lg border border-[#fecaca] bg-[#fff1f2] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#b42318]">
              Unable to load quiz
            </h2>
            <p className="mt-2 text-sm font-medium text-[#b42318]">
              {error}
            </p>
          </section>
        ) : !quiz ? (
          <section className="mt-8 rounded-lg border border-dashed border-[#cbd5e1] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#101828]">
              Quiz not found
            </h2>
            <p className="mt-2 text-sm text-[#64748b]">
              This quiz may have been removed from this browser.
            </p>
          </section>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="rounded-lg border border-[#dfe5ec] bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-2xl font-bold text-[#101828]">
                {quiz.title}
              </h2>
              <p className="mt-2 text-sm text-[#64748b]">
                {quiz.subjectName} - {quiz.semester}
              </p>

              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-[#f8fafc] p-4">
                  <dt className="text-sm font-medium text-[#64748b]">
                    Subject
                  </dt>
                  <dd className="mt-1 font-semibold text-[#17202a]">
                    {quiz.subjectName}
                  </dd>
                </div>
                <div className="rounded-lg bg-[#f8fafc] p-4">
                  <dt className="text-sm font-medium text-[#64748b]">
                    Semester
                  </dt>
                  <dd className="mt-1 font-semibold text-[#17202a]">
                    {quiz.semester}
                  </dd>
                </div>
                <div className="rounded-lg bg-[#f8fafc] p-4">
                  <dt className="text-sm font-medium text-[#64748b]">
                    Duration
                  </dt>
                  <dd className="mt-1 font-semibold text-[#17202a]">
                    {quiz.durationMinutes} minutes
                  </dd>
                </div>
                <div className="rounded-lg bg-[#f8fafc] p-4">
                  <dt className="text-sm font-medium text-[#64748b]">
                    Total questions
                  </dt>
                  <dd className="mt-1 font-semibold text-[#17202a]">
                    {quiz.questions.length}
                  </dd>
                </div>
                <div className="rounded-lg bg-[#f8fafc] p-4">
                  <dt className="text-sm font-medium text-[#64748b]">
                    Total marks
                  </dt>
                  <dd className="mt-1 font-semibold text-[#17202a]">
                    {getTotalMarks(quiz)}
                  </dd>
                </div>
                <div className="rounded-lg bg-[#f8fafc] p-4">
                  <dt className="text-sm font-medium text-[#64748b]">
                    Max allowed tab switches
                  </dt>
                  <dd className="mt-1 font-semibold text-[#17202a]">
                    {quiz.maxTabSwitches}
                  </dd>
                </div>
                <div className="rounded-lg bg-[#f8fafc] p-4">
                  <dt className="text-sm font-medium text-[#64748b]">
                    Start date/time
                  </dt>
                  <dd className="mt-1 font-semibold text-[#17202a]">
                    {formatDateTime(quiz.startDateTime)}
                  </dd>
                </div>
                <div className="rounded-lg bg-[#f8fafc] p-4">
                  <dt className="text-sm font-medium text-[#64748b]">
                    End date/time
                  </dt>
                  <dd className="mt-1 font-semibold text-[#17202a]">
                    {formatDateTime(quiz.endDateTime)}
                  </dd>
                </div>
              </dl>
            </section>

            <aside className="rounded-lg border border-[#dfe5ec] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-[#101828]">
                  Instructions
                </h2>
                <StatusBadge status={availabilityStatus} />
                {attempt ? (
                  <StatusBadge status="Attempted" />
                ) : null}
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#475569]">
                <li>Do not switch tabs during the quiz.</li>
                <li>Quiz may auto-submit after suspicious activity.</li>
                <li>Timer will start after clicking Start Quiz.</li>
              </ul>

              {attemptSource === "localStorage" ? (
                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                  Showing locally stored attempt status because Supabase fetch
                  failed.
                </div>
              ) : null}

              {attempt ? (
                <>
                  <p className="mt-5 rounded-lg border border-[#dfe5ec] bg-[#f8fafc] px-4 py-3 text-sm font-medium text-[#334155]">
                    You have already attempted this quiz.
                  </p>
                  <Link
                    href={`/student/quiz/${quiz.id}/result?attemptId=${attempt.attemptId}`}
                    className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#101828] px-6 text-base font-semibold text-white shadow-sm transition hover:bg-[#253044]"
                  >
                    View Result
                  </Link>
                </>
              ) : !canCheckAttempt ? (
                <button
                  type="button"
                  disabled
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-lg border border-[#cbd5e1] bg-[#f8fafc] px-6 text-base font-semibold text-[#64748b]"
                >
                  Checking Attempt
                </button>
              ) : availabilityStatus === "Upcoming" ? (
                <p className="mt-5 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700">
                  This quiz has not started yet.
                </p>
              ) : availabilityStatus === "Closed" ? (
                <p className="mt-5 rounded-lg border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm font-medium text-[#b42318]">
                  This quiz is closed.
                </p>
              ) : (
                <Link
                  href={`/student/quiz/${quiz.id}/attempt`}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#101828] px-6 text-base font-semibold text-white shadow-sm transition hover:bg-[#253044]"
                >
                  Start Quiz
                </Link>
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

export default function StudentQuizDetailsPage() {
  return (
    <StudentGuard>
      <StudentQuizDetailsContent />
    </StudentGuard>
  );
}
