// tests/contract.test.js
// Contract v1.2 – Ticket-03 acceptance tests (headless).

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHeadlessGame } from "../src/headless/index.js";

const DT = 1 / 60;
const make = (opts = {}) => createHeadlessGame({ seed: 1234, dt: DT, ...opts });
const player = (sim) => sim.state.player;
const eventsOf = (sim, type) => sim.events.filter((e) => e.type === type);
const near = (actual, expected, eps, msg) =>
  assert.ok(
    Math.abs(actual - expected) <= eps,
    `${msg ?? "value"}: expected ${expected} ±${eps}, got ${actual}`
  );

// 1. Fuel decay and lantern_out
test("Fuel decay: lit lantern loses 1 fuel/sec and turns off when fuel <= 0 ('lantern_out')", () => {
  const sim = make({
    setup: {
      lanterns: [{ id: "L1", pos: { x: 0, y: 0, z: 10 }, lit: true, fuel: 2 }], // 2 fuel = 120 ticks
    },
  });
  sim.tick(60); // after 1s, fuel should drop to ~1.0
  const lAfter1s = sim.sim.lanterns.find((l) => l.id === "L1");
  assert.ok(lAfter1s.lit, "lantern still lit at 1 fuel");
  near(lAfter1s.fuel, 1.0, 0.05, "fuel after 60 ticks");

  sim.tick(65); // drops below 0 -> lantern_out
  assert.ok(!lAfter1s.lit, "lantern turns off when fuel exhausted");
  assert.equal(eventsOf(sim, "lantern_out").length, 1, "'lantern_out' emitted");
  assert.equal(lAfter1s.ever_lit, true, "ever_lit must be true");
});

// 2. Refuel mechanism
test("Refuel: pressing interact near lit lantern refuels it ('refuel')", () => {
  const sim = make({
    setup: {
      player: { pos: { x: 0, y: 0, z: 0 }, motes: 3 },
      lanterns: [{ id: "L1", pos: { x: 0, y: 0, z: 1 }, lit: true, fuel: 80 }],
    },
  });
  sim.press("interact");
  sim.tick(1);

  const l = sim.sim.lanterns.find((item) => item.id === "L1");
  assert.equal(l.fuel, 100, "lantern refueled to 100");
  assert.equal(player(sim).motes, 1, "consumed 2 motes to add 20 fuel");
  assert.equal(eventsOf(sim, "refuel").length, 1, "'refuel' emitted");
});

// 3. Relight cost
test("Relight cost: ever_lit lantern requires only 5 motes to relight", () => {
  const sim = make({
    setup: {
      player: { pos: { x: 0, y: 0, z: 0 }, motes: 5 },
      lanterns: [{ id: "L1", pos: { x: 0, y: 0, z: 1 }, lit: false, ever_lit: true, deposited: 0 }],
    },
  });
  sim.press("interact");
  sim.tick(1);

  const l = sim.sim.lanterns.find((item) => item.id === "L1");
  assert.ok(l.lit, "relit with 5 motes");
  assert.equal(l.fuel, 100, "fuel resets to 100 on relight");
  const litEvent = eventsOf(sim, "lantern_lit")[0];
  assert.equal(litEvent.relight, true, "relight: true in lantern_lit event");
});

// 4. Shade Drain
test("Shade Drain: shade wanders to lantern with fuel < 30 and drains 5 fuel/sec", () => {
  const sim = make({
    setup: {
      player: { pos: { x: 50, y: 0, z: 50 }, motes: 0 },
      lanterns: [{ id: "L1", pos: { x: 0, y: 0, z: 0 }, lit: true, fuel: 20 }],
      shades: [{ id: "S1", pos: { x: 0.5, y: 0, z: 0.5 }, state: "wander" }],
    },
  });
  sim.tick(65); // 1 second of draining: 1 natural + 5 drain = 6 fuel drop
  const l = sim.sim.lanterns.find((item) => item.id === "L1");
  assert.ok(l.fuel < 15, "drained by shade");
  assert.ok(eventsOf(sim, "fuel_drain").length >= 1, "'fuel_drain' event emitted");
});

// 5. Pulse on Draining Shade grants +15 points
test("Pulse on draining shade awards +15 points", () => {
  const sim = make({
    setup: {
      player: { pos: { x: 0, y: 0, z: 0 }, motes: 5 },
      lanterns: [{ id: "L1", pos: { x: 0, y: 0, z: 1 }, lit: true, fuel: 20 }],
      shades: [{ id: "S1", pos: { x: 0.5, y: 0, z: 0.5 }, state: "drain" }],
    },
  });
  const scoreBefore = sim.sim.score;
  sim.press("pulse");
  sim.tick(1);

  assert.equal(sim.sim.score - scoreBefore, 15, "awards 15 points for pulsing a draining shade");
});

// 6. Win condition: dawn_survived (surviving until dawn with >= 60% lit lanterns, no early win)
test("Win condition: no early win, wins with 'dawn_survived' at dawn if >= 60% lit", () => {
  const sim = make({
    setup: {
      time_left_s: 1.0, // 60 ticks left
      player: { pos: { x: 0, y: 0, z: 0 }, flames: 3 },
      lanterns: [
        { id: "L1", pos: { x: 0, y: 0, z: 10 }, lit: true, fuel: 80 },
        { id: "L2", pos: { x: 10, y: 0, z: 10 }, lit: true, fuel: 80 },
        { id: "L3", pos: { x: -10, y: 0, z: 10 }, lit: true, fuel: 80 },
        { id: "L4", pos: { x: 20, y: 0, z: 10 }, lit: false, fuel: 0 },
        { id: "L5", pos: { x: -20, y: 0, z: 10 }, lit: false, fuel: 0 },
      ],
    },
  });
  sim.tick(30);
  assert.equal(sim.sim.state, "playing", "no early win even with 3 lanterns lit");

  sim.tick(31); // reaches dawn (time_left <= 0)
  assert.equal(sim.sim.state, "won", "won at dawn");
  const gameOverEvent = eventsOf(sim, "game_over")[0];
  assert.equal(gameOverEvent.reason, "dawn_survived", "reason must be dawn_survived");
});

// 7. Dash Mechanism
test("Dash: reaches 14.0 m/s and emits 'dash'", () => {
  const sim = make({ setup: { player: { pos: { x: 0, y: 0, z: 0 }, motes: 0 } } });
  sim.setMove({ x: 0, z: 1 });
  sim.press("dash");
  sim.tick(1);
  assert.equal(eventsOf(sim, "dash").length, 1);
  near(sim.state.player.speed, 14.0, 0.01, "dash speed");
});

// 8. Headless speed & Determinism
test("Headless performance & Determinism across two runs", () => {
  const sim1 = createHeadlessGame({ seed: 8888 });
  const sim2 = createHeadlessGame({ seed: 8888 });
  const t0 = performance.now();
  sim1.tick(600);
  sim2.tick(600);
  const dur = performance.now() - t0;
  assert.ok(dur < 1500, `Execution took ${dur.toFixed(2)}ms < 1500ms`);
  assert.equal(sim1.toJSONL(), sim2.toJSONL(), "Deterministic output identical");
});
