import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';
import { createHash } from 'node:crypto';

const root = process.cwd();
const out = join(root, 'www');
rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const file of ['index.html', 'art-ex20.css', 'art-ex20.js', 'ui-theme.css']) {
  cpSync(join(root, file), join(out, file));
}
cpSync(join(root, 'fonts'), join(out, 'fonts'), { recursive: true });
cpSync(join(root, 'vfx'), join(out, 'vfx'), { recursive: true });
// Only ship artwork with recorded creation/usage evidence. The canvas renderer
// supplies procedural fallback characters, enemies and scenery.
const ledger = JSON.parse(readFileSync(join(root, 'release/asset-ledger.json'), 'utf8'));
mkdirSync(join(out, 'assets'));
for (const asset of ledger.assets.filter(item => item.commercial_rights_verified && item.source_evidence)) {
  const sha = createHash('sha256').update(readFileSync(join(root, asset.path))).digest('hex');
  if (sha !== asset.sha256) throw new Error(`Release asset changed since rights review: ${asset.path}`);
  cpSync(join(root, asset.path), join(out, asset.path));
}
const htmlPath = join(out, 'index.html');
let html = readFileSync(htmlPath, 'utf8');
html = html.replace('width=device-width, initial-scale=1.0', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
html = html.replace('</head>', '<script>window.SPROUT_VERIFIED_ASSETS_ONLY=true</script>\n<link rel="stylesheet" href="mobile.css" />\n<script type="module" src="mobile.js"></script>\n</head>');
writeFileSync(htmlPath, html);
cpSync(join(root, 'mobile/mobile.css'), join(out, 'mobile.css'));
await build({ entryPoints: [join(root, 'mobile/mobile.js')], outfile: join(out, 'mobile.js'), bundle: true, format: 'iife', platform: 'browser', minify: true, define: { __SPROUT_TEST_ADS__: JSON.stringify(process.env.SPROUT_TEST_ADS === '1') } });
if (!existsSync(join(out, 'assets'))) throw new Error('Mobile assets missing');
console.log('Bundled local game files into www/');
