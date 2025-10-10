/**
 * Example: MCP Server with OAuth Authentication
 *
 * This example demonstrates how to add OAuth 2.0 authentication to your MCP server
 * using the built-in auth router and middleware.
 */

import { Hono } from "hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPTransport } from "../src/vendor/@hono/mcp/index.js";
import {
  mcpAuthRouter,
  ProxyOAuthServerProvider,
  authenticateClient,
} from "../src/vendor/@hono/mcp/auth/index.js";
import type { Context } from "hono";

const app = new Hono();

/**
 * Set up OAuth Provider
 *
 * This example uses ProxyOAuthServerProvider to delegate authentication
 * to an external OAuth server. You can also implement your own provider
 * for full control.
 */
const authProvider = new ProxyOAuthServerProvider({
  endpoints: {
    // Replace with your actual OAuth server endpoints
    authorizationUrl: "https://auth.example.com/oauth2/authorize",
    tokenUrl: "https://auth.example.com/oauth2/token",
    revocationUrl: "https://auth.example.com/oauth2/revoke",
  },

  /**
   * Verify access token with your auth server
   */
  verifyAccessToken: async (token) => {
    // In production, validate token with your auth server
    // For this example, we'll do a simple check
    try {
      const response = await fetch("https://auth.example.com/oauth2/tokeninfo", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Invalid token");
      }

      const data = await response.json();
      return {
        token,
        clientId: data.client_id,
        scopes: data.scope.split(" "),
        expiresAt: data.exp,
      };
    } catch (error) {
      throw new Error("Token verification failed");
    }
  },

  /**
   * Fetch client information
   */
  getClient: async (clientId) => {
    // In production, fetch from your database or auth server
    // For this example, we'll use a hardcoded client
    if (clientId === "demo-client") {
      return {
        client_id: "demo-client",
        client_secret: "demo-secret",
        redirect_uris: ["http://localhost:3000/callback"],
        scope: "openid email profile mcp:read mcp:write",
      };
    }
    return undefined;
  },
});

/**
 * Mount OAuth Router
 *
 * This provides all the OAuth endpoints:
 * - GET/POST /authorize - Authorization endpoint
 * - POST /token - Token endpoint
 * - POST /register - Client registration (optional)
 * - POST /revoke - Token revocation (optional)
 * - GET /.well-known/oauth-authorization-server - Server metadata
 */
app.route(
  "/",
  mcpAuthRouter({
    provider: authProvider,
    issuerUrl: new URL("https://auth.example.com"),
    baseUrl: new URL("http://localhost:8080"), // Your MCP server URL
    serviceDocumentationUrl: new URL("https://docs.example.com/mcp"),
    scopesSupported: ["openid", "email", "profile", "mcp:read", "mcp:write"],

    // Customize rate limits (optional)
    tokenOptions: {
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        limit: 50, // 50 requests per window
      },
    },
  })
);

/**
 * Protected MCP Endpoint
 *
 * This endpoint requires OAuth authentication.
 */
app.post(
  "/v1/mcp",
  // Authenticate client first
  authenticateClient({ clientsStore: authProvider.clientsStore }),
  async (c: Context) => {
    // Client is authenticated - access client info
    const client = c.get("client");
    console.log("Authenticated client:", client.client_id);

    // Create transport for this request
    const transport = new StreamableHTTPTransport({
      enableDnsRebindingProtection: true,
      allowedHosts: ["localhost", "127.0.0.1"],
    });

    // Create MCP server instance
    const mcpServer = new McpServer({
      name: "authenticated-server",
      version: "1.0.0",
    });

    // Set up server handlers
    mcpServer.setRequestHandler("tools/list", async () => ({
      tools: [
        {
          name: "get_user_data",
          description: "Get authenticated user data (requires auth)",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ],
    }));

    mcpServer.setRequestHandler("tools/call", async (request) => {
      if (request.params.name === "get_user_data") {
        return {
          content: [
            {
              type: "text",
              text: `User data for client: ${client.client_id}`,
            },
          ],
        };
      }
      throw new Error(`Unknown tool: ${request.params.name}`);
    });

    // Connect and handle request
    await mcpServer.connect(transport as any);
    const body = await c.req.json();
    return await transport.handleRequest(c, body);
  }
);

/**
 * Public MCP Endpoint (no auth required)
 */
app.post("/v1/mcp/public", async (c: Context) => {
  const transport = new StreamableHTTPTransport();
  const mcpServer = new McpServer({
    name: "public-server",
    version: "1.0.0",
  });

  mcpServer.setRequestHandler("tools/list", async () => ({
    tools: [
      {
        name: "public_echo",
        description: "Public echo tool (no auth required)",
        inputSchema: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
      },
    ],
  }));

  mcpServer.setRequestHandler("tools/call", async (request) => {
    if (request.params.name === "public_echo") {
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

  await mcpServer.connect(transport as any);
  const body = await c.req.json();
  return await transport.handleRequest(c, body);
});

export default app;

/**
 * Usage:
 *
 * 1. Configure your OAuth provider endpoints above
 *
 * 2. Start the server:
 *    npm run dev
 *
 * 3. Register a client (optional, if using dynamic registration):
 *    POST http://localhost:8080/register
 *    Body: {
 *      "redirect_uris": ["http://localhost:3000/callback"],
 *      "scope": "openid email profile mcp:read mcp:write"
 *    }
 *
 * 4. Obtain an access token via OAuth flow:
 *    a. Direct user to: http://localhost:8080/authorize?
 *       client_id=demo-client&
 *       redirect_uri=http://localhost:3000/callback&
 *       response_type=code&
 *       scope=openid+email+profile+mcp:read+mcp:write&
 *       code_challenge=<PKCE_challenge>&
 *       code_challenge_method=S256
 *
 *    b. Exchange code for token:
 *       POST http://localhost:8080/token
 *       Body: {
 *         "grant_type": "authorization_code",
 *         "client_id": "demo-client",
 *         "client_secret": "demo-secret",
 *         "code": "<authorization_code>",
 *         "code_verifier": "<PKCE_verifier>",
 *         "redirect_uri": "http://localhost:3000/callback"
 *       }
 *
 * 5. Use the access token to call protected MCP endpoint:
 *    POST http://localhost:8080/v1/mcp
 *    Headers: { "Authorization": "Bearer <access_token>" }
 *    Body: <MCP request>
 *
 * 6. Public endpoint works without auth:
 *    POST http://localhost:8080/v1/mcp/public
 *    Body: <MCP request>
 */
