import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import * as startNotificationStream from "./echo";

export function setupAllTools(server: McpServer) {
  startNotificationStream.setupTool(server);
}
