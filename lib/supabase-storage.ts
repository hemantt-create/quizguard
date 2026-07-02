import { supabase } from "@/src/lib/supabase";

const questionImageBucket = "quiz-question-images";

type UploadQuestionImageResult =
  | {
      data: {
        imageUrl: string;
        imagePath: string;
      };
      error: null;
    }
  | {
      data: null;
      error: string;
    };

function sanitizeFileName(fileName: string) {
  const sanitized = fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized || "question-image";
}

export async function uploadQuestionImage({
  file,
  questionId,
  quizId,
}: {
  file: File;
  questionId: number;
  quizId?: number;
}): Promise<UploadQuestionImageResult> {
  if (!supabase) {
    return {
      data: null,
      error: "Supabase client is not configured.",
    };
  }

  const fileName = sanitizeFileName(file.name);
  const timestamp = Date.now();
  const basePath = quizId ? `${quizId}/${questionId}` : `temp/${questionId}`;
  const imagePath = `${basePath}/${timestamp}-${fileName}`;

  const { error } = await supabase.storage
    .from(questionImageBucket)
    .upload(imagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  const { data } = supabase.storage
    .from(questionImageBucket)
    .getPublicUrl(imagePath);

  return {
    data: {
      imageUrl: data.publicUrl,
      imagePath,
    },
    error: null,
  };
}
