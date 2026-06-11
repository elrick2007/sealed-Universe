// THE WEEPING WALLS — Sealed Universe: Game One
// Act 1 vertical slice. The house is the antagonist.
import * as THREE from 'three';
import { PSXRenderer } from './engine/renderer.js';
import { Controls } from './engine/controls.js';
import { Builder } from './world/builder.js';
import { buildManor } from './world/manor.js';
import { AudioEngine } from './audio/audio.js';
import { state } from './game/state.js';
import { hud } from './game/hud.js';
import { journal } from './game/journal.js';
import { recorder } from './game/recorder.js';
import { Act1 } from './game/act1.js';

const canvas = document.getElementById('view');
const psx = new PSXRenderer(canvas);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(68, innerWidth/innerHeight, 0.05, 90);
addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
});

const controls = new Controls(camera, canvas);
const B = new Builder(scene, controls);
const world = buildManor(B, scene);
const audio = new AudioEngine();
const act1 = new Act1(world, controls, audio, scene, B);

hud.init();
journal.init(world.rooms, audio);
recorder.init(audio);
recorder.onVoiceHeard = () => act1.onVoiceHeard();
journal.onPlayEVP = () => recorder.replayEVP();

controls.onStep = surface => audio.footstep(surface);

/* ---------- title wall texture (damp plaster) ---------- */
(function paintTitle(){
  const c = document.getElementById('titleWall');
  c.width = innerWidth; c.height = innerHeight;
  const x = c.getContext('2d');
  x.fillStyle = '#101012'; x.fillRect(0,0,c.width,c.height);
  for (let i = 0; i < 2200; i++){
    const g = 14 + Math.random()*30 | 0;
    x.fillStyle = `rgba(${g},${g},${g+3},0.5)`;
    x.fillRect(Math.random()*c.width, Math.random()*c.height, 2.5, 2.5);
  }
  // weeping streaks
  for (let i = 0; i < 26; i++){
    const sx = Math.random()*c.width;
    const grad = x.createLinearGradient(0, 0, 0, c.height);
    grad.addColorStop(0, 'rgba(40,44,48,0.5)');
    grad.addColorStop(1, 'rgba(8,8,10,0)');
    x.fillStyle = grad;
    x.fillRect(sx, Math.random()*c.height*0.3, 1.5 + Math.random()*3, c.height);
  }
})();

/* ---------- begin ---------- */
const titleEl = document.getElementById('title');
titleEl.querySelector('.start').addEventListener('click', () => {
  audio.start();
  audio.setInside(false);
  titleEl.classList.add('gone');
  state.phase = 'drive';
  hud.fade(false, 4);
  controls.enabled = true;
  controls.lock();
  // opening beat — the agent's car already leaving
  setTimeout(() => hud.caption('Price couldn’t hand the keys over fast enough. Held them out at arm’s length, like they were warm.', 6), 2500);
  setTimeout(() => hud.caption('Six months. A writing retreat, officially. Unofficially: nobody knows I’m here, and I intend to keep it that way.', 6.5), 9500);
  setTimeout(() => {
    hud.objective('Enter Ashford Manor');
    hud.gadget('KEYS ×3');
  }, 16000);
});

canvas.addEventListener('click', () => {
  if (controls.enabled && !journal.open && !recorder.open) controls.lock();
});

document.addEventListener('keydown', e => {
  if (state.phase === 'title') return;
  if (e.code === 'KeyE' && !journal.open && !recorder.open) act1.interact();
  if (e.code === 'KeyJ' && !recorder.open){
    const open = journal.toggle();
    if (open) document.exitPointerLock();
    else controls.lock();
  }
});

/* ---------- night-light state ---------- */
// Lights dim as evening falls (after the wall), go near-dark for the night
// sequence, then wash grey-blue for morning.
function lightingTick(){
  const L = world.lights;
  if (world.morning){
    scene.fog.color.setHex(0x3a4046); scene.background.setHex(0x3a4046);
    for (const k in L) L[k].intensity *= 0.985;          // lamps fade out in daylight
    L.kitchen.intensity = Math.max(L.kitchen.intensity, 5);
    scene.children.forEach(o => {
      if (o.isAmbientLight) o.intensity = Math.min(4.2, o.intensity + 0.006);
    });
    world.winLit.forEach(m => m.emissiveIntensity = 0.1);
  } else if (state.kitchenWallFelt){
    // evening deepens after the wall breathes
    scene.fog.color.setHex(0x0e1013); scene.background.setHex(0x0e1013);
    world.winLit.forEach(m => { m.emissive.setHex(0x6a5420); m.emissiveIntensity = 0.8; });
  }
  // kitchen fluorescent flicker
  if (!world.morning && Math.random() < 0.02){
    L.kitchen.intensity = 8 + Math.random()*8;
  }
}

/* ---------- main loop ---------- */
// debug/test handle
window.__game = { state, controls, act1, world };

const clock = new THREE.Clock();
function loop(){
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;

  controls.update(dt);
  for (const k in world.doors) world.doors[k].update(dt);
  act1.update(dt, t);
  recorder.update(dt);
  hud.drawWave(dt);
  lightingTick();

  psx.render(scene, camera, t);
}
loop();
