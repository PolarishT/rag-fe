export type AdminAccessStatus = 'authenticated' | 'guest';

export const ADMIN_ACCESS_SESSION_KEY = 'agents-chat-admin-access';
export const ACCESS_LOGOUT_PATH = '/cdn-cgi/access/logout';
export const ADMIN_LOGIN_PATH = '/admin/auth';
export const ACCESS_TEAM_ORIGIN = 'https://unsw-opensource-rag.cloudflareaccess.com';

interface BeginAdminAuthenticationOptions {
  origin?: string;
  navigate?: (url: string) => void;
}

export const buildAdminAuthenticationUrl = (origin = window.location.origin) => {
  const adminLoginUrl = new URL(ADMIN_LOGIN_PATH, origin);
  const logoutUrl = new URL(ACCESS_LOGOUT_PATH, ACCESS_TEAM_ORIGIN);
  logoutUrl.searchParams.set('returnTo', adminLoginUrl.toString());
  return logoutUrl.toString();
};

export const beginAdminAuthentication = ({
  origin = window.location.origin,
  navigate = (url) => window.location.assign(url),
}: BeginAdminAuthenticationOptions = {}) => {
  sessionStorage.removeItem(ADMIN_ACCESS_SESSION_KEY);
  navigate(buildAdminAuthenticationUrl(origin));
};

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
