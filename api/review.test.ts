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

  const createMockWall = (overrides?: any) => ({
    id: 1,
    title: "Test Wall",
    status: "open",
    location: {
      country: "US",
      name: "New York",
      lat: 40.7128,
      lng: -74.006,
      address: "123 Main St",
    },
    locked: null,
    streetview: {
      lat: 40.7128,
      lng: -74.006,
      zoom: 20,
      heading: 0,
      pitch: 0,
      sphere: true,
    },
    nearby_stores: [],
    nearby_walls: [],
    description: "A test wall",
    comments: [],
    created_at: new Date().toISOString(),
    ...overrides,
  });

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

    const mockWall = createMockWall();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockWall),
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
    const mockWall = createMockWall({
      comments: [{ id: 2, body: "other comment", feedback: "report", report_type: "private", created_at: new Date().toISOString() }],
    });
    
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockWall),
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
    const mockComment = { id: 1, body: "suspicious comment", feedback: "report" as const, report_type: "private" as const, created_at: new Date().toISOString() };
    const mockModerationResult = {
      isTranslated: false,
      isCorrected: false,
      resultingText: "suspicious comment",
      category: "valid",
      validType: null,
      reasoning: "looks fine",
    };

    const mockWall = createMockWall({
      comments: [mockComment],
    });

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockWall),
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
    const mockComment = { id: 1, body: "comment", feedback: "report" as const, report_type: "private" as const, created_at: new Date().toISOString() };
    const errorMessage = "OpenAI error";

    const mockWall = createMockWall({
      comments: [mockComment],
    });

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockWall),
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
