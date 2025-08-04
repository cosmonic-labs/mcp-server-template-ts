import type { Hono, Context } from "hono";

import * as mcp from "./mcp/index.js";

/** Set up all v1 routes */
export function setupRoutes(app: Hono) {
  app.get("/v1/example", (c: Context) => c.json({ msg: "Hello World!" }));
  mcp.setupRoutes(app);
}
