import { MCPServer } from "../server.js";

import * as startNotificationStream from "./echo.js";

export function setupAllTools(server: MCPServer) {
  startNotificationStream.setupTool(server);
}
