import * as THREE from 'three';
import { GameSimulation } from '../core/game.js';
import { TuningConfig } from '../core/types.js';

// Default tuning matching game.contract.json
const defaultTuning: TuningConfig = {
  player_speed: 6.0,
  carry_capacity: 5,
  lantern_cost: 3,
  lantern_count_night1: 5,
  pickup_radius: 1.5,
  interact_radius: 2.5,
  pulse_cost: 1,
  pulse_radius: 5.0,
  night1_duration_s: 180,
  flames: 3,
  invuln_s: 1.5,
  hit_drop_ratio: 0.5,
  pulse_stun_s: 3.0,
  pulse_push_m: 4.0,
  pulse_cooldown_s: 2.0,
  safe_radius: 4.0,
  shade_speed: 3.5,
  shade_hit_radius: 1.2,
  fall_enabled: false,
  score: {
    per_mote: 10,
    per_lantern: 100,
    per_stun: 20,
    per_second_left: 2,
    per_flame_left: 50
  }
};

let sim = new GameSimulation(defaultTuning, Date.now() % 100000);
sim.applyScenario({ random_motes: true, random_shades: true });

// Three.js Scene Setup
const container = document.getElementById('game-container')!;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050714);
scene.fog = new THREE.FogExp2(0x050714, 0.025);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x223355, 0.6);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0x7799cc, 0.8);
moonLight.position.set(20, 50, 20);
moonLight.castShadow = true;
scene.add(moonLight);

// Island Platform
const islandGeo = new THREE.CylinderGeometry(35, 30, 4, 48);
const islandMat = new THREE.MeshStandardMaterial({
  color: 0x1a2e22,
  roughness: 0.9,
  metalness: 0.1
});
const island = new THREE.Mesh(islandGeo, islandMat);
island.position.y = -2;
island.receiveShadow = true;
scene.add(island);

// Cloud sea around island
const seaGeo = new THREE.PlaneGeometry(300, 300);
const seaMat = new THREE.MeshBasicMaterial({ color: 0x090d1f, transparent: true, opacity: 0.8 });
const cloudSea = new THREE.Mesh(seaGeo, seaMat);
cloudSea.rotation.x = -Math.PI / 2;
cloudSea.position.y = -4;
scene.add(cloudSea);

// Player (Mây) Representation
const playerGroup = new THREE.Group();

// Body (Robes)
const bodyGeo = new THREE.ConeGeometry(0.5, 1.2, 16);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2b4c7e });
const body = new THREE.Mesh(bodyGeo, bodyMat);
body.position.y = 0.6;
playerGroup.add(body);

// Head
const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
const headMat = new THREE.MeshStandardMaterial({ color: 0xf0d0b0 });
const head = new THREE.Mesh(headGeo, headMat);
head.position.y = 1.35;
playerGroup.add(head);

// Nón Lá (Conical Hat)
const hatGeo = new THREE.ConeGeometry(0.85, 0.4, 16);
const hatMat = new THREE.MeshStandardMaterial({ color: 0xd4a359 });
const hat = new THREE.Mesh(hatGeo, hatMat);
hat.position.y = 1.6;
playerGroup.add(hat);

// Lantern attached to Mây
const smallLanternGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.25, 8);
const smallLanternMat = new THREE.MeshStandardMaterial({ color: 0xffaa33, emissive: 0xff8800, emissiveIntensity: 0.8 });
const smallLantern = new THREE.Mesh(smallLanternGeo, smallLanternMat);
smallLantern.position.set(0.4, 0.8, 0.2);
playerGroup.add(smallLantern);

const playerPointLight = new THREE.PointLight(0xffaa44, 1.2, 8);
playerPointLight.position.set(0.4, 0.8, 0.2);
playerGroup.add(playerPointLight);

scene.add(playerGroup);

// Lantern Meshes (5 Great Lanterns)
const lanternMeshes = new Map<string, { group: THREE.Group; light: THREE.PointLight; lamp: THREE.Mesh }>();
for (const l of sim.lanterns) {
  const lGroup = new THREE.Group();
  lGroup.position.set(l.pos[0], l.pos[1], l.pos[2]);

  // Pillar
  const postGeo = new THREE.CylinderGeometry(0.2, 0.25, 3.5, 8);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
  const post = new THREE.Mesh(postGeo, postMat);
  post.position.y = 1.75;
  lGroup.add(post);

  // Cage / Lamp
  const lampGeo = new THREE.BoxGeometry(1.0, 1.2, 1.0);
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0x332211,
    emissive: 0x221100,
    emissiveIntensity: 0.2
  });
  const lamp = new THREE.Mesh(lampGeo, lampMat);
  lamp.position.y = 3.6;
  lGroup.add(lamp);

  const pLight = new THREE.PointLight(0xff9922, 0, 12);
  pLight.position.y = 3.6;
  lGroup.add(pLight);

  scene.add(lGroup);
  lanternMeshes.set(l.id, { group: lGroup, light: pLight, lamp });
}

// Mote Meshes
const moteMeshMap = new Map<string, THREE.Mesh>();
const moteGeo = new THREE.SphereGeometry(0.2, 8, 8);
const moteMat = new THREE.MeshBasicMaterial({ color: 0xffe066 });

// Shade Meshes
const shadeMeshMap = new Map<string, { mesh: THREE.Mesh; light: THREE.PointLight }>();
const shadeGeo = new THREE.DodecahedronGeometry(0.8);
const shadeMat = new THREE.MeshStandardMaterial({
  color: 0x110522,
  roughness: 0.4,
  metalness: 0.8,
  emissive: 0x330066,
  emissiveIntensity: 0.5
});

// Pulse Wave Visual Effect
const pulseRingGeo = new THREE.RingGeometry(0.1, 0.3, 32);
const pulseRingMat = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide, transparent: true, opacity: 0 });
const pulseRing = new THREE.Mesh(pulseRingGeo, pulseRingMat);
pulseRing.rotation.x = -Math.PI / 2;
pulseRing.position.y = 0.05;
scene.add(pulseRing);
let pulseAnimProgress = 1.0;

// Input tracking for playable mode
const keys: Record<string, boolean> = {};
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
});
window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

// UI HUD references
const litCountEl = document.getElementById('lit-count')!;
const carriedCountEl = document.getElementById('carried-count')!;
const flamesCountEl = document.getElementById('flames-count')!;
const timeLeftEl = document.getElementById('time-left')!;
const scoreValEl = document.getElementById('score-val')!;
const overlayEl = document.getElementById('overlay')!;
const overlayTitleEl = document.getElementById('overlay-title')!;
const overlayMsgEl = document.getElementById('overlay-msg')!;
const btnRestart = document.getElementById('btn-restart')!;

btnRestart.addEventListener('click', () => {
  overlayEl.classList.add('hidden');
  sim = new GameSimulation(defaultTuning, Date.now() % 100000);
  sim.applyScenario({ random_motes: true, random_shades: true });
});

// Game Loop: 60 ticks/second simulation step synchronized with render
let accumulator = 0;
let lastTime = performance.now();
const stepDelta = 1000 / 60;

function animate(currentTime: number) {
  requestAnimationFrame(animate);

  const delta = Math.min(currentTime - lastTime, 100);
  lastTime = currentTime;
  accumulator += delta;

  while (accumulator >= stepDelta) {
    accumulator -= stepDelta;

    if (sim.state === 'playing') {
      // Gather inputs
      let mx = 0;
      let mz = 0;
      if (keys['KeyW'] || keys['ArrowUp']) mz += 1;
      if (keys['KeyS'] || keys['ArrowDown']) mz -= 1;
      if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) mx += 1;

      const interact = !!keys['KeyE'];
      const pulse = !!keys['Space'] || !!keys['KeyQ'];

      sim.currentInput.move = [mx, mz];
      sim.currentInput.cam_yaw_deg = 0;
      sim.currentInput.interact = interact;
      sim.currentInput.pulse = pulse;

      sim.step();

      // Check pulse event trigger for visual
      for (const ev of sim.tickEvents) {
        if (ev.name === 'pulse') {
          pulseAnimProgress = 0;
          pulseRing.position.set(sim.player.pos[0], 0.05, sim.player.pos[2]);
        }
      }
    }
  }

  // Update Visual Positions
  // 1. Player
  playerGroup.position.set(sim.player.pos[0], sim.player.pos[1], sim.player.pos[2]);

  // Flash player if invulnerable
  if (sim.player.invuln_ticks > 0) {
    playerGroup.visible = Math.floor(sim.tick / 4) % 2 === 0;
  } else {
    playerGroup.visible = true;
  }

  // Smooth third-person camera
  const targetCamPos = new THREE.Vector3(sim.player.pos[0], sim.player.pos[1] + 12, sim.player.pos[2] + 16);
  camera.position.lerp(targetCamPos, 0.08);
  camera.lookAt(sim.player.pos[0], sim.player.pos[1] + 1.2, sim.player.pos[2]);

  // 2. Lanterns
  for (const l of sim.lanterns) {
    const data = lanternMeshes.get(l.id);
    if (data) {
      if (l.lit) {
        (data.lamp.material as THREE.MeshStandardMaterial).emissive.setHex(0xffaa22);
        (data.lamp.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0;
        data.light.intensity = 2.5;
      } else {
        const ratio = l.deposited / defaultTuning.lantern_cost;
        (data.lamp.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2 + ratio * 0.4;
        data.light.intensity = ratio * 0.8;
      }
    }
  }

  // 3. Motes
  const currentMoteIds = new Set(sim.motes.map((m) => m.id));
  for (const [id, mesh] of moteMeshMap) {
    if (!currentMoteIds.has(id)) {
      scene.remove(mesh);
      moteMeshMap.delete(id);
    }
  }
  for (const m of sim.motes) {
    let mesh = moteMeshMap.get(m.id);
    if (!mesh) {
      mesh = new THREE.Mesh(moteGeo, moteMat);
      scene.add(mesh);
      moteMeshMap.set(m.id, mesh);
    }
    const bob = Math.sin(currentTime * 0.005 + m.pos[0]) * 0.2;
    mesh.position.set(m.pos[0], m.pos[1] + 0.5 + bob, m.pos[2]);
  }

  // 4. Shades
  const currentShadeIds = new Set(sim.shades.map((s) => s.id));
  for (const [id, item] of shadeMeshMap) {
    if (!currentShadeIds.has(id)) {
      scene.remove(item.mesh);
      scene.remove(item.light);
      shadeMeshMap.delete(id);
    }
  }
  for (const s of sim.shades) {
    let item = shadeMeshMap.get(s.id);
    if (!item) {
      const mesh = new THREE.Mesh(shadeGeo, shadeMat.clone());
      const sLight = new THREE.PointLight(0x8800ff, 0.8, 4);
      scene.add(mesh);
      scene.add(sLight);
      item = { mesh, light: sLight };
      shadeMeshMap.set(s.id, item);
    }

    item.mesh.position.set(s.pos[0], s.pos[1] + 0.8, s.pos[2]);
    item.light.position.set(s.pos[0], s.pos[1] + 1.2, s.pos[2]);
    item.mesh.rotation.y += 0.03;

    if (s.state === 'stunned') {
      (item.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xff00ff);
      (item.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0;
    } else {
      (item.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x330066);
      (item.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
    }
  }

  // 5. Pulse Ring Animation
  if (pulseAnimProgress < 1.0) {
    pulseAnimProgress += 0.04;
    const currentR = pulseAnimProgress * defaultTuning.pulse_radius;
    pulseRing.scale.set(currentR, currentR, 1);
    pulseRingMat.opacity = (1.0 - pulseAnimProgress) * 0.8;
  } else {
    pulseRingMat.opacity = 0;
  }

  // 6. Update HUD
  const litCount = sim.lanterns.filter((l) => l.lit).length;
  litCountEl.innerText = `${litCount}/5`;
  carriedCountEl.innerText = `${sim.player.carried}/5`;
  flamesCountEl.innerText = `${sim.player.flames}`;
  timeLeftEl.innerText = `${Math.ceil(sim.getTimeLeftSeconds())}s`;
  scoreValEl.innerText = `${sim.score}`;

  if (sim.state !== 'playing' && overlayEl.classList.contains('hidden')) {
    overlayEl.classList.remove('hidden');
    if (sim.state === 'won') {
      overlayTitleEl.innerText = 'Chiến Thắng!';
      overlayMsgEl.innerText = `Toàn bộ Đèn Lồng đã thắp sáng! Điểm của bạn: ${sim.score}`;
    } else {
      overlayTitleEl.innerText = 'Thất Bại!';
      overlayMsgEl.innerText = `Sương đen đã bao trùm hòn đảo. Điểm của bạn: ${sim.score}`;
    }
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
