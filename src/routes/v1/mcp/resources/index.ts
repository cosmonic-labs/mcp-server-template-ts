import { MCPServer } from "../server";

import * as greetingResource from "./greeting";

export function setupAllResources(server: MCPServer) {
  greetingResource.setupResource(server);
}
