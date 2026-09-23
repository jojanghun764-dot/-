# Sprout Expedition AI Council Rules

## Objective
Improve game balance, visual quality, readability, retention, and moment-to-moment fun without breaking working systems or player saves.

## Canonical design invariants
These rules override stale UI labels, dead legacy code, duplicate older functions, or suggestions inferred from them.

- The **Finance** system is canonical and must remain. Do not remove or replace it with dice, odd/even, roulette, betting, or any gambling-style minigame.
- Legacy references to **dice / odd-even / 홀짝 주사위** are stale artifacts, not desired features. They may be cleaned up, but must never be restored as gameplay.
- Finance settles every 30 seconds with four independent virtual-gold rolls: 99%→+1%, 80%→+30%, 50%→+100%, 30%→+250%. Multiple tiers may trigger together.
- Finance uses only in-game virtual gold. No real-money gambling or cash wagering.
- Main-stat potential follows the fixed conversion **1% main stat potential = +10% attack**; therefore 400% main stat potential = +4000% attack.
- Normal combat remains automated; the manual party quest is the intentional exception.
- Normal monsters retain the intended ticket-drop structure and bosses retain guaranteed large ticket rewards unless the user explicitly requests a redesign.
- Existing save compatibility and migrations are part of the product, not optional cleanup.
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
- Evaluate damage, attack speed, multi-hit, crit, skill multipliers, companions, equipment, finance and progression together.

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
