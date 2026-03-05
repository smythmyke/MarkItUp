import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: 'src/web',
  base: '/MarkItUp/',
  build: {
    outDir: '../../docs',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      // Let web imports resolve the same paths as the extension
    },
  },
  publicDir: '../../public',
});
