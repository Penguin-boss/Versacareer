import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'assets/brand/icon-192.webp', 'assets/brand/icon-512.webp'],
      manifest: {
        name: 'VersaCareer',
        short_name: 'VersaCareer',
        description: 'AI-powered Career Intelligence Platform. Analyze resumes, find skill gaps, build roadmaps, and practice mock interviews.',
        theme_color: '#0A0A08',
        background_color: '#0A0A08',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/assets/brand/icon-192.webp',
            sizes: '192x192',
            type: 'image/webp',
            purpose: 'any maskable'
          },
          {
            src: '/assets/brand/icon-512.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any maskable'
          }
        ],
        categories: ['business', 'productivity', 'education'],
        screenshots: [
          {
            src: '/assets/brand/og-card.webp',
            sizes: '1200x630',
            type: 'image/webp',
            form_factor: 'wide',
            label: 'VersaCareer Dashboard'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,avif,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp|avif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ],
  server: { host: '0.0.0.0', port: 5173 },
  build: {
    target: 'es2019',
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
          ui: ['framer-motion', 'lucide-react', 'recharts'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          supabase: ['@supabase/supabase-js'],
          utils: ['zustand', 'react-hot-toast']
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
           const assetName = assetInfo.name ?? 'asset';
           const info = assetName.split('.');
          const ext = info[info.length - 1];
           if (/\.(png|jpe?g|gif|svg|webp|avif|ico)$/.test(assetName)) {
            return `assets/images/[name]-[hash].${ext}`;
          }
           if (/\.(woff2?|ttf|eot)$/.test(assetName)) {
            return `assets/fonts/[name]-[hash].${ext}`;
          }
          return `assets/[ext]/[name]-[hash].${ext}`;
        }
      }
    },
    // Enable gzip and brotli compression
    reportCompressedSize: true,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000
  },
  resolve: {
    alias: {
      'framer-motion': '/src/lib/mock-framer-motion.tsx'
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-helmet-async', 'framer-motion', 'lucide-react', 'zustand', '@supabase/supabase-js'],
    exclude: ['framer-motion']
  },
  // Enable CSS code splitting
   css: { devSourcemap: true }
})
