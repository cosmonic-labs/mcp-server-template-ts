import type { Hono, Context } from "hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (c: any) => {
  const sessionId = c.req.header("mcp-session-id");
  if (!sessionId || !transports[sessionId]) {
    return c.text("Invalid or missing session ID", 400);
  }
  const transport = transports[sessionId];
  await transport.handleRequest(c.req.raw, c.res);
  return c.text("OK");
};

/**
 * Handle POST requests for client-to-server communication
 */
const createMCPSession = async (c: Context) => {
  // Check for existing session ID
  const sessionId = c.req.header("mcp-session-id");
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    // Reuse existing transport
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(await c.req.json())) {
    // New initialization request
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => "not-a-uuid",
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        transports[sessionId] = transport;
      },
      // DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
      // locally, make sure to set:
      // enableDnsRebindingProtection: true,
      // allowedHosts: ['127.0.0.1'],
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };
    const server = new McpServer({
      name: "example-server",
      version: "1.0.0",
    });

    // ... set up server resources, tools, and prompts ...

    // Connect to the MCP server
    await server.connect(transport);
  } else {
    // Invalid request
    return c.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: No valid session ID provided",
        },
        id: null,
      },
      400,
    );
  }

  // Handle the request
  const body = await c.req.json();
  await transport.handleRequest(c.req.raw, c.res, body);
  return c.text("OK");
};

export function setupRoutes(app: Hono) {
  app.post("/v1/mcp/session", createMCPSession);
  app.get("/v1/mcp/session", handleSessionRequest);
  app.delete("/v1/mcp/session", () => {
    throw new Error("TODO");
  });
}
