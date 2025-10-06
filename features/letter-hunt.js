// features/letter-hunt.js — Letter Hunt 10x10 game
// لعبة اختيار الحروف: شبكة 10×10، سؤال: اختر الحرف/الحروف المطلوبة.
// يدعم أسئلة تحتوي 1–3 أحرف صحيحة. يمنح XP بحسب الدقة.

import { LETTERS } from '../data/letters.js';
import { speak, uid } from '../core/utils.js';

const GRID = 10; // 10x10
const TARGET_MIN = 1;
const TARGET_MAX = 3;

let _host, _state, _onProgress;
let currentTargets = [];// array of letters (char)
let locked = false; // بعد التحقق يمنع التغيير حتى بدء جولة جديدة

export function mount({ hostId, state, onProgress }){
  _host = document.getElementById(hostId);
  _state = state; _onProgress = onProgress;
  if(!_host) return;
  _host.innerHTML = '';
  buildUI();
  newRound();
}

function buildUI(){
  const wrap = document.createElement('div');
  wrap.className = 'card';
  wrap.innerHTML = `
    <div class="section-title"><h3>🎯 لعبة اصطياد الحروف (10×10)</h3></div>
    <div class="row" style="gap:8px;flex-wrap:wrap;align-items:center">
      <span class="pill">السؤال:</span>
      <div id="lh-question" class="pill" style="font-weight:800"></div>
      <button class="btn" id="lh-say">نطق</button>
      <div style="margin-inline-start:auto;display:flex;gap:8px">
        <select id="lh-density" class="input" title="كثافة الأهداف">
          <option value="low">قليل</option>
          <option value="med" selected>متوسط</option>
          <option value="high">عالٍ</option>
        </select>
        <button class="btn" id="lh-new">جولة جديدة</button>
        <button class="btn-primary btn" id="lh-check">تحقّق</button>
      </div>
    </div>
    <div id="lh-grid" class="grid gap-1" style="grid-template-columns:repeat(${GRID},minmax(28px,1fr));margin-top:10px"></div>
    <div class="muted" id="lh-result" style="margin-top:8px">—</div>
  `;
  _host.replaceWith(wrap); _host = wrap;

  _host.querySelector('#lh-new').addEventListener('click', newRound);
  _host.querySelector('#lh-check').addEventListener('click', checkAnswers);
  _host.querySelector('#lh-say').addEventListener('click', ()=> speakTarget());
}

function randomInt(a,b){ return a + Math.floor(Math.random()*(b-a+1)); }
function pick(arr,n){ const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a.slice(0,n); }

function newRound(){
  locked = false;
  // اختر 1-3 أحرف أهداف عشوائيًا
  const k = randomInt(TARGET_MIN, TARGET_MAX);
  currentTargets = pick(LETTERS.map(x=>x.letter), k);

  // حدّد كثافة تكرار الأهداف داخل الشبكة
  const density = (_host.querySelector('#lh-density')?.value)||'med';
  const board = makeBoard(currentTargets, density);
  renderBoard(board);
  renderQuestion();
  setResult('اختر جميع الخلايا الصحيحة ثم اضغط تحقّق.');
}

function makeBoard(targets, density){
  // أنشئ مصفوفة GRID*GRID بأحرف عشوائية مع ضمان إدراج الأهداف بعدّة خلايا
  const pool = LETTERS.map(x=>x.letter);
  const total = GRID*GRID;
  const board = Array.from({length: total}, ()=> pool[Math.floor(Math.random()*pool.length)]);

  // ضمان الوجود
  const repeats = density==='low'? 6 : density==='high'? 22 : 12; // تقريبي لكل جولة
  for(let r=0; r<repeats; r++){
    const i = Math.floor(Math.random()*total);
    board[i] = targets[Math.floor(Math.random()*targets.length)];
  }
  return board;
}

function renderQuestion(){
  const meta = currentTargets.map(ch => {
    const info = LETTERS.find(l=> l.letter===ch);
    return `${ch} — ${info?.name||''}`;
  }).join(' ، ');
  _host.querySelector('#lh-question').textContent = `اختر: ${meta}`;
}

function speakTarget(){
  const txt = currentTargets.map(ch => LETTERS.find(l=> l.letter===ch)?.heb || ch).join(' ו ');
  speak(txt);
}

function renderBoard(board){
  const grid = _host.querySelector('#lh-grid');
  grid.innerHTML = board.map((ch,idx)=> cellHTML(ch, idx)).join('');
  grid.addEventListener('click', onCellClick);
}

function cellHTML(ch, idx){
  const id = uid('c');
  return `
    <button class="btn" data-cell="${idx}" data-ch="${ch}" id="${id}" style="padding:.45rem 0;font-size:18px">${ch}</button>
  `;
}

function onCellClick(e){
  const btn = e.target.closest('[data-cell]');
  if(!btn || locked) return;
  btn.classList.toggle('btn-primary');
}

function checkAnswers(){
  if(locked) return;
  locked = true;
  const buttons = [..._host.querySelectorAll('[data-cell]')];
  const pickedIdx = buttons.filter(b=> b.classList.contains('btn-primary')).map(b=> Number(b.dataset.cell));

  const correctIdx = buttons.map((b,i)=> currentTargets.includes(b.dataset.ch) ? i : -1).filter(i=> i>=0);
  const pickedSet = new Set(pickedIdx);
  const correctSet = new Set(correctIdx);

  // التلوين البصري
  let hits=0, misses=0, over=0;
  buttons.forEach((b,i)=>{
    const isTarget = correctSet.has(i);
    const chosen   = pickedSet.has(i);
    b.style.outline = 'none';
    if(isTarget && chosen){ hits++; b.style.outline = '2px solid var(--success)'; }
    else if(isTarget && !chosen){ misses++; b.style.outline = '2px solid var(--warning)'; }
    else if(!isTarget && chosen){ over++; b.style.outline = '2px solid var(--error)'; }
  });

  const need = correctSet.size;
  const score = need ? (hits / need) : 0;
  const pct = Math.round(score*100);
  setResult(`نتيجتك: ${pct}% — صحيح: ${hits}/${need} ، فوائت: ${misses} ، اختيارات زائدة: ${over}`);

  // XP وفق الدقة
  _onProgress?.({ xp: Math.max(2, Math.floor(score*12)), letter: '*', correct: score>=0.6 });

  // مكافأة كاملة
  if(score===1){
    try{
      // بث إنجاز عبر حافلة التطبيق إن وُجدت
      const ev = new CustomEvent('badge:new', { detail: { name: 'جولة اصطياد مثالية' } });
      window.dispatchEvent(ev); // احتياط
      document.dispatchEvent(ev); // احتياط
    }catch{}
  }
}

function setResult(t){
  const el = _host.querySelector('#lh-result');
  el.textContent = t;
}
