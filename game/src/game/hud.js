// Diegetic HUD: interaction prompt card, objective line, captions
// (Mara's journal voice / EVP), screen fades, the EVP waveform strip.
const $ = id => document.getElementById(id);

export const hud = {
  promptEl: null, objEl: null, capEl: null, fadeEl: null,
  waveEl: null, waveCtx: null,
  _capTimer: null, waveMode: 'off', waveT: 0,

  init(){
    this.promptEl = $('prompt');
    this.objEl = $('objective');
    this.capEl = $('caption');
    this.fadeEl = $('fade');
    this.waveEl = $('wave');
    this.waveCtx = this.waveEl.getContext('2d');
    $('jhint').textContent = 'J — JOURNAL';
  },

  prompt(text){
    if (text){
      this.promptEl.textContent = text;
      this.promptEl.style.opacity = 1;
    } else {
      this.promptEl.style.opacity = 0;
    }
  },

  objective(text){
    this.objEl.style.opacity = 0;
    setTimeout(() => {
      this.objEl.textContent = text ? '— ' + text + ' —' : '';
      if (text) this.objEl.style.opacity = 1;
    }, 1100);
  },

  // Mara's internal voice / Eleanor / system captions
  caption(text, seconds = 4, ev = false){
    clearTimeout(this._capTimer);
    this.capEl.classList.toggle('ev', ev);
    this.capEl.textContent = text;
    this.capEl.style.opacity = 1;
    this._capTimer = setTimeout(() => { this.capEl.style.opacity = 0; }, seconds * 1000);
  },

  fade(toBlack, seconds = 2.4){
    this.fadeEl.style.transition = `opacity ${seconds}s`;
    this.fadeEl.classList.toggle('show', toBlack);
    requestAnimationFrame(() => { this.fadeEl.style.opacity = toBlack ? 1 : 0; });
  },

  gadget(text){ $('gadget').textContent = text; },

  /* ---------- EVP waveform strip ---------- */
  showWave(mode){ // 'off' | 'idle' | 'voice'
    this.waveMode = mode;
    this.waveEl.style.display = mode === 'off' ? 'none' : 'block';
  },

  drawWave(dt){
    if (this.waveMode === 'off') return;
    this.waveT += dt;
    const ctx = this.waveCtx, W = 300, Hh = 46;
    ctx.fillStyle = 'rgba(8,8,8,1)';
    ctx.fillRect(0, 0, W, Hh);
    const voice = this.waveMode === 'voice';
    ctx.strokeStyle = voice ? '#c9982f' : '#3f5a44';
    ctx.beginPath();
    for (let x = 0; x < W; x++){
      const t = this.waveT * (voice ? 9 : 3) + x * 0.11;
      let a = Math.sin(t) * Math.sin(t * 0.37) * (voice ? 14 : 2.5);
      if (voice) a *= 0.6 + 0.4 * Math.sin(this.waveT * 2.2 + x * 0.02); // cadence
      a += (Math.random() - 0.5) * (voice ? 5 : 2);
      ctx[x ? 'lineTo' : 'moveTo'](x, Hh/2 + a);
    }
    ctx.stroke();
  },
};
