import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ACCESS_LOGOUT_PATH,
  ACCESS_TEAM_ORIGIN,
  ADMIN_LOGIN_PATH,
  ADMIN_ACCESS_SESSION_KEY,
  beginAdminAuthentication,
  buildAdminAuthenticationUrl,
  hasAdminAccessSession,
  useAdminAccess,
} from './useAdminAccess';

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

  it('builds an application and global logout redirect chain', () => {
    const applicationLogoutUrl = new URL(buildAdminAuthenticationUrl('https://web.example.com'));
    const globalLogoutUrl = new URL(applicationLogoutUrl.searchParams.get('returnTo') ?? '');

    expect(applicationLogoutUrl.origin).toBe('https://web.example.com');
    expect(applicationLogoutUrl.pathname).toBe(ACCESS_LOGOUT_PATH);
    expect(globalLogoutUrl.origin).toBe(ACCESS_TEAM_ORIGIN);
    expect(globalLogoutUrl.pathname).toBe(ACCESS_LOGOUT_PATH);
    expect(globalLogoutUrl.searchParams.get('returnTo')).toBe(
      `https://web.example.com${ADMIN_LOGIN_PATH}`,
    );
  });

  it('clears local admin state and starts the logout redirect chain', () => {
    sessionStorage.setItem(ADMIN_ACCESS_SESSION_KEY, 'authenticated');
    const navigate = vi.fn();

    beginAdminAuthentication({
      origin: 'https://web.example.com',
      navigate,
    });

    expect(sessionStorage.getItem(ADMIN_ACCESS_SESSION_KEY)).toBeNull();
    expect(navigate).toHaveBeenCalledWith(
      buildAdminAuthenticationUrl('https://web.example.com'),
    );
  });
});
