import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import http from 'http';

export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode
  const env = loadEnv(mode, process.cwd(), '');

  // Default to localhost for local dev, unless explicitly overridden.
  const targetUrl = mode === 'development'
    ? (env.VITE_API_URL || 'http://localhost:3000')
    : 'https://stunnaswagseason.onrender.com';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: targetUrl,
          changeOrigin: true,
          secure: false,
          // Force IPv4 locally to prevent Node.js ETIMEDOUT on localhost.
          agent: mode === 'development' ? new http.Agent({ family: 4 }) : undefined,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Isolate massive 3D WebGL libraries into a distinct chunk for aggressive browser caching
            if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) {
              return 'vendor-three';
            }
          }
        }
      }
    }
  };
});
