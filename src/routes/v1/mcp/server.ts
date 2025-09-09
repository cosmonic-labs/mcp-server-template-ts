import { McpServer as UpstreamMCPServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { StreamableHTTPTransport } from '@hono/mcp';
import { Context } from 'hono';

import { setupAllTools } from './tools';
import { setupAllResources } from './resources';
import {
  OAuthConfig,
  ProxyOAuthServerProvider,
  setupOAuthProvider,
} from './auth';

// Used for OAuth support
// Uncomment and configure for authenticated backends
// import { setupOAuthProvider, type OAuthConfig } from "./auth";
// import {getAll as getConfig} from 'wasi:config/runtime@0.2.0-draft';

export class MCPServer extends UpstreamMCPServer {
  constructor(opts: any) {
    super(opts);
    const server = this;
    setupAllTools(server);
    setupAllResources(server);
  }

  /**
   * Handle HTTP requests for MCP communication (stateless)
   */
  static async handleMCPRequest(c: Context) {
    const method = c.req.method;

    // Only POST is supported right now
    if (method !== 'POST') {
      return c.text('Method not allowed', 405);
    }

    // OAuth Authentication (commented out for template use)
    // Uncomment for authenticated backends
    const oauthConfig: OAuthConfig = {
      authorizationServerUrl:
        'https://developer.api.autodesk.com/authentication/v2/authorize',
      clientId: 'WBSAW6GUYYpPneabmTlxjAHUGA32PyGI4AA2JPfAgq2RUSKj',
      // TODO: get from config/env
      clientSecret: '',
      scope: 'data:read data:write account:read',
      resourceIndicator: 'mcp://server',
    };

    const oauthProvider = setupOAuthProvider({} as any, oauthConfig);
    if (oauthProvider) {
      const authResult = await oauthProvider.authenticateRequest(c);

      if (!authResult.authenticated) {
        return c.json(
          {
            error: {
              code: -32600,
              message: 'Authentication required',
              data: 'Valid OAuth access token required in Authorization header',
            },
          },
          401
        );
      }
    }

    // User context is available in authResult.user for authorized requests

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

      // DNS rebinding protection is disabled by default for backwards compatibility.
      enableDnsRebindingProtection: true,
      // allowedHosts: ['127.0.0.1'],
    });

    // TODO: Transport generation/hydration as a Hono middleware?

    const server = new MCPServer({
      name: 'example-server',
      version: '1.0.0',
    });
    await server.connect(transport as any);

    const response = await transport.handleRequest(c, body);
    return response || c.text('OK');
  }
}
