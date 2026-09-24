# Sprout Expedition AI Council Rules

## Objective
Improve game balance, visual quality, readability, retention, and moment-to-moment fun without breaking working systems or player saves.

## Canonical design invariants
These rules override stale UI labels, dead legacy code, duplicate older functions, or suggestions inferred from them.

- The **Finance system has been removed by explicit user direction and must not return.** Do not add finance, interest, dice, odd/even, roulette, betting, or gambling-style minigames.
- Legacy references to **finance / dice / odd-even / 홀짝 주사위** are stale artifacts only and should be removed when safe.
- Main-stat potential follows the fixed conversion **1% main stat potential = +10% attack**; therefore 400% main stat potential = +4000% attack.
- Normal combat remains automated; the manual party quest is the intentional exception.
- Normal monsters retain the intended ticket-drop structure and bosses retain guaranteed large ticket rewards unless the user explicitly requests a redesign.
- V19 is the current save baseline. Preserve V19+ save compatibility after the one-time V18-and-earlier reset.
- Gold-based upgrade costs must not use exponential/geometric growth curves. Linear or otherwise gently bounded cost growth is canonical.
- Character/job mastery is **level-driven**, not purchased with gold. Gold-based per-job upgrade buttons/costs must not return.
- Player level power and monster stage HP share the canonical progression factor **1.13** so baseline offensive growth and enemy durability advance on the same curve before build bonuses.
- Alternate characters matter through **Expedition Resonance**: each job contributes an account-wide resonance based on its level, total roster level unlocks additional account bonuses, and sufficiently developed rosters grant passive EXP training to inactive characters.
- The five base class sprites must keep clearly distinct silhouettes and class-readable equipment/pose language; do not collapse them back into one generic body with minor weapon swaps.
- V19 intentionally performs a one-time complete fresh-start reset for every V18-or-earlier save: Lv.1, Stage 1, all currencies/resources 0, no equipment/companions, no rebirth progress, and all upgrades at base values.
- The canonical entry flow is **title screen → Start → first-character selection → game**. Returning V19 profiles see the title screen and may Continue. Manual full reset returns to the title screen.
- When runtime code and old duplicated source fragments disagree, treat these canonical rules plus the latest effective runtime behavior as authoritative.

## Hard safety gates
- Never edit GitHub Actions, AI council scripts, secrets, repository permissions, or CI from an AI-generated gameplay patch.
- AI-generated patches may modify `index.html` only in phase 1.
- Preserve localStorage save migration and support older save keys.
- Do not remove an existing player-facing system unless the user explicitly requested its removal.
- No external copyrighted game assets, trackers, ads, remote scripts, or telemetry.
- No real-money gambling or monetization changes.
- Do not weaken runtime checks to make a failing patch pass.
- A patch must pass syntax and browser smoke tests before a PR can be created.
- A patch must not increase the number of duplicate named function declarations in the legacy single-file build.
- Prefer small, reversible patches. Maximum default patch size: 600 changed lines.

## Balance principles
- Avoid a single dominant growth path when alternatives exist.
- Keep early progression fast enough to reveal systems quickly, while preserving meaningful long-term goals.
- Gold sinks should scale with gold generation; avoid permanent runaway inflation from one system.
- Character/job identity should come from distinct mechanics, not only larger numbers.
- Companion buffs should have understandable opportunity costs and no single mandatory buff.
- Potential options must obey the documented rule: main-stat potential 1% = attack +10% (e.g. STR 400% = attack +4000%).
- Evaluate damage, attack speed, multi-hit, crit, skill multipliers, companions, equipment and progression together. Gold upgrade costs should remain non-exponential and readable.

## Graphics and UX principles
- Mobile readability is first-class.
- Prefer stable, low-cost effects over excessive particles or screen shake.
- Damage numbers must remain readable over effects.
- Keep the pixel-art direction coherent.
- Any visual improvement should be checked at 390x844 and 1365x768.
- No page-level horizontal overflow on mobile.

## Council protocol
1. Gemini Director produces a concise audit with evidence and at most five proposed changes.
2. Gemini Critic challenges the audit, identifying overcorrections, stale-code traps, missing risks and visual/gameplay tradeoffs.
3. Gemini Implementer synthesizes both reviews and may produce one conservative unified diff.
4. Gemini Gate acts as the final independent design gate on that diff.
5. CI applies the diff only if the gate approves it.
6. CI reruns static and browser tests after patching.
7. Only a passing candidate is pushed to a branch and offered as a pull request.

Do not output private chain-of-thought. Reviews should contain conclusions, evidence, risks and concrete changes only.
