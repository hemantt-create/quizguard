import { supabase } from "@/src/lib/supabase";
import type {
  AttemptStatus,
  CorrectOption,
  QuizAttempt,
  ViolationLog,
  ViolationType,
} from "@/types/quiz";

type SupabaseAttemptRow = {
  attempt_id: string | number | null;
  quiz_id: string | number | null;
  quiz_title: string | null;
  subject: string | null;
  semester: string | null;
  student_name: string | null;
  roll_number: string | null;
  student_semester: string | null;
  score: number | string | null;
  total_marks: number | string | null;
  correct_count: number | string | null;
  wrong_count: number | string | null;
  unanswered_count: number | string | null;
  selected_answers: unknown;
  started_at: string | null;
  submitted_at: string | null;
  time_taken_seconds: number | string | null;
  tab_switch_count: number | string | null;
  status: string | null;
  violation_logs: unknown;
  created_at: string | null;
};

type SupabaseAttemptResult =
  | {
      error: null;
      code?: null;
    }
  | {
      error: string;
      code?: string;
    };

type SupabaseAttemptsResult =
  | {
      data: QuizAttempt[];
      error: null;
    }
  | {
      data: [];
      error: string;
    };

type SupabaseSingleAttemptResult =
  | {
      data: QuizAttempt | null;
      error: null;
    }
  | {
      data: null;
      error: string;
    };

const correctOptions: CorrectOption[] = ["A", "B", "C", "D"];
const statuses: AttemptStatus[] = ["Normal", "Warning", "Suspicious"];
const violationTypes: ViolationType[] = [
  "TAB_SWITCH",
  "WINDOW_BLUR",
  "FULLSCREEN_EXIT",
  "COPY_ATTEMPT",
  "PASTE_ATTEMPT",
  "SCREENSHOT_ATTEMPT",
  "DEVTOOLS_ATTEMPT",
  "BLOCKED_SHORTCUT",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function toStringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toNumberValue(value: unknown, fallback = 0) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function toAttemptStatus(value: unknown): AttemptStatus {
  return statuses.includes(value as AttemptStatus)
    ? (value as AttemptStatus)
    : "Normal";
}

function toCorrectOption(value: unknown): CorrectOption | null {
  return correctOptions.includes(value as CorrectOption)
    ? (value as CorrectOption)
    : null;
}

function toViolationType(value: unknown): ViolationType | null {
  return violationTypes.includes(value as ViolationType)
    ? (value as ViolationType)
    : null;
}

function mapSelectedAnswers(value: unknown): Record<number, CorrectOption> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<number, CorrectOption>>(
    (answers, [questionId, selectedOption]) => {
      const numericQuestionId = Number(questionId);
      const correctOption = toCorrectOption(selectedOption);

      if (Number.isFinite(numericQuestionId) && correctOption) {
        answers[numericQuestionId] = correctOption;
      }

      return answers;
    },
    {},
  );
}

function mapViolationLogs(value: unknown): ViolationLog[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    const type = toViolationType(item.type);

    if (!type) {
      return [];
    }

    return [
      {
        type,
        timestamp: toStringValue(item.timestamp),
        count: toNumberValue(item.count),
      },
    ];
  });
}

function getFallbackAttemptId(row: SupabaseAttemptRow) {
  const createdAtMs = row.created_at ? new Date(row.created_at).getTime() : NaN;

  return Number.isFinite(createdAtMs) ? createdAtMs : Date.now();
}

export function mapSupabaseAttemptRow(row: SupabaseAttemptRow): QuizAttempt {
  return {
    attemptId: toNumberValue(row.attempt_id, getFallbackAttemptId(row)),
    quizId: toNumberValue(row.quiz_id),
    quizTitle: row.quiz_title ?? "",
    studentName: row.student_name ?? undefined,
    rollNumber: row.roll_number ?? undefined,
    studentSemester: row.student_semester ?? undefined,
    subject: row.subject ?? "",
    semester: row.semester ?? "",
    score: toNumberValue(row.score),
    totalMarks: toNumberValue(row.total_marks),
    correctCount: toNumberValue(row.correct_count),
    wrongCount: toNumberValue(row.wrong_count),
    unansweredCount: toNumberValue(row.unanswered_count),
    selectedAnswers: mapSelectedAnswers(row.selected_answers),
    startedAt: row.started_at ?? "",
    submittedAt: row.submitted_at ?? row.created_at ?? "",
    timeTakenSeconds: toNumberValue(row.time_taken_seconds),
    tabSwitchCount: toNumberValue(row.tab_switch_count),
    status: toAttemptStatus(row.status),
    violationLogs: mapViolationLogs(row.violation_logs),
  };
}

export function sortAttemptsByNewest(attempts: QuizAttempt[]) {
  return [...attempts].sort((firstAttempt, secondAttempt) => {
    const firstSubmittedAt = new Date(firstAttempt.submittedAt).getTime();
    const secondSubmittedAt = new Date(secondAttempt.submittedAt).getTime();

    if (
      Number.isFinite(firstSubmittedAt) &&
      Number.isFinite(secondSubmittedAt)
    ) {
      return secondSubmittedAt - firstSubmittedAt;
    }

    return secondAttempt.attemptId - firstAttempt.attemptId;
  });
}

export async function saveSupabaseAttempt(
  attempt: QuizAttempt,
): Promise<SupabaseAttemptResult> {
  if (!supabase) {
    return {
      error: "Supabase client is not configured.",
      code: "SUPABASE_NOT_CONFIGURED",
    };
  }

  const { error } = await supabase.from("attempts").insert({
    attempt_id: String(attempt.attemptId),
    quiz_id: String(attempt.quizId),
    quiz_title: attempt.quizTitle,
    subject: attempt.subject,
    semester: attempt.semester,
    student_name: attempt.studentName,
    roll_number: attempt.rollNumber,
    student_semester: attempt.studentSemester,
    score: attempt.score,
    total_marks: attempt.totalMarks,
    correct_count: attempt.correctCount,
    wrong_count: attempt.wrongCount,
    unanswered_count: attempt.unansweredCount,
    selected_answers: attempt.selectedAnswers,
    started_at: attempt.startedAt,
    submitted_at: attempt.submittedAt,
    time_taken_seconds: attempt.timeTakenSeconds,
    tab_switch_count: attempt.tabSwitchCount,
    status: attempt.status,
    violation_logs: attempt.violationLogs,
    created_at: attempt.submittedAt,
  });

  if (error) {
    return {
      error: error.message,
      code: error.code,
    };
  }

  return {
    error: null,
    code: null,
  };
}

export async function fetchSupabaseAttempts(): Promise<SupabaseAttemptsResult> {
  if (!supabase) {
    return {
      data: [],
      error: "Supabase client is not configured.",
    };
  }

  const { data, error } = await supabase
    .from("attempts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: [],
      error: error.message,
    };
  }

  return {
    data: ((data ?? []) as SupabaseAttemptRow[]).map(mapSupabaseAttemptRow),
    error: null,
  };
}

export async function fetchSupabaseAttemptById(
  attemptId: number,
): Promise<SupabaseSingleAttemptResult> {
  if (!supabase) {
    return {
      data: null,
      error: "Supabase client is not configured.",
    };
  }

  const { data, error } = await supabase
    .from("attempts")
    .select("*")
    .eq("attempt_id", String(attemptId))
    .maybeSingle();

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  return {
    data: data ? mapSupabaseAttemptRow(data as SupabaseAttemptRow) : null,
    error: null,
  };
}

export async function fetchSupabaseAttemptForStudent(
  quizId: number,
  rollNumber: string,
): Promise<SupabaseSingleAttemptResult> {
  if (!supabase) {
    return {
      data: null,
      error: "Supabase client is not configured.",
    };
  }

  const { data, error } = await supabase
    .from("attempts")
    .select("*")
    .eq("quiz_id", String(quizId))
    .eq("roll_number", rollNumber)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  const firstAttempt = Array.isArray(data) ? data[0] : null;

  return {
    data: firstAttempt
      ? mapSupabaseAttemptRow(firstAttempt as SupabaseAttemptRow)
      : null,
    error: null,
  };
}

export async function fetchSupabaseAttemptsForStudent(
  rollNumber: string,
): Promise<SupabaseAttemptsResult> {
  if (!supabase) {
    return {
      data: [],
      error: "Supabase client is not configured.",
    };
  }

  const { data, error } = await supabase
    .from("attempts")
    .select("*")
    .eq("roll_number", rollNumber)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: [],
      error: error.message,
    };
  }

  return {
    data: ((data ?? []) as SupabaseAttemptRow[]).map(mapSupabaseAttemptRow),
    error: null,
  };
}
