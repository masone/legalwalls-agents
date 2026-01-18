import { VercelRequest, VercelResponse } from "@vercel/node";
import { ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { server } from "../lib/mcp.js";

export default async (req: VercelRequest, res: VercelResponse) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  // res.setHeader("Access-Control-Allow-Origin", "https://chatgpt.openai.com");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Health check endpoint
  if (req.method === "GET") {
    return res.status(200).json({
      status: "ok",
      server: "legalwalls-mcp",
      message: "MCP server running",
    });
  }

  // MCP request handling
  if (req.method === "POST") {
    try {
      const body = req.body;

      const result = await (server as any).request(body);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: ErrorCode.InternalError,
          message: `Internal error: ${(error as Error).message}`,
        },
      });
    }
  }

  return res.status(400).json({ error: "Invalid request" });
};
