import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // strictPort keeps the admin panel on 5174 instead of drifting to a free port.
  server: { port: 5174, strictPort: true, open: true },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
          grid: ['@mui/x-data-grid'],
          charts: ['recharts'],
        },
      },
    },
  },
});
