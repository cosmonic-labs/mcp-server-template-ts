import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { logger } from "hono/logger";
import { fire } from "hono/service-worker";
import { setupRoutes } from "./routes/index.js";
import { setupPolyfills } from "./polyfills.js";

// Set up polyfills for WASI environment
setupPolyfills();

const server = new Hono();
server.use(logger());

server.get("/", async (c) => {
  return c.json({ msg: "StreamableHTTP endpoint at /mcp", envVars: c.env });
});

setupRoutes(server);

// showRoutes() logs all the routes available,
// but this line only runs once during component build, due
// to component optimization intricacies (wizer)
showRoutes(server, {
  verbose: true,
});

fire(server);
