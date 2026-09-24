import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const argValue = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const outPath = argValue('--out', 'artifacts/static.json');
const baselinePath = argValue('--baseline');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/i);
if (!match) {
  console.error('No inline <script> found.');
  process.exit(1);
}
fs.mkdirSync('artifacts', { recursive: true });
const temp = 'artifacts/index-inline.js';
fs.writeFileSync(temp, match[1]);
const syntax = spawnSync(process.execPath, ['--check', temp], { encoding: 'utf8' });
if (syntax.status !== 0) {
  console.error(syntax.stderr || syntax.stdout);
  process.exit(1);
}
const names = [...match[1].matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m => m[1]);
const counts = {};
for (const name of names) counts[name] = (counts[name] || 0) + 1;
const duplicates = Object.entries(counts).filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1]);
const required = [
  'function calcStats',
  'function attack',
  'function expNeed',
  'function equipmentHTML',
  'function companionsHTML',
  'function applyV19FullReset',
  'function initIntroFlow',
  'function classLevelBonuses',
  'function rosterResonance',
  'function progressionScale',
  'PROGRESSION_GROWTH=1.13',
  'id="startScreen"',
  'id="starterScreen"',
  'sproutFinalV19',
  'potentialAttackPct=potentialPct*10'
];
const missing = required.filter(token => !html.includes(token));
const forbidden = [
  'data-tab="finance"',
  'function financeHTML',
  'function financeTick',
  'financeProcessDue()',
  'function diceHTML',
  'function diceTick',
  'diceGameLive',
  '.diceHero{',
  '.financeHero{',
  'function jobBoostCost',
  'function upgradeJobBoost',
  'function jobBoostHTML',
  '직업 강화 골드 부족',
  '· 금융 ·',
  "localStorage.setItem('sproutFinalV17'",
  "localStorage.setItem('sproutFinalV18'"
];
const forbiddenPresent = forbidden.filter(token => html.includes(token));
const result = {
  bytes: Buffer.byteLength(html),
  scriptBytes: Buffer.byteLength(match[1]),
  functionDeclarations: names.length,
  duplicateFunctionNames: duplicates.length,
  duplicates: duplicates.slice(0, 50),
  missingRequiredTokens: missing,
  forbiddenTokensPresent: forbiddenPresent,
  checkedAt: new Date().toISOString()
};
if (missing.length) {
  console.error('Missing required runtime tokens:', missing.join(', '));
  process.exit(1);
}
if (forbiddenPresent.length) {
  console.error('Forbidden legacy runtime tokens still present:', forbiddenPresent.join(', '));
  process.exit(1);
}
if (baselinePath && fs.existsSync(baselinePath)) {
  const base = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  if (result.duplicateFunctionNames > base.duplicateFunctionNames) {
    console.error('Duplicate named functions increased from ' + base.duplicateFunctionNames + ' to ' + result.duplicateFunctionNames);
    process.exit(1);
  }
}
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
