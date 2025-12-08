/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HLS_PROXY?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
