import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: 'module'
      },
      workbox: {
        // Cache all static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,txt,woff,woff2,ttf,eot}'],
        
        // Increase cache size limits
        maximumFileSizeToCacheInBytes: 5000000, // 5MB
        
        // Clean up old caches
        cleanupOutdatedCaches: true,
        
        // Skip waiting and claim clients immediately
        skipWaiting: true,
        clientsClaim: true,
        
        // Offline fallback
        navigateFallback: '/TWAVoterApp/offline.html',
        navigateFallbackDenylist: [/^\/api\//, /\/__.*$/],
        
        // Runtime caching strategies
        runtimeCaching: [
          // Cache Telegram SDK
          {
            urlPattern: /^https:\/\/telegram\.org\/js\/telegram-web-app\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'telegram-sdk-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          
          // Cache API calls (for future use)
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          
          // Cache Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets'
            }
          },
          
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          
          // Cache same-origin navigation requests
          {
            urlPattern: ({ request, url }) => 
              request.mode === 'navigate' && url.origin === self.location.origin,
            handler: 'CacheFirst',
            options: {
              cacheName: 'navigation-cache'
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'TWA Field Survey - Offline Ready',
        short_name: 'FieldSurvey',
        description: 'Telegram Web App for house-to-house voter surveys with offline support',
        theme_color: '#2481cc',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/TWAVoterApp/',
        start_url: '/TWAVoterApp/',
        categories: ['productivity', 'business', 'utilities'],
        lang: 'en',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  base: '/TWAVoterApp/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  server: {
    host: true,
    port: 3000
  }
})