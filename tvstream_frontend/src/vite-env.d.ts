/// <reference types="vite/client" />

// Optional: declare your own env vars so TS knows they exist
interface ImportMetaEnv {
  readonly VITE_USE_LOCAL?: string;
  // add more: readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}