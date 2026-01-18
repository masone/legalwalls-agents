import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { loadWalls, loadWall } from "./api";

async function loadWallsHandler() {
  try {
    const walls = await loadWalls();
    return {
      type: "text" as const,
      text: JSON.stringify(walls),
    };
  } catch (error) {
    return {
      type: "text" as const,
      text: JSON.stringify({
        error: `Failed to load walls: ${(error as Error).message}`,
      }),
    };
  }
}

async function loadWallHandler(wallId: string) {
  try {
    const wallIdNum = parseInt(wallId, 10);
    if (isNaN(wallIdNum)) {
      return {
        type: "text" as const,
        text: JSON.stringify({ error: `Invalid wall ID: ${wallId}` }),
      };
    }
    const wall = await loadWall(wallIdNum);
    return {
      type: "text" as const,
      text: JSON.stringify(wall),
    };
  } catch (error) {
    return {
      type: "text" as const,
      text: JSON.stringify({
        error: `Failed to load wall: ${(error as Error).message}`,
      }),
    };
  }
}

function createServer() {
  const s = new Server(
    {
      name: "legalwalls-mcp",
      version: process.env.MCP_VERSION as string,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  s.setRequestHandler(ListToolsRequestSchema as any, async () => ({
    tools: [
      {
        name: "loadWalls",
        description:
          "Get a list of all walls with basic information (id, title, address)",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "loadWall",
        description:
          "Get detailed information about a specific wall including its comments",
        inputSchema: {
          type: "object",
          properties: {
            wallId: {
              type: "string",
              description: "The ID of the wall to load",
            },
          },
          required: ["wallId"],
        },
      },
    ],
  }));

  s.setRequestHandler(CallToolRequestSchema as any, async (request: any) => {
    const { name, arguments: args } = request.params;

    if (name === "loadWalls") {
      const result = await loadWallsHandler();
      return { content: [result] };
    }

    if (name === "loadWall") {
      const wallId = (args as { wallId?: string }).wallId;
      if (!wallId) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: "wallId is required" }),
            },
          ],
        };
      }
      const result = await loadWallHandler(wallId);
      return { content: [result] };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ error: `Unknown tool: ${name}` }),
        },
      ],
    };
  });

  return s;
}

const server = createServer();

export { server };
