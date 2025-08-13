import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { logger } from "hono/logger";
import { fire } from "hono/service-worker";
// import { fire } from "./wasmcloud/hono-adapter/server.js";

import { setupRoutes } from "./routes/index.js";
import { setupPolyfills } from "./polyfills.js";

// Set up polyfills for WASI environment
setupPolyfills();

const server = new Hono();
server.use(logger());

server.get("/", async (c) => {
  // You can pass environment variables when you run this via:
  // `wasmtime serve -Scli --env TEST=example dist/component.wasm`
  return c.json({ msg: "Hello world!", envVars: c.env });
});

setupRoutes(server);

// showRoutes() logs all the routes available,
// but this line only runs once during component build, due
// to component optimization intricacies (wizer)
showRoutes(server, {
  verbose: true,
});

fire(server);
