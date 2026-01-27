import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Hono, Context } from "hono";
import { StreamableHTTPTransport } from "@hono/mcp";
import { SERVER_NAME, SERVER_VERSION } from "../../../constants";
import { setupAllTools } from "./tools/index";
import { setupAllResources } from "./resources/index";

export const MCP_BASE_PATH = "/v1/mcp";

const mcpServer = new McpServer({
  name: SERVER_NAME,
  version: SERVER_VERSION,
});
setupAllTools(mcpServer);
setupAllResources(mcpServer);

const transport = new StreamableHTTPTransport({
  sessionIdGenerator: undefined,
  enableDnsRebindingProtection: true,
  // allowedHosts: ['127.0.0.1'],
});

export function setupMCPRoutes(app: Hono) {
  app.post(MCP_BASE_PATH, async (context: Context) => {
    if (!mcpServer.isConnected()) {
      await mcpServer.connect(transport);
    }

    return await transport.handleRequest(context);
  });
}
