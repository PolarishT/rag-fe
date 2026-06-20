import { useEffect, useState } from 'react';

export type AdminAccessStatus = 'checking' | 'authenticated' | 'guest';

export const useAdminAccess = () => {
  const [status, setStatus] = useState<AdminAccessStatus>('checking');

  useEffect(() => {
    const abortController = new AbortController();

    const checkAdminAccess = async () => {
      try {
        const response = await fetch('/admin-auth', {
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
