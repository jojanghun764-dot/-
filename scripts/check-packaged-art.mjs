import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ledger = JSON.parse(readFileSync('release/asset-ledger.json', 'utf8'));
const approved = new Map(ledger.assets.filter(item => item.commercial_rights_verified && item.source_evidence).map(item => [item.path, item.sha256]));
for (const directory of ['www/assets', 'android/app/src/main/assets/public/assets']) {
  const files = readdirSync(directory).map(name => `assets/${name}`);
  for (const file of files) {
    const sha = createHash('sha256').update(readFileSync(join(directory, file.slice(7)))).digest('hex');
    if (approved.get(file) !== sha) throw new Error(`Unapproved packaged asset: ${directory}/${file}`);
  }
  if (files.length !== approved.size) throw new Error(`Approved assets missing in ${directory}`);
  console.log(`${directory}: ${files.length} approved asset(s)`);
}
