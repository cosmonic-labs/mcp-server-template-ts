import { MCPServer } from "../server.js";

import * as greetingResource from "./greeting.js";

export function setupAllResources(server: MCPServer) {
  greetingResource.setupResource(server);
}
