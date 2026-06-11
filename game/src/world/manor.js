// Ashford Manor — Act 1 spaces, built from the bible's location guide.
// Ground floor: entrance hall, library, sitting room, drawing room, dining
// room, back corridor, kitchen, breakfast room, west wing door (locked).
// First floor: gallery, Mara's bedroom, bathroom, two locked rooms.
// Exterior: gravel drive, facade with thirteen windows, overgrown garden.
import * as THREE from 'three';
import { makeAll } from './textures.js';
import { psxMaterial } from '../engine/renderer.js';

const H = 3.0;        // ground floor ceiling
const F2 = 3.2;       // first floor slab height
const H2 = 2.8;       // first floor ceiling

export function buildManor(B, scene){
  const T = makeAll();
  const M = {
    flag: B.mat(T.flagstone), wood: B.mat(T.woodFloor),
    woodDark: B.mat(T.woodFloorDark), panel: B.mat(T.panelling),
    fern: B.mat(T.fernWallpaper), rose: B.mat(T.roseWallpaper),
    plaster: B.mat(T.plaster), plasterD: B.mat(T.plasterDark),
    stone: B.mat(T.limestone), slate: B.mat(T.slate),
    shelf: B.mat(T.bookshelf), curtain: B.mat(T.curtain),
    win: B.mat(T.windowPane, { emissive: 0x3a4452, emissiveIntensity: 0.55 }),
    linen: B.mat(T.linen),
    dark: psxMaterial(new THREE.MeshLambertMaterial({ color: 0x171310 })),
    black: psxMaterial(new THREE.MeshBasicMaterial({ color: 0x050505 })),
    brass: psxMaterial(new THREE.MeshLambertMaterial({ color: 0x6e5a22 })),
    paper: psxMaterial(new THREE.MeshLambertMaterial({ color: 0xcfc6aa })),
    redLED: psxMaterial(new THREE.MeshBasicMaterial({ color: 0xff2211 })),
  };

  const world = { T, M, doors: {}, lights: {}, props: {}, breathingWalls: [] };

  /* ============ EXTERIOR ============ */
  scene.fog = new THREE.FogExp2(0x14161a, 0.034);
  scene.background = new THREE.Color(0x14161a);

  B.floor(-60, -60, 60, 60, -0.02, B.mat(T.gravel));            // ground plane
  // darker garden masses (hedges gone wild)
  const hedge = psxMaterial(new THREE.MeshLambertMaterial({ color: 0x131a12 }));
  [[-18, 18, 8, 26],[18, 16, 9, 22],[-26, -2, 7, 30],[24, -4, 8, 26],[0, 38, 10, 40]]
    .forEach(([hx, hz, hw, hd]) => B.box(hedge, hw, 2.4 + (hx%3), hd, hx, 1.2, hz));

  // the conservatory remains — always visible, never entered (east garden)
  const glassMat = psxMaterial(new THREE.MeshLambertMaterial({
    color: 0x36423e, transparent: true, opacity: 0.5 }));
  const cons = new THREE.Group();
  const consFrame = psxMaterial(new THREE.MeshLambertMaterial({ color: 0x2a2d28 }));
  for (let i = 0; i < 5; i++){
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.2 - i*0.2), glassMat);
    p.position.set(i*1.7 - 3.4, 1.0, (i%2)*0.4);
    p.rotation.y = (i%2) ? 0.3 : -0.15; p.rotation.z = (i===2) ? 0.5 : 0;
    cons.add(p);
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.4, 0.08), consFrame);
    f.position.set(i*1.7 - 3.4, 1.1, 0.2); f.rotation.z = (i===3) ? 0.6 : 0.05*i;
    cons.add(f);
  }
  cons.position.set(20, 0, -16); cons.rotation.y = -0.5;
  scene.add(cons);
  B.collider(16, 24, 0, 3, -19, -13);

  /* ---------- facade shell ---------- */
  // house exterior box: x[-12.6..12.6] z[-9.6..10.6], 3 storeys implied (2 real + attic mass)
  const shellH = 9.4;
  B.wall(-12.6, 10.6, 12.6, 10.6, 0, shellH, M.stone,
    [{ at: 12.6, w: 1.3, h: 2.5 }]);                               // front, door hole
  B.wall(-12.6, -9.6, 12.6, -9.6, 0, shellH, M.stone);             // back
  // west shell wall — pierced where the west wing corridor passes through
  B.wall(-12.6, -9.6, -12.6, 10.6, 0, shellH, M.stone, [{ at: 8.1, w: 3.0, h: 3.0 }]);
  B.wall(12.6, -9.6, 12.6, 10.6, 0, shellH, M.stone);              // east
  // roof mass
  B.box(M.dark, 26, 1.4, 21.4, 0, shellH + 0.7, 0.5, { collide: false });

  // THIRTEEN windows on the front face — deliberate asymmetry (PROMPT 001)
  const winSpots = [
    [-9.8, 1.6], [-6.4, 1.6], [-2.0, 1.6], [4.6, 1.6], [8.8, 1.6],
    [-10.2, 4.6], [-5.0, 4.6], [-0.6, 4.6], [3.4, 4.6], [7.0, 4.6], [10.4, 4.6],
    [-3.4, 7.4], [6.2, 7.4],
  ];
  const winLit = []; // a few will glow at night
  winSpots.forEach(([wx, wy], i) => {
    const lit = (i === 7 || i === 12);   // two windows glow amber — like eyes
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.5),
      psxMaterial(new THREE.MeshLambertMaterial({
        map: T.windowPane,
        emissive: lit ? 0x6a5420 : 0x2a3442,
        emissiveIntensity: lit ? 0.9 : 0.55 })));
    w.position.set(wx, wy + 0.75, 10.695);
    scene.add(w);
    if (lit) winLit.push(w.material);
  });
  world.winLit = winLit;

  // ivy on east wall — thick enough to look structural
  const ivy = psxMaterial(new THREE.MeshLambertMaterial({ color: 0x182414 }));
  for (let i = 0; i < 8; i++){
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2 + (i%3), 3 + (i%4)), ivy);
    p.position.set(12.68, 1.5 + (i*0.9) % 6, -6 + i * 2.1);
    p.rotation.y = -Math.PI/2;
    scene.add(p);
  }

  // front door (exterior face)
  world.doors.front = B.door(0, 10.55, true, M.panel, { locked: true, name: 'frontDoor' });

  // distant iron gate marker
  const gate = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.6),
    psxMaterial(new THREE.MeshLambertMaterial({ color: 0x0a0b0c })));
  gate.position.set(0, 1.3, 34); gate.rotation.y = Math.PI;
  scene.add(gate);

  /* ============ GROUND FLOOR ============ */

  // ---- entrance hall x[-3..3] z[0..10] ----
  B.floor(-3, 0, 3, 10, 0.001, M.flag);
  B.ceiling(-3, 0, 3, 10, H, M.plasterD);
  // hall walls: panelling below (built as low strip) + fern paper above
  const hallWall = (x1,z1,x2,z2,holes) => {
    B.wall(x1, z1, x2, z2, 0, 1.5, M.panel, holes.filter(h => (h.bottom ?? 0) < 1.5));
    B.wall(x1, z1, x2, z2, 1.5, H - 1.5, M.fern,
      holes.map(h => ({ ...h, bottom: Math.max(0,(h.bottom ?? 0)-1.5), h: h.h - Math.max(0, 1.5-(h.bottom ?? 0)) }))
        .filter(h => h.h > 0));
  };
  // front wall (z=10) with door
  hallWall(-3, 10, 3, 10, [{ at: 3, w: 1.3, h: 2.5 }]);
  // west wall (x=-3): doors to library (z 7.5) & sitting (z 2.5)
  hallWall(-3, 0, -3, 10, [{ at: 7.5, w: 1.1, h: 2.1 }, { at: 2.5, w: 1.1, h: 2.1 }]);
  // east wall (x=3): doors to drawing (7.5) & dining (2.5); stairs hug this wall above
  hallWall(3, 0, 3, 10, [{ at: 7.5, w: 1.1, h: 2.1 }, { at: 2.5, w: 1.1, h: 2.1 }]);
  // north wall (z=0): opening to back corridor
  hallWall(-3, 0, 3, 0, [{ at: 1.6, w: 1.4, h: 2.2 }]);

  // three framed pictures: two landscapes, one portrait — Eleanor
  B.decal(T.landscape0, 1.0, 1.0, -2.91, 1.9, 5.6, Math.PI/2);
  B.decal(T.landscape1, 1.0, 1.0, -2.91, 1.9, 4.2, Math.PI/2);
  world.props.portraitEleanor =
    B.decal(T.portraitEleanor, 1.1, 1.45, -1.2, 1.95, 9.91, Math.PI);

  // hall table + clock
  B.box(M.woodDark, 1.4, 0.85, 0.5, -2.4, 0.43, 8.2);
  const clock = B.box(M.woodDark, 0.5, 2.2, 0.34, 2.55, 1.1, 9.6);
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.16, 10), M.paper);
  clockFace.position.set(0, 0.75, 0.18); clock.add(clockFace);
  world.props.clock = clock;

  /* ---- staircase along east wall of hall ---- */
  // flight from z=8 (bottom) to z=2.4 (top), x in [1.55..2.95]
  const STEPS = 14, stepD = (8 - 2.4) / STEPS, rise = F2 / STEPS;
  for (let i = 0; i < STEPS; i++){
    const z = 8 - stepD * (i + 0.5);
    B.box(M.woodDark, 1.4, rise, stepD + 0.02, 2.25, rise * (i + 0.5), z, { collide: false });
  }
  // walkable ramp region (the controller's floor)
  B.controls.floorRegions.push({
    minX: 1.55, maxX: 2.95, minZ: 2.4, maxZ: 8,
    ramp: { from: 8, to: 2.4, y0: 0, y1: F2 },
  });
  // banister
  B.box(M.woodDark, 0.08, 0.9, 5.8, 1.55, F2/2 + 0.4, 5.2, { collide: false });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 6.2), M.woodDark);
  rail.position.set(1.55, F2/2 + 1.0, 5.2); rail.rotation.x = Math.atan2(F2, 5.6);
  scene.add(rail);
  // invisible rail collider so the player can't fall off the open side
  B.collider(1.45, 1.62, 0, F2 + 1.2, 2.4, 8);
  world.stair7 = { minX: 1.55, maxX: 2.95, minZ: 8 - stepD*7, maxZ: 8 - stepD*6 }; // the 7th step

  // ---- library x[-12..-3] z[5..10] ----
  B.floor(-12, 5, -3, 10, 0.001, M.wood);
  B.ceiling(-12, 5, -3, 10, H, M.plasterD);
  B.wall(-12, 10, -3, 10, 0, H, M.panel, [{ at: 4.5, w: 1.6, h: 1.7, bottom: 0.9 }]); // window
  B.wall(-12, 5, -3, 5, 0, H, M.panel);
  B.wall(-12, 5, -12, 10, 0, H, M.panel);
  // empty shelving on three walls
  B.box(M.shelf, 0.36, 2.6, 4.6, -11.7, 1.3, 7.5);
  B.box(M.shelf, 3.2, 2.6, 0.36, -9.4, 1.3, 5.25);
  B.box(M.shelf, 3.0, 2.6, 0.36, -5.0, 1.3, 9.75);
  // one shelf section pulled from the wall — roses-and-thorns behind it
  const pulled = B.box(M.shelf, 0.36, 2.6, 1.6, -10.9, 1.3, 9.45);
  pulled.rotation.y = 0.35;
  B.decal(T.roseWallpaper, 1.6, 2.4, -11.65, 1.4, 9.3, Math.PI/2);
  world.props.pulledShelf = pulled;
  // fireplace large enough to stand in
  B.box(M.stone, 2.2, 2.4, 0.5, -7.5, 1.2, 5.3);
  const hearthHole = B.box(M.black, 1.4, 1.6, 0.2, -7.5, 0.8, 5.52, { collide: false });
  world.props.libraryFireplace = hearthHole;
  // window decal + curtains
  B.decal(T.windowPane, 1.5, 1.6, -7.5, 1.75, 9.9, Math.PI);
  B.box(M.curtain, 0.5, 2.2, 0.1, -8.5, 1.5, 9.82, { collide: false });
  B.box(M.curtain, 0.5, 2.2, 0.1, -6.5, 1.5, 9.82, { collide: false });
  // reading chair
  B.box(M.dark, 0.8, 1.1, 0.8, -6.2, 0.55, 6.6);

  // ---- sitting room x[-12..-3] z[0..5] ----
  B.floor(-12, 0, -3, 5, 0.001, M.wood);
  B.ceiling(-12, 0, -3, 5, H, M.plasterD);
  B.wall(-12, 0, -3, 0, 0, H, M.fern);
  B.wall(-12, 0, -12, 5, 0, H, M.fern, [{ at: 2.5, w: 1.5, h: 1.6, bottom: 0.95 }]);
  B.decal(T.windowPane, 1.4, 1.5, -11.9, 1.75, 2.5, Math.PI/2);
  // two armchairs facing a cold fireplace
  B.box(M.stone, 1.8, 2.0, 0.45, -7.5, 1.0, 0.25);
  B.box(M.black, 1.1, 1.2, 0.2, -7.5, 0.6, 0.42, { collide: false });
  B.box(M.dark, 0.85, 1.0, 0.85, -8.6, 0.5, 1.8);
  B.box(M.dark, 0.85, 1.0, 0.85, -6.4, 0.5, 1.8);
  // side table with chess set mid-game
  const chessTable = B.box(M.woodDark, 0.6, 0.62, 0.6, -7.5, 0.31, 1.9);
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.4),
    psxMaterial(new THREE.MeshLambertMaterial({ color: 0x9a8d6a })));
  board.position.y = 0.33; chessTable.add(board);
  for (let i = 0; i < 9; i++){
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, 0.07, 5),
      (i % 2) ? M.paper : M.black);
    p.position.set((i%3)*0.1 - 0.1, 0.38, ((i/3)|0)*0.1 - 0.1);
    chessTable.add(p);
  }
  world.props.chess = chessTable;
  // Whitmore's medical text + the Auscultator case (act 2 tease)
  const medText = B.box(M.paper, 0.3, 0.06, 0.22, -8.6, 1.03, 1.85, { collide: false });
  world.props.medicalText = medText;

  // ---- drawing room x[3..12] z[5..10] ----
  B.floor(3, 5, 12, 10, 0.001, M.wood);
  B.ceiling(3, 5, 12, 10, H, M.plasterD);
  B.wall(3, 10, 12, 10, 0, H, M.fern, [{ at: 4.5, w: 1.6, h: 1.7, bottom: 0.9 }]);
  B.wall(3, 5, 12, 5, 0, H, M.fern);
  B.wall(12, 5, 12, 10, 0, H, M.fern, [{ at: 2.5, w: 1.5, h: 1.6, bottom: 0.95 }]);
  B.decal(T.windowPane, 1.5, 1.6, 7.5, 1.75, 9.9, Math.PI);
  B.decal(T.windowPane, 1.4, 1.5, 11.9, 1.75, 7.5, -Math.PI/2);
  // grand piano against far wall, lid open, stool pulled back
  const piano = new THREE.Group();
  const pBody = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 2.2), M.black);
  pBody.position.y = 0.85; piano.add(pBody);
  const pLid = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.05, 2.1), M.black);
  pLid.position.set(0, 1.18, -0.3); pLid.rotation.x = -0.5; piano.add(pLid);
  [[-0.6,-0.9],[0.6,-0.9],[-0.6,0.9],[0.6,0.9]].forEach(([lx,lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), M.black);
    leg.position.set(lx, 0.3, lz); piano.add(leg);
  });
  const keys = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.3), M.paper);
  keys.position.set(0, 0.92, 1.18); piano.add(keys);
  const music = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3),
    psxMaterial(new THREE.MeshLambertMaterial({ map: T.sheetMusic })));
  music.position.set(0, 1.3, 1.1); music.rotation.x = -0.3; piano.add(music);
  piano.position.set(10.4, 0, 7.5); piano.rotation.y = -Math.PI/2;
  scene.add(piano);
  B.collider(9.2, 11.6, 0, 1.4, 6.7, 8.3);
  world.props.piano = piano;
  // stool pulled back, as if someone just stood
  B.box(M.black, 0.4, 0.55, 0.4, 8.9, 0.28, 7.1);
  // chaise longue
  B.box(M.dark, 1.9, 0.6, 0.7, 5.5, 0.3, 5.6);

  // ---- dining room x[3..12] z[0..5] ----
  B.floor(3, 0, 12, 5, 0.001, M.wood);
  B.ceiling(3, 0, 12, 5, H, M.plasterD);
  B.wall(3, 0, 12, 0, 0, H, M.fern);
  B.wall(12, 0, 12, 5, 0, H, M.fern);
  // table for twelve — only one place used
  B.box(M.woodDark, 4.4, 0.78, 1.5, 7.5, 0.39, 2.5);
  for (let i = 0; i < 12; i++){
    const cx = 5.6 + (i % 6) * 0.76, cz = i < 6 ? 1.5 : 3.5;
    B.box(M.dark, 0.42, 0.92, 0.42, cx, 0.46, cz, { collide: false });
  }
  // eleven dusty places + one used (Mara's end)
  const place = new THREE.Mesh(new THREE.CircleGeometry(0.14, 8), M.paper);
  place.rotation.x = -Math.PI/2; place.position.set(5.5, 0.79, 2.5);
  scene.add(place);
  // mirror at the far end
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.7),
    psxMaterial(new THREE.MeshLambertMaterial({
      color: 0x202a30, emissive: 0x10161c, emissiveIntensity: 0.7 })));
  mirror.position.set(11.9, 1.7, 2.5); mirror.rotation.y = -Math.PI/2;
  scene.add(mirror);
  world.props.mirror = mirror;
  // sideboard
  B.box(M.woodDark, 0.5, 1.0, 2.2, 11.6, 0.5, 4.0);

  // ---- back corridor x[-12..3] z[-3..0] ----
  B.floor(-12, -3, 3, 0, 0.001, M.woodDark);
  B.ceiling(-12, -3, 3, 0, H, M.plasterD);
  // south side (z=0): shared with sitting room / hall opening handled above;
  // segment west of hall:
  B.wall(-12, 0, -3, 0, 0, H, M.fern, [{ at: 4.5, w: 0.0001, h: 0.0001 }]);
  // north wall (z=-3): doors to kitchen and breakfast room
  B.wall(-12, -3, 3, -3, 0, H, M.fern,
    [{ at: 4, w: 1.1, h: 2.1 }, { at: 12.5, w: 1.1, h: 2.1 }]);
  // WEST WING DOOR — west end (x=-12). Hinges on corridor side. Wrong.
  B.wall(-12, -3, -12, 0, 0, H, M.panel, [{ at: 1.5, w: 1.15, h: 2.15 }]);
  world.doors.westWing = B.door(-12, -1.5, false, M.panel, { locked: true, w: 1.1, h: 2.12, name: 'westWing' });

  /* ---- west wing corridor x[-19..-12] z[-3..0] — behind the locked door.
     The bible says the corridor is fourteen feet too long. It is. ---- */
  B.floor(-19, -3, -12, 0, 0.001, M.woodDark);
  B.ceiling(-19, -3, -12, 0, 2.6, M.plasterD);                     // lower than everywhere else
  B.wall(-19, 0, -12, 0, 0, 2.6, M.rose);                          // the older paper, both sides
  B.wall(-19, -3, -12, -3, 0, 2.6, M.rose);
  B.wall(-19, -3, -19, 0, 0, 2.6, M.plasterD);                     // end wall
  // the second breathing wall — at the far end, waiting
  const breathWall2 = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 2.6),
    psxMaterial(new THREE.MeshLambertMaterial({ map: T.plaster })));
  breathWall2.position.set(-18.9, 1.3, -1.5); breathWall2.rotation.y = Math.PI/2;
  scene.add(breathWall2);
  world.breathingWalls.push(breathWall2);
  world.props.breathWall2 = breathWall2;
  // a door painted onto the end wall — frame, panels, no hinges, no handle
  B.decal(T.panelling, 1.1, 2.1, -18.85, 1.05, -1.5, Math.PI/2);
  // the dress form, facing the false door (Act 2 tease)
  const dressForm = new THREE.Group();
  const dfBody = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 0.85, 7), M.linen);
  dfBody.position.y = 1.05; dressForm.add(dfBody);
  const dfNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.18, 5), M.woodDark);
  dfNeck.position.y = 1.56; dressForm.add(dfNeck);
  const dfPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65, 5), M.woodDark);
  dfPole.position.y = 0.32; dressForm.add(dfPole);
  dressForm.position.set(-17.9, 0, -0.6);
  scene.add(dressForm);
  B.collider(-18.2, -17.6, 0, 1.7, -0.9, -0.3);
  world.props.dressForm = dressForm;

  /* ---- west wing exterior mass — the hulking dark wing seen from the drive ---- */
  B.wall(-20, 2, -12.6, 2, 0, 7, M.stone);
  B.wall(-20, -5, -12.6, -5, 0, 7, M.stone);
  B.wall(-20, -5, -20, 2, 0, 7, M.stone);
  B.box(M.dark, 8.2, 1.2, 7.8, -16.3, 7.4, -1.5, { collide: false });

  // ---- kitchen x[-12..-4] z[-9..-3] ----
  B.floor(-12, -9, -4, -3, 0.001, M.flag);
  B.ceiling(-12, -9, -4, -3, H, M.plaster);
  B.wall(-12, -9, -4, -9, 0, H, M.plaster, [{ at: 4, w: 1.4, h: 1.5, bottom: 1.0 }]);
  B.wall(-12, -9, -12, -3, 0, H, M.plaster);
  B.wall(-4, -9, -4, -3, 0, H, M.plaster);
  B.decal(T.windowPane, 1.3, 1.4, -8, 1.75, -8.9, 0);
  // slate counter run along west wall
  B.box(M.slate, 0.65, 0.92, 4.6, -11.6, 0.46, -6);
  // THE BREATHING WALL — kitchen west wall, behind the counter
  const breathWall = new THREE.Mesh(new THREE.PlaneGeometry(5.8, H),
    psxMaterial(new THREE.MeshLambertMaterial({ map: T.plaster })));
  breathWall.position.set(-11.9, H/2, -6); breathWall.rotation.y = Math.PI/2;
  scene.add(breathWall);
  world.breathingWalls.push(breathWall);
  world.props.breathWall = breathWall;
  // kettle + cracked mug on counter
  B.box(M.dark, 0.18, 0.2, 0.18, -11.5, 1.02, -7.4, { collide: false });
  B.box(M.paper, 0.09, 0.1, 0.09, -11.5, 0.97, -6.6, { collide: false });
  // Mara's kitchen table — her workspace for the entire game
  const table = B.box(M.wood, 1.8, 0.78, 1.0, -7.5, 0.39, -6);
  world.props.kitchenTable = table;
  // laptop
  const laptop = new THREE.Group();
  const lBase = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.24), M.dark);
  const lScreen = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.015),
    psxMaterial(new THREE.MeshLambertMaterial({ color: 0x10141c, emissive: 0x1c2836, emissiveIntensity: 0.8 })));
  lScreen.position.set(0, 0.12, -0.12); lScreen.rotation.x = -0.25;
  laptop.add(lBase, lScreen);
  laptop.position.set(-7.7, 0.79, -6.1); laptop.rotation.y = 0.4;
  scene.add(laptop);
  world.props.laptop = laptop;
  // equipment cases (open flight cases)
  B.box(M.dark, 0.8, 0.35, 0.5, -6.4, 0.175, -8.2);
  B.box(M.dark, 0.6, 0.3, 0.45, -5.6, 0.15, -8.1);
  // chairs
  B.box(M.dark, 0.42, 0.9, 0.42, -7.5, 0.45, -5.2, { collide: false });

  // ---- breakfast room x[-4..3] z[-9..-3] ----
  // NOTE east-facing in spirit; door from corridor
  B.floor(-4, -9, 3, -3, 0.001, M.wood);
  B.ceiling(-4, -9, 3, -3, H, M.plaster);
  B.wall(-4, -9, 3, -9, 0, H, M.fern, [{ at: 3.5, w: 1.4, h: 1.5, bottom: 1.0 }]);
  B.wall(3, -9, 3, -3, 0, H, M.fern);
  B.decal(T.windowPane, 1.3, 1.4, -0.5, 1.75, -8.9, 0);
  // abandoned breakfast things — a previous tenant's dishes, never cleared
  const bTable = B.box(M.wood, 1.3, 0.76, 1.3, -0.5, 0.38, -6);
  [[-0.3,-0.3],[0.3,0.3],[0.35,-0.25]].forEach(([px,pz]) => {
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 8), M.paper);
    dish.position.set(px, 0.78 - 0.38, pz); bTable.add(dish);
  });
  // the child's drawing pinned to the back of the door (corridor side wall)
  world.props.childDrawing = B.decal(T.childDrawing, 0.42, 0.5, 0.4, 1.45, -3.1, Math.PI);

  /* ============ FIRST FLOOR ============ */
  // slab over hall + east block (gallery + bedroom + bathroom), west block locked rooms
  // gallery x[-3..3] z[0..10] with stair opening x[1.4..3] z[2.4..8]
  B.floor(-3, 0, 1.45, 10, F2, M.woodDark);
  B.floor(1.45, 0, 3, 2.4, F2, M.woodDark);
  B.floor(1.45, 8, 3, 10, F2, M.woodDark);
  B.ceiling(-3, 0, 3, 10, F2 + H2, M.plasterD);
  // stairwell guard rails
  B.box(M.woodDark, 0.08, 1.0, 5.6, 1.41, F2 + 0.5, 5.2);
  B.box(M.woodDark, 1.6, 1.0, 0.08, 2.2, F2 + 0.5, 2.36);
  // gallery walls
  B.wall(-3, 10, 3, 10, F2, H2, M.fern, [{ at: 4.2, w: 1.4, h: 1.5, bottom: 0.95 }]);
  B.wall(-3, 0, 3, 0, F2, H2, M.fern);
  B.wall(-3, 0, -3, 10, F2, H2, M.fern,
    [{ at: 7.5, w: 1.1, h: 2.05 }, { at: 2.5, w: 1.1, h: 2.05 }]); // two locked doors west
  B.wall(3, 0, 3, 10, F2, H2, M.fern,
    [{ at: 7.5, w: 1.1, h: 2.05 }, { at: 2.5, w: 1.1, h: 2.05 }]); // bedroom + bathroom
  B.decal(T.windowPane, 1.3, 1.4, 1.2, F2 + 1.7, 9.9, Math.PI);

  // Thomas Ashford's portrait — the only image of him. He has kind eyes.
  world.props.portraitThomas = B.decal(T.portraitThomas, 0.95, 1.25, 0, F2 + 1.8, 0.11, 0);

  // locked west doors (previous tenants' rooms — Act 3)
  world.doors.locked1 = B.door(-3, 7.5, false, M.panel, { locked: true, name: 'locked1' });
  world.doors.locked2 = B.door(-3, 2.5, false, M.panel, { locked: true, name: 'locked2' });

  // ---- Mara's bedroom x[3..12] z[5..10] ----
  B.floor(3, 5, 12, 10, F2, M.wood);
  B.ceiling(3, 5, 12, 10, F2 + H2, M.plasterD);
  B.wall(3, 10, 12, 10, F2, H2, M.fern, [{ at: 4.5, w: 1.5, h: 1.6, bottom: 0.9 }]); // front window — view of the drive
  B.wall(3, 5, 12, 5, F2, H2, M.fern);
  B.wall(12, 5, 12, 10, F2, H2, M.fern);
  B.decal(T.windowPane, 1.4, 1.5, 7.5, F2 + 1.7, 9.9, Math.PI);
  world.doors.bedroom = B.door(3, 7.5, false, M.panel, { name: 'bedroom' });
  // bed
  B.box(M.woodDark, 1.5, 0.45, 2.1, 10.6, F2 + 0.225, 8.6);
  B.box(M.linen, 1.46, 0.18, 2.0, 10.6, F2 + 0.53, 8.6, { collide: false });
  B.box(M.woodDark, 1.5, 1.0, 0.12, 10.6, F2 + 0.5, 9.7, { collide: false });
  // writing desk by the window, overlooking the drive
  const desk = B.box(M.wood, 1.2, 0.76, 0.6, 6.4, F2 + 0.38, 9.4);
  world.props.bedroomDesk = desk;
  B.box(M.dark, 0.4, 0.85, 0.4, 6.4, F2 + 0.43, 8.6, { collide: false });
  // wardrobe
  B.box(M.woodDark, 1.2, 2.2, 0.6, 4.0, F2 + 1.1, 5.4);

  // ---- bathroom x[3..12] z[0..5] ----
  B.floor(3, 0, 12, 5, F2, M.flag);
  B.ceiling(3, 0, 12, 5, F2 + H2, M.plaster);
  B.wall(3, 0, 12, 0, F2, H2, M.plaster);
  B.wall(12, 0, 12, 5, F2, H2, M.plaster, [{ at: 2.5, w: 1.2, h: 1.3, bottom: 1.1 }]);
  B.wall(3, 5, 12, 5, F2, H2, M.plaster);
  B.decal(T.windowPane, 1.1, 1.2, 11.9, F2 + 1.7, 2.5, -Math.PI/2);
  world.doors.bathroom = B.door(3, 2.5, false, M.panel, { name: 'bathroom' });
  // tub, sink, mirror over sink
  B.box(M.paper, 1.6, 0.55, 0.7, 10.8, F2 + 0.28, 0.6);
  B.box(M.paper, 0.5, 0.8, 0.4, 5.0, F2 + 0.4, 0.3);
  const bathMirror = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.65),
    psxMaterial(new THREE.MeshLambertMaterial({
      color: 0x232c31, emissive: 0x121a20, emissiveIntensity: 0.7 })));
  bathMirror.position.set(5.0, F2 + 1.5, 0.12); scene.add(bathMirror);
  world.props.bathMirror = bathMirror;

  // first-floor west slab (over library/sitting) — sealed rooms, no interior in slice
  B.floor(-12, 0, -3, 10, F2, M.woodDark);

  /* ============ LIGHTING ============ */
  scene.add(new THREE.AmbientLight(0x3c4048, 2.2));
  const moon = new THREE.DirectionalLight(0x5a6a7c, 1.9);
  moon.position.set(8, 18, 14);
  scene.add(moon);
  // a cold porch lamp over the front door — the house lets you find the lock
  B.light(0, 2.9, 11.4, 0x9aa4b0, 5, 7);

  const L = world.lights;
  L.hall      = B.light(0, 2.6, 5, 0xffd9a0, 14, 11);
  L.library   = B.light(-7.5, 2.5, 7.5, 0xeac88a, 10, 9);
  L.sitting   = B.light(-7.5, 2.5, 2.5, 0xeac88a, 9, 9);
  L.drawing   = B.light(7.5, 2.5, 7.5, 0xeac88a, 10, 9);
  L.dining    = B.light(7.5, 2.5, 2.5, 0xd9c08a, 9, 9);
  L.corridor  = B.light(-4.5, 2.5, -1.5, 0xd0b888, 8, 9);
  L.kitchen   = B.light(-8, 2.6, -6, 0xcfd8d2, 14, 9);   // cold fluorescent
  L.breakfast = B.light(-0.5, 2.5, -6, 0xd9c08a, 8, 8);
  L.gallery   = B.light(0, F2 + 2.4, 5, 0xd9be8a, 10, 11);
  L.bedroom   = B.light(7.5, F2 + 2.4, 7.5, 0xe6c88e, 10, 9);
  L.bathroom  = B.light(7.5, F2 + 2.4, 2.5, 0xb8c4c2, 7, 8);
  L.westwing  = B.light(-14.2, 2.3, -1.5, 0x8a6a4a, 3.5, 6);  // dim — the end stays dark

  /* ============ ROOM REGIONS (floor plan / ambience) ============ */
  world.rooms = [
    { id:'drive',     name:'THE DRIVE',       minX:-14, maxX:14, minZ:10.7, maxZ:40, floor:0 },
    { id:'hall',      name:'ENTRANCE HALL',   minX:-3, maxX:3, minZ:0, maxZ:10, floor:0 },
    { id:'library',   name:'LIBRARY',         minX:-12, maxX:-3, minZ:5, maxZ:10, floor:0 },
    { id:'sitting',   name:'SITTING ROOM',    minX:-12, maxX:-3, minZ:0, maxZ:5, floor:0 },
    { id:'drawing',   name:'DRAWING ROOM',    minX:3, maxX:12, minZ:5, maxZ:10, floor:0 },
    { id:'dining',    name:'DINING ROOM',     minX:3, maxX:12, minZ:0, maxZ:5, floor:0 },
    { id:'corridor',  name:'BACK CORRIDOR',   minX:-12, maxX:3, minZ:-3, maxZ:0, floor:0 },
    { id:'westwing',  name:'THE WEST WING',   minX:-19, maxX:-12, minZ:-3, maxZ:0, floor:0 },
    { id:'kitchen',   name:'KITCHEN',         minX:-12, maxX:-4, minZ:-9, maxZ:-3, floor:0 },
    { id:'breakfast', name:'BREAKFAST ROOM',  minX:-4, maxX:3, minZ:-9, maxZ:-3, floor:0 },
    { id:'gallery',   name:'SECOND FLOOR',    minX:-3, maxX:3, minZ:0, maxZ:10, floor:1 },
    { id:'bedroom',   name:"MARA'S BEDROOM",  minX:3, maxX:12, minZ:5, maxZ:10, floor:1 },
    { id:'bathroom',  name:'BATHROOM',        minX:3, maxX:12, minZ:0, maxZ:5, floor:1 },
  ];

  return world;
}
