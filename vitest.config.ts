import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    exclude: ['visit-web-worker-cloudflare/**', '**/node_modules/**', '**/dist/**'],
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
  },
});
