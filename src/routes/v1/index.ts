import type { Hono } from 'hono';

import * as mcp from './mcp/index.js';

/** Set up all v1 routes */
export function setupRoutes(app: Hono) {
  mcp.setupRoutes(app);
}
