// features/letter-hunt.js — Letter Hunt 10x10 (Safari-safe)
// لعبة اختيار الحروف: شبكة 10×10، سؤال: اختر الحرف/الحروف المطلوبة.
// متوافق مع Safari قديم (لا يستخدم optional chaining ?. )

import { LETTERS } from '../data/letters.js';
import { speak, uid } from '../core/utils.js';

var GRID = 10; // 10x10
var TARGET_MIN = 1;
var TARGET_MAX = 3;

var _host, _state, _onProgress;
var currentTargets = []; // array of letters (char)
var locked = false;      // يمنع التغيير بعد التحقق حتى بدء جولة جديدة

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
    '<div id="lh-grid" class="grid gap-1" style="grid-template-columns:repeat(' + GRID + ',minmax(28px,1fr));margin-top:10px"></div>' +
    '<div class="muted" id="lh-result" style="margin-top:8px">—</div>';

  _host.parentNode.replaceChild(wrap, _host);
  _host = wrap;

  _host.querySelector('#lh-new').addEventListener('click', newRound);
  _host.querySelector('#lh-check').addEventListener('click', checkAnswers);
  _host.querySelector('#lh-say').addEventListener('click', speakTarget);
}

function randomInt(a,b){ return a + Math.floor(Math.random()*(b-a+1)); }
function pick(arr,n){
  var a=arr.slice();
  for(var i=a.length-1;i>0;i--){
    var j=Math.floor(Math.random()*(i+1));
    var tmp=a[i]; a[i]=a[j]; a[j]=tmp;
  }
  return a.slice(0,n);
}

function newRound(){
  locked = false;
  // اختر 1-3 أحرف أهداف عشوائيًا
  var k = randomInt(TARGET_MIN, TARGET_MAX);
  currentTargets = pick(LETTERS.map(function(x){ return x.letter; }), k);

  // حدّد كثافة تكرار الأهداف داخل الشبكة
  var dEl = _host.querySelector('#lh-density');
  var density = (dEl && dEl.value) || 'med';

  var board = makeBoard(currentTargets, density);
  renderBoard(board);
  renderQuestion();
  setResult('اختر جميع الخلايا الصحيحة ثم اضغط تحقّق.');
}

function makeBoard(targets, density){
  // أنشئ مصفوفة GRID*GRID بأحرف عشوائية مع ضمان إدراج الأهداف بعدّة خلايا
  var pool = LETTERS.map(function(x){ return x.letter; });
  var total = GRID*GRID;
  var board = new Array(total);
  for(var i=0;i<total;i++){
    board[i] = pool[Math.floor(Math.random()*pool.length)];
  }
  // ضمان الوجود
  var repeats = density==='low'? 6 : density==='high'? 22 : 12; // تقريبي لكل جولة
  for(var r=0; r<repeats; r++){
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
    var found = LETTERS.find(function(l){ return l.letter===ch; });
    return (found && found.heb) ? found.heb : ch;
  }).join(' ו ');
  speak(txt);
}

function renderBoard(board){
  var grid = _host.querySelector('#lh-grid');
  var html = '';
  for(var i=0;i<board.length;i++){
    html += cellHTML(board[i], i);
  }
  grid.innerHTML = html;
  grid.addEventListener('click', onCellClick);
}

function cellHTML(ch, idx){
  var id = uid('c');
  return '<button class="btn" data-cell="'+idx+'" data-ch="'+ch+'" id="'+id+'" style="padding:.45rem 0;font-size:18px">'+ch+'</button>';
}

function onCellClick(e){
  var btn = e.target.closest('[data-cell]');
  if(!btn || locked) return;
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

  var pickedSet = {};
  for(var i=0;i<pickedIdx.length;i++) pickedSet[pickedIdx[i]] = true;
  var correctSet = {};
  for(i=0;i<correctIdx.length;i++) correctSet[correctIdx[i]] = true;

  // التلوين البصري
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

  // XP وفق الدقة (بدون optional chaining)
  if (typeof _onProgress === 'function') {
    _onProgress({ xp: Math.max(2, Math.floor(score*12)), letter: '*', correct: score>=0.6 });
  }

  // مكافأة كاملة
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