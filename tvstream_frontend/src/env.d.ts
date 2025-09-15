/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_USE_LOCAL?: string;
    readonly VITE_IPTV_M3U_URL?: string;
    readonly VITE_IPTV_ALLOWED_CATS?: string;
    readonly VITE_IPTV_DISABLE?: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  