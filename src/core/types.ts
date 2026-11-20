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
  score: {
    per_mote: number;
    per_lantern: number;
    per_stun: number;
    per_second_left: number;
    per_flame_left: number;
  };
}

export type Vec3 = [number, number, number];

export interface PlayerState {
  pos: Vec3;
  flames: number;
  carried: number;
  invuln_ticks: number;
  pulse_cooldown_ticks: number;
}

export interface LanternState {
  id: string;
  pos: Vec3;
  lit: boolean;
  deposited: number;
}

export interface ShadeState {
  id: string;
  pos: Vec3;
  state: "chase" | "stunned" | "patrol";
  stun_ticks: number;
}

export interface MoteState {
  id: string;
  pos: Vec3;
}

export interface InputFrame {
  tick: number;
  move?: [number, number];
  cam_yaw_deg?: number;
  jump?: boolean;
  interact?: boolean;
  pulse?: boolean;
}

export interface ScenarioData {
  player?: {
    pos?: Vec3;
    carried?: number;
    flames?: number;
  };
  random_motes?: boolean;
  random_shades?: boolean;
  motes?: Vec3[];
  shades?: { id?: string; pos: Vec3 }[];
  lanterns?: { id: string; pos?: Vec3; deposited?: number; lit?: boolean }[];
  time_left_s?: number;
}

export interface ContractEvent {
  type: "event";
  tick: number;
  name: "mote_picked" | "deposit" | "lantern_lit" | "pulse" | "player_hit" | "shade_spawned" | "game_over";
  data: Record<string, any>;
}

export interface SnapshotOutput {
  type: "snapshot";
  tick: number;
  sim_tick: number;
  state: "playing" | "won" | "lost";
  time_left_s: number;
  score: number;
  player: {
    pos: Vec3;
    flames: number;
    carried: number;
  };
  lanterns: {
    id: string;
    pos: Vec3;
    lit: boolean;
    deposited: number;
  }[];
  shades: {
    id: string;
    pos: Vec3;
    state: string;
  }[];
  motes_active: number;
  motes?: { id: string; pos: Vec3 }[];
}

export interface EndOutput {
  type: "end";
  ticks: number;
  state: "playing" | "won" | "lost";
  score: number;
}
