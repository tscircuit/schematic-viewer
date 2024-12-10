import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "node:path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      lib: resolve(__dirname, "./lib"),
    },
  },
  define: {
    global: {},
  },
})
