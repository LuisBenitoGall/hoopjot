import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['hoopnote-mark.svg', 'pwa-192x192.svg', 'pwa-512x512.svg'],
      manifest: {
        name: 'Hoopnote',
        short_name: 'Hoopnote',
        description: 'An offline-first basketball development journal.',
        theme_color: '#ff7a00',
        background_color: '#fffaf5',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,png,webmanifest}'],
        navigateFallback: '/index.html',
        runtimeCaching: []
      },
      devOptions: {
        enabled: false
      }
    })
  ]
});

