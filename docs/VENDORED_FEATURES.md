# Vendored Features from @hono/mcp

This template includes version 0.2 of [@hono/mcp](https://github.com/honojs/middleware/tree/main/packages/mcp) middleware, vendored into `src/vendor/@hono/mcp/`.

## What's Vendored

The following features from [PR #1318](https://github.com/honojs/middleware/pull/1318) are included:

### Core Transport

#### StreamableHTTPTransport
**Location:** `src/vendor/@hono/mcp/streamable-http.ts`

Enhanced HTTP transport with:
- ✅ Stateless or stateful operation (with session management)
- ✅ DNS rebinding protection
- ✅ Host and Origin validation
- ✅ JSON response mode or SSE streaming mode
- ✅ Event store support for resumability
- ✅ Multiple request handling (GET, POST, DELETE)

**Key Options:**
```typescript
new StreamableHTTPTransport({
  sessionIdGenerator?: () => string,
  enableDnsRebindingProtection?: boolean,
  allowedHosts?: string[],
  allowedOrigins?: string[],
  enableJsonResponse?: boolean,
  eventStore?: EventStore,
  onsessioninitialized?: (sessionId: string) => void | Promise<void>,
  onsessionclosed?: (sessionId: string) => void | Promise<void>,
})
```

#### SSEServerTransport
**Location:** `src/vendor/@hono/mcp/sse.ts`

Server-Sent Events transport for persistent connections:
- ✅ Persistent SSE stream for server push
- ✅ Separate POST endpoint for client messages
- ✅ Automatic session ID generation
- ✅ DNS rebinding protection
- ✅ Compatible with Cloudflare Durable Objects pattern

**Usage:**
```typescript
const transport = new SSEServerTransport('/messages', {
  enableDnsRebindingProtection: true,
  allowedHosts: ['localhost'],
});

app.get('/sse', async (c) => {
  await mcpServer.connect(transport);
  return streamSSE(c, transport.handleStream());
});

app.post('/messages', (c) => transport.handlePostMessage(c));
```

### Authentication System

#### OAuth Router
**Location:** `src/vendor/@hono/mcp/auth/router.ts`

Complete OAuth 2.0 Authorization Server:
- ✅ Authorization Code flow with PKCE
- ✅ Dynamic client registration (RFC 7591)
- ✅ Token refresh (RFC 6749)
- ✅ Token revocation (RFC 7009)
- ✅ Rate limiting on all endpoints
- ✅ Well-known metadata endpoints
- ✅ CORS support

**Endpoints Provided:**
- `GET/POST /authorize` - Authorization endpoint
- `POST /token` - Token endpoint
- `POST /register` - Client registration (optional)
- `POST /revoke` - Token revocation (optional)
- `GET /.well-known/oauth-authorization-server` - Server metadata
- `GET /.well-known/oauth-protected-resource` - Resource metadata

#### ProxyOAuthServerProvider
**Location:** `src/vendor/@hono/mcp/auth/providers/proxy-provider.ts`

Delegate authentication to external OAuth servers:
- ✅ Proxy authorization requests
- ✅ Proxy token exchange
- ✅ Proxy token refresh
- ✅ Local or remote PKCE validation
- ✅ Custom fetch implementation support

**Usage:**
```typescript
new ProxyOAuthServerProvider({
  endpoints: {
    authorizationUrl: 'https://auth.external.com/oauth2/authorize',
    tokenUrl: 'https://auth.external.com/oauth2/token',
    revocationUrl: 'https://auth.external.com/oauth2/revoke',
  },
  verifyAccessToken: async (token) => { /* ... */ },
  getClient: async (clientId) => { /* ... */ },
})
```

#### Client Authentication Middleware
**Location:** `src/vendor/@hono/mcp/auth/middleware/client-auth.ts`

Protect MCP endpoints with OAuth:
- ✅ Validates client credentials
- ✅ Checks client secret expiration
- ✅ Sets authenticated client in context
- ✅ Returns proper OAuth error responses

**Usage:**
```typescript
app.post('/v1/mcp',
  authenticateClient({ clientsStore }),
  async (c) => {
    const client = c.get('client');
    // ... authenticated request handling
  }
);
```

### Utilities

#### streamSSE
**Location:** `src/vendor/@hono/mcp/streaming.ts`

Helper for SSE streaming in Hono:
- ✅ Bun compatibility (handles old Bun versions)
- ✅ Proper header management
- ✅ Error handling
- ✅ Context preservation

## Why Vendored?

These features are vendored (copied into the project) rather than used as dependencies because:

1. **PR #1318 is not yet released** - The features are in an open pull request
2. **Early access** - You can use these features now instead of waiting for the official release
3. **Customization** - You can modify the vendored code for your specific needs
4. **Stability** - The vendored code won't change until you explicitly update it
5. **WASM compatibility** - Code is adapted for WebAssembly Component Model (node:crypto polyfills)

## Polyfills Added

To support WASM/WASI environments, the following polyfills were added:

**Location:** `src/polyfills.ts`

```typescript
// From node:crypto module
export function randomUUID(): string
export function randomBytes(size: number): Buffer
export default { randomUUID, randomBytes, getCrypto }
```

These are automatically aliased via Rollup configuration when importing `node:crypto`.

## Differences from Upstream

1. **TypeScript fixes** - Added non-null assertions where the vendored code guaranteed values
2. **Control flow fixes** - Changed `if (hasRequests)` to `else` for proper return coverage
3. **Middleware return** - Added `return await next()` for proper Hono middleware typing
4. **Crypto polyfills** - Added polyfills for `node:crypto` module (WASM compatibility)

## Updating the Vendored Code

If you want to update to a newer version:

1. Clone the Hono middleware repo
2. Check out the latest commit from PR #1318 (or the main branch once merged)
3. Copy files from `packages/mcp/src/` to `src/vendor/@hono/mcp/`
4. Apply any necessary fixes for TypeScript and WASM compatibility
5. Run `npm run build` to verify

Or wait for the PR to be merged and switch to the published `@hono/mcp` package.

## Migration Path

Once PR #1318 is merged and published:

1. Install the package: `npm install @hono/mcp@latest`
2. Update imports from `../vendor/@hono/mcp` to `@hono/mcp`
3. Remove the `src/vendor/@hono/mcp` directory
4. Remove crypto polyfills if no longer needed
5. Test thoroughly

## License

The vendored code is from [@hono/mcp](https://github.com/honojs/middleware/tree/main/packages/mcp) which is MIT licensed.

## Version

**Vendored from:** Hono Middleware PR #1318
**Date vendored:** 2025-01-09
**Upstream commit:** Latest from `MathurAditya724/main` branch
**SDK version:** @modelcontextprotocol/sdk ^1.17.3

## Dependencies

The vendored code requires these peer dependencies (already included):

- `hono` (>=4.0.0)
- `hono-rate-limiter` (^0.4.2)
- `pkce-challenge` (^5.0.0)
- `@modelcontextprotocol/sdk` (^1.17.3)
- `zod` (for validation)
