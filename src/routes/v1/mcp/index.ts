import type { Hono } from "hono";
import { MCPServer } from "./server.js";

export function setupRoutes(app: Hono) {
  app.post("/mcp", MCPServer.handleMCPRequest);
  // TODO: add some semantic HTTP codes and errors for the GET/DELETE endpoints
  // app.get("/mcp", MCPServer.handleMCPRequest);
  // app.delete("/mcp", MCPServer.handleMCPRequest);
}
