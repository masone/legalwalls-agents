import { zodTextFormat } from "openai/helpers/zod";
import { parseResponse, clientWithGuardrails } from "./openai";
import { GuardrailTripwireTriggered } from "@openai/guardrails";
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
    .enum(["confirmation", "closed", "illegal", "other"])
    .describe(
      "When classified as 'valid', the nature of the comment based on its content",
    )
    .nullable(),

  reasoning: z
    .string()
    .describe("Brief explanation of the classification decision"),
});

export type ModerationResult = z.infer<typeof moderationSchema>;

export async function moderateComment(
  comment: string,
): Promise<ModerationResult> {
  if (comment.length > 1000) {
    return {
      category: "irrelevant",
      reasoning: "Comment exceeds character limit.",
      isTranslated: false,
      isCorrected: false,
      validType: null,
      resultingText: comment,
    };
  }

  const client = await clientWithGuardrails(); // Temporary until Responses API supports guardrails
  // const client = openai;

  try {
    const response = await client.responses.create({
      model: "gpt-4o",
      // @ts-ignore - Guardrails results property
      prompt: {
        id: "pmpt_6956b67de8e48195bad94e72e930b59f0decd9b208c49330",
        variables: {
          comment,
        },
      },
      input: comment, // duplication for pre-flight guardrails
      text: {
        format: zodTextFormat(moderationSchema, "moderation_result"),
      },
    });

    const responseText = response.output_text;
    if (!responseText) {
      throw new Error("No output_text returned from Responses API");
    }

    return parseResponse(responseText, moderationSchema);
  } catch (error) {
    if (error instanceof GuardrailTripwireTriggered) {
      return {
        category: "harmful",
        reasoning: "Comment flagged by guardrails: " + (error as Error).message,
        isTranslated: false,
        isCorrected: false,
        validType: null,
        resultingText: comment,
      };
    }
    throw error;
  }
}
