import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { importRagDocument } from '../services/ragApi';
import { useDocumentImport } from './useDocumentImport';

vi.mock('../services/ragApi', () => ({
  importRagDocument: vi.fn(),
}));

const createMarkdownFile = () => new File(['# Hello'], 'hello.md', { type: 'text/markdown' });

describe('useDocumentImport', () => {
  beforeEach(() => {
    vi.mocked(importRagDocument).mockReset();
  });

  it('reports loading and success feedback while importing a document', async () => {
    let resolveImport: () => void = () => {};
    vi.mocked(importRagDocument).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveImport = () => resolve({});
      }),
    );

    const { result } = renderHook(() => useDocumentImport());

    act(() => {
      void result.current.importDocument(createMarkdownFile());
    });

    expect(result.current.documentImportFeedback).toMatchObject({
      status: 'loading',
      message: '正在导入 hello.md...',
    });

    await act(async () => {
      resolveImport();
    });

    expect(result.current.documentImportFeedback).toMatchObject({
      status: 'success',
      message: '已导入 hello.md，可以开始提问。',
    });
  });

  it('reports import errors', async () => {
    vi.mocked(importRagDocument).mockRejectedValueOnce(new Error('backend unavailable'));
    const { result } = renderHook(() => useDocumentImport());

    await act(async () => {
      await result.current.importDocument(createMarkdownFile());
    });

    expect(result.current.documentImportFeedback).toMatchObject({
      status: 'error',
      message: '导入 hello.md 失败：backend unavailable',
    });
  });

  it('returns to idle when the import is aborted', async () => {
    vi.mocked(importRagDocument).mockRejectedValueOnce(new DOMException('aborted', 'AbortError'));
    const { result } = renderHook(() => useDocumentImport());

    await act(async () => {
      await result.current.importDocument(createMarkdownFile());
    });

    expect(result.current.documentImportFeedback).toEqual({ status: 'idle' });
  });
});
