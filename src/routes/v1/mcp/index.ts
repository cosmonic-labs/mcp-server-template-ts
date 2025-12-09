import type { Hono } from "hono";
import { MCPServer } from "./server.js";
import { MCP_SERVER_BASE_PATH } from "../../../config.js";

export function setupRoutes(app: Hono) {
  app.post(MCP_SERVER_BASE_PATH, MCPServer.handleMCPRequest);
}
