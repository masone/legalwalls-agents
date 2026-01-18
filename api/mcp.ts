import { VercelRequest, VercelResponse } from "@vercel/node";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "../lib/mcp";

export default async (req: VercelRequest, res: VercelResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Health check endpoint
  if (req.method === "GET") {
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({
      status: "ok",
      server: "legalwalls-mcp",
      message: "MCP server running",
    });
  }

  if (req.method === "POST") {
    try {
      const server = createServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // Stateless mode for serverless
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      if (!res.headersSent) {
        res.setHeader("Content-Type", "application/json");
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: `Internal error: ${(error as Error).message}`,
          },
        });
      }
    }
  } else {
    res.setHeader("Content-Type", "application/json");
    res.status(400).json({ error: "Invalid request" });
  }
};
