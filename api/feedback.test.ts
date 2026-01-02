import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMocks } from "node-mocks-http";

const { mockBlobPut, mockBlobHead } = vi.hoisted(() => {
  return {
    mockBlobPut: vi.fn(),
    mockBlobHead: vi.fn(),
  };
});

vi.mock("openai", () => {
  return {
    default: class OpenAI {},
  };
});

vi.mock("@vercel/blob", () => ({
  put: mockBlobPut,
  head: mockBlobHead,
}));

describe("api/feedback", () => {
  const validToken = "test-token";
  const mockModerationLog = {
    responseId: "resp_123",
    commentId: 1,
    promptId: "prompt_456",
    createdAt: "2026-01-02T00:00:00Z",
    comment: "test comment",
    moderationResult: {
      isTranslated: false,
      isCorrected: false,
      resultingText: "test comment",
      category: "valid",
      validType: null,
      reasoning: "looks fine",
    },
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.API_KEY = validToken;
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "test";
    mockBlobPut.mockResolvedValue({ url: "https://blob.vercel.com/test" });

    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 401 if no authorization header is present", async () => {
    const handler = (await import("./feedback")).default;
    const { req, res } = createMocks({
      method: "POST",
      body: { responseId: "resp_123", vote: true, reason: "good" },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 if authorization token is invalid", async () => {
    const handler = (await import("./feedback")).default;
    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: "Bearer invalid-token" },
      body: { responseId: "resp_123", vote: true, reason: "good" },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({ error: "Unauthorized" });
  });

  it("skips auth in development mode", async () => {
    process.env.NODE_ENV = "development";
    const handler = (await import("./feedback")).default;

    mockBlobHead.mockResolvedValue(null);

    const { req, res } = createMocks({
      method: "POST",
      body: { responseId: "resp_123", vote: true, reason: "good" },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(404);
  });

  it("returns 400 if responseId is missing", async () => {
    const handler = (await import("./feedback")).default;
    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${validToken}` },
      body: { vote: true, reason: "good" },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({ error: "invalid parameters" });
  });

  it("returns 400 if vote is missing", async () => {
    const handler = (await import("./feedback")).default;
    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${validToken}` },
      body: { responseId: "resp_123", reason: "good" },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({ error: "invalid parameters" });
  });

  it("returns 400 if reason is missing", async () => {
    const handler = (await import("./feedback")).default;
    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${validToken}` },
      body: { responseId: "resp_123", vote: true },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({ error: "invalid parameters" });
  });

  it("returns 404 if moderation result not found", async () => {
    const handler = (await import("./feedback")).default;

    mockBlobHead.mockResolvedValue(null);

    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${validToken}` },
      body: { responseId: "resp_nonexistent", vote: true, reason: "good" },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({
      error: "Moderation result not found for responseId: resp_nonexistent",
    });
  });

  it("returns 200 and saves feedback on success", async () => {
    const handler = (await import("./feedback")).default;

    mockBlobHead.mockResolvedValue({
      url: "https://blob.vercel.com/test/moderation/resp_123.json",
    });

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockModerationLog),
    } as Response);

    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${validToken}` },
      body: { responseId: "resp_123", vote: true, reason: "accurate response" },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      ...mockModerationLog,
      feedback: { vote: true, reason: "accurate response" },
    });
  });

  it("stores feedback to blob storage (including downvotes)", async () => {
    const handler = (await import("./feedback")).default;

    mockBlobHead.mockResolvedValue({
      url: "https://blob.vercel.com/test/moderation/resp_123.json",
    });
    mockBlobPut.mockResolvedValue({ url: "https://blob.vercel.com/test" });

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockModerationLog),
    } as Response);

    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${validToken}` },
      body: { responseId: "resp_123", vote: false, reason: "incorrect" },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(mockBlobPut).toHaveBeenCalledWith(
      expect.stringContaining("feedback/resp_123.json"),
      expect.any(String),
      expect.objectContaining({ contentType: "application/json" }),
    );
  });

  it("returns 500 if storage fails", async () => {
    const handler = (await import("./feedback")).default;

    mockBlobHead.mockResolvedValue({
      url: "https://blob.vercel.com/test/moderation/resp_123.json",
    });

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockModerationLog),
    } as Response);

    mockBlobPut.mockRejectedValue(new Error("Blob storage error"));

    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${validToken}` },
      body: { responseId: "resp_123", vote: true, reason: "good" },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({ error: "Blob storage error" });
  });
});
