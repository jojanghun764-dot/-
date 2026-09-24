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
        costSeries.enhance.at(-1) / costSeries.enhance[0] < 50 &&
        costSeries.potentialLegend.at(-1) / costSeries.potentialLegend[0] < 10 &&
        costSeries.companionLegend.at(-1) / costSeries.companionLegend[0] < 5
    };
    goldUpgradeCostTest.pass = goldUpgradeCostTest.monotonic && goldUpgradeCostTest.boundedGrowth;

    const progressionSnapshot = JSON.stringify(S);
    const levelProgressionTest = {};
    try {
      const c = getC();
      S.active = 'warrior';
      c.level = 1;
      c.growth = { atk: 0, aspd: 0, crit: 0, speed: 0 };
      c.mainStat = 0;
      c.equipment = {};
      c.companions = [];
      const lv1 = calcStats();
      c.level = 50;
      const lv50 = calcStats();
      const warrior1 = classLevelBonuses('warrior', 1);
      const warrior100 = classLevelBonuses('warrior', 100);

      Object.values(S.chars).forEach(ch => { ch.level = 1; ch.exp = 0; });
      S.chars.warrior.level = 31;
      S.chars.mage.level = 31;
      S.chars.archer.level = 31;
      S.chars.rogue.level = 31;
      S.chars.paladin.level = 31;
      const rr = rosterResonance();

      levelProgressionTest.sharedFactor = PROGRESSION_GROWTH;
      levelProgressionTest.scaleLv1 = progressionScale(1);
      levelProgressionTest.scaleLv50 = progressionScale(50);
      levelProgressionTest.enemyLevelRatioMatched =
        Math.abs((progressionScale(50) / progressionScale(49)) - PROGRESSION_GROWTH) < 1e-9;
      levelProgressionTest.attackGrowsWithLevel = lv50.atk > lv1.atk * 100;
      levelProgressionTest.classMasteryGrows =
        warrior100.finalDmg > warrior1.finalDmg && warrior100.bossDmg > warrior1.bossDmg;
      levelProgressionTest.rosterTotalLevel = rr.totalLevel;
      levelProgressionTest.rosterBonusesActive =
        rr.finalPct > 0 && rr.skillPct > 0 && rr.aspdFlat > 0 && rr.critPct > 0 && rr.bossPct > 0;
      levelProgressionTest.trainingUnlocked = rr.trainingPct > 0;
      levelProgressionTest.noGoldClassUpgradeRuntime =
        typeof jobBoostCost === 'undefined' &&
        typeof upgradeJobBoost === 'undefined' &&
        typeof jobBoostHTML === 'undefined';
      levelProgressionTest.pass =
        levelProgressionTest.sharedFactor === 1.13 &&
        levelProgressionTest.scaleLv1 === 1 &&
        levelProgressionTest.enemyLevelRatioMatched &&
        levelProgressionTest.attackGrowsWithLevel &&
        levelProgressionTest.classMasteryGrows &&
        levelProgressionTest.rosterBonusesActive &&
        levelProgressionTest.trainingUnlocked &&
        levelProgressionTest.noGoldClassUpgradeRuntime;
    } finally {
      S = JSON.parse(progressionSnapshot);
    }

    const resetSnapshot = JSON.stringify(S);
    S.profileStarted = true;
    S.firstCharacter = 'rogue';
    S.gold = 987654;
    S.gems = 4321;
    S.worldLeaves = 77;
    S.equipTickets = 55;
    S.compTickets = 44;
    S.starScrolls = 9;
    S.randomGoldBoxes = 8;
    S.totalKills = 1234;
    S.bossKills = 56;
    S.equipmentInventory = [{ id: '__old_gear__' }];
    S.companionInventory = [{ id: '__old_comp__' }];
    S.rebirthUpgrades = { atk: 3, exp: 3, gold: 3, boss: 3, speed: 3, offline: 3 };
    const dirtyChar = getC();
    dirtyChar.level = 100;
    dirtyChar.exp = 9999;
    dirtyChar.stage = 88;
    dirtyChar.highest = 88;
    dirtyChar.kills = 9;
    dirtyChar.growth = { atk: 9, aspd: 8, crit: 7, speed: 6 };
    dirtyChar.mainStat = 99;
    dirtyChar.statPoints = 12;
    dirtyChar.jobBoost = 5;
    dirtyChar.skillLv = [8, 7, 6];
    dirtyChar.rebirths = 4;
    dirtyChar.equipment = { 무기: { id: '__old_gear__' } };
    dirtyChar.companions = [{ id: '__old_comp__' }];

    const resetApplied = applyV19FullReset(18);
    const resetC = getC();
    const resourcesZero = ['gold','gems','worldLeaves','equipTickets','compTickets','starScrolls','randomGoldBoxes','totalKills','bossKills'].every(k => Number(S[k] || 0) === 0);
    const allCharsFresh = Object.values(S.chars).every(c =>
      c.level === 1 &&
      c.exp === 0 &&
      c.stage === 1 &&
      c.highest === 1 &&
      c.kills === 0 &&
      (c.mainStat || 0) === 0 &&
      (c.statPoints || 0) === 0 &&
      (c.jobBoost || 0) === 0 &&
      (c.rebirths || 0) === 0 &&
      Object.values(c.growth || {}).every(v => v === 0) &&
      Object.keys(c.equipment || {}).length === 0 &&
      (c.companions || []).length === 0
    );
    const v19FullResetTest = {
      resetApplied,
      version19: S.version === 19,
      resourcesZero,
      inventoriesEmpty: S.equipmentInventory.length === 0 && S.companionInventory.length === 0,
      rebirthUpgradesZero: Object.values(S.rebirthUpgrades).every(v => v === 0),
      profileNotStarted: S.profileStarted === false && S.firstCharacter === null,
      allCharsFresh,
      firstSkillFresh: resetC.skillLv[0] === 1 && resetC.skillLv[1] === 0 && resetC.skillLv[2] === 0
    };
    v19FullResetTest.pass = Object.values(v19FullResetTest).every(Boolean);
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
      levelProgressionTest,
      v19FullResetTest,
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
  if (!report.levelProgressionTest?.pass) {
    throw new Error('Level/roster progression test failed: ' + JSON.stringify(report.levelProgressionTest));
  }
  if (!report.v19FullResetTest?.pass) {
    throw new Error('V19 full new-game reset test failed: ' + JSON.stringify(report.v19FullResetTest));
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
