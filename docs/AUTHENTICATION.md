# OAuth Authentication

This template includes a complete OAuth 2.0 authentication system for MCP servers, vendored from [@hono/mcp](https://github.com/honojs/middleware/tree/main/packages/mcp).

## Overview

The authentication system provides:
- OAuth 2.0 Authorization Code flow with PKCE
- Dynamic client registration
- Token refresh
- Token revocation
- Rate limiting on all endpoints
- Proxy provider for delegating auth to external OAuth servers

## Quick Start

### Basic OAuth Server

```typescript
import { Hono } from 'hono';
import { mcpAuthRouter, ProxyOAuthServerProvider } from '../vendor/@hono/mcp/auth/index.js';

const app = new Hono();

// Set up proxy provider to delegate to an external OAuth server
const provider = new ProxyOAuthServerProvider({
  endpoints: {
    authorizationUrl: 'https://auth.example.com/oauth2/authorize',
    tokenUrl: 'https://auth.example.com/oauth2/token',
    revocationUrl: 'https://auth.example.com/oauth2/revoke',
  },
  verifyAccessToken: async (token) => {
    // Verify the token with your auth server
    const response = await fetch('https://auth.example.com/oauth2/tokeninfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    return {
      token,
      clientId: data.client_id,
      scopes: data.scope.split(' '),
    };
  },
  getClient: async (clientId) => {
    // Fetch client info from your database or auth server
    return {
      client_id: clientId,
      redirect_uris: ['http://localhost:3000/callback'],
      scope: 'openid email profile',
    };
  },
});

// Mount auth router at root
app.route('/', mcpAuthRouter({
  provider,
  issuerUrl: new URL('https://auth.example.com'),
  baseUrl: new URL('https://mcp.example.com'),
  serviceDocumentationUrl: new URL('https://docs.example.com/'),
  scopesSupported: ['openid', 'email', 'profile'],
}));

export default app;
```

## Authentication Flow

1. **Client Registration** (optional)
   - Client POSTs to `/register` with redirect URIs and metadata
   - Server returns `client_id` and `client_secret`

2. **Authorization Request**
   - Client redirects user to `/authorize` with PKCE challenge
   - Server validates client and redirects to auth provider
   - User authenticates and consents
   - Server redirects back to client with authorization code

3. **Token Exchange**
   - Client POSTs to `/token` with authorization code and PKCE verifier
   - Server validates and returns access token and refresh token

4. **Using Access Token**
   - Client includes token in `Authorization: Bearer <token>` header
   - MCP server validates token via middleware

5. **Token Refresh** (optional)
   - Client POSTs to `/token` with `grant_type=refresh_token`
   - Server returns new access token

6. **Token Revocation** (optional)
   - Client POSTs to `/revoke` with token
   - Server invalidates the token

## Protecting MCP Endpoints

Use the client authentication middleware to protect your MCP endpoints:

```typescript
import { authenticateClient } from '../vendor/@hono/mcp/auth/middleware/index.js';

const app = new Hono();

// Protect MCP endpoint with OAuth
app.post('/v1/mcp',
  authenticateClient({ clientsStore: provider.clientsStore }),
  async (c) => {
    // Client is authenticated, get client info
    const client = c.get('client');
    console.log('Authenticated client:', client.client_id);

    // Handle MCP request
    const transport = new StreamableHTTPTransport();
    const server = new MCPServer({ name: "protected-server", version: "1.0.0" });
    await server.connect(transport);
    return await transport.handleRequest(c);
  }
);
```

## Custom OAuth Provider

For full control, implement your own `OAuthServerProvider`:

```typescript
import type { OAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/provider.js';
import type { OAuthClientInformationFull, OAuthTokens } from '@modelcontextprotocol/sdk/shared/auth.js';

class CustomOAuthProvider implements OAuthServerProvider {
  clientsStore = {
    async getClient(clientId: string) {
      // Fetch from your database
      return await db.clients.findOne({ client_id: clientId });
    },
    async registerClient(client: OAuthClientInformationFull) {
      // Store in your database
      return await db.clients.create(client);
    }
  };

  async authorize(client: OAuthClientInformationFull, params, ctx) {
    // Generate authorization code
    const code = await generateAuthCode(client, params);

    // Redirect to client's redirect_uri with code
    const redirectUrl = new URL(params.redirectUri);
    redirectUrl.searchParams.set('code', code);
    if (params.state) redirectUrl.searchParams.set('state', params.state);
    ctx.res = ctx.redirect(redirectUrl.toString());
  }

  async challengeForAuthorizationCode(client, code) {
    // Return the PKCE challenge for this authorization code
    return await db.authCodes.getChallenge(code);
  }

  async exchangeAuthorizationCode(client, code, codeVerifier, redirectUri, resource) {
    // Validate PKCE and return tokens
    const challenge = await this.challengeForAuthorizationCode(client, code);
    // ... validate codeVerifier against challenge ...

    return {
      access_token: await generateAccessToken(client),
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: await generateRefreshToken(client),
    };
  }

  async exchangeRefreshToken(client, refreshToken, scopes, resource) {
    // Validate refresh token and return new access token
    return {
      access_token: await generateAccessToken(client),
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: refreshToken, // or generate a new one
    };
  }

  async verifyAccessToken(token: string) {
    // Verify token signature/validity
    const payload = await verifyJWT(token);
    return {
      token,
      clientId: payload.client_id,
      scopes: payload.scope.split(' '),
      expiresAt: payload.exp,
    };
  }

  async revokeToken(client, request) {
    // Invalidate the token
    await db.tokens.delete({ token: request.token });
  }
}
```

## Rate Limiting

All auth endpoints have rate limiting enabled by default. Customize per-endpoint:

```typescript
app.route('/', mcpAuthRouter({
  provider,
  issuerUrl: new URL('https://auth.example.com'),

  // Customize rate limits per endpoint
  authorizationOptions: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: 50, // 50 requests per window
    }
  },
  tokenOptions: {
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      limit: 20, // Lower limit for token endpoint
    }
  },

  // Disable rate limiting for specific endpoint
  revocationOptions: {
    rateLimit: false
  }
}));
```

## Well-Known Endpoints

The auth router automatically provides discovery endpoints:

- `/.well-known/oauth-authorization-server` - OAuth server metadata
- `/.well-known/oauth-protected-resource` - Protected resource metadata

These endpoints help clients discover your OAuth configuration.

## Examples

See the `/examples` directory:
- `examples/with-auth.ts` - Complete OAuth setup
- `examples/auth-proxy.ts` - Proxying to external OAuth provider
- `examples/custom-provider.ts` - Custom OAuth provider implementation
