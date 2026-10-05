import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// @ts-expect-error Build-only Node plugin.
import contentPlugin from './scripts/content.mjs';

export default defineConfig({
  base: '/',
  plugins: [contentPlugin(), react(), tailwindcss()],
  build: { rollupOptions: { output: { manualChunks: { three: ['three'] } } } },
});
