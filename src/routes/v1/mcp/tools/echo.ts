import z from "zod";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function setupTool(server: McpServer) {
  // Register a tool specifically for testing resumability
  server.tool(
    "echo",
    "Echoes back the provided message",
    {
      message: z.string()
    },
    async ({ message }) => ({
      content: [{ type: "text", text: `Tool echo: ${message}` }],
    })
  );
}
