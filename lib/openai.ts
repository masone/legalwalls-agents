import OpenAI from "openai";
import { GuardrailsOpenAI } from "@openai/guardrails";
import { z } from "zod";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function clientWithGuardrails() {
  return await GuardrailsOpenAI.create(guardrailsConfig);
}

export function parseResponse<T>(outputText: string, schema: z.Schema<T>): T {
  let json: unknown;

  try {
    json = JSON.parse(outputText);
  } catch (err) {
    throw new Error(
      `Model did not return valid JSON. Output was: ${outputText.slice(0, 100)}`,
    );
  }

  return schema.parse(json);
}

const guardrailsConfig = {
  version: 1,
  pre_flight: {
    version: 1,
    guardrails: [
      {
        name: "Moderation",
        config: {
          categories: [
            "sexual",
            "sexual/minors",
            "hate",
            "hate/threatening",
            "harassment",
            "harassment/threatening",
            "self-harm",
            "self-harm/intent",
            "self-harm/instructions",
            "violence",
            "violence/graphic",
            "illicit/violent",
          ],
        },
      },
    ],
  },
  input: {
    version: 1,
    guardrails: [
      {
        name: "Jailbreak",
        config: {
          confidence_threshold: 0.7,
          model: "gpt-4.1-mini",
          include_reasoning: false,
        },
      },
    ],
  },
  output: {
    version: 1,
    guardrails: [],
  },
};
