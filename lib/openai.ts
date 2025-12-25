import OpenAI from 'openai';
import { z } from 'zod';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function parseResponse<T>(outputText: string, schema: z.Schema<T>): T {
  let json: unknown;

  try {
    json = JSON.parse(outputText);
  } catch (err) {
    throw new Error(
      `Model did not return valid JSON. Output was: ${outputText.slice(0, 100)}`
    );
  }

  return schema.parse(json);
}