import fs from 'node:fs';
import http from 'node:http';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const outPath = outIndex >= 0 ? args[outIndex + 1] : 'artifacts/runtime.json';
fs.mkdirSync('artifacts', { recursive: true });
const server = http.createServer((req, res) => {
  const routes = {
    '/': ['index.html', 'text/html; charset=utf-8'],
    '/index.html': ['index.html', 'text/html; charset=utf-8'],
    '/art-ex20.css': ['art-ex20.css', 'text/css; charset=utf-8'],
    '/art-ex20.js': ['art-ex20.js', 'text/javascript; charset=utf-8']
  };
  const asset = routes[(req.url || '/').split('?')[0]];
  if (!asset) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'content-type': asset[1], 'cache-control': 'no-store' });
  res.end(fs.readFileSync(asset[0]));
});
await new Promise(resolve => server.listen(4173, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const results = { views: {}, pageErrors: [], consoleErrors: [], checkedAt: new Date().toISOString() };
  const targets = [
    ['smallMobile', { width: 360, height: 800 }],
    ['mobile', { width: 390, height: 844 }],
    ['mobileLandscape', { width: 844, height: 390 }],
    ['desktop', { width: 1365, height: 768 }]
  ];

  for (const [name, viewport] of targets) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    page.on('pageerror', error => results.pageErrors.push(name + ': ' + error.message));
    page.on('console', msg => { if (msg.type() === 'error') results.consoleErrors.push(name + ': ' + msg.text()); });
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'load' });
    await page.waitForTimeout(450);

    const introProbe = await page.evaluate(() => {
      const visible = el => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      return {
        startVisible: visible(document.getElementById('startScreen')),
        startButtonText: document.getElementById('startGameBtn')?.textContent?.trim() || '',
        profileStarted: typeof S === 'object' ? !!S.profileStarted : null,
        version: typeof S === 'object' ? S.version : null,
        gold: typeof S === 'object' ? S.gold : null,
        gems: typeof S === 'object' ? S.gems : null
      };
    });

    await page.click('#startGameBtn');
    await page.waitForTimeout(120);
    const starterProbe = await page.evaluate(() => {
      const screen = document.getElementById('starterScreen');
      const r = screen?.getBoundingClientRect();
      const style = screen ? getComputedStyle(screen) : null;
      return {
        visible: !!screen && r.width > 0 && r.height > 0 && style.display !== 'none' && style.visibility !== 'hidden',
        cards: document.querySelectorAll('.starterCard').length,
        chooseButtons: document.querySelectorAll('.starterChoose').length
      };
    });

    await page.click('.starterChoose');
    await page.waitForTimeout(300);

    const audit = await page.evaluate(() => {
      const body = document.body;
      const canvas = document.querySelector('#battleCanvas');
      const get = id => document.getElementById(id)?.textContent || '';
      const visibleButtons = [...document.querySelectorAll('button')].filter(el => {
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      });
      let balance = null;
      try {
        const levels = [1, 10, 25, 50, 100].map(level => ({ level, exp: expNeed(level) }));
        const active = typeof calcStats === 'function' ? calcStats() : null;
        balance = {
          levels,
          activeStats: active ? {
            attack: active.atk,
            attackSpeed: active.aspd,
            crit: active.crit,
            critDamage: active.critDamage,
            potentialMainPct: active.potentialPct,
            potentialAttackPct: active.potentialAttackPct,
            power: active.power
          } : null,
          potentialExample400: 400 * 10,
          skillCosts: typeof skillUnitCost === 'function' ? [1, 10, 25, 50].map(lv => skillUnitCost(0, lv)) : []
        };
      } catch (error) {
        balance = { error: String(error) };
      }
      return {
        title: document.title,
        textSample: body.innerText.slice(0, 500),
        scrollWidth: body.scrollWidth,
        clientWidth: body.clientWidth,
        horizontalOverflow: body.scrollWidth > body.clientWidth + 2,
        canvas: canvas ? { width: canvas.width, height: canvas.height, cssWidth: canvas.getBoundingClientRect().width, cssHeight: canvas.getBoundingClientRect().height } : null,
        visibleButtonCount: visibleButtons.length,
        tinyTapTargets: visibleButtons.filter(el => {
          const r = el.getBoundingClientRect();
          return r.width < 32 || r.height < 32;
        }).map(el => ({ text: (el.textContent || '').trim().slice(0, 40), width: Math.round(el.getBoundingClientRect().width), height: Math.round(el.getBoundingClientRect().height) })),
        gold: get('gold'),
        attack: get('attack'),
        power: get('power'),
        profileStarted: !!S.profileStarted,
        firstCharacter: S.firstCharacter,
        runtimeSessionActive: !!runtimeSessionActive,
        balance
      };
    });
    audit.intro = introProbe;
    audit.starter = starterProbe;
    results.views[name] = audit;

    if (name === 'desktop') {
      const saveProbe = await page.evaluate(() => {
        if (typeof save !== 'function' || typeof S !== 'object') return { supported: false };
        const originalRaw = localStorage.getItem('sproutFinalV19');
        const probeGold = 1234567;
        S.gold = probeGold;
        save();
        const raw = localStorage.getItem('sproutFinalV19');
        const parsed = raw ? JSON.parse(raw) : null;
        sessionStorage.setItem('__saveProbeOriginalV19', originalRaw ?? '__NONE__');
        return { supported: true, savedVersion: parsed?.version, savedGold: parsed?.gold, expectedGold: probeGold, savedProfileStarted: parsed?.profileStarted };
      });
      await page.reload({ waitUntil: 'load' });
      await page.waitForTimeout(250);
      const reloadProbe = await page.evaluate(() => {
        const originalRaw = sessionStorage.getItem('__saveProbeOriginalV19');
        const reloadedGold = typeof S === 'object' ? S.gold : null;
        const reloadedVersion = typeof S === 'object' ? S.version : null;
        const reloadedProfileStarted = typeof S === 'object' ? !!S.profileStarted : null;
        const startButtonText = document.getElementById('startGameBtn')?.textContent?.trim() || '';
        if (originalRaw === '__NONE__' || originalRaw === null) localStorage.removeItem('sproutFinalV19');
        else localStorage.setItem('sproutFinalV19', originalRaw);
        sessionStorage.removeItem('__saveProbeOriginalV19');
        return { reloadedGold, reloadedVersion, reloadedProfileStarted, startButtonText };
      });
      results.saveProbe = { ...saveProbe, ...reloadProbe };
    }

    await page.screenshot({ path: 'artifacts/' + name + '.png', fullPage: false });
    await context.close();
  }

  if (results.pageErrors.length) throw new Error('Page errors: ' + results.pageErrors.join(' | '));
  if (results.consoleErrors.length) throw new Error('Console errors: ' + results.consoleErrors.join(' | '));
  for (const view of ['smallMobile','mobile','mobileLandscape','desktop']) {
    if (!results.views[view]?.intro?.startVisible) throw new Error(view + ' title screen missing.');
    if ((results.views[view]?.starter?.cards || 0) !== 5) throw new Error(view + ' starter selection must show five characters.');
    if (!results.views[view]?.canvas) throw new Error(view + ' battle canvas missing after starter selection.');
    if (!results.views[view]?.profileStarted || !results.views[view]?.runtimeSessionActive) throw new Error(view + ' game did not enter active play after starter selection.');
  }
  if (results.views.smallMobile.horizontalOverflow || results.views.mobile.horizontalOverflow || results.views.mobileLandscape.horizontalOverflow) throw new Error('Mobile page has horizontal overflow.');
  if (results.views.smallMobile.tinyTapTargets.length || results.views.mobile.tinyTapTargets.length || results.views.mobileLandscape.tinyTapTargets.length) throw new Error('Mobile UI has tap targets smaller than 32px.');
  if ((results.views.mobile.balance?.potentialExample400 || 0) !== 4000) throw new Error('Potential conversion rule is not 400% -> 4000% attack.');
  if (!results.saveProbe?.supported || results.saveProbe.savedVersion !== 19 || results.saveProbe.reloadedVersion !== 19 || results.saveProbe.savedGold !== results.saveProbe.expectedGold || results.saveProbe.reloadedGold !== results.saveProbe.expectedGold || !results.saveProbe.savedProfileStarted || !results.saveProbe.reloadedProfileStarted || results.saveProbe.startButtonText !== '이어하기') {
    throw new Error('V19 save reload persistence probe failed.');
  }

  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
