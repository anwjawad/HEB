// core/theme.js — Theme manager & switcher UI
// Keeps the UI modern with >10 palettes, persists choice, and exposes helpers.

const THEME_KEY = 'app-theme';
export const THEMES = [
  'fern','neon','ocean','rose','ember','mint','dawn', // assumed from styles.css
  'solar','violet','forest','sand','mono','pastel'    // extra themes defined inline in index.html
];

export function applySavedTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  const html = document.documentElement;
  // If nothing saved, prefer first theme or system preference if matches known
  if(!saved){
    const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.setAttribute('data-theme', systemDark ? 'violet' : html.getAttribute('data-theme')||'fern');
    return;
  }
  if(THEMES.includes(saved)) html.setAttribute('data-theme', saved);
}

export function setTheme(theme){
  if(!THEMES.includes(theme)) return;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  // small ripple animation feedback on switcher button if exists
  const btn = document.getElementById('theme-toggle');
  if(btn){
    btn.animate([
      { transform:'scale(1)' },
      { transform:'scale(1.06)' },
      { transform:'scale(1)' }
    ], { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
}

export function initThemeSwitcher(){
  const switcher = document.getElementById('theme-switcher');
  const panel = document.getElementById('theme-panel');
  const toggle = document.getElementById('theme-toggle');
  const chipsHost = document.getElementById('theme-chips');

  // Build chips if missing / ensure all themes exist
  if(chipsHost){
    const existing = new Set([...chipsHost.querySelectorAll('[data-theme]')].map(b=>b.dataset.theme));
    THEMES.forEach(t=>{
      if(!existing.has(t)){
        const b = document.createElement('button');
        b.className = 'theme-chip';
        b.dataset.theme = t; b.textContent = t[0].toUpperCase()+t.slice(1);
        chipsHost.appendChild(b);
      }
    });
  }

  // Toggle open/close
  toggle?.addEventListener('click', ()=>{
    panel.classList.toggle('open');
  });
  document.addEventListener('click', (e)=>{
    if(!switcher.contains(e.target)) panel.classList.remove('open');
  });

  // Click on a chip → set theme
  chipsHost?.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-theme]');
    if(!btn) return;
    setTheme(btn.dataset.theme);
  });

  // Keyboard: Ctrl/Cmd + J cycles themes
  document.addEventListener('keydown', (e)=>{
    const mod = e.ctrlKey || e.metaKey;
    if(mod && e.key.toLowerCase() === 'j'){
      e.preventDefault();
      cycleTheme(1);
    }
  });

  // Middle-click on toggle cycles backwards (fun!)
  toggle?.addEventListener('auxclick', (e)=>{
    if(e.button === 1){
      e.preventDefault();
      cycleTheme(-1);
    }
  });

  // Mark active chip
  const obs = new MutationObserver(()=> highlightActiveChip());
  obs.observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });
  highlightActiveChip();
}

function highlightActiveChip(){
  const theme = document.documentElement.getAttribute('data-theme');
  document.querySelectorAll('#theme-chips .theme-chip').forEach(b=>{
    b.classList.toggle('active', b.dataset.theme === theme);
  });
}

function cycleTheme(step){
  const t = document.documentElement.getAttribute('data-theme');
  const idx = Math.max(0, THEMES.indexOf(t));
  const next = THEMES[(idx + step + THEMES.length) % THEMES.length];
  setTheme(next);
}
