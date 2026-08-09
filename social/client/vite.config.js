import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: 'Kek Start',
        short_name: 'Kek Start',
        description: 'Kek Start Social Media App',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/kek-start.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/kek-start.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],

  server: {
    port: 5173,

    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },

      '/media': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
