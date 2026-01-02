import { VercelRequest, VercelResponse } from "@vercel/node";
import { saveModerationFeedback } from "../lib/storage";
import { isAuthorized } from "../lib/auth";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (!isAuthorized(request)) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  const { responseId, vote, reason } = request.body ?? {};

  if (!responseId || vote === undefined || !reason) {
    return response.status(400).json({ error: "invalid parameters" });
  }

  try {
    const feedbackLog = await saveModerationFeedback(responseId, { vote, reason });
    return response.status(200).json(feedbackLog);
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      return response.status(404).json({ error: error.message });
    }
    return response.status(500).json({ error: error.message });
  }
}
