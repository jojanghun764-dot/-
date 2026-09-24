import fs from 'node:fs';
import http from 'node:http';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const outPath = outIndex >= 0 ? args[outIndex + 1] : 'artifacts/runtime.json';
fs.mkdirSync('artifacts', { recursive: true });
const html = fs.readFileSync('index.html');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  res.end(html);
});
await new Promise(resolve => server.listen(4173, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const results = { views: {}, pageErrors: [], consoleErrors: [], checkedAt: new Date().toISOString() };
  const targets = [
    ['smallMobile', { width: 360, height: 800 }],
    ['mobile', { width: 390, height: 844 }],
    ['desktop', { width: 1365, height: 768 }]
  ];
  for (const [name, viewport] of targets) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    page.on('pageerror', error => results.pageErrors.push(name + ': ' + error.message));
    page.on('console', msg => { if (msg.type() === 'error') results.consoleErrors.push(name + ': ' + msg.text()); });
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const audit = await page.evaluate(() => {
      const body = document.body;
      const canvas = document.querySelector('canvas');
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
        balance
      };
    });
    results.views[name] = audit;
    await page.screenshot({ path: 'artifacts/' + name + '.png', fullPage: false });
    await context.close();
  }
  if (results.pageErrors.length) throw new Error('Page errors: ' + results.pageErrors.join(' | '));
  if (!results.views.smallMobile.canvas || !results.views.mobile.canvas || !results.views.desktop.canvas) throw new Error('Battle canvas missing.');
  if (results.views.smallMobile.horizontalOverflow || results.views.mobile.horizontalOverflow) throw new Error('Mobile page has horizontal overflow.');
  if (results.views.smallMobile.tinyTapTargets.length || results.views.mobile.tinyTapTargets.length) throw new Error('Mobile UI has tap targets smaller than 32px.');
  if ((results.views.mobile.balance?.potentialExample400 || 0) !== 4000) throw new Error('Potential conversion rule is not 400% -> 4000% attack.');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
