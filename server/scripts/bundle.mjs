// Bundles the server into one file (dist/server.mjs) that runs with plain Node: no node_modules, no tsx.
// Used by the Docker image.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await build({
  entryPoints: [path.join(root, "src", "index.ts")],
  outfile: path.join(root, "dist", "server.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  // Some bundled CommonJS dependencies call require() for Node built-ins.
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
  sourcemap: false,
  minify: false,
  logLevel: "warning",
});
console.log("server bundle ok");
