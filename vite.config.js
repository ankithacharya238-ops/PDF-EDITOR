import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  optimizeDeps: {
    include: ['pdfjs-dist', 'pdf-lib', 'fabric', 'three', 'pako', 'idb'],
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          pdfjs: ['pdfjs-dist'],
          pdflib: ['pdf-lib', 'pako'],
          fabric: ['fabric'],
          three: ['three'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
