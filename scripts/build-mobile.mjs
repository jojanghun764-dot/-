import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const out = join(root, 'www');
rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const file of ['index.html', 'art-ex20.css', 'art-ex20.js']) {
  cpSync(join(root, file), join(out, file));
}
cpSync(join(root, 'assets'), join(out, 'assets'), { recursive: true });
const htmlPath = join(out, 'index.html');
let html = readFileSync(htmlPath, 'utf8');
html = html.replace('width=device-width, initial-scale=1.0', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
html = html.replace('</head>', '<link rel="stylesheet" href="mobile.css" />\n<script type="module" src="mobile.js"></script>\n</head>');
writeFileSync(htmlPath, html);
cpSync(join(root, 'mobile/mobile.css'), join(out, 'mobile.css'));
await build({ entryPoints: [join(root, 'mobile/mobile.js')], outfile: join(out, 'mobile.js'), bundle: true, format: 'iife', platform: 'browser', minify: true, define: { __SPROUT_TEST_ADS__: JSON.stringify(process.env.SPROUT_TEST_ADS === '1') } });
if (!existsSync(join(out, 'assets'))) throw new Error('Mobile assets missing');
console.log('Bundled local game files into www/');
