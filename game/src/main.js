// THE WEEPING WALLS — Sealed Universe: Game One
// Act 1 vertical slice. The house is the antagonist.
import * as THREE from 'three';
import { PSXRenderer } from './engine/renderer.js';
import { Controls } from './engine/controls.js';
import { Builder } from './world/builder.js';
import { buildManor } from './world/manor.js';
import { AudioEngine } from './audio/audio.js';
import { state, clearSave } from './game/state.js';
import { hud } from './game/hud.js';
import { journal } from './game/journal.js';
import { recorder } from './game/recorder.js';
import { Act1 } from './game/act1.js';
import { puzzles } from './game/puzzles.js';

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
puzzles.init(world, controls, audio);
recorder.onVoiceHeard = () => act1.onVoiceHeard();
journal.onPlayEVP = () => recorder.replayEVP();

controls.onStep = surface => audio.footstep(surface);

/* ---------- settings (persisted) ---------- */
const SETTINGS_KEY = 'tww_settings';
const settings = Object.assign({ vol: 1, sens: 1, qual: 'psx' }, (() => {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
  catch(e){ return {}; }
})());
function applySettings(){
  audio.setVolume(settings.vol);
  controls.sensitivity = settings.sens;
  psx.setQuality(settings.qual);
  document.getElementById('setVol').value = settings.vol * 100;
  document.getElementById('setSens').value = settings.sens * 100;
  document.getElementById('setQual').value = settings.qual;
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch(e){}
}
applySettings();
document.getElementById('setVol').addEventListener('input', e => {
  settings.vol = e.target.value / 100; applySettings();
});
document.getElementById('setSens').addEventListener('input', e => {
  settings.sens = e.target.value / 100; applySettings();
});
document.getElementById('setQual').addEventListener('change', e => {
  settings.qual = e.target.value; applySettings();
});

/* ---------- pause menu ---------- */
const pauseEl = document.getElementById('pause');
let pauseOpen = false;
function overlayBusy(){
  return journal.open || recorder.open || puzzles.open ||
    document.getElementById('endcard').style.display === 'flex' ||
    document.getElementById('endcard2').style.display === 'flex';
}
function showPause(){
  pauseOpen = true;
  pauseEl.style.display = 'block';
  audio.click();
}
function hidePause(){
  pauseOpen = false;
  pauseEl.style.display = 'none';
  controls.lock();
}
document.getElementById('resumeBtn').addEventListener('click', hidePause);
document.getElementById('resetSave').addEventListener('click', () => {
  clearSave();
  location.reload();
});
// losing pointer lock mid-game (Esc) opens the pause menu — unless a
// diegetic overlay (journal, recorder, puzzle, end card) took the pointer
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement) return;
  setTimeout(() => {
    if (!document.pointerLockElement && controls.enabled && !pauseOpen &&
        state.phase !== 'title' && state.phase !== 'sleeping' && !overlayBusy()){
      showPause();
    }
  }, 80);
});

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
  if (controls.enabled && !journal.open && !recorder.open && !puzzles.open && !pauseOpen)
    controls.lock();
});

document.addEventListener('keydown', e => {
  if (state.phase === 'title' || pauseOpen) return;
  if (e.code === 'KeyE' && !journal.open && !recorder.open && !puzzles.open) act1.interact();
  if (e.code === 'KeyJ' && !recorder.open && !puzzles.open){
    const open = journal.toggle();
    if (open) document.exitPointerLock();
    else controls.lock();
  }
});

/* ---------- night-light state + candle flicker ---------- */
// Every lamp wavers gently around its base intensity like a flame; the
// kitchen fluorescent stutters harder. Lights dim as evening falls (after
// the wall), go near-dark for the night sequence, then wash grey-blue
// for morning.
const flickerPhase = {};
{
  let i = 0;
  for (const k in world.lights) flickerPhase[k] = (i++) * 2.39;
}
function lightingTick(t){
  const L = world.lights;
  if (world.morning){
    scene.fog.color.setHex(0x3a4046); scene.background.setHex(0x3a4046);
    for (const k in L) L[k].userData.base *= 0.985;      // lamps fade out in daylight
    L.kitchen.userData.base = Math.max(L.kitchen.userData.base, 5);
    scene.children.forEach(o => {
      if (o.isAmbientLight) o.intensity = Math.min(4.2, o.intensity + 0.006);
    });
    world.winLit.forEach(m => m.emissiveIntensity = 0.1);
  } else if (state.kitchenWallFelt){
    // evening deepens after the wall breathes
    scene.fog.color.setHex(0x0e1013); scene.background.setHex(0x0e1013);
    world.winLit.forEach(m => { m.emissive.setHex(0x6a5420); m.emissiveIntensity = 0.8; });
  }
  for (const k in L){
    const ph = flickerPhase[k];
    // two incommensurate sines + a pinch of noise — flame, not strobe
    let fl = 1
      + 0.05 * Math.sin(t * 7.3 + ph) * Math.sin(t * 2.1 + ph * 3)
      + 0.02 * (Math.random() - 0.5);
    // the kitchen fluorescent stutters
    if (k === 'kitchen' && !world.morning && Math.random() < 0.02) fl = 0.45 + Math.random();
    L[k].intensity = L[k].userData.base * fl;
  }
}

/* ---------- dust motes — drifting in the lamp light ---------- */
const MOTES = 320;
const motePos = new Float32Array(MOTES * 3);
for (let i = 0; i < MOTES; i++){
  motePos[i*3]   = -12 + Math.random() * 24;
  motePos[i*3+1] = 0.2 + Math.random() * 5.6;
  motePos[i*3+2] = -9 + Math.random() * 19;
}
const moteGeo = new THREE.BufferGeometry();
moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
  color: 0xbfae88, size: 0.016, sizeAttenuation: true,
  transparent: true, opacity: 0.5, depthWrite: false,
  blending: THREE.AdditiveBlending,
}));
scene.add(motes);
function moteTick(dt, t){
  for (let i = 0; i < MOTES; i++){
    motePos[i*3]   += Math.sin(t * 0.4 + i) * dt * 0.012;
    motePos[i*3+1] -= dt * (0.014 + (i % 7) * 0.004);
    motePos[i*3+2] += Math.cos(t * 0.3 + i * 1.7) * dt * 0.01;
    if (motePos[i*3+1] < 0.1) motePos[i*3+1] = 5.8;
  }
  moteGeo.attributes.position.needsUpdate = true;
}

/* ---------- main loop ---------- */
// debug/test handle
window.__game = { state, controls, act1, world, puzzles, audio, psx };

const clock = new THREE.Clock();
function loop(){
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;

  if (!pauseOpen){
    controls.update(dt);
    for (const k in world.doors) world.doors[k].update(dt);
    act1.update(dt, t);
    puzzles.update(dt);
    recorder.update(dt);
  }
  hud.drawWave(dt);
  lightingTick(t);
  moteTick(dt, t);

  psx.render(scene, camera, t);
}
loop();
