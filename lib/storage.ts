import { put } from "@vercel/blob";
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

const namespace = process.env.VERCEL_ENV || "development"

export function moderationResultLogPath(entry: ModerationResultLog): string {
  return `${namespace}/moderation/comment-${entry.commentId}.json`;
}

export async function logModerationResult(entry: ModerationResultLog) {
  const data = moderationResultLogSchema.parse(entry);
  await put(moderationResultLogPath(entry), JSON.stringify(data), {
    contentType: "application/json",
    access: "public",
  });
}
