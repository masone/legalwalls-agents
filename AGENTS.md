# AGENTS.md

## Purpose

This repository hosts a small TypeScript service for Legal Walls moderation workflows.
It runs as Vercel serverless functions and does two main jobs:

- review a wall comment with OpenAI-backed moderation logic
- accept and store moderation feedback as JSON in Vercel Blob

Keep changes narrow, practical, and easy to verify. Favor fixing the actual source of a problem over layering extra abstractions onto a small codebase.

## Stack

- Runtime: Node lts on Vercel
- Language: TypeScript with `strict` mode enabled
- Module format: CommonJS
- Test runner: Vitest
- Validation: Zod
- Persistence: Vercel Blob
- AI integration: OpenAI Responses API with guardrails support code in place

## Repo Map

- `api/feedback.ts`: authenticated POST handler that validates and stores feedback
- `api/review.ts`: authenticated GET handler that loads a wall, finds a comment, and returns a moderation result
- `lib/api.ts`: Legal Walls API client helpers
- `lib/auth.ts`: bearer-token auth logic, skipped in development
- `lib/feedback.ts`: Vercel Blob read/write helpers
- `lib/moderation.ts`: moderation orchestration and OpenAI response parsing
- `lib/openai.ts`: OpenAI client setup, response parsing, guardrails config
- `lib/schemas/*.ts`: shared Zod schemas and exported inferred types
- `bin/dataset.ts`: emits stored feedback as JSONL for training or evaluation data
- `api/*.test.ts`, `bin/*.test.ts`: Vitest coverage for handlers and dataset formatting

## Commands

- `npm test`: run Vitest once
- `npm run typecheck`: run TypeScript with no emit
- `npm run dev`: run local Vercel dev server on port 3001
- `npm run format`: format the repo with Prettier
- `npm run lint`: check formatting with Prettier
- `npm run dataset`: export feedback as JSONL

Run the smallest relevant validation after changes. For behavior changes in handlers or shared logic, prefer at least `npm test`. For type-level or signature changes, run `npm run typecheck` too.

## Environment

These environment variables are relevant:

- `API_KEY`: shared bearer token for internal auth and downstream Legal Walls API access
- `API_URL`: base URL for the Legal Walls API used by `lib/api.ts`
- `OPENAI_API_KEY`: OpenAI credential
- `VERCEL_ENV`: namespace selector for feedback blob storage
- `NODE_ENV=development`: disables auth checks in `lib/auth.ts`

Do not hardcode secrets, fallback tokens, or production URLs.

## Working Rules

### API behavior

- Preserve the existing route contracts unless the task explicitly asks for an API change.
- Keep error responses simple JSON objects with stable shapes.
- Keep auth checks at the handler boundary.
- When adding request fields, update the corresponding Zod schema first and let handlers consume parsed data.

### Shared logic

- Put cross-route behavior in `lib/` instead of duplicating it in handlers.
- Reuse existing schemas and types from `lib/schemas/`.
- Keep helper functions small and directly tied to the current workflow. Avoid introducing framework-style layers in this repo.

### OpenAI and moderation

- Treat `lib/moderation.ts` and `lib/openai.ts` as sensitive integration code.
- Do not change the prompt id, response schema, or guardrails behavior unless the task specifically requires it.
- Preserve the guarantee that moderation returns data matching `moderationSchema`.
- If you change moderation output fields, update the schema, any dependent tests, and feedback payload expectations together.

### Feedback storage

- Feedback objects must continue to validate against `feedbackRequestSchema`.
- Keep blob key naming stable unless a migration is part of the task.
- Respect the `VERCEL_ENV` namespace split between environments.

## Testing Expectations

- Add or update tests when changing handler behavior, validation, auth, storage behavior, or moderation result parsing.
- Prefer mocking network and external services in Vitest rather than calling real APIs.
- Follow the existing test style in `api/*.test.ts`: reset modules, set env vars explicitly, and stub globals when needed.
- Keep tests close to the code they exercise.

## Style Guidelines

- Match the existing code style and keep implementations straightforward.
- Prefer explicit names over short abbreviations.
- Use Zod schemas as the source of truth for payload structure.
- Avoid unrelated refactors while solving a focused task.
- Add comments only when a non-obvious decision needs explanation.

## Known Constraints

- `tsconfig.json` currently includes `lib/**/*` and `api/**/*`; changes under `bin/` are not covered by `npm run typecheck` unless that config is expanded.
- Auth is intentionally bypassed in development mode; do not remove that behavior unless requested.
- `api/review.ts` depends on the Legal Walls API returning a wall object with a `comments` array.

## When Editing

- Read the relevant handler, schema, and test file before making behavior changes.
- Prefer updating existing files over introducing new modules unless there is a clear reuse boundary.
- Validate only what your change affects, but mention any unrelated failures you notice.
- If a task touches external API behavior or stored feedback shape, call that out clearly in your summary.
