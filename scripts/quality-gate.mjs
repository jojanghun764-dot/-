import fs from 'node:fs';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const baselineStatic = read('artifacts/baseline-static.json');
const candidateStatic = read('artifacts/candidate-static.json');
const baselineRuntime = read('artifacts/baseline-runtime.json');
const candidateRuntime = read('artifacts/candidate-runtime.json');
const candidateBalance = read('artifacts/candidate-balance.json');

const failures = [];
if (candidateStatic.duplicateFunctionNames > baselineStatic.duplicateFunctionNames) failures.push('Duplicate named functions increased.');
if (candidateRuntime.pageErrors?.length) failures.push('Candidate has browser page errors.');
if (candidateRuntime.consoleErrors?.length) failures.push('Candidate has browser console errors.');
for (const view of ['smallMobile', 'mobile', 'mobileLandscape']) {
  if (!candidateRuntime.views?.[view]) failures.push(view + ' runtime audit missing.');
  if (candidateRuntime.views?.[view]?.horizontalOverflow) failures.push(view + ' has horizontal overflow.');
  if (candidateRuntime.views?.[view]?.tinyTapTargets?.length) failures.push(view + ' has tap targets smaller than 32px.');
}
for (const view of ['smallMobile', 'mobile', 'mobileLandscape', 'desktop']) {
  if (!candidateRuntime.views?.[view]?.canvas) failures.push(view + ' battle canvas missing.');
}
if (!candidateRuntime.saveProbe?.supported || candidateRuntime.saveProbe.savedVersion !== 19 || candidateRuntime.saveProbe.reloadedVersion !== 19 || candidateRuntime.saveProbe.savedGold !== candidateRuntime.saveProbe.expectedGold || candidateRuntime.saveProbe.reloadedGold !== candidateRuntime.saveProbe.expectedGold) failures.push('V19 save persistence probe failed.');
if (!candidateBalance.v19FullResetTest?.pass) failures.push('V19 complete reset invariant failed.');
if (!candidateBalance.levelProgressionTest?.pass) failures.push('Level mastery / roster resonance / synchronized progression invariant failed.');
for (const view of ['smallMobile', 'mobile', 'mobileLandscape', 'desktop']) {
  if (!candidateRuntime.views?.[view]?.intro?.startVisible) failures.push(view + ' title screen missing.');
  if (candidateRuntime.views?.[view]?.starter?.cards !== 5) failures.push(view + ' starter selection is incomplete.');
  if (!candidateRuntime.views?.[view]?.profileStarted || !candidateRuntime.views?.[view]?.runtimeSessionActive) failures.push(view + ' did not enter game after character selection.');
}
if (candidateBalance.invariants?.potential400MainStatPctToAttackPct !== 4000) failures.push('Potential conversion invariant broken.');
const baselineTitle = baselineRuntime.views?.mobile?.title || '';
const candidateTitle = candidateRuntime.views?.mobile?.title || '';
if (!candidateTitle || (baselineTitle && !candidateTitle.includes('새싹'))) failures.push('Game title/identity appears missing.');

if (failures.length) {
  console.error('QUALITY GATE FAILED\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log('QUALITY GATE PASSED');
