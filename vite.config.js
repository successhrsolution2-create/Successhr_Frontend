import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/')
          if (!normalizedId.includes('node_modules')) return undefined
          if (normalizedId.includes('@hello-pangea/dnd')) return 'drag-drop'
          if (normalizedId.includes('recharts')) return 'charts'
          if (normalizedId.includes('@reduxjs/toolkit') || normalizedId.includes('react-redux')) return 'state'
          if (normalizedId.includes('react-hook-form') || normalizedId.includes('@hookform/resolvers') || normalizedId.includes('zod')) return 'forms'
          if (normalizedId.includes('socket.io-client')) return 'realtime'
          if (normalizedId.includes('react') || normalizedId.includes('react-dom') || normalizedId.includes('react-router-dom')) return 'vendor'
          return 'vendor'
        }
      }
    }
  }
})
  
