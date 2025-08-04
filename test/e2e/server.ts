import { suite, test, expect } from "vitest";

import { setupE2E, setupMCPClient } from "../common.js";

suite("MCP component", () => {
  test("works", async () => {
    const { url } = await setupE2E();
    const { client } = await setupMCPClient({ url });
    expect(client).toBeTruthy();
  });
});
