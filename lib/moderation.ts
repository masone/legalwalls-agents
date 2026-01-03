import { zodTextFormat } from "openai/helpers/zod";
import { parseResponse, openai } from "./openai";
import { GuardrailTripwireTriggered } from "@openai/guardrails";
import { moderationSchema, ModerationResult } from "./schemas/moderation";

export async function moderateComment(
  id: number,
  comment: string,
): Promise<ModerationResult> {
  const promptId = "pmpt_6956b67de8e48195bad94e72e930b59f0decd9b208c49330";

  if (comment.length > 2000) {
    return {
      category: "irrelevant",
      reasoning: "Comment exceeds character limit.",
      isTranslated: false,
      isCorrected: false,
      validType: null,
      resultingText: comment,
    };
  }

  // const client = await clientWithGuardrails(); // Temporary until Responses API supports guardrails
  const client = openai;

  try {
    const response = await client.responses.create({
      model: "gpt-4o",
      // @ts-ignore - Guardrails results property
      prompt: {
        id: promptId,
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
