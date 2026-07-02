import Link from "next/link";

const features = [
  {
    title: "Tab switch detection",
    description:
      "Monitor assessment focus changes and flag suspicious attempts for review.",
    accent: "bg-rose-500",
  },
  {
    title: "Auto result generation",
    description:
      "Prepare weekly assessment scores after student submissions are completed.",
    accent: "bg-emerald-500",
  },
  {
    title: "Excel result export",
    description:
      "Download internal department result sheets for records and reporting.",
    accent: "bg-amber-500",
  },
  {
    title: "Timed quizzes",
    description:
      "Run controlled weekly quizzes with clear time windows for each batch.",
    accent: "bg-sky-500",
  },
];

const weeklyQuizHighlights = [
  "Create subject-wise weekly MCQ quizzes with start and end windows.",
  "Let students attempt only active quizzes from the department panel.",
  "Store quiz and attempt records in Supabase with local browser fallback.",
];

const antiCheatFeatures = [
  "Fullscreen mode before the quiz begins",
  "Tab switch and window focus monitoring",
  "Auto-submit on suspicious activity",
  "Auto result generation after submission",
  "Excel export for faculty result sheets",
];

const roomRows = [
  ["EE-201", "42 active", "Stable"],
  ["EX-204", "31 active", "Review"],
  ["EE-330", "24 active", "Timed"],
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-[#f6f7fb] text-[#17202a]">
      <section className="relative overflow-hidden border-b border-[#dfe5ec] bg-[#eef2f6]">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:block">
          <div className="absolute inset-10 rounded-lg border border-white/80 bg-white/80 p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#dfe5ec] pb-4">
              <div>
                <p className="text-sm font-semibold text-[#1f2933]">
                  Department Quiz Control
                </p>
                <p className="text-xs text-[#64748b]">
                  Weekly assessment overview
                </p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Active
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {roomRows.map(([course, active, status]) => (
                <div
                  key={course}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-lg border border-[#e5eaf0] bg-white px-4 py-3 text-sm"
                >
                  <span className="font-semibold text-[#1f2933]">
                    {course}
                  </span>
                  <span className="text-[#64748b]">{active}</span>
                  <span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-medium text-[#334155]">
                    {status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-4 gap-2">
              {Array.from({ length: 20 }).map((_, index) => (
                <div
                  key={index}
                  className={`h-10 rounded-lg border ${
                    index % 7 === 0
                      ? "border-amber-200 bg-amber-50"
                      : "border-emerald-200 bg-emerald-50"
                  }`}
                />
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              Suspicious activity triggers warnings and auto-submit when the
              configured limit is reached.
            </div>
          </div>
        </div>

        <div className="relative mx-auto flex min-h-[620px] max-w-6xl items-center px-6 py-16 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border border-[#cfd8e3] bg-white px-4 py-2 text-sm font-medium text-[#475569]">
              UIT RGPV departmental quiz control
            </p>
            <h1 className="text-5xl font-bold leading-tight text-[#101828] sm:text-6xl">
              QuizGuard
            </h1>
            <p className="mt-4 text-lg font-semibold text-[#26364a]">
              Electrical Department, UIT RGPV Bhopal
            </p>
            <p className="mt-5 max-w-xl text-xl leading-8 text-[#475569]">
              Secure online quiz platform for weekly departmental assessments
            </p>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#64748b]">
              Built for internal Electrical Department quizzes, with faculty
              result export and student attempt monitoring ready for demos.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin/login"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-[#101828] px-6 text-base font-semibold text-white shadow-sm transition hover:bg-[#253044]"
              >
                Admin Login
              </Link>
              <Link
                href="/student/login"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-[#cbd5e1] bg-white px-6 text-base font-semibold text-[#17202a] transition hover:border-[#94a3b8] hover:bg-[#f8fafc]"
              >
                Student Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 sm:px-8 lg:px-10">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-bold text-[#101828]">
            Built for weekly departmental assessments
          </h2>
          <p className="mt-3 text-base leading-7 text-[#5f6f82]">
            A focused internal system for quiz delivery, evaluation, and result
            handling within the Electrical and Electronics Department.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-lg border border-[#dfe5ec] bg-white p-5 shadow-sm"
            >
              <div className={`mb-5 h-2 w-12 rounded-full ${feature.accent}`} />
              <h3 className="text-lg font-semibold text-[#101828]">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#64748b]">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#dfe5ec] bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:px-8 lg:grid-cols-[1fr_1fr] lg:px-10">
          <div>
            <p className="text-sm font-semibold uppercase text-[#64748b]">
              Department workflow
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#101828]">
              Designed for weekly subject quizzes
            </h2>
            <p className="mt-3 text-base leading-7 text-[#5f6f82]">
              QuizGuard keeps the weekly assessment cycle simple for faculty
              and predictable for students, from quiz setup to result export.
            </p>
          </div>

          <div className="grid gap-3">
            {weeklyQuizHighlights.map((highlight, index) => (
              <div
                key={highlight}
                className="flex gap-3 rounded-lg border border-[#dfe5ec] bg-[#fbfcfe] p-4"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#101828] text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-[#475569]">
                  {highlight}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 sm:px-8 lg:px-10">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase text-[#64748b]">
            Monitoring and results
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#101828]">
            Anti-cheat features
          </h2>
          <p className="mt-3 text-base leading-7 text-[#5f6f82]">
            The demo flow includes fullscreen start, suspicious activity
            warnings, auto-submit behavior, and faculty-friendly reporting.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {antiCheatFeatures.map((feature) => (
            <article
              key={feature}
              className="rounded-lg border border-[#dfe5ec] bg-white p-4 shadow-sm"
            >
              <div className="mb-4 h-2 w-10 rounded-full bg-[#101828]" />
              <h3 className="text-sm font-semibold leading-6 text-[#101828]">
                {feature}
              </h3>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#dfe5ec] bg-white px-6 py-6 text-center text-sm font-medium text-[#64748b] sm:px-8 lg:px-10">
        QuizGuard - Electrical Department, UIT RGPV Bhopal
      </footer>
    </main>
  );
}
