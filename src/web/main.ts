import * as THREE from "three";
import { GameSimulation } from "../core/game.js";

const DEFAULT_TUNING: any = {
  player_speed: 6.0,
  carry_capacity: 10,
  lantern_cost: 10,
  relight_cost: 5,
  pulse_cost: 3,
  safe_radius: 6.0,
  shade_speed: 4.0,
  fuel_max: 100,
  win_ratio: 0.6,
  dash_cooldown_s: 1.5,
  pulse_cooldown_s: 3.0,
  night1_duration_s: 240,
  pickup_radius: 1.0,
  interact_radius: 2.0
};

let clock = 0;
const keys = new Set<string>();
const input = { dash: false, pulse: false, interact: false };
const $ = (id: string) => document.getElementById(id) as HTMLElement | null;
const seed = Math.floor(Math.random() * 1e9);
const sim: any = new GameSimulation(DEFAULT_TUNING as any, seed as any, 1 as any);

function rnd(a: number, b: number) { return a + Math.random() * (b - a); }

function applyScenario(s: any, _seed: number) {
  const motes: any[] = [];
  for (let i = 0; i < 20; i++) {
    const a = Math.random() * Math.PI * 2, r = rnd(4, 20);
    motes.push({ id: `M${i}`, pos: [Math.cos(a) * r, 0, Math.sin(a) * r], kind: "random", ttl_ticks: 999999 });
  }
  const shades = [
    { id: "S1", pos: [14, 0, 14], state: "wander" },
    { id: "S2", pos: [-16, 0, 12], state: "wander" },
    { id: "S3", pos: [-12, 0, -16], state: "wander" },
    { id: "S4", pos: [15, 0, -14], state: "wander" },
  ];
  const drifters = [{ id: "D1", pos: [0, 0, -10], state: "idle", stolen: 0 }];
  s.applyScenario({ motes, shades, drifters });
}
applyScenario(sim, seed);

function spawnMotes() {
  if (!sim.motes || sim.state === "won" || sim.state === "lost") return;
  while (sim.motes.length < 15) {
    const a = Math.random() * Math.PI * 2, r = rnd(4, 20);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    sim.motes.push({
      id: `M_${Math.floor(Math.random() * 1e6)}`,
      pos: [x, 0, z],
      kind: "random",
      ttl_ticks: 999999,
    });
  }
}

// ---------- Three.js ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070b1a);
scene.fog = new THREE.Fog(0x070b1a, 25, 70);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0, 10, 14);
const moon = new THREE.DirectionalLight(0x9db8ff, 0.9);
moon.position.set(-20, 30, 10);
scene.add(moon, new THREE.AmbientLight(0x3a4470, 0.8));

const island = new THREE.Mesh(
  new THREE.CylinderGeometry(26, 28, 2, 48),
  new THREE.MeshStandardMaterial({ color: 0x2f4a3a, roughness: 1 }));
island.position.y = -1;
scene.add(island);
const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 400),
  new THREE.MeshStandardMaterial({ color: 0x0b2540, roughness: 0.4, metalness: 0.3 }));
sea.rotation.x = -Math.PI / 2; sea.position.y = -1.6;
scene.add(sea);
{
  const g = new THREE.BufferGeometry(), p: number[] = [];
  for (let i = 0; i < 400; i++) p.push(rnd(-150, 150), rnd(20, 90), rnd(-150, 150));
  g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, fog: false })));
}

// ---------- Player ----------
const player = new THREE.Group();
const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 1.3, 12),
  new THREE.MeshStandardMaterial({ color: 0x8a3b2a }));
robe.position.y = 0.65;
const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12),
  new THREE.MeshStandardMaterial({ color: 0xf0c9a0 }));
head.position.y = 1.5;
const hat = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.5, 16),
  new THREE.MeshStandardMaterial({ color: 0xd9bf7a }));
hat.position.y = 1.85;
const hip = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10),
  new THREE.MeshBasicMaterial({ color: 0xffb050 }));
hip.position.set(0.5, 0.7, 0.2);
const hipLight = new THREE.PointLight(0xffa850, 1.6, 12);
hipLight.position.copy(hip.position);
player.add(robe, head, hat, hip, hipLight);
scene.add(player);

// ---------- Pools ----------
function syncPool(pool: Map<string, THREE.Object3D>, items: any[], createFn: (it: any) => THREE.Object3D,
  update?: (o: THREE.Object3D, it: any) => void) {
  const seen = new Set<string>();
  (items ?? []).forEach((it, idx) => {
    const id = String(it.id ?? idx);
    seen.add(id);
    let o = pool.get(id);
    if (!o) { o = createFn(it); pool.set(id, o); scene.add(o); }
    update?.(o, it);
  });
  for (const [id, o] of pool) if (!seen.has(id)) { scene.remove(o); pool.delete(id); }
}
const motePool = new Map<string, THREE.Object3D>();
const shadePool = new Map<string, THREE.Object3D>();
const drifterPool = new Map<string, THREE.Object3D>();
const charmPool = new Map<string, THREE.Object3D>();
const sphere = (r: number, mat: THREE.Material) => new THREE.Mesh(new THREE.SphereGeometry(r, 14, 14), mat);

const createMote = () => {
  const g = new THREE.Group();
  g.add(sphere(0.22, new THREE.MeshBasicMaterial({ color: 0xfff6c2 })));
  g.add(new THREE.PointLight(0xfff6c2, 0.5, 4));
  return g;
};
const createShade = () => sphere(0.9, new THREE.MeshStandardMaterial({ color: 0x120a1a, emissive: 0x7a3cff, emissiveIntensity: 0.8 }));
const createDrifter = () => sphere(0.6, new THREE.MeshStandardMaterial({ color: 0x8fa3b8, emissive: 0x334455, metalness: 0.6, roughness: 0.3 }));
const createCharm = () => sphere(0.3, new THREE.MeshBasicMaterial({ color: 0x66ffcc }));

// ---------- Lanterns ----------
interface LanternView { group: THREE.Group; flame: THREE.Mesh; light: THREE.PointLight; ring: THREE.Mesh; label: HTMLDivElement; }
const lanternViews: LanternView[] = [];
const labelLayer = document.createElement("div");
labelLayer.style.cssText = "position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:5";
document.body.appendChild(labelLayer);

function buildLantern(): LanternView {
  const group = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 3, 8), new THREE.MeshStandardMaterial({ color: 0x4a3322 }));
  post.position.y = 1.5;
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.6), new THREE.MeshStandardMaterial({ color: 0x6b4a2e }));
  box.position.y = 3.3;
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), new THREE.MeshBasicMaterial({ color: 0xff9a30 }));
  flame.position.y = 3.3;
  const light = new THREE.PointLight(0xffa040, 0, 16);
  light.position.y = 3.3;
  const ring = new THREE.Mesh(new THREE.RingGeometry(5.6, 6, 48),
    new THREE.MeshBasicMaterial({ color: 0xffc060, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05;
  group.add(post, box, flame, light, ring);
  scene.add(group);
  const label = document.createElement("div");
  label.style.cssText = "position:absolute;color:#ffe9b0;font:12px sans-serif;text-shadow:0 0 4px #000;transform:translate(-50%,-100%);white-space:nowrap";
  labelLayer.appendChild(label);
  return { group, flame, light, ring, label };
}

// ---------- Input ----------
addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  keys.add(k);
  if (k === " " || k === "shift") input.dash = true;
  if (k === "q" || k === "f") input.pulse = true;
  if (k === "e") input.interact = true;
  if (k === "h") toggleHelp();
  if (k === " " || k.startsWith("arrow")) e.preventDefault();
});
addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  keys.delete(k);
  if (k === " " || k === "shift") input.dash = false;
  if (k === "q" || k === "f") input.pulse = false;
  if (k === "e") input.interact = false;
});
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
function toggleHelp() { const h = $("help-modal"); if (h) h.hidden = !h.hidden; }
$("btn-help")?.addEventListener("click", toggleHelp);
$("btn-resume")?.addEventListener("click", () => { const h = $("help-modal"); if (h) h.hidden = true; });
$("btn-close-help")?.addEventListener("click", () => { const h = $("help-modal"); if (h) h.hidden = true; });
$("btn-restart")?.addEventListener("click", () => location.reload());

// ---------- Frame loop ----------
const camTarget = new THREE.Vector3();
const tmp = new THREE.Vector3();
let facing = 0;

function frame() {
  requestAnimationFrame(frame);
  clock += 1 / 60;

  let mx = 0, mz = 0;
  if (keys.has("w") || keys.has("arrowup")) mz -= 1;
  if (keys.has("s") || keys.has("arrowdown")) mz += 1;
  if (keys.has("a") || keys.has("arrowleft")) mx -= 1;
  if (keys.has("d") || keys.has("arrowright")) mx += 1;
  const len = Math.hypot(mx, mz);
  if (len > 0) { mx /= len; mz /= len; }
  const ci = sim.currentInput;
  if (ci) {
    ci.move = [mx, mz];
    ci.cam_yaw_deg = 0;
    ci.dash = input.dash;
    ci.pulse = input.pulse;
    ci.interact = input.interact;
  }

  if (sim.state !== "won" && sim.state !== "lost") sim.step(1 / 60);
  spawnMotes();

  const pl = sim.player ?? {};
  const pp: number[] = pl.pos ?? [0, 0, 0];
  player.position.set(pp[0], pp[1] ?? 0, pp[2]);
  if (len > 0) {
    const target = Math.atan2(mx, mz);
    let d = target - facing;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    facing += d * 0.2;
  }
  player.rotation.y = facing;
  const inv = (pl.invuln_ticks ?? pl.invulnerable_ticks ?? 0) > 0;
  player.visible = inv ? Math.floor(clock * 12) % 2 === 0 : true;

  syncPool(motePool, sim.motes, createMote, (o, m) => {
    const p = m.pos;
    o.position.set(p[0], 0.9 + Math.sin(clock * 2.5 + p[0] * 0.7 + p[2]) * 0.25, p[2]);
  });
  syncPool(shadePool, sim.shades, createShade, (o, s) => {
    const p = s.pos;
    o.position.set(p[0], 0.9 + Math.sin(clock * 2 + p[0]) * 0.1, p[2]);
    const stunned = s.state === "stunned" || (s.stun_ticks ?? 0) > 0;
    const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
    mat.emissive.setHex(stunned ? 0xff3cc8 : 0x7a3cff);
  });
  syncPool(drifterPool, sim.drifters, createDrifter, (o, d) => {
    const p = d.pos;
    o.position.set(p[0], 1.2 + Math.sin(clock * 3 + p[2]) * 0.3, p[2]);
  });
  syncPool(charmPool, sim.charms, createCharm, (o, c) => {
    const p = c.pos ?? [0, 0, 0];
    o.position.set(p[0], 0.6, p[2]);
  });

  // Lanterns
  const lanterns: any[] = sim.lanterns ?? [];
  while (lanternViews.length < lanterns.length) lanternViews.push(buildLantern());
  let litCount = 0;
  let nearest: any = null, nearestD = Infinity;
  lanterns.forEach((l, i) => {
    const v = lanternViews[i];
    const p = l.pos ?? [0, 0, 0];
    const fuelRaw = l.fuel ?? l.fuel_pct ?? 0;
    const fuelPct = Math.round(fuelRaw <= 1 && fuelRaw > 0 ? fuelRaw * 100 : fuelRaw);
    const lit = l.lit ?? fuelPct > 0;
    if (lit) litCount++;
    else {
      const d = Math.hypot(p[0] - pp[0], p[2] - pp[2]);
      if (d < nearestD) { nearestD = d; nearest = p; }
    }
    v.group.position.set(p[0], 0, p[2]);
    const flick = 0.85 + Math.sin(clock * 14 + i * 3) * 0.15;
    (v.flame.material as THREE.MeshBasicMaterial).color.setHex(lit ? 0xffb040 : 0x444444);
    v.flame.scale.setScalar(lit ? flick : 0.6);
    v.light.intensity = lit ? 2.5 * flick : 0;
    v.ring.visible = lit;
    v.label.textContent = `Đèn ${i + 1} (${fuelPct}%)`;
    tmp.set(p[0], 4.3, p[2]).project(camera);
    const vis = tmp.z < 1;
    v.label.style.display = vis ? "block" : "none";
    v.label.style.left = `${(tmp.x * 0.5 + 0.5) * innerWidth}px`;
    v.label.style.top = `${(-tmp.y * 0.5 + 0.5) * innerHeight}px`;
  });

  // Camera
  camTarget.set(pp[0], pp[1] + 10, pp[2] + 14);
  camera.position.lerp(camTarget, 0.08);
  camera.lookAt(pp[0], pp[1] + 1.2, pp[2]);

  // HUD
  const flames = sim.player?.flames ?? 3;
  document.querySelectorAll(".flame").forEach((f, i) => f.classList.toggle("lost", i >= flames));

  const secs = Math.max(0, Math.floor(sim.getTimeLeftSeconds?.() ?? 0));
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const timerEl = $("timer-text");
  if (timerEl) timerEl.textContent = `${mm}:${ss}`;
  const timerWarn = $("timer-warning");
  if (timerWarn) timerWarn.hidden = secs > 30;

  const scoreEl = $("score-value") || $("score-text");
  if (scoreEl) scoreEl.textContent = `${sim.score ?? 0} điểm`;
  const litEl = $("lit-count");
  if (litEl) litEl.textContent = `${litCount}/${lanterns.length || 5}`;

  const carried = sim.player?.carried ?? 0;
  document.querySelectorAll("#motes-bar .mote-slot").forEach((s, i) => s.classList.toggle("filled", i < carried));
  const mc = $("motes-count");
  if (mc) mc.textContent = `${carried}/10`;

  const dcd = $("dash-cd");
  if (dcd) dcd.style.opacity = (sim.player?.dash_cooldown_ticks ?? 0) > 0 ? "0.4" : "1.0";
  const pcd = $("pulse-cd");
  if (pcd) pcd.style.opacity = (sim.player?.pulse_cooldown_ticks ?? 0) > 0 ? "0.4" : "1.0";

  const prompt = $("interaction-prompt") || $("prompt");
  if (prompt) {
    const near = lanterns.some((l) => {
      const p = l.pos ?? [0, 0, 0];
      return Math.hypot(p[0] - pp[0], p[2] - pp[2]) < 3.5;
    });
    prompt.hidden = !(near && carried > 0);
    if (!prompt.hidden) prompt.textContent = "Nhấn E để tiếp dầu cho đèn";
  }

  const arrow = $("compass-arrow");
  if (arrow) {
    arrow.style.visibility = nearest ? "visible" : "hidden";
    if (nearest) {
      const ang = Math.atan2(nearest[0] - pp[0], nearest[2] - pp[2]);
      arrow.style.transform = `rotate(${(-ang * 180) / Math.PI + 180}deg)`;
    }
  }

  const over = sim.state === "won" || sim.state === "lost";
  const modal = $("gameover-modal") || $("gameover");
  if (modal) {
    modal.hidden = !over;
    const title = $("gameover-title");
    if (title && over) title.textContent = sim.state === "won" ? "Chiến thắng! Đảo đã sáng đèn" : "Thất bại! Bóng tối nuốt chửng";
    const finalScoreEl = $("final-score");
    if (finalScoreEl) finalScoreEl.textContent = String(sim.score ?? 0);
  }

  renderer.render(scene, camera);
}
frame();