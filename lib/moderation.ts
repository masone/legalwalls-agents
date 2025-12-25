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

  // TODO: same author as submitter, instagrams, links, etc.
  category: z
    .enum(["valid", "question", "irrelevant", "harmful", "report"])
    .describe("The classification of the comment based on its content"),

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
      resultingText: comment,
    };
  }

  const client = await clientWithGuardrails();

  try {
    const response = await client.responses.create({
      model: "gpt-4o",
      // @ts-ignore - Guardrails results property
      prompt: {
        id: "pmpt_694d565c232c8193bc9743d0364b844c0ec0781f6c9a1ed0",
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
        resultingText: comment,
      };
    }
    throw error;
  }
}
