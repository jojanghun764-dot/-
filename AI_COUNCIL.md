# AI Game Council

This repository contains a guarded GPT ↔ Gemini improvement loop for Sprout Expedition.

## What one run does
1. Opens the current game in headless Chromium at mobile and desktop sizes.
2. Fails immediately on browser runtime errors, missing battle canvas, mobile horizontal overflow, or broken core invariants.
3. Captures mobile and desktop screenshots.
4. Runs a balance report including progression curves, skill/growth costs, class stats, finance expected return, and 10,000 potential rolls per rarity.
5. GPT audits the game.
6. Gemini challenges the audit.
7. GPT may generate one small `index.html` unified diff.
8. Gemini approves or rejects that candidate on design/balance/graphics grounds.
9. An approved diff must still pass `git apply --check`, static checks, a second browser run, balance simulation, and the quality gate.
10. Only then is a new `ai-council/run-*` branch pushed and a pull request created. `main` is never directly changed by the generated gameplay patch.

## Required repository secrets
Create these in GitHub: **Settings → Secrets and variables → Actions → New repository secret**.

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

Do not paste either key into source files, issues, PRs, or chat.

## Run it
Open **Actions → AI Game Council → Run workflow**. Optionally enter a goal such as:

> Check late-game gold inflation, class identity, damage readability and mobile visual clutter. Make only changes supported by the test data.

The first phase is intentionally manual-triggered to avoid unexpected API costs. After several successful runs, a weekly schedule can be enabled.

## Models
Defaults are `gpt-5.6-sol` and `gemini-3.8-flash`. They can be changed later with workflow environment configuration without changing the game code.
