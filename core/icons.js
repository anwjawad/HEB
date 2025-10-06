// core/icons.js — Tiny SVG icon system with auto-enhancer
// Usage: add data-icon="name" to any button/span. Call initIcons() once.

const ICONS = {
  paint: '<path d="M5 12c0-3.866 3.582-7 8-7a7 7 0 0 1 0 14H10l-2 2v-4a7.5 7.5 0 0 1-3-5z"/>',
  volume: '<path d="M3 10v4h3l4 4V6L6 10H3z"/><path d="M14 9a3 3 0 0 1 0 6" fill="none" stroke="currentColor" stroke-width="2"/>',
  book: '<path d="M4 5h8a3 3 0 0 1 3 3v9H7a3 3 0 0 0-3 3V5z"/><path d="M7 5v14"/>',
  repeat: '<path d="M4 7h12l-2-2m2 2-2 2M20 17H8l2 2m-2-2 2-2" fill="none" stroke="currentColor" stroke-width="2"/>',
  reset: '<path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83M14.24 14.24l2.83 2.83M2 12h4m12 0h4"/>',
  start: '<path d="M6 4v16l12-8-12-8z"/>',
  check: '<path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2"/>',
  retry: '<path d="M12 5v4l3-3A7 7 0 1 1 5 12" fill="none" stroke="currentColor" stroke-width="2"/>',
  pen: '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/>',
  quiz: '<path d="M12 18h.01M8 9a4 4 0 1 1 8 0c0 2-3 2.5-3 5" fill="none" stroke="currentColor" stroke-width="2"/>',
  trophy: '<path d="M6 3h12v3a5 5 0 0 1-5 5H11A5 5 0 0 1 6 6V3z"/><path d="M8 21h8M10 17h4"/>',
  theme: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/>',
};

function svgWrap(d){
  return `<svg viewBox="0 0 24 24" width="18" height="18" class="icon" aria-hidden="true" focusable="false" fill="currentColor">${d}</svg>`;
}

export function injectIcon(el){
  const name = el.dataset.icon; if(!name || el.dataset.iconApplied) return;
  const path = ICONS[name]; if(!path) return;
  const svg = svgWrap(path);
  // If element has text, prepend the icon (RTL-friendly)
  el.insertAdjacentHTML('afterbegin', svg);
  el.dataset.iconApplied = '1';
}

export function initIcons(){
  const apply = (root=document)=>{
    root.querySelectorAll('[data-icon]').forEach(injectIcon);
  };
  apply();
  // Observe mutations to auto-apply on dynamic content
  const mo = new MutationObserver((muts)=>{
    for(const m of muts){
      m.addedNodes?.forEach(n=>{
        if(n.nodeType===1){
          if(n.matches && n.matches('[data-icon]')) injectIcon(n);
          if(n.querySelectorAll) n.querySelectorAll('[data-icon]').forEach(injectIcon);
        }
      });
    }
  });
  mo.observe(document.body, { childList:true, subtree:true });
}
