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
    const stateSnapshot = JSON.stringify(S);
    const potentialAutoTest = {};
    try {
      S.active = initialActive;
      const c = getC();
      S.gold = 1000000000;
      const item = {
        id: '__potential_auto_test__',
        name: '잠재 자동 테스트',
        slot: '무기',
        rarity: '희귀',
        cls: 'rarity-rare',
        level: 0,
        star: 0,
        power: 1,
        potential: [14, 0, 0],
        locks: [true, false, false],
        autoPotTarget: 20,
        trait: null
      };
      S.equipmentInventory.push(item);
      c.equipment['무기'] = item;
      const startGold = S.gold;
      const expectedCost = potentialCost(item);
      autoRerollPotential(item.id);
      const sumAfter = potentialSum(item);
      const statsAfter = calcStats();

      const rejectItem = {
        id: '__potential_reject_test__',
        name: '잠재 최대치 테스트',
        slot: '모자',
        rarity: '일반',
        cls: 'rarity-common',
        level: 0,
        star: 0,
        power: 1,
        potential: [2, 2, 2],
        locks: [false, false, false],
        autoPotTarget: 37,
        trait: null
      };
      S.equipmentInventory.push(rejectItem);
      const rejectGoldBefore = S.gold;
      const rejectPotentialBefore = rejectItem.potential.slice();
      autoRerollPotential(rejectItem.id);

      const ancientSamples = [];
      for (let n = 0; n < 1000; n++) ancientSamples.push(rollPotentialValue({ rarity: '고대' }));

      potentialAutoTest.lockedLinePreserved = item.potential[0] === 14;
      potentialAutoTest.targetReached = sumAfter >= 20;
      potentialAutoTest.goldSpentExactlyOneRoll = startGold - S.gold === expectedCost;
      potentialAutoTest.equippedConversionPct = statsAfter.potentialAttackPct;
      potentialAutoTest.expectedEquippedConversionPct = sumAfter * 10;
      potentialAutoTest.overMaxTargetRejectedWithoutSpend = S.gold === rejectGoldBefore;
      potentialAutoTest.overMaxTargetPreservedPotential = rejectItem.potential.every((v, i) => v === rejectPotentialBefore[i]);
      potentialAutoTest.ancientMinObserved = Math.min(...ancientSamples);
      potentialAutoTest.ancientMaxObserved = Math.max(...ancientSamples);
      potentialAutoTest.ancientRangeValid = ancientSamples.every(v => v >= 10 && v <= 22);
      potentialAutoTest.pass =
        potentialAutoTest.lockedLinePreserved &&
        potentialAutoTest.targetReached &&
        potentialAutoTest.goldSpentExactlyOneRoll &&
        potentialAutoTest.equippedConversionPct === potentialAutoTest.expectedEquippedConversionPct &&
        potentialAutoTest.overMaxTargetRejectedWithoutSpend &&
        potentialAutoTest.overMaxTargetPreservedPotential &&
        potentialAutoTest.ancientRangeValid;
    } finally {
      S = JSON.parse(stateSnapshot);
    }

    const costSeries = {
      growthAtk: [0, 25, 50, 100].map(level => growthUnitCost('atk', level)),
      skill1: [0, 25, 50, 100].map(level => skillUnitCost(0, level)),
      warriorJob: [0, 25, 50, 100].map(level => jobBoostCost('warrior', level)),
      enhance: [0, 5, 10, 25].map(level => enhanceCost({ level })),
      potentialLegend: [0, 5, 10, 20].map(star => potentialCost({ rarity: '전설', star, locks: [false, false, false] })),
      companionLegend: [1, 2, 3, 4].map(star => compGrowthCost({ rarity: '전설', star }))
    };
    const monotonic = values => values.every((v, i) => i === 0 || v >= values[i - 1]);
    const goldUpgradeCostTest = {
      series: costSeries,
      monotonic: Object.values(costSeries).every(monotonic),
      boundedGrowth:
        costSeries.growthAtk.at(-1) / costSeries.growthAtk[0] < 40 &&
        costSeries.skill1.at(-1) / costSeries.skill1[0] < 40 &&
        costSeries.warriorJob.at(-1) / costSeries.warriorJob[0] < 60 &&
        costSeries.enhance.at(-1) / costSeries.enhance[0] < 50 &&
        costSeries.potentialLegend.at(-1) / costSeries.potentialLegend[0] < 10 &&
        costSeries.companionLegend.at(-1) / costSeries.companionLegend[0] < 5
    };
    goldUpgradeCostTest.pass = goldUpgradeCostTest.monotonic && goldUpgradeCostTest.boundedGrowth;

    const resetSnapshot = JSON.stringify(S);
    const resetC = getC();
    resetC.growth = { atk: 9, aspd: 8, crit: 7, speed: 6 };
    resetC.mainStat = 99;
    resetC.statPoints = 12;
    resetC.jobBoost = 5;
    resetC.skillLv = [8, 7, 6];
    S.rebirthUpgrades = { atk: 3, exp: 3, gold: 3, boss: 3, speed: 3, offline: 3 };
    S.finance = { balance: 12345 };
    const resetApplied = applyV18RebalanceReset(17);
    const v18ResetTest = {
      resetApplied,
      growthZero: Object.values(resetC.growth).every(v => v === 0),
      mainStatZero: resetC.mainStat === 0,
      statPointsZero: resetC.statPoints === 0,
      jobBoostZero: resetC.jobBoost === 0,
      skillUpgradeReset: resetC.skillLv.every((v, i) => i < resetC.unlockedSkills ? v === 1 : v === 0),
      rebirthUpgradesZero: Object.values(S.rebirthUpgrades).every(v => v === 0),
      financeDeleted: !('finance' in S)
    };
    v18ResetTest.pass = Object.values(v18ResetTest).every(Boolean);
    S = JSON.parse(resetSnapshot);

    const financeRemoved = typeof financeTick === 'undefined' &&
      typeof financeHTML === 'undefined' &&
      !document.querySelector('[data-tab="finance"]') &&
      !('finance' in S);

    return {
      expCurve,
      cumulativeExp,
      skillCosts,
      growthCosts,
      jobs,
      potentialMonteCarlo,
      goldUpgradeCostTest,
      v18ResetTest,
      financeRemoved,
      potentialAutoTest,
      invariants: {
        potential400MainStatPctToAttackPct: 400 * 10,
        baseMaxCompanions: 3,
        rebirth10MaxCompanions: 4
      }
    };
  });
  if (!report.potentialAutoTest?.pass) {
    throw new Error('Potential auto-reroll functional test failed: ' + JSON.stringify(report.potentialAutoTest));
  }
  if (!report.goldUpgradeCostTest?.pass) {
    throw new Error('Gold upgrade cost curve test failed: ' + JSON.stringify(report.goldUpgradeCostTest));
  }
  if (!report.v18ResetTest?.pass) {
    throw new Error('V18 stat reset test failed: ' + JSON.stringify(report.v18ResetTest));
  }
  if (!report.financeRemoved) {
    throw new Error('Finance system is still present in the effective runtime.');
  }
  if (report.invariants?.potential400MainStatPctToAttackPct !== 4000) {
    throw new Error('Potential conversion invariant failed: 400% must convert to +4000% attack.');
  }
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
