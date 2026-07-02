"use client";

import Link from "next/link";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { QuestionImage } from "@/app/_components/question-image";
import { uploadQuestionImage } from "@/lib/supabase-storage";
import type { CorrectOption, Question, Quiz } from "@/types/quiz";

type QuizForm = {
  title: string;
  subjectName: string;
  semester: string;
  durationMinutes: string;
  maxTabSwitches: string;
  startDateTime: string;
  endDateTime: string;
};

type QuestionForm = Omit<Question, "marks"> & {
  marks: string;
};

export type QuizFormValues = {
  title: string;
  subjectName: string;
  semester: string;
  durationMinutes: number;
  maxTabSwitches: number;
  startDateTime: string;
  endDateTime: string;
  questions: Question[];
};

type AdminQuizFormProps = {
  heading: string;
  description: string;
  backHref: string;
  cancelHref: string;
  submitLabel: string;
  success: string;
  errorMessage?: string;
  warning?: string;
  initialQuiz?: Quiz;
  onSave: (values: QuizFormValues) => void | Promise<void>;
};

const emptyQuizForm: QuizForm = {
  title: "",
  subjectName: "",
  semester: "",
  durationMinutes: "",
  maxTabSwitches: "",
  startDateTime: "",
  endDateTime: "",
};

const acceptedImageExtensions = [".png", ".jpg", ".jpeg", ".webp"];
const acceptedImageTypes = ["image/png", "image/jpeg", "image/webp"];

function createQuestion(): QuestionForm {
  return {
    id: Date.now() + Math.floor(Math.random() * 100000),
    text: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOption: "A",
    marks: "",
  };
}

function isAcceptedImageFile(file: File) {
  const fileExtension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  const hasAcceptedExtension = acceptedImageExtensions.includes(fileExtension);
  const hasAcceptedType =
    !file.type || acceptedImageTypes.includes(file.type.toLowerCase());

  return hasAcceptedExtension && hasAcceptedType;
}

function getInitialQuizForm(initialQuiz?: Quiz): QuizForm {
  if (!initialQuiz) {
    return emptyQuizForm;
  }

  return {
    title: initialQuiz.title,
    subjectName: initialQuiz.subjectName,
    semester: initialQuiz.semester,
    durationMinutes: String(initialQuiz.durationMinutes),
    maxTabSwitches: String(initialQuiz.maxTabSwitches),
    startDateTime: initialQuiz.startDateTime,
    endDateTime: initialQuiz.endDateTime,
  };
}

function getInitialQuestions(initialQuiz?: Quiz): QuestionForm[] {
  if (!initialQuiz) {
    return [createQuestion()];
  }

  return initialQuiz.questions.map((question) => ({
    ...question,
    marks: String(question.marks),
  }));
}

export function AdminQuizForm({
  heading,
  description,
  backHref,
  cancelHref,
  submitLabel,
  success,
  errorMessage,
  warning,
  initialQuiz,
  onSave,
}: AdminQuizFormProps) {
  const [quizForm, setQuizForm] = useState<QuizForm>(() =>
    getInitialQuizForm(initialQuiz),
  );
  const [questions, setQuestions] = useState<QuestionForm[]>(() =>
    getInitialQuestions(initialQuiz),
  );
  const [error, setError] = useState("");
  const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({});
  const [uploadingQuestionIds, setUploadingQuestionIds] = useState<
    Record<number, boolean>
  >({});
  const hasActiveImageUpload = Object.values(uploadingQuestionIds).some(Boolean);

  function updateQuizField(field: keyof QuizForm, value: string) {
    setQuizForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateQuestionField(
    questionId: number,
    field: keyof QuestionForm,
    value: string,
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              [field]: value,
            }
          : question,
      ),
    );
  }

  function updateQuestionImage(
    questionId: number,
    imageUrl?: string,
    imagePath?: string,
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              imageUrl,
              imagePath,
            }
          : question,
      ),
    );
  }

  function clearUploadError(questionId: number) {
    setUploadErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[questionId];
      return nextErrors;
    });
  }

  function addQuestion() {
    setQuestions((current) => [...current, createQuestion()]);
  }

  function removeQuestion(questionId: number) {
    setQuestions((current) =>
      current.filter((question) => question.id !== questionId),
    );
    clearUploadError(questionId);
    setUploadingQuestionIds((current) => {
      const nextUploadingQuestionIds = { ...current };
      delete nextUploadingQuestionIds[questionId];
      return nextUploadingQuestionIds;
    });
  }

  async function handleQuestionImageChange(
    questionId: number,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!isAcceptedImageFile(file)) {
      setUploadErrors((current) => ({
        ...current,
        [questionId]: "Please upload a PNG, JPG, JPEG, or WEBP image.",
      }));
      return;
    }

    clearUploadError(questionId);
    setUploadingQuestionIds((current) => ({
      ...current,
      [questionId]: true,
    }));

    try {
      const result = await uploadQuestionImage({
        file,
        questionId,
        quizId: initialQuiz?.id,
      });

      if (result.error) {
        setUploadErrors((current) => ({
          ...current,
          [questionId]: `Image upload failed: ${result.error}`,
        }));
        return;
      }

      if (!result.data) {
        setUploadErrors((current) => ({
          ...current,
          [questionId]: "Image upload failed: no public URL was returned.",
        }));
        return;
      }

      updateQuestionImage(
        questionId,
        result.data.imageUrl,
        result.data.imagePath,
      );
    } catch (error) {
      setUploadErrors((current) => ({
        ...current,
        [questionId]: `Image upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      }));
    } finally {
      setUploadingQuestionIds((current) => ({
        ...current,
        [questionId]: false,
      }));
    }
  }

  function removeQuestionImage(questionId: number) {
    clearUploadError(questionId);
    updateQuestionImage(questionId);
  }

  function validateForm() {
    const requiredQuizFields: Array<keyof QuizForm> = [
      "title",
      "subjectName",
      "semester",
      "durationMinutes",
      "maxTabSwitches",
      "startDateTime",
      "endDateTime",
    ];

    const hasMissingQuizField = requiredQuizFields.some(
      (field) => !quizForm[field].trim(),
    );

    if (hasMissingQuizField) {
      return "Please fill in all quiz details.";
    }

    if (!Number.isFinite(Number(quizForm.durationMinutes))) {
      return "Duration must be a valid number.";
    }

    if (!Number.isFinite(Number(quizForm.maxTabSwitches))) {
      return "Maximum allowed tab switches must be a valid number.";
    }

    if (Number(quizForm.durationMinutes) <= 0) {
      return "Duration must be greater than zero.";
    }

    if (Number(quizForm.maxTabSwitches) < 0) {
      return "Maximum allowed tab switches cannot be negative.";
    }

    if (questions.length === 0) {
      return "Please add at least one MCQ question.";
    }

    if (hasActiveImageUpload) {
      return "Please wait for the image upload to finish before saving.";
    }

    const hasIncompleteQuestion = questions.some((question) => {
      return (
        !question.text.trim() ||
        !question.optionA.trim() ||
        !question.optionB.trim() ||
        !question.optionC.trim() ||
        !question.optionD.trim() ||
        !question.marks.trim()
      );
    });

    if (hasIncompleteQuestion) {
      return "Please complete every question, option, and marks field.";
    }

    const hasInvalidMarks = questions.some(
      (question) =>
        !Number.isFinite(Number(question.marks)) || Number(question.marks) <= 0,
    );

    if (hasInvalidMarks) {
      return "Marks must be greater than zero for every question.";
    }

    return "";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    onSave({
      title: quizForm.title.trim(),
      subjectName: quizForm.subjectName.trim(),
      semester: quizForm.semester.trim(),
      durationMinutes: Number(quizForm.durationMinutes),
      maxTabSwitches: Number(quizForm.maxTabSwitches),
      startDateTime: quizForm.startDateTime,
      endDateTime: quizForm.endDateTime,
      questions: questions.map((question) => ({
        id: question.id,
        text: question.text.trim(),
        optionA: question.optionA.trim(),
        optionB: question.optionB.trim(),
        optionC: question.optionC.trim(),
        optionD: question.optionD.trim(),
        correctOption: question.correctOption,
        marks: Number(question.marks),
        imageUrl: question.imageUrl,
        imagePath: question.imagePath,
      })),
    });
  }

  return (
    <main className="min-h-dvh bg-[#f6f7fb] px-6 py-8 text-[#17202a] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-[#dfe5ec] pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[#64748b]">
              QuizGuard - Electrical Department, UIT RGPV Bhopal
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#101828]">
              {heading}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748b]">
              {description}
            </p>
          </div>
          <Link
            href={backHref}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#cbd5e1] bg-white px-5 text-sm font-semibold text-[#17202a] transition hover:border-[#94a3b8] hover:bg-[#f8fafc]"
          >
            Back
          </Link>
        </header>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <section className="rounded-lg border border-[#dfe5ec] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-[#101828]">
                Quiz Details
              </h2>
              <p className="mt-2 text-sm text-[#64748b]">
                Set the basic details and anti-cheating limits for this
                department assessment.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[#334155]">
                  Quiz title
                </span>
                <input
                  value={quizForm.title}
                  onChange={(event) =>
                    updateQuizField("title", event.target.value)
                  }
                  type="text"
                  placeholder="Weekly Network Theory Quiz"
                  className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-4 text-base outline-none transition placeholder:text-[#94a3b8] focus:border-[#101828] focus:ring-4 focus:ring-[#101828]/10"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#334155]">
                  Subject name
                </span>
                <input
                  value={quizForm.subjectName}
                  onChange={(event) =>
                    updateQuizField("subjectName", event.target.value)
                  }
                  type="text"
                  placeholder="Electrical Machines"
                  className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-4 text-base outline-none transition placeholder:text-[#94a3b8] focus:border-[#101828] focus:ring-4 focus:ring-[#101828]/10"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#334155]">
                  Semester
                </span>
                <input
                  value={quizForm.semester}
                  onChange={(event) =>
                    updateQuizField("semester", event.target.value)
                  }
                  type="text"
                  placeholder="5th Semester"
                  className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-4 text-base outline-none transition placeholder:text-[#94a3b8] focus:border-[#101828] focus:ring-4 focus:ring-[#101828]/10"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#334155]">
                  Duration in minutes
                </span>
                <input
                  value={quizForm.durationMinutes}
                  onChange={(event) =>
                    updateQuizField("durationMinutes", event.target.value)
                  }
                  type="number"
                  min="1"
                  placeholder="30"
                  className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-4 text-base outline-none transition placeholder:text-[#94a3b8] focus:border-[#101828] focus:ring-4 focus:ring-[#101828]/10"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#334155]">
                  Maximum allowed tab switches
                </span>
                <input
                  value={quizForm.maxTabSwitches}
                  onChange={(event) =>
                    updateQuizField("maxTabSwitches", event.target.value)
                  }
                  type="number"
                  min="0"
                  placeholder="3"
                  className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-4 text-base outline-none transition placeholder:text-[#94a3b8] focus:border-[#101828] focus:ring-4 focus:ring-[#101828]/10"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#334155]">
                  Start date and time
                </span>
                <input
                  value={quizForm.startDateTime}
                  onChange={(event) =>
                    updateQuizField("startDateTime", event.target.value)
                  }
                  type="datetime-local"
                  className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-4 text-base outline-none transition focus:border-[#101828] focus:ring-4 focus:ring-[#101828]/10"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-[#334155]">
                  End date and time
                </span>
                <input
                  value={quizForm.endDateTime}
                  onChange={(event) =>
                    updateQuizField("endDateTime", event.target.value)
                  }
                  type="datetime-local"
                  className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-4 text-base outline-none transition focus:border-[#101828] focus:ring-4 focus:ring-[#101828]/10"
                />
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-[#dfe5ec] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#101828]">
                  MCQ Questions
                </h2>
                <p className="mt-2 text-sm text-[#64748b]">
                  Add the question text, four options, correct option, and
                  marks. Upload circuit diagrams, waveform images, or logic
                  diagrams if required.
                </p>
              </div>
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#101828] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#253044]"
              >
                Add Question
              </button>
            </div>

            <div className="space-y-5">
              {questions.map((question, index) => (
                <article
                  key={question.id}
                  className="rounded-lg border border-[#dfe5ec] bg-[#fbfcfe] p-4"
                >
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-base font-semibold text-[#101828]">
                      Question {index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-[#fecaca] bg-white px-4 text-sm font-semibold text-[#b42318] transition hover:bg-[#fff1f2]"
                    >
                      Remove Question
                    </button>
                  </div>

                  <div className="grid gap-4">
                    <label className="block">
                      <span className="text-sm font-medium text-[#334155]">
                        Question text
                      </span>
                      <textarea
                        value={question.text}
                        onChange={(event) =>
                          updateQuestionField(
                            question.id,
                            "text",
                            event.target.value,
                          )
                        }
                        rows={3}
                        placeholder="Enter MCQ question"
                        className="mt-2 w-full rounded-lg border border-[#cbd5e1] bg-white px-4 py-3 text-base outline-none transition placeholder:text-[#94a3b8] focus:border-[#101828] focus:ring-4 focus:ring-[#101828]/10"
                      />
                    </label>

                    <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-white p-4">
                      <label className="block">
                        <span className="text-sm font-medium text-[#334155]">
                          Circuit diagram / question image (optional)
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-[#64748b]">
                          Upload circuit diagrams, waveform images, or logic
                          diagrams if required.
                        </span>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                          disabled={Boolean(uploadingQuestionIds[question.id])}
                          onChange={(event) => {
                            void handleQuestionImageChange(question.id, event);
                          }}
                          className="mt-3 block w-full text-sm text-[#475569] file:mr-4 file:rounded-lg file:border-0 file:bg-[#101828] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#253044] disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </label>

                      {uploadingQuestionIds[question.id] ? (
                        <p className="mt-3 text-sm font-medium text-[#64748b]">
                          Uploading image...
                        </p>
                      ) : null}

                      {uploadErrors[question.id] ? (
                        <div className="mt-3 rounded-lg border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm font-medium text-[#b42318]">
                          {uploadErrors[question.id]}
                        </div>
                      ) : null}

                      {question.imageUrl ? (
                        <div className="mt-4 rounded-lg border border-[#dfe5ec] bg-[#f8fafc] p-3">
                          <QuestionImage
                            src={question.imageUrl}
                            alt="Question diagram preview"
                            className="mx-auto max-h-72 w-full max-w-3xl rounded-lg object-contain"
                          />
                          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs leading-5 text-[#64748b]">
                              Image ready for this question.
                            </p>
                            <button
                              type="button"
                              onClick={() => removeQuestionImage(question.id)}
                              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#fecaca] bg-white px-4 text-sm font-semibold text-[#b42318] transition hover:bg-[#fff1f2]"
                            >
                              Remove Image
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {(["optionA", "optionB", "optionC", "optionD"] as const).map(
                        (field, optionIndex) => (
                          <label key={field} className="block">
                            <span className="text-sm font-medium text-[#334155]">
                              Option {String.fromCharCode(65 + optionIndex)}
                            </span>
                            <input
                              value={question[field]}
                              onChange={(event) =>
                                updateQuestionField(
                                  question.id,
                                  field,
                                  event.target.value,
                                )
                              }
                              type="text"
                              placeholder={`Option ${String.fromCharCode(
                                65 + optionIndex,
                              )}`}
                              className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-4 text-base outline-none transition placeholder:text-[#94a3b8] focus:border-[#101828] focus:ring-4 focus:ring-[#101828]/10"
                            />
                          </label>
                        ),
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-medium text-[#334155]">
                          Correct option
                        </span>
                        <select
                          value={question.correctOption}
                          onChange={(event) =>
                            updateQuestionField(
                              question.id,
                              "correctOption",
                              event.target.value as CorrectOption,
                            )
                          }
                          className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-4 text-base outline-none transition focus:border-[#101828] focus:ring-4 focus:ring-[#101828]/10"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-[#334155]">
                          Marks
                        </span>
                        <input
                          value={question.marks}
                          onChange={(event) =>
                            updateQuestionField(
                              question.id,
                              "marks",
                              event.target.value,
                            )
                          }
                          type="number"
                          min="1"
                          placeholder="1"
                          className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-4 text-base outline-none transition placeholder:text-[#94a3b8] focus:border-[#101828] focus:ring-4 focus:ring-[#101828]/10"
                        />
                      </label>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {questions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-6 text-center text-sm text-[#64748b]">
                No questions added yet.
              </div>
            ) : null}
          </section>

          {error ? (
            <div className="rounded-lg border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm font-medium text-[#b42318]">
              {error}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-lg border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm font-medium text-[#b42318]">
              {errorMessage}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm font-medium text-[#15803d]">
              {success}
            </div>
          ) : null}

          {warning ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
              {warning}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              href={cancelHref}
              className="inline-flex h-12 items-center justify-center rounded-lg border border-[#cbd5e1] bg-white px-6 text-base font-semibold text-[#17202a] transition hover:border-[#94a3b8] hover:bg-[#f8fafc]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-[#101828] px-6 text-base font-semibold text-white shadow-sm transition hover:bg-[#253044]"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
