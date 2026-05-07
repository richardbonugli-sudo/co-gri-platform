import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'], // Ensure single React instance
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Ensure React and React-DOM are in the vendor chunk
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor';
          }
          // Put recharts in its own chunk, but don't include React
          if (id.includes('node_modules/recharts/')) {
            return 'charts';
          }
          // Other Radix UI components
          if (id.includes('node_modules/@radix-ui/')) {
            return 'ui';
          }
          // Wouter and Zustand
          if (id.includes('node_modules/wouter/') || id.includes('node_modules/zustand/')) {
            return 'vendor';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'], // Pre-bundle React
  },
}));