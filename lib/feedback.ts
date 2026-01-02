import { put } from "@vercel/blob";
import { feedbackRequestSchema } from "../api/feedback";
import { z } from "zod";

export type Feedback = z.infer<typeof feedbackRequestSchema>;

const namespace = process.env.VERCEL_ENV || "development";

export async function storeFeedback(feedback: Feedback): Promise<Feedback> {
  await put(
    `${namespace}/feedback-${feedback.id}.json`,
    JSON.stringify(feedback),
    {
      contentType: "application/json",
      access: "public",
    },
  );
  return feedback;
}
