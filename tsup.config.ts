import { defineConfig } from "tsup"

export default defineConfig({
  tsconfig: "./tsconfig.json",
  entry: ["./src/index.ts"],
  dts: true,
  sourcemap: true,
})
