import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    proxy: {
      // Exchange the subscription key for a short-lived auth token.
      // The browser uses this token to call Azure Speech SDK directly.

      '/api/azure-token': {
        target: 'https://westeurope.api.cognitive.microsoft.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/azure-token/, '/sts/v1.0/issueToken'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            proxyReq.method = 'POST';
            proxyReq.setHeader('Ocp-Apim-Subscription-Key', process.env.AZURE_SPEECH_KEY!);
          });
        },
      },

      // LLM proxy
      '/api/llm': {
        target: process.env.LLM_TARGET ?? 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/llm/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Authorization', `Bearer ${process.env.LLM_API_KEY!}`);
          });
        },
      },
    },
  },

});
