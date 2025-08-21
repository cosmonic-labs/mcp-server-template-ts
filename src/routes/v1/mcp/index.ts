import type { Hono } from "hono";
import { MCPServer } from "./server.js";

export const MCP_BASE_PATH = "/v1/mcp";

export function setupRoutes(app: Hono) {
  app.post(MCP_BASE_PATH, MCPServer.handleMCPRequest);
}
