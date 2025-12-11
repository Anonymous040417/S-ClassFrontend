import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173, // Use Render's PORT or default
  },
  preview: {
    host: '0.0.0.0', // Important for Render
    port: process.env.PORT ? parseInt(process.env.PORT) : 4173,
  },
  build: {
    // Skip TypeScript checking during build for Render
    sourcemap: false,
  }
})