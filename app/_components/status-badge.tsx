import type { AttemptStatus } from "@/types/quiz";
import type { QuizAvailabilityStatus } from "@/lib/quiz-availability";

type QuizStatus = QuizAvailabilityStatus | "Attempted";

type StatusBadgeProps = {
  status: QuizStatus | AttemptStatus;
};

function getStatusClass(status: StatusBadgeProps["status"]) {
  if (status === "Active" || status === "Normal") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Upcoming" || status === "Warning") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "Closed" || status === "Suspicious") {
    return "border-[#fecaca] bg-[#fff1f2] text-[#b42318]";
  }

  return "border-[#cbd5e1] bg-[#f8fafc] text-[#334155]";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
        status,
      )}`}
    >
      {status}
    </span>
  );
}
