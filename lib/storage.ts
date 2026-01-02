import { put, head } from "@vercel/blob";
import { z } from "zod";
import { moderationSchema } from "./moderation";

export const moderationResultLogSchema = z.object({
  responseId: z.string(),
  commentId: z.number(),
  promptId: z.string(),
  createdAt: z.string(),
  comment: z.string(),
  moderationResult: z.lazy(() => moderationSchema),
});

export type ModerationResultLog = z.infer<typeof moderationResultLogSchema>;

const feedbackSchema = z.object({
  vote: z.boolean(),
  reason: z.string(),
});

export const moderationFeedbackLogSchema = moderationResultLogSchema.extend({
  feedback: feedbackSchema,
});

export type ModerationFeedbackLog = z.infer<typeof moderationFeedbackLogSchema>;
export type Feedback = z.infer<typeof feedbackSchema>;

const namespace = process.env.VERCEL_ENV || "development";

export function moderationResultLogPath(responseId: string): string {
  return `${namespace}/comment-${responseId}.json`;
}

export function moderationFeedbackLogPath(responseId: string): string {
  return `${namespace}/feedback-${responseId}.json`;
}

export async function logModerationResult(entry: ModerationResultLog) {
  const data = moderationResultLogSchema.parse(entry);
  await put(moderationResultLogPath(entry.responseId), JSON.stringify(data), {
    contentType: "application/json",
    access: "public",
  });
}

export async function getModerationResultLog(
  responseId: string,
): Promise<ModerationResultLog | null> {
  const path = moderationResultLogPath(responseId);
  const metadata = await head(path);
  if (!metadata) return null;

  const response = await fetch(metadata.url);
  const text = await response.text();
  return moderationResultLogSchema.parse(JSON.parse(text));
}

export async function saveModerationFeedback(
  responseId: string,
  feedback: Feedback,
): Promise<ModerationFeedbackLog> {
  const moderationResult = await getModerationResultLog(responseId);
  if (!moderationResult) {
    throw new Error(`Moderation result not found for responseId: ${responseId}`);
  }

  const feedbackLog: ModerationFeedbackLog = {
    ...moderationResult,
    feedback,
  };

  const data = moderationFeedbackLogSchema.parse(feedbackLog);
  await put(moderationFeedbackLogPath(responseId), JSON.stringify(data), {
    contentType: "application/json",
    access: "public",
  });

  return data;
}
