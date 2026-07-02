"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { fetchAdminProfileByEmail } from "@/lib/admin-auth";
import { clearStoredAdmin } from "@/lib/quiz-storage";
import { supabase } from "@/src/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setIsSubmitting(false);
      setError("Please enter admin email and password.");
      return;
    }

    if (!supabase) {
      setIsSubmitting(false);
      setError("Supabase is not configured. Please check environment keys.");
      return;
    }

    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

    if (signInError) {
      setIsSubmitting(false);
      setError(signInError.message);
      return;
    }

    const signedInEmail = data.user?.email?.toLowerCase() ?? normalizedEmail;
    const adminResult = await fetchAdminProfileByEmail(signedInEmail);

    if (adminResult.error) {
      await supabase.auth.signOut();
      clearStoredAdmin();
      setIsSubmitting(false);
      setError(`Unable to verify admin access: ${adminResult.error}`);
      return;
    }

    if (!adminResult.data) {
      await supabase.auth.signOut();
      clearStoredAdmin();
      setIsSubmitting(false);
      setError("This email is not authorized as an admin.");
      return;
    }

    clearStoredAdmin();
    router.push("/admin/dashboard");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f6f7fb] px-6 py-12 text-[#17202a]">
      <section className="w-full max-w-md rounded-lg border border-[#dfe5ec] bg-white p-8 shadow-sm">
        <Link href="/" className="text-2xl font-bold text-[#101828]">
          QuizGuard
        </Link>
        <p className="mt-2 text-sm font-medium text-[#334155]">
          Electrical Department, UIT RGPV Bhopal
        </p>
        <p className="mt-1 text-sm text-[#64748b]">Admin Login</p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-sm font-medium text-[#334155]"
            >
              Email
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@uitrgpv.ac.in"
              disabled={isSubmitting}
              className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-4 text-base outline-none transition placeholder:text-[#94a3b8] focus:border-[#101828] focus:ring-4 focus:ring-[#101828]/10"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-sm font-medium text-[#334155]"
            >
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Supabase admin password"
              disabled={isSubmitting}
              className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-4 text-base outline-none transition placeholder:text-[#94a3b8] focus:border-[#101828] focus:ring-4 focus:ring-[#101828]/10"
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm font-medium text-[#b42318]">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-lg bg-[#101828] px-5 text-base font-semibold text-white shadow-sm transition hover:bg-[#253044] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Checking Admin Access..." : "Admin Login"}
          </button>
        </form>
      </section>
    </main>
  );
}
