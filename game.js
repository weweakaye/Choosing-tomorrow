/* game.js
   Enhanced "Choosing Tomorrow" mobile-style game
   - Replace or add these media files in same folder for full effect:
       bgm.mp3, click.mp3, chime.mp3, suspense.mp3, vision_hit.mp3
   - Optional portrait images:
       liam_neutral.jpg, liam_tired.jpg, liam_strong.jpg, mia_smile.jpg, mia_sad.jpg
*/

/* ---------------- DOM ---------------- */
const startScreen = document.getElementById('startScreen');
const gameScreen  = document.getElementById('gameScreen');
const endScreen   = document.getElementById('endScreen');

const startBtn    = document.getElementById('startBtn');
const loadBtn     = document.getElementById('loadBtn');
const saveBtn     = document.getElementById('saveBtn');
const resetBtn    = document.getElementById('resetBtn');
const musicToggle = document.getElementById('musicToggle');

const portrait    = document.getElementById('portrait');
const portraitGlow= document.getElementById('portraitGlow');
const dialogueSpeaker = document.getElementById('dialogueSpeaker');
const dialogueText    = document.getElementById('dialogueText');
const choiceArea      = document.getElementById('choiceArea');

const sStress = document.getElementById('sStress');
const sKind   = document.getElementById('sKind');
const sFocus  = document.getElementById('sFocus');
const sCourage= document.getElementById('sCourage');

const bgLayer = document.getElementById('bgLayer');
const visionOverlay = document.getElementById('visionOverlay');

const endTitle = document.getElementById('endTitle');
const endDesc  = document.getElementById('endDesc');
const replayBtn= document.getElementById('replayBtn');
const exportBtn= document.getElementById('exportBtn');

const clickAudio = document.getElementById('click');
const bgmAudio   = document.getElementById('bgm');
const chimeAudio = document.getElementById('chime');
const suspenseAudio = document.getElementById('suspense');
const visionHitAudio = document.getElementById('visionHit');

/* ---------------- State ---------------- */
let state = {
  stress: 15,
  kindness: 40,
  focus: 55,
  courage: 30,
  helpedMia: null,
  examChoice: null,
  scene: 'start',
  history: []
};

let musicOn = true;

/* ---------------- Utils ---------------- */
function safePlay(a){
  try{ if(a) a.currentTime = 0, a.play(); }catch(e){}
}
function safeLoop(a,flag){
  try{ if(!a) return; if(flag) a.play(); else a.pause(); } catch(e){}
}
function playClick(){ safePlay(clickAudio); }
function playChime(){ safePlay(chimeAudio); }
function playSuspense(){ safePlay(suspenseAudio); }
function stopSuspense(){ try{ suspenseAudio.pause(); suspenseAudio.currentTime = 0;}catch(e){} }
function playVisionHit(){ safePlay(visionHitAudio); }

function setPortrait(name){
  // simple mapping; image files optional
  const map = {
    'liam_neutral':'liam_neutral.jpg',
    'liam_tired':'liam_tired.jpg',
    'liam_strong':'liam_strong.jpg',
    'mia_smile':'mia_smile.jpg',
    'mia_sad':'mia_sad.jpg'
  };
  if(map[name]){
    portrait.src = map[name];
    portrait.classList.remove('hidden');
    portraitGlow.classList.remove('hidden');
    portrait.style.transform = 'scale(1)';
  } else {
    portrait.classList.add('hidden');
    portraitGlow.classList.add('hidden');
  }
}

/* typewriter effect */
let typeTimer = null;
function typeWriter(text, cb){
  clearInterval(typeTimer);
  dialogueText.innerHTML = '';
  let i = 0;
  const t = text;
  const speed = Math.max(12, 20 - Math.floor(state.focus/10)); // faster when focus high
  typeTimer = setInterval(()=>{
    i++;
    dialogueText.innerHTML = t.slice(0,i);
    if(i >= t.length){ clearInterval(typeTimer); if(cb) cb(); }
  }, speed);
}

/* update HUD */
function updateHUD(){
  sStress.textContent  = 'Stress: ' + state.stress;
  sKind.textContent    = 'Kind: ' + state.kindness;
  sFocus.textContent   = 'Focus: ' + state.focus;
  sCourage.textContent = 'Courage: ' + state.courage;
}

/* change background mood */
function setMood(mood){
  // mood: calm, tense, hopeful, dark, vision
  if(mood === 'calm') bgLayer.style.background = 'linear-gradient(180deg,#eaf6ff,#f9fbff)';
  else if(mood === 'tense') bgLayer.style.background = 'linear-gradient(180deg,#f6e7e7,#fff5f7)';
  else if(mood === 'hopeful') bgLayer.style.background = 'linear-gradient(180deg,#f0fff4,#e9fbee)';
  else if(mood === 'dark') bgLayer.style.background = 'linear-gradient(180deg,#2b2b3a,#0f0f12)';
  else if(mood === 'vision') bgLayer.style.background = 'radial-gradient(circle at 30% 20%, rgba(120,80,200,0.2), rgba(3,5,10,0.9))';
}

/* show vision overlay */
function showVision(text, duration=2800){
  visionOverlay.classList.remove('hidden');
  visionOverlay.innerHTML = `<div class="visionText">${text}</div>`;
  setMood('vision');
  playSuspense();
  playVisionHit();
  // small portrait pulse
  if(!portrait.classList.contains('hidden')) portrait.style.transform = 'scale(1.06)';
  setTimeout(()=>{
    stopSuspense();
    visionOverlay.classList.add('hidden');
    portrait.style.transform = 'scale(1)';
    setMood('dark');
  }, duration);
}

/* set choices easily */
function setChoices(opts){
  choiceArea.innerHTML = '';
  opts.forEach((o, i)=>{
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = o.text;
    b.onclick = ()=>{
      playClick();
      // record history
      state.history.push({ scene: state.scene, choice: o.text });
      o.action();
    };
    // subtle stagger animation
    b.style.animation = `pop .18s ease ${i*60}ms both`;
    choiceArea.appendChild(b);
  });
}

/* small CSS pop animation insertion */
const style = document.createElement('style');
style.innerHTML = `
@keyframes pop { from{ transform:translateY(6px) scale(.98); opacity:0 } to{ transform:none; opacity:1 } }
`;
document.head.appendChild(style);

/* ---------------- Scenes (longer & thrilling) ---------------- */

function startGame(){
  playClick();
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  setMood('calm');
  if(musicOn) safeLoop(bgmAudio, true);
  updateHUD();
  state.scene = 'wake';
  sceneWake();
}

/* scene: waking up */
function sceneWake(){
  setPortrait('liam_tired');
  dialogueSpeaker.textContent = 'Narrator';
  const txt = "You jolt awake — sunlight cuts through your blinds. Today is the midterm you didn't finish preparing for. Your phone vibrates with a message from Mia: 'You coming? I'm lost.'";
  typeWriter(txt, ()=>{
    setChoices([
      { text: "Rush out without breakfast", action: ()=>{
          state.stress += 6; state.focus -= 8; updateHUD(); sceneStreet();
      }},
      { text: "Grab a quick bite and go", action: ()=>{
          state.stress += 2; state.focus += 4; state.kindness += 1; updateHUD(); sceneCafeteria();
      }},
      { text: "Message Mia to wait", action: ()=>{
          state.courage -= 2; state.focus -= 2; updateHUD(); showVision("A flash — you remember leaving a textbook behind once. A small regret lingers.", 2200); setTimeout(sceneStreet, 900); }}
    ]);
  });
}

/* scene: street (tense) */
function sceneStreet(){
  state.scene = 'street';
  setPortrait('liam_neutral');
  setMood('tense');
  dialogueSpeaker.textContent = 'Narrator';
  const txt = "You run through busy streets, heart pounding. You see Mia in the distance, waving frantically. But a stranger bumps into you — a quick choice decides your morning.";
  typeWriter(txt, ()=>{
    setChoices([
      { text: "Stop to help the stranger (slow down)", action: ()=>{
          state.kindness += 2; state.stress -= 3; updateHUD(); sceneMiaMeet();
      }},
      { text: "Dash to Mia (don't delay)", action: ()=>{
          state.stress += 3; state.focus += 3; updateHUD(); sceneMiaMeet();
      }},
      { text: "Ignore Mia and head to exam", action: ()=>{
          state.kindness -= 8; state.stress += 4; updateHUD(); showVision("You see a ghost of your future: classmates you left behind.", 2400); setTimeout(sceneExamEntrance, 900); }}
    ]);
  });
}

/* scene: cafeteria (calm) - optional detour */
function sceneCafeteria(){
  state.scene = 'cafeteria';
  setMood('calm'); setPortrait('liam_neutral');
  dialogueSpeaker.textContent = 'Barista';
  const txt = "You grab a sandwich. A barista smiles — 'Good luck!' — and Mia texts: 'I found the room but the reviewer is gone.'";
  typeWriter(txt, ()=>{
    setChoices([
      { text: "Offer Mia your reviewer", action: ()=>{
          state.kindness += 6; state.focus -= 10; state.stress += 1; updateHUD(); sceneMiaMeet();
      }},
      { text: "Say good luck and go", action: ()=>{
          state.kindness -= 2; state.stress += 1; updateHUD(); sceneMiaMeet();
      }},
    ]);
  });
}

/* scene: meeting Mia (hallway) */
function sceneMiaMeet(){
  state.scene = 'mia';
  setMood('calm'); setPortrait('mia_smile');
  dialogueSpeaker.textContent = 'Mia';
  const txt = "Mia hugs you quickly: 'Thanks for coming. I'm a mess.' She glances at her bag — a review sheet is missing.";
  typeWriter(txt, ()=>{
    setChoices([
      { text: "Search with Mia", action: ()=>{
          state.kindness += 3; state.focus -= 4; updateHUD(); showVision("Your fingers skim an old note — a memory of studying late with Mia.", 2000); sceneExamEntrance();
      }},
      { text: "Give Mia your notes", action: ()=>{
          state.kindness += 8; state.focus -= 12; state.stress += 1; updateHUD(); showVision("Mia smiles like sunrise. You feel warmth.", 1800); sceneExamEntrance();
      }},
      { text: "Ignore and leave for exam", action: ()=>{
          state.kindness -= 6; state.courage += 2; state.stress += 4; updateHUD(); sceneExamEntrance();
      }}
    ]);
  });
}

/* scene: exam entrance, revelation */
function sceneExamEntrance(){
  state.scene = 'examEntry';
  setMood('tense'); setPortrait('liam_tired');
  dialogueSpeaker.textContent = 'Proctor';
  const txt = "In the exam hall, the proctor warns: 'Any dishonest behavior will be noticed.' You spot Mia's reviewer peeking out. The room hums with pressure.";
  typeWriter(txt, ()=>{
    setChoices([
      { text: "Cover the reviewer (protect Mia)", action: ()=>{
          state.kindness += 3; state.courage += 2; updateHUD(); sceneExam();
      }},
      { text: "Use it quietly (cheat)", action: ()=>{
          state.focus += 8; state.stress += 5; state.kindness -= 2; updateHUD(); showVision("A dark vision: the paper burns, and you can't forget the look on Mia's face.", 2600); sceneExam();
      }},
      { text: "Report to proctor (risky honesty)", action: ()=>{
          state.courage += 8; state.kindness -= 1; state.stress += 3; updateHUD(); showVision("A white vision: you stand alone but steady.", 1900); sceneExam();
      }}
    ]);
  });
}

/* scene: during exam (mini events) */
function sceneExam(){
  state.scene = 'exam';
  setMood('dark'); setPortrait('liam_tired');
  dialogueSpeaker.textContent = 'Narrator';
  const txt = "Pens scratch. Your heart races. You must answer a tricky question in three ways: trust memory, guess, or sneak a peek.";
  typeWriter(txt, ()=>{
    setChoices([
      { text: "Trust your memory (honest)", action: ()=>{
          state.focus += 4; state.stress -= 2; state.kindness += 1; updateHUD(); showVision("A clear flash — the right formula reveals itself.", 1400); sceneAfterExam();
      }},
      { text: "Guess nervously", action: ()=>{
          state.focus -= 3; state.stress += 2; updateHUD(); sceneAfterExam();
      }},
      { text: "Cheat one line", action: ()=>{
          state.focus += 8; state.stress += 6; state.kindness -= 3; updateHUD(); showVision("A guilt-spark: faces blur and the classroom grows distant.", 2400); sceneAfterExam();
      }}
    ]);
  });
}

/* scene: after exam (free period) with branching events */
function sceneAfterExam(){
  state.scene = 'afterExam';
  setMood('hopeful'); setPortrait('liam_neutral');
  dialogueSpeaker.textContent = 'Friend';
  const txt = "You step out. The sun is lower. Mia waits outside, trembling. Your choices echo louder now.";
  typeWriter(txt, ()=>{
    setChoices([
      { text: "Comfort Mia", action: ()=>{
          state.kindness += 4; state.courage += 2; updateHUD(); showVision("You dream of a future where you both support each other.", 2100); sceneStudyGroup();
      }},
      { text: "Walk away to clear mind", action: ()=>{
          state.stress -= 3; state.focus += 2; updateHUD(); sceneStudyGroup();
      }},
      { text: "Challenge yourself: tutor Mia later", action: ()=>{
          state.courage += 5; state.kindness += 2; state.focus -= 3; updateHUD(); sceneStudyGroup();
      }}
    ]);
  });
}

/* scene: study group or consequences */
function sceneStudyGroup(){
  state.scene = 'study';
  setMood('calm'); setPortrait('liam_strong');
  dialogueSpeaker.textContent = 'Narrator';
  const txt = "A few days later, you meet classmates for a study session. The choices you made weigh on conversations — revealing or hiding your path.";
  typeWriter(txt, ()=>{
    setChoices([
      { text: "Openly share how you prepared", action: ()=>{
          state.courage += 3; state.kindness += 1; state.focus += 2; updateHUD(); sceneFinalTest();
      }},
      { text: "Keep quiet about your choices", action: ()=>{
          state.courage -= 2; state.stress += 2; updateHUD(); sceneFinalTest();
      }},
      { text: "Confess a mistake and try to make amends", action: ()=>{
          state.courage += 6; state.kindness += 4; state.stress -= 2; updateHUD(); showVision("A healing vision: broken things mending slowly.", 2200); sceneFinalTest();
      }}
    ]);
  });
}

/* final test or culminating event */
function sceneFinalTest(){
  state.scene = 'final';
  setMood('tense'); setPortrait('liam_neutral');
  dialogueSpeaker.textContent = 'Proctor';
  const txt = "Final test day arrives — this one matters more. The choices you made earlier influence how others see you and how you see yourself.";
  typeWriter(txt, ()=>{
    setChoices([
      { text: "Give honest answers (be brave)", action: ()=>{
          state.focus += 5; state.courage += 3; updateHUD(); finalizeEnding('honest');
      }},
      { text: "Rely on shortcuts (old habit)", action: ()=>{
          state.focus += 4; state.stress -= 1; state.kindness -= 2; updateHUD(); finalizeEnding('cheatAgain');
      }},
      { text: "Step out and walk away (reflect)", action: ()=>{
          state.courage -= 1; state.stress -= 2; updateHUD(); finalizeEnding('reflect'); 
      }}
    ]);
  });
}

/* ---------------- Endings ---------------- */

function finalizeEnding(path){
  // determine ending text & visuals
  gameScreen.classList.add('hidden');
  endScreen.classList.remove('hidden');

  // compile summary for export if desired
  const summary = {
    stress: state.stress, kindness: state.kindness, focus: state.focus, courage: state.courage, history: state.history
  };

  // multiple endings
  if(path === 'cheatAgain' || state.kindness < 10){
    endTitle.textContent = "Isolation Ending";
    endDesc.textContent = "You took shortcuts, gained temporary wins, but found yourself more alone. The grades came, but the warmth didn't.";
    setMood('dark'); playVisionHit();
  } else if(path === 'honest' && state.kindness >= 15 && state.courage >= 18){
    endTitle.textContent = "Redemption Ending";
    endDesc.textContent = "You chose honesty and care. Trust grew between you and others — and a new door opened.";
    setMood('hopeful'); playChime();
  } else if(path === 'reflect' && state.courage < 10){
    endTitle.textContent = "Reflection Ending";
    endDesc.textContent = "You stepped away to think. Not a failure — a pause. Paths can be changed.";
    setMood('calm'); playChime();
  } else if(state.stress > 40 && state.focus < 30){
    endTitle.textContent = "Burnout Ending";
    endDesc.textContent = "Too much stress, too little focus. It’s a hard lesson: rest matters more than hustle alone.";
    setMood('dark'); showVision("Your vision fades into a blur — you promise to slow down next time.", 2600);
  } else {
    endTitle.textContent = "Balanced Ending";
    endDesc.textContent = "You found a balance: you made mistakes but learned. Friends stayed, and you found small joy.";
    setMood('hopeful'); playChime();
  }


  // replay
  replayBtn.onclick = ()=> {
    location.reload();
  };
}

/* ---------------- Save / Load / Controls ---------------- */

function saveGame(){
  try{
    localStorage.setItem('ct_save', JSON.stringify(state));
    alert('Game saved locally.');
  }catch(e){ alert('Save failed.'); }
}

function loadGame(){
  const s = localStorage.getItem('ct_save');
  if(!s){ alert('No save found.'); return; }
  try{
    state = JSON.parse(s);
    updateHUD();
    alert('Loaded save. Continue from last recorded scene.');
    // naive resume — go to wake or show custom message
    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    sceneWake(); // or better: resume using state.scene (left simple)
  }catch(e){ alert('Load failed.'); }
}

/* ---------------- Init / listeners ---------------- */
document.addEventListener('DOMContentLoaded', ()=>{
  // wire up basic buttons
  startBtn.onclick = ()=> startGame();
  loadBtn.onclick = ()=> loadGame();
  document.getElementById('saveBtn').onclick = ()=> { playClick(); saveGame(); };
  resetBtn.onclick = ()=> { if(confirm('Reset game?')) location.reload(); };
  musicToggle.onclick = ()=>{
    musicOn = !musicOn;
    musicToggle.textContent = musicOn ? 'Music: On' : 'Music: Off';
    safeLoop(bgmAudio, musicOn);
    playClick();
  };
  document.getElementById('replayBtn').onclick = ()=> location.reload();

  // initial UI
  updateHUD();
  setMood('calm');
  setPortrait('liam_neutral');

  // friendly autoplay attempt for audio
  try{ bgmAudio.volume = 0.3; bgmAudio.play().catch(()=>{}); }catch(e){}
});
