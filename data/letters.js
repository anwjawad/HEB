// data/letters.js — Core Hebrew letters dataset
// Minimal yet informative fields for flashcards, tracing, and reading.

export const LETTERS = [
  // Basic consonants
  { id:'alef',   letter:'א', name:'ألف',   heb:'אָלֶף', translit:"Alef",   sound:'صامت/حامل الحركة', arabicApprox:'—', example:'אֹור', ex_ar:'نور' },
  { id:'bet',    letter:'ב', name:'بيت',   heb:'בֵּית', translit:"Bet",    sound:'ب/ڤ (مع نقطة)',   arabicApprox:'ب/ف', example:'בַּיִת', ex_ar:'بيت', dagesh:true },
  { id:'gimel',  letter:'ג', name:'جيم',   heb:'גִּימֶל', translit:"Gimel", sound:'ج/غ (لهجة)',      arabicApprox:'ج', example:'גָּמָל', ex_ar:'جمل', dagesh:true },
  { id:'dalet',  letter:'ד', name:'دال',   heb:'דָּלֶת', translit:"Dalet", sound:'د',               arabicApprox:'د', example:'דֶּלֶת', ex_ar:'باب' },
  { id:'he',     letter:'ה', name:'هيه',   heb:'הֵא',   translit:"He",    sound:'هـ/هاء ساكنة',   arabicApprox:'ه', example:'הַר', ex_ar:'جبل' },
  { id:'vav',    letter:'ו', name:'فاف',   heb:'וָו',   translit:"Vav",   sound:'ف/و/أُو (حركة طويلة)', arabicApprox:'و/ف', example:'וָו', ex_ar:'خطاف' },
  { id:'zayin',  letter:'ז', name:'زاين',  heb:'זַיִן', translit:"Zayin", sound:'ز',               arabicApprox:'ز', example:'זְמַן', ex_ar:'زمن' },
  { id:'het',    letter:'ח', name:'حيت',   heb:'חֵית',  translit:"Het",   sound:'ح/خ خفيفة',       arabicApprox:'ح/خ', example:'חַלָּב', ex_ar:'حليب' },
  { id:'tet',    letter:'ט', name:'طيت',   heb:'טֵית',  translit:"Tet",   sound:'ط/ت مفخمة',       arabicApprox:'ط', example:'טוֹב', ex_ar:'جيد' },
  { id:'yod',    letter:'י', name:'يود',   heb:'יוֹד',  translit:"Yod",   sound:'ي/إي طويلة',      arabicApprox:'ي', example:'יָד', ex_ar:'يد' },
  { id:'kaf',    letter:'כ', name:'كاف',   heb:'כַּף',  translit:"Kaf",   sound:'ك/خ (بدون نقطة)',  arabicApprox:'ك/خ', example:'כֶּסֶף', ex_ar:'مال', dagesh:true, final:'ך' },
  { id:'lamed',  letter:'ל', name:'لامد',  heb:'לָמֶד', translit:"Lamed", sound:'ل',               arabicApprox:'ل', example:'לֶחֶם', ex_ar:'خبز' },
  { id:'mem',    letter:'מ', name:'ميم',   heb:'מֵם',   translit:"Mem",   sound:'م',               arabicApprox:'م', example:'מַיִם', ex_ar:'ماء', final:'ם' },
  { id:'nun',    letter:'נ', name:'نون',   heb:'נוּן',  translit:"Nun",   sound:'ن',               arabicApprox:'ن', example:'נֵר', ex_ar:'شمعة', final:'ן' },
  { id:'samekh', letter:'ס', name:'سميخ',  heb:'סָמֶךְ', translit:"Samekh", sound:'س',            arabicApprox:'س', example:'סֵפֶר', ex_ar:'كتاب' },
  { id:'ayin',   letter:'ע', name:'عين',   heb:'עַיִן', translit:"Ayin",  sound:'ع/وقف حنجري',     arabicApprox:'ع', example:'עֵץ', ex_ar:'شجرة' },
  { id:'pe',     letter:'פ', name:'فيه',   heb:'פֵּא',  translit:"Pe",    sound:'ف/پ (مع نقطة)',   arabicApprox:'ف/پ', example:'פֶּה', ex_ar:'فم', dagesh:true, final:'ף' },
  { id:'tsadi',  letter:'צ', name:'صادي',  heb:'צָדִי', translit:"Tsadi", sound:'ص/تس',            arabicApprox:'ص', example:'צָפוֹן', ex_ar:'شمال', final:'ץ' },
  { id:'qof',    letter:'ק', name:'قوف',   heb:'קוֹף',  translit:"Qof",   sound:'ق/ك لهجياً',       arabicApprox:'ق', example:'קֶרֶח', ex_ar:'جليد' },
  { id:'resh',   letter:'ר', name:'ريش',   heb:'רֵישׁ', translit:"Resh",  sound:'ر (مفخّم/مقلقل)', arabicApprox:'ر', example:'רֹאשׁ', ex_ar:'رأس' },
  { id:'shin',   letter:'ש', name:'شين/سين',heb:'שִׁין', translit:"Shin/Sin", sound:'ش/س (نقطة يمين=ش، يسار=س)', arabicApprox:'ش/س', example:'שֶׁמֶשׁ', ex_ar:'شمس' },
  { id:'tav',    letter:'ת', name:'تاڤ',   heb:'תָּו',  translit:"Tav",   sound:'ت',               arabicApprox:'ت', example:'תוֹרָה', ex_ar:'توراة' }
];

// Utility to get final form if exists
export function getFinalForm(letter){
  const item = LETTERS.find(l=> l.letter === letter || l.final === letter);
  return item?.final || null;
}
