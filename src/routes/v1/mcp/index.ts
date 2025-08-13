import type { Hono, Context } from "hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { StreamableHTTPTransport } from "@hono/mcp";
import {
  CallToolResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import z from "zod";

// import { getCrypto } from "../../../polyfills";

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
      { sendNotification },
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
    },
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
    },
  );

  return server;
};

/**
 * Handle HTTP requests for MCP communication (stateless)
 */
const handleMCPRequest = async (c: Context) => {
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
    // TODO: use a session ID generator once we have state set up
    //
    // TODO: Use session ID to attempt to retrieve the
    // data associated with the StreamableHTTPTransport below
    //
    // Ideally we can store this state via wasmcloud:blobstore
    // that can be connected to FS underneath, rather than wasi:keyvalue
    //
    // TODO: Enable stateful or stateless mode via ENV
    //
    // TODO: Enable customer-provided state
    //   - include: previous agent request/response metadata (detect loops)
    //
    // TODO: We could consider messages being pulled/pushed to message stores?
    //   make an issue about this and we can discuss it alter, maybe a proxy component
    //   or a composed wrapper that does it.
    //
    //sessionIdGenerator: () => getCrypto().randomUUID(),

    sessionIdGenerator: undefined,

    // DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
    // locally, make sure to set:
    // enableDnsRebindingProtection: true,
    // allowedHosts: ['127.0.0.1'],
  });

  const server = createMcpServer();
  await server.connect(transport as any);

  const response = await transport.handleRequest(c, body);
  return response || c.text("OK");
};

export function setupRoutes(app: Hono) {
  app.post("/v1/mcp/session", handleMCPRequest);
  app.get("/v1/mcp/session", handleMCPRequest);
  app.delete("/v1/mcp/session", handleMCPRequest);
}
