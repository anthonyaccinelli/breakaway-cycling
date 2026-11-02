// Shared UI helpers. Do not import into pure coaching engines (which are tested standalone).
const ESCAPES:Record<string,string>={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
export const escapeHtml=(value:string):string=>value.replace(/[&<>"']/g,c=>ESCAPES[c]);
export const readJson=(key:string):unknown=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}};
export const writeJson=(key:string,value:unknown):boolean=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
// Match the ISO date keys used by the adaptive planner and seven-day calendar.
export const dayKey=(value:Date):string=>[value.getFullYear(),String(value.getMonth()+1).padStart(2,'0'),String(value.getDate()).padStart(2,'0')].join('-');

// Old versions stored unpadded keys (e.g. 2026-11-2). Preserve existing skips.
export const normalizeDayKey=(value:unknown):string=>{
 if(typeof value!=='string')return '';
 const match=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
 if(!match)return '';
 const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
 const date=new Date(year,month-1,day);
 if(date.getFullYear()!==year||date.getMonth()+1!==month||date.getDate()!==day)return '';
 return [match[1],String(month).padStart(2,'0'),String(day).padStart(2,'0')].join('-');
};
