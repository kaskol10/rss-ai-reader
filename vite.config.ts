import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Ensure base path is correct for deployment
  server: {
    port: 3000,
    host: '0.0.0.0', // Allow external connections
    strictPort: true
  },
  preview: {
    port: 3000,
    host: '0.0.0.0', // Allow external connections for preview mode
    strictPort: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['fast-xml-parser']
  }
})
