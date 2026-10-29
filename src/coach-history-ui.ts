import {historySummary,mergeRides} from './coach-history-core';
import type {HistoricalRide} from './coach-history-core';
import {clearHistoricalRides,collectRiderFiles,loadHistoricalRides,saveHistoricalRides} from './coach-history-import';
import './coach-history.css';

type HistoryCallbacks={applySuggestion:(suggestion:{ftp?:number;hours?:number})=>void};
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function mountCoachHistory(host:HTMLElement,callbacks:HistoryCallbacks){
 let activities:HistoricalRide[]=[],pending:HistoricalRide[]|null=null,busy=false;
 host.innerHTML='<div class="coach-section-top"><span class="coach-tag">05 / RIDER HISTORY</span><span class="coach-tag">YOUR FILES · YOUR DEVICE</span></div>'+
 '<h2>BRING YOUR HISTORY.</h2><p class="coach-small">Import your Strava account export or original cycling recordings. No Strava account connection, API, or server upload.</p>'+
 '<div class="coach-history-import-zone" id="coachImportZone" tabindex="0" role="group" aria-label="Choose a Strava archive or ride files">'+
 '<div class="coach-upload-icon">⇧</div><strong>DROP A STRAVA ZIP OR RIDE FILES HERE</strong>'+
 '<span>ZIP · activities.csv · FIT · TCX · GPX · FIT.GZ · TCX.GZ · GPX.GZ</span>'+
 '<label for="coachImportFiles" class="coach-upload-button">CHOOSE FILES</label><input id="coachImportFiles" type="file" multiple accept=".zip,.csv,.fit,.tcx,.gpx,.gz" hidden></div>'+
 '<div class="coach-import-stage" id="coachImportStage" aria-live="polite"></div>'+
 '<div id="coachHistoryStats"><p class="coach-small">Loading saved activities…</p></div>'+
 '<p class="coach-small coach-history-privacy">The browser reads activity files locally. Only summarized ride metrics are saved in this browser’s IndexedDB; GPS tracks and original files are not retained. Imported history is not uploaded, synced or used by a hosted AI model.</p>'+
 '<div class="coach-history-footer"><button type="button" id="coachHistoryClear">CLEAR IMPORTED HISTORY</button><a href="https://support.strava.com/en-us/articles/15401919-how-do-i-export-my-strava-data" rel="noopener noreferrer" target="_blank">How to export from Strava ↗</a></div>';
 const $=(id:string)=>host.querySelector<HTMLElement>('#'+id)!;
 const choose=$('coachImportFiles') as HTMLInputElement;
 const stage=$('coachImportStage');
 const zone=$('coachImportZone');
 const clear=$('coachHistoryClear') as HTMLButtonElement;
 function renderSummary(){
  const s=historySummary(activities);
  const weeks=s.weeks.map((w,i)=>({hours:w.hours,week:new Date(w.start).toLocaleDateString(undefined,{month:'short',day:'numeric'}),height:Math.max(2,Math.round(w.hours/Math.max(1,...s.weeks.map(a=>a.hours))*100)),index:i}));
  $('coachHistoryStats').innerHTML=
   '<div class="coach-history-stats">'+
   '<div><strong>'+s.total.toLocaleString()+'</strong><span>Historical rides</span></div>'+
   '<div><strong>'+s.weeklyHours.toFixed(1)+' h</strong><span>Avg / week · last 8 weeks</span></div>'+
   '<div><strong>'+s.powerRides.toLocaleString()+'</strong><span>Rides with power</span></div></div>'+
   '<div class="coach-history-bars" role="img" aria-label="Training hours in the last eight calendar weeks">'+
   weeks.map(w=>'<div class="coach-history-bar-wrap"><span>'+w.hours.toFixed(1)+'h</span><div class="coach-history-bar-track"><div style="height:'+w.height+'%"></div></div><small>'+esc(w.week)+'</small></div>').join('')+
   '</div>'+
   '<div class="coach-history-insights"><div><strong>RECENT TRAINING VOLUME</strong><p>'+s.weeklyHours.toFixed(1)+' hours per week on average over the past eight calendar weeks.</p></div>'+
   '<div><strong>POWER HISTORY</strong><p>'+(s.suggestedFtp===null?'Not enough recent 20-minute recorded power for an FTP estimate.':'Candidate FTP ~'+s.suggestedFtp+' W, calculated as 95% of the best recorded 20-minute power in the last 120 days. Confirm with an FTP test.')+'</p></div></div>'+
   (s.total?'<div class="coach-history-suggestions">'+(s.weeklyHours>=1?'<button id="coachUseHours" type="button">USE '+Math.min(20,Math.max(1,Math.round(s.weeklyHours*2)/2))+' H/WEEK</button>':'')+
   (s.suggestedFtp!==null?'<button id="coachUseFtp" type="button">REVIEW FTP '+s.suggestedFtp+' W</button>':'')+'</div>':'')+
   (s.total?'<div class="coach-history-latest"><strong>LATEST IMPORTS</strong>'+activities.slice(0,5).map(r=>
    '<div><span>'+esc(new Date(r.start).toLocaleDateString())+' · '+esc(r.name)+'</span><small>'+esc(r.source)+' · '+Math.round(r.duration/60)+' min</small></div>').join('')+'</div>':'<p class="coach-small">No imported rides yet. Upload your Strava archive to see fitness history here.</p>');
  $('coachUseHours')?.addEventListener('click',()=>{
   if(s.weeklyHours<1)return;
   callbacks.applySuggestion({hours:Math.min(20,Math.max(1,Math.round(s.weeklyHours*2)/2))});
   stage.textContent='Weekly training hours updated in your Coach profile. You can edit them anytime.';
  });
  $('coachUseFtp')?.addEventListener('click',()=>{
   if(s.suggestedFtp===null)return;
   if(!confirm('Apply the historical FTP estimate of '+s.suggestedFtp+' W to Coach? This is not a substitute for an FTP test.'))return;
   callbacks.applySuggestion({ftp:s.suggestedFtp});
   stage.textContent='FTP updated in Coach. Verify your training zones with a recent test.';
  });
 }
 async function reload(){
  try{activities=await loadHistoricalRides();renderSummary();}
  catch(error){$('coachHistoryStats').textContent='Could not open local history: '+String(error instanceof Error?error.message:error);}
 }
 function showStage(result:{rides:HistoricalRide[];read:number;skipped:number;errors:string[];csvRides:number;archives:number}){
  const combined=mergeRides(activities,result.rides);
  const added=combined.added,updated=combined.updated;
  stage.innerHTML='<div class="coach-import-result"><strong>READY TO SAVE · '+added+' NEW RIDES</strong>'+
   '<p>'+result.read+' recordings parsed · '+result.csvRides+' CSV cycling rows · '+result.skipped+' files skipped · '+updated+' existing rides enhanced · '+combined.duplicates+' duplicates matched.</p>'+
   (result.errors.length?'<details><summary>Import warnings ('+result.errors.length+' shown)</summary><ul>'+result.errors.map(m=>'<li>'+esc(m)+'</li>').join('')+'</ul></details>':'')+
   '<div class="coach-import-actions"><button type="button" id="coachConfirmImport">SAVE HISTORY TO THIS DEVICE</button><button type="button" id="coachCancelImport">CANCEL</button></div></div>';
  pending=combined.rides;
  $('coachConfirmImport').addEventListener('click',async()=>{
   if(!pending||busy)return;
   busy=true;const copy=pending;const button=$('coachConfirmImport') as HTMLButtonElement;button.disabled=true;
   try{await saveHistoricalRides(copy);activities=copy;pending=null;
    stage.textContent='Saved '+added+' new rides and enhanced '+updated+' activities on this device.';renderSummary();
   }catch(error){stage.textContent='Save failed (nothing was changed): '+String(error instanceof Error?error.message:error);}
   finally{busy=false;}
  });
  $('coachCancelImport').addEventListener('click',()=>{pending=null;stage.textContent='Import canceled. Your saved history was not changed.';});
 }
 async function importFiles(files:File[]){
  if(busy||!files.length)return;
  busy=true;pending=null;clear.disabled=true;
  zone.setAttribute('aria-busy','true');stage.textContent='Reading activity files locally…';
  try{
   const result=await collectRiderFiles(files,progress=>{
    stage.textContent='Reading '+progress.done+' / '+progress.total+' files · '+progress.accepted+' cycling recordings · '+progress.skipped+' skipped';
   });
   if(!result.rides.length)stage.textContent='No valid cycling rides were found. '+(result.errors[0]||'Try a Strava archive or individual activity recordings.');
   else showStage(result);
  }catch(error){stage.textContent='Import could not finish: '+String(error instanceof Error?error.message:error);}
  finally{busy=false;clear.disabled=false;zone.removeAttribute('aria-busy');choose.value='';}
 }
 choose.addEventListener('change',()=>void importFiles(Array.from(choose.files||[])));
 for(const type of ['dragenter','dragover'])zone.addEventListener(type,event=>{event.preventDefault();zone.classList.add('coach-drop-active');});
 zone.addEventListener('dragleave',event=>{event.preventDefault();zone.classList.remove('coach-drop-active');});
 zone.addEventListener('drop',event=>{event.preventDefault();zone.classList.remove('coach-drop-active');
  const files=Array.from((event as DragEvent).dataTransfer?.files||[]);void importFiles(files);});
 zone.addEventListener('keydown',event=>{
  if(event.target===zone&&(event as KeyboardEvent).key==='Enter'){event.preventDefault();choose.click();}
 });
 clear.addEventListener('click',async()=>{
  if(busy)return;
  if(!confirm('Delete all historical rides imported into Breakaway Coach on this device? Your original Strava files are not affected.'))return;
  busy=true;clear.disabled=true;
  try{await clearHistoricalRides();pending=null;activities=[];stage.textContent='Imported history deleted from this device.';renderSummary();}
  catch(error){stage.textContent='Delete failed: '+String(error instanceof Error?error.message:error);}
  finally{busy=false;clear.disabled=false;}
 });
 void reload();
 return {reload};
}
