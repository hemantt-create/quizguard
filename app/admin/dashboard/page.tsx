"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/app/_components/empty-state";
import { AdminGuard } from "@/app/admin/_components/admin-guard";
import { clearStoredAdmin, formatDateTime } from "@/lib/quiz-storage";
import { useSupabaseQuizzes } from "@/lib/use-supabase-quizzes";
import { useStoredAdminIdentity } from "@/lib/use-local-identity";

const adminCards = [
  {
    title: "Create Quiz",
    description: "Prepare a new weekly subject quiz with timing and questions.",
    href: "/admin/create-quiz",
    accent: "bg-emerald-500",
  },
  {
    title: "Manage Questions",
    description: "Review, edit, or delete existing quizzes and MCQ sets.",
    href: "/admin/manage-questions",
    accent: "bg-sky-500",
  },
  {
    title: "View Results",
    description: "Check submitted attempts, scores, and anti-cheat status.",
    href: "/admin/results",
    accent: "bg-amber-500",
  },
  {
    title: "Export Excel",
    description: "Download filtered faculty result sheets for records.",
    href: "/admin/results",
    accent: "bg-rose-500",
  },
];

function AdminDashboardContent() {
  const router = useRouter();
  const { quizzes, hasLoaded, error } = useSupabaseQuizzes();
  const { admin, hasLoaded: hasLoadedAdmin } = useStoredAdminIdentity();

  function handleLogout() {
    clearStoredAdmin();
    router.push("/admin/login");
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
              Electrical Department Quiz Panel
            </h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[#64748b]">
            Internal panel for weekly quiz setup, question management, results,
            and Excel exports.
          </p>
        </header>

        <section className="mt-8 flex flex-col gap-4 rounded-lg border border-[#dfe5ec] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#64748b]">
              Logged-in admin
            </p>
            <p className="mt-1 text-xl font-semibold text-[#101828]">
              {hasLoadedAdmin && admin ? admin.email : "No admin email saved"}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin/database-test"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#101828] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#253044]"
            >
              Database Test
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[#cbd5e1] bg-white px-5 text-sm font-semibold text-[#17202a] transition hover:border-[#94a3b8] hover:bg-[#f8fafc]"
            >
              Logout
            </button>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {adminCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-lg border border-[#dfe5ec] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#a8b4c2] hover:shadow-md"
            >
              <div className={`mb-5 h-2 w-12 rounded-full ${card.accent}`} />
              <h2 className="text-lg font-semibold text-[#101828]">
                {card.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#64748b]">
                {card.description}
              </p>
              <span className="mt-5 inline-flex text-sm font-semibold text-[#101828] transition group-hover:text-[#334155]">
                Open
              </span>
            </Link>
          ))}
        </section>

        <section className="mt-8 rounded-lg border border-[#dfe5ec] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 border-b border-[#e5eaf0] pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[#64748b]">
                Total created quizzes
              </p>
              <p className="mt-1 text-3xl font-bold text-[#101828]">
                {hasLoaded ? quizzes.length : "-"}
              </p>
            </div>
            <Link
              href="/admin/create-quiz"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#101828] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#253044]"
            >
              Create Quiz
            </Link>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold text-[#101828]">
              Recent Created Quizzes
            </h2>

            {!hasLoaded ? (
              <div className="mt-5 rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-6 text-sm text-[#64748b]">
                Loading department quizzes...
              </div>
            ) : error ? (
              <div className="mt-5 rounded-lg border border-[#fecaca] bg-[#fff1f2] p-6 text-sm font-medium text-[#b42318]">
                {error}
              </div>
            ) : quizzes.length === 0 ? (
              <div className="mt-5">
                <EmptyState
                  title="No quizzes created yet"
                  description="Create the first weekly Electrical Department assessment to make it available for students."
                  action={
                    <Link
                      href="/admin/create-quiz"
                      className="inline-flex h-11 items-center justify-center rounded-lg bg-[#101828] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#253044]"
                    >
                      Create First Quiz
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                {quizzes.map((quiz) => (
                  <article
                    key={quiz.id}
                    className="rounded-lg border border-[#dfe5ec] bg-[#fbfcfe] p-5"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[#101828]">
                          {quiz.title}
                        </h3>
                        <p className="mt-1 text-sm text-[#64748b]">
                          {quiz.subjectName} - {quiz.semester}
                        </p>
                      </div>
                      <span className="inline-flex w-fit rounded-full bg-[#eef2f6] px-3 py-1 text-sm font-medium text-[#334155]">
                        {quiz.questions.length} questions
                      </span>
                    </div>

                    <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <dt className="font-medium text-[#64748b]">
                          Duration
                        </dt>
                        <dd className="mt-1 text-[#17202a]">
                          {quiz.durationMinutes} minutes
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
                          Semester
                        </dt>
                        <dd className="mt-1 text-[#17202a]">
                          {quiz.semester}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <AdminDashboardContent />
    </AdminGuard>
  );
}
