import path from 'path';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  build: {
    outDir: 'lib',
    sourcemap: true,
    target: 'es2022',
    minify: false,
    rollupOptions: {
      input: 'src/index.ts',
      preserveEntrySignatures: 'allow-extension',
      output: {
        format: 'es',
        preserveModules: true,
        preserveModulesRoot: path.resolve(__dirname, 'src'),
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
      external: [
        '@yuhere/js-base64',
        '@yuhere/js-ieee754',
      ],
    },
  },
});
