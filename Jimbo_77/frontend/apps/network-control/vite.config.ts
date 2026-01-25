import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5174,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.VITE_OPENROUTER_API_KEY': JSON.stringify(env.VITE_OPENROUTER_API_KEY),
        'process.env.VITE_BACKEND_API_URL': JSON.stringify(env.VITE_BACKEND_API_URL),
        'process.env.VITE_AGENT_ZERO_API_URL': JSON.stringify(env.VITE_AGENT_ZERO_API_URL),
        'process.env.VITE_AGENT_ZERO_API_KEY': JSON.stringify(env.VITE_AGENT_ZERO_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
