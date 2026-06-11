// Game flags + persistence. Act 1 progression:
// arrive → enter → exploredKitchenWall → recordersPlaced(4) → slept → heardVoice
const KEY = 'tww_act1_save';

export const state = {
  phase: 'title',          // title | drive | explore | recorders | night | morning | review | done
  entered: false,
  kitchenWallFelt: false,
  recordersPlaced: [],     // room ids
  slept: false,
  heardVoice: false,
  visited: {},             // room id -> true
  notes: [],               // journal entries {t, text, frag}
  audioLog: [],            // {label, mark, kind}
  stair7Done: false,
  keysExamined: false,
};

export function save(){
  try {
    localStorage.setItem(KEY, JSON.stringify({
      phase: state.phase, entered: state.entered,
      kitchenWallFelt: state.kitchenWallFelt,
      recordersPlaced: state.recordersPlaced,
      slept: state.slept, heardVoice: state.heardVoice,
      visited: state.visited, notes: state.notes, audioLog: state.audioLog,
    }));
  } catch(e){ /* private mode etc. */ }
}

export function clearSave(){
  try { localStorage.removeItem(KEY); } catch(e){}
}
