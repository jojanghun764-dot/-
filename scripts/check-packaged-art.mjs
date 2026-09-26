import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ledger = JSON.parse(readFileSync('release/asset-ledger.json', 'utf8'));
const approved = new Map(ledger.assets.filter(item => item.commercial_rights_verified && item.source_evidence).map(item => [item.path, item.sha256]));
const fonts = new Map([
  ['Galmuri11-Bold.woff2', '8643094f395aa2dbad6bc4385cc043314801eaec2e759d549435ec8ac4f2d078'],
  ['PretendardVariable.woff2', '9599f12fd42fc0bce1cd50b47a0c022e108d7aa64dd0d1bb0ed44f3282d900b4'],
]);
for (const directory of ['www/assets', 'android/app/src/main/assets/public/assets']) {
  const files = readdirSync(directory).map(name => `assets/${name}`);
  for (const file of files) {
    const sha = createHash('sha256').update(readFileSync(join(directory, file.slice(7)))).digest('hex');
    if (approved.get(file) !== sha) throw new Error(`Unapproved packaged asset: ${directory}/${file}`);
  }
  if (files.length !== approved.size) throw new Error(`Approved assets missing in ${directory}`);
  console.log(`${directory}: ${files.length} approved asset(s)`);
}
for (const directory of ['www/fonts', 'android/app/src/main/assets/public/fonts']) {
  for (const [name, expected] of fonts) {
    const sha = createHash('sha256').update(readFileSync(join(directory, name))).digest('hex');
    if (sha !== expected) throw new Error(`Unexpected font bytes: ${directory}/${name}`);
  }
  for (const name of ['Galmuri-LICENSE.txt', 'Pretendard-LICENSE.txt']) {
    if (!readFileSync(join(directory, name), 'utf8').includes('SIL OPEN FONT LICENSE')) throw new Error(`Font license missing: ${directory}/${name}`);
  }
  console.log(`${directory}: font hashes and license notices verified`);
}
