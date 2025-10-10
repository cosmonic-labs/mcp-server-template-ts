# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **Vendored @hono/mcp v0.2** - Complete MCP middleware from Hono PR #1318
  - Enhanced `StreamableHTTPTransport` with DNS rebinding protection and session management
  - New `SSEServerTransport` for Server-Sent Events
  - Complete OAuth 2.0 authentication system with `mcpAuthRouter`
  - `ProxyOAuthServerProvider` for delegating to external OAuth servers
  - Client authentication middleware
  - Rate limiting support on auth endpoints
  
- **Documentation**
  - [Transport Options Guide](docs/TRANSPORTS.md) - HTTP vs SSE transport documentation
  - [Authentication Guide](docs/AUTHENTICATION.md) - OAuth 2.0 setup and configuration
  - [Vendored Features Reference](docs/VENDORED_FEATURES.md) - What's included and why
  
- **Examples**
  - [basic-http.ts](examples/basic-http.ts) - Simple stateless HTTP server
  - [sse-transport.ts](examples/sse-transport.ts) - SSE transport with persistent connections
  - [with-auth.ts](examples/with-auth.ts) - Complete OAuth authentication setup
  - [Examples README](examples/README.md) - Guide to all examples

- **Dependencies**
  - `hono-rate-limiter@^0.4.2` - Rate limiting for auth endpoints
  - `pkce-challenge@^5.0.0` - PKCE validation for OAuth flows

- **Polyfills**
  - `randomUUID()` from node:crypto
  - `randomBytes()` from node:crypto
  - Default export for node:crypto compatibility in WASM

### Changed

- Updated README with feature highlights and documentation links
- Import path changed to vendored middleware in `src/routes/v1/mcp/server.ts`

### Fixed

- TypeScript compatibility issues in vendored code
- WASM compatibility with node:crypto polyfills
- Middleware return type issues

## Migration Notes

This version vendors @hono/mcp PR #1318 features. Once the PR is merged and published:

1. Switch from vendored code to the published package
2. Update imports from `../vendor/@hono/mcp` to `@hono/mcp`
3. Remove vendored directory
4. See [VENDORED_FEATURES.md](docs/VENDORED_FEATURES.md) for migration details
