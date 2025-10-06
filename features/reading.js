// features/reading.js — Guided reading: words → phrases with step highlights
// Shows a small list of words/sentences; on hover/click it highlights letters and plays audio.

import { LETTERS } from '../data/letters.js';
import { speak } from '../core/utils.js';

let _host, _onProgress;

const WORDS = [
  { h:'שָׁלוֹם', ar:'سلام', hint:'تحية شائعة' },
  { h:'אָב', ar:'أب', hint:'' },
  { h:'אֵם', ar:'أم', hint:'' },
  { h:'בַּיִת', ar:'بيت', hint:'' },
  { h:'לֶחֶם', ar:'خبز', hint:'' },
  { h:'מַיִם', ar:'ماء', hint:'' },
  { h:'טוֹב', ar:'جيد', hint:'' },
];

const PHRASES = [
  { h:'שָׁלוֹם אֲנִי תָּלְמִיד', ar:'مرحبًا، أنا طالب' },
  { h:'זֶה בַּיִת גָּדוֹל', ar:'هذا بيت كبير' },
  { h:'הַחֶבֶר טוֹב', ar:'الصديق جيد' },
];

export function mount({ hostId, letters, nikud, onProgress }){
  _host = document.getElementById(hostId);
  _onProgress = onProgress;
  if(!_host) return;
  _host.innerHTML = '';
  buildUI();
}

function buildUI(){
  const wrap = document.createElement('div');
  wrap.className = 'reading-lab';
  wrap.innerHTML = `
    <div class="row" style="gap:10px;align-items:center;flex-wrap:wrap">
      <span class="pill">📖 القراءة الموجّهة</span>
      <button class="btn" id="btn-practice">وضع التدريب</button>
      <button class="btn" id="btn-phr">جُمل</button>
      <button class="btn" id="btn-words">كلمات</button>
    </div>
    <div class="grid gap-2" id="read-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr));margin-top:10px"></div>
  `;
  _host.replaceWith(wrap); _host = wrap;

  _host.querySelector('#btn-words').addEventListener('click', ()=> renderList('words'));
  _host.querySelector('#btn-phr').addEventListener('click', ()=> renderList('phrases'));
  _host.querySelector('#btn-practice').addEventListener('click', ()=> startPractice());

  renderList('words');
}

function renderList(kind){
  const host = _host.querySelector('#read-grid');
  const list = kind==='phrases' ? PHRASES : WORDS;
  host.innerHTML = list.map(x=> cardHTML(x)).join('');
  host.addEventListener('click', onCardClick, { once:true });
}

function cardHTML(x){
  return `
  <article class="tile">
    <div class="tile-body">
      <div class="hebrew" data-h="${x.h}">${x.h}</div>
      <div class="ar">${x.ar}</div>
      ${x.hint? `<div class="muted">${x.hint}</div>`: ''}
      <div class="actions">
        <button class="btn" data-act="say">🔊 نطق</button>
        <button class="btn-primary btn" data-act="ok">عرفته ✅</button>
        <button class="btn" data-act="again">🔁</button>
      </div>
    </div>
  </article>`;
}

function onCardClick(e){
  const btn = e.target.closest('button');
  if(!btn) return _host.querySelector('#read-grid').addEventListener('click', onCardClick, { once:true });
  const art = btn.closest('article');
  const text = art.querySelector('.hebrew').dataset.h;
  switch(btn.dataset.act){
    case 'say': speak(text); break;
    case 'ok': _onProgress({ xp:8, letter:'*', correct:true }); pulse(art, 'ok'); break;
    case 'again': _onProgress({ xp:2, letter:'*', correct:false }); pulse(art, 'warn'); break;
  }
  _host.querySelector('#read-grid').addEventListener('click', onCardClick, { once:true });
}

function startPractice(){
  // Highlight characters step-by-step and speak
  const items = [..._host.querySelectorAll('.hebrew')];
  let i = 0;
  const next = ()=>{
    if(i>=items.length) return;
    const el = items[i++];
    stepSpeak(el);
    setTimeout(next, 1200);
  };
  next();
}

function stepSpeak(el){
  const text = el.dataset.h;
  el.animate([
    { background:'transparent' },
    { background:'color-mix(in oklab, var(--accent) 20%, transparent)' },
    { background:'transparent' }
  ], { duration: 900, easing:'cubic-bezier(.2,.8,.2,1)' });
  speak(text);
}

function pulse(el, mode){
  el.animate([
    { transform:'translateY(0)', boxShadow:'none' },
    { transform:'translateY(-3px)', boxShadow:'0 10px 24px rgba(0,0,0,.25)' },
    { transform:'translateY(0)', boxShadow:'none' }
  ], { duration: 260, easing:'cubic-bezier(.2,.8,.2,1)' });
  if(mode==='ok') el.style.outline = '2px solid var(--success)';
  if(mode==='warn') el.style.outline = '2px solid var(--warning)';
  setTimeout(()=> el.style.outline = 'none', 420);
}
