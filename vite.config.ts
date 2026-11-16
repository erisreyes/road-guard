import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: { host: true }, // reachable from the iPad on the same Wi-Fi (HTTPS via basicSsl)
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Road Guard',
        short_name: 'Road Guard',
        display: 'standalone',
        orientation: 'landscape',
        background_color: '#0B0C0E',
        theme_color: '#0B0C0E',
        start_url: '/',
      },
    }),
  ],
});
