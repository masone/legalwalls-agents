import { put, list } from "@vercel/blob";
import { feedbackRequestSchema, FeedbackRequest } from "./schemas";

const namespace = process.env.VERCEL_ENV || "development";

export async function storeFeedback(
  feedback: FeedbackRequest,
): Promise<FeedbackRequest> {
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

export async function listFeedback(
  limit: number = 100,
): Promise<FeedbackRequest[]> {
  const { blobs } = await list({
    prefix: `${namespace}/feedback-`,
    limit,
  });

  const feedbackItems = await Promise.all(
    blobs.map(async (blob) => {
      const response = await fetch(blob.url);
      const json = await response.json();
      return feedbackRequestSchema.parse(json);
    }),
  );

  return feedbackItems;
}
