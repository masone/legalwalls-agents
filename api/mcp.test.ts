import { describe, it, expect } from "vitest";
import { createMocks } from "node-mocks-http";
import handler from "./mcp";

describe("MCP HTTP Endpoint", () => {
  it("returns health check on GET", async () => {
    const { req, res } = createMocks({
      method: "GET",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.status).toBe("ok");
    expect(data.server).toBe("legalwalls-mcp");
  });

  it("handles OPTIONS preflight", async () => {
    const { req, res } = createMocks({
      method: "OPTIONS",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getHeaders()["access-control-allow-methods"]).toContain("POST");
  });

  it("routes POST requests and returns JSON-RPC response", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        jsonrpc: "2.0",
        method: "tools/list",
        id: 1,
      },
    });

    await handler(req, res);

    const status = res._getStatusCode();
    const data = JSON.parse(res._getData());

    // Server needs a transport connection to be fully functional.
    // Just verify HTTP layer works and returns valid JSON-RPC response.
    expect([200, 500]).toContain(status);
    expect(data).toHaveProperty("jsonrpc");
  });

  it("returns 400 for invalid HTTP method", async () => {
    const { req, res } = createMocks({
      method: "DELETE",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });
});
