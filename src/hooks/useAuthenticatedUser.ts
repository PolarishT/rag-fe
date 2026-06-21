import { useCallback, useEffect, useState } from 'react';

export const AUTHENTICATED_USER_EMAIL_HEADER = 'Cf-Access-Authenticated-User-Email';

type AuthenticatedUserState =
  | { status: 'loading'; email?: undefined; error?: undefined }
  | { status: 'authenticated'; email: string; error?: undefined }
  | { status: 'error'; email?: undefined; error: string };

const readAuthenticatedEmail = async (signal: AbortSignal) => {
  const response = await fetch('/', {
    method: 'HEAD',
    cache: 'no-store',
    credentials: 'include',
    signal,
  });

  if (!response.ok) {
    throw new Error(`邮箱身份验证失败：${response.status} ${response.statusText}`.trim());
  }

  const email = response.headers.get(AUTHENTICATED_USER_EMAIL_HEADER)?.trim().toLowerCase();

  if (!email) {
    throw new Error('Cloudflare Access 未返回已验证邮箱。');
  }

  return email;
};

export const useAuthenticatedUser = () => {
  const [state, setState] = useState<AuthenticatedUserState>({ status: 'loading' });
  const [requestVersion, setRequestVersion] = useState(0);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    const loadAuthenticatedUser = async () => {
      try {
        const email = await readAuthenticatedEmail(abortController.signal);

        if (!abortController.signal.aborted) {
          setState({ status: 'authenticated', email });
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setState({
          status: 'error',
          error: error instanceof Error ? error.message : '邮箱身份验证失败。',
        });
      }
    };

    void loadAuthenticatedUser();

    return () => {
      abortController.abort();
    };
  }, [requestVersion]);

  return {
    ...state,
    retry,
  };
};
