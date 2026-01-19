import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Force Vite to always run on port 5173
  server: {
    port: 5173,
  },
})
