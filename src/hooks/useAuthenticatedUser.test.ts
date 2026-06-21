import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTHENTICATED_USER_EMAIL_HEADER, useAuthenticatedUser } from './useAuthenticatedUser';

describe('useAuthenticatedUser', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('loads and normalizes the verified email from the Worker response header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(null, {
        headers: {
          [AUTHENTICATED_USER_EMAIL_HEADER]: ' User@Example.COM ',
        },
      }),
    );

    const { result } = renderHook(() => useAuthenticatedUser());

    expect(result.current.status).toBe('loading');

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });

    expect(result.current.email).toBe('user@example.com');
    expect(fetch).toHaveBeenCalledWith(
      '/',
      expect.objectContaining({
        method: 'HEAD',
        cache: 'no-store',
        credentials: 'include',
      }),
    );
  });

  it('shows an error when the Worker response does not include an email', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));

    const { result } = renderHook(() => useAuthenticatedUser());

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error).toContain('未返回已验证邮箱');
  });

  it('retries identity loading after a failure', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 401, statusText: 'Unauthorized' }))
      .mockResolvedValueOnce(
        new Response(null, {
          headers: {
            [AUTHENTICATED_USER_EMAIL_HEADER]: 'retry@example.com',
          },
        }),
      );

    const { result } = renderHook(() => useAuthenticatedUser());

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });

    expect(result.current.email).toBe('retry@example.com');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
