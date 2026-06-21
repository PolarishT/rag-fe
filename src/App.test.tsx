import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { useRagConversations } from './hooks/useRagConversations';

vi.mock('./hooks/useAuthenticatedUser', () => ({
  useAuthenticatedUser: () => ({
    status: 'loading',
    retry: vi.fn(),
  }),
}));

vi.mock('./hooks/useRagConversations', () => ({
  useRagConversations: vi.fn(),
}));

describe('App identity gate', () => {
  it('does not initialize RAG conversations before the verified email is loaded', () => {
    render(<App />);

    expect(screen.getByText('正在验证邮箱身份')).toBeTruthy();
    expect(useRagConversations).not.toHaveBeenCalled();
  });
});
