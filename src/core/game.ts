import {
  TuningConfig,
  Vec3,
  PlayerState,
  LanternState,
  ShadeState,
  MoteState,
  InputFrame,
  ScenarioData,
  ContractEvent,
  SnapshotOutput,
  EndOutput
} from "./types.js";
import { PRNG } from "./rng.js";

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}

function distXZ(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dz * dz);
}

export class GameSimulation {
  public tuning: TuningConfig;
  public prng: PRNG;
  public tick: number = 0;
  public sim_tick: number = 0;
  public state: "playing" | "won" | "lost" = "playing";
  public score: number = 0;
  public total_ticks_limit: number = 0;

  public player: PlayerState;
  public lanterns: LanternState[] = [];
  public shades: ShadeState[] = [];
  public motes: MoteState[] = [];

  public inputFrames: Map<number, InputFrame> = new Map();
  public currentInput: {
    move: [number, number];
    cam_yaw_deg: number;
    jump: boolean;
    interact: boolean;
    pulse: boolean;
  } = {
    move: [0, 0],
    cam_yaw_deg: 0,
    jump: false,
    interact: false,
    pulse: false
  };

  private prevInteract: boolean = false;
  private prevPulse: boolean = false;
  private shadeIdCounter: number = 1;
  private moteIdCounter: number = 1;

  public eventLog: ContractEvent[] = [];
  public tickEvents: ContractEvent[] = [];

  constructor(tuning: TuningConfig, seed: number) {
    this.tuning = tuning;
    this.prng = new PRNG(seed);
    this.total_ticks_limit = Math.round(this.tuning.night1_duration_s * 60);

    this.player = {
      pos: [0, 0, 0],
      flames: this.tuning.flames,
      carried: 0,
      invuln_ticks: 0,
      pulse_cooldown_ticks: 0
    };

    this.initDefaultLanterns();
  }

  private initDefaultLanterns() {
    const count = this.tuning.lantern_count_night1 || 5;
    const radius = 25.0;
    this.lanterns = [];
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count;
      const x = round3(radius * Math.sin(angle));
      const z = round3(radius * Math.cos(angle));
      this.lanterns.push({
        id: `L${i + 1}`,
        pos: [x, 0, z],
        lit: false,
        deposited: 0
      });
    }
  }

  public applyScenario(scenario: ScenarioData) {
    if (scenario.player) {
      if (scenario.player.pos) this.player.pos = [...scenario.player.pos];
      if (scenario.player.carried !== undefined) this.player.carried = scenario.player.carried;
      if (scenario.player.flames !== undefined) this.player.flames = scenario.player.flames;
    }

    if (scenario.time_left_s !== undefined) {
      this.total_ticks_limit = Math.round(scenario.time_left_s * 60);
    }

    if (scenario.lanterns) {
      for (const lData of scenario.lanterns) {
        let l = this.lanterns.find((item) => item.id === lData.id);
        if (!l) {
          l = {
            id: lData.id,
            pos: lData.pos ? [...lData.pos] : [0, 0, 0],
            lit: lData.lit || false,
            deposited: lData.deposited || 0
          };
          this.lanterns.push(l);
        } else {
          if (lData.pos) l.pos = [...lData.pos];
          if (lData.deposited !== undefined) l.deposited = lData.deposited;
          if (lData.lit !== undefined) l.lit = lData.lit;
        }
      }
    }

    if (scenario.motes !== undefined) {
      this.motes = scenario.motes.map((pos, idx) => ({
        id: `M${idx + 1}`,
        pos: [round3(pos[0]), round3(pos[1]), round3(pos[2])]
      }));
      this.moteIdCounter = this.motes.length + 1;
    } else if (scenario.random_motes !== false) {
      this.spawnRandomMotes(20);
    }

    if (scenario.shades !== undefined) {
      this.shades = scenario.shades.map((s, idx) => ({
        id: s.id || `S${idx + 1}`,
        pos: [round3(s.pos[0]), round3(s.pos[1]), round3(s.pos[2])],
        state: "chase",
        stun_ticks: 0
      }));
      this.shadeIdCounter = this.shades.length + 1;
    } else if (scenario.random_shades !== false) {
      this.spawnRandomShades(3);
    }
  }

  private spawnRandomMotes(count: number) {
    for (let i = 0; i < count; i++) {
      const r = this.prng.range(5, 30);
      const angle = this.prng.range(0, 2 * Math.PI);
      const x = round3(r * Math.cos(angle));
      const z = round3(r * Math.sin(angle));
      this.motes.push({
        id: `M${this.moteIdCounter++}`,
        pos: [x, 0, z]
      });
    }
  }

  private spawnRandomShades(count: number) {
    for (let i = 0; i < count; i++) {
      const r = this.prng.range(15, 35);
      const angle = this.prng.range(0, 2 * Math.PI);
      const x = round3(r * Math.cos(angle));
      const z = round3(r * Math.sin(angle));
      this.shades.push({
        id: `S${this.shadeIdCounter++}`,
        pos: [x, 0, z],
        state: "chase",
        stun_ticks: 0
      });
    }
  }

  public loadInputFrames(frames: InputFrame[]) {
    for (const f of frames) {
      this.inputFrames.set(f.tick, f);
    }
  }

  public getTimeLeftSeconds(): number {
    const left = (this.total_ticks_limit - this.tick) / 60;
    return Math.max(0, round3(left));
  }

  private emitEvent(name: ContractEvent["name"], data: Record<string, any>) {
    const ev: ContractEvent = {
      type: "event",
      tick: this.tick,
      name,
      data
    };
    this.tickEvents.push(ev);
    this.eventLog.push(ev);
  }

  public step() {
    if (this.state !== "playing") return;

    this.tickEvents = [];

    // Read input for this step (tick k generates state k + 1)
    if (this.inputFrames.has(this.tick)) {
      const f = this.inputFrames.get(this.tick)!;
      if (f.move !== undefined) this.currentInput.move = [f.move[0], f.move[1]];
      if (f.cam_yaw_deg !== undefined) this.currentInput.cam_yaw_deg = f.cam_yaw_deg;
      if (f.jump !== undefined) this.currentInput.jump = f.jump;
      if (f.interact !== undefined) this.currentInput.interact = f.interact;
      if (f.pulse !== undefined) this.currentInput.pulse = f.pulse;
    }

    const interactTriggered = !this.prevInteract && this.currentInput.interact;
    const pulseTriggered = !this.prevPulse && this.currentInput.pulse;
    this.prevInteract = this.currentInput.interact;
    this.prevPulse = this.currentInput.pulse;

    // Advance tick counter: events that happen in this step have tick = k + 1
    this.tick++;
    this.sim_tick = this.tick;

    if (this.player.invuln_ticks > 0) this.player.invuln_ticks--;
    if (this.player.pulse_cooldown_ticks > 0) this.player.pulse_cooldown_ticks--;

    // 1. Move Player
    const [mx, mz] = this.currentInput.move;
    let len = Math.sqrt(mx * mx + mz * mz);
    if (len > 0.0001) {
      let nx = mx;
      let nz = mz;
      if (len > 1.0) {
        nx /= len;
        nz /= len;
      }
      const theta = (this.currentInput.cam_yaw_deg * Math.PI) / 180;
      const xPrime = nx * Math.cos(theta) + nz * Math.sin(theta);
      const zPrime = -nx * Math.sin(theta) + nz * Math.cos(theta);

      const speedPerTick = this.tuning.player_speed / 60;
      this.player.pos[0] = round3(this.player.pos[0] + xPrime * speedPerTick);
      this.player.pos[2] = round3(this.player.pos[2] + zPrime * speedPerTick);
    }

    // 2. Pickup Motes
    if (this.player.carried < this.tuning.carry_capacity) {
      for (let i = this.motes.length - 1; i >= 0; i--) {
        const mote = this.motes[i];
        if (distXZ(this.player.pos, mote.pos) <= this.tuning.pickup_radius) {
          this.player.carried++;
          this.score += this.tuning.score.per_mote;
          this.motes.splice(i, 1);
          this.emitEvent("mote_picked", { carried: this.player.carried });

          if (this.player.carried >= this.tuning.carry_capacity) break;
        }
      }
    }

    // 3. Interact (Deposit into Lantern)
    if (interactTriggered && this.player.carried > 0) {
      let nearestLantern: LanternState | null = null;
      let minDist = Infinity;
      for (const l of this.lanterns) {
        if (!l.lit) {
          const d = distXZ(this.player.pos, l.pos);
          if (d <= this.tuning.interact_radius && d < minDist) {
            minDist = d;
            nearestLantern = l;
          }
        }
      }

      if (nearestLantern) {
        const needed = this.tuning.lantern_cost - nearestLantern.deposited;
        const amount = Math.min(this.player.carried, needed);
        if (amount > 0) {
          this.player.carried -= amount;
          nearestLantern.deposited += amount;
          this.emitEvent("deposit", {
            lantern_id: nearestLantern.id,
            amount: amount,
            deposited: nearestLantern.deposited
          });

          if (nearestLantern.deposited >= this.tuning.lantern_cost) {
            nearestLantern.lit = true;
            this.score += this.tuning.score.per_lantern;
            this.emitEvent("lantern_lit", { lantern_id: nearestLantern.id });

            // Check if all lanterns are lit
            if (this.lanterns.every((item) => item.lit)) {
              this.state = "won";
              const timeBonus = Math.floor(this.getTimeLeftSeconds() * this.tuning.score.per_second_left);
              const flameBonus = this.player.flames * this.tuning.score.per_flame_left;
              this.score += timeBonus + flameBonus;
              this.emitEvent("game_over", { result: "won", reason: "all_lit" });
              return;
            }
          }
        }
      }
    }

    // 4. Pulse
    if (pulseTriggered && this.player.carried >= this.tuning.pulse_cost && this.player.pulse_cooldown_ticks <= 0) {
      this.player.carried -= this.tuning.pulse_cost;
      this.player.pulse_cooldown_ticks = Math.round(this.tuning.pulse_cooldown_s * 60);

      const stunnedIds: string[] = [];
      const stunTicks = Math.round(this.tuning.pulse_stun_s * 60);

      for (const shade of this.shades) {
        const d = distXZ(this.player.pos, shade.pos);
        if (d <= this.tuning.pulse_radius) {
          shade.state = "stunned";
          shade.stun_ticks = stunTicks;
          stunnedIds.push(shade.id);
          this.score += this.tuning.score.per_stun;

          // Push back
          let dirX = shade.pos[0] - this.player.pos[0];
          let dirZ = shade.pos[2] - this.player.pos[2];
          const dirLen = Math.sqrt(dirX * dirX + dirZ * dirZ);
          if (dirLen > 0.001) {
            dirX /= dirLen;
            dirZ /= dirLen;
          } else {
            dirX = 1;
            dirZ = 0;
          }
          shade.pos[0] = round3(shade.pos[0] + dirX * this.tuning.pulse_push_m);
          shade.pos[2] = round3(shade.pos[2] + dirZ * this.tuning.pulse_push_m);
        }
      }

      this.emitEvent("pulse", { stunned_ids: stunnedIds });
    }

    // 5. Update Shades (AI chase + Safe Zones)
    const litLanterns = this.lanterns.filter((l) => l.lit);

    for (const shade of this.shades) {
      if (shade.state === "stunned") {
        shade.stun_ticks--;
        if (shade.stun_ticks <= 0) {
          shade.state = "chase";
        }
        continue;
      }

      // Chase player
      let dx = this.player.pos[0] - shade.pos[0];
      let dz = this.player.pos[2] - shade.pos[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0.001) {
        dx /= dist;
        dz /= dist;
      }

      const stepDist = (this.tuning.shade_speed / 60);
      const nextX = shade.pos[0] + dx * stepDist;
      const nextZ = shade.pos[2] + dz * stepDist;

      // Safe zone collision check
      let inSafeZone = false;
      for (const lantern of litLanterns) {
        const d = distXZ([nextX, 0, nextZ], lantern.pos);
        if (d <= this.tuning.safe_radius) {
          inSafeZone = true;
          break;
        }
      }

      if (!inSafeZone) {
        shade.pos[0] = round3(nextX);
        shade.pos[2] = round3(nextZ);
      }

      // Hit Player Check
      if (this.player.invuln_ticks <= 0) {
        const hitDist = distXZ(shade.pos, this.player.pos);
        if (hitDist <= this.tuning.shade_hit_radius) {
          this.player.flames--;
          const dropped = Math.floor(this.player.carried * this.tuning.hit_drop_ratio);
          this.player.carried -= dropped;
          this.player.invuln_ticks = Math.round(this.tuning.invuln_s * 60);

          this.emitEvent("player_hit", {
            by: "shade",
            flames: this.player.flames,
            dropped: dropped
          });

          if (this.player.flames <= 0) {
            this.state = "lost";
            this.emitEvent("game_over", { result: "lost", reason: "no_flames" });
            return;
          }
        }
      }
    }

    // 6. Time Check
    if (this.getTimeLeftSeconds() <= 0) {
      this.state = "lost";
      this.emitEvent("game_over", { result: "lost", reason: "dawn" });
      return;
    }
  }

  public getSnapshot(): SnapshotOutput {
    return {
      type: "snapshot",
      tick: this.tick,
      sim_tick: this.sim_tick,
      state: this.state,
      time_left_s: this.getTimeLeftSeconds(),
      score: this.score,
      player: {
        pos: [round3(this.player.pos[0]), round3(this.player.pos[1]), round3(this.player.pos[2])],
        flames: this.player.flames,
        carried: this.player.carried
      },
      lanterns: this.lanterns.map((l) => ({
        id: l.id,
        pos: [round3(l.pos[0]), round3(l.pos[1]), round3(l.pos[2])],
        lit: l.lit,
        deposited: l.deposited
      })),
      shades: this.shades.map((s) => ({
        id: s.id,
        pos: [round3(s.pos[0]), round3(s.pos[1]), round3(s.pos[2])],
        state: s.state
      })),
      motes_active: this.motes.length,
      motes: this.motes.map((m) => ({
        id: m.id,
        pos: [round3(m.pos[0]), round3(m.pos[1]), round3(m.pos[2])]
      }))
    };
  }

  public getEnd(): EndOutput {
    return {
      type: "end",
      ticks: this.tick,
      state: this.state,
      score: this.score
    };
  }
}
