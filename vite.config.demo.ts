import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('./src/demo', import.meta.url)),
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  resolve: { alias: { '@core': fileURLToPath(new URL('./src/core', import.meta.url)) } },
  build: {
    outDir: fileURLToPath(new URL('./dist/demo', import.meta.url)),
    emptyOutDir: true,
  },
});
