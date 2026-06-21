import { useState } from 'react';

export type AdminAccessStatus = 'checking' | 'authenticated' | 'guest';

export const ADMIN_ACCESS_SESSION_KEY = 'agents-chat-admin-access';

export const hasAdminAccessSession = () =>
  sessionStorage.getItem(ADMIN_ACCESS_SESSION_KEY) === 'authenticated';

export const storeAdminAccessSession = () => {
  sessionStorage.setItem(ADMIN_ACCESS_SESSION_KEY, 'authenticated');
};

export const useAdminAccess = () => {
  const [status] = useState<AdminAccessStatus>(() =>
    hasAdminAccessSession() ? 'authenticated' : 'guest',
  );

  return status;
};
