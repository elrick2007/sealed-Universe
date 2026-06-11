// All audio is synthesised — no samples. Wind, room tone, footsteps, doors,
// the breathing wall, Eleanor's four-note theme, and the 2:47 AM
// voice-shaped silence: speech with every consonant stripped away.
export class AudioEngine {
  constructor(){
    this.ctx = null;
    this.started = false;
  }

  start(){
    if (this.started) return;
    this.started = true;
    const ctx = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = ctx.createGain();
    this.master.gain.value = 0.9 * (this._pendingVol ?? 1);
    const comp = ctx.createDynamicsCompressor();
    this.master.connect(comp); comp.connect(ctx.destination);

    // generated impulse for a stone-room reverb
    this.verb = ctx.createConvolver();
    this.verb.buffer = this._impulse(2.6, 3.2);
    this.verbGain = ctx.createGain(); this.verbGain.gain.value = 0.18;
    this.verb.connect(this.verbGain); this.verbGain.connect(this.master);

    this._noiseBuf = this._noise(2);
    this._startAmbience();
  }

  _impulse(sec, decay){
    const rate = this.ctx.sampleRate, len = rate * sec;
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++){
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++)
        d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, decay);
    }
    return buf;
  }

  _noise(sec){
    const rate = this.ctx.sampleRate, len = rate * sec;
    const buf = this.ctx.createBuffer(1, len, rate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random()*2-1;
    return buf;
  }

  _noiseSrc(loop = true){
    const s = this.ctx.createBufferSource();
    s.buffer = this._noiseBuf; s.loop = loop;
    return s;
  }

  /* ---------- ambience: wind outside / room tone inside ---------- */
  _startAmbience(){
    const ctx = this.ctx;
    // wind
    const wind = this._noiseSrc();
    const wf = ctx.createBiquadFilter(); wf.type = 'bandpass';
    wf.frequency.value = 300; wf.Q.value = 0.6;
    this.windGain = ctx.createGain(); this.windGain.gain.value = 0.16;
    wind.connect(wf); wf.connect(this.windGain); this.windGain.connect(this.master);
    wind.start();
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.09;
    const lg = ctx.createGain(); lg.gain.value = 140;
    lfo.connect(lg); lg.connect(wf.frequency); lfo.start();

    // interior room tone — low rumble + faint mains hum
    const rt = this._noiseSrc();
    const rf = ctx.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 90;
    this.roomGain = ctx.createGain(); this.roomGain.gain.value = 0.0;
    rt.connect(rf); rf.connect(this.roomGain); this.roomGain.connect(this.master);
    rt.start();
    const hum = ctx.createOscillator(); hum.frequency.value = 50; hum.type = 'sine';
    this.humGain = ctx.createGain(); this.humGain.gain.value = 0.0;
    hum.connect(this.humGain); this.humGain.connect(this.master); hum.start();

    // THE FREQUENCY — subsonic presence, raised during events
    const fq = ctx.createOscillator(); fq.frequency.value = 31; fq.type = 'sine';
    this.freqGain = ctx.createGain(); this.freqGain.gain.value = 0.0;
    fq.connect(this.freqGain); this.freqGain.connect(this.master); fq.start();
  }

  setInside(inside){
    if (!this.started) return;
    const t = this.ctx.currentTime;
    this.windGain.gain.linearRampToValueAtTime(inside ? 0.035 : 0.16, t + 1.5);
    this.roomGain.gain.linearRampToValueAtTime(inside ? 0.10 : 0.0, t + 1.5);
    this.humGain.gain.linearRampToValueAtTime(inside ? 0.006 : 0.0, t + 1.5);
  }

  setFrequency(level){ // 0..1 — supernatural pressure
    if (!this.started) return;
    this.freqGain.gain.linearRampToValueAtTime(level * 0.22, this.ctx.currentTime + 2);
  }

  /* ---------- one-shots ---------- */
  _env(gainNode, t0, a, peak, d){
    const g = gainNode.gain;
    g.setValueAtTime(0.0001, t0);
    g.exponentialRampToValueAtTime(peak, t0 + a);
    g.exponentialRampToValueAtTime(0.0001, t0 + a + d);
  }

  footstep(surface = 'wood'){
    if (!this.started) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const s = this._noiseSrc(false);
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    s.connect(f); f.connect(g); g.connect(this.master); g.connect(this.verb);
    if (surface === 'gravel'){
      f.type = 'highpass'; f.frequency.value = 900;
      this._env(g, t, 0.012, 0.16, 0.13);
      // second crunch
      const s2 = this._noiseSrc(false), g2 = ctx.createGain();
      s2.connect(f); this._env(g2, t + 0.07, 0.01, 0.08, 0.1);
      s2.start(t + 0.07); s2.stop(t + 0.3);
    } else if (surface === 'stone'){
      f.type = 'bandpass'; f.frequency.value = 480; f.Q.value = 1.4;
      this._env(g, t, 0.008, 0.12, 0.16);
    } else { // wood — plus a low knock
      f.type = 'bandpass'; f.frequency.value = 240; f.Q.value = 1.1;
      this._env(g, t, 0.008, 0.13, 0.12);
      const o = ctx.createOscillator(); o.frequency.value = 70 + Math.random()*20;
      const og = ctx.createGain();
      o.connect(og); og.connect(this.master);
      this._env(og, t, 0.005, 0.05, 0.09);
      o.start(t); o.stop(t + 0.15);
    }
    s.start(t); s.stop(t + 0.4);
  }

  // the 7th step: something like the word "no", compressed and reversed
  stairSeven(){
    if (!this.started) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(180, t);
    o.frequency.linearRampToValueAtTime(95, t + 0.34);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 5;
    f.frequency.setValueAtTime(350, t);
    f.frequency.linearRampToValueAtTime(700, t + 0.18);     // "n"→"o" backwards
    f.frequency.linearRampToValueAtTime(280, t + 0.34);
    const g = ctx.createGain();
    o.connect(f); f.connect(g); g.connect(this.master); g.connect(this.verb);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    o.start(t); o.stop(t + 0.45);
  }

  doorCreak(long = false){
    if (!this.started) return;
    const ctx = this.ctx, t = ctx.currentTime, dur = long ? 1.6 : 0.8;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(140, t);
    for (let i = 0; i < 6; i++)
      o.frequency.linearRampToValueAtTime(120 + Math.random()*90, t + dur * (i+1)/6);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass';
    f.frequency.value = 600; f.Q.value = 9;
    const g = ctx.createGain();
    o.connect(f); f.connect(g); g.connect(this.master); g.connect(this.verb);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.045, t + 0.1);
    g.gain.linearRampToValueAtTime(0.02, t + dur*0.7);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.1);
  }

  keys(){
    if (!this.started) return;
    const ctx = this.ctx, t = ctx.currentTime;
    for (let i = 0; i < 5; i++){
      const o = ctx.createOscillator(); o.type = 'square';
      o.frequency.value = 2400 + Math.random()*2600;
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value = 2000;
      o.connect(f); f.connect(g); g.connect(this.master);
      const tt = t + i*0.05 + Math.random()*0.03;
      this._env(g, tt, 0.002, 0.025, 0.05);
      o.start(tt); o.stop(tt + 0.08);
    }
  }

  unlock(){
    if (!this.started) return;
    const ctx = this.ctx, t = ctx.currentTime;
    [320, 180].forEach((fr, i) => {
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = fr;
      const g = ctx.createGain();
      o.connect(g); g.connect(this.master); g.connect(this.verb);
      this._env(g, t + i*0.16, 0.004, 0.06, 0.09);
      o.start(t + i*0.16); o.stop(t + i*0.16 + 0.12);
    });
  }

  setVolume(v){ // 0..1 — settings menu
    if (!this.started){ this._pendingVol = v; return; }
    this.master.gain.linearRampToValueAtTime(0.9 * v, this.ctx.currentTime + 0.1);
  }

  /* ---------- puzzle one-shots ---------- */
  pianoNote(freq, vol = 0.12){
    if (!this.started) return;
    const ctx = this.ctx, t = ctx.currentTime;
    // two slightly detuned triangles — an old, not-quite-tuned upright
    [0, 3.5].forEach(det => {
      const o = ctx.createOscillator(); o.type = 'triangle';
      o.frequency.value = freq; o.detune.value = det;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2200;
      const g = ctx.createGain();
      o.connect(f); f.connect(g); g.connect(this.master); g.connect(this.verb);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      o.start(t); o.stop(t + 1.7);
    });
  }

  wrongNotes(){ // dissonant cluster — puzzle reset
    if (!this.started) return;
    [138.6, 146.8, 155.6].forEach(fr => this.pianoNote(fr, 0.07));
  }

  hollowKnock(){ // knuckles on a wall with nothing behind it
    if (!this.started) return;
    const ctx = this.ctx, t = ctx.currentTime;
    [0, 0.22].forEach((dt, i) => {
      const o = ctx.createOscillator(); o.frequency.value = i ? 96 : 120;
      const g = ctx.createGain();
      o.connect(g); g.connect(this.master); g.connect(this.verb);
      this._env(g, t + dt, 0.004, 0.14, 0.32);
      o.start(t + dt); o.stop(t + dt + 0.4);
    });
  }

  mechanism(){ // hidden drawer / compartment sliding open
    if (!this.started) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const s = this._noiseSrc(false);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass';
    f.frequency.setValueAtTime(300, t);
    f.frequency.linearRampToValueAtTime(700, t + 0.5);
    f.Q.value = 3;
    const g = ctx.createGain();
    s.connect(f); f.connect(g); g.connect(this.master); g.connect(this.verb);
    this._env(g, t, 0.03, 0.08, 0.55);
    s.start(t); s.stop(t + 0.7);
    // the latch
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 420;
    const og = ctx.createGain();
    o.connect(og); og.connect(this.master);
    this._env(og, t + 0.5, 0.003, 0.05, 0.06);
    o.start(t + 0.5); o.stop(t + 0.62);
  }

  click(){ // recorder / UI
    if (!this.started) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 1400;
    const g = ctx.createGain();
    o.connect(g); g.connect(this.master);
    this._env(g, t, 0.002, 0.04, 0.03);
    o.start(t); o.stop(t + 0.05);
  }

  paper(){
    if (!this.started) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const s = this._noiseSrc(false);
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1800;
    const g = ctx.createGain();
    s.connect(f); f.connect(g); g.connect(this.master);
    this._env(g, t, 0.02, 0.05, 0.18);
    s.start(t); s.stop(t + 0.3);
  }

  /* ---------- the breathing wall — 5s in, 5s out ---------- */
  startBreathing(){
    if (!this.started || this.breath) return;
    const ctx = this.ctx;
    const s = this._noiseSrc();
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220;
    const g = ctx.createGain(); g.gain.value = 0;
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start();
    this.breath = { src: s, gain: g, filter: f, level: 0 };
  }
  setBreathing(level, phase){ // phase: 0..1 within 10s cycle
    if (!this.breath) return;
    const breathe = Math.sin(phase * Math.PI * 2) * 0.5 + 0.5;
    this.breath.gain.gain.value = level * (0.025 + breathe * 0.075);
    this.breath.filter.frequency.value = 160 + breathe * 160;
  }

  /* ---------- Eleanor's theme: four notes, barely there ---------- */
  eleanorTheme(volume = 0.05, detune = 0){
    if (!this.started) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const notes = [329.6, 392.0, 370.0, 293.7]; // E4 G4 F#4 D4
    notes.forEach((fr, i) => {
      const o = ctx.createOscillator(); o.type = 'triangle';
      o.frequency.value = fr; o.detune.value = detune;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1200;
      const g = ctx.createGain();
      o.connect(f); f.connect(g); g.connect(this.master); g.connect(this.verb);
      const tt = t + i * 0.9;
      g.gain.setValueAtTime(0.0001, tt);
      g.gain.exponentialRampToValueAtTime(volume, tt + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, tt + 2.2);
      o.start(tt); o.stop(tt + 2.4);
    });
  }

  /* ---------- THE 2:47 AM VOICE — speech with consonants stripped ---------- */
  // A whispering female register: noise pushed through moving vowel formants.
  // Returns the duration in seconds.
  evpVoice(volume = 0.5){
    if (!this.started) return 0;
    const ctx = this.ctx, t0 = ctx.currentTime;
    // vowel formant pairs (F1, F2) — ah, eh, oh, ee...
    const vowels = [
      [700, 1220], [530, 1840], [450, 800], [300, 2290],
      [640, 1190], [490, 1350], [560, 845], [370, 1900],
    ];
    // a sentence-shaped phrase: rises, hesitates, falls. Three "words".
    const phrase = [
      { v: [0, 1, 4], dur: 1.1 },
      { v: [2, 5, 3, 7], dur: 1.6 },
      { v: [6, 4, 2], dur: 1.4 },
    ];
    const src = this._noiseSrc();
    const pre = ctx.createBiquadFilter(); pre.type = 'bandpass';
    pre.frequency.value = 1000; pre.Q.value = 0.4;
    const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 9;
    const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 11;
    const g = ctx.createGain(); g.gain.value = 0;
    const g2 = ctx.createGain(); g2.gain.value = 0;
    src.connect(pre);
    pre.connect(f1); f1.connect(g);
    pre.connect(f2); f2.connect(g2);
    const out = ctx.createGain(); out.gain.value = volume;
    g.connect(out); g2.connect(out);
    out.connect(this.master); out.connect(this.verb);

    let t = t0 + 0.3;
    const gaps = 0.45;
    for (const word of phrase){
      const per = word.dur / word.v.length;
      g.gain.setValueAtTime(0.0001, t - 0.06);
      g2.gain.setValueAtTime(0.0001, t - 0.06);
      for (let i = 0; i < word.v.length; i++){
        const [a, b] = vowels[word.v[i]];
        const tt = t + i * per;
        f1.frequency.linearRampToValueAtTime(a, tt + per*0.7);
        f2.frequency.linearRampToValueAtTime(b, tt + per*0.7);
        // cadence — the melody of speech with no words in it
        const sw = 0.5 + 0.5 * Math.sin(i * 1.7 + word.dur);
        g.gain.linearRampToValueAtTime(0.25 + sw*0.2, tt + per*0.35);
        g2.gain.linearRampToValueAtTime(0.18 + sw*0.15, tt + per*0.35);
        g.gain.linearRampToValueAtTime(0.1, tt + per*0.95);
        g2.gain.linearRampToValueAtTime(0.08, tt + per*0.95);
      }
      t += word.dur;
      g.gain.linearRampToValueAtTime(0.0001, t + 0.05);
      g2.gain.linearRampToValueAtTime(0.0001, t + 0.05);
      t += gaps;
    }
    const total = t - t0 + 0.4;
    src.start(t0); src.stop(t0 + total);
    return total;
  }

  // playback static — recorder hiss bed under review playback
  staticBed(){
    if (!this.started) return null;
    const ctx = this.ctx;
    const s = this._noiseSrc();
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3000;
    const g = ctx.createGain(); g.gain.value = 0.012;
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start();
    return { stop(){ try { s.stop(); } catch(e){} } };
  }

  /* ---------- the night passing ---------- */
  sleepDrone(){
    if (!this.started) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(55, t);
    o.frequency.linearRampToValueAtTime(38, t + 6);
    const g = ctx.createGain();
    o.connect(g); g.connect(this.master);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.08, t + 2);
    g.gain.linearRampToValueAtTime(0.0001, t + 7);
    o.start(t); o.stop(t + 7.5);
  }

  thud(){ // wardrobe drift, distant knocks
    if (!this.started) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.frequency.value = 58;
    const g = ctx.createGain();
    o.connect(g); g.connect(this.master); g.connect(this.verb);
    this._env(g, t, 0.005, 0.12, 0.5);
    o.start(t); o.stop(t + 0.6);
  }
}
