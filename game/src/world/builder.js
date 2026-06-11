// Geometry helpers: axis-aligned walls with door/window holes, floors,
// ceilings, furniture boxes — all registering colliders with the controller.
import * as THREE from 'three';
import { psxMaterial } from '../engine/renderer.js';

export class Builder {
  constructor(scene, controls){
    this.scene = scene;
    this.controls = controls;
    this.materials = new Map();
  }

  mat(texture, opts = {}){
    const key = texture.uuid + JSON.stringify(opts);
    if (this.materials.has(key)) return this.materials.get(key);
    const m = psxMaterial(new THREE.MeshLambertMaterial({
      map: texture, ...opts,
    }));
    this.materials.set(key, m);
    return m;
  }

  collider(minX, maxX, minY, maxY, minZ, maxZ){
    this.controls.colliders.push({ minX, maxX, minY, maxY, minZ, maxZ });
  }

  box(material, w, h, d, x, y, z, { collide = true, name } = {}){
    const g = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(g, material);
    m.position.set(x, y, z);
    if (name) m.name = name;
    this.scene.add(m);
    if (collide) this.collider(x - w/2, x + w/2, y - h/2, y + h/2, z - d/2, z + d/2);
    return m;
  }

  floor(x1, z1, x2, z2, y, material){
    const w = x2 - x1, d = z2 - z1;
    const g = new THREE.PlaneGeometry(w, d);
    const m = new THREE.Mesh(g, material);
    m.rotation.x = -Math.PI/2;
    m.position.set((x1+x2)/2, y, (z1+z2)/2);
    this.scene.add(m);
    this.controls.floorRegions.push({ minX:x1, maxX:x2, minZ:z1, maxZ:z2, y });
    return m;
  }

  ceiling(x1, z1, x2, z2, y, material){
    const g = new THREE.PlaneGeometry(x2-x1, z2-z1);
    const m = new THREE.Mesh(g, material);
    m.rotation.x = Math.PI/2;
    m.position.set((x1+x2)/2, y, (z1+z2)/2);
    this.scene.add(m);
    return m;
  }

  // Wall along X (constant Z) or along Z (constant X); holes: [{at, w, h, bottom}]
  // `at` measured along the wall from its start. Returns group.
  wall(x1, z1, x2, z2, y0, h, material, holes = [], thickness = 0.16){
    const alongX = Math.abs(x2-x1) > Math.abs(z2-z1);
    const len = alongX ? (x2-x1) : (z2-z1);
    const dir = Math.sign(len) || 1;
    const L = Math.abs(len);
    const group = new THREE.Group();
    this.scene.add(group);

    // build solid spans between holes (full height), and lintel/sill over holes
    const spans = [];
    let cursor = 0;
    const hs = [...holes].sort((a,b) => a.at - b.at);
    for (const hole of hs){
      const s = hole.at - hole.w/2;
      if (s > cursor) spans.push({ a: cursor, b: s, y: y0, h });
      const top = (hole.bottom ?? 0) + hole.h;
      if (top < h) spans.push({ a: s, b: s + hole.w, y: y0 + top, h: h - top });        // lintel
      if ((hole.bottom ?? 0) > 0) spans.push({ a: s, b: s + hole.w, y: y0, h: hole.bottom }); // sill
      cursor = s + hole.w;
    }
    if (cursor < L) spans.push({ a: cursor, b: L, y: y0, h });

    for (const sp of spans){
      const sl = sp.b - sp.a;
      if (sl <= 0.01) continue;
      const cx = alongX ? x1 + dir*(sp.a + sl/2) : x1;
      const cz = alongX ? z1 : z1 + dir*(sp.a + sl/2);
      const w = alongX ? sl : thickness;
      const d = alongX ? thickness : sl;
      const g = new THREE.BoxGeometry(w, sp.h, d);
      const mesh = new THREE.Mesh(g, material);
      mesh.position.set(cx, sp.y + sp.h/2, cz);
      group.add(mesh);
      // only solid floor-level spans get colliders (lintels don't block)
      if (sp.y <= y0 + 0.01){
        this.collider(cx - w/2, cx + w/2, sp.y, sp.y + sp.h, cz - d/2, cz + d/2);
      }
    }
    return group;
  }

  // hinged door; returns object with open()/close()
  door(x, z, alongX, material, { locked = false, w = 1.0, h = 2.08, name } = {}){
    const group = new THREE.Group();
    const panel = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.07), material);
    panel.position.set(w/2, h/2, 0);
    // knob
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5),
      new THREE.MeshLambertMaterial({ color: 0x6e5a22 }));
    knob.position.set(w - 0.12, 1.02, 0.06);
    panel.add(knob);
    group.add(panel);
    const base = alongX ? 0 : -Math.PI/2;
    group.position.set(alongX ? x - w/2 : x, 0, alongX ? z : z - w/2);
    group.rotation.y = base;
    if (name) group.name = name;
    this.scene.add(group);

    const colliderRef = { minX: x - (alongX ? w/2 : 0.1), maxX: x + (alongX ? w/2 : 0.1),
      minY: 0, maxY: h, minZ: z - (alongX ? 0.1 : w/2), maxZ: z + (alongX ? 0.1 : w/2) };
    this.controls.colliders.push(colliderRef);

    const door = {
      group, locked, isOpen: false, targetRot: 0,
      open(){
        this.isOpen = true; this.targetRot = -Math.PI/2 * 0.94;
        colliderRef.maxY = -1; // disable
      },
      close(){
        this.isOpen = false; this.targetRot = 0;
        colliderRef.maxY = h;
      },
      update(dt){
        group.rotation.y += (base + this.targetRot - group.rotation.y) * Math.min(1, dt*2.2);
      },
    };
    return door;
  }

  // textured flat picture/decal on a wall
  decal(texture, w, h, x, y, z, facing){
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      psxMaterial(new THREE.MeshLambertMaterial({ map: texture })));
    m.position.set(x, y, z);
    m.rotation.y = facing;
    this.scene.add(m);
    return m;
  }

  light(x, y, z, color = 0xffd9a0, intensity = 1, distance = 9){
    const l = new THREE.PointLight(color, intensity, distance, 1.6);
    l.position.set(x, y, z);
    this.scene.add(l);
    return l;
  }
}
