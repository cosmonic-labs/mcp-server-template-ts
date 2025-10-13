import type { Hono } from 'hono';
import { MCPServer } from './server.js';

export const MCP_BASE_PATH = '/v1/mcp';

export function setupRoutes(app: Hono) {
  app.post(MCP_BASE_PATH, MCPServer.handleMCPRequest);

  // Redirect /authorize requests to Autodesk OAuth endpoint, returns token to client
  app.get('/authorize', (c) => {
    return c.redirect(
      'https://developer.api.autodesk.com/authentication/v2/authorize',
      302
    );
  });

  // TODO(brooks): I don't think we need this.
  app.get('/.well-known/oauth-protected-resource/v1/mcp', (c) => {
    return c.json(
      {
        client_id: 'WBSAW6GUYYpPneabmTlxjAHUGA32PyGI4AA2JPfAgq2RUSKj',
      },
      200,
      {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      }
    );
  });

  // TODO(brooks): I don't think we need this.
  app.get('/.well-known/oauth-authorization-server', async (c) => {
    const res = await fetch(
      'https://developer.api.autodesk.com/.well-known/oauth-authorization-server'
    );
    const body = (await res.json()) as Record<string, unknown>;
    return c.json(body, 200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    });
  });

  app.get('/.well-known/oauth-authorization-server/v1/mcp', async (c) => {
    const res = await fetch(
      'https://developer.api.autodesk.com/.well-known/oauth-authorization-server'
    );
    const body = (await res.json()) as Record<string, unknown>;
    return c.json(body, 200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    });
  });
}
