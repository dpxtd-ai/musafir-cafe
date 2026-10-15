import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

function cafeApiPlugin(): Plugin {
  return {
    name: 'cafe-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';
        if (url === '/api/webhook/order' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            const fallbackOrderNumber = `MC-${Math.floor(100000 + Math.random() * 900000)}`;
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 3500);
              const n8nRes = await fetch('https://ydnyan0804.app.n8n.cloud/webhook/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
                signal: controller.signal
              });
              clearTimeout(timeoutId);

              if (n8nRes.ok) {
                const contentType = n8nRes.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                  const data = await n8nRes.json();
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 200;
                  res.end(JSON.stringify(data));
                  return;
                }
              }
            } catch (err) {
              // n8n offline or unreachable
            }

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                success: true,
                orderNumber: fallbackOrderNumber,
                status: 'confirmed',
                source: 'local_proxy'
              })
            );
          });
          return;
        }

        if (url === '/api/webhook/menu' && req.method === 'GET') {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const n8nRes = await fetch('https://ydnyan0804.app.n8n.cloud/webhook/menu', {
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (n8nRes.ok) {
              const contentType = n8nRes.headers.get('content-type') || '';
              if (contentType.includes('application/json')) {
                const data = await n8nRes.json();
                if (Array.isArray(data) && data.length > 0) {
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 200;
                  res.end(JSON.stringify(data));
                  return;
                }
              }
            }
          } catch (err) {
            // fallback
          }

          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify([]));
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      cafeApiPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: './',
          name: 'Musafir Cafe - Online Ordering',
          short_name: 'Musafir Cafe',
          description:
            'Artisanal cafe digital ordering platform for Musafir Cafe supporting Home Delivery, Dine-In, UPI payments, and instant receipts.',
          theme_color: '#115e59',
          background_color: '#F9F7F2',
          display: 'standalone',
          orientation: 'portrait',
          start_url: './',
          scope: './',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
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
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
