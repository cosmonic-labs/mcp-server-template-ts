import type { Hono } from "hono";
import { MCPServer } from "./server.js";

export const MCP_BASE_PATH = "/v1/mcp";

export function setupRoutes(app: Hono, mcpAuth?: any) {
  // If MCP Auth is configured, protect the MCP endpoint
  if (mcpAuth) {
    // Protected MCP endpoint with Bearer token authentication
    app.post(
      MCP_BASE_PATH,
      mcpAuth.bearerAuth('jwt', {
        requiredScopes: process.env.REQUIRED_SCOPES?.split(',') || ['mcp:read', 'mcp:write']
      }),
      MCPServer.handleMCPRequest
    );
    
    // Also add a protected variant at /v1/mcp/protected for explicit protected access
    app.post(
      `${MCP_BASE_PATH}/protected`,
      mcpAuth.bearerAuth('jwt', {
        requiredScopes: process.env.REQUIRED_SCOPES?.split(',') || ['mcp:admin']
      }),
      MCPServer.handleMCPRequest
    );
  } else {
    // Unprotected MCP endpoint (original behavior)
    app.post(MCP_BASE_PATH, MCPServer.handleMCPRequest);
  }
  
  // Health check endpoint (always unprotected)
  app.get(`${MCP_BASE_PATH}/health`, (c) => 
    c.json({ 
      status: 'healthy', 
      authenticated: !!mcpAuth,
      timestamp: new Date().toISOString()
    })
  );
}
