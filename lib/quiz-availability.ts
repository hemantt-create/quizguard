import type { Quiz } from "@/types/quiz";

export type QuizAvailabilityStatus = "Upcoming" | "Active" | "Closed";

export function getQuizAvailabilityStatus(
  quiz: Quiz,
  now = new Date(),
): QuizAvailabilityStatus {
  const startAt = new Date(quiz.startDateTime).getTime();
  const endAt = new Date(quiz.endDateTime).getTime();
  const nowTime = now.getTime();

  if (Number.isFinite(startAt) && nowTime < startAt) {
    return "Upcoming";
  }

  if (Number.isFinite(endAt) && nowTime > endAt) {
    return "Closed";
  }

  return "Active";
}

export function isQuizActive(quiz: Quiz, now = new Date()) {
  return getQuizAvailabilityStatus(quiz, now) === "Active";
}

export function getQuizAvailabilityBadgeClass(
  status: QuizAvailabilityStatus,
) {
  if (status === "Upcoming") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (status === "Closed") {
    return "border-[#fecaca] bg-[#fff1f2] text-[#b42318]";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}
