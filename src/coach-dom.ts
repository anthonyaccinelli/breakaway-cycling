// Shared UI helpers. Do not import into pure coaching engines (which are tested standalone).
const ESCAPES:Record<string,string>={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
export const escapeHtml=(value:string):string=>value.replace(/[&<>"']/g,c=>ESCAPES[c]);
export const readJson=(key:string):unknown=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}};
export const writeJson=(key:string,value:unknown):boolean=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
export const dayKey=(value:Date):string=>value.getFullYear()+'-'+(value.getMonth()+1)+'-'+value.getDate();
