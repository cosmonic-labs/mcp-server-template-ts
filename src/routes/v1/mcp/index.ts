import type { Hono, Context } from "hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPTransport } from "@hono/mcp";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPTransport } = {};

/**
 * Handle HTTP requests for MCP communication
 */
const handleMCPRequest = async (c: Context) => {
  const method = c.req.method;
  const sessionId = c.req.header("mcp-session-id");
  
  // Handle POST requests (JSON-RPC messages)
  if (method === "POST") {
    let transport: StreamableHTTPTransport | undefined = undefined;
    let body: unknown = undefined;

    // If an existing transport is present
    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId];
    } else {
      // Check if this is an initialization request
      body = await c.req.json();
      if (isInitializeRequest(body)) {
        // Create new transport for initialization
        transport = new StreamableHTTPTransport({
          sessionIdGenerator: () => crypto.randomUUID(),
          onsessioninitialized: (sessionId) => {
            // Store the transport by session ID
            if (transport !== undefined) {
              transports[sessionId] = transport;
            }
          },
          // DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
          // locally, make sure to set:
          // enableDnsRebindingProtection: true,
          // allowedHosts: ['127.0.0.1'],
        });

        // Clean up transport when closed
        transport.onclose = () => {
          if (transport?.sessionId) {
            delete transports[transport.sessionId];
          }
        };

        const server = new McpServer({
          name: "example-server",
          version: "1.0.0",
        });

        // ... set up server resources, tools, and prompts ...

        // Connect to the MCP server
        await server.connect(transport as any);
      }
    }

    if (!transport) {
      return c.json(
        {
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: No valid session or initialization request",
          },
          id: null,
        },
        400,
      );
    }

    // Handle the request using the Hono-compatible transport
    if (!body) {
      body = await c.req.json();
    }
    const response = await transport.handleRequest(c, body);
    return response || c.text("OK");
  }

  // Handle GET and DELETE requests
  if (method === "GET" || method === "DELETE") {
    if (!sessionId || !transports[sessionId]) {
      return c.text("Invalid or missing session ID", 400);
    }
    
    const transport = transports[sessionId];
    const response = await transport.handleRequest(c);
    return response || c.text("OK");
  }

  // Unsupported method
  return c.text("Method not allowed", 405);
};

export function setupRoutes(app: Hono) {
  app.post("/v1/mcp/session", handleMCPRequest);
  app.get("/v1/mcp/session", handleMCPRequest);
  app.delete("/v1/mcp/session", handleMCPRequest);
}
