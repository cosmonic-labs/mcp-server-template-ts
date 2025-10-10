/**
 * Example: SSE Transport for MCP Server
 *
 * This example demonstrates how to use Server-Sent Events (SSE) transport
 * for persistent connections to the MCP server.
 *
 * SSE is useful when you need:
 * - Server-initiated messages (push notifications)
 * - A persistent connection
 * - Deployment on platforms supporting long-lived connections
 */

import { Hono } from "hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "../src/vendor/@hono/mcp/index.js";
import { streamSSE } from "../src/vendor/@hono/mcp/streaming.js";

const app = new Hono();

// Create MCP server instance
const mcpServer = new McpServer({
  name: "sse-example-server",
  version: "1.0.0",
});

// Set up your tools and resources
mcpServer.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "echo",
      description: "Echoes back the input message",
      inputSchema: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "Message to echo back",
          },
        },
        required: ["message"],
      },
    },
  ],
}));

mcpServer.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "echo") {
    return {
      content: [
        {
          type: "text",
          text: `Echo: ${request.params.arguments?.message}`,
        },
      ],
    };
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Initialize SSE transport
// The '/messages' path is where clients will POST their messages
const transport = new SSEServerTransport("/messages", {
  enableDnsRebindingProtection: true,
  allowedHosts: ["localhost", "127.0.0.1"],
  allowedOrigins: ["http://localhost:3000"],
});

/**
 * SSE Stream Endpoint
 *
 * Clients connect to this endpoint to receive server-sent events.
 * The connection remains open and the server can push messages at any time.
 */
app.get("/sse", async (c) => {
  // Connect MCP server to transport on first connection
  if (!(mcpServer as any).isConnected?.()) {
    await mcpServer.connect(transport as any);
  }

  // Return SSE stream
  return streamSSE(c, transport.handleStream());
});

/**
 * Message POST Endpoint
 *
 * Clients send their messages (requests, notifications) to this endpoint.
 * The endpoint is specified in the SSEServerTransport constructor.
 */
app.post("/messages", async (c) => {
  return await transport.handlePostMessage(c);
});

/**
 * Health check endpoint
 */
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    transport: "SSE",
    sessionId: transport.sessionId,
  });
});

export default app;

/**
 * Usage:
 *
 * 1. Start the server:
 *    npm run dev
 *
 * 2. Connect with MCP Inspector:
 *    npm run inspector
 *
 *    In the inspector:
 *    - Select "SSE" transport
 *    - Connect to: http://localhost:8080/sse
 *    - POST endpoint: http://localhost:8080/messages
 *
 * 3. The SSE connection will remain open and you can send/receive messages
 *
 * Note: For production deployment on platforms like Cloudflare Workers,
 * you'll need to wrap this in a Durable Object to maintain the persistent
 * connection across different worker instances.
 */
