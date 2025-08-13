import { McpServer as UpstreamMCPServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import * as startNotificationStream from "./start-notification-stream.js";

export function setupAllTools<S extends UpstreamMCPServer>(server: S) {
  startNotificationStream.setupTool(server);
}
