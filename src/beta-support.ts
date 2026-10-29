/// <reference types="vite/client" />
import './beta-support.css';
import {sendBugReport, type ReportMode} from './beta-report';
const MARKUP='<section class="beta-compat" aria-label="Browser and trainer compatibility"><div class="beta-compat-top"><span class="beta-check-icon" aria-hidden="true">✓</span><div class="beta-compat-copy"><strong>Testing with a trainer? Start here.</strong><p>Use current <b>Chrome or Edge on Windows or macOS</b> with a Bluetooth FTMS trainer.<br>The always-on-top overlay requires a desktop browser with Document Picture-in-Picture.</p><div class="beta-capabilities"><span class="beta-capability" id="beta-bluetooth-cap"><i aria-hidden="true"></i>Bluetooth pairing: <b>Checking…</b></span><span class="beta-capability" id="beta-overlay-cap"><i aria-hidden="true"></i>Always-on-top: <b>Checking…</b></span></div><details><summary>Compatibility details &amp; pairing tips</summary><div class="beta-details-grid"><p><b>Windows / macOS:</b> current Chrome or Edge is the recommended beta setup.</p><p><b>Android / ChromeOS:</b> browser Bluetooth is available in Chrome; Ride Breakaway testing is welcome. No mobile overlay promise.</p><p><b>Safari / Firefox:</b> native browser Bluetooth trainer pairing is unavailable.</p><p><b>iPhone / iPad:</b> native pairing in standard browsers is unavailable. <b>Linux:</b> experimental, outside the recommended beta setup.</p></div><p class="beta-details-note">“Available” means this browser exposes the feature, not that a trainer is connected. Allow Bluetooth access and disconnect other apps using your trainer. A normal popup is not an always-on-top overlay.</p></details></div></div></section><dialog class="beta-dialog" id="beta-report-dialog" aria-labelledby="beta-report-title"><div id="beta-report-entry"><div class="beta-modal-head"><span class="beta-eyebrow">HELP SHAPE BREAKAWAY</span><h2 id="beta-report-title">What happened?</h2><p>A little detail helps us reproduce the problem.</p><button class="beta-close" type="button" aria-label="Close bug report">×</button></div><form id="beta-bug-form" class="beta-form-body"><label class="beta-field"><span>Trainer model</span><input id="beta-trainer" name="beta-trainer" placeholder="e.g. Elite Direto XR-T" maxlength="120" required><small>No trainer connected? Enter “No trainer connected”.</small></label><label class="beta-field"><span>Browser &amp; operating system</span><input id="beta-browser" name="beta-browser" maxlength="200" required><small>Prefilled where detected. Please correct anything that looks wrong.</small></label><label class="beta-field"><span>Game mode</span><select id="beta-game-mode" name="mode" required><option>Classic</option><option>Survival</option><option>Cycle Quest</option></select></label><label class="beta-field"><span>What happened?</span><textarea id="beta-description" name="beta-description" placeholder="What were you doing? What did you expect, and what happened instead?" maxlength="5000" required></textarea></label><p class="beta-error" id="beta-report-error" role="alert" hidden></p><div class="beta-form-bottom"><small>Reports go privately to the developer. No account required.</small><button type="submit">Send report →</button></div></form></div><div class="beta-success" id="beta-report-success" hidden><h2>Report sent.</h2><p>Thanks for helping improve Ride Breakaway.</p><button class="beta-bug" id="beta-done">Done</button></div></dialog><dialog class="beta-dialog" id="beta-access-dialog" aria-labelledby="beta-access-title"><div class="beta-modal-head"><span class="beta-eyebrow" style="color:#ffe777">CYCLE QUEST · PRIVATE BETA</span><h2 id="beta-access-title">Your adventure starts here.</h2><p>Select “Start Your Quest” on Ride Breakaway, then enter:</p><button class="beta-close" aria-label="Close beta access">×</button></div><div class="beta-access-body"><code class="beta-password">cloudstrife</code><p>Ride, earn XP, and battle enemies with your power output. Your character’s progress carries between rides.</p><button id="beta-beta-start-quest" class="beta-bug" type="button">Start your quest →</button></div></dialog>';
function browserDescription():string{
 const ua=navigator.userAgent;
 const match=ua.match(/Edg(?:A|iOS)?\/([\d.]+)/)||ua.match(/(?:Firefox|FxiOS)\/([\d.]+)/)||ua.match(/(?:Chrome|CriOS)\/([\d.]+)/)||ua.match(/Version\/([\d.]+).*Safari/);
 const name=/Edg/.test(ua)?'Edge':/Firefox|FxiOS/.test(ua)?'Firefox':/Chrome|CriOS/.test(ua)?'Chrome':/Safari/.test(ua)?'Safari':'Browser not detected';
 const os=/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1)?'iOS / iPadOS':/Windows/.test(ua)?'Windows (confirm version)':/Android/.test(ua)?'Android':/CrOS/.test(ua)?'ChromeOS':/Macintosh|Mac OS X/.test(ua)?'macOS (confirm version)':/Linux/.test(ua)?'Linux':'Operating system not detected';
 return name+(match?' '+match[1]:'')+' · '+os;
}
export function mountBetaSupport({home,getMode,getTrainer}:{home:HTMLElement;getMode:()=>string;getTrainer:()=>string}){
 const host=document.createElement('div');host.id='beta-support-host';host.innerHTML=MARKUP;document.body.append(host);
 const find=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById('beta-'+id) as T;
 home.querySelector('.mode-landing-intro')!.after(host.querySelector('.beta-compat')!);
 const report=find<HTMLDialogElement>('report-dialog'),access=find<HTMLDialogElement>('access-dialog'),form=find<HTMLFormElement>('bug-form');
 const trainer=find<HTMLInputElement>('trainer'),browser=find<HTMLInputElement>('browser'),mode=find<HTMLSelectElement>('game-mode'),description=find<HTMLTextAreaElement>('description');
 browser.value=browserDescription();
 const headerButton=document.createElement('button');headerButton.type='button';headerButton.className='beta-report-open';headerButton.textContent='Report a bug';home.querySelector('.mode-landing-meta')!.append(headerButton);
 const globalButton=headerButton.cloneNode(true) as HTMLButtonElement;globalButton.classList.add('beta-report-global');document.body.append(globalButton);
 const accessLine=document.createElement('p');accessLine.className='beta-access-line';accessLine.append('Curious about Cycle Quest? ');const accessButton=document.createElement('button');accessButton.type='button';accessButton.textContent='Get the beta password →';accessLine.append(accessButton);home.querySelector('.mode-landing-cards')!.after(accessLine);
 function openReport(){
  find('report-entry').hidden=false;find('report-success').hidden=true;find('report-error').hidden=true;
  mode.value=({classic:'Classic',survival:'Survival',cyclequest:'Cycle Quest'} as Record<string,ReportMode>)[getMode()]||'Classic';
  if(!trainer.value)trainer.value=getTrainer().slice(0,120);
  report.showModal();
 }
 headerButton.onclick=openReport;globalButton.onclick=openReport;accessButton.onclick=()=>access.showModal();
 host.querySelectorAll<HTMLButtonElement>('.beta-close').forEach(button=>button.onclick=()=>button.closest('dialog')!.close());
 find('done').onclick=()=>{report.close();description.value='';};
 find('beta-start-quest').onclick=()=>{access.close();home.querySelector<HTMLButtonElement>('#chooseCycleQuest')!.click();};
 for(const [id,available] of [['bluetooth-cap',window.isSecureContext&&typeof (navigator as any).bluetooth?.requestDevice==='function'],['overlay-cap',window.isSecureContext&&typeof (window as any).documentPictureInPicture?.requestWindow==='function']] as const){
  const element=find(id);element.dataset.available=String(available);element.querySelector('b')!.textContent=available?'Available':'Unavailable in this browser';
 }
 let sending=false;
 form.onsubmit=async event=>{
  event.preventDefault();if(sending)return;
  const error=find('report-error'),button=form.querySelector<HTMLButtonElement>('button[type=submit]')!;
  error.hidden=true;sending=true;button.disabled=true;button.textContent='Sending…';
  try{
   await sendBugReport({trainer:trainer.value,browser:browser.value,mode:mode.value,description:description.value,build:'4.0.9-beta-support-20261029'},import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
   find('report-entry').hidden=true;find('report-success').hidden=false;find<HTMLButtonElement>('done').focus();
  }catch(e){error.textContent=e instanceof Error&&e.name!=='TimeoutError'?e.message:'Could not send your report. Your text has been kept; please try again.';error.hidden=false;}
  finally{sending=false;button.disabled=false;button.textContent='Send report →';}
 };
}
