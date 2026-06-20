import { useEffect, useState } from 'react';

export type AdminAccessStatus = 'checking' | 'authenticated' | 'guest';

export const LOCAL_ADMIN_ACCESS_KEY = 'agents-chat-local-admin-access';

export const isLocalAdminPreview = () =>
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '::1';

export const useAdminAccess = () => {
  const [status, setStatus] = useState<AdminAccessStatus>('checking');

  useEffect(() => {
    if (isLocalAdminPreview()) {
      setStatus(sessionStorage.getItem(LOCAL_ADMIN_ACCESS_KEY) === 'authenticated' ? 'authenticated' : 'guest');
      return;
    }

    const abortController = new AbortController();

    const checkAdminAccess = async () => {
      try {
        const response = await fetch('/admin/auth', {
          cache: 'no-store',
          credentials: 'include',
          redirect: 'manual',
          signal: abortController.signal,
        });

        setStatus(response.ok ? 'authenticated' : 'guest');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setStatus('guest');
      }
    };

    void checkAdminAccess();

    return () => {
      abortController.abort();
    };
  }, []);

  return status;
};
