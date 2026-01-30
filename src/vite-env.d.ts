/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly TAURI_PLATFORM?: string;
  readonly TAURI_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
