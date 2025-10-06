// features/flashcards.js — Alphabet flashcards with smart review
// Renders letter cards, plays TTS, and reports progress back to app via onProgress.

import { LETTERS } from '../data/letters.js';
import { speak, uid } from '../core/utils.js';

let _state, _onProgress, _container;

export function mount({ container, state, onProgress }){
  _state = state; _onProgress = onProgress; _container = container;
  render();
}

function render(){
  const reviewRaw = sessionStorage.getItem('review-set');
  let list = LETTERS.slice();
  if(reviewRaw){
    try{
      const subset = new Set(JSON.parse(reviewRaw));
      list = list.filter(x=> subset.has(x.letter) || subset.has(x.id));
    }catch{/* ignore */}
    // consume once
    sessionStorage.removeItem('review-set');
  }

  if(!list.length){ list = LETTERS.slice(0, 12); }

  _container.innerHTML = list.map(toCardHTML).join('');
  _container.addEventListener('click', onClick, { once:true });
}

function toCardHTML(item){
  const id = uid('card');
  return `
  <article class="tile" data-id="${item.id}" data-letter="${item.letter}" id="${id}">
    <div class="tile-body">
      <div class="letter">${item.letter}</div>
      ${item.final ? `<div class="final">شكل نهائي: ${item.final}</div>` : ''}
      <div class="meta">
        <span class="pill">${item.name}</span>
        <span class="pill">${item.heb}</span>
      </div>
      <div class="desc muted">صوت: ${item.sound} • تقريب عربي: ${item.arabicApprox}</div>
      <div class="actions">
        <button class="btn" data-act="say" title="استمع للنطق">🔊 نطق</button>
        <button class="btn" data-act="ex" title="مثال كلمة">📖 مثال</button>
        <button class="btn-primary btn" data-act="know">عرفته ✅</button>
        <button class="btn" data-act="again">أعد المحاولة 🔁</button>
      </div>
    </div>
  </article>`;
}

function onClick(e){
  const btn = e.target.closest('button');
  if(!btn) return _container.addEventListener('click', onClick, { once:true });

  const card = btn.closest('[data-id]');
  if(!card) return _container.addEventListener('click', onClick, { once:true });

  const id = card.dataset.id;
  const item = LETTERS.find(l=> l.id === id);
  const act = btn.dataset.act;

  switch(act){
    case 'say':
      // Prefer example with nikud if present, else letter name
      speak(item.heb || item.letter);
      break;
    case 'ex':
      if(item.example){ speak(item.example); flashExample(card, item); }
      else speak(item.letter);
      break;
    case 'know':
      markProgress(item, true);
      pulse(card, 'ok');
      break;
    case 'again':
      markProgress(item, false);
      pulse(card, 'warn');
      break;
  }

  _container.addEventListener('click', onClick, { once:true });
}

function markProgress(item, correct){
  _onProgress({ xp: correct ? 5 : 1, letter: item.letter, correct });
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

function flashExample(card, item){
  let tip = card.querySelector('.tip');
  if(!tip){
    tip = document.createElement('div');
    tip.className = 'tip';
    card.appendChild(tip);
  }
  tip.innerHTML = `
    <div class="tip-inner">
      <div class="muted">مثال:</div>
      <div class="hebrew">${item.example}</div>
      <div class="ar">${item.ex_ar || ''}</div>
    </div>`;
  tip.animate([
    { opacity:0, transform:'translateY(6px)' },
    { opacity:1, transform:'translateY(0)' }
  ], { duration:220, easing:'cubic-bezier(.2,.8,.2,1)' });
  setTimeout(()=> tip.remove(), 2000);
}
