import { describe, it, expect } from "vitest";
import { FeedbackRequest } from "../lib/schemas";

// Extract the function to test it directly
function formatFeedbackAsJsonl(feedbackItems: FeedbackRequest[]): string {
  return feedbackItems
    .map(({ id, ...rest }) => JSON.stringify(rest))
    .join("\n");
}

describe("bin/dataset", () => {
  describe("formatFeedbackAsJsonl", () => {
    it("returns empty string for empty array", () => {
      const result = formatFeedbackAsJsonl([]);
      expect(result).toBe("");
    });

    it("formats single feedback item as JSON without id", () => {
      const feedback: FeedbackRequest = {
        id: "test-1",
        comment: "Is this wall still there?",
        expected: {
          isTranslated: false,
          isCorrected: false,
          resultingText: "Is this wall still there?",
          category: "question",
          validType: null,
          reasoning: "User is asking a question",
        },
      };

      const result = formatFeedbackAsJsonl([feedback]);
      const parsed = JSON.parse(result);

      expect(parsed).not.toHaveProperty("id");
      expect(parsed.comment).toBe("Is this wall still there?");
      expect(parsed.expected.category).toBe("question");
    });

    it("formats multiple feedback items as newline-separated JSON", () => {
      const feedbacks: FeedbackRequest[] = [
        {
          id: "test-1",
          comment: "Is this wall still there?",
          expected: {
            isTranslated: false,
            isCorrected: false,
            resultingText: "Is this wall still there?",
            category: "question",
            validType: null,
            reasoning: "User is asking a question",
          },
        },
        {
          id: "test-2",
          comment: "This mural was painted in 2020",
          expected: {
            isTranslated: false,
            isCorrected: false,
            resultingText: "This mural was painted in 2020",
            category: "valid",
            validType: "confirmation",
            reasoning: "User confirms information",
          },
        },
      ];

      const result = formatFeedbackAsJsonl(feedbacks);
      const lines = result.split("\n");

      expect(lines).toHaveLength(2);

      const first = JSON.parse(lines[0]);
      const second = JSON.parse(lines[1]);

      expect(first.comment).toBe("Is this wall still there?");
      expect(first).not.toHaveProperty("id");

      expect(second.comment).toBe("This mural was painted in 2020");
      expect(second).not.toHaveProperty("id");
    });

    it("preserves all expected fields", () => {
      const feedback: FeedbackRequest = {
        id: "test-1",
        comment: "Hola, ¿sigue ahí?",
        expected: {
          isTranslated: true,
          isCorrected: false,
          resultingText: "Hello, is it still there?",
          category: "question",
          validType: null,
          reasoning: "Translated from Spanish",
        },
      };

      const result = formatFeedbackAsJsonl([feedback]);
      const parsed = JSON.parse(result);

      expect(parsed.expected.isTranslated).toBe(true);
      expect(parsed.expected.isCorrected).toBe(false);
      expect(parsed.expected.resultingText).toBe("Hello, is it still there?");
      expect(parsed.expected.category).toBe("question");
      expect(parsed.expected.validType).toBe(null);
      expect(parsed.expected.reasoning).toBe("Translated from Spanish");
    });
  });
});
