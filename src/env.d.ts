/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly BANQUET_REGISTRATION_PREVIEW?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  jrhofTrack?: (eventName: string, params?: Record<string, unknown>) => void;
}
