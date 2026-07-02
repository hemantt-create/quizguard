"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  getCurrentTimestamp,
  saveStoredStudent,
} from "@/lib/quiz-storage";

export default function StudentLoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [semester, setSemester] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim() || !rollNumber.trim() || !semester.trim()) {
      setError("Please enter student name, roll number, and semester.");
      return;
    }

    saveStoredStudent({
      name: name.trim(),
      rollNumber: rollNumber.trim(),
      semester: semester.trim(),
      loginTime: new Date(getCurrentTimestamp()).toISOString(),
    });

    router.push("/student/dashboard");
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
        <p className="mt-1 text-sm text-[#64748b]">Student Login</p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="student-name"
              className="block text-sm font-medium text-[#334155]"
            >
              Student name
            </label>
            <input
              id="student-name"
              name="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter student name"
              className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-4 text-base outline-none transition placeholder:text-[#94a3b8] focus:border-[#101828] focus:ring-4 focus:ring-[#101828]/10"
            />
          </div>

          <div>
            <label
              htmlFor="student-roll"
              className="block text-sm font-medium text-[#334155]"
            >
              Enrollment/Roll number
            </label>
            <input
              id="student-roll"
              name="rollNumber"
              type="text"
              value={rollNumber}
              onChange={(event) => setRollNumber(event.target.value)}
              placeholder="Enter enrollment or roll number"
              className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-4 text-base outline-none transition placeholder:text-[#94a3b8] focus:border-[#101828] focus:ring-4 focus:ring-[#101828]/10"
            />
          </div>

          <div>
            <label
              htmlFor="student-semester"
              className="block text-sm font-medium text-[#334155]"
            >
              Semester
            </label>
            <input
              id="student-semester"
              name="semester"
              type="text"
              value={semester}
              onChange={(event) => setSemester(event.target.value)}
              placeholder="5th Semester"
              className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-4 text-base outline-none transition placeholder:text-[#94a3b8] focus:border-[#101828] focus:ring-4 focus:ring-[#101828]/10"
            />
          </div>

          <div>
            <label
              htmlFor="student-password"
              className="block text-sm font-medium text-[#334155]"
            >
              Password
            </label>
            <input
              id="student-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Placeholder password"
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
            className="h-12 w-full rounded-lg bg-[#101828] px-5 text-base font-semibold text-white shadow-sm transition hover:bg-[#253044]"
          >
            Student Login
          </button>
        </form>
      </section>
    </main>
  );
}
