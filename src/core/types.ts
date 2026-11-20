// src/core/types.ts
// Type definitions for "Đảo Đèn Lồng" - Contract v1.1 (Phase 2)
// Units: meters, seconds. Y axis points up. Logic runs at 60 ticks/second.

export type Vec3 = [number, number, number];
export type Vec2 = [number, number];

export type NightNumber = 1 | 2 | 3;

export type GameStateName = "playing" | "won" | "lost" | "paused";
export type EndStateName = "won" | "lost";
export type EndReason = "no_flames" | "dawn" | "all_lit";

export type ShadeStateName = "spawning" | "wander" | "chase" | "recoil" | "stunned";
export type DrifterStateName = "idle" | "chase" | "flee";
export type MoteKind = "random" | "dropped";

export type ContractEventName =
  | "mote_picked"
  | "deposit"
  | "lantern_lit"
  | "pulse"
  | "player_hit"
  | "shade_spawned"
  | "game_over"
  | "dash"
  | "charm_picked"
  | "drifter_steal"
  | "drifter_drop"
  | "night_start"
  | "paused"
  | "resumed";

/** Tuning values; keys match game.contract.json exactly. */
export interface TuningConfig {
  player_speed: number;
  carry_capacity: number;
  lantern_cost: number;
  lantern_count_night1: number;
  pickup_radius: number;
  interact_radius: number;
  pulse_cost: number;
  pulse_radius: number;
  night1_duration_s: number;
  flames: number;
  invuln_s: number;
  hit_drop_ratio: number;
  pulse_stun_s: number;
  pulse_push_m: number;
  pulse_cooldown_s: number;
  safe_radius: number;
  shade_speed: number;
  shade_hit_radius: number;
  fall_enabled: boolean;
  dash_speed: number;
  dash_duration_s: number;
  dash_cooldown_s: number;
  night2_duration_s: number;
  night3_duration_s: number;
}

/** Internal player state (tick-based counters). */
export interface PlayerState {
  pos: Vec3;
  vel: Vec3;
  flames: number;
  carried: number;
  grounded: boolean;
  invuln_ticks: number;
  dash_ticks: number;
  dash_cooldown_ticks: number;
  pulse_cooldown_ticks: number;
  charm_ticks: number;
  facing_angle_deg: number;
}

export interface LanternState {
  id: string;
  pos: Vec3;
  lit: boolean;
  /** Fireflies deposited so far (lantern remembers progress). */
  deposited: number;
}

export interface ShadeState {
  id: string;
  pos: Vec3;
  state: ShadeStateName;
  state_ticks_left: number;
  /** Horizontal (X, Z) direction used while in recoil / stunned push. */
  recoil_dir: [number, number];
}

export interface DrifterState {
  id: string;
  pos: Vec3;
  state: DrifterStateName;
  stolen: number;
  flee_ticks: number;
}

export interface CharmState {
  id: string;
  pos: Vec3;
  available: boolean;
  respawn_ticks: number;
}

export interface MoteState {
  id: string;
  pos: Vec3;
  kind: MoteKind;
  ttl_ticks: number;
}

export interface WindState {
  active: boolean;
  dir_deg: number;
  remaining_ticks: number;
}

/** Snapshot sub-types. */
export interface SnapshotPlayer {
  pos: Vec3;
  vel: Vec3;
  flames: number;
  carried: number;
  grounded: boolean;
  invuln: boolean;
  dash_cd_s: number;
  pulse_cd_s: number;
  charm_s: number;
}

export interface SnapshotLantern {
  id: string;
  pos: Vec3;
  lit: boolean;
  deposited: number;
}

export interface SnapshotShade {
  id: string;
  pos: Vec3;
  state: ShadeStateName;
}

export interface SnapshotMote {
  id: string;
  pos: Vec3;
  kind: MoteKind;
  ttl_s: number;
}

export interface SnapshotDrifter {
  id: string;
  pos: Vec3;
  state: string;
  stolen: number;
}

export interface SnapshotCharm {
  id: string;
  available: boolean;
  respawn_s: number;
}

export interface SnapshotOutput {
  type: "snapshot";
  tick: number;
  sim_tick: number;
  state: "playing" | "won" | "lost" | "paused";
  night: number;
  time_left_s: number;
  score: number;
  wind: { active: boolean; dir_deg: number };
  player: SnapshotPlayer;
  lanterns: SnapshotLantern[];
  shades: SnapshotShade[];
  motes: SnapshotMote[];
  drifters: SnapshotDrifter[];
  charms: SnapshotCharm[];
}

export interface ContractEvent {
  type: "event";
  tick: number;
  name: ContractEventName;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

/** Documented payloads for events (data field of ContractEvent). */
export interface DashEventData {}
export interface CharmPickedEventData {
  charm_id: string;
  charm_ticks: number;
}
export interface DrifterStealEventData {
  drifter_id: string;
  amount: number;
  carried: number;
}
export interface DrifterDropEventData {
  drifter_id: string;
  amount: number;
}
export interface NightStartEventData {
  night: number;
}
export interface PausedEventData {}
export interface ResumedEventData {}
export interface PlayerHitEventData {
  [key: string]: unknown;
  /** true if the hit cost a flame (false when it was ignored for flame loss). */
  lost: boolean;
}

export interface InputFrame {
  tick: number;
  move?: [number, number];
  cam_yaw_deg?: number;
  jump?: boolean;
  interact?: boolean;
  pulse?: boolean;
  dash?: boolean;
  /** Pause toggles on a false -> true transition. */
  pause?: boolean;
}

/** Scenario sub-types. */
export interface ScenarioPlayer {
  pos?: Vec3;
  vel?: Vec3;
  flames?: number;
  carried?: number;
  grounded?: boolean;
  facing_angle_deg?: number;
  invuln_ticks?: number;
  dash_ticks?: number;
  dash_cd_ticks?: number;
  pulse_cd_ticks?: number;
  charm_ticks?: number;
}

export interface ScenarioShade {
  id?: string;
  pos: Vec3;
  state?: ShadeStateName;
  state_ticks_left?: number;
  recoil_dir?: [number, number];
}

export interface ScenarioDrifter {
  id?: string;
  pos: Vec3;
  state?: DrifterStateName;
  stolen?: number;
  flee_ticks?: number;
}

export interface ScenarioCharm {
  id?: string;
  pos?: Vec3;
  available?: boolean;
  respawn_ticks?: number;
}

export interface ScenarioMote {
  id?: string;
  pos: Vec3;
  kind?: MoteKind;
  ttl_ticks?: number;
}

export interface ScenarioLantern {
  id?: string;
  pos?: Vec3;
  lit?: boolean;
  deposited?: number;
}

export interface ScenarioData {
  player?: ScenarioPlayer;
  /** When true, motes are generated randomly per the standard map and schedule. */
  random_motes?: boolean;
  /** When true, Shades spawn per the standard schedule. */
  random_shades?: boolean;
  /** When true, Drifters spawn per the standard schedule (Night 2 & 3). */
  random_drifters?: boolean;
  /** When true, the wind cycle runs (Night 3). */
  wind_enabled?: boolean;
  motes?: ScenarioMote[];
  shades?: ScenarioShade[];
  drifters?: ScenarioDrifter[];
  charms?: ScenarioCharm[];
  lanterns?: ScenarioLantern[];
  time_left_s?: number;
}

export interface EndOutput {
  type: "end";
  ticks: number;
  state: "won" | "lost";
  score: number;
}