import { supabase } from "@/src/lib/supabase";
import type { CorrectOption, Question, Quiz } from "@/types/quiz";

type SupabaseQuizRow = {
  id: string | number;
  title: string | null;
  subject: string | null;
  semester: string | null;
  duration_minutes: number | string | null;
  max_tab_switches: number | string | null;
  start_at: string | null;
  end_at: string | null;
  questions: unknown;
  created_at: string | null;
};

type SupabaseQuizResult =
  | {
      data: Quiz[];
      error: null;
    }
  | {
      data: [];
      error: string;
    };

type SupabaseSingleQuizResult =
  | {
      data: Quiz | null;
      error: null;
    }
  | {
      data: null;
      error: string;
    };

type SupabaseMutationResult =
  | {
      error: null;
    }
  | {
      error: string;
    };

const correctOptions: CorrectOption[] = ["A", "B", "C", "D"];

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

function toCorrectOption(value: unknown): CorrectOption {
  return correctOptions.includes(value as CorrectOption)
    ? (value as CorrectOption)
    : "A";
}

function mapSupabaseQuestion(value: unknown, index: number): Question {
  const question = isRecord(value) ? value : {};

  return {
    id: toNumberValue(question.id, Date.now() + index),
    text: toStringValue(question.text ?? question.questionText),
    imageUrl: toStringValue(question.imageUrl ?? question.image_url) || undefined,
    imagePath:
      toStringValue(question.imagePath ?? question.image_path) || undefined,
    optionA: toStringValue(question.optionA ?? question.option_a),
    optionB: toStringValue(question.optionB ?? question.option_b),
    optionC: toStringValue(question.optionC ?? question.option_c),
    optionD: toStringValue(question.optionD ?? question.option_d),
    correctOption: toCorrectOption(
      question.correctOption ?? question.correct_option,
    ),
    marks: toNumberValue(question.marks, 0),
  };
}

export function mapSupabaseQuizRow(row: SupabaseQuizRow): Quiz {
  const questions = Array.isArray(row.questions)
    ? row.questions.map(mapSupabaseQuestion)
    : [];

  return {
    id: toNumberValue(row.id),
    title: row.title ?? "",
    subjectName: row.subject ?? "",
    semester: row.semester ?? "",
    durationMinutes: toNumberValue(row.duration_minutes),
    maxTabSwitches: toNumberValue(row.max_tab_switches, 3),
    startDateTime: row.start_at ?? "",
    endDateTime: row.end_at ?? "",
    questions,
    createdAt: row.created_at ?? "",
  };
}

export function sortQuizzesByNewest(quizzes: Quiz[]) {
  return [...quizzes].sort((firstQuiz, secondQuiz) => {
    const firstCreatedAt = new Date(firstQuiz.createdAt).getTime();
    const secondCreatedAt = new Date(secondQuiz.createdAt).getTime();

    if (Number.isFinite(firstCreatedAt) && Number.isFinite(secondCreatedAt)) {
      return secondCreatedAt - firstCreatedAt;
    }

    return secondQuiz.id - firstQuiz.id;
  });
}

export async function fetchSupabaseQuizzes(): Promise<SupabaseQuizResult> {
  if (!supabase) {
    return {
      data: [],
      error: "Supabase client is not configured.",
    };
  }

  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: [],
      error: error.message,
    };
  }

  return {
    data: sortQuizzesByNewest(
      ((data ?? []) as SupabaseQuizRow[]).map(mapSupabaseQuizRow),
    ),
    error: null,
  };
}

export async function fetchSupabaseQuizById(
  quizId: number,
): Promise<SupabaseSingleQuizResult> {
  if (!supabase) {
    return {
      data: null,
      error: "Supabase client is not configured.",
    };
  }

  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", String(quizId))
    .maybeSingle();

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  return {
    data: data ? mapSupabaseQuizRow(data as SupabaseQuizRow) : null,
    error: null,
  };
}

function mapQuizToSupabasePayload(quiz: Quiz) {
  return {
    id: String(quiz.id),
    title: quiz.title,
    subject: quiz.subjectName,
    semester: quiz.semester,
    duration_minutes: quiz.durationMinutes,
    max_tab_switches: quiz.maxTabSwitches,
    start_at: quiz.startDateTime,
    end_at: quiz.endDateTime,
    questions: quiz.questions,
    created_at: quiz.createdAt,
  };
}

export async function updateSupabaseQuiz(
  quiz: Quiz,
): Promise<SupabaseMutationResult> {
  if (!supabase) {
    return {
      error: "Supabase client is not configured.",
    };
  }

  const { data, error } = await supabase
    .from("quizzes")
    .update(mapQuizToSupabasePayload(quiz))
    .eq("id", String(quiz.id))
    .select("id");

  if (error) {
    return {
      error: error.message,
    };
  }

  if (!data || data.length === 0) {
    return {
      error: "Quiz was not found in Supabase.",
    };
  }

  return {
    error: null,
  };
}

export async function deleteSupabaseQuiz(
  quizId: number,
): Promise<SupabaseMutationResult> {
  if (!supabase) {
    return {
      error: "Supabase client is not configured.",
    };
  }

  const { data, error } = await supabase
    .from("quizzes")
    .delete()
    .eq("id", String(quizId))
    .select("id");

  if (error) {
    return {
      error: error.message,
    };
  }

  if (!data || data.length === 0) {
    return {
      error: "Quiz was not found in Supabase.",
    };
  }

  return {
    error: null,
  };
}
