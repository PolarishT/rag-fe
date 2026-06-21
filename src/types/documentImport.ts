type DocumentImportStatus = 'idle' | 'loading' | 'success' | 'error';

export interface DocumentImportFeedback {
  status: DocumentImportStatus;
  message?: string;
}
