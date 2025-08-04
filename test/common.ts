import { fileURLToPath, URL } from "node:url";
import { createServer as createNetServer, Server } from "node:net";
import { env } from "node:process";
import { stat } from "node:fs/promises";
import { spawn } from "node:child_process";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import terminate from "terminate";

/** Where to find Jco as an executable */
const JCO_PATH = env.JCO_PATH ?? "jco";

/** Path to the WASM file to be used */
const WASM_PATH = fileURLToPath(
  new URL(env.WASM_PATH ?? "../dist/component.wasm", import.meta.url),
);

interface SetupE2EOpts {
  path?: string;
}

interface E2ETestSetup {
  url: URL;
  [Symbol.dispose]: () => Promise<void> | void;
}

/** Setup for an E2E test */
export async function setupE2E(opts: SetupE2EOpts): Promise<E2ETestSetup> {
  // Determine paths to jco and output wasm
  const wasmPathExists = await stat(WASM_PATH)
    .then((p) => p.isFile())
    .catch(() => false);
  if (!wasmPathExists) {
    throw new Error(
      `Missing/invalid Wasm binary @ [${WASM_PATH}] (has 'npm run build' been run?)`,
    );
  }

  // Generate a random port
  const randomPort = await getRandomPort();

  // Spawn jco serve
  const proc = spawn(
    JCO_PATH,
    ["serve", "--port", randomPort.toString(), WASM_PATH],
    {
      detached: false,
      stdio: "pipe",
      shell: false,
    },
  );

  // Wait for the server to start
  await new Promise((resolve) => {
    proc.stderr.on("data", (data: string) => {
      if (data.includes("Server listening")) {
        resolve(null);
      }
    });
  });

  const url = new URL(`http://localhost:${randomPort}`);
  if (opts?.path) {
    url.pathname = opts.path;
  }

  return {
    url,
    [Symbol.dispose]: () => {
      if (proc.pid === undefined) {
        throw new Error("unexpectedly undefined PID");
      }
      terminate(proc.pid);
    },
  };
}

// Utility function for getting a random port
export async function getRandomPort(): Promise<number> {
  return await new Promise((resolve) => {
    const server = createNetServer();
    server.listen(0, function (this: Server) {
      const addr = server.address();
      if (addr === null || typeof addr === "string") {
        throw new Error("address is unexpected format");
      }
      server.on("close", () => resolve(addr.port));
      server.close();
    });
  });
}

interface SetupMCPClientOpts {
  url: URL;
}

/**
 * Set up an MCP client
 *
 * @param {object} opts
 * @param {URL} opts.url
 */
export async function setupMCPClient(opts: SetupMCPClientOpts) {
  const { url } = opts;

  let client: Client | undefined = undefined;
  client = new Client({
    name: "streamable-http-client",
    version: "1.0.0",
  });

  const transport = new StreamableHTTPClientTransport(url);
  await client.connect(transport as any);

  return { client };
}
