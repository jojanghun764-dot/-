# AI Game Council

This repository contains a guarded Gemini multi-agent improvement loop for Sprout Expedition.

## What one run does
1. Opens the current game in headless Chromium at mobile and desktop sizes.
2. Fails immediately on browser runtime errors, missing battle canvas, mobile horizontal overflow, or broken core invariants.
3. Captures mobile and desktop screenshots.
4. Runs a balance report including progression curves, skill/growth costs, class stats, finance expected return, and 10,000 potential rolls per rarity.
5. Gemini Director audits the game.
6. Gemini Critic independently challenges that audit.
7. Gemini Implementer may generate one small `index.html` unified diff.
8. Gemini Gate approves or rejects that candidate on design/balance/graphics grounds.
9. An approved diff must still pass `git apply --check`, static checks, a second browser run, balance simulation, and the quality gate.
10. Only then is a new `ai-council/run-*` branch pushed and a pull request created. `main` is never directly changed by the generated gameplay patch.

## Required repository secret
Create this in GitHub: **Settings → Secrets and variables → Actions → New repository secret**.

- `GEMINI_API_KEY`

Optional:
- `GEMINI2_API_KEY` — if present, the Critic and final Gate use this second key. If absent, the primary Gemini key is reused.

Do not paste either key into source files, issues, PRs, or chat.

## Run it
Open **Actions → AI Game Council → Run workflow**. Optionally enter a goal such as:

> Check late-game gold inflation, class identity, damage readability and mobile visual clutter. Make only changes supported by the test data.

The workflow is manual-triggered initially to avoid unexpected quota usage. After several stable runs, a weekly schedule can be enabled.

## Model
The default model is `gemini-3.8-flash`, using Google's current Generate Content API. The model can be changed later with workflow environment configuration without changing game code.
