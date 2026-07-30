import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  /**
   * GitHub Pages serves this repo from https://<user>.github.io/SPEN/, so the
   * app lives under a subpath and needs an absolute base — a relative './'
   * breaks the service worker scope and the manifest's start_url.
   *
   * Deploying to a root domain instead (Vercel, Netlify, a custom domain)?
   * Build with BASE_PATH=/ and everything resolves at the root.
   */
  base: process.env.BASE_PATH ?? '/SPEN/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'icon.svg'],
      manifest: {
        name: 'Xpenz',
        short_name: 'Xpenz',
        description: 'Gastos e ingresos, anotados hablando.',
        lang: 'es',
        dir: 'ltr',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#EDEBE6',
        theme_color: '#EDEBE6',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Never cache the Anthropic API.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
})
