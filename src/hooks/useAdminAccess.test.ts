import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAdminAccess } from './useAdminAccess';

describe('useAdminAccess', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('reports authenticated when the protected path is accessible', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));

    const { result } = renderHook(() => useAdminAccess());

    await waitFor(() => {
      expect(result.current).toBe('authenticated');
    });

    expect(fetch).toHaveBeenCalledWith(
      '/admin-auth',
      expect.objectContaining({
        cache: 'no-store',
        credentials: 'include',
        redirect: 'manual',
      }),
    );
  });

  it('reports guest when Cloudflare Access does not allow the request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 302 }));

    const { result } = renderHook(() => useAdminAccess());

    await waitFor(() => {
      expect(result.current).toBe('guest');
    });
  });

  it('reports guest when the access probe fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const { result } = renderHook(() => useAdminAccess());

    await waitFor(() => {
      expect(result.current).toBe('guest');
    });
  });
});
