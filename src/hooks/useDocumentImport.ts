import { useCallback, useEffect, useRef, useState } from 'react';
import { importRagDocument } from '../services/ragApi';
import type { DocumentImportFeedback } from '../types/documentImport';

export const useDocumentImport = () => {
  const [documentImportFeedback, setDocumentImportFeedback] = useState<DocumentImportFeedback>({ status: 'idle' });
  const abortControllerRef = useRef<AbortController | null>(null);

  const importDocument = useCallback(async (file: File) => {
    const abortController = new AbortController();
    abortControllerRef.current?.abort();
    abortControllerRef.current = abortController;

    setDocumentImportFeedback({
      status: 'loading',
      message: `正在导入 ${file.name}...`,
    });

    try {
      await importRagDocument({
        file,
        signal: abortController.signal,
      });

      if (abortControllerRef.current !== abortController) {
        return;
      }

      setDocumentImportFeedback({
        status: 'success',
        message: `已导入 ${file.name}，可以开始提问。`,
      });
    } catch (error) {
      if (abortControllerRef.current !== abortController) {
        return;
      }

      if (typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError') {
        setDocumentImportFeedback({ status: 'idle' });
        return;
      }

      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setDocumentImportFeedback({
        status: 'error',
        message: `导入 ${file.name} 失败：${errorMessage}`,
      });
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, []);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  return {
    documentImportFeedback,
    importDocument,
    isImportingDocument: documentImportFeedback.status === 'loading',
  };
};
