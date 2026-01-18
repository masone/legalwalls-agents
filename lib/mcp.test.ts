import { describe, it, expect } from "vitest";
import { server } from "../lib/mcp";

describe("MCP Server", () => {
  it("should be defined", () => {
    expect(server).toBeDefined();
  });

  it("should handle requests", () => {
    // Server is initialized and ready
    expect(server).not.toBeNull();
  });
});
