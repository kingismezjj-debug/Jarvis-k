import path from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        index: path.resolve(currentDirectory, "index.html"),
        pet: path.resolve(currentDirectory, "pet.html"),
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(currentDirectory, "./src"),
      "@jarvis-k/contracts": path.resolve(
        currentDirectory,
        "../../packages/contracts/src/index.ts"
      ),
      "@jarvis-k/voice-capture-browser": path.resolve(
        currentDirectory,
        "../../packages/voice-capture-browser/src/index.ts"
      ),
    },
  },
})
