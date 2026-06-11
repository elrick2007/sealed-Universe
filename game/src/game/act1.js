// ACT 1 — ARRIVAL. The estate agent gone, three keys, the house watching.
// Free exploration → the kitchen wall breathes → recorders placed in four
// rooms → sleep → the 2:47 AM capture. Then the slice's end card.
import * as THREE from 'three';
import { state, save, hasItem } from './state.js';
import { hud } from './hud.js';
import { journal } from './journal.js';
import { recorder } from './recorder.js';
import { puzzles } from './puzzles.js';

const RECORDER_SPOTS = {
  kitchen: { pos: [-11.2, 1.0, -7.4], label: 'kitchen counter' },
  hall:    { pos: [-2.4, 0.93, 8.2],  label: 'hall table' },
  library: { pos: [-9.4, 1.45, 5.5],  label: 'library shelf' },
  bedroom: { pos: [6.4, 4.0, 9.3],    label: 'bedroom desk' },
};

export class Act1 {
  constructor(world, controls, audio, scene, B){
    this.world = world; this.controls = controls; this.audio = audio;
    this.scene = scene; this.B = B;
    this.interactables = [];
    this.breathPhase = 0;
    this.breathLevel = 0;
    this.wallSeqT = -1;
    this.curRoom = null;
    this._setup();
  }

  add(pos, radius, prompt, fn, { once = false, when = null, prio = 0 } = {}){
    const it = { pos: new THREE.Vector3(...pos), radius, prompt, fn, once, when, prio, used: false };
    this.interactables.push(it);
    return it;
  }

  _setup(){
    const W = this.world, A = this.audio;

    /* ---- front door ---- */
    this.add([0, 1, 10.55], 1.7, 'Try the keys  [E]', () => {
      A.keys();
      hud.caption('Three iron keys on an oxidised ring. The second one turns like it was oiled yesterday.', 4.5);
      setTimeout(() => {
        A.unlock(); A.doorCreak(true);
        W.doors.front.locked = false;
        W.doors.front.open();
        state.entered = true;
        state.phase = 'explore';
        hud.objective('Look around the house');
        journal.note('Thirteen windows facing front. I counted twice. Why would you build thirteen windows? The agent couldn’t leave fast enough — kept the keys at arm’s length like they were warm.');
        save();
      }, 1700);
    }, { once: true, when: () => !state.entered });

    /* ---- Eleanor's portrait, entrance hall ---- */
    this.add([-1.2, 1.6, 9.8], 1.6, 'Examine the portrait  [E]', () => {
      A.paper();
      hud.caption('A woman. Painted with more care than the landscapes. The brass name plate has been scratched through — deliberately. Six, seven strokes.', 5.5);
      journal.note('Portrait in the hall: a woman, 1880s dress, dark eyes that don’t leave you alone. Someone took something sharp to her name plate. You don’t scratch out a dead woman’s name unless the name can still do something.');
    }, { once: true });

    /* ---- the clock (puzzle: 2:47 once the winding key is found) ---- */
    let clockExamined = false;
    this.add([2.55, 1.2, 9.6], 1.4, 'Check the clock  [E]', () => {
      if (state.clockSolved){
        hud.caption('The clock is ticking. 2:47, and counting. The drawer in the base sits open and empty.', 4.5);
        return;
      }
      if (hasItem('windingKey')){
        puzzles.openClock();
        return;
      }
      hud.caption('A long-case clock. Stopped. The hands say 3:00. My phone says it isn’t. The hands are stiff — they’d want winding, and the winding key is missing.', 5.5);
      if (!clockExamined){
        clockExamined = true;
        journal.note('Hall clock stopped at 3:00. The winding key is gone from its hook inside the case. Somebody took it somewhere. Leaving it. For now.');
      }
    });

    /* ---- library: pulled shelf ---- */
    this.add([-10.9, 1.3, 9.3], 1.7, 'Look behind the shelf  [E]', () => {
      hud.caption('Someone pulled this shelf from the wall. Behind it — wallpaper. Roses and thorns. Different pattern from everywhere else. Older.', 5);
      journal.note('Library: one shelf section pulled out from the wall. Behind it, roses-and-thorns paper. Hand-printed, older than the ferns everywhere else. Different pattern. Older. Why here?');
      state.shelfExamined = true;
      save();
    }, { once: true });

    /* ---- library: the hollow panel behind the roses ---- */
    this.add([-11.4, 1.3, 9.3], 1.5, 'Knock on the rose wallpaper  [E]', () => {
      puzzles.knockPanel();
    }, { once: true, prio: 1, when: () => state.shelfExamined && !state.panelFound });

    /* ---- library: blank spines ---- */
    this.add([-9.4, 1.3, 5.4], 1.6, 'Examine the books  [E]', () => {
      A.paper();
      hud.caption('A shelf of books with blank spines. Not worn blank. Made blank.', 4.5);
      journal.note('Books with no titles. Bindings are all different ages but every spine is blank. Like a row of people facing the wall.');
    }, { once: true });

    /* ---- sitting room: chess set ---- */
    this.add([-7.5, 0.6, 1.9], 1.3, 'Look at the chess set  [E]', () => {
      hud.caption('Mid-game. Black is two moves from winning. Nobody finished it.', 4);
      journal.note('Chess set in the sitting room, game abandoned mid-play. Dust on every piece except — I’m not writing that. Dust on every piece.');
    }, { once: true });

    /* ---- sitting room: Whitmore's medical text (Act 2 tease) ---- */
    this.add([-8.6, 1.0, 1.85], 1.3, 'Open the medical text  [E]', () => {
      A.paper();
      hud.caption('A Victorian medical text. Margins crowded with handwriting — “accumulated emotional material… testimonial compression.” Signed M.W.', 6);
      journal.note('Dr. Whitmore’s book, annotated in his own hand. “Accumulated emotional material.” “Testimonial compression.” He was measuring something in this house and he never told anyone what.');
    }, { once: true });

    /* ---- drawing room: the sheet music (the piano clue) ---- */
    this.add([10.4, 1, 7.5], 1.9, 'Read the sheet music  [E]', () => {
      A.paper();
      hud.caption('Handwritten, 1880s. Four notes are circled in faded ink, numbered in a careful hand: E — G — F♯ — D. The stool is pulled back, as if someone just stood up.', 6.5);
      journal.note('Grand piano, lid open, handwritten sheet music. Four notes circled and NUMBERED: E, G, F-sharp, D. The keys are clean; everything else in this room wears a year of dust. Someone wants this played.');
    }, { once: true });

    /* ---- drawing room: play the piano (puzzle) ---- */
    this.add([9.3, 1, 7.4], 1.4, 'Play the piano  [E]', () => {
      if (state.pianoSolved){
        hud.caption('The compartment under the keyboard sits open. The piano has given what it was keeping.', 4);
        return;
      }
      puzzles.openPiano();
    }, { prio: 1 });

    /* ---- dining room: mirror ---- */
    this.add([11.8, 1.6, 2.5], 1.7, 'Look in the mirror  [E]', () => {
      hud.caption('A long mirror at the end of the table. My reflection looks tired. It looks… accurate. For now.', 4.5);
      journal.note('Dining room set for twelve, dust on eleven places. The mirror at the far end is the cleanest thing in the house. I don’t like standing in front of it and I can’t say why.');
    }, { once: true });

    /* ---- breakfast room: the child's drawing ---- */
    this.add([0.4, 1.45, -3.2], 1.5, "Look at the child's drawing  [E]", () => {
      hud.caption('A house in crayon. Thirteen windows, carefully counted. A figure in one window. I checked which window. It’s this one.', 6);
      journal.note('A child’s drawing pinned to the breakfast room door. The house. Thirteen windows — a child counted them too. There is a figure drawn in one window. I worked out which window it is. I was standing in it.', { frag: false });
    }, { once: true });

    /* ---- west wing door — the end of the puzzle chain ---- */
    let westNoted = false;
    this.add([-11.6, 1.1, -1.5], 1.6, 'Try the west wing door  [E]', () => {
      if (hasItem('ironKeyW')){
        A.keys();
        hud.caption('The iron key turns once, twice — a lock with two throws, like a cell. The door swings out at me. Cold air. Roses.', 6);
        setTimeout(() => {
          A.unlock(); A.doorCreak(true);
          W.doors.westWing.locked = false;
          W.doors.westWing.open();
          state.westWingOpened = true;
          hud.objective('Walk the west corridor');
          journal.note('The W key fits the west wing door. Double-throw lock — you lock a door like that to keep something IN. Opening it anyway. If I stop to think about the hinges again I will lose my nerve.');
          save();
        }, 1800);
        return;
      }
      A.keys();
      hud.caption('Locked. None of the three keys fit. The hinges are on this side — it opens outward, into the corridor. That’s wrong.', 5.5);
      if (!westNoted){
        westNoted = true;
        journal.note('West wing door: solid oak, no window, locked, and none of the keys fit. Hinges on the corridor side, so it opens OUT. Doors open into rooms. Unless the room needs to let something out — stop. Noting it and moving on. The air near the keyhole smells of roses.');
      }
      hud.objective(state.kitchenWallFelt ? 'Set up the recorders' : 'Look around the house');
    }, { when: () => !state.westWingOpened });

    /* ---- THE KITCHEN WALL ---- */
    this.add([-11.5, 1.4, -6], 1.8, 'Press your palm against the wall  [E]', () => {
      this.wallSeqT = 0;
      this.controls.frozen = true;
      A.startBreathing();
    }, { once: true, when: () => !state.kitchenWallFelt });

    /* ---- recorder placement spots ---- */
    for (const [room, spot] of Object.entries(RECORDER_SPOTS)){
      this.add(spot.pos, 1.6, `Place recorder — ${spot.label}  [E]`, () => {
        A.click();
        state.recordersPlaced.push(room);
        this._spawnRecorderProp(spot.pos);
        const left = 4 - state.recordersPlaced.length;
        hud.caption(left
          ? `Recorder placed. ${left} left.`
          : 'All four recorders running. Now I work, and the house does whatever it does when I’m not looking.', 4);
        if (!left){
          state.phase = 'night';
          hud.objective('Sit at the kitchen table and work until late  (kitchen)');
          journal.note('Recorders in the kitchen, the hall, the library, my bedroom. Whatever moved in that wall, if it makes a sound tonight, I’ll have it on tape. Evidence first. Fear later. That’s the order.');
        }
        save();
      }, { once: true, prio: 1, when: () =>
        state.kitchenWallFelt && !state.recordersPlaced.includes(room) });
    }

    /* ---- kitchen table: working late / sleep ---- */
    this.add([-7.5, 0.8, -5.6], 1.7, 'Sit and work  [E]', () => {
      this._nightSequence();
    }, { once: true, when: () => state.phase === 'night' });

    /* ---- the laptop: review recordings (morning) ---- */
    this.add([-7.7, 0.8, -6.1], 1.7, 'Review the overnight recordings  [E]', () => {
      recorder.show();
    }, { when: () => state.phase === 'review' || state.phase === 'done' });

    /* ---- upstairs: Thomas's portrait ---- */
    this.add([0, 4.8, 0.4], 1.7, 'Look at the portrait  [E]', () => {
      hud.caption('A man. Mid-forties. Respectable. He has kind eyes. That is the most disturbing thing in this house.', 5.5);
      journal.note('Second floor: the only portrait of a man in the whole house. He looks reasonable. He looks like he’d hear you out. I have interviewed men with that exact face and printed what they did to people.');
    }, { once: true });

    /* ---- bathroom mirror ---- */
    this.add([5.0, 4.6, 0.3], 1.4, 'Look in the mirror  [E]', () => {
      hud.caption('Cold water only. The mirror is clean. My face is a woman who has slept badly in six different rented rooms this year.', 5);
      journal.note('Bathroom: functional, cold water only. Fine. I’ve had worse residencies.');
    }, { once: true });

    /* ---- bedroom desk view ---- */
    this.add([6.4, 4.2, 9.4], 1.5, 'Look out at the drive  [E]', () => {
      hud.caption('The drive, the gate, the hedges gone feral. No lights anywhere. Good. Nobody knows I’m here.', 4.5);
      journal.note('My room faces the drive. I can see anyone coming. Old habit. Useful habit.');
    }, { once: true });
  }

  _spawnRecorderProp(pos){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.07),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1c }));
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.012, 0.012),
      new THREE.MeshBasicMaterial({ color: 0xff2211 }));
    led.position.set(0.06, 0.025, 0);
    g.add(body, led);
    g.position.set(...pos);
    this.scene.add(g);
    (this.world.recorderProps ??= []).push(led);
  }

  /* ---------- the kitchen wall sequence ---------- */
  _updateWallSeq(dt){
    if (this.wallSeqT < 0) return;
    const t = (this.wallSeqT += dt);
    const W = this.world;
    // ramp the breath in over 2s, hold 12s, conclude
    this.breathLevel = Math.min(1, t / 2);
    if (t > 1 && t < 1.2) hud.caption('…', 2);
    if (t > 3 && t < 3.2){
      hud.caption('The wall moves. Five seconds in. Five seconds out.', 4.8);
    }
    if (t > 8 && t < 8.2){
      hud.caption('Breathing. Or a structural fault with a pulse. I’m keeping my hand here until I’m sure.', 5);
    }
    if (t > 14){
      this.wallSeqT = -1;
      this.controls.frozen = false;
      state.kitchenWallFelt = true;
      state.phase = 'recorders';
      this.audio.setFrequency(0.25);
      hud.caption('Definite. I’m leaving the recorder running. All of them.', 5);
      hud.objective('Place 4 recorders — kitchen · hall · library · bedroom');
      hud.gadget('RECORDERS ×4');
      journal.note('The wall behind the counter. Rhythmic movement. Breathing? Or structural fault? I pressed my hand flat and felt it. Definite. Five seconds in, five seconds out. I am not frightened. I am DOCUMENTING. There is a difference and I intend to keep it.');
      save();
    }
  }

  /* ---------- night → morning ---------- */
  _nightSequence(){
    const A = this.audio;
    state.phase = 'sleeping';
    hud.prompt(null);
    hud.objective('');
    this.controls.frozen = true;
    hud.fade(true, 3);
    A.sleepDrone();
    hud.caption('Transcribe. Index. Cross-reference. The work is the same everywhere, even here. Midnight. One. Two…', 7);
    setTimeout(() => {
      // small hours: distant sounds in the dark
      A.thud();
      setTimeout(() => A.doorCreak(false), 2500);
      setTimeout(() => A.eleanorTheme(0.018, -8), 4200); // barely there
    }, 4000);
    setTimeout(() => {
      // morning
      state.slept = true;
      state.phase = 'review';
      // teleport to the kitchen table, morning light
      this.controls.pos.set(-7.5, 1.62, -5.2);
      this.controls.yaw = Math.PI + 0.45; this.controls.pitch = -0.2;
      this.world.morning = true;
      this.audio.setFrequency(0.1);
      hud.fade(false, 3);
      this.controls.frozen = false;
      hud.caption('Morning. Neck cricked, mouth like a filing cabinet. The recorders ran all night.', 5);
      hud.objective('Review the overnight recordings  (laptop)');
      journal.note('Woke at the table. The house let me sleep, which I notice I am phrasing as if the house had a say in it. Reviewing the tapes now.', { t: 'NOV 29' });
      save();
    }, 11000);
  }

  /* ---------- after the voice ---------- */
  onVoiceHeard(){
    state.phase = 'done';
    save();
    hud.showWave('off');
    setTimeout(() => {
      hud.caption('A voice with the words removed. A woman. In my kitchen, at 2:47 in the morning, eleven feet from where I was sleeping.', 7);
    }, 600);
    setTimeout(() => {
      recorder.close();
      const card = document.getElementById('endcard');
      card.style.display = 'flex';
      requestAnimationFrame(() => card.classList.add('show'));
      this.audio.eleanorTheme(0.05, 0);
      document.exitPointerLock();
      card.querySelector('.cont').addEventListener('click', () => {
        card.classList.remove('show');
        setTimeout(() => { card.style.display = 'none'; }, 800);
        // the timestamp is the clock puzzle's answer — point the player back in
        if (state.westWingOpened){
          hud.objective('The house is yours until December 2nd');
        } else if (state.clockSolved){
          hud.objective('Open the west wing door');
        } else if (hasItem('windingKey')){
          hud.objective('2:47 — the clock wants to remember it');
        } else {
          hud.objective('The house is hiding things — start with the piano');
        }
      }, { once: true });
    }, 8500);
  }

  /* ---------- per-frame ---------- */
  update(dt, time){
    this._updateWallSeq(dt);

    // breathing wall animation — 10s cycle, 5 in 5 out
    if (this.breathLevel > 0){
      this.breathPhase = (this.breathPhase + dt / 10) % 1;
      const b = Math.sin(this.breathPhase * Math.PI * 2);
      const w = this.world.props.breathWall;
      w.position.x = -11.9 + b * 0.05 * this.breathLevel;
      this.audio.setBreathing(this.breathLevel, this.breathPhase);
    }

    // recorder LEDs blink
    if (this.world.recorderProps){
      const on = (time % 1.6) < 1.45;
      for (const led of this.world.recorderProps) led.visible = on;
    }

    // 7th step
    const p = this.controls.pos, s7 = this.world.stair7;
    if (s7 && !this._on7 && p.x > s7.minX && p.x < s7.maxX && p.z > s7.minZ && p.z < s7.maxZ){
      this._on7 = true;
      this.audio.stairSeven();
      if (!state.stair7Done){
        state.stair7Done = true;
        journal.note('The seventh stair makes a sound that is not a creak. I have decided not to describe it.');
        save();
      }
    } else if (s7 && this._on7 && (p.x < s7.minX || p.x > s7.maxX || p.z < s7.minZ || p.z > s7.maxZ)){
      this._on7 = false;
    }

    // room tracking → ambience, footstep surface, floor plan
    const floor = p.y > 2.8 ? 1 : 0;
    let room = null;
    for (const r of this.world.rooms){
      if (r.floor === floor && p.x >= r.minX && p.x <= r.maxX && p.z >= r.minZ && p.z <= r.maxZ){
        room = r; break;
      }
    }
    if (room && room.id !== this.curRoom){
      this.curRoom = room.id;
      if (!state.visited[room.id]){
        state.visited[room.id] = true;
        save();
      }
      this.audio.setInside(room.id !== 'drive');
      this.controls.surface =
        room.id === 'drive' ? 'gravel' :
        (room.id === 'hall' || room.id === 'kitchen' || room.id === 'bathroom') ? 'stone' : 'wood';
    }

    // interaction prompt
    if (!journal.open && !recorder.open && !puzzles.open && this.wallSeqT < 0 && state.phase !== 'sleeping'){
      const hit = this._nearest();
      hud.prompt(hit ? hit.prompt : null);
      this._hit = hit;
    } else {
      hud.prompt(null);
      this._hit = null;
    }
  }

  _nearest(){
    const p = this.controls.pos;
    let best = null, bestD = 1e9, bestP = -1;
    for (const it of this.interactables){
      if (it.used && it.once) continue;
      if (it.when && !it.when()) continue;
      const d = it.pos.distanceTo(p);
      if (d < it.radius && (it.prio > bestP || (it.prio === bestP && d < bestD))){
        best = it; bestD = d; bestP = it.prio;
      }
    }
    return best;
  }

  interact(){
    const it = this._hit;
    if (!it) return;
    it.used = true;
    it.fn();
  }
}
