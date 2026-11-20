import fs from "fs";
import path from "path";
import { GameSimulation } from "../core/game.js";
import { TuningConfig, ScenarioData, InputFrame } from "../core/types.js";

function parseArgs(args: string[]) {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        result[key] = args[i + 1];
        i++;
      } else {
        result[key] = "true";
      }
    }
  }
  return result;
}

export function createHeadlessGame(opts: { seed?: number; dt?: number; setup?: any } = {}) {
  const contractPath = path.resolve(process.cwd(), "game.contract.json");
  let tuning: any = {};
  if (fs.existsSync(contractPath)) {
    try {
      tuning = JSON.parse(fs.readFileSync(contractPath, "utf-8")).tuning;
    } catch {}
  }
  const sim = new GameSimulation(tuning, opts.seed || 1234, 1);
  if (opts.setup) {
    sim.applyScenario(opts.setup);
  }

  return {
    sim,
    tick(n = 1) {
      for (let i = 0; i < n; i++) {
        sim.step();
        // Reset one-shot inputs after step
        sim.currentInput.dash = false;
        sim.currentInput.jump = false;
        sim.currentInput.pulse = false;
        sim.currentInput.interact = false;
      }
    },
    press(action: string) {
      if (action === "dash") sim.currentInput.dash = true;
      if (action === "jump") sim.currentInput.jump = true;
      if (action === "pulse") sim.currentInput.pulse = true;
      if (action === "interact") sim.currentInput.interact = true;
    },
    setMove(m: { x: number; z: number }) {
      sim.currentInput.move = [m.x, m.z];
    },
    get state() {
      return {
        player: {
          pos: { x: sim.player.pos[0], y: sim.player.pos[1], z: sim.player.pos[2] },
          vel: { x: sim.player.vel[0], y: sim.player.vel[1], z: sim.player.vel[2] },
          motes: sim.player.carried,
          carried: sim.player.carried,
          speed: sim.player.speed,
          grounded: sim.player.grounded
        },
        drifters: sim.drifters.map((d) => ({
          id: d.id,
          pos: { x: d.pos[0], y: d.pos[1], z: d.pos[2] },
          stolen: d.stolen,
          state: d.state
        })),
        shades: sim.shades.map((s) => ({
          id: s.id,
          pos: { x: s.pos[0], y: s.pos[1], z: s.pos[2] },
          state: s.state
        })),
        lanterns: sim.lanterns.map((l) => ({
          id: l.id,
          pos: { x: l.pos[0], y: l.pos[1], z: l.pos[2] },
          lit: l.lit,
          deposited: l.deposited
        }))
      };
    },
    get events() {
      return sim.eventLog.map((e) => ({ type: e.name, ...e.data }));
    },
    toJSONL() {
      return sim.eventLog.map((e) => JSON.stringify(e)).join("\n");
    }
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.seed || !args.ticks || !args.out) {
    console.error("Usage: headless --seed <int> --night <1|2|3> [--scenario <file.json>] [--inputs <file.json>] --ticks <int> --out <file.jsonl> [--snapshot-every <int>]");
    process.exit(1);
  }

  const seed = parseInt(args.seed, 10);
  const night = args.night ? parseInt(args.night, 10) : 1;
  const targetTicks = parseInt(args.ticks, 10);
  const snapshotEvery = args["snapshot-every"] ? parseInt(args["snapshot-every"], 10) : 10;
  const outPath = path.resolve(process.cwd(), args.out);

  const contractPath = path.resolve(process.cwd(), "game.contract.json");
  if (!fs.existsSync(contractPath)) {
    console.error("Error: game.contract.json not found.");
    process.exit(1);
  }

  let contractData: { tuning: TuningConfig };
  try {
    contractData = JSON.parse(fs.readFileSync(contractPath, "utf-8"));
  } catch (err: any) {
    console.error("Error parsing game.contract.json:", err.message);
    process.exit(2);
  }

  const sim = new GameSimulation(contractData.tuning, seed, night);

  if (args.scenario) {
    const scPath = path.resolve(process.cwd(), args.scenario);
    if (!fs.existsSync(scPath)) {
      console.error(`Error: Scenario file ${args.scenario} not found`);
      process.exit(2);
    }
    try {
      const scenarioContent: ScenarioData = JSON.parse(fs.readFileSync(scPath, "utf-8"));
      sim.applyScenario(scenarioContent);
    } catch (err: any) {
      console.error(`Error parsing scenario JSON ${args.scenario}:`, err.message);
      process.exit(2);
    }
  }

  if (args.inputs) {
    const inPath = path.resolve(process.cwd(), args.inputs);
    if (!fs.existsSync(inPath)) {
      console.error(`Error: Inputs file ${args.inputs} not found`);
      process.exit(2);
    }
    try {
      const inputsData: { frames: InputFrame[] } = JSON.parse(fs.readFileSync(inPath, "utf-8"));
      sim.loadInputFrames(inputsData.frames);
    } catch (err: any) {
      console.error(`Error parsing inputs JSON ${args.inputs}:`, err.message);
      process.exit(2);
    }
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const outputLines: string[] = [];

  outputLines.push(JSON.stringify(sim.getSnapshot()));

  for (let k = 0; k < targetTicks; k++) {
    sim.step();

    for (const ev of sim.tickEvents) {
      outputLines.push(JSON.stringify(ev));
    }

    if (sim.tick % snapshotEvery === 0) {
      outputLines.push(JSON.stringify(sim.getSnapshot()));
    }

    if (sim.state !== "playing" && sim.state !== "paused") {
      break;
    }
  }

  outputLines.push(JSON.stringify(sim.getEnd()));
  fs.writeFileSync(outPath, outputLines.join("\n") + "\n", { encoding: "utf-8" });

  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith("index.ts")) {
  main();
}
