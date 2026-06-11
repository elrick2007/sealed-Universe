// The puzzle chain — what the walls are hiding, Resident Evil style:
// sheet music → the piano (E G F# D) → a brass winding key → the long-case
// clock (2:47, the hour she speaks) → an iron key stamped W → the west wing
// door — and a corridor fourteen feet longer than the house.
// Plus the hollow panel behind the library shelf.
import { state, save, addItem, hasItem } from './state.js';
import { hud } from './hud.js';
import { journal } from './journal.js';

const $ = id => document.getElementById(id);

const NOTES = [
  { n: 'C',  f: 261.63 }, { n: 'D', f: 293.66 }, { n: 'E', f: 329.63 },
  { n: 'F',  f: 349.23 }, { n: 'F♯', f: 369.99, black: true },
  { n: 'G',  f: 392.00 }, { n: 'A', f: 440.00 }, { n: 'B', f: 493.88 },
];
const TARGET = ['E', 'G', 'F♯', 'D'];   // Eleanor's theme

export const puzzles = {
  open: false, _which: null,
  world: null, controls: null, audio: null,
  _seq: [], _busy: false,
  _clockH: 3, _clockM: 0,
  _teaser: 0, _breathT: 0,

  init(world, controls, audio){
    this.world = world; this.controls = controls; this.audio = audio;

    /* ---- piano keys ---- */
    const keysEl = $('pianoKeys');
    NOTES.forEach((note, i) => {
      const k = document.createElement('div');
      k.className = 'pk' + (note.black ? ' black' : '');
      k.textContent = note.n;
      k.dataset.i = i;
      k.addEventListener('click', () => this._playKey(i));
      keysEl.appendChild(k);
    });
    document.addEventListener('keydown', e => {
      if (this._which === 'piano' && !this._busy){
        const n = e.code.startsWith('Digit') ? +e.code.slice(5) - 1 : -1;
        if (n >= 0 && n < NOTES.length) this._playKey(n);
      }
      if (e.code === 'Escape' && this.open && !this._busy) this.close();
    });

    /* ---- clock dials ---- */
    document.querySelectorAll('#clockUI .dials button').forEach(b => {
      b.addEventListener('click', () => {
        const d = b.dataset.d;
        if (d[0] === 'h'){
          this._clockH = ((this._clockH - 1 + +d.slice(1)) % 12 + 12) % 12 + 1;
        } else {
          this._clockM = ((this._clockM + +d.slice(1)) % 60 + 60) % 60;
        }
        this.audio.click();
        this._drawClock();
      });
    });
    $('clockSet').addEventListener('click', () => this._trySetClock());
    $('piano').querySelector('.close').addEventListener('click', () => this.close());
    $('clockUI').querySelector('.close').addEventListener('click', () => this.close());
  },

  /* ================= PIANO ================= */
  openPiano(){
    this.open = true; this._which = 'piano'; this._seq = []; this._busy = false;
    $('piano').style.display = 'block';
    $('pianoSeq').textContent = '';
    document.exitPointerLock();
    this.audio.paper();
  },

  _playKey(i){
    const note = NOTES[i];
    this.audio.pianoNote(note.f);
    const el = document.querySelector(`#pianoKeys .pk[data-i="${i}"]`);
    el.classList.add('down');
    setTimeout(() => el.classList.remove('down'), 140);
    this._seq.push(note.n);
    $('pianoSeq').textContent = this._seq.join(' · ');
    if (this._seq.length < TARGET.length) return;

    this._busy = true;
    if (this._seq.every((n, k) => n === TARGET[k])){
      setTimeout(() => this._pianoSolved(), 700);
    } else {
      setTimeout(() => {
        this.audio.wrongNotes();
        $('pianoSeq').textContent = '—';
        this._seq = []; this._busy = false;
      }, 600);
    }
  },

  _pianoSolved(){
    state.pianoSolved = true;
    this.audio.mechanism();
    setTimeout(() => this.audio.eleanorTheme(0.04, 0), 500);
    setTimeout(() => {
      this.close();
      hud.caption('A click under the keyboard. A shallow compartment swings open — a small brass winding key, and a card in copperplate: “The house keeps its hours. The clock remembers the one that matters. — T.A.”', 8);
      addItem('windingKey', 'BRASS WINDING KEY',
        'Small, polished by use. From a compartment under the piano keys. For a clock.');
      journal.note('Played the four circled notes on the piano — E, G, F-sharp, D. The house approved: a compartment under the keys. A winding key, and a card from Thomas Ashford about the clock remembering “the one hour that matters.” The hall clock is stopped at 3:00. I do not think 3:00 is the hour that matters.');
      hud.gadget(`ITEMS ×${state.inventory.length} — see journal`);
      save();
    }, 1400);
  },

  /* ================= CLOCK ================= */
  openClock(){
    this.open = true; this._which = 'clock';
    this._clockH = 3; this._clockM = 0;
    $('clockHint').textContent = 'The winding key fits. The hands will move now — to the right time.';
    $('clockUI').style.display = 'block';
    document.exitPointerLock();
    this.audio.keys();
    this._drawClock();
  },

  _drawClock(){
    const c = $('clockFace'), x = c.getContext('2d');
    const cx = 110, cy = 110, R = 96;
    x.clearRect(0, 0, 220, 220);
    x.strokeStyle = '#5d5648'; x.lineWidth = 2;
    x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.stroke();
    x.fillStyle = '#7d745f'; x.font = '13px Georgia'; x.textAlign = 'center';
    for (let i = 1; i <= 12; i++){
      const a = i / 12 * Math.PI * 2 - Math.PI / 2;
      x.fillText(['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'][i % 12],
        cx + Math.cos(a) * (R - 16), cy + Math.sin(a) * (R - 16) + 4);
    }
    const ha = ((this._clockH % 12) + this._clockM / 60) / 12 * Math.PI * 2 - Math.PI / 2;
    const ma = this._clockM / 60 * Math.PI * 2 - Math.PI / 2;
    x.strokeStyle = '#cfc6ae'; x.lineWidth = 4;
    x.beginPath(); x.moveTo(cx, cy);
    x.lineTo(cx + Math.cos(ha) * 46, cy + Math.sin(ha) * 46); x.stroke();
    x.lineWidth = 2;
    x.beginPath(); x.moveTo(cx, cy);
    x.lineTo(cx + Math.cos(ma) * 70, cy + Math.sin(ma) * 70); x.stroke();
    x.fillStyle = '#c9982f';
    x.beginPath(); x.arc(cx, cy, 4, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#5d5648'; x.font = '15px Georgia';
    x.fillText(`${this._clockH}:${String(this._clockM).padStart(2, '0')}`, cx, cy + 42);
  },

  _trySetClock(){
    if (this._clockH === 2 && this._clockM === 47){
      state.clockSolved = true;
      this._busy = true;
      this.audio.mechanism();
      setTimeout(() => {
        this._busy = false;
        this.close();
        hud.caption('Nine ticks. A tenth. The clock keeps going — and a drawer I never saw slides out of the base. An iron key, heavier than the other three. The bow is stamped with a single letter: W.', 8);
        addItem('ironKeyW', 'IRON KEY — W',
          'From a hidden drawer in the long-case clock. Heavier than the house keys. W.');
        journal.note('Set the clock to 2:47 — her hour — and it accepted it. It is TICKING now. A drawer in the base: one iron key, stamped W. There is exactly one door in this house that none of my keys fit. I am going to open it, because the alternative is knowing it is there and not opening it, and I have already tried that for a day.');
        hud.objective('Open the west wing door');
        hud.gadget(`ITEMS ×${state.inventory.length} — see journal`);
        save();
      }, 1500);
    } else {
      this.audio.thud();
      $('clockHint').textContent = 'The hands resist, then slip back. Wrong hour. The house knows the difference.';
      this._drawClock();
    }
  },

  /* ================= shared ================= */
  close(){
    this.open = false; this._which = null;
    $('piano').style.display = 'none';
    $('clockUI').style.display = 'none';
    if (this.controls.enabled) this.controls.lock();
  },

  /* ---- the library wall panel (knock on the roses) ---- */
  knockPanel(){
    this.audio.hollowKnock();
    hud.caption('Knock. Knock. The wall answers with an empty sound — there is a cavity behind the roses.', 4.5);
    setTimeout(() => {
      this.audio.mechanism();
      state.panelFound = true;
      hud.caption('A section of paper lifts away along an old seam. In the cavity: a silver locket on a rotted ribbon. Inside, a curl of dark hair. The engraving reads E.A.', 7.5);
      addItem('locket', 'SILVER LOCKET — E.A.',
        'Found inside the library wall, behind the roses-and-thorns paper. A curl of dark hair inside.');
      journal.note('The wall behind the pulled shelf is HOLLOW. Behind the rose paper, a cavity — purpose-built, plastered around, papered over. Someone hid a locket in the wall. E.A. Eleanor. Her name is scratched off the portrait but it is sitting in the palm of my hand.');
      hud.gadget(`ITEMS ×${state.inventory.length} — see journal`);
      setTimeout(() => this.audio.eleanorTheme(0.025, -5), 1200);
      save();
    }, 1900);
  },

  /* ---- the west wing, once the door is open ---- */
  update(dt){
    if (!state.westWingOpened) return;
    const W = this.world;
    // the second breathing wall, breathing
    this._breathT = (this._breathT + dt / 10) % 1;
    const b = Math.sin(this._breathT * Math.PI * 2);
    W.props.breathWall2.position.x = -18.9 + b * 0.07;

    const p = this.controls.pos;
    const inCorr = p.z > -3 && p.z < 0;
    if (this._teaser === 0 && inCorr && p.x < -13.5){
      this._teaser = 1;
      this.audio.setFrequency(0.45);
      hud.caption('Fourteen feet. I paced the outside of this wing twice before I ever had the key. The corridor is fourteen feet longer than the house.', 7);
      journal.note('Inside the west wing. Roses and thorns on every wall — the OLD paper, hers. The corridor does not fit inside the building. I have measured. I am writing that sentence down and I am not crossing it out.');
      save();
    }
    if (this._teaser === 1 && inCorr && p.x < -17.2){
      this._teaser = 2;
      this.audio.eleanorTheme(0.035, -4);
      hud.caption('A door at the end. Painted on. No hinges, no handle — and the wall behind it is moving. Five seconds in. Five seconds out. A dress form stands facing it, like someone left in the middle of a fitting.', 9);
      setTimeout(() => {
        const card = $('endcard2');
        card.style.display = 'flex';
        requestAnimationFrame(() => card.style.opacity = 1);
        document.exitPointerLock();
        card.querySelector('.cont2').addEventListener('click', () => {
          card.style.opacity = 0;
          setTimeout(() => { card.style.display = 'none'; }, 800);
          hud.objective('The house is yours until December 2nd');
          this.controls.lock();
        }, { once: true });
      }, 7000);
    }
  },
};
