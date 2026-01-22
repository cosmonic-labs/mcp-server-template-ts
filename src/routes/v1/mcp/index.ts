import type { Hono } from "hono";
import { setupMCPRoutes } from "./server";

export function setupRoutes(app: Hono) {
  setupMCPRoutes(app);
}
