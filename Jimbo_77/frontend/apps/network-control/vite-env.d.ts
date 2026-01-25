/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_BACKEND_API_URL: string
  readonly VITE_AGENT_ZERO_API_URL: string
  readonly VITE_AGENT_ZERO_API_KEY: string
  readonly VITE_OPENROUTER_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
