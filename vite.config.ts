import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Bundles everything (JS, CSS, favicon) into one index.html so the prototype
// can be opened directly via file:// on a phone, no dev server required.
export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
  },
});
