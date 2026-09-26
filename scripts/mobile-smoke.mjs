import { readFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';

const html = readFileSync('index.html', 'utf8');
const inline = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
if (!inline) throw new Error('Game script missing');
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', error => { if (!error.message.includes('navigation (except hash changes)')) throw error; });
const dom = new JSDOM(html, { url: 'https://sprout.test/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole });
const { window } = dom;
window.requestAnimationFrame = () => 0;
window.confirm = () => true;
window.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, {
  get: (_, key) => key === 'measureText' ? () => ({ width: 10 }) : () => {}
});
window.eval(inline + '\nwindow.__test = {getState:()=>S,getParty:()=>party};');
window.document.getElementById('startGameBtn').click();
if (!window.document.getElementById('starterScreen').classList.contains('show')) throw new Error('Starter screen did not open');
if (!window.document.querySelector('.starterCard')) throw new Error('Starter choices missing');
const state = window.__test.getState();
state.profileStarted = true;
state.chars[state.active].worldBossCleared = 20;
state.worldBossDaily = { day: window.worldBossRewardDay(), repeats: 0 };
const gems = state.gems;
for (let n = 0; n < 4; n++) {
  window.openParty(20);
  window.__test.getParty().bossHp = 1;
  window.__test.getParty().bossMaxHp = 100;
  window.partyAction('assault');
}
if (state.worldBossDaily.repeats !== 3) throw new Error('Repeat cap failed');
if (state.gems - gems !== 450) throw new Error('Repeat gems granted past cap');
state.chars[state.active].worldBossCleared = 0;
window.openParty(20);
window.__test.getParty().bossHp = 1;
window.__test.getParty().bossMaxHp = 100;
window.partyAction('assault');
if (state.gems - gems !== 2450) throw new Error('First clear grant failed');
if (window.engravingGradeLabel('레전더리') !== '거목') throw new Error('Legacy grade display failed');
window.sproutRewardAdsEnabled = true;
const adGems = state.gems;
for (let n = 0; n < 3; n++) window.grantRewardedAd();
if (state.gems - adGems !== 160 || state.rewardAdDaily.count !== 2) throw new Error('Rewarded ad cap failed');
if (window.document.getElementById('exportSaveBtn')?.textContent !== '세이브 백업') throw new Error('Backup control missing');
const saved = JSON.parse(JSON.stringify(state));
saved.chars[saved.active].level = 123;
const payload = JSON.stringify({ format: 'sprout-expedition-save', schema: 19, state: saved });
await window.importSaveFile({ size: payload.length, text: async () => payload });
if (JSON.parse(window.localStorage.getItem('sproutFinalV19')).chars[saved.active].level !== 123) throw new Error('Import did not persist');
if (!window.localStorage.getItem('sproutBeforeImportV19')) throw new Error('Import did not back up the previous save');
console.log('Game loaded; intro, world boss and ad caps, first clear, legacy grade and save import passed.');
window.close();
