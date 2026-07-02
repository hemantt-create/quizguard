"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminGuard } from "@/app/admin/_components/admin-guard";
import { hasSupabaseConfig, supabase } from "@/src/lib/supabase";

type TestResult =
  | {
      type: "success";
      message: string;
      quizCount: number;
    }
  | {
      type: "error";
      message: string;
    };

function DatabaseTestContent() {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  async function testConnection() {
    setIsTesting(true);
    setResult(null);

    if (!hasSupabaseConfig || !supabase) {
      setResult({
        type: "error",
        message:
          "Supabase environment variables are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
      });
      setIsTesting(false);
      return;
    }

    try {
      const { data, error } = await supabase.from("quizzes").select("*");

      if (error) {
        setResult({
          type: "error",
          message: error.message,
        });
        return;
      }

      setResult({
        type: "success",
        message: "Connection successful. The quizzes table is reachable.",
        quizCount: data?.length ?? 0,
      });
    } catch (error) {
      setResult({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to connect to Supabase.",
      });
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#f6f7fb] px-6 py-10 text-[#17202a] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-col gap-4 border-b border-[#dfe5ec] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#64748b]">
              QuizGuard - Electrical Department, UIT RGPV Bhopal
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#101828]">
              Supabase Database Test
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748b]">
              Check whether the admin panel can read quiz rows from the
              Supabase database.
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#cbd5e1] bg-white px-5 text-sm font-semibold text-[#17202a] transition hover:border-[#94a3b8] hover:bg-[#f8fafc]"
          >
            Back to Dashboard
          </Link>
        </header>

        <section className="mt-8 rounded-lg border border-[#dfe5ec] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#101828]">
                Quizzes Table Connection
              </h2>
              <p className="mt-2 text-sm text-[#64748b]">
                This only reads from Supabase. It does not change quiz
                creation, attempts, results, or localStorage behavior.
              </p>
            </div>
            <button
              type="button"
              onClick={testConnection}
              disabled={isTesting}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#101828] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#253044] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isTesting ? "Testing..." : "Test Connection"}
            </button>
          </div>

          {result ? (
            <div
              className={`mt-6 rounded-lg border px-4 py-4 text-sm ${
                result.type === "success"
                  ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]"
                  : "border-[#fecaca] bg-[#fff1f2] text-[#b42318]"
              }`}
            >
              <p className="font-semibold">{result.message}</p>
              {result.type === "success" ? (
                <p className="mt-2">
                  Quizzes found:{" "}
                  <span className="font-semibold">{result.quizCount}</span>
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-5 text-sm text-[#64748b]">
              Click Test Connection to query all rows from the quizzes table.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function DatabaseTestPage() {
  return (
    <AdminGuard>
      <DatabaseTestContent />
    </AdminGuard>
  );
}
