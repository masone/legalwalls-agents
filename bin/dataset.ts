import { listFeedback } from "../lib/feedback";
import { FeedbackRequest } from "../lib/schemas";
import dotenv from "dotenv";

dotenv.config();

function formatFeedbackAsJsonl(feedbackItems: FeedbackRequest[]): string {
  return feedbackItems
    .map(({ id, ...rest }) => JSON.stringify(rest))
    .join("\n");
}

async function main() {
  const feedbackItems = await listFeedback();
  const jsonl = formatFeedbackAsJsonl(feedbackItems);
  console.log(jsonl);
}

main().catch(console.error);
