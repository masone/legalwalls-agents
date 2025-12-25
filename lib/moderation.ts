import { zodTextFormat } from 'openai/helpers/zod';
import { openai, parseResponse } from './openai';
import { z } from 'zod';

export const moderationSchema = z.object({
  isTranslated: z.boolean().describe('True if the comment was not in English'),
  isCorrected: z.boolean().describe('True if the comment contained spelling or grammatical errors that were corrected'),
  resultingText: z.string().describe('The comment text in English. If the original was not English, this is the translation. If it was English, this is the original text.'),

  category: z.enum([
    'valid',
    'question',
    'irrelevant',
    'harmful',
    'report'
  ]).describe('The classification of the comment based on its content'),

  reasoning: z.string().describe('Brief explanation of the classification decision'),
});

export type ModerationResult = z.infer<typeof moderationSchema>;

export async function moderateComment(comment: string): Promise<ModerationResult> {
  const response = await openai.responses.create({
    model: "gpt-4o",
    prompt: {
      id: "pmpt_694d565c232c8193bc9743d0364b844c0ec0781f6c9a1ed0",      
      variables: {
        comment
      },
    },
    text: {
      format: zodTextFormat(moderationSchema, "moderation_result"),
    },
  });

  const outputText = response.output_text;
  if (!outputText) {
    throw new Error("No output_text returned from Responses API");
  }

  return parseResponse(outputText, moderationSchema);
}