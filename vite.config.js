import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = Number(env.VITE_PORT);
  const host = env.VITE_HOST;
  const backendTarget = env.VITE_BACKEND_TARGET;

  return {
    plugins: [react()],
    server: {
      port,
      host,
      proxy: {
        '/api': { target: backendTarget, changeOrigin: true }
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
