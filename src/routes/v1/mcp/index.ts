import type { Hono } from "hono";
import { MCPServer } from "./server.js";

export function setupRoutes(app: Hono) {
  app.post("/mcp", MCPServer.handleMCPRequest);
}
