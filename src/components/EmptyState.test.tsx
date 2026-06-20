import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState, type HotTopicItem } from './EmptyState';

const hotTopics: HotTopicItem[] = [
  {
    id: 'visible-label',
    label: '展示给用户的话题',
    prompt: '实际发送给 AI 的完整提示词',
  },
  {
    id: 'second-topic',
    label: '第二个话题',
    prompt: '第二个提示词',
  },
];

describe('EmptyState', () => {
  it('renders externally supplied hot topics as a semantic list', () => {
    render(<EmptyState hotTopics={hotTopics} onSelectPrompt={vi.fn()} />);

    const list = screen.getByRole('list');

    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(within(list).getByRole('button', { name: /展示给用户的话题/ })).toBeTruthy();
    expect(within(list).getByRole('button', { name: /第二个话题/ })).toBeTruthy();
  });

  it('sends the configured prompt instead of the visible label', () => {
    const onSelectPrompt = vi.fn();
    render(<EmptyState hotTopics={hotTopics} onSelectPrompt={onSelectPrompt} />);

    fireEvent.click(screen.getByRole('button', { name: /展示给用户的话题/ }));

    expect(onSelectPrompt).toHaveBeenCalledWith('实际发送给 AI 的完整提示词');
  });

  it('keeps the hot topics heading when the supplied list is empty', () => {
    render(<EmptyState hotTopics={[]} onSelectPrompt={vi.fn()} />);

    expect(screen.getByRole('heading', { name: '热门话题' })).toBeTruthy();
    expect(screen.queryByRole('listitem')).toBeNull();
  });
});
