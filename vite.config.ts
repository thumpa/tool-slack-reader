import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5174,
    strictPort: true,
    fs: {
      allow: ['..']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  optimizeDeps: {
    include: ['emoji-datasource-apple']
  },
  assetsInclude: ['**/*.json', '**/*.png'],
  resolve: {
    alias: {
      'emoji-datasource-apple': 'node_modules/emoji-datasource-apple'
    }
  }
}); 