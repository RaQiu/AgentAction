import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["cjs"],
  clean: true,
  bundle: true,
  noExternal: [/.*/],
  external: ["better-sqlite3"]
});
