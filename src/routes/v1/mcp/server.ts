import z from "zod";

import {
  CallToolResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";

import { McpServer as UpstreamMCPServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { StreamableHTTPTransport } from "@hono/mcp";
import { Context } from "hono";

export class MCPServer extends UpstreamMCPServer {
  constructor(opts: any) {
    super(opts);
    const server = this;

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
      // TODO: remove versioning (this will be handled by either a composed outer component or the HTTP provider)
      //
      // TODO: Current tool doesn't work 'Server does not support logging (required for notifications/message)'
      //
      //sessionIdGenerator: () => getCrypto().randomUUID(),

      sessionIdGenerator: undefined,

      // DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
      // locally, make sure to set:
      // enableDnsRebindingProtection: true,
      // allowedHosts: ['127.0.0.1'],
    });

    const server = new MCPServer({
      name: "example-server",
      version: "1.0.0",
    });
    await server.connect(transport as any);

    const response = await transport.handleRequest(c, body);
    return response || c.text("OK");
  }
}
