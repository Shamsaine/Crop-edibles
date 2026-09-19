import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
const proxy = { '/api': { target: 'http://127.0.0.1:4000', changeOrigin: false } };
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { headers: { 'Referrer-Policy': 'no-referrer-when-downgrade', 'Cross-Origin-Opener-Policy': 'same-origin-allow-popups' }, port: 3000, strictPort: true, proxy, hmr: process.env.DISABLE_HMR !== 'true', watch: process.env.DISABLE_HMR === 'true' ? null : {} },
  preview: { port: 3000, strictPort: true, proxy },
});
