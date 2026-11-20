// src/core/types.ts
// Type definitions for "Đảo Đèn Lồng" - Contract v1.2 (Phase 3)

export type Vec3 = [number, number, number];
export type Vec2 = [number, number];

export type NightNumber = 1 | 2 | 3;
export type GameStateName = "playing" | "won" | "lost" | "paused";
export type EndStateName = "won" | "lost";
export type EndReason = "no_flames" | "dawn" | "dawn_survived";

export type ShadeStateName = "spawning" | "wander" | "chase" | "recoil" | "stunned" | "drain";
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
  | "resumed"
  | "refuel"
  | "lantern_out"
  | "fuel_drain";

export interface TuningConfig {
  player_speed: number;
  carry_capacity: number;
  capacity_max: number;
  lantern_cost: number;
  relight_cost: number;
  lantern_count_night1: number;
  pickup_radius: number;
  interact_radius: number;
  pulse_cost: number;
  pulse_radius: number;
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
  night1_duration_s: number;
  night2_duration_s: number;
  night3_duration_s: number;
  flames: number;
  invuln_s: number;
  hit_drop_ratio: number;
  fuel_max: number;
  fuel_decay_per_s: number;
  fuel_per_mote: number;
  win_ratio: number;
  drain_per_s: number;
  low_fuel_threshold: number;
  score: {
    per_mote: number;
    per_lantern_first: number;
    per_lantern_relight: number;
    per_stun: number;
    per_stun_drain: number;
    per_flame_left: number;
  };
}

export interface PlayerState {
  pos: Vec3;
  vel: Vec3;
  flames: number;
  carried: number;
  capacity: number;
  successful_lights: number;
  grounded: boolean;
  invuln_ticks: number;
  dash_ticks: number;
  dash_cooldown_ticks: number;
  pulse_cooldown_ticks: number;
  charm_ticks: number;
  facing_angle_deg: number;
  speed: number;
}

export interface LanternState {
  id: string;
  pos: Vec3;
  lit: boolean;
  deposited: number;
  fuel: number;
  ever_lit: boolean;
  relit_count: number;
}

export interface ShadeState {
  id: string;
  pos: Vec3;
  state: ShadeStateName;
  state_ticks_left: number;
  recoil_dir: [number, number];
  target_lantern_id?: string;
  drain_ticks?: number;
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

export interface InputFrame {
  tick: number;
  move?: [number, number];
  cam_yaw_deg?: number;
  jump?: boolean;
  interact?: boolean;
  pulse?: boolean;
  dash?: boolean;
  pause?: boolean;
}

export interface ScenarioData {
  player?: {
    pos?: Vec3;
    carried?: number;
    motes?: number;
    flames?: number;
    invuln_ticks?: number;
    dash_cd_ticks?: number;
    pulse_cd_ticks?: number;
    charm_ticks?: number;
    successful_lights?: number;
  };
  random_motes?: boolean;
  random_shades?: boolean;
  random_drifters?: boolean;
  wind_enabled?: boolean;
  motes?: Vec3[];
  shades?: { id?: string; pos: Vec3; state?: ShadeStateName; state_ticks_left?: number; target_lantern_id?: string }[];
  drifters?: { id?: string; pos: Vec3; state?: DrifterStateName; stolen?: number }[];
  charms?: { id?: string; pos?: Vec3; available?: boolean; respawn_ticks?: number }[];
  lanterns?: { id: string; pos?: Vec3; deposited?: number; lit?: boolean; fuel?: number; ever_lit?: boolean }[];
  time_left_s?: number;
}

export interface ContractEvent {
  type: "event";
  tick: number;
  name: ContractEventName;
  data: Record<string, any>;
}

export interface SnapshotOutput {
  type: "snapshot";
  tick: number;
  sim_tick: number;
  state: GameStateName;
  night: number;
  time_left_s: number;
  score: number;
  wind: { active: boolean; dir_deg: number };
  player: {
    pos: Vec3;
    vel: Vec3;
    flames: number;
    carried: number;
    capacity: number;
    grounded: boolean;
    invuln: boolean;
    dash_cd_s: number;
    pulse_cd_s: number;
    charm_s: number;
  };
  lanterns: {
    id: string;
    pos: Vec3;
    lit: boolean;
    deposited: number;
    fuel: number;
    ever_lit: boolean;
    relit_count: number;
  }[];
  shades: {
    id: string;
    pos: Vec3;
    state: string;
    target_lantern_id?: string;
  }[];
  motes_active: number;
  motes: { id: string; pos: Vec3; kind: MoteKind; ttl_s: number }[];
  drifters: { id: string; pos: Vec3; state: string; stolen: number }[];
  charms: { id: string; available: boolean; respawn_s: number }[];
}

export interface EndOutput {
  type: "end";
  ticks: number;
  state: EndStateName | "playing" | "paused";
  score: number;
}
