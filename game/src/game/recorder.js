// The overnight recordings review deck — Act 1's climax. Four tracks; three
// hold only the house settling. The kitchen track holds 2:47:16.
import { state, save } from './state.js';
import { hud } from './hud.js';
import { journal } from './journal.js';

const $ = id => document.getElementById(id);
const NIGHT_START = 22 * 3600;            // 22:00:00
const NIGHT_LEN = 9 * 3600;               // until 07:00
const MARK = (2 + 24) * 3600 + 47 * 60 + 16 - NIGHT_START; // 2:47:16 → offset 17236s

export const recorder = {
  open: false, audio: null, onVoiceHeard: null,
  _bed: null, _anim: 0, _playT: -1, _voiceUntil: 0, track: null,

  init(audioEngine){
    this.audio = audioEngine;
    $('scrubBar').addEventListener('click', e => {
      const r = $('scrubBar').getBoundingClientRect();
      this.seek((e.clientX - r.left) / r.width);
    });
    document.addEventListener('keydown', e => {
      if (e.code === 'Escape' && this.open) this.close();
    });
  },

  show(){
    this.open = true;
    $('review').style.display = 'block';
    document.exitPointerLock();
    const tracks = [
      { id: 'kitchen',  label: 'TRACK 01 — KITCHEN',       st: '8h 41m', hot: true },
      { id: 'hall',     label: 'TRACK 02 — ENTRANCE HALL', st: '8h 39m', hot: false },
      { id: 'library',  label: 'TRACK 03 — LIBRARY',       st: '8h 40m', hot: false },
      { id: 'bedroom',  label: 'TRACK 04 — BEDROOM',       st: '8h 38m', hot: false },
    ];
    $('tracks').innerHTML = tracks.map(t => `
      <div class="track${t.hot ? ' hot' : ''}" data-id="${t.id}">
        <span>${t.label}</span><span class="st">${t.hot ? '&#9650; ANOMALY 02:47:16' : t.st}</span>
      </div>`).join('');
    $('tracks').querySelectorAll('.track').forEach(el => {
      el.addEventListener('click', () => this.openTrack(el.dataset.id));
    });
    this.audio.click();
  },

  openTrack(id){
    this.track = id;
    $('scrub').style.display = 'block';
    // anomaly marker only on the kitchen track
    document.querySelectorAll('#scrubBar .marker').forEach(m => m.remove());
    if (id === 'kitchen'){
      const m = document.createElement('div');
      m.className = 'marker';
      m.style.left = (MARK / NIGHT_LEN * 100) + '%';
      $('scrubBar').appendChild(m);
    }
    this.seek(id === 'kitchen' ? Math.max(0, (MARK - 260) / NIGHT_LEN) : 0.2);
  },

  seek(frac){
    frac = Math.max(0, Math.min(1, frac));
    this._playT = frac * NIGHT_LEN;
    // seeking anywhere near the anomaly lands just before it — the moment
    // must be heard from its beginning
    if (this.track === 'kitchen' && !state.heardVoice &&
        Math.abs(this._playT - MARK) < 900){
      this._playT = MARK - 260;
    }
    $('scrubFill').style.width = (frac * 100) + '%';
    if (this._bed) this._bed.stop();
    this._bed = this.audio.staticBed();
    this.audio.click();
    this._voiceUntil = 0;
  },

  close(){
    this.open = false;
    $('review').style.display = 'none';
    if (this._bed){ this._bed.stop(); this._bed = null; }
    this._playT = -1;
  },

  update(dt){
    if (!this.open || this._playT < 0) return;
    this._playT += dt * 90;   // fast playback — the night skims past under the hiss
    const frac = this._playT / NIGHT_LEN;
    $('scrubFill').style.width = Math.min(100, frac * 100) + '%';
    const t = NIGHT_START + this._playT;
    const hh = Math.floor(t / 3600) % 24, mm = Math.floor(t / 60) % 60, ss = Math.floor(t) % 60;
    $('scrubTime').textContent =
      `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;

    // the moment
    const now = performance.now() / 1000;
    if (this.track === 'kitchen' && !state.heardVoice &&
        this._playT >= MARK && this._playT < MARK + 90){
      state.heardVoice = true;
      const dur = this.audio.evpVoice(0.55);
      this._voiceUntil = now + dur;
      journal.logAudio('Overnight capture — kitchen', '02:47:16', 'evp');
      journal.note(
        'Not words. The shape of words. Female register. Rising and falling — the melody of speech with every consonant stripped out. I have noted it and I am moving on. That is what I do. I note it and I move on.',
        { frag: false });
      save();
      if (this.onVoiceHeard) setTimeout(() => this.onVoiceHeard(), (dur + 1.5) * 1000);
    }

    // waveform: calm static, or the voice-shaped spike
    const ctx = $('reviewWave').getContext('2d');
    const W = 650, Hh = 60;
    ctx.fillStyle = '#0a0a0c'; ctx.fillRect(0, 0, W, Hh);
    const voicing = now < this._voiceUntil;
    ctx.strokeStyle = voicing ? '#c9982f' : '#39423b';
    ctx.beginPath();
    this._anim += dt;
    for (let x = 0; x < W; x++){
      const tt = this._anim * (voicing ? 8 : 2.4) + x * 0.13;
      let a = Math.sin(tt) * Math.sin(tt * 0.41) * (voicing ? 19 : 2.2);
      if (voicing) a *= 0.55 + 0.45 * Math.sin(this._anim * 2.6 + x * 0.018);
      a += (Math.random() - 0.5) * (voicing ? 6 : 2.4);
      ctx[x ? 'lineTo' : 'moveTo'](x, Hh/2 + a);
    }
    ctx.stroke();
  },

  // replay from the journal's audio log
  replayEVP(){
    this.audio.evpVoice(0.5);
  },
};
