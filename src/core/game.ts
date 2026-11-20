import {
  TuningConfig,
  Vec3,
  PlayerState,
  LanternState,
  ShadeState,
  DrifterState,
  CharmState,
  MoteState,
  WindState,
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

function dist3D(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export class GameSimulation {
  public tuning: TuningConfig;
  public prng: PRNG;
  public night: number = 1;
  public tick: number = 0;
  public sim_tick: number = 0;
  public state: "playing" | "won" | "lost" | "paused" = "playing";
  public score: number = 0;
  public total_ticks_limit: number = 0;

  public player: PlayerState;
  public lanterns: LanternState[] = [];
  public shades: ShadeState[] = [];
  public drifters: DrifterState[] = [];
  public charms: CharmState[] = [];
  public motes: MoteState[] = [];
  public wind: WindState = { active: false, dir_deg: 0, remaining_ticks: 0 };

  public inputFrames: Map<number, InputFrame> = new Map();
  public currentInput: {
    move: [number, number];
    cam_yaw_deg: number;
    jump: boolean;
    interact: boolean;
    pulse: boolean;
    dash: boolean;
    pause: boolean;
  } = {
    move: [0, 0],
    cam_yaw_deg: 0,
    jump: false,
    interact: false,
    pulse: false,
    dash: false,
    pause: false
  };

  private prevInteract: boolean = false;
  private prevPulse: boolean = false;
  private prevDash: boolean = false;
  private prevPause: boolean = false;
  private shadeIdCounter: number = 1;
  private drifterIdCounter: number = 1;
  private moteIdCounter: number = 1;

  public eventLog: ContractEvent[] = [];
  public tickEvents: ContractEvent[] = [];

  constructor(tuning: TuningConfig, seed: number, night: number = 1) {
    this.tuning = tuning;
    this.prng = new PRNG(seed);
    this.night = night;

    let duration_s = this.tuning.night1_duration_s || 300;
    if (night === 2) duration_s = this.tuning.night2_duration_s || 330;
    if (night === 3) duration_s = this.tuning.night3_duration_s || 360;
    this.total_ticks_limit = Math.round(duration_s * 60);

    this.player = {
      pos: [0, 0, 0],
      vel: [0, 0, 0],
      flames: this.tuning.flames || 3,
      carried: 0,
      grounded: true,
      invuln_ticks: 0,
      dash_ticks: 0,
      dash_cooldown_ticks: 0,
      pulse_cooldown_ticks: 0,
      charm_ticks: 0,
      facing_angle_deg: 0,
      speed: this.tuning.player_speed || 6.0
    };

    this.initMap(this.night);
  }

  private initMap(night: number) {
    this.lanterns = [];
    this.charms = [];

    if (night === 1) {
      // Đêm 1: Đảo Bến R=40m, 5 Đèn
      const defaultPositions: Vec3[] = [
        [0, 0, 25],
        [23.8, 0, 7.7],
        [14.7, 0, -20.2],
        [-14.7, 0, -20.2],
        [-23.8, 0, 7.7]
      ];
      for (let i = 0; i < defaultPositions.length; i++) {
        this.lanterns.push({
          id: `L${i + 1}`,
          pos: defaultPositions[i],
          lit: false,
          deposited: 0
        });
      }
    } else if (night === 2) {
      // Đêm 2: 6 đèn, Bùa Gió tại (35,0,0)
      const positions: Vec3[] = [
        [0, 0, 20],
        [17, 0, -10],
        [-17, 0, -10],
        [70, 0, 20],
        [87, 0, -10],
        [53, 0, -10]
      ];
      for (let i = 0; i < positions.length; i++) {
        this.lanterns.push({
          id: `L${i + 1}`,
          pos: positions[i],
          lit: false,
          deposited: 0
        });
      }
      this.charms.push({ id: "C1", pos: [35, 0, 0], available: true, respawn_ticks: 0 });
    } else if (night === 3) {
      // Đêm 3: 7 đèn, Bùa Gió C1 (30,0,25) và C2 (-30,0,25)
      const positions: Vec3[] = [
        [0, 6, 6],
        [18, 3, 10],
        [-18, 3, 10],
        [35, 0, -10],
        [-35, 0, -10],
        [20, 0, -35],
        [-20, 0, -35]
      ];
      for (let i = 0; i < positions.length; i++) {
        this.lanterns.push({
          id: `L${i + 1}`,
          pos: positions[i],
          lit: false,
          deposited: 0
        });
      }
      this.charms.push({ id: "C1", pos: [30, 0, 25], available: true, respawn_ticks: 0 });
      this.charms.push({ id: "C2", pos: [-30, 0, 25], available: true, respawn_ticks: 0 });
    }
  }

  public applyScenario(scenario: any) {
    if (!scenario) return;

    if (scenario.player) {
      if (scenario.player.pos) {
        if (Array.isArray(scenario.player.pos)) {
          this.player.pos = [...scenario.player.pos];
        } else {
          this.player.pos = [scenario.player.pos.x || 0, scenario.player.pos.y || 0, scenario.player.pos.z || 0];
        }
      }
      if (scenario.player.carried !== undefined) this.player.carried = scenario.player.carried;
      if (scenario.player.motes !== undefined) this.player.carried = scenario.player.motes;
      if (scenario.player.flames !== undefined) this.player.flames = scenario.player.flames;
      if (scenario.player.invuln_ticks !== undefined) this.player.invuln_ticks = scenario.player.invuln_ticks;
      if (scenario.player.charm_ticks !== undefined) this.player.charm_ticks = scenario.player.charm_ticks;
    }

    if (scenario.time_left_s !== undefined) {
      this.total_ticks_limit = Math.round(scenario.time_left_s * 60);
    }

    if (scenario.lanterns) {
      for (const lData of scenario.lanterns) {
        let l = this.lanterns.find((item) => item.id === lData.id);
        const lPos: Vec3 = Array.isArray(lData.pos)
          ? [...lData.pos]
          : lData.pos ? [lData.pos.x, lData.pos.y, lData.pos.z] : [0, 0, 0];
        if (!l) {
          this.lanterns.push({
            id: lData.id || `L${this.lanterns.length + 1}`,
            pos: lPos,
            lit: !!lData.lit,
            deposited: lData.deposited || 0
          });
        } else {
          if (lData.pos) l.pos = lPos;
          if (lData.deposited !== undefined) l.deposited = lData.deposited;
          if (lData.lit !== undefined) l.lit = !!lData.lit;
        }
      }
    }

    if (scenario.motes !== undefined) {
      this.motes = scenario.motes.map((m: any, idx: number) => {
        const p: Vec3 = Array.isArray(m) ? [m[0], m[1], m[2]] : [m.pos?.x || m.x || 0, m.pos?.y || m.y || 0, m.pos?.z || m.z || 0];
        return {
          id: `M${idx + 1}`,
          pos: p,
          kind: "random",
          ttl_ticks: 999999
        };
      });
      this.moteIdCounter = this.motes.length + 1;
    }

    if (scenario.shades !== undefined) {
      this.shades = scenario.shades.map((s: any, idx: number) => {
        const p: Vec3 = Array.isArray(s.pos) ? [s.pos[0], s.pos[1], s.pos[2]] : [s.pos?.x || 0, s.pos?.y || 0, s.pos?.z || 0];
        return {
          id: s.id || `S${idx + 1}`,
          pos: p,
          state: s.state || "chase",
          state_ticks_left: s.state_ticks_left || 0,
          recoil_dir: [0, 0]
        };
      });
      this.shadeIdCounter = this.shades.length + 1;
    }

    if (scenario.drifters !== undefined) {
      this.drifters = scenario.drifters.map((d: any, idx: number) => {
        const p: Vec3 = Array.isArray(d.pos) ? [d.pos[0], d.pos[1], d.pos[2]] : [d.pos?.x || 0, d.pos?.y || 0, d.pos?.z || 0];
        return {
          id: d.id || `D${idx + 1}`,
          pos: p,
          state: d.state || "idle",
          stolen: d.stolen || 0,
          flee_ticks: 0
        };
      });
      this.drifterIdCounter = this.drifters.length + 1;
    }
  }

  public loadInputFrames(frames: InputFrame[]) {
    for (const f of frames) {
      this.inputFrames.set(f.tick, f);
    }
  }

  public getTimeLeftSeconds(): number {
    const left = (this.total_ticks_limit - this.sim_tick) / 60;
    return Math.max(0, round3(left));
  }

  public emit(name: any, data: any) {
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
    this.tickEvents = [];

    // Step 1: Read input & handle pause
    if (this.inputFrames.has(this.tick)) {
      const f = this.inputFrames.get(this.tick)!;
      if (f.move !== undefined) this.currentInput.move = [f.move[0], f.move[1]];
      if (f.cam_yaw_deg !== undefined) this.currentInput.cam_yaw_deg = f.cam_yaw_deg;
      if (f.jump !== undefined) this.currentInput.jump = f.jump;
      if (f.interact !== undefined) this.currentInput.interact = f.interact;
      if (f.pulse !== undefined) this.currentInput.pulse = f.pulse;
      if (f.dash !== undefined) this.currentInput.dash = f.dash;
      if (f.pause !== undefined) this.currentInput.pause = f.pause;
    }

    const pauseTriggered = !this.prevPause && this.currentInput.pause;
    this.prevPause = this.currentInput.pause;

    if (pauseTriggered) {
      if (this.state === "paused") {
        this.state = "playing";
        this.emit("resumed", {});
      } else if (this.state === "playing") {
        this.state = "paused";
        this.emit("paused", {});
      }
    }

    this.tick++;

    if (this.state === "paused") {
      // Logic frozen during pause
      return;
    }
    if (this.state !== "playing") return;

    this.sim_tick++;

    // Step 2: Decrement counters
    if (this.player.invuln_ticks > 0) this.player.invuln_ticks--;
    if (this.player.pulse_cooldown_ticks > 0) this.player.pulse_cooldown_ticks--;
    if (this.player.dash_ticks > 0) this.player.dash_ticks--;
    if (this.player.dash_cooldown_ticks > 0) this.player.dash_cooldown_ticks--;
    if (this.player.charm_ticks > 0) this.player.charm_ticks--;

    for (let i = this.motes.length - 1; i >= 0; i--) {
      if (this.motes[i].kind === "dropped") {
        this.motes[i].ttl_ticks--;
        if (this.motes[i].ttl_ticks <= 0) {
          this.motes.splice(i, 1);
        }
      }
    }

    for (const c of this.charms) {
      if (!c.available) {
        c.respawn_ticks--;
        if (c.respawn_ticks <= 0) c.available = true;
      }
    }

    // Triggers
    const jumpTriggered = this.currentInput.jump;
    const dashTriggered = !this.prevDash && this.currentInput.dash;
    const interactTriggered = !this.prevInteract && this.currentInput.interact;
    const pulseTriggered = !this.prevPulse && this.currentInput.pulse;

    this.prevDash = this.currentInput.dash;
    this.prevInteract = this.currentInput.interact;
    this.prevPulse = this.currentInput.pulse;

    // Step 3: Move Mây (Dash / Jump / Gravity / Fall)
    this.updatePlayerMovement(1 / 60, this.currentInput.move, this.currentInput.cam_yaw_deg, jumpTriggered, dashTriggered);

    // Step 4: Pickup motes & charms
    if (this.player.carried < (this.tuning.carry_capacity || 10)) {
      for (let i = this.motes.length - 1; i >= 0; i--) {
        const m = this.motes[i];
        if (distXZ(this.player.pos, m.pos) <= (this.tuning.pickup_radius || 1.0) && Math.abs(this.player.pos[1] - m.pos[1]) <= 1.5) {
          this.player.carried++;
          this.score += this.tuning.score?.per_mote || 10;
          this.motes.splice(i, 1);
          this.emit("mote_picked", { carried: this.player.carried });
          if (this.player.carried >= (this.tuning.carry_capacity || 10)) break;
        }
      }
    }

    for (const c of this.charms) {
      if (c.available && distXZ(this.player.pos, c.pos) <= 1.0 && Math.abs(this.player.pos[1] - c.pos[1]) <= 1.5) {
        c.available = false;
        c.respawn_ticks = 2700;
        this.player.charm_ticks = 600;
        this.emit("charm_picked", { charm_id: c.id, charm_ticks: 600 });
      }
    }

    // Step 5: Interact with lanterns
    if (interactTriggered && this.player.carried > 0) {
      let nearestLantern: LanternState | null = null;
      let minDist = Infinity;
      for (const l of this.lanterns) {
        if (!l.lit) {
          const d = distXZ(this.player.pos, l.pos);
          if (d <= (this.tuning.interact_radius || 2.0) && d < minDist) {
            minDist = d;
            nearestLantern = l;
          }
        }
      }

      if (nearestLantern) {
        const cost = this.tuning.lantern_cost || 10;
        const needed = cost - nearestLantern.deposited;
        const amount = Math.min(this.player.carried, needed);
        if (amount > 0) {
          this.player.carried -= amount;
          nearestLantern.deposited += amount;
          this.emit("deposit", {
            lantern_id: nearestLantern.id,
            amount: amount,
            deposited: nearestLantern.deposited
          });

          if (nearestLantern.deposited >= cost) {
            nearestLantern.lit = true;
            this.score += this.tuning.score?.per_lantern || 100;
            this.emit("lantern_lit", { lantern_id: nearestLantern.id });

            if (this.lanterns.every((item) => item.lit)) {
              this.state = "won";
              const timeBonus = Math.floor(this.getTimeLeftSeconds()) * (this.tuning.score?.per_second_left || 2);
              const flameBonus = this.player.flames * (this.tuning.score?.per_flame_left || 50);
              this.score += timeBonus + flameBonus;
              this.emit("game_over", { result: "won", reason: "all_lit" });
              return;
            }
          }
        }
      }
    }

    // Step 6: Safe zones
    const litLanterns = this.lanterns.filter((l) => l.lit);
    const safeRadius = this.tuning.safe_radius || 6.0;

    for (const shade of this.shades) {
      for (const l of litLanterns) {
        const d = distXZ(shade.pos, l.pos);
        if (d < safeRadius) {
          let dx = shade.pos[0] - l.pos[0];
          let dz = shade.pos[2] - l.pos[2];
          const len = Math.sqrt(dx * dx + dz * dz);
          if (len > 0.001) {
            shade.pos[0] = round3(l.pos[0] + (dx / len) * safeRadius);
            shade.pos[2] = round3(l.pos[2] + (dz / len) * safeRadius);
          } else {
            shade.pos[0] = round3(l.pos[0] + safeRadius);
          }
        }
      }
    }

    // Step 7: Pulse
    if (pulseTriggered && this.player.carried >= (this.tuning.pulse_cost || 3) && this.player.pulse_cooldown_ticks <= 0) {
      this.player.carried -= (this.tuning.pulse_cost || 3);
      this.player.pulse_cooldown_ticks = Math.round((this.tuning.pulse_cooldown_s || 3.0) * 60);

      const stunnedIds: string[] = [];
      const pulseCenter: Vec3 = [this.player.pos[0], this.player.pos[1] + 0.8, this.player.pos[2]];

      for (const shade of this.shades) {
        if (dist3D(pulseCenter, shade.pos) <= (this.tuning.pulse_radius || 5.0)) {
          shade.state = "stunned";
          shade.state_ticks_left = Math.round((this.tuning.pulse_stun_s || 2.0) * 60);
          stunnedIds.push(shade.id);
          this.score += this.tuning.score?.per_stun || 5;

          let dirX = shade.pos[0] - this.player.pos[0];
          let dirZ = shade.pos[2] - this.player.pos[2];
          const len = Math.sqrt(dirX * dirX + dirZ * dirZ);
          if (len > 0.001) {
            dirX /= len;
            dirZ /= len;
          } else {
            dirX = 1;
            dirZ = 0;
          }
          shade.pos[0] = round3(shade.pos[0] + dirX * (this.tuning.pulse_push_m || 4.0));
          shade.pos[2] = round3(shade.pos[2] + dirZ * (this.tuning.pulse_push_m || 4.0));
        }
      }

      for (const drifter of this.drifters) {
        if (dist3D(pulseCenter, drifter.pos) <= (this.tuning.pulse_radius || 5.0)) {
          if (drifter.state === "chase") {
            drifter.state = "flee";
            drifter.flee_ticks = 240;
          } else if (drifter.state === "flee" && drifter.stolen > 0) {
            for (let k = 0; k < drifter.stolen; k++) {
              this.motes.push({
                id: `M${this.moteIdCounter++}`,
                pos: [...drifter.pos],
                kind: "dropped",
                ttl_ticks: 480
              });
            }
            this.emit("drifter_drop", { drifter_id: drifter.id, amount: drifter.stolen });
            drifter.stolen = 0;
          }
        }
      }

      this.emit("pulse", { stunned_ids: stunnedIds });
    }

    // Step 8: Move Shades & Drifters
    this.updateDrifters();

    for (const shade of this.shades) {
      if (shade.state === "stunned") {
        shade.state_ticks_left--;
        if (shade.state_ticks_left <= 0) shade.state = "chase";
        continue;
      }
      if (shade.state === "recoil") {
        shade.state_ticks_left--;
        shade.pos[0] = round3(shade.pos[0] + shade.recoil_dir[0] * (2.0 / 60));
        shade.pos[2] = round3(shade.pos[2] + shade.recoil_dir[1] * (2.0 / 60));
        if (shade.state_ticks_left <= 0) shade.state = "chase";
        continue;
      }

      let dx = this.player.pos[0] - shade.pos[0];
      let dz = this.player.pos[2] - shade.pos[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 18.0) {
        shade.state = "wander";
      } else if (dist <= 12.0) {
        shade.state = "chase";
      }

      if (shade.state === "chase" && dist > 0.001) {
        const speed = (this.night === 3 ? 4.5 : (this.tuning.shade_speed || 4.0)) / 60;
        const nextX = shade.pos[0] + (dx / dist) * speed;
        const nextZ = shade.pos[2] + (dz / dist) * speed;

        let blocked = false;
        for (const l of litLanterns) {
          if (distXZ([nextX, 0, nextZ], l.pos) < safeRadius) {
            blocked = true;
            break;
          }
        }
        if (!blocked) {
          shade.pos[0] = round3(nextX);
          shade.pos[2] = round3(nextZ);
        }
      }
    }

    // Step 9: Collisions (Drifter steals first, then Shade hits)
    for (const drifter of this.drifters) {
      if (drifter.state === "chase" && distXZ(drifter.pos, this.player.pos) <= 1.2) {
        const stealAmount = Math.min(3, this.player.carried);
        this.player.carried -= stealAmount;
        drifter.stolen += stealAmount;
        drifter.state = "flee";
        drifter.flee_ticks = 240;
        this.emit("drifter_steal", { drifter_id: drifter.id, amount: stealAmount, carried: this.player.carried });
      }
    }

    if (this.player.invuln_ticks <= 0) {
      for (const shade of this.shades) {
        if (distXZ(shade.pos, this.player.pos) <= (this.tuning.shade_hit_radius || 1.0) && Math.abs(shade.pos[1] - this.player.pos[1]) <= 1.5) {
          this.player.flames--;
          const dropped = Math.floor(this.player.carried * (this.tuning.hit_drop_ratio || 0.5));
          this.player.carried -= dropped;

          // Drop motes in ring 1.5 - 2.5m
          for (let k = 0; k < dropped; k++) {
            const angle = (k * 2 * Math.PI) / (dropped || 1);
            const r = 2.0;
            this.motes.push({
              id: `M${this.moteIdCounter++}`,
              pos: [round3(this.player.pos[0] + r * Math.cos(angle)), 0, round3(this.player.pos[2] + r * Math.sin(angle))],
              kind: "dropped",
              ttl_ticks: 480
            });
          }

          this.player.invuln_ticks = 90;
          shade.state = "recoil";
          shade.state_ticks_left = 60;
          let rx = shade.pos[0] - this.player.pos[0];
          let rz = shade.pos[2] - this.player.pos[2];
          const rlen = Math.sqrt(rx * rx + rz * rz) || 1;
          shade.recoil_dir = [rx / rlen, rz / rlen];

          this.emit("player_hit", { by: "shade", flames: this.player.flames, dropped, lost: false });

          if (this.player.flames <= 0) {
            this.state = "lost";
            this.emit("game_over", { result: "lost", reason: "no_flames" });
            return;
          }
          break;
        }
      }
    }

    // Step 11: Win / Loss
    if (this.getTimeLeftSeconds() <= 0 && this.state === "playing") {
      this.state = "lost";
      this.emit("game_over", { result: "lost", reason: "dawn" });
      return;
    }
  }

  public updatePlayerMovement(
    dt: number,
    moveInput: [number, number],
    camYawDeg: number,
    jumpTriggered: boolean,
    dashTriggered: boolean
  ): void {
    const player = this.player;
    const charmed = player.charm_ticks > 0;

    // Dash trigger
    if (dashTriggered && (player.dash_cooldown_ticks <= 0 || charmed) && player.dash_ticks <= 0) {
      player.dash_ticks = 12; // 0.2s * 60
      player.dash_cooldown_ticks = charmed ? 0 : 90; // 1.5s * 60
      this.emit("dash", {});
    }

    const isDashing = player.dash_ticks > 0;
    const currentSpeed = isDashing ? 14.0 : (charmed ? 7.2 : (this.tuning.player_speed || 6.0));
    player.speed = currentSpeed;

    // Movement direction
    let mx = moveInput[0];
    let mz = moveInput[1];
    let len = Math.sqrt(mx * mx + mz * mz);
    if (len > 1.0) {
      mx /= len;
      mz /= len;
    }

    if (len > 0.001 || isDashing) {
      const yawRad = (camYawDeg * Math.PI) / 180;
      let dirX = mx * Math.cos(yawRad) + mz * Math.sin(yawRad);
      let dirZ = -mx * Math.sin(yawRad) + mz * Math.cos(yawRad);

      if (isDashing && len <= 0.001) {
        dirX = Math.sin((player.facing_angle_deg * Math.PI) / 180);
        dirZ = Math.cos((player.facing_angle_deg * Math.PI) / 180);
      }

      player.vel[0] = dirX * currentSpeed;
      player.vel[2] = dirZ * currentSpeed;

      player.pos[0] = round3(player.pos[0] + player.vel[0] * dt);
      player.pos[2] = round3(player.pos[2] + player.vel[2] * dt);
    } else {
      player.vel[0] = 0;
      player.vel[2] = 0;
    }

    // Jump & Gravity (Gravity: -20 m/s^2)
    if (jumpTriggered && player.grounded) {
      player.vel[1] = 7.0;
      player.grounded = false;
    }

    if (!isDashing && !player.grounded) {
      player.vel[1] += -20.0 * dt;
      player.pos[1] = round3(player.pos[1] + player.vel[1] * dt);
      if (player.pos[1] <= 0) {
        player.pos[1] = 0;
        player.vel[1] = 0;
        player.grounded = true;
      }
    }

    // Fall Y < -10
    if (player.pos[1] < -10) {
      player.flames--;
      const dropped = player.carried;
      player.carried = 0;
      this.emit("player_hit", { by: "fall", flames: player.flames, dropped, lost: true });

      if (player.flames <= 0) {
        this.state = "lost";
        this.emit("game_over", { result: "lost", reason: "no_flames" });
        return;
      }

      player.pos = [0, 0, 0];
      player.vel = [0, 0, 0];
      player.grounded = true;
      player.invuln_ticks = 90;
    }
  }

  public updateDrifters(): void {
    const dt = 1 / 60;
    for (let i = 0; i < this.drifters.length; i++) {
      const d = this.drifters[i];
      const dist = distXZ(d.pos, this.player.pos);

      if (d.state === "idle") {
        if (this.player.carried >= 5 && dist <= 15.0) {
          d.state = "chase";
        }
      } else if (d.state === "chase") {
        if (dist > 0.001) {
          const step = 7.0 * dt;
          d.pos[0] = round3(d.pos[0] + ((this.player.pos[0] - d.pos[0]) / dist) * step);
          d.pos[2] = round3(d.pos[2] + ((this.player.pos[2] - d.pos[2]) / dist) * step);
        }
      } else if (d.state === "flee") {
        if (d.flee_ticks > 0) {
          d.flee_ticks--;
          if (dist > 0.001) {
            const step = 7.0 * dt;
            d.pos[0] = round3(d.pos[0] - ((this.player.pos[0] - d.pos[0]) / dist) * step);
            d.pos[2] = round3(d.pos[2] - ((this.player.pos[2] - d.pos[2]) / dist) * step);
          }
        }
      }
    }
  }

  public getSnapshot(): SnapshotOutput {
    return {
      type: "snapshot",
      tick: this.tick,
      sim_tick: this.sim_tick,
      state: this.state,
      night: this.night,
      time_left_s: this.getTimeLeftSeconds(),
      score: this.score,
      wind: { active: this.wind.active, dir_deg: this.wind.dir_deg },
      player: {
        pos: [round3(this.player.pos[0]), round3(this.player.pos[1]), round3(this.player.pos[2])],
        vel: [round3(this.player.vel[0]), round3(this.player.vel[1]), round3(this.player.vel[2])],
        flames: this.player.flames,
        carried: this.player.carried,
        grounded: this.player.grounded,
        invuln: this.player.invuln_ticks > 0,
        dash_cd_s: round3(this.player.dash_cooldown_ticks / 60),
        pulse_cd_s: round3(this.player.pulse_cooldown_ticks / 60),
        charm_s: round3(this.player.charm_ticks / 60)
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
        pos: [round3(m.pos[0]), round3(m.pos[1]), round3(m.pos[2])],
        kind: m.kind,
        ttl_s: round3(m.ttl_ticks / 60)
      })),
      drifters: this.drifters.map((d) => ({
        id: d.id,
        pos: [round3(d.pos[0]), round3(d.pos[1]), round3(d.pos[2])],
        state: d.state,
        stolen: d.stolen
      })),
      charms: this.charms.map((c) => ({
        id: c.id,
        available: c.available,
        respawn_s: round3(c.respawn_ticks / 60)
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
