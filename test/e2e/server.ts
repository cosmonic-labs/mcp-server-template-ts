import { suite, test, expect, beforeAll } from "vitest";

import {
  ensureTestComponentBuild,
  setupE2E,
  setupMCPClient,
} from "../common.js";
import { MCP_BASE_PATH } from "../../src/routes/v1/mcp/index.js";

suite("MCP component", () => {
  /** Path to the component that should be used for these tests */
  let testWASMPath: string;

  beforeAll(async () => {
    const results = await ensureTestComponentBuild();
    testWASMPath = results.componentPath;
  });

  test("works", async () => {
    using testSetup = await setupE2E({
      path: MCP_BASE_PATH,
      testWASMPath,
    });

    const { client } = await setupMCPClient({ url: testSetup.serverURL });
    expect(client).toBeTruthy();
  });
});
