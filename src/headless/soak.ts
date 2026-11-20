import fs from "fs";
import path from "path";
import { GameSimulation } from "../core/game.js";
import { TuningConfig } from "../core/types.js";
import { PRNG } from "../core/rng.js";

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

function getRssMb(): number {
  return Math.round((process.memoryUsage().rss / (1024 * 1024)) * 10) / 10;
}

async function runSoak() {
  const args = parseArgs(process.argv.slice(2));
  const baseSeed = args.seed ? parseInt(args.seed, 10) : 7;
  const numNights = args.nights ? parseInt(args.nights, 10) : 10;
  const outPath = path.resolve(process.cwd(), args.out || "soak.json");

  const contractPath = path.resolve(process.cwd(), "game.contract.json");
  const contract = JSON.parse(fs.readFileSync(contractPath, "utf-8"));
  const tuning: TuningConfig = contract.tuning;

  const tStart = performance.now();
  let crashes = 0;
  const results: string[] = [];
  let memStartMb = 0;

  for (let i = 0; i < numNights; i++) {
    const seed = baseSeed + i;
    const night = (i % 3) + 1;

    try {
      const sim = new GameSimulation(tuning, seed, night);
      if (i === 0) {
        memStartMb = getRssMb();
      }

      const rng = new PRNG(seed);
      let curMove: [number, number] = [0, 0];

      // Run each night up to max ticks (e.g. 1800 ticks for soak test speed, or until won/lost)
      const maxTicks = Math.min(sim.total_ticks_limit, 1800);
      for (let t = 0; t < maxTicks; t++) {
        if (t % 30 === 0) {
          const angle = rng.range(0, 2 * Math.PI);
          curMove = [Math.cos(angle), Math.sin(angle)];
        }

        const jump = rng.next() < 0.05;
        const dash = rng.next() < 0.03;
        const pulse = rng.next() < 0.02;
        const interact = rng.next() < 0.10;

        sim.currentInput.move = curMove;
        sim.currentInput.jump = jump;
        sim.currentInput.dash = dash;
        sim.currentInput.pulse = pulse;
        sim.currentInput.interact = interact;

        sim.step();

        if (sim.state !== "playing" && sim.state !== "paused") {
          break;
        }
      }

      results.push(sim.state === "won" ? "won" : "lost");
    } catch (err: any) {
      crashes++;
      results.push("lost");
      console.error(`Error during soak night ${i + 1}:`, err.message);
    }
  }

  const memEndMb = getRssMb();
  const durationS = Math.round(((performance.now() - tStart) / 1000) * 10) / 10;

  const output = {
    nights: numNights,
    crashes,
    results,
    mem_start_mb: memStartMb,
    mem_end_mb: memEndMb,
    duration_s: durationS
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`Soak test completed: ${numNights} nights, ${crashes} crashes. Results saved to ${outPath}`);
}

runSoak().catch(console.error);
