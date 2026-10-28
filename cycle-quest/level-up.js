// Uses wall-clock time so a celebration always lasts ten real seconds,
// regardless of trainer pauses or the autoplay preview's simulation speed.
export function createLevelUpQueue(duration=10000){
 let pending=null,active=null;
 return {
  enqueue(before,after){if(after<=before)return;pending={before:pending?.before??before,after};},
  update(now,blocked=false){if(active&&now>=active.until)active=null;if(!active&&pending&&!blocked){active={...pending,until:now+duration};pending=null;}return active;},
  get waiting(){return !!pending;},get current(){return active;},
  clear(){pending=null;active=null;}
 };
}
export function levelUpMarkup(event,stats,compact=false,now=performance.now()){
 const beforeHP=stats.hp(event.before),afterHP=stats.hp(event.after),beforeAttack=Math.round(stats.attack(event.before)),afterAttack=Math.round(stats.attack(event.after));
 const seconds=Math.max(1,Math.ceil((event.until-now)/1000));
 return '<section class="cq-levelup'+(compact?' cq-levelup-mini':'')+'" role="status" aria-label="Level up from '+event.before+' to '+event.after+'"><header><strong>LEVEL UP!</strong><span>LEVEL '+event.before+' <i>→</i> <b>'+event.after+'</b></span></header><div class="cq-levelup-gains"><div><span>MAX HP</span><strong>+'+(afterHP-beforeHP)+'</strong><small>'+beforeHP+' <i>→</i> <b>'+afterHP+'</b></small></div><div><span>ATTACK</span><strong>+'+(afterAttack-beforeAttack)+'</strong><small>'+beforeAttack+' <i>→</i> <b>'+afterAttack+'</b></small></div></div><footer><span>HP FULLY RESTORED</span><span>RETURNING IN '+seconds+'s</span></footer></section>';
}
