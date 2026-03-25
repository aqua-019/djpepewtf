import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In dev, proxy /api/* to a local Vercel dev server (vercel dev)
      // Run `vercel dev` in a separate terminal, it starts on 3000 by default
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
