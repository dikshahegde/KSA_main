/// <reference types="vite/client" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_KEY: string;
  // add other VITE_ env vars here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
