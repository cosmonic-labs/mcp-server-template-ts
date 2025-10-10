# MCP Transport Options

This template includes support for two MCP transport protocols. Both are vendored from [@hono/mcp](https://github.com/honojs/middleware/tree/main/packages/mcp).

## Streamable HTTP Transport (Default)

The default transport uses HTTP POST requests with optional Server-Sent Events (SSE) for streaming responses.

### Features
- Stateless or stateful (with session management)
- DNS rebinding protection
- JSON response mode or SSE streaming mode
- Event store support for resumability

### Basic Usage

```typescript
import { StreamableHTTPTransport } from "../../../vendor/@hono/mcp/index.js";
import { Context } from "hono";

const transport = new StreamableHTTPTransport({
  // Optional: Generate session IDs for stateful sessions
  sessionIdGenerator: () => crypto.randomUUID(),

  // Optional: Enable DNS rebinding protection
  enableDnsRebindingProtection: true,
  allowedHosts: ['localhost', '127.0.0.1'],
  allowedOrigins: ['http://localhost:3000'],

  // Optional: Use JSON responses instead of SSE
  enableJsonResponse: false,
});

// Handle requests
app.post('/v1/mcp', async (c: Context) => {
  const body = await c.req.json();
  const server = new MCPServer({ name: "my-server", version: "1.0.0" });
  await server.connect(transport);
  return await transport.handleRequest(c, body);
});
```

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `sessionIdGenerator` | `() => string` | Function to generate session IDs. If provided, enables stateful sessions. |
| `enableDnsRebindingProtection` | `boolean` | Enable DNS rebinding attack protection (default: `false`) |
| `allowedHosts` | `string[]` | Allowed Host header values (requires DNS protection enabled) |
| `allowedOrigins` | `string[]` | Allowed Origin header values (requires DNS protection enabled) |
| `enableJsonResponse` | `boolean` | Return JSON responses instead of SSE streams (default: `false`) |
| `eventStore` | `EventStore` | Store for events to support resumability |

## SSE Server Transport

SSE (Server-Sent Events) transport sends messages over a persistent SSE connection and receives messages via HTTP POST.

### Features
- Persistent event stream connection
- Separate POST endpoint for client messages
- Automatic session ID management
- DNS rebinding protection

### Basic Usage

```typescript
import { SSEServerTransport } from "../../../vendor/@hono/mcp/index.js";
import { streamSSE } from "../../../vendor/@hono/mcp/streaming.js";

const transport = new SSEServerTransport('/messages', {
  enableDnsRebindingProtection: true,
  allowedHosts: ['localhost'],
});

const mcpServer = new MCPServer({
  name: 'my-sse-server',
  version: '1.0.0',
});

// SSE stream endpoint
app.get('/sse', async (c) => {
  if (!mcpServer.isConnected()) {
    await mcpServer.connect(transport);
  }
  return streamSSE(c, transport.handleStream());
});

// POST message endpoint
app.post('/messages', (c) => transport.handlePostMessage(c));
```

### When to Use SSE Transport

Use SSE transport when:
- You need a persistent connection for server-initiated messages
- You're deploying on platforms that support long-lived connections (e.g., Cloudflare Durable Objects)
- You want server push notifications without client polling

Use Streamable HTTP transport when:
- You want stateless operation
- You're deploying on serverless platforms with short timeouts
- You prefer request/response patterns

## Security Considerations

### DNS Rebinding Protection

Both transports support DNS rebinding protection to prevent attacks where malicious websites attempt to communicate with your local MCP server.

```typescript
const transport = new StreamableHTTPTransport({
  enableDnsRebindingProtection: true,
  allowedHosts: ['localhost', '127.0.0.1'],
  allowedOrigins: ['http://localhost:3000', 'https://your-app.com'],
});
```

### Session Management

Enable session management to maintain state across requests:

```typescript
const transport = new StreamableHTTPTransport({
  sessionIdGenerator: () => crypto.randomUUID(),
  onsessioninitialized: async (sessionId) => {
    console.log('Session started:', sessionId);
    // Store session in your session store
  },
  onsessionclosed: async (sessionId) => {
    console.log('Session closed:', sessionId);
    // Clean up session data
  },
});
```

## Examples

See the `/examples` directory for complete working examples:
- `examples/basic-http.ts` - Basic Streamable HTTP transport
- `examples/sse-transport.ts` - SSE transport with Durable Objects pattern
- `examples/with-auth.ts` - Transport with OAuth authentication
