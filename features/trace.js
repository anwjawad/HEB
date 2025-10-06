// features/trace.js — Interactive letter tracing with canvas & accuracy score
// Renders a lightweight tracing lab: choose a letter → trace on canvas → get coverage %.

import { LETTERS } from '../data/letters.js';
import { speak } from '../core/utils.js';

let _host, _state, _onProgress;
let canvas, ctx, maskCanvas, maskCtx;
let drawing = false, last = null;
let currentLetter = LETTERS[0];

const SIZE = { w: 520, h: 320 };
const STROKE = { width: 16, join:'round', cap:'round' };

export function mount({ hostId, state, onProgress }){
  _host = document.getElementById(hostId);
  _state = state; _onProgress = onProgress;
  if(!_host) return;
  _host.innerHTML = '';
  buildUI();
  setLetter(currentLetter);
}

function buildUI(){
  const wrap = document.createElement('div');
  wrap.className = 'trace-lab';
  wrap.innerHTML = `
    <div class="row" style="gap:12px;align-items:center;flex-wrap:wrap">
      <div class="pill">✍️ تتبّع الحرف</div>
      <select id="trace-letter" class="input">
        ${LETTERS.map(l=>`<option value="${l.id}">${l.letter} — ${l.name}</option>`).join('')}
      </select>
      <button class="btn" id="trace-say" title="نطق">🔊</button>
      <span class="pill" id="trace-score">الدقة: —</span>
      <div style="margin-inline-start:auto;display:flex;gap:8px">
        <button class="btn" id="trace-clear">مسح</button>
        <button class="btn" id="trace-check">تحقّق</button>
      </div>
    </div>
    <div class="card" style="margin-top:10px;display:grid;place-items:center">
      <canvas id="trace-canvas" width="${SIZE.w}" height="${SIZE.h}" style="max-width:100%;touch-action:none;border-radius:var(--radius);background:var(--surface);"></canvas>
    </div>
    <div class="muted" style="margin-top:8px">ارسم فوق الحرف بخط متصل. النسبة تُقاس بتغطية مناطق الحرف المقصودة.</div>
  `;
  _host.replaceWith(wrap);
  _host = wrap;

  canvas = _host.querySelector('#trace-canvas');
  ctx = canvas.getContext('2d');
  maskCanvas = document.createElement('canvas');
  maskCanvas.width = SIZE.w; maskCanvas.height = SIZE.h;
  maskCtx = maskCanvas.getContext('2d');

  // UI events
  _host.querySelector('#trace-letter').addEventListener('change', (e)=>{
    const L = LETTERS.find(x=> x.id === e.target.value);
    setLetter(L);
  });
  _host.querySelector('#trace-clear').addEventListener('click', clearDrawing);
  _host.querySelector('#trace-check').addEventListener('click', ()=>{
    const score = measureCoverage();
    updateScore(score);
    const ok = score >= 0.6;
    _onProgress({ xp: ok ? 6 : 2, letter: currentLetter.letter, correct: ok });
  });
  _host.querySelector('#trace-say').addEventListener('click', ()=> speak(currentLetter.heb || currentLetter.letter));

  // Pointer drawing
  canvas.addEventListener('pointerdown', startDraw);
  canvas.addEventListener('pointermove', moveDraw);
  window.addEventListener('pointerup', endDraw);
}

function setLetter(L){
  currentLetter = L;
  _host.querySelector('#trace-letter').value = L.id;
  clearDrawing();
  drawMaskGlyph(L.letter);
  updateScore(null);
}

function drawMaskGlyph(glyph){
  // Render target glyph into mask canvas (white on black)
  const { w, h } = SIZE;
  maskCtx.clearRect(0,0,w,h);
  maskCtx.save();
  maskCtx.fillStyle = '#000';
  maskCtx.fillRect(0,0,w,h);
  maskCtx.fillStyle = '#fff';
  maskCtx.textAlign = 'center';
  maskCtx.textBaseline = 'middle';
  // Auto-fit font size to height
  const pad = 18;
  let fontSize = h - pad*2;
  // Reduce a bit for letters that overflow tall (e.g., ך ף ץ)
  if(/[ךףץ]/.test(glyph)) fontSize = h - pad*2 - 24;
  maskCtx.font = `bold ${fontSize}px system-ui, 'Segoe UI', 'Arial Hebrew', 'Noto Sans Hebrew', sans-serif`;
  maskCtx.direction = 'rtl';
  maskCtx.fillText(glyph, w/2, h/2 + 6);
  maskCtx.restore();

  // Visual background on main canvas
  ctx.clearRect(0,0,w,h);
  // show faint glyph
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.drawImage(maskCanvas, 0,0);
  ctx.restore();
}

function clearDrawing(){
  const { w, h } = SIZE;
  ctx.clearRect(0,0,w,h);
  // keep faint mask
  ctx.save(); ctx.globalAlpha = 0.08; ctx.drawImage(maskCanvas,0,0); ctx.restore();
  updateScore(null);
}

function startDraw(e){
  drawing = true;
  last = getPos(e);
  drawPoint(last.x, last.y, true);
}

function moveDraw(e){
  if(!drawing) return;
  const p = getPos(e);
  drawLine(last.x, last.y, p.x, p.y);
  last = p;
}

function endDraw(){ drawing = false; last = null; }

function getPos(e){
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
}

function drawPoint(x,y, start=false){
  ctx.save();
  ctx.lineCap = STROKE.cap; ctx.lineJoin = STROKE.join; ctx.lineWidth = STROKE.width;
  ctx.strokeStyle = 'var(--primary)'; ctx.fillStyle = 'var(--primary)';
  if(start){ ctx.beginPath(); ctx.arc(x,y, STROKE.width/2, 0, Math.PI*2); ctx.fill(); }
  ctx.restore();
}

function drawLine(x1,y1,x2,y2){
  ctx.save();
  ctx.lineCap = STROKE.cap; ctx.lineJoin = STROKE.join; ctx.lineWidth = STROKE.width;
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary') || '#7ccf9a';
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.restore();
}

function updateScore(score){
  const pill = _host.querySelector('#trace-score');
  if(score == null){ pill.textContent = 'الدقة: —'; pill.classList.remove('ok','warn'); return; }
  const pct = Math.round(score*100);
  pill.textContent = `الدقة: ${pct}%`;
  pill.classList.toggle('ok', score>=0.6);
  pill.classList.toggle('warn', score<0.6);
}

function measureCoverage(){
  // Compare painted strokes to mask white region
  const { w, h } = SIZE;
  const user = ctx.getImageData(0,0,w,h).data;
  const mask = maskCtx.getImageData(0,0,w,h).data;
  let hit=0, need=0;
  for(let i=0;i<mask.length;i+=4){
    const m = mask[i]; // 255 in glyph, 0 elsewhere
    if(m>127){
      need++;
      const a = user[i+3];
      if(a>30) hit++;
    }
  }
  if(!need) return 0;
  return hit/need;
}
