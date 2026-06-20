import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAdminAccess } from './useAdminAccess';

describe('useAdminAccess', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('reports guest by default in local development', async () => {
    const { result } = renderHook(() => useAdminAccess());

    await waitFor(() => {
      expect(result.current).toBe('guest');
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('reports authenticated after the local admin callback succeeds', async () => {
    sessionStorage.setItem('agents-chat-local-admin-access', 'authenticated');

    const { result } = renderHook(() => useAdminAccess());

    await waitFor(() => {
      expect(result.current).toBe('authenticated');
    });

    expect(fetch).not.toHaveBeenCalled();
  });
});
