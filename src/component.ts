import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { logger } from "hono/logger";
import { fire } from "hono/service-worker";
// import { fire } from "./wasmcloud/hono-adapter/server.js";

import { setupRoutes } from "./routes/index.js";
import { setupPolyfills } from "./polyfills.js";
import { createMCPAuthHono, fetchServerConfigForHono } from "./auth/mcp-auth-adapter.js";

import {get as getConfig} from 'wasi:config/runtime@0.2.0-draft';

// Set up polyfills for WASI environment
setupPolyfills();

const server = new Hono();
server.use(logger());

const OAUTH_ISSUER_URL = getConfig("OAUTH_ISSUER_URL");

// Initialize MCP Auth if issuer URL is provided
let mcpAuth: Awaited<ReturnType<typeof createMCPAuthHono>> | null = null;
if (OAUTH_ISSUER_URL) {
  try {
    mcpAuth = await createMCPAuthHono(
      OAUTH_ISSUER_URL,
      (getConfig("OAUTH_SERVER_TYPE") as any) || 'oidc'
    );
    
    // Add the protected resource metadata router
    server.use(mcpAuth.protectedResourceMetadataRouter());

    console.log('MCP Auth initialized with issuer:', OAUTH_ISSUER_URL);
  } catch (error) {
    console.error('Failed to initialize MCP Auth:', error);
  }
}

server.get("/", async (c) => {
  // You can pass environment variables when you run this via:
  // `wasmtime serve -Scli --env TEST=example dist/component.wasm`
  return c.json({ msg: "Hello world!", envVars: c.env });
});

setupRoutes(server, mcpAuth);

// showRoutes() logs all the routes available,
// but this line only runs once during component build, due
// to component optimization intricacies (wizer)
showRoutes(server, {
  verbose: true,
});

fire(server);
