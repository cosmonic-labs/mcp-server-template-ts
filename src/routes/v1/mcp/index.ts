import type { Hono, Context } from "hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPTransport } from "@hono/mcp";
import {
  CallToolResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import z from "zod";
/**
 * Simple UUID v4 implementation for environments without crypto.randomUUID
 */
function generateUUID(): string {
  const hex = "0123456789abcdef";
  let uuid = "";

  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += "-";
    } else if (i === 14) {
      uuid += "4"; // Version 4
    } else if (i === 19) {
      uuid += hex[(Math.random() * 4) | 8]; // Variant
    } else {
      uuid += hex[(Math.random() * 16) | 0];
    }
  }

  return uuid;
}

/**
 * Create a new MCP server instance with configured tools and resources
 */
const createMcpServer = () => {
  const server = new McpServer({
    name: "example-server",
    version: "1.0.0",
  });

  // Register a tool specifically for testing resumability
  server.tool(
    "start-notification-stream",
    "Starts sending periodic notifications for testing resumability",
    {
      interval: z
        .number()
        .describe("Interval in milliseconds between notifications")
        .default(100),
      count: z
        .number()
        .describe("Number of notifications to send (0 for 100)")
        .default(10),
    },
    async (
      { interval, count },
      { sendNotification }
    ): Promise<CallToolResult> => {
      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      let counter = 0;

      while (count === 0 || counter < count) {
        counter++;
        try {
          await sendNotification({
            method: "notifications/message",
            params: {
              level: "info",
              data: `Periodic notification #${counter} at ${new Date().toISOString()}`,
            },
          });
        } catch (error) {
          console.error("Error sending notification:", error);
        }
        // Wait for the specified interval
        await sleep(interval);
      }

      return {
        content: [
          {
            type: "text",
            text: `Started sending periodic notifications every ${interval}ms`,
          },
        ],
      };
    }
  );

  // Create a simple resource at a fixed URI
  server.resource(
    "greeting-resource",
    "https://example.com/greetings/default",
    { mimeType: "text/plain" },
    async (): Promise<ReadResourceResult> => {
      return {
        contents: [
          {
            uri: "https://example.com/greetings/default",
            text: "Hello, world!",
          },
        ],
      };
    }
  );

  return server;
};

/**
 * Handle HTTP requests for MCP communication (stateless)
 */
const handleMCPRequest = async (c: Context) => {
  const method = c.req.method;
  const sessionId = c.req.header("mcp-session-id");

  // Handle POST requests (JSON-RPC messages)
  if (method === "POST") {
    const body = await c.req.json();
    
    // Create a new transport and server for each request (stateless approach)
    // This ensures each request is handled independently without relying on stored state
    const transport = new StreamableHTTPTransport({
      sessionIdGenerator: () => sessionId || generateUUID(),
      // DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
      // locally, make sure to set:
      // enableDnsRebindingProtection: true,
      // allowedHosts: ['127.0.0.1'],
    });

    const server = createMcpServer();
    await server.connect(transport as any);
    
    try {
      const response = await transport.handleRequest(c, body);
      return response || c.text("OK");
    } catch (error) {
      console.error("Error handling MCP request:", error);
      
      // Handle cases where the request cannot be processed
      const errorResponse = {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal error processing request",
          data: error instanceof Error ? error.message : String(error)
        },
        id: (body as any)?.id || null,
      };
      
      // Use c.text with JSON string to avoid any Response API issues
      return c.text(JSON.stringify(errorResponse), 500, {
        'Content-Type': 'application/json',
      });
    }
  }

  // Handle GET and DELETE requests (for streaming/subscription management)
  if (method === "GET" || method === "DELETE") {
    // In stateless mode, we create a temporary transport to handle the request
    // Note: This may not support long-lived connections, but handles the protocol gracefully
    try {
      const transport = new StreamableHTTPTransport({
        sessionIdGenerator: () => sessionId || generateUUID(),
        // DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
        // locally, make sure to set:
        // enableDnsRebindingProtection: true,
        // allowedHosts: ['127.0.0.1'],
      });

      const server = createMcpServer();
      await server.connect(transport as any);
      
      const response = await transport.handleRequest(c);
      return response || c.text("OK");
    } catch (error) {
      console.error("Error handling GET/DELETE request:", error);
      const errorResponse = {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal error processing request",
          data: error instanceof Error ? error.message : String(error)
        },
        id: null,
      };
      
      // Use c.text with JSON string to avoid any Response API issues
      return c.text(JSON.stringify(errorResponse), 500, {
        'Content-Type': 'application/json',
      });
    }
  }

  // Unsupported method
  return c.text("Method not allowed", 405);
};

export function setupRoutes(app: Hono) {
  app.post("/v1/mcp/session", handleMCPRequest);
  app.get("/v1/mcp/session", handleMCPRequest);
  app.delete("/v1/mcp/session", handleMCPRequest);
}