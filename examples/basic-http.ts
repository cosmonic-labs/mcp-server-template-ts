/**
 * Example: Basic Stateless HTTP Transport
 *
 * This is the simplest MCP server setup using stateless HTTP transport.
 * Each request is independent and doesn't maintain session state.
 *
 * This is ideal for:
 * - Serverless deployments
 * - Simple, stateless MCP servers
 * - When you don't need server-initiated messages
 */

import { Hono } from "hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPTransport } from "../src/vendor/@hono/mcp/index.js";
import type { Context } from "hono";

const app = new Hono();

/**
 * Stateless MCP Handler
 *
 * Creates a new transport and server for each request.
 * This ensures each request is handled independently.
 */
app.post("/v1/mcp", async (c: Context) => {
  // Parse the incoming MCP request
  const body = await c.req.json();

  // Create a new transport for this request (stateless)
  const transport = new StreamableHTTPTransport({
    // No sessionIdGenerator = stateless mode
    // Clients don't need to track session IDs

    // Enable security features
    enableDnsRebindingProtection: true,
    allowedHosts: ["localhost", "127.0.0.1"],
  });

  // Create a new MCP server instance
  const mcpServer = new McpServer({
    name: "basic-stateless-server",
    version: "1.0.0",
  });

  // Define your server capabilities
  setupServerHandlers(mcpServer);

  // Connect server to transport
  await mcpServer.connect(transport as any);

  // Handle the request and return response
  return await transport.handleRequest(c, body);
});

/**
 * Set up MCP server handlers
 */
function setupServerHandlers(server: McpServer) {
  // List available tools
  server.setRequestHandler("tools/list", async () => ({
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
      {
        name: "get_time",
        description: "Returns the current server time",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  }));

  // Handle tool calls
  server.setRequestHandler("tools/call", async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "echo":
        return {
          content: [
            {
              type: "text",
              text: `Echo: ${args?.message || ""}`,
            },
          ],
        };

      case "get_time":
        return {
          content: [
            {
              type: "text",
              text: `Current server time: ${new Date().toISOString()}`,
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  // List available resources
  server.setRequestHandler("resources/list", async () => ({
    resources: [
      {
        uri: "server://info",
        name: "Server Information",
        description: "Basic information about this MCP server",
        mimeType: "application/json",
      },
    ],
  }));

  // Handle resource reads
  server.setRequestHandler("resources/read", async (request) => {
    const { uri } = request.params;

    if (uri === "server://info") {
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                name: "basic-stateless-server",
                version: "1.0.0",
                transport: "HTTP (Stateless)",
                capabilities: ["tools", "resources"],
              },
              null,
              2
            ),
          },
        ],
      };
    }

    throw new Error(`Unknown resource: ${uri}`);
  });

  // List available prompts
  server.setRequestHandler("prompts/list", async () => ({
    prompts: [
      {
        name: "greeting",
        description: "A friendly greeting prompt",
        arguments: [
          {
            name: "name",
            description: "Name of the person to greet",
            required: true,
          },
        ],
      },
    ],
  }));

  // Handle prompt gets
  server.setRequestHandler("prompts/get", async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "greeting") {
      const userName = args?.name || "there";
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Say hello to ${userName} and introduce yourself as an MCP server.`,
            },
          },
        ],
      };
    }

    throw new Error(`Unknown prompt: ${name}`);
  });
}

/**
 * Health check endpoint
 */
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    server: "basic-stateless-mcp",
    transport: "HTTP",
    mode: "stateless",
  });
});

/**
 * Server info endpoint (non-MCP)
 */
app.get("/", (c) => {
  return c.json({
    name: "Basic Stateless MCP Server",
    version: "1.0.0",
    endpoints: {
      mcp: "/v1/mcp",
      health: "/health",
    },
    capabilities: ["tools", "resources", "prompts"],
    documentation: "https://modelcontextprotocol.io/",
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
 *    - Select "HTTP" transport
 *    - Connect to: http://localhost:8080/v1/mcp
 *
 * 3. Try the tools:
 *    - echo: Send a message and get it echoed back
 *    - get_time: Get the current server time
 *
 * 4. Try the resources:
 *    - server://info: Get server information
 *
 * 5. Try the prompts:
 *    - greeting: Get a greeting prompt
 *
 * Benefits of stateless mode:
 * - Simple deployment on serverless platforms
 * - No session management required
 * - Each request is independent
 * - Easy to scale horizontally
 *
 * Limitations:
 * - No server-initiated messages
 * - No session persistence
 * - Client must send full context with each request
 */
