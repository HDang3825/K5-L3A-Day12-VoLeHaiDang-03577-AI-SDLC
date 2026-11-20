// tests/contract.test.js
// Contract v1.1 – Ticket-02 acceptance tests (headless).

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHeadlessGame } from "../src/headless/index.js";
import { execSync } from "node:child_process";
import fs from "node:fs";

const DT = 1 / 60;
const make = (opts = {}) => createHeadlessGame({ seed: 1234, dt: DT, ...opts });
const player = (sim) => sim.state.player;
const hSpeed = (p) => (typeof p.speed === "number" ? p.speed : Math.hypot(p.vel.x, p.vel.z));
const dist2D = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const eventsOf = (sim, type) => sim.events.filter((e) => e.type === type);
const near = (actual, expected, eps, msg) =>
  assert.ok(
    Math.abs(actual - expected) <= eps,
    `${msg ?? "value"}: expected ${expected} ±${eps}, got ${actual}`
  );

// 1. Dash
test("Dash: pressing dash emits 'dash' and speed reaches 14.0 m/s", () => {
  const sim = make({ setup: { player: { pos: { x: 0, y: 0, z: 0 }, motes: 0 } } });
  sim.setMove({ x: 0, z: 1 });
  sim.tick(10);
  const before = hSpeed(player(sim));
  assert.ok(before < 14.0, `base speed (${before}) must be below dash speed`);
  assert.equal(eventsOf(sim, "dash").length, 0, "no dash event before input");

  sim.press("dash");
  sim.tick(1);

  assert.equal(eventsOf(sim, "dash").length, 1, "exactly one 'dash' event");
  const after = hSpeed(player(sim));
  near(after, 14.0, 0.01, "dash speed");
  assert.ok(after > before, "speed increased after dash");
});

// 2. Drifter
test("Drifter (Gió Lạc): steals motes when player carries >= 5", () => {
  const sim = make({
    setup: {
      player: { pos: { x: 0, y: 0, z: 0 }, motes: 5 },
      drifters: [{ pos: { x: 1, y: 0, z: 0 } }],
    },
  });
  sim.tick(300);
  const d = sim.state.drifters[0];
  assert.ok(d.stolen > 0, "drifter holds stolen motes");
  assert.ok(player(sim).motes < 5, "player lost motes");
  assert.equal(player(sim).motes + d.stolen, 5, "motes are conserved");
});

test("Drifter: does not steal when player carries < 5 motes", () => {
  const sim = make({
    setup: {
      player: { pos: { x: 0, y: 0, z: 0 }, motes: 4 },
      drifters: [{ pos: { x: 1, y: 0, z: 0 } }],
    },
  });
  sim.tick(300);
  assert.equal(sim.state.drifters[0].stolen, 0);
  assert.equal(player(sim).motes, 4);
});

test("Drifter: pulse forces drop of stolen motes ('drifter_drop')", () => {
  const sim = make({
    setup: {
      player: { pos: { x: 0, y: 0, z: 0 }, motes: 6 },
      drifters: [{ pos: { x: 1, y: 0, z: 0 } }],
    },
  });
  sim.tick(15);
  assert.ok(sim.state.drifters[0].stolen > 0, "precondition: steal happened");
  assert.equal(eventsOf(sim, "drifter_drop").length, 0);

  sim.press("pulse");
  sim.tick(2);

  assert.ok(eventsOf(sim, "drifter_drop").length >= 1, "'drifter_drop' emitted");
  assert.equal(sim.state.drifters[0].stolen, 0, "drifter no longer holds motes");
});

// 3. Safe zone
test("Safe Zone: Shade never penetrates within 6.0m of a lit lantern", () => {
  const lantern = { x: 0, y: 0, z: 0 };
  const sim = make({
    setup: {
      player: { pos: { x: 0, y: 0, z: 0 }, motes: 0 },
      lanterns: [{ pos: lantern, lit: true }],
      shades: [
        { pos: { x: 20, y: 0, z: 0 } },
        { pos: { x: -15, y: 0, z: 12 } },
        { pos: { x: 0, y: 0, z: -18 } },
      ],
    },
  });
  let minDist = Infinity;
  for (let i = 0; i < 900; i++) {
    sim.tick(1);
    for (const s of sim.state.shades) {
      const d = dist2D(s.pos, lantern);
      minDist = Math.min(minDist, d);
      assert.ok(d >= 6.0 - 1e-6, `tick ${i}: shade at ${d.toFixed(3)}m < 6.0m`);
    }
  }
  assert.ok(minDist >= 6.0 - 1e-6);
});

// 4. Jump & fall
test("Jump: vy = 7.0 on jump and gravity pulls player back down", () => {
  const sim = make({ setup: { player: { pos: { x: 0, y: 0, z: 0 }, motes: 0 } } });
  sim.tick(5);
  const y0 = player(sim).pos.y;

  sim.press("jump");
  sim.tick(1);
  const vy1 = player(sim).vel.y;
  near(vy1, 7.0, 0.6, "vy right after jump");

  for (let i = 0; i < 120; i++) {
    sim.tick(1);
  }
  near(player(sim).pos.y, y0, 0.05, "player landed back on ground");
});

// 5. Headless performance
test("Headless performance: 1000 ticks run under 2 seconds", () => {
  const start = performance.now();
  const sim = make();
  sim.tick(1000);
  const duration = performance.now() - start;
  assert.ok(duration < 2000, `1000 ticks took ${duration.toFixed(2)}ms, must be < 2000ms`);
});

// 6. Determinism verification
test("Determinism verification across two runs", () => {
  const sim1 = createHeadlessGame({ seed: 7777 });
  const sim2 = createHeadlessGame({ seed: 7777 });
  sim1.tick(300);
  sim2.tick(300);
  assert.equal(sim1.toJSONL(), sim2.toJSONL(), "Two simulation runs with same seed must be identical");
});
