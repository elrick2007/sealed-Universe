// First-person controller: pointer lock, WASD + arrow keys, circle-vs-AABB
// collision, floor-height regions (for the staircase) and a subtle head bob.
// Movement uses velocity smoothing and the mouse look is low-pass filtered,
// so both feel weighty rather than instant.
import * as THREE from 'three';

const EYE = 1.62;
const TURN_SPEED = 2.0;           // rad/s — arrow-key camera turn

export class Controls {
  constructor(camera, dom){
    this.camera = camera;
    this.dom = dom;
    this.yaw = 0; this.pitch = 0;
    this.pos = new THREE.Vector3(0, EYE, 24);
    this.vel = new THREE.Vector3();
    this.enabled = false;
    this.frozen = false;          // scripted moments
    this.radius = 0.32;
    this.sensitivity = 1.0;       // settings menu multiplier
    this.colliders = [];          // {minX,maxX,minZ,maxZ,minY,maxY}
    this.floorRegions = [];       // {minX,maxX,minZ,maxZ,y} or {..., ramp:{axis,from,to,y0,y1}}
    this.keys = {};
    this.bobT = 0;
    this.moving = false;
    this.surface = 'gravel';
    this.onStep = null;           // callback(surface)
    this._stepAcc = 0;
    this._mx = 0; this._my = 0;   // pending (filtered) mouse deltas

    document.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      // arrows shouldn't scroll the page
      if (e.code.startsWith('Arrow')) e.preventDefault();
    });
    document.addEventListener('keyup',   e => { this.keys[e.code] = false; });
    document.addEventListener('mousemove', e => {
      if (!this.locked || !this.enabled) return;
      this._mx += e.movementX;
      this._my += e.movementY;
    });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.dom;
    });
  }

  lock(){ this.dom.requestPointerLock(); }

  // Highest floor at (x,z) that is reachable from the player's current
  // height — floors more than a step above the feet (overhead slabs) are
  // ignored, so walking under the first floor doesn't teleport you onto it.
  floorYAt(x, z, feetY = this.pos.y - EYE){
    let y = 0;
    const reach = feetY + 0.55;
    for (const r of this.floorRegions){
      if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ){
        let ry;
        if (r.ramp){
          const t = THREE.MathUtils.clamp((z - r.ramp.from) / (r.ramp.to - r.ramp.from), 0, 1);
          ry = THREE.MathUtils.lerp(r.ramp.y0, r.ramp.y1, t);
        } else {
          ry = r.y;
        }
        if (ry <= reach) y = Math.max(y, ry);
      }
    }
    return y;
  }

  update(dt){
    if (!this.enabled || this.frozen){
      this._mx = 0; this._my = 0;
      this._applyCamera(0);
      return;
    }

    // filtered mouse look — a fraction of the pending delta is consumed each
    // frame, smoothing out sensor jitter without adding noticeable lag
    const lk = Math.min(1, dt * 28);
    const ax = this._mx * lk, ay = this._my * lk;
    this._mx -= ax; this._my -= ay;
    this.yaw   -= ax * 0.0022 * this.sensitivity;
    this.pitch -= ay * 0.0022 * this.sensitivity;

    // arrow-key turning (keyboard-only play)
    if (this.keys['ArrowLeft'])  this.yaw += TURN_SPEED * dt;
    if (this.keys['ArrowRight']) this.yaw -= TURN_SPEED * dt;
    this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));

    const f = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const r = new THREE.Vector3(-f.z, 0, f.x);
    const move = new THREE.Vector3();
    if (this.keys['KeyW'] || this.keys['ArrowUp'])   move.add(f);
    if (this.keys['KeyS'] || this.keys['ArrowDown']) move.sub(f);
    if (this.keys['KeyD']) move.add(r);
    if (this.keys['KeyA']) move.sub(r);
    const fast = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    const speed = fast ? 3.1 : 1.9;
    const wants = move.lengthSq() > 0;
    if (wants) move.normalize().multiplyScalar(speed);

    // velocity smoothing — accelerate toward the target, brake a bit faster
    const accel = Math.min(1, dt * (wants ? 9 : 13));
    this.vel.x += (move.x - this.vel.x) * accel;
    this.vel.z += (move.z - this.vel.z) * accel;
    const sp = Math.hypot(this.vel.x, this.vel.z);
    this.moving = sp > 0.25;

    const floorBefore = this.floorYAt(this.pos.x, this.pos.z);

    // resolve X then Z separately for sliding
    this._tryMove(this.vel.x * dt, 0, floorBefore);
    this._tryMove(0, this.vel.z * dt, floorBefore);

    // settle onto floor
    const fy = this.floorYAt(this.pos.x, this.pos.z);
    this.pos.y += (fy + EYE - this.pos.y) * Math.min(1, dt * 12);

    // head bob + footsteps — cadence follows actual speed, so starting and
    // stopping ease in and out instead of snapping
    if (this.moving){
      this.bobT += dt * (3.4 + sp * 1.95);
      this._stepAcc += dt * (0.75 + sp * 0.53);
      if (this._stepAcc >= 1){
        this._stepAcc = 0;
        if (this.onStep) this.onStep(this.surface);
      }
    } else {
      this.bobT *= 0.9; this._stepAcc = 0.7;
    }
    const bobAmp = Math.min(0.028, sp * 0.012);
    this._applyCamera(this.moving ? Math.sin(this.bobT) * bobAmp : 0);
  }

  _tryMove(dx, dz, floorY){
    if (!dx && !dz) return;
    let nx = this.pos.x + dx, nz = this.pos.z + dz;
    const feet = floorY + 0.1, head = floorY + 1.8;
    for (const c of this.colliders){
      if (head < c.minY || feet > c.maxY) continue;
      // circle vs AABB
      const cx = Math.max(c.minX, Math.min(nx, c.maxX));
      const cz = Math.max(c.minZ, Math.min(nz, c.maxZ));
      const ddx = nx - cx, ddz = nz - cz;
      const d2 = ddx*ddx + ddz*ddz;
      if (d2 < this.radius * this.radius){
        const d = Math.sqrt(d2) || 0.0001;
        const push = (this.radius - d);
        nx += (ddx / d) * push;
        nz += (ddz / d) * push;
      }
    }
    this.pos.x = nx; this.pos.z = nz;
  }

  _applyCamera(bob){
    this.camera.position.set(this.pos.x, this.pos.y + bob, this.pos.z);
    this.camera.rotation.set(0,0,0);
    this.camera.rotateY(this.yaw);
    this.camera.rotateX(this.pitch);
  }

  // smoothly aim the camera at a world point (scripted beats)
  lookAtPoint(p, dt, strength = 3){
    const dx = p.x - this.pos.x, dz = p.z - this.pos.z;
    const ty = Math.atan2(-dx, -dz);
    const dist = Math.hypot(dx, dz);
    const tp = Math.atan2(p.y - this.pos.y, dist);
    this.yaw   += (ty - this.yaw)   * Math.min(1, dt * strength);
    this.pitch += (tp - this.pitch) * Math.min(1, dt * strength);
  }
}
