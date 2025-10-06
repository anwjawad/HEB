// core/router.js — Minimal hash router for panel switching & lazy features
// Usage:
// const r = new Router({ default:'progress', onChange: (route)=> swap(route) });
// r.register('flashcards', () => import('./features/flashcards.js').then(m=>m.mount(...)) )
// r.start();

export class Router{
  constructor(opts={}){
    this.routes = new Map();
    this.defaultRoute = opts.default || 'progress';
    this.onChange = typeof opts.onChange === 'function' ? opts.onChange : ()=>{};
    this._onHash = this._onHash.bind(this);
  }

  register(name, onEnter){
    this.routes.set(name, onEnter || null);
  }

  go(name){
    if(!this.routes.has(name)) name = this.defaultRoute;
    if(location.hash !== `#/${name}`){
      location.hash = `#/${name}`;
    }else{
      // force trigger
      this._trigger(name);
    }
  }

  start(){
    window.addEventListener('hashchange', this._onHash);
    if(!location.hash) this.go(this.defaultRoute);
    else this._onHash();
  }

  stop(){
    window.removeEventListener('hashchange', this._onHash);
  }

  _onHash(){
    const name = this._parse(location.hash) || this.defaultRoute;
    this._trigger(name);
  }

  async _trigger(name){
    const onEnter = this.routes.get(name);
    try{
      if(typeof onEnter === 'function'){
        await onEnter();
      }
      this.onChange(name);
    }catch(err){
      console.error('[Router] route error', name, err);
      this.onChange(this.defaultRoute);
      if(this.defaultRoute !== name) this.go(this.defaultRoute);
    }
  }

  _parse(hash){
    // #/flashcards?foo=1  →  flashcards
    if(!hash || hash.length < 3) return null;
    const path = hash.slice(2).split('?')[0].trim();
    return this.routes.has(path) ? path : null;
  }
}
