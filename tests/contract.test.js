import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";

test("Headless CLI - Pickup and Deposit Scenario", (t) => {
  const outPath = "tests/output/out_pickup_deposit.jsonl";
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

  const cmd = `npx tsx src/headless/index.ts --seed 42 --night 1 --scenario tests/scenarios/scenario_pickup_deposit.json --inputs tests/inputs/inputs_pickup_deposit.json --ticks 150 --out ${outPath} --snapshot-every 30`;
  execSync(cmd, { stdio: "pipe" });

  assert.ok(fs.existsSync(outPath), "Output file should be created");
  const lines = fs.readFileSync(outPath, "utf-8").trim().split("\n").map((l) => JSON.parse(l));

  const snapshots = lines.filter((l) => l.type === "snapshot");
  const events = lines.filter((l) => l.type === "event");
  const end = lines.find((l) => l.type === "end");

  assert.ok(snapshots.length > 0, "Should have periodic snapshots");
  assert.equal(snapshots[0].tick, 0, "First snapshot should be tick 0");

  const moteEvents = events.filter((e) => e.name === "mote_picked");
  assert.ok(moteEvents.length >= 3, "Should have picked 3 motes");

  const depositEvents = events.filter((e) => e.name === "deposit");
  assert.ok(depositEvents.length >= 1, "Should have deposited into L1");

  const litEvents = events.filter((e) => e.name === "lantern_lit");
  assert.ok(litEvents.length >= 1, "Lantern L1 should be lit");

  assert.ok(end, "Should have end record");
});

test("Headless CLI - Pulse Stun Scenario", (t) => {
  const outPath = "tests/output/out_pulse.jsonl";
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

  const cmd = `npx tsx src/headless/index.ts --seed 123 --night 1 --scenario tests/scenarios/scenario_pulse_stun.json --inputs tests/inputs/inputs_pulse_stun.json --ticks 60 --out ${outPath}`;
  execSync(cmd, { stdio: "pipe" });

  const lines = fs.readFileSync(outPath, "utf-8").trim().split("\n").map((l) => JSON.parse(l));
  const pulseEvents = lines.filter((l) => l.type === "event" && l.name === "pulse");
  assert.equal(pulseEvents.length, 1, "Should emit 1 pulse event");
  assert.deepEqual(pulseEvents[0].data.stunned_ids, ["S1"], "Should stun shade S1");
});

test("Headless CLI - Player Hit and Game Over (no_flames)", (t) => {
  const outPath = "tests/output/out_gameover.jsonl";
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

  const cmd = `npx tsx src/headless/index.ts --seed 777 --night 1 --scenario tests/scenarios/scenario_hit_gameover.json --ticks 30 --out ${outPath}`;
  execSync(cmd, { stdio: "pipe" });

  const lines = fs.readFileSync(outPath, "utf-8").trim().split("\n").map((l) => JSON.parse(l));
  const hitEvents = lines.filter((l) => l.type === "event" && l.name === "player_hit");
  assert.equal(hitEvents.length, 1, "Should register player hit");
  assert.equal(hitEvents[0].data.flames, 0, "Flames should reach 0");

  const gameOverEvents = lines.filter((l) => l.type === "event" && l.name === "game_over");
  assert.equal(gameOverEvents.length, 1, "Should emit game_over event");
  assert.equal(gameOverEvents[0].data.result, "lost");
  assert.equal(gameOverEvents[0].data.reason, "no_flames");

  const end = lines.find((l) => l.type === "end");
  assert.equal(end.state, "lost");
});

test("Architecture Isolation - Core must have zero DOM/Three.js imports", (t) => {
  const coreFiles = fs.readdirSync("src/core");
  for (const file of coreFiles) {
    if (!file.endsWith(".ts")) continue;
    const content = fs.readFileSync(`src/core/${file}`, "utf-8");
    assert.ok(!content.includes("three"), `Core file ${file} must not import Three.js`);
    assert.ok(!content.includes("document."), `Core file ${file} must not reference DOM document`);
    assert.ok(!content.includes("window."), `Core file ${file} must not reference DOM window`);
  }
});

test("Headless CLI - Determinism Verification", (t) => {
  const out1 = "tests/output/out_det_1.jsonl";
  const out2 = "tests/output/out_det_2.jsonl";
  if (fs.existsSync(out1)) fs.unlinkSync(out1);
  if (fs.existsSync(out2)) fs.unlinkSync(out2);

  const cmd1 = `npx tsx src/headless/index.ts --seed 9999 --night 1 --ticks 120 --out ${out1} --snapshot-every 20`;
  const cmd2 = `npx tsx src/headless/index.ts --seed 9999 --night 1 --ticks 120 --out ${out2} --snapshot-every 20`;

  execSync(cmd1, { stdio: "pipe" });
  execSync(cmd2, { stdio: "pipe" });

  const content1 = fs.readFileSync(out1, "utf-8");
  const content2 = fs.readFileSync(out2, "utf-8");

  assert.equal(content1, content2, "Deterministic runs with same seed must produce exact identical JSONL output");
});
