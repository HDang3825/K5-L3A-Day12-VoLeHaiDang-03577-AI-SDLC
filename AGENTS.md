# Antigravity & Claude AI SDLC Guidelines for "Đảo Đèn Lồng"

## 1. Project Overview & Rules
- Project: 3D Third-person game "Đảo Đèn Lồng" (Lantern Island).
- Core Principle: Strict adherence to **Test Contract v1.0** (Headless Simulation).
- Determinism: With the same seed, scenario, and input frames, the output JSONL must be identical.
- Architecture:
  - `src/core/`: Pure TypeScript deterministic simulation engine (zero DOM/GPU dependencies).
  - `src/headless/`: CLI entrypoint implementing CLI flags (`--seed`, `--night`, `--scenario`, `--inputs`, `--ticks`, `--out`, `--snapshot-every`).
  - `src/web/`: Playable 3D presentation layer using Three.js + Vite.
  - `tests/`: Automated unit & scenario regression tests.

## 2. Command Reference
- Install: `npm install`
- Run Headless CLI: `npm run headless -- <args>`
- Run Tests: `npm test`
- Run Web 3D: `npm run dev`

## 3. Strict Rules
- NEVER read or expose secrets from `.env`.
- Round coordinates to 3 decimal places in JSONL snapshots.
- All distance checks are Euclidean on the horizontal XZ plane ($d \le r$).
- All state transitions must emit valid contract events (`mote_picked`, `deposit`, `lantern_lit`, `pulse`, `player_hit`, `shade_spawned`, `game_over`).
