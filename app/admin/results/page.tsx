"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { EmptyState } from "@/app/_components/empty-state";
import { StatusBadge } from "@/app/_components/status-badge";
import { AdminGuard } from "@/app/admin/_components/admin-guard";
import { formatDateTime, formatSeconds } from "@/lib/quiz-storage";
import { useSupabaseAttempts } from "@/lib/use-supabase-attempts";
import type { AttemptStatus, QuizAttempt } from "@/types/quiz";

const allQuizTitles = "All Quizzes";
const allStatuses = "All";
const statusOptions: Array<AttemptStatus | typeof allStatuses> = [
  allStatuses,
  "Normal",
  "Warning",
  "Suspicious",
];

function getStudentName(attempt: QuizAttempt) {
  return attempt.studentName?.trim() || "Demo Student";
}

function getRollNumber(attempt: QuizAttempt) {
  return attempt.rollNumber?.trim() || "Not Added";
}

function buildExportRows(attempts: QuizAttempt[]) {
  return attempts.map((attempt) => ({
    "Student Name": getStudentName(attempt),
    "Enrollment/Roll Number": getRollNumber(attempt),
    "Quiz Title": attempt.quizTitle,
    Subject: attempt.subject,
    Semester: attempt.semester,
    Score: attempt.score,
    "Total Marks": attempt.totalMarks,
    "Correct Answers": attempt.correctCount,
    "Wrong Answers": attempt.wrongCount,
    "Unanswered Questions": attempt.unansweredCount,
    "Time Taken": formatSeconds(attempt.timeTakenSeconds),
    "Tab Switch Count": attempt.tabSwitchCount,
    Status: attempt.status,
    "Submitted At": formatDateTime(attempt.submittedAt),
  }));
}

function AdminResultsContent() {
  const { attempts, hasLoaded, isLocalFallback, error } =
    useSupabaseAttempts();
  const [quizTitleFilter, setQuizTitleFilter] = useState(allQuizTitles);
  const [statusFilter, setStatusFilter] = useState<
    AttemptStatus | typeof allStatuses
  >(allStatuses);

  const quizTitleOptions = useMemo(
    () =>
      Array.from(new Set(attempts.map((attempt) => attempt.quizTitle))).sort(),
    [attempts],
  );

  const summary = useMemo(
    () => ({
      total: attempts.length,
      normal: attempts.filter((attempt) => attempt.status === "Normal").length,
      warning: attempts.filter((attempt) => attempt.status === "Warning").length,
      suspicious: attempts.filter((attempt) => attempt.status === "Suspicious")
        .length,
    }),
    [attempts],
  );

  const filteredAttempts = useMemo(
    () =>
      attempts.filter((attempt) => {
        const matchesQuiz =
          quizTitleFilter === allQuizTitles ||
          attempt.quizTitle === quizTitleFilter;
        const matchesStatus =
          statusFilter === allStatuses || attempt.status === statusFilter;

        return matchesQuiz && matchesStatus;
      }),
    [attempts, quizTitleFilter, statusFilter],
  );

  function downloadExcelResultSheet() {
    const worksheet = XLSX.utils.json_to_sheet(buildExportRows(filteredAttempts));
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(
      workbook,
      "QuizGuard_Electrical_Department_Results.xlsx",
    );
  }

  return (
    <main className="min-h-dvh bg-[#f6f7fb] px-6 py-10 text-[#17202a] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-[#dfe5ec] pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[#64748b]">
              QuizGuard - Electrical Department, UIT RGPV Bhopal
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#101828]">
              Electrical Department Quiz Results
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748b]">
              Review submitted weekly quiz attempts and export filtered
              department result sheets.
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#cbd5e1] bg-white px-5 text-sm font-semibold text-[#17202a] transition hover:border-[#94a3b8] hover:bg-[#f8fafc]"
          >
            Back to Dashboard
          </Link>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-lg border border-[#dfe5ec] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#64748b]">
              Total Attempts
            </p>
            <p className="mt-2 text-3xl font-bold text-[#101828]">
              {hasLoaded ? summary.total : "-"}
            </p>
          </article>
          <article className="rounded-lg border border-[#dfe5ec] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#64748b]">
              Normal Attempts
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {hasLoaded ? summary.normal : "-"}
            </p>
          </article>
          <article className="rounded-lg border border-[#dfe5ec] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#64748b]">
              Warning Attempts
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-700">
              {hasLoaded ? summary.warning : "-"}
            </p>
          </article>
          <article className="rounded-lg border border-[#dfe5ec] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#64748b]">
              Suspicious Attempts
            </p>
            <p className="mt-2 text-3xl font-bold text-[#b42318]">
              {hasLoaded ? summary.suspicious : "-"}
            </p>
          </article>
        </section>

        <section className="mt-8 rounded-lg border border-[#dfe5ec] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 border-b border-[#e5eaf0] pb-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#101828]">
                Submitted Results
              </h2>
              <p className="mt-2 text-sm text-[#64748b]">
                Filter by quiz and status before downloading the Excel result
                sheet.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[220px_180px_auto]">
              <label className="block">
                <span className="text-sm font-medium text-[#334155]">
                  Filter by quiz title
                </span>
                <select
                  value={quizTitleFilter}
                  onChange={(event) => setQuizTitleFilter(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm outline-none transition focus:border-[#101828] focus:ring-4 focus:ring-[#101828]/10"
                >
                  <option value={allQuizTitles}>{allQuizTitles}</option>
                  {quizTitleOptions.map((quizTitle) => (
                    <option key={quizTitle} value={quizTitle}>
                      {quizTitle}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#334155]">
                  Filter by status
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as AttemptStatus | typeof allStatuses,
                    )
                  }
                  className="mt-2 h-11 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm outline-none transition focus:border-[#101828] focus:ring-4 focus:ring-[#101828]/10"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={downloadExcelResultSheet}
                disabled={filteredAttempts.length === 0}
                className="inline-flex h-11 items-center justify-center self-end rounded-lg bg-[#101828] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#253044] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 xl:col-span-1"
              >
                Download Excel Result Sheet
              </button>
            </div>
          </div>

          {isLocalFallback ? (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              Showing locally stored results because Supabase fetch failed.
            </div>
          ) : null}

          {!hasLoaded ? (
            <div className="mt-5 rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-6 text-sm text-[#64748b]">
              Loading submitted attempts...
            </div>
          ) : error ? (
            <div className="mt-5 rounded-lg border border-[#fecaca] bg-[#fff1f2] p-6 text-sm font-medium text-[#b42318]">
              {error}
            </div>
          ) : attempts.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="No attempts submitted"
                description="No quiz attempts have been submitted yet. Student results will appear here after the first completed weekly assessment."
              />
            </div>
          ) : filteredAttempts.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="No results found"
                description="No submitted attempts match the selected quiz or status filters. Adjust the filters to view more department results."
              />
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-[1280px] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="bg-[#f8fafc] text-xs uppercase text-[#64748b]">
                    {[
                      "Student Name",
                      "Enrollment/Roll Number",
                      "Quiz Title",
                      "Subject",
                      "Semester",
                      "Score",
                      "Total Marks",
                      "Correct",
                      "Wrong",
                      "Unanswered",
                      "Time Taken",
                      "Tab Switch Count",
                      "Status",
                      "Submitted At",
                    ].map((column) => (
                      <th
                        key={column}
                        className="border-b border-[#dfe5ec] px-3 py-3 font-semibold"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAttempts.map((attempt) => (
                    <tr key={attempt.attemptId} className="align-top">
                      <td className="border-b border-[#eef2f6] px-3 py-4 font-medium text-[#101828]">
                        {getStudentName(attempt)}
                      </td>
                      <td className="border-b border-[#eef2f6] px-3 py-4">
                        {getRollNumber(attempt)}
                      </td>
                      <td className="border-b border-[#eef2f6] px-3 py-4">
                        {attempt.quizTitle}
                      </td>
                      <td className="border-b border-[#eef2f6] px-3 py-4">
                        {attempt.subject}
                      </td>
                      <td className="border-b border-[#eef2f6] px-3 py-4">
                        {attempt.semester}
                      </td>
                      <td className="border-b border-[#eef2f6] px-3 py-4 font-semibold">
                        {attempt.score}
                      </td>
                      <td className="border-b border-[#eef2f6] px-3 py-4">
                        {attempt.totalMarks}
                      </td>
                      <td className="border-b border-[#eef2f6] px-3 py-4">
                        {attempt.correctCount}
                      </td>
                      <td className="border-b border-[#eef2f6] px-3 py-4">
                        {attempt.wrongCount}
                      </td>
                      <td className="border-b border-[#eef2f6] px-3 py-4">
                        {attempt.unansweredCount}
                      </td>
                      <td className="border-b border-[#eef2f6] px-3 py-4">
                        {formatSeconds(attempt.timeTakenSeconds)}
                      </td>
                      <td className="border-b border-[#eef2f6] px-3 py-4">
                        {attempt.tabSwitchCount}
                      </td>
                      <td className="border-b border-[#eef2f6] px-3 py-4">
                        <StatusBadge status={attempt.status} />
                      </td>
                      <td className="border-b border-[#eef2f6] px-3 py-4">
                        {formatDateTime(attempt.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function AdminResultsPage() {
  return (
    <AdminGuard>
      <AdminResultsContent />
    </AdminGuard>
  );
}
