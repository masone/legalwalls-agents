import { z } from "zod";

export const moderationSchema = z.object({
  isTranslated: z.boolean().describe("True if the comment was not in English"),
  isCorrected: z
    .boolean()
    .describe(
      "True if the comment contained spelling or grammatical errors that were corrected",
    ),
  resultingText: z
    .string()
    .describe(
      "The comment text in English. If the original was not English, this is the translation. If it was English, this is the original text.",
    ),

  category: z
    .enum(["valid", "question", "irrelevant", "harmful"])
    .describe("The classification of the comment based on its content"),

  validType: z
    .enum(["confirmation", "closed", "illegal", "private", "other"])
    .describe(
      "When classified as 'valid', the nature of the comment based on its content",
    )
    .nullable(),

  reasoning: z
    .string()
    .describe("Brief explanation of the classification decision"),
});

export type ModerationResult = z.infer<typeof moderationSchema>;

export const feedbackRequestSchema = z.object({
  id: z.string(),
  comment: z.string(),
  expected: moderationSchema,
});

export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>;
