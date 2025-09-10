import { McpServer as UpstreamMCPServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { StreamableHTTPTransport } from "@hono/mcp";
import { Context } from "hono";

import { setupAllTools } from "./tools";
import { setupAllResources } from "./resources";

export class MCPServer extends UpstreamMCPServer {
  constructor(opts: any) {
    super(opts);
    const server = this;
    setupAllTools(server);
    setupAllResources(server);
  }

  /**
   * Handle HTTP requests for MCP communication (stateless)
   */
  static async handleMCPRequest(c: Context) {
    const method = c.req.method;

    // Only POST is supported right now
    if (method !== "POST") {
      return c.text("Method not allowed", 405);
    }

    // Handle POST requests (JSON-RPC messages)
    const body = await c.req.json();

    // Create a new transport and server for each request (stateless approach)
    // This ensures each request is handled independently without relying on stored state
    const transport = new StreamableHTTPTransport({
      sessionIdGenerator: undefined,

      // DNS rebinding protection is disabled by default for backwards compatibility.
      enableDnsRebindingProtection: true,
      // allowedHosts: ['127.0.0.1'],
    });

    // TODO: Transport generation/hydration as a Hono middleware?

    const server = new MCPServer({
      name: "example-server",
      version: "1.0.0",
    });
    await server.connect(transport as any);

    const response = await transport.handleRequest(c, body);
    return response || c.text("OK");
  }
}
