// Builds what Cloudflare serves. Copies public/ to dist/ and squeezes the stylesheets and scripts on the way,
// so the live site hands out compact files instead of the readable, commented sources kept in public/.
// Runs by itself before `wrangler dev` and `wrangler deploy` (see "build" in wrangler.jsonc).
import { build } from 'esbuild';
import { cp, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await cp('public', 'dist', { recursive: true });
await build({
  entryPoints: ['public/assets/js/site.js', 'public/assets/js/admin.js', 'public/assets/css/site.css', 'public/assets/css/admin.css'],
  outbase: 'public',
  outdir: 'dist',
  allowOverwrite: true,
  bundle: false,
  minify: true,
  legalComments: 'none',
  logLevel: 'warning',
});
