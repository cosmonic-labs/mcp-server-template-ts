import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { setupResource } from "./greeting";

export function setupAllResources(server: McpServer) {
  setupResource(server);
}
