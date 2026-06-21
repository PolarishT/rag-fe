/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RAG_API_BASE_URL?: string;
  readonly VITE_RAG_TOP_K?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
