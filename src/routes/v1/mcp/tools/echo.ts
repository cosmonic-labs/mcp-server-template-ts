import z from "zod";

import { MCPServer } from "../server";

export function setupTool(server: MCPServer) {
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
