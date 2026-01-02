import { VercelRequest, VercelResponse } from "@vercel/node";
import { isAuthorized } from "../lib/auth";
import { moderationSchema } from "../lib/moderation";
import { storeFeedback } from "../lib/feedback";
import { z } from "zod";

export const feedbackRequestSchema = z.object({
  id: z.string(),
  comment: z.string(),
  expected: moderationSchema,
});

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (!isAuthorized(request)) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  const parsed = feedbackRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "invalid parameters" });
  }

  const feedback = await storeFeedback(parsed.data);
  return response.status(200).json(feedback);
}
