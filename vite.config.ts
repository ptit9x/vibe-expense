/// <reference types="vitest" />
import path from "path"
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom')) {
            return 'vendor'
          }
          if (id.includes('node_modules/recharts/')) {
            return 'charts'
          }
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase'
          }
          if (id.includes('node_modules/@radix-ui/')) {
            return 'ui'
          }
          if (id.includes('node_modules/framer-motion/')) {
            return 'motion'
          }
          if (id.includes('node_modules/heic2any/')) {
            return 'heic2any'
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})