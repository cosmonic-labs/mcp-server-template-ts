import type { Hono } from "hono";

import * as v1 from "./v1/index";

export function setupRoutes(app: Hono) {
  v1.setupRoutes(app);
}
