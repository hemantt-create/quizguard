export type CorrectOption = "A" | "B" | "C" | "D";
export type ViolationType =
  | "TAB_SWITCH"
  | "WINDOW_BLUR"
  | "FULLSCREEN_EXIT"
  | "COPY_ATTEMPT"
  | "PASTE_ATTEMPT"
  | "SCREENSHOT_ATTEMPT"
  | "DEVTOOLS_ATTEMPT"
  | "BLOCKED_SHORTCUT";
export type AttemptStatus = "Normal" | "Warning" | "Suspicious";

export type ViolationLog = {
  type: ViolationType;
  timestamp: string;
  count: number;
};

export type Question = {
  id: number;
  text: string;
  imageUrl?: string;
  imagePath?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: CorrectOption;
  marks: number;
};

export type Quiz = {
  id: number;
  title: string;
  subjectName: string;
  semester: string;
  durationMinutes: number;
  maxTabSwitches: number;
  startDateTime: string;
  endDateTime: string;
  questions: Question[];
  createdAt: string;
};

export type QuizAttempt = {
  attemptId: number;
  quizId: number;
  quizTitle: string;
  studentName?: string;
  rollNumber?: string;
  studentSemester?: string;
  subject: string;
  semester: string;
  score: number;
  totalMarks: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  selectedAnswers: Record<number, CorrectOption>;
  startedAt: string;
  submittedAt: string;
  timeTakenSeconds: number;
  tabSwitchCount: number;
  status: AttemptStatus;
  violationLogs: ViolationLog[];
};

export type StudentIdentity = {
  name: string;
  rollNumber: string;
  semester: string;
  loginTime: string;
};

export type AdminIdentity = {
  email: string;
  loginTime: string;
};
