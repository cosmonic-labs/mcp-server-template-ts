import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import alias from "@rollup/plugin-alias";
import { defineConfig } from "rollup";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  input: "src/component.ts",
  external: [/wasi:.*/],
  output: {
    file: "dist/component.js",
    format: "esm",
    sourcemap: true,
  },
  plugins: [
    alias({
      entries: [
        {
          find: "node:crypto",
          replacement: resolve(__dirname, "src/polyfills.js"),
        },
      ],
    }),
    typescript({ noEmitOnError: true }),
    json(),
    nodeResolve({
      preferBuiltins: false,
      browser: true,
    }),
    commonjs({
      include: /node_modules/,
      transformMixedEsModules: true,
    }),
  ],
});
