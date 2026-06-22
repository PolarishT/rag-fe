export type AdminAccessStatus = 'authenticated' | 'guest';

export const ADMIN_ACCESS_SESSION_KEY = 'agents-chat-admin-access';

const consumeAdminRedirect = () => {
  const url = new URL(window.location.href);

  if (url.searchParams.get('admin') !== 'authenticated') {
    return;
  }

  sessionStorage.setItem(ADMIN_ACCESS_SESSION_KEY, 'authenticated');
  url.searchParams.delete('admin');
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
};

export const hasAdminAccessSession = () => {
  consumeAdminRedirect();
  return sessionStorage.getItem(ADMIN_ACCESS_SESSION_KEY) === 'authenticated';
};

export const useAdminAccess = (): AdminAccessStatus =>
  hasAdminAccessSession() ? 'authenticated' : 'guest';
