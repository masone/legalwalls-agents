import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMocks } from "node-mocks-http";

const { mockBlobPut } = vi.hoisted(() => {
  return {
    mockBlobPut: vi.fn(),
  };
});

vi.mock("@vercel/blob", () => ({
  put: mockBlobPut,
  list: vi.fn(),
}));

describe("api/feedback", () => {
  const validToken = "test-token";

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.API_KEY = validToken;
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "test";
    mockBlobPut.mockResolvedValue({ url: "https://blob.vercel.com/test" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 401 if no authorization header is present", async () => {
    const handler = (await import("./feedback")).default;
    const { req, res } = createMocks({
      method: "POST",
      body: {},
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
      body: {},
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({ error: "Unauthorized" });
  });

  it("skips auth in development mode", async () => {
    process.env.NODE_ENV = "development";
    const handler = (await import("./feedback")).default;

    const { req, res } = createMocks({
      method: "POST",
      body: {},
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData()).error).toEqual("invalid parameters");
  });

  it("returns 400 if required parameters are missing", async () => {
    const handler = (await import("./feedback")).default;
    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${validToken}` },
      body: {},
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData()).error).toEqual("invalid parameters");
  });

  it("returns 400 if comment is missing", async () => {
    const handler = (await import("./feedback")).default;
    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${validToken}` },
      body: {
        id: "test-1",
        expected: {
          isTranslated: false,
          isCorrected: false,
          resultingText: "Test",
          category: "question",
          validType: null,
          reasoning: "Test reasoning",
        },
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData()).error).toEqual("invalid parameters");
  });

  it("returns 400 if expected is invalid", async () => {
    const handler = (await import("./feedback")).default;
    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${validToken}` },
      body: {
        id: "test-1",
        comment: "Is this wall still there?",
        expected: {
          category: "invalid-category",
        },
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData()).error).toEqual("invalid parameters");
  });

  it("stores feedback and returns 200 on success", async () => {
    const handler = (await import("./feedback")).default;
    const feedbackData = {
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

    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${validToken}` },
      body: feedbackData,
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(feedbackData);
    expect(mockBlobPut).toHaveBeenCalledWith(
      "test/feedback-test-1.json",
      JSON.stringify(feedbackData),
      expect.objectContaining({
        contentType: "application/json",
        access: "public",
      }),
    );
  });

  it("stores feedback with valid category", async () => {
    const handler = (await import("./feedback")).default;
    const feedbackData = {
      id: "test-2",
      comment: "This mural was painted in 2020",
      expected: {
        isTranslated: false,
        isCorrected: false,
        resultingText: "This mural was painted in 2020",
        category: "valid",
        validType: "confirmation",
        reasoning: "User confirms information about the artwork",
      },
    };

    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${validToken}` },
      body: feedbackData,
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(feedbackData);
  });
});
