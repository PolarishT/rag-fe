import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  ADMIN_ACCESS_SESSION_KEY,
  hasAdminAccessSession,
  storeAdminAccessSession,
  useAdminAccess,
} from './useAdminAccess';

describe('useAdminAccess', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('reports guest before the admin callback succeeds', async () => {
    const { result } = renderHook(() => useAdminAccess());

    await waitFor(() => {
      expect(result.current).toBe('guest');
    });
  });

  it('reports authenticated after the admin callback stores the session', async () => {
    storeAdminAccessSession();

    const { result } = renderHook(() => useAdminAccess());

    await waitFor(() => {
      expect(result.current).toBe('authenticated');
    });
  });

  it('stores the admin state only in the current browser session', () => {
    expect(hasAdminAccessSession()).toBe(false);

    storeAdminAccessSession();

    expect(sessionStorage.getItem(ADMIN_ACCESS_SESSION_KEY)).toBe('authenticated');
    expect(hasAdminAccessSession()).toBe(true);
  });
});
