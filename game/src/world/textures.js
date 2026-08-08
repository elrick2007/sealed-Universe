// Procedural PSX-resolution textures. Every surface in the manor is painted
// in code — these implement the texture prompts from the game bible (sec. 10).
import * as THREE from 'three';

function canvas(s = 128){
  const c = document.createElement('canvas');
  c.width = c.height = s;
  return [c, c.getContext('2d')];
}
function tex(c, repeat = 1){
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(repeat, repeat);
  return t;
}
// deterministic noise
let seed = 7;
function rnd(){ seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
function speckle(ctx, s, n, col, a0, a1, r0 = 1, r1 = 2){
  for (let i = 0; i < n; i++){
    ctx.fillStyle = col;
    ctx.globalAlpha = a0 + rnd() * (a1 - a0);
    const r = r0 + rnd() * (r1 - r0);
    ctx.fillRect(rnd()*s, rnd()*s, r, r);
  }
  ctx.globalAlpha = 1;
}

/* ---------- PROMPT 003 — gravel drive ---------- */
export function gravel(){
  const [c, x] = canvas(128);
  x.fillStyle = '#55524a'; x.fillRect(0,0,128,128);
  for (let i = 0; i < 900; i++){
    const g = 60 + rnd()*70 | 0;
    x.fillStyle = `rgb(${g},${g-2},${g-8})`;
    x.fillRect(rnd()*128, rnd()*128, 2+rnd()*3, 2+rnd()*2);
  }
  speckle(x, 128, 300, '#2e2c26', .5, .9, 1, 2);
  return tex(c, 18);
}

/* ---------- PROMPT 007 — worn flagstone ---------- */
export function flagstone(){
  const [c, x] = canvas(128);
  x.fillStyle = '#6a6e64'; x.fillRect(0,0,128,128);
  const cells = 4;
  for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++){
    const g = 95 + rnd()*30 | 0;
    x.fillStyle = `rgb(${g-6},${g},${g-10})`;
    x.fillRect(i*32+1, j*32+1, 30, 30);
    // concave wear — darker centre
    x.fillStyle = 'rgba(40,44,40,0.25)';
    x.fillRect(i*32+8, j*32+8, 16, 16);
  }
  x.strokeStyle = '#3a3d38'; x.lineWidth = 2;
  for (let i = 0; i <= cells; i++){
    x.beginPath(); x.moveTo(i*32,0); x.lineTo(i*32,128); x.stroke();
    x.beginPath(); x.moveTo(0,i*32); x.lineTo(128,i*32); x.stroke();
  }
  speckle(x, 128, 320, '#2c2e2a', .2, .5);
  return tex(c, 6);
}

/* ---------- PROMPT 012 — dark Victorian floorboards ---------- */
export function woodFloor(dark = 0){
  const [c, x] = canvas(128);
  for (let i = 0; i < 8; i++){
    const g = 70 + rnd()*26 - dark*22;
    x.fillStyle = `rgb(${g|0},${g*0.66|0},${g*0.4|0})`;
    x.fillRect(0, i*16, 128, 16);
    x.fillStyle = 'rgba(0,0,0,0.45)';
    x.fillRect(0, i*16, 128, 1);
    // grain
    for (let k = 0; k < 9; k++){
      x.strokeStyle = `rgba(30,18,8,${0.12 + rnd()*0.2})`;
      x.beginPath();
      const y = i*16 + 2 + rnd()*12;
      x.moveTo(0, y); x.lineTo(128, y + (rnd()-0.5)*3); x.stroke();
    }
    // board end joint
    x.fillStyle = 'rgba(0,0,0,0.4)';
    x.fillRect(rnd()*128, i*16, 1, 16);
  }
  return tex(c, 5);
}

/* ---------- PROMPT 008 — dark oak panelling ---------- */
export function panelling(){
  const [c, x] = canvas(128);
  x.fillStyle = '#2e2118'; x.fillRect(0,0,128,128);
  for (let k = 0; k < 60; k++){
    x.strokeStyle = `rgba(16,10,6,${0.2+rnd()*0.3})`;
    x.beginPath();
    const y0 = rnd()*128;
    x.moveTo(0,y0); x.bezierCurveTo(40,y0+4, 90,y0-4, 128,y0+2); x.stroke();
  }
  // raised panel frames
  x.strokeStyle = '#1a110a'; x.lineWidth = 3;
  x.strokeRect(8, 10, 48, 108); x.strokeRect(72, 10, 48, 108);
  x.strokeStyle = 'rgba(120,86,52,0.45)'; x.lineWidth = 1;
  x.strokeRect(11, 13, 42, 102); x.strokeRect(75, 13, 42, 102);
  return tex(c, 2);
}

/* ---------- PROMPT 009 — ferns & songbirds wallpaper ---------- */
export function fernWallpaper(){
  const [c, x] = canvas(128);
  x.fillStyle = '#c8c2ac'; x.fillRect(0,0,128,128);
  speckle(x, 128, 400, '#a39c84', .2, .4);
  const fern = (fx, fy, fl) => {
    x.strokeStyle = 'rgba(74,92,66,0.85)'; x.lineWidth = 1.5;
    x.beginPath(); x.moveTo(fx, fy); x.quadraticCurveTo(fx+4, fy-fl/2, fx+2, fy-fl); x.stroke();
    for (let i = 1; i < 6; i++){
      const t = i/6, yy = fy - fl*t, w = (1-t)*8;
      x.beginPath(); x.moveTo(fx + t*2, yy); x.lineTo(fx + t*2 - w, yy - 3); x.stroke();
      x.beginPath(); x.moveTo(fx + t*2, yy); x.lineTo(fx + t*2 + w, yy - 3); x.stroke();
    }
  };
  const bird = (bx, by, flip) => {
    x.save(); x.translate(bx, by); if (flip) x.scale(-1, 1);
    x.fillStyle = 'rgba(122,108,64,0.9)';
    x.beginPath(); x.ellipse(0, 0, 5, 3, -0.3, 0, Math.PI*2); x.fill();
    x.beginPath(); x.arc(5, -3, 2.2, 0, Math.PI*2); x.fill();   // head
    x.beginPath(); x.moveTo(-4, 1); x.lineTo(-9, 3); x.lineTo(-4, 3); x.fill(); // tail
    x.fillStyle = '#2a2620';
    x.fillRect(6, -4, 1.4, 1.4); // the eye — always toward you
    x.restore();
  };
  fern(18, 60, 34); fern(60, 120, 40); fern(100, 70, 30); fern(40, 124, 28);
  bird(30, 28, false); bird(92, 100, true); bird(70, 40, true); bird(14, 100, false);
  return tex(c, 3);
}

/* ---------- PROMPT 010 — roses & thorns (Eleanor) ---------- */
export function roseWallpaper(){
  const [c, x] = canvas(128);
  x.fillStyle = '#d6cbaa'; x.fillRect(0,0,128,128);
  const rose = (rx, ry) => {
    for (let i = 4; i > 0; i--){
      x.fillStyle = `rgba(${180+i*10},${160+i*8},${90+i*6},0.9)`;
      x.beginPath(); x.arc(rx, ry, i*2.4, 0, Math.PI*2); x.fill();
    }
    x.strokeStyle = 'rgba(120,100,50,0.6)';
    x.beginPath(); x.arc(rx, ry, 4, 0.5, 4); x.stroke();
  };
  x.strokeStyle = 'rgba(60,66,44,0.8)'; x.lineWidth = 1.4;
  // winding vine
  x.beginPath(); x.moveTo(0, 20);
  x.bezierCurveTo(40, 40, 80, 0, 128, 20);
  x.moveTo(0, 84); x.bezierCurveTo(50, 104, 90, 64, 128, 84);
  x.stroke();
  // thorns
  x.fillStyle = 'rgba(40,40,30,0.9)';
  for (let i = 0; i < 14; i++){
    const tx = rnd()*128, ty = (rnd() < 0.5 ? 20 : 84) + (rnd()-0.5)*16;
    x.beginPath(); x.moveTo(tx, ty); x.lineTo(tx+3, ty-5); x.lineTo(tx+5, ty); x.fill();
  }
  rose(24, 22); rose(88, 14); rose(56, 88); rose(112, 80); rose(10, 90);
  return tex(c, 3);
}

/* ---------- plaster / ceiling ---------- */
export function plaster(tone = '#b5ad98'){
  const [c, x] = canvas(64);
  x.fillStyle = tone; x.fillRect(0,0,64,64);
  speckle(x, 64, 260, '#847d6a', .15, .4);
  speckle(x, 64, 80, '#d8d2c0', .1, .3);
  return tex(c, 4);
}

/* ---------- PROMPT 006 — grey limestone (exterior) ---------- */
export function limestone(){
  const [c, x] = canvas(128);
  x.fillStyle = '#73756d'; x.fillRect(0,0,128,128);
  for (let j = 0; j < 4; j++){
    const off = (j % 2) * 32;
    for (let i = -1; i < 3; i++){
      const g = 100 + rnd()*28 | 0;
      x.fillStyle = `rgb(${g},${g+2},${g-4})`;
      x.fillRect(i*64 + off + 2, j*32 + 2, 60, 28);
      if (rnd() < 0.4){ // moss in joints
        x.fillStyle = 'rgba(70,86,56,0.5)';
        x.fillRect(i*64 + off + 2 + rnd()*50, j*32 + 26, 8, 4);
      }
    }
  }
  speckle(x, 128, 500, '#4a4c46', .2, .5);
  return tex(c, 4);
}

/* ---------- PROMPT 013 — cellar earth ---------- */
export function cellarEarth(){
  const [c, x] = canvas(128);
  x.fillStyle = '#3a2f24'; x.fillRect(0,0,128,128);
  speckle(x, 128, 700, '#241c14', .3, .7, 1, 3);
  speckle(x, 128, 200, '#574838', .2, .5);
  return tex(c, 5);
}

/* ---------- slate worktop ---------- */
export function slate(){
  const [c, x] = canvas(64);
  x.fillStyle = '#4d564f'; x.fillRect(0,0,64,64);
  for (let i = 0; i < 16; i++){
    x.strokeStyle = `rgba(255,255,255,${0.03+rnd()*0.05})`;
    x.beginPath(); const y = rnd()*64;
    x.moveTo(0,y); x.lineTo(64, y + (rnd()-0.5)*6); x.stroke();
  }
  return tex(c, 2);
}

/* ---------- bookshelf with blank-spined books (PROMPT 017) ---------- */
export function bookshelf(blank = true){
  const [c, x] = canvas(128);
  x.fillStyle = '#241a10'; x.fillRect(0,0,128,128);
  for (let row = 0; row < 4; row++){
    const y = row * 32;
    x.fillStyle = '#0e0a06'; x.fillRect(2, y+2, 124, 26); // cavity
    let bx = 4;
    while (bx < 116){
      const w = 5 + rnd()*7, h = 20 + rnd()*5;
      if (rnd() < (blank ? 0.85 : 0.5)){
        const g = 40 + rnd()*36;
        x.fillStyle = blank
          ? `rgb(${g|0},${g*0.92|0},${g*0.8|0})`
          : `rgb(${g+30|0},${g*0.6|0},${g*0.45|0})`;
        x.fillRect(bx, y + 28 - h, w, h);
        x.fillStyle = 'rgba(0,0,0,0.35)';
        x.fillRect(bx, y + 28 - h, 1, h);
      }
      bx += w + 1;
    }
    x.fillStyle = '#382a1a'; x.fillRect(0, y + 28, 128, 4); // shelf lip
  }
  return tex(c, 1);
}

/* ---------- curtains ---------- */
export function curtain(){
  const [c, x] = canvas(64);
  x.fillStyle = '#3c3028'; x.fillRect(0,0,64,64);
  for (let i = 0; i < 10; i++){
    x.fillStyle = i % 2 ? 'rgba(0,0,0,0.3)' : 'rgba(120,96,70,0.18)';
    x.fillRect(i*6.4, 0, 3.4, 64);
  }
  return tex(c, 2);
}

/* ---------- window panes (day / night variants set by emissive) ---------- */
export function windowPane(){
  const [c, x] = canvas(64);
  x.fillStyle = '#202830'; x.fillRect(0,0,64,64);
  const grad = x.createLinearGradient(0,0,64,64);
  grad.addColorStop(0,'rgba(190,200,210,0.5)');
  grad.addColorStop(.5,'rgba(120,130,145,0.25)');
  grad.addColorStop(1,'rgba(80,90,100,0.4)');
  x.fillStyle = grad; x.fillRect(0,0,64,64);
  x.strokeStyle = '#171511'; x.lineWidth = 4;
  x.strokeRect(2,2,60,60);
  x.beginPath(); x.moveTo(32,0); x.lineTo(32,64); x.moveTo(0,32); x.lineTo(64,32); x.stroke();
  return tex(c, 1);
}

/* ---------- PROMPT 030 — Eleanor's portrait, scratched name plate ---------- */
export function portraitEleanor(){
  const [c, x] = canvas(128);
  // frame
  x.fillStyle = '#5a4520'; x.fillRect(0,0,128,128);
  x.fillStyle = '#3a2c12'; x.fillRect(6,6,116,116);
  // canvas ground
  const g = x.createRadialGradient(64,52,8, 64,60,80);
  g.addColorStop(0,'#5e564a'); g.addColorStop(1,'#23201c');
  x.fillStyle = g; x.fillRect(10,10,108,104);
  // figure — dark Victorian dress
  x.fillStyle = '#15131a';
  x.beginPath(); x.moveTo(38,114); x.quadraticCurveTo(40,70,56,62);
  x.lineTo(72,62); x.quadraticCurveTo(88,70,90,114); x.fill();
  // high collar
  x.fillStyle = '#0e0d13'; x.fillRect(56,56,16,12);
  // face
  x.fillStyle = '#b09a86';
  x.beginPath(); x.ellipse(64,44,11,14,0,0,Math.PI*2); x.fill();
  // hair pinned up
  x.fillStyle = '#241a12';
  x.beginPath(); x.ellipse(64,36,12,9,0,Math.PI,Math.PI*2); x.fill();
  x.fillRect(52,34,4,10); x.fillRect(72,34,4,10);
  // the dark eyes — looking directly at the viewer
  x.fillStyle = '#0a0808';
  x.fillRect(58,43,3.4,2.6); x.fillRect(66.5,43,3.4,2.6);
  x.fillStyle = 'rgba(255,255,255,0.25)';
  x.fillRect(58.5,43.2,1,1); x.fillRect(67,43.2,1,1);
  // mouth — patience
  x.strokeStyle = 'rgba(60,38,32,0.8)'; x.lineWidth = 1;
  x.beginPath(); x.moveTo(60,52); x.lineTo(68,52); x.stroke();
  // craquelure
  x.strokeStyle = 'rgba(0,0,0,0.18)';
  for (let i = 0; i < 14; i++){
    x.beginPath(); const sx = 10+rnd()*108, sy = 10+rnd()*100;
    x.moveTo(sx,sy); x.lineTo(sx+(rnd()-0.5)*22, sy+(rnd()-0.5)*22); x.stroke();
  }
  // brass plate, scratched through
  x.fillStyle = '#8a7434'; x.fillRect(44,117,40,8);
  x.fillStyle = '#564716'; x.font = '6px Georgia'; x.fillText('ELEANOR', 50,123.5);
  x.strokeStyle = '#2e2406'; x.lineWidth = 1.6;
  for (let i = 0; i < 6; i++){
    x.beginPath(); x.moveTo(45+rnd()*6, 118+rnd()*6);
    x.lineTo(76+rnd()*8, 118+rnd()*6); x.stroke();
  }
  return tex(c, 1);
}

/* ---------- gloomy landscape paintings ---------- */
export function paintingLandscape(variant = 0){
  const [c, x] = canvas(128);
  x.fillStyle = '#4a3a1c'; x.fillRect(0,0,128,128);
  x.fillStyle = variant ? '#46505a' : '#3e4640'; x.fillRect(8,8,112,112);
  // sky band
  x.fillStyle = variant ? '#737a80' : '#7a7d70'; x.fillRect(8,8,112,48);
  // hills
  x.fillStyle = variant ? '#2c343a' : '#2e362c';
  x.beginPath(); x.moveTo(8,76); x.quadraticCurveTo(50,46,128,70);
  x.lineTo(120,120); x.lineTo(8,120); x.fill();
  // dead tree
  x.strokeStyle = '#14110c'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(90,110); x.lineTo(88,70); x.moveTo(88,80);
  x.lineTo(78,68); x.moveTo(88,76); x.lineTo(98,62); x.stroke();
  speckle(x, 128, 120, '#000', .05, .2);
  return tex(c, 1);
}

/* ---------- PROMPT 031 — Thomas Ashford (kind eyes) ---------- */
export function portraitThomas(){
  const [c, x] = canvas(128);
  x.fillStyle = '#4e3c1c'; x.fillRect(0,0,128,128);
  x.fillStyle = '#332610'; x.fillRect(6,6,116,116);
  const g = x.createRadialGradient(64,50,10, 64,60,80);
  g.addColorStop(0,'#6a6054'); g.addColorStop(1,'#262019');
  x.fillStyle = g; x.fillRect(10,10,108,108);
  // shoulders, formal coat
  x.fillStyle = '#16141a';
  x.beginPath(); x.moveTo(34,114); x.quadraticCurveTo(40,74,56,66);
  x.lineTo(72,66); x.quadraticCurveTo(88,74,94,114); x.fill();
  x.fillStyle = '#c8c2b2'; x.fillRect(60,64,8,8); // collar
  // face
  x.fillStyle = '#b59a80';
  x.beginPath(); x.ellipse(64,44,12,15,0,0,Math.PI*2); x.fill();
  // hair, moustache — well maintained
  x.fillStyle = '#3c3226';
  x.beginPath(); x.ellipse(64,34,12,8,0,Math.PI,Math.PI*2); x.fill();
  x.fillRect(57,52,14,3);
  // the kind eyes — the most disturbing thing in the house
  x.fillStyle = '#3a3026';
  x.fillRect(58,42,3.2,2.4); x.fillRect(66.5,42,3.2,2.4);
  x.strokeStyle = 'rgba(60,50,40,0.7)';
  x.beginPath(); x.moveTo(57,41); x.quadraticCurveTo(59.5,39.6,62,41); x.stroke();
  x.beginPath(); x.moveTo(66,41); x.quadraticCurveTo(68.5,39.6,71,41); x.stroke();
  speckle(x, 128, 90, '#000', .05, .16);
  return tex(c, 1);
}

/* ---------- breakfast room child's drawing (13 windows) ---------- */
export function childDrawing(){
  const [c, x] = canvas(128);
  x.fillStyle = '#ddd6c2'; x.fillRect(0,0,128,128);
  x.strokeStyle = '#7a4438'; x.lineWidth = 2;
  // crayon house
  x.strokeRect(24, 50, 80, 60);
  x.beginPath(); x.moveTo(20,50); x.lineTo(64,22); x.lineTo(108,50); x.stroke();
  // 13 windows, carefully counted
  x.strokeStyle = '#39507a'; x.lineWidth = 1.6;
  const spots = [[30,56],[46,56],[62,56],[78,56],[94,56],
                 [30,74],[46,74],[78,74],[94,74],
                 [30,92],[46,92],[94,92],[62,74]];
  spots.forEach(([wx,wy]) => x.strokeRect(wx, wy, 10, 12));
  // the figure in one window — the player's window
  x.fillStyle = '#222';
  x.fillRect(64.5, 76.5, 5, 8);
  x.beginPath(); x.arc(67, 76, 2.4, 0, Math.PI*2); x.fill();
  // childish sun, scribbled out
  x.strokeStyle = '#8a8050';
  x.beginPath(); x.arc(108, 18, 8, 0, Math.PI*2); x.stroke();
  x.strokeStyle = '#555';
  for (let i = 0; i < 7; i++){
    x.beginPath(); x.moveTo(100+rnd()*16, 10+rnd()*16);
    x.lineTo(100+rnd()*16, 10+rnd()*16); x.stroke();
  }
  return tex(c, 1);
}

/* ---------- sheet music ---------- */
export function sheetMusic(){
  const [c, x] = canvas(64);
  x.fillStyle = '#d8d0b8'; x.fillRect(0,0,64,64);
  x.strokeStyle = '#3a362c'; x.lineWidth = 0.8;
  for (let s = 0; s < 4; s++){
    const y0 = 8 + s*14;
    for (let l = 0; l < 5; l++){
      x.beginPath(); x.moveTo(4, y0+l*2); x.lineTo(60, y0+l*2); x.stroke();
    }
    for (let n = 0; n < 7; n++){
      x.fillStyle = '#26221a';
      x.beginPath(); x.ellipse(8+n*8, y0 + (rnd()*8|0), 1.6, 1.2, -0.4, 0, Math.PI*2); x.fill();
    }
  }
  return tex(c, 1);
}

/* ---------- generic fabric / bedding ---------- */
export function linen(tone = '#cfc9b8'){
  const [c, x] = canvas(64);
  x.fillStyle = tone; x.fillRect(0,0,64,64);
  speckle(x, 64, 200, '#8d876f', .04, .1);
  for (let i = 0; i < 8; i++){
    x.strokeStyle = 'rgba(0,0,0,0.06)';
    x.beginPath(); x.moveTo(0, i*8); x.lineTo(64, i*8); x.stroke();
  }
  return tex(c, 2);
}

/* ---------- night sky / void ---------- */
export function makeAll(){
  const T = {
    gravel: gravel(),
    flagstone: flagstone(),
    woodFloor: woodFloor(0),
    woodFloorDark: woodFloor(1),
    panelling: panelling(),
    fernWallpaper: fernWallpaper(),
    roseWallpaper: roseWallpaper(),
    plaster: plaster(),
    plasterDark: plaster('#8f8876'),
    limestone: limestone(),
    cellarEarth: cellarEarth(),
    slate: slate(),
    bookshelf: bookshelf(true),
    bookshelfFull: bookshelf(false),
    curtain: curtain(),
    windowPane: windowPane(),
    portraitEleanor: portraitEleanor(),
    portraitThomas: portraitThomas(),
    landscape0: paintingLandscape(0),
    landscape1: paintingLandscape(1),
    childDrawing: childDrawing(),
    sheetMusic: sheetMusic(),
    linen: linen(),
  };
  // ART OVERRIDE PIPELINE — drop a PNG named assets/<key>.png (e.g.
  // assets/roseWallpaper.png, generated in Sorceress from the bible's
  // Section 10 prompts) and it silently replaces the procedural texture.
  // Missing files are ignored; the procedural version stays.
  for (const key of Object.keys(T)){
    const img = new Image();
    img.onload = () => {
      const t = T[key];
      t.image = img;
      t.dispose();        // drop the old GPU allocation so the new size uploads cleanly
      t.needsUpdate = true;
    };
    img.onerror = () => {}; // no override — keep the procedural texture
    img.src = `./assets/${key}.png`;
  }
  return T;
}
