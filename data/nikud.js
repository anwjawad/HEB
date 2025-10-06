// data/nikud.js — Basic Hebrew vowel points (נִקּוּד) and helpers
// Focuses on beginner-friendly set with programmatic composition utilities.

// NOTE: Most nikud are combining marks (U+05B0..U+05BC etc.).
// We expose a minimal set for early reading. Advanced cases can be added later.

export const NIKUD = [
  { id:'sheva',   name:'شـڤـا',    heb:'שְׁוָא',     mark:'ְ', translit:'ə/∅',  ex:'סְ', desc:'صامت جدًا/اختزال حركة' },
  { id:'hiriq',   name:'حيريق',   heb:'חִירִיק',    mark:'ִ', translit:'i',    ex:'בִ', desc:'كسرة قصيرة (إي)' },
  { id:'tsere',   name:'تسيري',   heb:'צֵירֵי',     mark:'ֵ', translit:'e',    ex:'בֵ', desc:'ياء ممالة/إي طويلة' },
  { id:'segol',   name:'سِجول',   heb:'סֶגוֹל',     mark:'ֶ', translit:'e',    ex:'בֶ', desc:'فتحة مائلة (إيه)' },
  { id:'patah',   name:'پتاح',    heb:'פַּתַח',     mark:'ַ', translit:'a',    ex:'בַ', desc:'فتحة قصيرة' },
  { id:'qamats',  name:'قامتص',   heb:'קָמַץ',      mark:'ָ', translit:'a/ɔ',  ex:'בָ', desc:'ألف ممالة (آ/أو لهجيًا)' },
  { id:'holam',   name:'حولام',   heb:'חוֹלָם',     mark:'ֹ', translit:'o',    ex:'בֹ', desc:'ضمة طويلة (أو)' },
  { id:'qubuts',  name:'قوبوتس',  heb:'קֻבּוּץ',     mark:'ֻ', translit:'u',    ex:'בֻ', desc:'ضمة قصيرة (أُ)' },
  // pseudo vowels with mater lectionis
  { id:'shuruk',  name:'شوروق',   heb:'שׁוּרוּק',   mark:'ּ', translit:'u',    ex:'וּ', special:'vav-dotted' }, // actually ו + ֻ (dagesh-like dot)
  { id:'holamVav',name:'حولام-ڤاف',heb:'חוֹלָם-וָו', mark:'ֹ', translit:'o',    ex:'וֹ', special:'vav-holam' },
  { id:'hiriqYod',name:'حيريق-يود',heb:'חִירִיק-יוֹד',mark:'\u05B4', translit:'i',  ex:'ִי', special:'yod-hiriq' }
];

// Compose base consonant + combining mark to a displayable syllable.
// Handles special mater-lectionis cases for וּ / וֹ / ִי
export function composeSyllable(baseLetter, nikud){
  const n = typeof nikud === 'string' ? NIKUD.find(x=>x.id===nikud) : nikud;
  if(!n) return baseLetter;

  if(n.special === 'vav-dotted') return 'ו' + '\u05BC'; // approximates shuruk appearance
  if(n.special === 'vav-holam')  return 'ו' + '\u05B9';
  if(n.special === 'yod-hiriq')  return '\u05B4' + 'י'; // order is mark then yod visually fine in most fonts

  // Normal composition: consonant + combining mark
  return baseLetter + n.mark;
}

// Create a small curriculum of common syllables for drills
export const SYLLABLE_DRILLS = [
  { base:'ב', vowels:['patah','qamats','tsere','hiriq','holam','qubuts'] },
  { base:'מ', vowels:['patah','segol','hiriq','holam','qubuts'] },
  { base:'ל', vowels:['patah','segol','tsere','hiriq'] },
  { base:'ש', vowels:['patah','segol','tsere','hiriq','holam'] },
  { base:'ק', vowels:['patah','qamats','holam'] },
];

export function expandDrillSet(){
  const out = [];
  for(const row of SYLLABLE_DRILLS){
    for(const v of row.vowels){
      out.push({ syllable: composeSyllable(row.base, v), base: row.base, vowel:v });
    }
  }
  return out;
}
