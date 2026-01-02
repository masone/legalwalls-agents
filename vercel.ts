import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  functions: {
    "api/review.ts": {
      maxDuration: 30,
    },
    "api/feedback.ts": {
      maxDuration: 10,
    },
  },
};
