import type { Hono } from "hono";
import { MCPServer } from "./server";
import { MCP_SERVER_BASE_PATH } from "../../../config";

export function setupRoutes(app: Hono) {
  app.post(MCP_SERVER_BASE_PATH, MCPServer.handleMCPRequest);
}
