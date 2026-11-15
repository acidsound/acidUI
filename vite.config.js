import { defineConfig } from 'vite';
export default defineConfig({
  // Relative paths work both at the domain root and under /acidUI/ on GitHub Pages.
  base: './',
  server: { allowedHosts: ['.e2b.app'] },
  preview: { allowedHosts: ['.e2b.app'] }
});
