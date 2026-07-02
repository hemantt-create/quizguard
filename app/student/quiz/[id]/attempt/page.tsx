"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QuestionImage } from "@/app/_components/question-image";
import { StudentGuard } from "@/app/student/_components/student-guard";
import {
  getQuizAvailabilityStatus,
  isQuizActive,
} from "@/lib/quiz-availability";
import {
  formatSeconds,
  getCurrentTimestamp,
  getTotalMarks,
  readStoredStudent,
  saveStoredAttempt,
} from "@/lib/quiz-storage";
import { saveSupabaseAttempt } from "@/lib/supabase-attempts";
import { useStoredStudentIdentity } from "@/lib/use-local-identity";
import { useStudentQuizAttempt } from "@/lib/use-student-attempts";
import { useSupabaseQuiz } from "@/lib/use-supabase-quizzes";
import type {
  AttemptStatus,
  CorrectOption,
  Quiz,
  QuizAttempt,
  ViolationLog,
  ViolationType,
} from "@/types/quiz";

const optionLabels: CorrectOption[] = ["A", "B", "C", "D"];
const defaultMaxTabSwitches = 3;
const violationCooldownMs = 1000;
const watermarkTileCount = 36;
const duplicateAttemptMessage =
  "You have already attempted this quiz. Multiple attempts are not allowed.";

function getOptionText(
  quizQuestion: Quiz["questions"][number],
  option: CorrectOption,
) {
  const optionKey = `option${option}` as const;

  return quizQuestion[optionKey];
}

function getMaxAllowedTabSwitches(quiz: Quiz) {
  return Number.isFinite(quiz.maxTabSwitches) && quiz.maxTabSwitches > 0
    ? quiz.maxTabSwitches
    : defaultMaxTabSwitches;
}

function StudentWatermark({ text }: { text: string }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      <div className="-ml-24 -mt-16 grid h-[140%] w-[140%] rotate-[-18deg] grid-cols-2 gap-10 opacity-[0.07] sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: watermarkTileCount }).map((_, index) => (
          <span
            key={index}
            className="whitespace-nowrap text-sm font-bold uppercase tracking-[0.18em] text-[#101828]"
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

function PrivacyOverlay({
  onReturnToFullscreen,
}: {
  onReturnToFullscreen: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#101828]/85 px-6 py-10 text-center text-white backdrop-blur-md">
      <section className="max-w-xl rounded-lg border border-white/20 bg-white/10 p-6 shadow-lg">
        <p className="text-sm font-semibold uppercase text-white/70">
          QuizGuard Protection
        </p>
        <h2 className="mt-3 text-2xl font-bold">
          Quiz paused due to suspicious activity. Return to fullscreen to
          continue.
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/75">
          Browser-level screenshot and copy protection is best-effort. This
          event has been logged for faculty review.
        </p>
        <button
          type="button"
          onClick={onReturnToFullscreen}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-[#101828] shadow-sm transition hover:bg-[#f8fafc]"
        >
          Return to Fullscreen
        </button>
      </section>
    </div>
  );
}

function StudentQuizAttemptContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const quizId = useMemo(() => Number(params.id), [params.id]);
  const { quiz, hasLoaded, error } = useSupabaseQuiz(quizId);
  const { student, hasLoaded: hasLoadedStudent } = useStoredStudentIdentity();
  const { attempt, hasLoaded: hasLoadedAttempt } = useStudentQuizAttempt(
    quizId,
    student?.rollNumber,
  );
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, CorrectOption>
  >({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warningMessage, setWarningMessage] = useState("");
  const [submissionBlockMessage, setSubmissionBlockMessage] = useState("");
  const [isPrivacyOverlayVisible, setIsPrivacyOverlayVisible] =
    useState(false);
  const selectedAnswersRef = useRef<Record<number, CorrectOption>>({});
  const startedAtMsRef = useRef<number | null>(null);
  const isSubmittedRef = useRef(false);
  const isQuizActiveRef = useRef(false);
  const quizRef = useRef<Quiz | null>(null);
  const tabSwitchCountRef = useRef(0);
  const violationLogsRef = useRef<ViolationLog[]>([]);
  const lastViolationAtRef = useRef(0);

  const currentQuestion = quiz?.questions[currentQuestionIndex] ?? null;
  const maxAllowedTabSwitches = quiz
    ? getMaxAllowedTabSwitches(quiz)
    : defaultMaxTabSwitches;
  const availabilityStatus = quiz
    ? getQuizAvailabilityStatus(quiz)
    : "Closed";
  const canCheckAttempt =
    !hasLoadedStudent || student?.rollNumber ? hasLoadedAttempt : true;
  const totalSeconds = quiz ? Math.max(0, quiz.durationMinutes * 60) : 0;
  const visibleRemainingSeconds = isStarted ? remainingSeconds : totalSeconds;
  const watermarkText = `${student?.name || "Student"} ${
    student?.rollNumber || "Not Added"
  } QuizGuard`;

  useEffect(() => {
    quizRef.current = quiz;
  }, [quiz]);

  function selectAnswer(questionId: number, option: CorrectOption) {
    const updatedAnswers = {
      ...selectedAnswersRef.current,
      [questionId]: option,
    };

    selectedAnswersRef.current = updatedAnswers;
    setSelectedAnswers(updatedAnswers);
  }

  function goToPreviousQuestion() {
    setCurrentQuestionIndex((currentIndex) => Math.max(0, currentIndex - 1));
  }

  function goToNextQuestion() {
    if (!quiz) {
      return;
    }

    setCurrentQuestionIndex((currentIndex) =>
      Math.min(quiz.questions.length - 1, currentIndex + 1),
    );
  }

  const exitFullscreenIfNeeded = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }
  }, []);

  const submitAttempt = useCallback(
    async (forcedStatus?: AttemptStatus) => {
      const activeQuiz = quizRef.current;

      if (
        !activeQuiz ||
        isSubmittedRef.current ||
        activeQuiz.questions.length === 0
      ) {
        return;
      }

      isSubmittedRef.current = true;
      isQuizActiveRef.current = false;
      setIsSubmitting(true);
      setIsPrivacyOverlayVisible(false);
      setSubmissionBlockMessage("");

      const answers = selectedAnswersRef.current;
      let score = 0;
      let correctCount = 0;
      let wrongCount = 0;
      let unansweredCount = 0;

      activeQuiz.questions.forEach((question) => {
        const selectedAnswer = answers[question.id];

        if (!selectedAnswer) {
          unansweredCount += 1;
          return;
        }

        if (selectedAnswer === question.correctOption) {
          correctCount += 1;
          score += question.marks;
          return;
        }

        wrongCount += 1;
      });

      const submittedAtMs = getCurrentTimestamp();
      const startedAtMs = startedAtMsRef.current ?? submittedAtMs;
      const attemptId = submittedAtMs;
      const currentTabSwitchCount = tabSwitchCountRef.current;
      const maxAllowed = getMaxAllowedTabSwitches(activeQuiz);
      const student = readStoredStudent();
      const status =
        forcedStatus ??
        (currentTabSwitchCount >= maxAllowed
          ? "Suspicious"
          : currentTabSwitchCount > 0
            ? "Warning"
            : "Normal");
      const timeTakenSeconds = Math.max(
        0,
        Math.floor((submittedAtMs - startedAtMs) / 1000),
      );
      const attempt: QuizAttempt = {
        attemptId,
        quizId: activeQuiz.id,
        quizTitle: activeQuiz.title,
        studentName: student?.name || "Unknown Student",
        rollNumber: student?.rollNumber || "Not Added",
        studentSemester:
          student?.semester || activeQuiz.semester || "Not Added",
        subject: activeQuiz.subjectName,
        semester: activeQuiz.semester,
        score,
        totalMarks: getTotalMarks(activeQuiz),
        correctCount,
        wrongCount,
        unansweredCount,
        selectedAnswers: answers,
        startedAt: new Date(startedAtMs).toISOString(),
        submittedAt: new Date(submittedAtMs).toISOString(),
        timeTakenSeconds,
        tabSwitchCount: currentTabSwitchCount,
        status,
        violationLogs: violationLogsRef.current,
      };

      try {
        const result = await saveSupabaseAttempt(attempt);

        if (result.error) {
          if (result.code === "23505") {
            await exitFullscreenIfNeeded();
            setSubmissionBlockMessage(duplicateAttemptMessage);
            setIsSubmitting(false);
            return;
          }

          if (result.code !== "SUPABASE_NOT_CONFIGURED") {
            await exitFullscreenIfNeeded();
            console.warn("Supabase attempt save failed.", result.error);
            setSubmissionBlockMessage(
              "Unable to submit this quiz right now. Please contact your faculty coordinator.",
            );
            setIsSubmitting(false);
            return;
          }

          console.warn(
            "Attempt saved locally, but Supabase save failed.",
            result.error,
          );
        }
      } catch (error) {
        console.warn(
          "Attempt saved locally, but Supabase save failed.",
          error,
        );
      }

      saveStoredAttempt(attempt);
      await exitFullscreenIfNeeded();
      router.push(
        `/student/quiz/${activeQuiz.id}/result?attemptId=${attemptId}`,
      );
    },
    [exitFullscreenIfNeeded, router],
  );

  const recordViolation = useCallback(
    (
      type: ViolationType,
      {
        countViolation = true,
        message,
      }: {
        countViolation?: boolean;
        message?: string;
      } = {},
    ) => {
      const activeQuiz = quizRef.current;

      if (!activeQuiz || !isQuizActiveRef.current || isSubmittedRef.current) {
        return;
      }

      const now = getCurrentTimestamp();
      const maxAllowed = getMaxAllowedTabSwitches(activeQuiz);
      const canCountViolation =
        countViolation &&
        now - lastViolationAtRef.current >= violationCooldownMs;
      const nextCount = canCountViolation
        ? tabSwitchCountRef.current + 1
        : tabSwitchCountRef.current;
      const nextLog: ViolationLog = {
        type,
        timestamp: new Date(now).toISOString(),
        count: nextCount,
      };

      violationLogsRef.current = [...violationLogsRef.current, nextLog];

      if (canCountViolation) {
        lastViolationAtRef.current = now;
        tabSwitchCountRef.current = nextCount;
        setTabSwitchCount(nextCount);
      }

      setWarningMessage(
        message ??
          (countViolation
            ? `Warning: Suspicious activity detected. Tab switch count: ${nextCount}/${maxAllowed}`
            : "Blocked action detected. This event has been logged by QuizGuard."),
      );

      if (nextCount >= maxAllowed) {
        void submitAttempt("Suspicious");
      }
    },
    [submitAttempt],
  );

  const pauseQuizView = useCallback(() => {
    if (!isQuizActiveRef.current || isSubmittedRef.current) {
      return;
    }

    setIsPrivacyOverlayVisible(true);
  }, []);

  const resumeQuizView = useCallback(() => {
    const activeQuiz = quizRef.current;

    if (!activeQuiz || !isQuizActiveRef.current || isSubmittedRef.current) {
      return;
    }

    if (tabSwitchCountRef.current >= getMaxAllowedTabSwitches(activeQuiz)) {
      return;
    }

    if (
      document.visibilityState === "visible" &&
      document.hasFocus() &&
      document.fullscreenElement
    ) {
      setIsPrivacyOverlayVisible(false);
    }
  }, []);

  async function returnToFullscreen() {
    if (!isQuizActiveRef.current || isSubmittedRef.current) {
      return;
    }

    try {
      await document.documentElement.requestFullscreen();
      resumeQuizView();
    } catch {
      setWarningMessage(
        "Fullscreen could not be restored. Return to fullscreen to continue.",
      );
    }
  }

  async function startQuiz() {
    if (
      !quiz ||
      !isQuizActive(quiz) ||
      attempt ||
      !canCheckAttempt ||
      isStarted ||
      isSubmitting
    ) {
      return;
    }

    try {
      await document.documentElement.requestFullscreen();
    } catch {
      setWarningMessage(
        "Fullscreen could not be enabled. Continue without leaving this quiz window.",
      );
    }

    isQuizActiveRef.current = true;
    setIsPrivacyOverlayVisible(false);
    setIsStarted(true);
  }

  useEffect(() => {
    if (
      !quiz ||
      !isStarted ||
      startedAtMsRef.current !== null ||
      quiz.questions.length === 0
    ) {
      return;
    }

    let intervalId: number | undefined;

    const timeoutId = window.setTimeout(() => {
      const startedAtMs = getCurrentTimestamp();

      startedAtMsRef.current = startedAtMs;
      setStartedAt(new Date(startedAtMs).toISOString());
      setRemainingSeconds(totalSeconds);

      intervalId = window.setInterval(() => {
        const elapsedSeconds = Math.floor(
          (getCurrentTimestamp() - startedAtMs) / 1000,
        );
        const nextRemainingSeconds = Math.max(
          totalSeconds - elapsedSeconds,
          0,
        );

        setRemainingSeconds(nextRemainingSeconds);

        if (nextRemainingSeconds === 0) {
          if (intervalId) {
            window.clearInterval(intervalId);
          }

          void submitAttempt();
        }
      }, 1000);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);

      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [isStarted, quiz, submitAttempt, totalSeconds]);

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (!isSubmittedRef.current && isQuizActiveRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    }

    window.addEventListener("beforeunload", warnBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
    };
  }, []);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        pauseQuizView();
        recordViolation("TAB_SWITCH");
        return;
      }

      resumeQuizView();
    }

    function handleWindowBlur() {
      pauseQuizView();
      recordViolation("WINDOW_BLUR");
    }

    function handleWindowFocus() {
      resumeQuizView();
    }

    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        pauseQuizView();
        recordViolation("FULLSCREEN_EXIT");
        return;
      }

      resumeQuizView();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [pauseQuizView, recordViolation, resumeQuizView]);

  useEffect(() => {
    function isActiveProtectedQuiz() {
      return isQuizActiveRef.current && !isSubmittedRef.current;
    }

    function blockEvent(
      event: Event,
      type: ViolationType,
      countViolation: boolean,
      message?: string,
    ) {
      if (!isActiveProtectedQuiz()) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      recordViolation(type, {
        countViolation,
        message,
      });
    }

    function handleContextMenu(event: MouseEvent) {
      blockEvent(
        event,
        "BLOCKED_SHORTCUT",
        false,
        "Right-click is disabled during the quiz.",
      );
    }

    function handleSelectStart(event: Event) {
      blockEvent(
        event,
        "BLOCKED_SHORTCUT",
        false,
        "Text selection is disabled during the quiz.",
      );
    }

    function handleCopy(event: ClipboardEvent) {
      blockEvent(
        event,
        "COPY_ATTEMPT",
        true,
        "Copying quiz content is not allowed.",
      );
    }

    function handleCut(event: ClipboardEvent) {
      blockEvent(
        event,
        "COPY_ATTEMPT",
        true,
        "Cut/copy actions are not allowed during the quiz.",
      );
    }

    function handlePaste(event: ClipboardEvent) {
      blockEvent(
        event,
        "PASTE_ATTEMPT",
        true,
        "Pasting content is not allowed during the quiz.",
      );
    }

    function handleDragStart(event: DragEvent) {
      blockEvent(
        event,
        "BLOCKED_SHORTCUT",
        false,
        "Dragging quiz content is disabled.",
      );
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!isActiveProtectedQuiz()) {
        return;
      }

      const key = event.key.toLowerCase();
      const usesPrimaryModifier = event.ctrlKey || event.metaKey;

      if (event.key === "PrintScreen" || event.code === "PrintScreen") {
        blockEvent(
          event,
          "SCREENSHOT_ATTEMPT",
          true,
          "Screenshot key detected. This activity has been logged.",
        );
        const clipboardWrite = navigator.clipboard?.writeText?.("");
        void clipboardWrite?.catch(() => {});
        return;
      }

      if (event.key === "F12") {
        blockEvent(
          event,
          "DEVTOOLS_ATTEMPT",
          true,
          "Developer tools access is not allowed during the quiz.",
        );
        return;
      }

      if (
        usesPrimaryModifier &&
        event.shiftKey &&
        (key === "i" || key === "j")
      ) {
        blockEvent(
          event,
          "DEVTOOLS_ATTEMPT",
          true,
          "Developer tools shortcuts are not allowed during the quiz.",
        );
        return;
      }

      if (usesPrimaryModifier && key === "p") {
        blockEvent(
          event,
          "SCREENSHOT_ATTEMPT",
          true,
          "Printing or saving quiz screens is not allowed.",
        );
        return;
      }

      if (usesPrimaryModifier && (key === "c" || key === "x")) {
        blockEvent(
          event,
          "COPY_ATTEMPT",
          true,
          "Copying quiz content is not allowed.",
        );
        return;
      }

      if (usesPrimaryModifier && key === "v") {
        blockEvent(
          event,
          "PASTE_ATTEMPT",
          true,
          "Pasting content is not allowed during the quiz.",
        );
        return;
      }

      if (
        usesPrimaryModifier &&
        (key === "a" || key === "s" || key === "u")
      ) {
        blockEvent(
          event,
          "BLOCKED_SHORTCUT",
          false,
          "This browser shortcut is disabled during the quiz.",
        );
      }
    }

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [recordViolation]);

  if (!hasLoaded) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f6f7fb] px-6 py-10 text-[#17202a]">
        <section className="w-full max-w-2xl rounded-lg border border-dashed border-[#cbd5e1] bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-[#64748b]">Loading quiz attempt...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f6f7fb] px-6 py-10 text-[#17202a]">
        <section className="w-full max-w-2xl rounded-lg border border-[#fecaca] bg-[#fff1f2] p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-[#b42318]">
            QuizGuard - Electrical Department, UIT RGPV Bhopal
          </p>
          <h1 className="mt-3 text-3xl font-bold text-[#b42318]">
            Unable to load quiz
          </h1>
          <p className="mt-3 text-sm font-medium leading-6 text-[#b42318]">
            {error}
          </p>
          <Link
            href="/student/dashboard"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[#101828] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#253044]"
          >
            Back to Student Dashboard
          </Link>
        </section>
      </main>
    );
  }

  if (!quiz) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f6f7fb] px-6 py-10 text-[#17202a]">
        <section className="w-full max-w-2xl rounded-lg border border-[#dfe5ec] bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-[#64748b]">
            QuizGuard - Electrical Department, UIT RGPV Bhopal
          </p>
          <h1 className="mt-3 text-3xl font-bold text-[#101828]">
            Quiz not found
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#64748b]">
            This quiz may have been removed from this browser.
          </p>
          <Link
            href="/student/dashboard"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[#101828] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#253044]"
          >
            Back to Student Dashboard
          </Link>
        </section>
      </main>
    );
  }

  if (!canCheckAttempt) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f6f7fb] px-6 py-10 text-[#17202a]">
        <section className="w-full max-w-2xl rounded-lg border border-dashed border-[#cbd5e1] bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-[#64748b]">
            QuizGuard - Electrical Department, UIT RGPV Bhopal
          </p>
          <h1 className="mt-3 text-3xl font-bold text-[#101828]">
            Checking attempt status
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#64748b]">
            Please wait while QuizGuard verifies whether this quiz has already
            been attempted.
          </p>
        </section>
      </main>
    );
  }

  if (attempt) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f6f7fb] px-6 py-10 text-[#17202a]">
        <section className="w-full max-w-2xl rounded-lg border border-[#dfe5ec] bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-[#64748b]">
            QuizGuard - Electrical Department, UIT RGPV Bhopal
          </p>
          <h1 className="mt-3 text-3xl font-bold text-[#101828]">
            Quiz already attempted
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#64748b]">
            You have already attempted this quiz.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={`/student/quiz/${quiz.id}/result?attemptId=${attempt.attemptId}`}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#101828] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#253044]"
            >
              View Result
            </Link>
            <Link
              href="/student/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[#cbd5e1] bg-white px-5 text-sm font-semibold text-[#17202a] transition hover:border-[#94a3b8] hover:bg-[#f8fafc]"
            >
              Back to Dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (availabilityStatus !== "Active") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f6f7fb] px-6 py-10 text-[#17202a]">
        <section className="w-full max-w-2xl rounded-lg border border-[#dfe5ec] bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-[#64748b]">
            QuizGuard - Electrical Department, UIT RGPV Bhopal
          </p>
          <h1 className="mt-3 text-3xl font-bold text-[#101828]">
            Quiz unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#64748b]">
            {availabilityStatus === "Upcoming"
              ? "This quiz has not started yet."
              : "This quiz is closed."}
          </p>
          <Link
            href="/student/dashboard"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[#101828] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#253044]"
          >
            Back to Dashboard
          </Link>
        </section>
      </main>
    );
  }

  if (quiz.questions.length === 0) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f6f7fb] px-6 py-10 text-[#17202a]">
        <section className="w-full max-w-2xl rounded-lg border border-[#dfe5ec] bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-bold text-[#101828]">
            No questions found
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#64748b]">
            This quiz does not have any questions saved.
          </p>
        </section>
      </main>
    );
  }

  if (submissionBlockMessage) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f6f7fb] px-6 py-10 text-[#17202a]">
        <section className="w-full max-w-2xl rounded-lg border border-[#dfe5ec] bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-[#64748b]">
            QuizGuard - Electrical Department, UIT RGPV Bhopal
          </p>
          <h1 className="mt-3 text-3xl font-bold text-[#101828]">
            Attempt not submitted
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#64748b]">
            {submissionBlockMessage}
          </p>
          <Link
            href="/student/dashboard"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[#101828] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#253044]"
          >
            Back to Student Dashboard
          </Link>
        </section>
      </main>
    );
  }

  if (!isStarted) {
    return (
      <main className="min-h-dvh bg-[#f6f7fb] px-6 py-10 text-[#17202a] sm:px-8 lg:px-10">
        <section className="mx-auto max-w-3xl rounded-lg border border-[#dfe5ec] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-[#64748b]">
            QuizGuard - Electrical Department, UIT RGPV Bhopal
          </p>
          <h1 className="mt-3 text-3xl font-bold text-[#101828]">
            {quiz.title}
          </h1>
          <p className="mt-2 text-sm text-[#64748b]">
            {quiz.subjectName} - {quiz.semester}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-[#f8fafc] p-4">
              <p className="text-sm font-medium text-[#64748b]">Duration</p>
              <p className="mt-1 text-xl font-bold text-[#101828]">
                {quiz.durationMinutes} min
              </p>
            </div>
            <div className="rounded-lg bg-[#f8fafc] p-4">
              <p className="text-sm font-medium text-[#64748b]">Questions</p>
              <p className="mt-1 text-xl font-bold text-[#101828]">
                {quiz.questions.length}
              </p>
            </div>
            <div className="rounded-lg bg-[#f8fafc] p-4">
              <p className="text-sm font-medium text-[#64748b]">
                Max violations
              </p>
              <p className="mt-1 text-xl font-bold text-[#101828]">
                {maxAllowedTabSwitches}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-[#dfe5ec] bg-[#fbfcfe] p-5">
            <h2 className="text-lg font-semibold text-[#101828]">
              Instructions
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[#475569]">
              <li>Enter fullscreen before beginning the quiz.</li>
              <li>Do not switch tabs or leave the quiz window.</li>
              <li>Do not exit fullscreen during the active quiz.</li>
              <li>
                The timer will start only after clicking the fullscreen start
                button.
              </li>
              <li>
                Repeated suspicious activity will auto-submit the quiz and mark
                the attempt suspicious.
              </li>
            </ul>
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
              Screenshots, screen recording, copy/paste, tab switching, and
              external search tools are not allowed. Suspicious activity may
              lead to auto-submission.
            </div>
          </div>

          {warningMessage ? (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {warningMessage}
            </div>
          ) : null}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={startQuiz}
              disabled={isSubmitting}
              className="inline-flex h-12 items-center justify-center rounded-lg bg-[#101828] px-6 text-base font-semibold text-white shadow-sm transition hover:bg-[#253044] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Enter Fullscreen and Start Quiz
            </button>
            <Link
              href="/student/dashboard"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-[#cbd5e1] bg-white px-6 text-base font-semibold text-[#17202a] transition hover:border-[#94a3b8] hover:bg-[#f8fafc]"
            >
              Back to Dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="quizguard-protected-content relative min-h-dvh overflow-hidden bg-[#f6f7fb] px-6 py-8 text-[#17202a] [user-select:none] sm:px-8 lg:px-10 [-webkit-user-select:none]">
      <StudentWatermark text={watermarkText} />
      <div
        className={`relative z-10 mx-auto max-w-6xl transition duration-200 ${
          isPrivacyOverlayVisible ? "pointer-events-none blur-sm opacity-20" : ""
        }`}
      >
        <header className="flex flex-col gap-5 border-b border-[#dfe5ec] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[#64748b]">
              QuizGuard - Electrical Department, UIT RGPV Bhopal
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#101828]">
              {quiz.title}
            </h1>
            <p className="mt-2 text-sm text-[#64748b]">
              {quiz.subjectName} - {quiz.semester}
            </p>
          </div>
          <div className="rounded-lg border border-[#dfe5ec] bg-white px-5 py-4 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase text-[#64748b]">
              Time Remaining
            </p>
            <p className="mt-1 text-3xl font-bold text-[#101828]">
              {formatSeconds(visibleRemainingSeconds)}
            </p>
          </div>
        </header>

        {warningMessage ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 shadow-sm">
            {warningMessage}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
          <section className="rounded-lg border border-[#dfe5ec] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 border-b border-[#e5eaf0] pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#64748b]">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[#101828]">
                  {currentQuestion?.text}
                </h2>
              </div>
              <span className="inline-flex w-fit rounded-full bg-[#eef2f6] px-3 py-1 text-sm font-medium text-[#334155]">
                {currentQuestion?.marks} marks
              </span>
            </div>

            {currentQuestion?.imageUrl ? (
              <div className="mt-6 rounded-lg border border-[#dfe5ec] bg-[#fbfcfe] p-3">
                <QuestionImage
                  src={currentQuestion.imageUrl}
                  alt="Question diagram"
                  className="mx-auto max-h-[420px] w-full max-w-4xl rounded-lg object-contain"
                />
              </div>
            ) : null}

            <div className="mt-6 grid gap-3">
              {currentQuestion
                ? optionLabels.map((option) => {
                    const isSelected =
                      selectedAnswers[currentQuestion.id] === option;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => selectAnswer(currentQuestion.id, option)}
                        className={`rounded-lg border p-4 text-left transition ${
                          isSelected
                            ? "border-[#101828] bg-[#eef2f6] shadow-sm"
                            : "border-[#dfe5ec] bg-white hover:border-[#a8b4c2] hover:bg-[#f8fafc]"
                        }`}
                        aria-pressed={isSelected}
                      >
                        <span className="flex gap-3">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                              isSelected
                                ? "border-[#101828] bg-[#101828] text-white"
                                : "border-[#cbd5e1] bg-white text-[#334155]"
                            }`}
                          >
                            {option}
                          </span>
                          <span className="pt-0.5 text-sm leading-6 text-[#17202a]">
                            {getOptionText(currentQuestion, option)}
                          </span>
                        </span>
                      </button>
                    );
                  })
                : null}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0 || isSubmitting}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-[#cbd5e1] bg-white px-5 text-sm font-semibold text-[#17202a] transition hover:border-[#94a3b8] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              {currentQuestionIndex === quiz.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    void submitAttempt();
                  }}
                  disabled={isSubmitting}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-[#101828] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#253044] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Submit Quiz
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToNextQuestion}
                  disabled={isSubmitting}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-[#101828] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#253044] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Next
                </button>
              )}
            </div>
          </section>

          <aside className="rounded-lg border border-[#dfe5ec] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#101828]">
              Question Status
            </h2>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {quiz.questions.map((question, index) => {
                const isAnswered = Boolean(selectedAnswers[question.id]);
                const isCurrent = index === currentQuestionIndex;

                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`h-10 rounded-lg border text-sm font-semibold transition ${
                      isCurrent
                        ? "border-[#101828] bg-[#101828] text-white"
                        : isAnswered
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-[#dfe5ec] bg-[#f8fafc] text-[#64748b]"
                    }`}
                    aria-label={`Question ${index + 1} ${
                      isAnswered ? "answered" : "unanswered"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 space-y-2 text-sm text-[#64748b]">
              <p>
                Answered:{" "}
                {
                  quiz.questions.filter((question) =>
                    Boolean(selectedAnswers[question.id]),
                  ).length
                }
              </p>
              <p>
                Unanswered:{" "}
                {
                  quiz.questions.filter(
                    (question) => !selectedAnswers[question.id],
                  ).length
                }
              </p>
              <p>
                Tab switch count: {tabSwitchCount}/{maxAllowedTabSwitches}
              </p>
              <p>
                Started:{" "}
                {startedAt
                  ? new Date(startedAt).toLocaleTimeString("en-IN")
                  : "-"}
              </p>
            </div>
          </aside>
        </div>
      </div>
      {isPrivacyOverlayVisible ? (
        <PrivacyOverlay
          onReturnToFullscreen={() => {
            void returnToFullscreen();
          }}
        />
      ) : null}
    </main>
  );
}

export default function StudentQuizAttemptPage() {
  return (
    <StudentGuard>
      <StudentQuizAttemptContent />
    </StudentGuard>
  );
}
