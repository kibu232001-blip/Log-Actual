import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": resolve(__dirname, "src") } },
  server: { port: 3000, host: true },
  build: {
    outDir: "dist",
    sourcemap: false,   // smaller bundle for mobile
    rollupOptions: {
      output: {
        manualChunks: {
          'leaflet': ['leaflet'],
          'react-vendor': ['react', 'react-dom'],
          'zustand': ['zustand'],
        }
      }
    }
  },
})
