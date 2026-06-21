import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAdminAccess } from './useAdminAccess';

describe('useAdminAccess', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('reports authenticated when the production admin endpoint succeeds', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));

    const { result } = renderHook(() => useAdminAccess());

    await waitFor(() => {
      expect(result.current).toBe('authenticated');
    });

    expect(fetch).toHaveBeenCalledWith(
      '/admin/auth',
      expect.objectContaining({
        cache: 'no-store',
        credentials: 'include',
        redirect: 'manual',
      }),
    );
  });

  it('reports guest when the production admin endpoint rejects access', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 403 }));

    const { result } = renderHook(() => useAdminAccess());

    await waitFor(() => {
      expect(result.current).toBe('guest');
    });
  });
});
