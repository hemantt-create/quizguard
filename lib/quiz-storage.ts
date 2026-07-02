import type {
  AdminIdentity,
  Quiz,
  QuizAttempt,
  StudentIdentity,
} from "@/types/quiz";

export const quizStorageKey = "quizguard_quizzes";
export const attemptStorageKey = "quizguard_attempts";
export const studentStorageKey = "quizguard_student";
export const adminStorageKey = "quizguard_admin";
export const quizStoreEventName = "quizguard_quizzes_updated";

export function readStoredQuizzes() {
  if (typeof window === "undefined") {
    return [];
  }

  const storedValue = window.localStorage.getItem(quizStorageKey);
  let parsedValue: unknown = [];

  try {
    parsedValue = storedValue ? JSON.parse(storedValue) : [];
  } catch {
    parsedValue = [];
  }

  return Array.isArray(parsedValue) ? (parsedValue as Quiz[]) : [];
}

export function saveStoredQuizzes(quizzes: Quiz[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(quizStorageKey, JSON.stringify(quizzes));
  notifyQuizStoreChanged();
}

export function readStoredAttempts() {
  if (typeof window === "undefined") {
    return [];
  }

  const storedValue = window.localStorage.getItem(attemptStorageKey);
  let parsedValue: unknown = [];

  try {
    parsedValue = storedValue ? JSON.parse(storedValue) : [];
  } catch {
    parsedValue = [];
  }

  return Array.isArray(parsedValue) ? (parsedValue as QuizAttempt[]) : [];
}

export function saveStoredAttempt(attempt: QuizAttempt) {
  if (typeof window === "undefined") {
    return;
  }

  const existingAttempts = readStoredAttempts();

  window.localStorage.setItem(
    attemptStorageKey,
    JSON.stringify([...existingAttempts, attempt]),
  );
}

export function readStoredStudent() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.localStorage.getItem(studentStorageKey);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as StudentIdentity;
  } catch {
    return null;
  }
}

export function saveStoredStudent(student: StudentIdentity) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(studentStorageKey, JSON.stringify(student));
}

export function clearStoredStudent() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(studentStorageKey);
}

export function readStoredAdmin() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.localStorage.getItem(adminStorageKey);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as AdminIdentity;
  } catch {
    return null;
  }
}

export function saveStoredAdmin(admin: AdminIdentity) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(adminStorageKey, JSON.stringify(admin));
}

export function clearStoredAdmin() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(adminStorageKey);
}

export function formatDateTime(value: string) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function getTotalMarks(quiz: Quiz) {
  return quiz.questions.reduce((total, question) => total + question.marks, 0);
}

export function formatSeconds(totalSeconds: number) {
  const normalizedSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(normalizedSeconds / 60);
  const seconds = normalizedSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export function getCurrentTimestamp() {
  return Date.now();
}

export function notifyQuizStoreChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(quizStoreEventName));
}
