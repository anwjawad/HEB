// core/storage.js — Local persistence helpers with namespacing & safety
// Keeps API tiny: load(key), save(key, value), resetAll()

const NS = 'hebrew-read';

function nsKey(key){
  return `${NS}:${key}`;
}

export function load(key, fallback=null){
  try{
    const raw = localStorage.getItem(nsKey(key));
    if(!raw) return fallback;
    return JSON.parse(raw);
  }catch(err){
    console.warn('[storage] load failed', key, err);
    return fallback;
  }
}

export function save(key, value){
  try{
    localStorage.setItem(nsKey(key), JSON.stringify(value));
    return true;
  }catch(err){
    console.warn('[storage] save failed', key, err);
    return false;
  }
}

export function remove(key){
  try{
    localStorage.removeItem(nsKey(key));
  }catch{/* noop */}
}

export function resetAll(){
  // Cautious sweep
  try{
    const toRemove = [];
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if(k && k.startsWith(`${NS}:`)) toRemove.push(k);
    }
    toRemove.forEach(k=> localStorage.removeItem(k));
  }catch(err){
    console.warn('[storage] resetAll failed', err);
  }
}
