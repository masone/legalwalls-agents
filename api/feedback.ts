import { VercelRequest, VercelResponse } from "@vercel/node";
import { isAuthorized } from "../lib/auth";
import { storeFeedback } from "../lib/feedback";
import { feedbackRequestSchema } from "../lib/schemas";

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
