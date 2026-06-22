import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ADMIN_ACCESS_SESSION_KEY, hasAdminAccessSession, useAdminAccess } from './useAdminAccess';

describe('useAdminAccess', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('reports authenticated after consuming the admin redirect', async () => {
    window.history.replaceState(null, '', '/?admin=authenticated');

    const { result } = renderHook(() => useAdminAccess());

    await waitFor(() => {
      expect(result.current).toBe('authenticated');
    });

    expect(sessionStorage.getItem(ADMIN_ACCESS_SESSION_KEY)).toBe('authenticated');
    expect(window.location.pathname).toBe('/');
    expect(window.location.search).toBe('');
  });

  it('keeps the authenticated state for the current browser session', () => {
    sessionStorage.setItem(ADMIN_ACCESS_SESSION_KEY, 'authenticated');

    expect(hasAdminAccessSession()).toBe(true);
  });

  it('reports guest without a successful admin redirect', async () => {
    const { result } = renderHook(() => useAdminAccess());

    await waitFor(() => {
      expect(result.current).toBe('guest');
    });
  });
});
