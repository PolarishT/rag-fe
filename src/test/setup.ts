import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

vi.stubEnv('VITE_RAG_API_BASE_URL', 'https://api.unamedserver.me');

afterEach(() => {
  cleanup();
});

class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = globalThis.ResizeObserver ?? TestResizeObserver;
