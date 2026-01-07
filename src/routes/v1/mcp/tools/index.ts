import { MCPServer } from "../server";

import * as startNotificationStream from "./echo";

export function setupAllTools(server: MCPServer) {
  startNotificationStream.setupTool(server);
}
