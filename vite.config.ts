import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import reactCosmos from "react-cosmos-plugin-vite"
import { resolve } from "path"

export default defineConfig({
  plugins: [react(), reactCosmos],
  root: "vite",
  resolve: {
    alias: {
      lib: resolve(__dirname, "./lib")
    }
  }
})
