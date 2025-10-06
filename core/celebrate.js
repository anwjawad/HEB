// core/celebrate.js — Lightweight confetti + toast on new badges
// initCelebrations(onEvent) → attaches to 'badge:new' and shows effects.

export function initCelebrations(onEvent){
  onEvent('badge:new', (e)=>{
    const { name } = e.detail || { name:'إنجاز جديد' };
    confettiBurst();
    toast(`🎉 ${name}`);
  });
}

function toast(text){
  const box = document.createElement('div');
  box.className = 'toast card';
  box.textContent = text;
  Object.assign(box.style, {
    position:'fixed', insetInlineEnd:'16px', insetBlockStart:'16px', zIndex:100,
    padding:'10px 14px', borderRadius:'12px', fontWeight:'700'
  });
  document.body.appendChild(box);
  box.animate([
    { opacity:0, transform:'translateY(-6px)' },
    { opacity:1, transform:'translateY(0)' }
  ], { duration:220, easing:'cubic-bezier(.2,.8,.2,1)' });
  setTimeout(()=>{
    box.animate([
      { opacity:1 },{ opacity:0 }
    ], { duration:200 });
    setTimeout(()=> box.remove(), 220);
  }, 1800);
}

function confettiBurst(){
  const c = document.createElement('canvas');
  c.width = innerWidth; c.height = innerHeight; c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99';
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  const N = 140;
  const parts = Array.from({length:N}, ()=> makePiece());
  let t0 = performance.now();
  function frame(t){
    const dt = (t - t0)/1000; t0 = t;
    ctx.clearRect(0,0,c.width,c.height);
    for(const p of parts){
      p.vy += 800*dt; // gravity
      p.x += p.vx*dt; p.y += p.vy*dt; p.r += p.vr*dt;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.color; ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h); ctx.restore();
    }
    if(parts.every(p=> p.y > c.height + 40)) return c.remove();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function makePiece(){
  const palette = ['#22c55e','#06b6d4','#a78bfa','#ff7a1a','#ffd166','#ff4d8d','#34d399'];
  const angle = Math.random()*Math.PI*2;
  const speed = 320 + Math.random()*260;
  return {
    x: innerWidth/2, y: innerHeight*0.15,
    vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed*0.6,
    w: 6 + Math.random()*6, h: 10 + Math.random()*8,
    r: 0, vr: (-3 + Math.random()*6),
    color: palette[Math.floor(Math.random()*palette.length)],
  };
}
