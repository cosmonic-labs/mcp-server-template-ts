import { McpServer as UpstreamMCPServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";

export function setupResource<S extends UpstreamMCPServer>(server: S) {
  // Create a simple resource at a fixed URI
  server.resource(
    "greeting-resource",
    "https://example.com/greetings/default",
    { mimeType: "text/plain" },
    async (): Promise<ReadResourceResult> => {
      return {
        contents: [
          {
            uri: "https://example.com/greetings/default",
            text: "Hello, world!",
          },
        ],
      };
    },
  );
}
