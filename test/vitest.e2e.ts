import { env } from "node:process";
import { defineConfig } from "vitest/config";

const DEFAULT_TIMEOUT_MS = 1000 * 60 * 10; // 10m

const REPORTERS = process.env.GITHUB_ACTIONS
  ? ["verbose", "github-actions"]
  : ["verbose"];

export default defineConfig({
  test: {
    reporters: REPORTERS,
    // Github Actions machines, in particular windows can be flaky
    retry: env.CI ? 3 : 0,
    disableConsoleIntercept: true,
    printConsoleTrace: true,
    passWithNoTests: false,
    include: ["test/e2e/**/*.ts"],
    testTimeout: DEFAULT_TIMEOUT_MS,
    hookTimeout: DEFAULT_TIMEOUT_MS,
    teardownTimeout: DEFAULT_TIMEOUT_MS,
  },
});
