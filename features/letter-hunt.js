// features/letter-hunt.js — Letter Hunt 10x10 (Safari-safe, fixed)
// لعبة اختيار الحروف: شبكة 10×10، سؤال: اختر الحرف/الحروف المطلوبة.
// لا يستخدم optional chaining ولا أي ميزات حداثية قديمة على iPad.

import { LETTERS } from '../data/letters.js';
import { speak, uid } from '../core/utils.js';

// --- Polyfills لازمة لسفاري قديم ---
(function(){
  if (!Element.prototype.matches) {
    Element.prototype.matches =
      Element.prototype.msMatchesSelector ||
      Element.prototype.webkitMatchesSelector;
  }
  if (!Element.prototype.closest) {
    Element.prototype.closest = function(sel){
      var el = this;
      while (el && el.nodeType === 1) {
        if (el.matches(sel)) return el;
        el = el.parentElement || el.parentNode;
      }
      return null;
    };
  }
})();

var GRID = 10;           // 10x10
var TARGET_MIN = 1;      // أقل عدد أهداف
var TARGET_MAX = 3;      // أعلى عدد أهداف

var _host, _state, _onProgress;
var currentTargets = []; // أحرف السؤال
var locked = false;      // قفل بعد التحقق

export function mount(opts){
  _host = document.getElementById(opts.hostId);
  _state = opts.state;
  _onProgress = opts.onProgress;
  if(!_host) return;
  _host.innerHTML = '';
  buildUI();
  newRound();
}

function buildUI(){
  var wrap = document.createElement('div');
  wrap.className = 'card';
  wrap.innerHTML =
    '<div class="section-title"><h3>🎯 لعبة اصطياد الحروف (10×10)</h3></div>' +
    '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center">' +
      '<span class="pill">السؤال:</span>' +
      '<div id="lh-question" class="pill" style="font-weight:800"></div>' +
      '<button class="btn" id="lh-say">نطق</button>' +
      '<div style="margin-inline-start:auto;display:flex;gap:8px">' +
        '<select id="lh-density" class="input" title="كثافة الأهداف">' +
          '<option value="low">قليل</option>' +
          '<option value="med" selected>متوسط</option>' +
          '<option value="high">عالٍ</option>' +
        '</select>' +
        '<button class="btn" id="lh-new">جولة جديدة</button>' +
        '<button class="btn-primary btn" id="lh-check">تحقّق</button>' +
      '</div>' +
    '</div>' +
    '<div id="lh-grid" class="grid gap-1" ' +
      'style="grid-template-columns:repeat(' + GRID + ',minmax(28px,1fr));margin-top:10px"></div>' +
    '<div class="muted" id="lh-result" style="margin-top:8px">—</div>';

  if(_host.parentNode){ _host.parentNode.replaceChild(wrap, _host); }
  _host = wrap;

  _host.querySelector('#lh-new').addEventListener('click', newRound);
  _host.querySelector('#lh-check').addEventListener('click', checkAnswers);
  _host.querySelector('#lh-say').addEventListener('click', speakTarget);
}

function randInt(a,b){ return a + Math.floor(Math.random()*(b-a+1)); }
function pick(arr,n){
  var a = arr.slice();
  for (var i=a.length-1;i>0;i--){
    var j = Math.floor(Math.random()*(i+1));
    var t = a[i]; a[i]=a[j]; a[j]=t;
  }
  return a.slice(0,n);
}

function newRound(){
  locked = false;
  // 1–3 أحرف أهداف عشوائية
  var k = randInt(TARGET_MIN, TARGET_MAX);
  currentTargets = pick(LETTERS.map(function(x){ return x.letter; }), k);

  // كثافة تكرار الأهداف داخل الشبكة
  var dEl = _host.querySelector('#lh-density');
  var density = (dEl && dEl.value) || 'med';

  var board = makeBoard(currentTargets, density);
  renderBoard(board);
  renderQuestion();
  setResult('اختر جميع الخلايا الصحيحة ثم اضغط تحقّق.');
}

function makeBoard(targets, density){
  var pool = LETTERS.map(function(x){ return x.letter; });
  var total = GRID*GRID;
  var board = new Array(total);
  for (var i=0;i<total;i++){
    board[i] = pool[Math.floor(Math.random()*pool.length)];
  }
  // حقن الأهداف بعدة خلايا
  var repeats = density==='low'? 6 : density==='high'? 22 : 12;
  for (var r=0;r<repeats;r++){
    var idx = Math.floor(Math.random()*total);
    board[idx] = targets[Math.floor(Math.random()*targets.length)];
  }
  return board;
}

function renderQuestion(){
  var meta = currentTargets.map(function(ch){
    var info = LETTERS.find(function(l){ return l.letter===ch; });
    return ch + ' — ' + (info && info.name ? info.name : '');
  }).join(' ، ');
  _host.querySelector('#lh-question').textContent = 'اختر: ' + meta;
}

function speakTarget(){
  var txt = currentTargets.map(function(ch){
    var L = LETTERS.find(function(l){ return l.letter===ch; });
    return (L && L.heb) ? L.heb : ch;
  }).join(' ו ');
  speak(txt);
}

function renderBoard(board){
  var grid = _host.querySelector('#lh-grid');
  var html = '';
  for (var i=0;i<board.length;i++){
    var ch = board[i];
    var id = uid('c');
    html += '<button class="btn" data-cell="'+i+'" data-ch="'+ch+'" id="'+id+'" ' +
            'style="padding:.45rem 0;font-size:18px">'+ ch +'</button>';
  }
  grid.innerHTML = html;
  grid.addEventListener('click', onCellClick);
}

function onCellClick(e){
  if(locked) return;
  var btn = e.target.closest('[data-cell]');
  if(!btn) return;
  btn.classList.toggle('btn-primary');
}

function checkAnswers(){
  if(locked) return;
  locked = true;

  var buttons = Array.prototype.slice.call(_host.querySelectorAll('[data-cell]'));
  var pickedIdx = buttons.filter(function(b){ return b.classList.contains('btn-primary'); })
                         .map(function(b){ return Number(b.getAttribute('data-cell')); });

  var correctIdx = buttons.map(function(b,i){
    return currentTargets.indexOf(b.getAttribute('data-ch')) !== -1 ? i : -1;
  }).filter(function(i){ return i>=0; });

  var pickedSet = {}; for (var i=0;i<pickedIdx.length;i++) pickedSet[pickedIdx[i]] = true;
  var correctSet = {}; for (i=0;i<correctIdx.length;i++) correctSet[correctIdx[i]] = true;

  var hits=0, misses=0, over=0;
  buttons.forEach(function(b,i){
    var isTarget = !!correctSet[i];
    var chosen   = !!pickedSet[i];
    b.style.outline = 'none';
    if(isTarget && chosen){ hits++;   b.style.outline = '2px solid var(--success)'; }
    else if(isTarget && !chosen){ misses++; b.style.outline = '2px solid var(--warning)'; }
    else if(!isTarget && chosen){ over++;   b.style.outline = '2px solid var(--error)'; }
  });

  var need = Object.keys(correctSet).length;
  var score = need ? (hits / need) : 0;
  var pct = Math.round(score*100);
  setResult('نتيجتك: '+pct+'% — صحيح: '+hits+'/'+need+' ، فوائت: '+misses+' ، اختيارات زائدة: '+over);

  if (typeof _onProgress === 'function') {
    _onProgress({ xp: Math.max(2, Math.floor(score*12)), letter: '*', correct: score>=0.6 });
  }

  if(score===1){
    try{
      var ev = new CustomEvent('badge:new', { detail: { name: 'جولة اصطياد مثالية' } });
      window.dispatchEvent(ev);
      document.dispatchEvent(ev);
    }catch(err){}
  }
}

function setResult(t){
  var el = _host.querySelector('#lh-result');
  if(el) el.textContent = t;
}