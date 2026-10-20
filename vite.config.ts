import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],

    server: {
      proxy: {
        '/api/azure-token': {
          target: 'https://westeurope.api.cognitive.microsoft.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/azure-token/, '/sts/v1.0/issueToken'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.method = 'POST';
              proxyReq.setHeader('Ocp-Apim-Subscription-Key', env.AZURE_SPEECH_KEY);
            });
          },
        },
      },
    },

  };
});
