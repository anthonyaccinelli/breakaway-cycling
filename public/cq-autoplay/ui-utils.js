export function escapeHTML(value){
 return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
}
export function formatClock(seconds){
 const total=Math.max(0,Math.floor(Number(seconds)||0));
 return [Math.floor(total/3600),Math.floor(total%3600/60),total%60].map(n=>String(n).padStart(2,'0')).join(':');
}
export function rewardButtons(reward,compact=false){
 const key=(value)=>compact?'':`<span class="cq-rewardkey">${value}</span> `;
 return `<div class="cq-eventactions"><button data-reward="heal">${key('−')}HEAL ${reward.hp} HP</button><button data-reward="coins">${key('+')}GAIN ${reward.coins} COINS</button></div>`;
}
