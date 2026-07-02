"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/app/_components/empty-state";
import { StatusBadge } from "@/app/_components/status-badge";
import { StudentGuard } from "@/app/student/_components/student-guard";
import { getQuizAvailabilityStatus } from "@/lib/quiz-availability";
import { clearStoredStudent, formatDateTime } from "@/lib/quiz-storage";
import { useStudentAttempts } from "@/lib/use-student-attempts";
import { useSupabaseQuizzes } from "@/lib/use-supabase-quizzes";
import { useStoredStudentIdentity } from "@/lib/use-local-identity";

const studentCards = [
  {
    title: "Available Quizzes",
    description: "See active weekly subject quizzes published by faculty.",
    accent: "bg-emerald-500",
  },
  {
    title: "Attempted Quizzes",
    description: "Track quizzes you have already submitted from this browser.",
    accent: "bg-sky-500",
  },
  {
    title: "Result",
    description: "Open completed attempts and review score, time, and status.",
    accent: "bg-amber-500",
  },
];

function StudentDashboardContent() {
  const router = useRouter();
  const { quizzes, hasLoaded, error, source } = useSupabaseQuizzes();
  const { student, hasLoaded: hasLoadedStudent } = useStoredStudentIdentity();
  const {
    attemptsByQuizId,
    hasLoaded: hasLoadedAttempts,
    source: attemptsSource,
  } = useStudentAttempts(student?.rollNumber);

  function handleLogout() {
    clearStoredStudent();
    router.push("/student/login");
  }

  return (
    <main className="min-h-dvh bg-[#f6f7fb] px-6 py-10 text-[#17202a] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-3 border-b border-[#dfe5ec] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#64748b]">
              QuizGuard - Electrical Department, UIT RGPV Bhopal
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#101828]">
              Electrical Department Student Panel
            </h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[#64748b]">
            Internal panel for weekly quiz availability, attempt history, and
            result status.
          </p>
        </header>

        <section className="mt-8 flex flex-col gap-4 rounded-lg border border-[#dfe5ec] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#101828]">
              Welcome,{" "}
              {hasLoadedStudent && student ? student.name : "Student"}
            </h2>
            <div className="mt-2 flex flex-col gap-1 text-sm text-[#64748b] sm:flex-row sm:gap-4">
              <span>
                Roll Number:{" "}
                {hasLoadedStudent && student ? student.rollNumber : "Not Added"}
              </span>
              <span>
                Semester:{" "}
                {hasLoadedStudent && student ? student.semester : "Not Added"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#cbd5e1] bg-white px-5 text-sm font-semibold text-[#17202a] transition hover:border-[#94a3b8] hover:bg-[#f8fafc]"
          >
            Logout
          </button>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {studentCards.map((card) => (
            <article
              key={card.title}
              className="rounded-lg border border-[#dfe5ec] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`mb-5 h-2 w-12 rounded-full ${card.accent}`} />
              <h2 className="text-lg font-semibold text-[#101828]">
                {card.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#64748b]">
                {card.description}
              </p>
            </article>
          ))}
        </section>

        <section
          id="available-quizzes"
          className="mt-8 rounded-lg border border-[#dfe5ec] bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="border-b border-[#e5eaf0] pb-5">
            <h2 className="text-xl font-semibold text-[#101828]">
              Available Quizzes
            </h2>
            <p className="mt-2 text-sm text-[#64748b]">
              Weekly assessments published for Electrical Department students.
            </p>
          </div>

          {source === "localStorage" ? (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              Showing locally stored quizzes because Supabase fetch failed.
            </div>
          ) : null}

          {attemptsSource === "localStorage" ? (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              Showing locally stored attempt status because Supabase fetch
              failed.
            </div>
          ) : null}

          {!hasLoaded ? (
            <div className="mt-5 rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-6 text-sm text-[#64748b]">
              Loading available quizzes...
            </div>
          ) : error ? (
            <div className="mt-5 rounded-lg border border-[#fecaca] bg-[#fff1f2] p-6 text-sm font-medium text-[#b42318]">
              {error}
            </div>
          ) : quizzes.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="No available quizzes"
                description="No weekly Electrical Department quizzes are available right now. Active quizzes will appear here during their scheduled time window."
              />
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              {quizzes.map((quiz) => {
                const availabilityStatus = getQuizAvailabilityStatus(quiz);
                const attempt = attemptsByQuizId[quiz.id];
                const canCheckAttempt =
                  !hasLoadedStudent || student?.rollNumber
                    ? hasLoadedAttempts
                    : true;

                return (
                  <article
                    key={quiz.id}
                    className="rounded-lg border border-[#dfe5ec] bg-[#fbfcfe] p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-[#101828]">
                            {quiz.title}
                          </h3>
                          <StatusBadge status={availabilityStatus} />
                          {attempt ? (
                            <StatusBadge status="Attempted" />
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-[#64748b]">
                          {quiz.subjectName} - {quiz.semester}
                        </p>
                      </div>

                      {attempt ? (
                        <Link
                          href={`/student/quiz/${quiz.id}/result?attemptId=${attempt.attemptId}`}
                          className="inline-flex h-11 items-center justify-center rounded-lg bg-[#101828] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#253044]"
                        >
                          View Result
                        </Link>
                      ) : !canCheckAttempt ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex h-11 items-center justify-center rounded-lg border border-[#cbd5e1] bg-[#f8fafc] px-5 text-sm font-semibold text-[#64748b]"
                        >
                          Checking Attempt
                        </button>
                      ) : availabilityStatus === "Active" ? (
                        <Link
                          href={`/student/quiz/${quiz.id}`}
                          className="inline-flex h-11 items-center justify-center rounded-lg bg-[#101828] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#253044]"
                        >
                          View Quiz
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex h-11 items-center justify-center rounded-lg border border-[#cbd5e1] bg-[#f8fafc] px-5 text-sm font-semibold text-[#64748b]"
                        >
                          {availabilityStatus === "Upcoming"
                            ? "Not Started Yet"
                            : "Quiz Closed"}
                        </button>
                      )}
                    </div>

                    <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <dt className="font-medium text-[#64748b]">Duration</dt>
                        <dd className="mt-1 text-[#17202a]">
                          {quiz.durationMinutes} minutes
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-[#64748b]">
                          Questions
                        </dt>
                        <dd className="mt-1 text-[#17202a]">
                          {quiz.questions.length}
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
                    </dl>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function StudentDashboardPage() {
  return (
    <StudentGuard>
      <StudentDashboardContent />
    </StudentGuard>
  );
}
