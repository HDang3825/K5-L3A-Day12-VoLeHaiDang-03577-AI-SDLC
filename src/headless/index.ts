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

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.seed || !args.ticks || !args.out) {
    console.error("Usage: headless --seed <int> --night 1 [--scenario <file.json>] [--inputs <file.json>] --ticks <int> --out <file.jsonl> [--snapshot-every <int>]");
    process.exit(1);
  }

  const seed = parseInt(args.seed, 10);
  const targetTicks = parseInt(args.ticks, 10);
  const snapshotEvery = args["snapshot-every"] ? parseInt(args["snapshot-every"], 10) : 10;
  const outPath = path.resolve(process.cwd(), args.out);

  // Read game.contract.json for tuning
  const contractPath = path.resolve(process.cwd(), "game.contract.json");
  if (!fs.existsSync(contractPath)) {
    console.error("Error: game.contract.json not found in root.");
    process.exit(1);
  }

  let contractData: { tuning: TuningConfig };
  try {
    contractData = JSON.parse(fs.readFileSync(contractPath, "utf-8"));
  } catch (err: any) {
    console.error("Error parsing game.contract.json:", err.message);
    process.exit(2);
  }

  const sim = new GameSimulation(contractData.tuning, seed);

  // Apply scenario if present
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

  // Load inputs if present
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

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const outputLines: string[] = [];

  // Snapshot tick 0 is before applying input
  outputLines.push(JSON.stringify(sim.getSnapshot()));

  // Run simulation up to targetTicks or until game won/lost
  for (let k = 0; k < targetTicks; k++) {
    sim.step();

    // Write events that occurred during this step
    for (const ev of sim.tickEvents) {
      outputLines.push(JSON.stringify(ev));
    }

    // Write periodic snapshot
    if (sim.tick % snapshotEvery === 0) {
      outputLines.push(JSON.stringify(sim.getSnapshot()));
    }

    if (sim.state !== "playing") {
      break;
    }
  }

  // Write end object
  outputLines.push(JSON.stringify(sim.getEnd()));

  fs.writeFileSync(outPath, outputLines.join("\n") + "\n", { encoding: "utf-8" });

  process.exit(0);
}

main();
