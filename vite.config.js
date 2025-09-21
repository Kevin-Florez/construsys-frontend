import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // <-- 1. Asegúrate de que esta línea de importación esté

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // --- 👇 2. AÑADE ESTA SECCIÓN MANUALMENTE 👇 ---
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})