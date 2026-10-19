import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = Number(env.VITE_PORT);
  const host = env.VITE_HOST;
  // This value is used only by the Vite development proxy.  Keeping the
  // browser request relative (`/api`) means the same build works behind
  // Laragon, XAMPP, Docker, or a reverse proxy without a code change.
  const backendTarget = env.VITE_BACKEND_TARGET || 'http://127.0.0.1:3001';

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
