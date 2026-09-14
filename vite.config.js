import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = Number(env.VITE_PORT || 5173);
  const host = env.VITE_HOST || '0.0.0.0';
  const backendTarget = env.VITE_BACKEND_TARGET || `http://${env.BACKEND_HOST || '127.0.0.1'}:${env.BACKEND_PORT || 3001}`;

  return {
    plugins: [react()],
    server: {
      port,
      host,
      proxy: {
        '/api': { target: backendTarget, changeOrigin: true },
        '/uploads': { target: backendTarget, changeOrigin: true },
        '/documents': { target: backendTarget, changeOrigin: true },
        '/payments': { target: backendTarget, changeOrigin: true }
      }
    },
    build: {
      sourcemap: false,
      target: 'es2022',
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('react')) {
              return 'vendor';
            }
          }
        }
      }
    }
  };
});
