import { defineConfig } from 'vite';

// base: './' => asset URLs are relative, so the same dist/ works both at a
// domain root (Cloudflare Pages / custom domain) and at a GitHub Pages project
// subpath (https://<user>.github.io/<repo>/). No rebuild needed per host.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Raise the warning threshold only to silence the known Phaser size notice.
    // DEF-01 (shrink Phaser gzip under 200 KB) is tracked separately, not here.
    chunkSizeWarningLimit: 1500,
  },
});
