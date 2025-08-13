import { McpServer as UpstreamMCPServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import * as greetingResource from "./greeting.js";

export function setupAllResources<S extends UpstreamMCPServer>(server: S) {
  greetingResource.setupResource(server);
}
