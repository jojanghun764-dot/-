# Sprout Expedition AI Council Rules

## Objective
Improve game balance, visual quality, readability, retention, and moment-to-moment fun without breaking working systems or player saves.

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
1. GPT produces a concise audit with evidence and at most five proposed changes.
2. Gemini challenges the audit, identifying overcorrections, missing risks and visual/gameplay tradeoffs.
3. GPT synthesizes both reviews and may produce one conservative unified diff.
4. Gemini acts as a final design gate on that diff.
5. CI applies the diff only if the gate approves it.
6. CI reruns static and browser tests after patching.
7. Only a passing candidate is pushed to a branch and offered as a pull request.

Do not output private chain-of-thought. Reviews should contain conclusions, evidence, risks and concrete changes only.
