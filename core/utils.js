// core/utils.js — Common helpers for Hebrew Read app
// Provides formatting, random id, sleep, and TTS helpers for Hebrew.

// Generate a small random ID
export function uid(prefix='id'){ return `${prefix}-${Math.random().toString(36).slice(2,9)}`; }

// Format percent nicely for Arabic UI
export function formatPercent(value, digits=0){
  if(isNaN(value)) return '0%';
  return `${(value*100).toFixed(digits)}%`;
}

// Sleep utility (promise)
export const sleep = (ms)=> new Promise(r=> setTimeout(r, ms));

// ------------------ Speech synthesis helpers ------------------
let voicesCache = null;

export function getHebrewVoice(){
  if(voicesCache) return voicesCache.find(v=>/he/i.test(v.lang));
  voicesCache = window.speechSynthesis.getVoices();
  return voicesCache.find(v=>/he/i.test(v.lang));
}

export function speak(text, opts={}){
  if(!('speechSynthesis' in window)) return;
  const voice = getHebrewVoice();
  const u = new SpeechSynthesisUtterance(text);
  if(voice) u.voice = voice;
  u.lang = 'he-IL';
  u.pitch = opts.pitch || 1;
  u.rate = opts.rate || 0.9;
  u.volume = opts.volume ?? 1;
  try{ window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); }
  catch(err){ console.warn('speak error', err); }
}

// Retry to load voices if not ready yet
if(typeof window !== 'undefined' && 'speechSynthesis' in window){
  window.speechSynthesis.onvoiceschanged = ()=>{
    voicesCache = window.speechSynthesis.getVoices();
  };
}
