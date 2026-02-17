import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2015',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — cached separately, rarely changes
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          // Icons tree-shaken but split for caching
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
})
