import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('antd') || id.includes('@ant-design/x')) {
            return 'antd';
          }

          if (id.includes('react-markdown')) {
            return 'markdown';
          }

          if (id.includes('framer-motion')) {
            return 'motion';
          }

          return undefined;
        },
      },
    },
  },
});
