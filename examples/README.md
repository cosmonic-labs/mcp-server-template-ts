# MCP Server Examples

This directory contains example implementations demonstrating different features of the MCP server template.

## Examples Overview

### 1. Basic HTTP Transport (`basic-http.ts`)

The simplest stateless MCP server setup. Perfect for getting started.

**Features:**
- Stateless HTTP transport
- Tools, resources, and prompts
- No session management
- Ideal for serverless deployments

**Run:**
```bash
# This is a reference example - adapt the code to src/component.ts
# See the file for detailed inline documentation
```

### 2. SSE Transport (`sse-transport.ts`)

Server-Sent Events transport for persistent connections and server push.

**Features:**
- Persistent SSE connection
- Server-initiated messages
- Separate POST endpoint for client messages
- Session management

**Use when:**
- You need server push notifications
- Deploying on platforms with long-lived connection support
- You want bidirectional real-time communication

### 3. OAuth Authentication (`with-auth.ts`)

Complete OAuth 2.0 authentication setup for MCP servers.

**Features:**
- OAuth 2.0 Authorization Code flow with PKCE
- Token refresh and revocation
- Protected and public endpoints
- Rate limiting
- ProxyOAuthServerProvider for external auth delegation

**Use when:**
- You need to authenticate and authorize clients
- Multiple clients with different permissions
- Integration with existing OAuth infrastructure

## Documentation

Detailed documentation is available in the `/docs` directory:

- **[Transport Options](../docs/TRANSPORTS.md)** - HTTP vs SSE transport
- **[Authentication](../docs/AUTHENTICATION.md)** - OAuth setup and configuration

## Quick Start

1. **Choose a transport mode:**
   - Start with `basic-http.ts` for simplicity
   - Use `sse-transport.ts` if you need server push
   - Add `with-auth.ts` patterns when you need authentication

2. **Adapt the example code:**
   - Copy relevant patterns to `src/routes/v1/mcp/server.ts`
   - Add your custom tools and resources
   - Configure security settings for your environment

3. **Test with MCP Inspector:**
   ```bash
   npm run dev
   npm run inspector
   ```

## Key Concepts

### Stateless vs Stateful

**Stateless (basic-http.ts):**
- No session management
- Each request is independent
- Simple scaling
- Serverless-friendly

**Stateful (sse-transport.ts):**
- Session IDs track clients
- Persistent connections
- Server can push messages
- Requires sticky sessions or Durable Objects

### Security Features

All examples include:
- DNS rebinding protection
- Host/Origin validation
- Optional rate limiting (auth example)
- CORS support

### Transport Selection Guide

| Feature | HTTP | SSE |
|---------|------|-----|
| Stateless | ✅ | ❌ |
| Server Push | ❌ | ✅ |
| Long Polling | Needed | Native |
| Serverless | ✅ | ⚠️ |
| Complexity | Low | Medium |

## Common Patterns

### Pattern 1: Stateless Server per Request

```typescript
app.post('/v1/mcp', async (c) => {
  const transport = new StreamableHTTPTransport();
  const server = new MCPServer({ name: "my-server", version: "1.0.0" });
  setupHandlers(server);
  await server.connect(transport);
  return await transport.handleRequest(c, await c.req.json());
});
```

### Pattern 2: Reusable Server with Session Management

```typescript
const server = new MCPServer({ name: "my-server", version: "1.0.0" });
setupHandlers(server);

app.post('/v1/mcp', async (c) => {
  const transport = new StreamableHTTPTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });
  await server.connect(transport);
  return await transport.handleRequest(c, await c.req.json());
});
```

### Pattern 3: Protected Endpoint

```typescript
app.post('/v1/mcp',
  authenticateClient({ clientsStore }),
  async (c) => {
    const client = c.get('client');
    // ... handle authenticated request
  }
);
```

## Tips

1. **Start Simple:** Begin with `basic-http.ts` and add features as needed
2. **Security First:** Always enable DNS rebinding protection in production
3. **Test Locally:** Use MCP Inspector to test before deploying
4. **Monitor Sessions:** Log session IDs and client IDs for debugging
5. **Rate Limit:** Add rate limiting for public endpoints

## Next Steps

- Review the [Transport Documentation](../docs/TRANSPORTS.md)
- Set up [OAuth Authentication](../docs/AUTHENTICATION.md)
- Customize tools and resources for your use case
- Deploy to your platform (wasmCloud, Cloudflare, etc.)

## Need Help?

- MCP Specification: https://modelcontextprotocol.io/
- MCP SDK: https://github.com/modelcontextprotocol/sdk
- Hono Documentation: https://hono.dev/
- wasmCloud: https://wasmcloud.com/
