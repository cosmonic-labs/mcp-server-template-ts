import { McpServer as UpstreamMCPServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import * as startNotificationStream from "./echo.js";

export function setupAllTools<S extends UpstreamMCPServer>(server: S) {
  startNotificationStream.setupTool(server);
}
