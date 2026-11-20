# Antigravity & Claude AI SDLC Guidelines for "Đảo Đèn Lồng" — Phase 2 (Contract v1.1)

## 1. Project Overview & Rules
- Project: 3D Third-person game "Đảo Đèn Lồng" (Lantern Island).
- Contract Version: **Test Contract v1.1** (Multi-Night, Jump/Dash, Drifters, Charms, Deterministic Simulation).
- Determinism: With the same seed, night, scenario, and input frames, the output JSONL must be identical.
- Architecture:
  - `src/core/`: Pure TypeScript deterministic simulation engine (zero DOM/GPU dependencies).
  - `src/headless/`: CLI entrypoint implementing CLI flags (`--seed`, `--night`, `--scenario`, `--inputs`, `--ticks`, `--out`, `--snapshot-every`).
  - `src/web/`: Playable 3D presentation layer using Three.js + Vite.
  - `tests/`: Automated unit & scenario regression tests.

## 2. Standard Tuning & Contract v1.1 Constants
- Player speed: 6.0 m/s; Jump Vy: 7.0 m/s, Gravity: -20 m/s²
- Dash: 14.0 m/s / 0.2s / 1.5s cooldown (Charm buff: 7.2 m/s run, 0s dash cd for 600 ticks)
- Carry capacity: 10 motes; Lantern cost: 10 motes; Pickup radius: 1.0 m; Interact radius: 2.0 m
- Safe radius: 6.0 m around lit lanterns
- Pulse: cost 3 motes, radius 5.0 m, cd 3.0s, stun 120 ticks, push 4.0 m over first 15 ticks
- Shade states: `spawning`, `wander`, `chase`, `recoil`, `stunned`
- Drifter (Gió Lạc): `idle`, `chase`, `flee`
- Fall Y < -10: lost all motes, -1 flame, respawn at origin after 60 ticks with 90 ticks invulnerability

## 3. Strict Verification & Command Reference
- Install: `npm install`
- Run Headless CLI: `npm run headless -- <args>`
- Run Tests: `npm test`
- Run Web 3D: `npm run dev`
