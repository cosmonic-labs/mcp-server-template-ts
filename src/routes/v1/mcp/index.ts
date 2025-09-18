import type { Hono } from "hono";
import { MCPServer } from "./server.js";
import {get as getConfig} from 'wasi:config/runtime@0.2.0-draft';

export const MCP_BASE_PATH = "/v1/mcp";

export function setupRoutes(app: Hono, mcpAuth?: any) {
  const requiredScopes = getConfig("REQUIRED_SCOPES")?.split(',');
  
  // If MCP Auth is configured, protect the MCP endpoint
  if (mcpAuth) {
    // Protected MCP endpoint with Bearer token authentication
    app.post(
      MCP_BASE_PATH,
      mcpAuth.bearerAuth('jwt', {
        requiredScopes: requiredScopes || ['mcp:read', 'mcp:write']
      }),
      MCPServer.handleMCPRequest
    );
    
    // Also add a protected variant at /v1/mcp/protected for explicit protected access
    app.post(
      `${MCP_BASE_PATH}/protected`,
      mcpAuth.bearerAuth('jwt', {
        requiredScopes: requiredScopes || ['mcp:admin']
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
