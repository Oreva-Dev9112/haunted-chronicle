import { defineConfig } from 'tsup';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  entry: {
    cli: 'src/cli/index.ts',
    'server/start': 'src/server/start.ts',
    'mcp/index': 'src/mcp/index.ts',
  },
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  clean: true,
  splitting: true,
  sourcemap: false,
  esbuildOptions(options) {
    options.alias = { '@core': fileURLToPath(new URL('./src/core', import.meta.url)) };
  },
});
