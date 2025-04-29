import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true
  },
  publicDir: 'public',
  // Assure que les fichiers statiques sont copiés dans le build
  assetsInclude: ['**/*.png']
});