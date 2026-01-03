import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMocks } from "node-mocks-http";

const { mockResponsesCreate, mockBlobPut } = vi.hoisted(() => {
  return {
    mockResponsesCreate: vi.fn(),
    mockBlobPut: vi.fn(),
  };
});

vi.mock("openai", () => {
  return {
    default: class OpenAI {
      responses = {
        create: mockResponsesCreate,
      };
    },
  };
});

vi.mock("@openai/guardrails", () => ({
  GuardrailsOpenAI: {
    create: vi.fn().mockResolvedValue({
      responses: {
        create: mockResponsesCreate,
      },
    }),
  },
  GuardrailTripwireTriggered: class extends Error {},
}));

vi.mock("@vercel/blob", () => ({
  put: mockBlobPut,
  head: vi.fn(),
}));

describe("api/review", () => {
  const validToken = "test-token";
  const apiUrl = "http://api.example.com";

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.API_KEY = validToken;
    process.env.API_URL = apiUrl;
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "test";
    mockBlobPut.mockResolvedValue({ url: "https://blob.vercel.com/test" });

    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 401 if no authorization header is present", async () => {
    const handler = (await import("./review")).default;
    const { req, res } = createMocks({
      method: "GET",
      query: { wallId: "1", commentId: "1" },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 if authorization token is invalid", async () => {
    const handler = (await import("./review")).default;
    const { req, res } = createMocks({
      method: "GET",
      headers: { authorization: "Bearer invalid-token" },
      query: { wallId: "1", commentId: "1" },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({ error: "Unauthorized" });
  });

  it("skips auth in development mode", async () => {
    process.env.NODE_ENV = "development";
    const handler = (await import("./review")).default;

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => "null",
    } as Response);

    const { req, res } = createMocks({
      method: "GET",
      query: { wallId: "1", commentId: "1" },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(404);
  });

  it("returns 400 if wallId or commentId is missing", async () => {
    const handler = (await import("./review")).default;
    const { req, res } = createMocks({
      method: "GET",
      headers: { authorization: `Bearer ${validToken}` },
      query: { wallId: "1" },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: "wallId & commentId is required",
    });
  });

  it("returns 404 if wall is not found (fetch returns null)", async () => {
    const handler = (await import("./review")).default;
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => "null",
    } as Response);

    const { req, res } = createMocks({
      method: "GET",
      headers: { authorization: `Bearer ${validToken}` },
      query: { wallId: "999", commentId: "1" },
    });

    await handler(req as any, res as any);

    expect(fetch).toHaveBeenCalledWith(
      `${apiUrl}/walls/999`,
      expect.objectContaining({
        headers: { Authorization: `Bearer ${validToken}` },
      }),
    );
    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({ error: "Wall not found" });
  });

  it("returns 404 if comment is not found in the wall", async () => {
    const handler = (await import("./review")).default;
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          id: 1,
          comments: [{ id: 2, body: "other comment" }],
        }),
    } as Response);

    const { req, res } = createMocks({
      method: "GET",
      headers: { authorization: `Bearer ${validToken}` },
      query: { wallId: "1", commentId: "1" },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({ error: "Comment not found" });
  });

  it("returns 200 and moderation result on success", async () => {
    const handler = (await import("./review")).default;
    const mockComment = { id: 1, body: "suspicious comment" };
    const mockModerationResult = {
      isTranslated: false,
      isCorrected: false,
      resultingText: "suspicious comment",
      category: "valid",
      validType: null,
      reasoning: "looks fine",
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          id: 1,
          comments: [mockComment],
        }),
    } as Response);

    mockResponsesCreate.mockResolvedValue({
      id: "resp_123",
      created_at: Math.floor(Date.now() / 1000),
      output_text: JSON.stringify(mockModerationResult),
    });

    const { req, res } = createMocks({
      method: "GET",
      headers: { authorization: `Bearer ${validToken}` },
      query: { wallId: "1", commentId: "1" },
    });

    await handler(req as any, res as any);

    expect(mockResponsesCreate).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(mockModerationResult);
  });

  it("returns 500 if moderation fails", async () => {
    const handler = (await import("./review")).default;
    const mockComment = { id: 1, body: "comment" };
    const errorMessage = "OpenAI error";

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          id: 1,
          comments: [mockComment],
        }),
    } as Response);

    mockResponsesCreate.mockRejectedValue(new Error(errorMessage));

    const { req, res } = createMocks({
      method: "GET",
      headers: { authorization: `Bearer ${validToken}` },
      query: { wallId: "1", commentId: "1" },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({ error: errorMessage });
  });
});
