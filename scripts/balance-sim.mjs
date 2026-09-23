import fs from 'node:fs';
import http from 'node:http';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const outPath = outIndex >= 0 ? args[outIndex + 1] : 'artifacts/balance.json';
fs.mkdirSync('artifacts', { recursive: true });
const html = fs.readFileSync('index.html');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  res.end(html);
});
await new Promise(resolve => server.listen(4174, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 768 } });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('http://127.0.0.1:4174/', { waitUntil: 'load' });
  await page.waitForTimeout(900);
  if (pageErrors.length) throw new Error('Page errors: ' + pageErrors.join(' | '));
  const report = await page.evaluate(() => {
    const initialActive = S.active;
    const levels = [1, 5, 10, 25, 50, 75, 100, 150, 200];
    const expCurve = levels.map(level => ({ level, expNeed: expNeed(level) }));
    const cumulativeExp = {};
    for (const target of [10, 25, 50, 100, 150, 200]) {
      let total = 0;
      for (let lv = 1; lv < target; lv++) total += expNeed(lv);
      cumulativeExp[target] = total;
    }
    const skillCosts = [1, 5, 10, 25, 50, 75, 100].map(level => ({
      level,
      skill1: skillUnitCost(0, level),
      skill2: skillUnitCost(1, level),
      skill3: skillUnitCost(2, level)
    }));
    const growthCosts = {};
    for (const key of ['atk', 'aspd', 'speed', 'crit']) {
      growthCosts[key] = [0, 10, 25, 50, 100].map(level => ({ level, cost: growthUnitCost(key, level) }));
    }
    const jobs = {};
    for (const def of CHARACTERS) {
      S.active = def.id;
      const st = calcStats();
      jobs[def.id] = {
        job: def.job,
        level: getC().level,
        attack: st.atk,
        attackSpeed: st.aspd,
        doubleChance: st.doubleChance,
        crit: st.crit,
        critDamage: st.critDamage,
        normalDamageMultiplier: st.normalDmg,
        bossDamageMultiplier: st.bossDmg,
        finalDamageMultiplier: st.finalDmg,
        skillDamageMultiplier: st.skillDmg,
        power: st.power
      };
    }
    S.active = initialActive;
    const potentialMonteCarlo = {};
    const rarities = Object.keys(POTENTIAL_RANGES);
    for (const rarity of rarities) {
      const samples = [];
      for (let n = 0; n < 10000; n++) {
        const item = { rarity };
        let sum = 0;
        for (let line = 0; line < 3; line++) sum += rollPotentialValue(item);
        samples.push(sum);
      }
      samples.sort((a, b) => a - b);
      const average = samples.reduce((a, b) => a + b, 0) / samples.length;
      potentialMonteCarlo[rarity] = {
        samples: samples.length,
        averageMainStatPct: average,
        averageAttackPct: average * 10,
        p50MainStatPct: samples[Math.floor(samples.length * 0.50)],
        p90MainStatPct: samples[Math.floor(samples.length * 0.90)],
        p99MainStatPct: samples[Math.floor(samples.length * 0.99)],
        maxObservedMainStatPct: samples[samples.length - 1]
      };
    }
    const financeExpectedReturnPerSettlement = 0.99 * 0.01 + 0.80 * 0.30 + 0.50 * 1.00 + 0.30 * 2.50;
    return {
      expCurve,
      cumulativeExp,
      skillCosts,
      growthCosts,
      jobs,
      potentialMonteCarlo,
      finance: {
        expectedInterestRatePer30Seconds: financeExpectedReturnPerSettlement,
        expectedBalanceMultiplierPer30Seconds: 1 + financeExpectedReturnPerSettlement
      },
      invariants: {
        potential400MainStatPctToAttackPct: 400 * 10,
        maxCompanions: 3
      }
    };
  });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
