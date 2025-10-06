// features/syllables.js — Interactive Nikud lab (compose & quiz) [FIXED]
// - إصلاح: حماية عند إعادة ربط المستمع على #drills حتى لا يحدث null.querySelector
// - تركيبة أوضح لإعادة تسليح المستمعات بعد كل نقرة

import { NIKUD, composeSyllable, expandDrillSet } from '../data/nikud.js';
import { LETTERS } from '../data/letters.js';
import { speak, uid } from '../core/utils.js';

let _host, _onProgress;

export function mount({ hostId, letters, nikud, onProgress }) {
  _host = document.getElementById(hostId);
  _onProgress = onProgress;
  if (!_host) return;
  _host.innerHTML = '';
  buildUI();
}

function buildUI() {
  const wrap = document.createElement('div');
  wrap.className = 'nikud-lab';
  wrap.innerHTML = `
    <div class="row" style="gap:10px;flex-wrap:wrap;align-items:center">
      <span class="pill">🔡 كوّن مقطعك</span>
      <select id="syll-base" class="input" title="اختر حرفًا أساسيًا">
        ${LETTERS.map(l => `<option value="${l.letter}">${l.letter} — ${l.name}</option>`).join('')}
      </select>
      <div class="row" id="nikud-list" style="gap:8px;flex-wrap:wrap">
        ${NIKUD.map(n => `<button class="pill" data-mark="${n.id}" title="${n.heb}">${n.mark || n.ex}</button>`).join('')}
      </div>
      <div style="margin-inline-start:auto;display:flex;gap:8px">
        <button class="btn" id="btn-say" data-icon="volume">نطق</button>
        <button class="btn" id="btn-quiz" data-icon="quiz">وضع الاختبار</button>
      </div>
    </div>

    <div class="card" style="margin-top:10px;display:grid;place-items:center;padding:28px">
      <div id="syll-output" class="hebrew" style="font-size:64px;">—</div>
      <div class="muted" id="syll-name" style="margin-top:8px">اختر حركة لعرض المقطع</div>
    </div>

    <div class="card" style="margin-top:10px">
      <div class="section-title"><h3>تمارين سريعة</h3></div>
      <div id="drills" class="grid gap-2" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))"></div>
    </div>
  `;
  _host.replaceWith(wrap);
  _host = wrap;

  // Events
  _host.querySelector('#nikud-list').addEventListener('click', onNikudClick);
  _host.querySelector('#btn-say').addEventListener('click', () => {
    const val = _host.querySelector('#syll-output').textContent;
    if (val && val !== '—') speak(val);
  });
  _host.querySelector('#btn-quiz').addEventListener('click', startQuiz);

  // Drills grid
  renderDrills();
}

function onNikudClick(e) {
  const btn = e.target.closest('[data-mark]');
  if (!btn) return;
  const base = _host.querySelector('#syll-base').value;
  const id = btn.dataset.mark;
  const syll = composeSyllable(base, id);
  _host.querySelector('#syll-output').textContent = syll;
  const nik = NIKUD.find(n => n.id === id);
  _host.querySelector('#syll-name').textContent = `${nik?.name || ''} — ${nik?.heb || ''}`;
  speak(syll);
}

function renderDrills() {
  const drills = expandDrillSet();
  const host = _host.querySelector('#drills');
  host.innerHTML = drills.map(d => drillCardHTML(d)).join('');
  // اربط مستمع واحد فقط، وأعد تسليحه يدويًا بعد كل نقرة عند الحاجة
  host.addEventListener('click', onDrillClick);
}

function drillCardHTML(d) {
  const id = uid('drill');
  return `
    <article class="tile" data-id="${id}" data-base="${d.base}" data-vowel="${d.vowel}">
      <div class="tile-body">
        <div class="letter">${d.syllable}</div>
        <div class="meta"><span class="pill">${d.base}</span><span class="pill">${d.vowel}</span></div>
        <div class="actions">
          <button class="btn" data-act="say" data-icon="volume">نطق</button>
          <button class="btn-primary btn" data-act="ok" data-icon="check">عرفته</button>
          <button class="btn" data-act="again" data-icon="retry">أعد</button>
        </div>
      </div>
    </article>`;
}

function onDrillClick(e) {
  const btn = e.target.closest('button');
  if (!btn) return;

  const card = btn.closest('[data-id]');
  if (!card) return;

  const base = card.dataset.base;
  const vowel = card.dataset.vowel;
  const syll = composeSyllable(base, vowel);

  switch (btn.dataset.act) {
    case 'say':
      speak(syll);
      break;
    case 'ok':
      report(true, base);
      pulse(card, 'ok');
      break;
    case 'again':
      report(false, base);
      pulse(card, 'warn');
      break;
  }

  // إعادة تسليح آمنة: تحقّق أن العنصر موجود قبل الارتباط
  rearmDrills();
}

function rearmDrills() {
  const drillsHost = _host && _host.querySelector ? _host.querySelector('#drills') : null;
  if (!drillsHost) return; // إذا تم إغلاق اللوحة أو تغيّرت، لا نفعل شيئًا
  // إزالة المستمعات المكررة ثم ربط واحد نظيف
  drillsHost.replaceWith(drillsHost.cloneNode(true));
  const freshHost = _host.querySelector('#drills');
  freshHost.addEventListener('click', onDrillClick);
}

function report(correct, letter) {
  _onProgress({ xp: correct ? 6 : 2, letter, correct });
}

function pulse(el, mode) {
  el.animate(
    [
      { transform: 'translateY(0)', boxShadow: 'none' },
      { transform: 'translateY(-3px)', boxShadow: '0 10px 24px rgba(0,0,0,.25)' },
      { transform: 'translateY(0)', boxShadow: 'none' }
    ],
    { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' }
  );
  if (mode === 'ok') el.style.outline = '2px solid var(--success)';
  if (mode === 'warn') el.style.outline = '2px solid var(--warning)';
  setTimeout(() => (el.style.outline = 'none'), 420);
}

/* ---------------- Quiz Mode ---------------- */
let quizOn = false,
  quizData = null;

function startQuiz() {
  if (quizOn) {
    endQuiz();
    return;
  }
  quizOn = true;
  const pool = expandDrillSet();
  quizData = pick(pool, 8);
  const area = document.createElement('div');
  area.className = 'card';
  area.id = 'quiz-area';
  area.innerHTML = `
    <div class="section-title"><h3>اختبار المقاطع (8 أسئلة)</h3></div>
    <div class="grid gap-2" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
      ${quizData.map((q, i) => quizCardHTML(q, i)).join('')}
    </div>
    <div class="row" style="justify-content:flex-end;margin-top:10px;gap:8px">
      <button class="btn" id="quiz-cancel">إغلاق</button>
    </div>
  `;
  _host.appendChild(area);
  area.addEventListener('click', onQuizClick);
  area.querySelector('#quiz-cancel').addEventListener('click', endQuiz);
}

function endQuiz() {
  const area = document.getElementById('quiz-area');
  if (area) {
    area.remove();
  }
  quizOn = false;
  quizData = null;
}

function quizCardHTML(q, i) {
  const opts = shuffle(createConfusions(q));
  return `
    <article class="tile" data-i="${i}">
      <div class="tile-body">
        <div class="row" style="justify-content:space-between;align-items:center">
          <button class="btn" data-act="play" data-icon="volume" title="تشغيل">نطق</button>
          <span class="pill">${q.base}</span>
        </div>
        <div class="grid gap-1" style="grid-template-columns:repeat(3,1fr);margin-top:8px">
          ${opts.map(o => `<button class="btn" data-opt="${o}">${o}</button>`).join('')}
        </div>
      </div>
    </article>`;
}

function onQuizClick(e) {
  const btn = e.target.closest('button');
  if (!btn) return;
  const tile = btn.closest('[data-i]');
  const i = Number(tile.dataset.i);
  const q = quizData[i];

  if (btn.dataset.act === 'play') {
    speak(composeSyllable(q.base, q.vowel));
    return;
  }

  if (btn.dataset.opt) {
    const picked = btn.dataset.opt;
    const correct = picked === composeSyllable(q.base, q.vowel);
    if (correct) {
      btn.classList.add('btn-primary');
      _onProgress({ xp: 7, letter: q.base, correct: true });
    } else {
      btn.style.outline = '2px solid var(--error)';
      _onProgress({ xp: 2, letter: q.base, correct: false });
    }
  }
}

function createConfusions(q) {
  const correct = composeSyllable(q.base, q.vowel);
  const vowels = NIKUD.map(n => n.id);
  const others = shuffle(vowels.filter(v => v !== q.vowel))
    .slice(0, 2)
    .map(v => composeSyllable(q.base, v));
  return [correct, ...others];
}

function pick(arr, n) {
  return shuffle(arr.slice()).slice(0, n);
}
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
