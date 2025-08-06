import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["lib/workers/spice-simulation.worker.ts"],
  outDir: "dist/workers",
  format: ["esm"],
  platform: "browser",
  dts: false,
  splitting: false,
  sourcemap: false,
  clean: true,
  minify: true,
})
