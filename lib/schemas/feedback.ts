import { z } from "zod";
import { moderationSchema } from "./moderation";

export const feedbackRequestSchema = z.object({
  id: z.string(),
  comment: z.string(),
  expected: moderationSchema,
});

export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>;
