import fs from 'node:fs';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const baselineStatic = read('artifacts/baseline-static.json');
const candidateStatic = read('artifacts/candidate-static.json');
const baselineRuntime = read('artifacts/baseline-runtime.json');
const candidateRuntime = read('artifacts/candidate-runtime.json');
const candidateBalance = read('artifacts/candidate-balance.json');

const failures = [];
if (candidateStatic.duplicateFunctionNames > baselineStatic.duplicateFunctionNames) {
  failures.push('Duplicate named functions increased.');
}
if (candidateRuntime.pageErrors?.length) failures.push('Candidate has browser page errors.');
if (candidateRuntime.views?.mobile?.horizontalOverflow) failures.push('Candidate has mobile horizontal overflow.');
if (!candidateRuntime.views?.mobile?.canvas || !candidateRuntime.views?.desktop?.canvas) failures.push('Battle canvas missing.');
if (candidateBalance.invariants?.potential400MainStatPctToAttackPct !== 4000) failures.push('Potential conversion invariant broken.');
const baselineTitle = baselineRuntime.views?.mobile?.title || '';
const candidateTitle = candidateRuntime.views?.mobile?.title || '';
if (!candidateTitle || (baselineTitle && !candidateTitle.includes('새싹'))) failures.push('Game title/identity appears missing.');

if (failures.length) {
  console.error('QUALITY GATE FAILED\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log('QUALITY GATE PASSED');
