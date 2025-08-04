import type { Env } from "hono";

export interface WasiEnv extends Env {
  config: Record<string, string>;
}
