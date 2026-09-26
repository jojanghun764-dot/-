import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url);
const ledger = JSON.parse(readFileSync(new URL('release/asset-ledger.json', root), 'utf8'));
const recorded = new Map(ledger.assets.map(item => [item.path, item]));
const missing = [];
const changed = [];
const unverified = [];
for (const filename of readdirSync(new URL('assets/', root))) {
  const path = `assets/${filename}`;
  const item = recorded.get(path);
  if (!item) { missing.push(path); continue; }
  const sha = createHash('sha256').update(readFileSync(new URL(path, root))).digest('hex');
  if (sha !== item.sha256) changed.push(path);
  if (!item.commercial_rights_verified || !item.source_evidence) unverified.push(path);
}
if (missing.length || changed.length || unverified.length) {
  console.error(`Release art gate: ${missing.length} unrecorded, ${changed.length} changed, ${unverified.length} without rights evidence.`);
  if (missing.length) console.error('Unrecorded:', missing.join(', '));
  if (changed.length) console.error('Changed:', changed.join(', '));
  if (unverified.length) console.error('Unverified:', unverified.join(', '));
  process.exitCode = 1;
} else console.log('All release art recorded and rights evidence linked.');
