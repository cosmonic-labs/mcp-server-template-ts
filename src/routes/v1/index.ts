import type { Hono, Context } from "hono";

import * as mcp from "./mcp/index.js";
// START_OF Features.Auth
// import * as signup from "./signup.js";
// END_OF Features.Auth

/** Set up all v1 routes */
export function setupRoutes(app: Hono) {
  app.get("/v1/example", (c: Context) => c.json({ msg: "Hello World!" }));
  mcp.setupRoutes(app);
  // START_OF Features.Auth
  // signup.setupRoutes(app);
  // END_OF Features.Auth
}
