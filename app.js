// app.js — Orchestrator & bootstrapper
// ------------------------------------------------------------
// Responsibilities:
// - Boot the app, wire core services, and mount features.
// - Maintain global state (user profile, progress, settings).
// - Register routes to swap panels.
// - Coordinate lazy-loading of feature modules to keep bundles small.

import { initThemeSwitcher, applySavedTheme } from './core/theme.js';
import { Router } from './core/router.js';
import { load, save, resetAll } from './core/storage.js';
import { formatPercent } from './core/utils.js';

// Data
import { LETTERS } from './data/letters.js';
import { NIKUD } from './data/nikud.js';

// Global app state kept minimal & serializable
export const AppState = {
  started: false,
  progress: { masteredLetters: {}, xp: 0 },
  goals: [
    'تعلّم 5 حروف جديدة',
    'إنهاء تمرين تتبّع واحد',
    'قراءة 3 كلمات بسيطة'
  ],
  badges: [],
};

// Elements cache
const els = {
  panels: {
    flashcards: document.getElementById('panel-flashcards'),
    trace: document.getElementById('panel-trace'),
    syllables: document.getElementById('panel-syllables'),
    reading: document.getElementById('panel-reading'),
    progress: document.getElementById('panel-progress'),
  },
  progressPill: document.getElementById('progress-pill'),
  btnStart: document.getElementById('btn-start'),
  btnReset: document.getElementById('btn-reset'),
  btnReview: document.getElementById('btn-review'),
  lettersGrid: document.getElementById('letters-grid'),
  goalsList: document.getElementById('goals-list'),
  badgesList: document.getElementById('badges-list'),
  stats: document.getElementById('stats'),
};

// Simple Event Bus
export const bus = new EventTarget();
export const emit = (name, detail) => bus.dispatchEvent(new CustomEvent(name, { detail }));
export const on = (name, fn) => bus.addEventListener(name, fn);

// -----------------------------
// Boot
// -----------------------------
(async function boot(){
  // Apply persisted theme first to avoid FOUC
  applySavedTheme();
  initThemeSwitcher();

  // Load saved state
  const saved = load('app-state');
  if(saved){
    try{ Object.assign(AppState, saved); }catch{ /* noop */ }
  }
  updateProgressUI();
  hydrateProgressLists();

  // Router: define routes → show corresponding panels
  const router = new Router({
    default: 'progress',
    onChange: (route)=> swapPanels(route)
  });
  router.register('progress');
  router.register('flashcards', async () => {
    // Lazy-load feature
    const mod = await import('./features/flashcards.js');
    mod.mount({ container: els.lettersGrid, state: AppState, onProgress });
  });
  router.register('trace', async () => {
    const mod = await import('./features/trace.js');
    mod.mount({ hostId: 'trace-host', state: AppState, onProgress });
  });
  router.register('syllables', async () => {
    const mod = await import('./features/syllables.js');
    mod.mount({ hostId: 'syllables-lab', letters: LETTERS, nikud: NIKUD, onProgress });
  });
  router.register('reading', async () => {
    const mod = await import('./features/reading.js');
    mod.mount({ hostId: 'reading-host', letters: LETTERS, nikud: NIKUD, onProgress });
  });
  router.start();

  // Toolbar actions
  els.btnStart.addEventListener('click', ()=> router.go('flashcards'));
  els.btnReset.addEventListener('click', ()=> {
    if(confirm('هل تريد تصفير تقدّمك؟')){
      resetAll();
      location.reload();
    }
  });
  els.btnReview.addEventListener('click', ()=> {
    // Simple review flow: go to flashcards with filtered set of weak letters
    const weak = Object.entries(AppState.progress.masteredLetters)
      .filter(([k,v]) => v.score < 0.6)
      .map(([k]) => k);
    window.sessionStorage.setItem('review-set', JSON.stringify(weak));
    location.hash = '#/flashcards';
  });

  // Listen for progress events from features
  on('progress:letter', (e)=> handleLetterProgress(e.detail));
})()

// -----------------------------
// UI helpers
// -----------------------------
function swapPanels(target){
  Object.entries(els.panels).forEach(([name, el])=>{
    el.hidden = name !== target;
  });
}

function updateProgressUI(){
  const pct = overallPercent();
  els.progressPill.textContent = `التقدّم: ${formatPercent(pct)}`;
}

function hydrateProgressLists(){
  els.goalsList.innerHTML = AppState.goals.map(g=>`<li>✅ ${g}</li>`).join('');
  els.badgesList.innerHTML = AppState.badges.length
    ? AppState.badges.map(b=>`<li>🏅 ${b}</li>`).join('')
    : '<li>— لا توجد إنجازات بعد —</li>';

  els.stats.textContent = `XP: ${AppState.progress.xp} • الحروف المتقنة: ${Object.keys(AppState.progress.masteredLetters).length}`;
}

function overallPercent(){
  const total = LETTERS.length;
  if(!total) return 0;
  const mastered = Object.values(AppState.progress.masteredLetters).filter(x=>x.score>=0.8).length;
  return mastered / total;
}

function onProgress(delta){
  // Common progress entry point used by features
  AppState.progress.xp += (delta?.xp||0);
  if(delta?.letter){
    const L = AppState.progress.masteredLetters[delta.letter] || { seen:0, correct:0, score:0 };
    L.seen += 1;
    if(delta.correct) L.correct += 1;
    L.score = L.seen ? L.correct / L.seen : 0;
    AppState.progress.masteredLetters[delta.letter] = L;
    emit('progress:letter', { letter: delta.letter, stats: L });
  }
  save('app-state', AppState);
  updateProgressUI();
  hydrateProgressLists();
}

function handleLetterProgress({ letter, stats }){
  // Badge examples
  if(stats.seen === 1) maybeAddBadge('أول محاولة في الحروف');
  if(stats.score >= 0.8 && stats.seen >= 5) maybeAddBadge(`أتقنت الحرف ${letter}`);
  save('app-state', AppState);
  hydrateProgressLists();
}

function maybeAddBadge(name){
  if(!AppState.badges.includes(name)){
    AppState.badges.push(name);
    emit('badge:new', { name });
  }
}
