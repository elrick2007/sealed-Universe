// Mara's journal — the game's only menu. Notes auto-populate from what she
// examines; the floor plan sketches itself room by room; the audio log keeps
// every capture. Cream paper, her handwriting, her state of mind.
import { state, save } from './state.js';

const $ = id => document.getElementById(id);

export const journal = {
  open: false, rooms: null, audio: null, onPlayEVP: null,

  init(rooms, audioEngine){
    this.rooms = rooms;
    this.audio = audioEngine;
    document.querySelectorAll('#journal .tabs div').forEach(el => {
      el.addEventListener('click', () => this.showTab(el.dataset.tab));
    });
  },

  toggle(){
    this.open = !this.open;
    $('journal').style.display = this.open ? 'block' : 'none';
    if (this.open){
      this.renderNotes();
      this.renderPlan();
      this.renderAudio();
      this.renderItems();
      if (this.audio) this.audio.paper();
    }
    return this.open;
  },

  showTab(tab){
    document.querySelectorAll('#journal .tabs div').forEach(el =>
      el.classList.toggle('on', el.dataset.tab === tab));
    $('pageNotes').style.display = tab === 'notes' ? 'block' : 'none';
    $('pageAudio').style.display = tab === 'audio' ? 'block' : 'none';
    $('pageItems').style.display = tab === 'items' ? 'block' : 'none';
    $('pagePlan').style.display  = tab === 'plan'  ? 'block' : 'none';
  },

  renderItems(){
    const page = $('pageItems');
    page.innerHTML = state.inventory.map(it => `
      <div class="invItem">
        <div class="nm">${esc(it.name)}</div>
        <div class="ds">${esc(it.desc)}</div>
      </div>`).join('') ||
      '<div class="entry">Pockets: three iron keys, a phone with no signal worth keeping, and a press pass I should throw away.</div>';
  },

  note(text, { frag = false, t = null } = {}){
    state.notes.push({ t: t || timeLabel(), text, frag });
    save();
  },

  logAudio(label, mark, kind){
    state.audioLog.push({ label, mark, kind });
    save();
  },

  renderNotes(){
    const page = $('pageNotes');
    page.innerHTML = state.notes.map(n => `
      <div class="entry${n.frag ? ' frag' : ''}">
        <div class="t">${n.t}</div>${esc(n.text)}
      </div>`).join('') ||
      '<div class="entry"><div class="t">NOV 28</div>Writing retreat. Six months. Nobody knows I’m here. That’s the point.</div>';
    page.scrollTop = page.scrollHeight;
  },

  renderAudio(){
    const page = $('pageAudio');
    if (!state.audioLog.length){
      page.innerHTML = '<div class="entry">No captures yet. The recorder is patient.</div>';
      return;
    }
    page.innerHTML = state.audioLog.map((a, i) => `
      <div class="audioRow" data-i="${i}">
        <div class="play">&#9654;</div>
        <div>${esc(a.label)}</div>
        <div class="mark">${esc(a.mark)}</div>
      </div>`).join('');
    page.querySelectorAll('.audioRow .play').forEach(btn => {
      btn.addEventListener('click', e => {
        const i = +e.target.closest('.audioRow').dataset.i;
        const item = state.audioLog[i];
        if (item.kind === 'evp' && this.onPlayEVP) this.onPlayEVP();
      });
    });
  },

  renderPlan(){
    const c = $('planCanvas'), x = c.getContext('2d');
    x.clearRect(0, 0, c.width, c.height);
    x.save();
    // pencil-on-paper transform: house x[-19..13] z[-10..11] → canvas
    const sx = 19, sz = 18, ox = c.width/2 + 30, oz = 230;
    const px = (wx, wz) => [ox + wx * sx, oz - wz * sz * -1];
    x.strokeStyle = '#4a4438'; x.lineWidth = 1.6;
    x.font = '11px Georgia'; x.fillStyle = '#5a5142';
    let drawn = 0;
    for (const r of this.rooms){
      if (!state.visited[r.id] || r.id === 'drive') continue;
      if (r.floor === 1) continue; // ground floor sheet only in the slice
      drawn++;
      const [ax, az] = px(r.minX, r.minZ), [bx, bz] = px(r.maxX, r.maxZ);
      // hand-drawn jitter
      x.save();
      x.translate((Math.sin(r.minX*7) * 1.4), (Math.cos(r.minZ*5) * 1.4));
      x.strokeRect(Math.min(ax,bx), Math.min(az,bz), Math.abs(bx-ax), Math.abs(bz-az));
      x.fillText(r.name, Math.min(ax,bx) + 5, Math.min(az,bz) + 14);
      x.restore();
    }
    if (!drawn){
      x.fillText('(nothing surveyed yet)', 60, 60);
    }
    // the west wing — marked but unmapped, until it isn't
    if (state.visited['westwing']){
      x.fillStyle = '#6e1f1f';
      x.fillText('WEST WING: CORRIDOR 14FT TOO LONG. MEASURED TWICE.', 30, 415);
    } else if (state.visited['corridor']){
      x.fillStyle = '#6e1f1f';
      x.fillText(state.clockSolved
        ? 'WEST WING — THE IRON KEY. W.'
        : 'WEST WING — LOCKED. NONE OF THE KEYS FIT?', 30, 415);
    }
    if (state.visited['gallery']){
      x.fillStyle = '#5a5142';
      x.fillText('(second floor — separate sheet, not yet drawn)', 30, 440);
    }
    x.restore();
  },
};

function esc(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function timeLabel(){
  // diegetic date — Act 1 spans Nov 28–29
  return state.slept ? 'NOV 29' : 'NOV 28';
}
