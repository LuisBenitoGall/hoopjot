import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      injectRegister: null,
      registerType: 'prompt',
      includeAssets: [
        'hoopjot-icon.png',
        'hoopjot-logo.png',
        'pattern.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-maskable.png'
      ],
      manifest: {
        id: '/',
        name: 'Hoopjot',
        short_name: 'Hoopjot',
        description: 'An offline-first basketball development journal.',
        background_color: '#fffaf5',
        categories: ['sports', 'health', 'productivity'],
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui', 'browser'],
        lang: 'en',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        theme_color: '#ff7a00',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,svg,ico,png,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/auth\/v1\//,
          /^\/rest\/v1\//,
          /^\/storage\/v1\//
        ],
        runtimeCaching: [
          {
            handler: 'NetworkOnly',
            urlPattern: /^https:\/\/[^/]+\.supabase\.co\/.*$/i
          },
          {
            handler: 'CacheFirst',
            options: {
              cacheName: 'hoopjot-static-assets',
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365,
                maxEntries: 60
              }
            },
            urlPattern: /\.(?:png|svg|webp|jpg|jpeg|gif)$/i
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ]
});
