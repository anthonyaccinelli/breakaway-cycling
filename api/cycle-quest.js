import {createHmac,createHash,timingSafeEqual} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const COOKIE='breakaway_quest_beta';
const safeEqual=(a,b)=>timingSafeEqual(createHash('sha256').update(a).digest(),createHash('sha256').update(b).digest());
const sign=(value,secret)=>createHmac('sha256',secret).update(value).digest('base64url');
export function validSession(cookie,secret,now=Date.now()){if(!cookie||!secret)return false;const [expiry,signature,...extra]=cookie.split('.');return !extra.length&&/^\d+$/.test(expiry)&&Number(expiry)>now&&Number(expiry)<=now+86400000+60000&&!!signature&&safeEqual(signature,sign(expiry,secret));}
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store, max-age=0');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Robots-Tag','noindex, nofollow');
 const password=process.env.CYCLE_QUEST_PASSWORD,secret=process.env.CYCLE_QUEST_SESSION_SECRET;
 if(!password||!secret)return res.status(503).json({error:'Cycle Quest beta access is not configured.'});
 const url=new URL(req.url,'https://'+req.headers.host),asset=url.searchParams.get('asset')||'index.html';
 if(req.method==='POST'){
  const origin=req.headers.origin;if(origin&&new URL(origin).host!==req.headers.host)return res.status(403).json({error:'Invalid origin'});
  let body=req.body;try{if(typeof body==='string')body=JSON.parse(body);}catch{return res.status(400).json({error:'Invalid request'});}
  if(!body||typeof body.password!=='string'||body.password.length>200||!safeEqual(body.password,password))return res.status(401).json({error:'Incorrect password'});
  const expires=String(Date.now()+86400000);res.setHeader('Set-Cookie',`${COOKIE}=${expires}.${sign(expires,secret)}; Path=/api/cycle-quest; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`);return res.status(200).json({ok:true});
 }
 if(req.method!=='GET')return res.status(405).end();
 const cookie=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
 if(!validSession(cookie,secret))return res.status(401).json({error:'Cycle Quest requires the beta password.'});
 if(asset==='status')return res.status(200).json({ok:true});
 const assets={'summary-capture.js':'text/javascript; charset=utf-8','SUMMARY-CAPTURE-LICENSE.txt':'text/plain; charset=utf-8','reward-gesture.js':'text/javascript; charset=utf-8','index.html':'text/html; charset=utf-8','shared-ui.css':'text/css; charset=utf-8','devices-ui.css':'text/css; charset=utf-8','devices-ui.js':'text/javascript; charset=utf-8','shared-ui.js':'text/javascript; charset=utf-8','game.js':'text/javascript; charset=utf-8','routes.js':'text/javascript; charset=utf-8','monsters.js':'text/javascript; charset=utf-8','combat.js':'text/javascript; charset=utf-8','profile.js':'text/javascript; charset=utf-8','level-up.js':'text/javascript; charset=utf-8','workout-ui.js':'text/javascript; charset=utf-8','workouts.js':'text/javascript; charset=utf-8','fit-decoder.js':'text/javascript; charset=utf-8','FIT-PARSER-LICENSE.txt':'text/plain; charset=utf-8'};
 if(!assets[asset])return res.status(404).end();
 try{const content=await readFile(path.join(process.cwd(),'cycle-quest',asset),'utf8');res.setHeader('Content-Type',assets[asset]);res.setHeader('Content-Security-Policy',"frame-ancestors 'self'");return res.status(200).send(content);}catch{return res.status(500).json({error:'Cycle Quest could not be loaded.'});}
}
