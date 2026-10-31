import {draftToWorkout,GARMIN_BASE_EXAMPLE,importZwo,parseWorkoutDescription,validateDraft} from './coach-workout-builder';
import type {WorkoutDraft,ImportedTarget,ImportedStep} from './coach-workout-builder';
import type {CoachWorkout} from './coach-engine';
import {escapeHtml,readJson,writeJson} from './coach-dom';
import './coach-workout-import.css';

export const CUSTOM_WORKOUTS_KEY='breakaway.coach.custom-workouts.v1';
const allowedKind=(v:string):v is ImportedTarget=>['heart_rate','power','ftp_percent','open'].includes(v);
function storedWorkout(raw:unknown):CoachWorkout|null{
 if(!raw||typeof raw!=='object')return null;
 const data=raw as Partial<CoachWorkout>;
 if(!String(data.id||'').startsWith('custom-')||!Array.isArray(data.segments)||data.segments.length<1||data.segments.length>80)return null;
 if(!data.segments.every(x=>Number.isFinite(x?.minutes)&&x.minutes>0&&x.minutes<=480&&Number.isFinite(x.low)&&Number.isFinite(x.high)))return null;
 return {id:String(data.id).slice(0,100),name:String(data.name||'Imported workout').slice(0,70),
  description:String(data.description||'Custom ride').slice(0,300),category:'My Workouts',segments:data.segments};
}
export function readCustomWorkouts():CoachWorkout[]{
 const saved=readJson(CUSTOM_WORKOUTS_KEY);
 return Array.isArray(saved)?saved.map(storedWorkout).filter((w):w is CoachWorkout=>w!==null).slice(-30):[];
}
type OCRWorker={recognize(file:File):Promise<{data:{text:string}}>;terminate():Promise<void>};
type TesseractApi={createWorker(lang:string):Promise<OCRWorker>};
const pin='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
let tesseractLoading:Promise<TesseractApi>|null=null;
function getTesseract():Promise<TesseractApi>{
 if(tesseractLoading)return tesseractLoading;
 tesseractLoading=new Promise((resolve,reject)=>{
  const external=window as Window & {Tesseract?:TesseractApi};
  if(external.Tesseract){resolve(external.Tesseract);return;}
  const script=document.createElement('script');
  script.src=pin;script.async=true;script.crossOrigin='anonymous';
  script.onload=()=>external.Tesseract?resolve(external.Tesseract):reject(Error('The OCR library did not load.'));
  script.onerror=()=>reject(Error('Could not load the on-device OCR library. Paste the workout details instead.'));
  document.head.append(script);
 }).catch(error=>{tesseractLoading=null;throw error;});
 return tesseractLoading;
}
async function readScreenshot(file:File):Promise<string>{
 const api=await getTesseract();
 const worker=await api.createWorker('eng');
 try{return (await worker.recognize(file)).data.text;}
 finally{await worker.terminate();}
}
export function mountWorkoutImporter(host:HTMLElement,onUse:(workout:CoachWorkout)=>void){
 let draft:WorkoutDraft|null=null;
 let photoURL:string|null=null;
 const status=(message:string)=>{const node=host.querySelector<HTMLElement>('#coachImportStatus');if(node)node.textContent=message;};
 host.innerHTML=
  '<details class="coach-import-workout" id="coachWorkoutImport"><summary>+ Create or import a workout</summary>'+
  '<div class="coach-import-body"><p>Describe your workout, or upload a Garmin screenshot. Review the targets before starting Classic.</p>'+
  '<label for="coachImportDescription">DESCRIBE YOUR WORKOUT</label>'+
  '<textarea id="coachImportDescription" rows="5" placeholder="Example: Base ride, 2 hours, heart rate 103–114 bpm. Or: 15 min warm up at 55% FTP, 30 min at 70% FTP, 10 min cool down."></textarea>'+
  '<div class="coach-import-actions">'+
  '<button type="button" id="coachImportParse">CREATE FROM DESCRIPTION</button>'+
  '<button type="button" id="coachImportExample">TRY GARMIN EXAMPLE</button></div>'+
  '<label for="coachImportFile" class="coach-import-file-label">UPLOAD SCREENSHOT OR WORKOUT FILE</label>'+
  '<input id="coachImportFile" type="file" accept="image/png,image/jpeg,image/webp,image/heic,image/heif,.zwo,.txt,text/plain">'+
  '<p class="coach-import-help">PNG, JPG, HEIC (when your browser supports it), ZWO, or TXT. Screenshot recognition runs on your device using an OCR library downloaded when needed. Nothing is uploaded to Breakaway. Check the result carefully.</p>'+
  '<div id="coachImportPhoto" class="coach-import-photo" hidden></div>'+
  '<p id="coachImportStatus" role="status" aria-live="polite"></p>'+
  '<div id="coachImportReview" hidden></div></div></details>';
 const $=<T extends HTMLElement=HTMLElement>(id:string)=>host.querySelector<T>('#'+id)!;
 const description=$<HTMLTextAreaElement>('coachImportDescription');
 function buildReview(next:WorkoutDraft,warnings:string[]=[]){
  draft=next;
  const review=$('coachImportReview');review.hidden=false;
  review.innerHTML='<div class="coach-import-review-head"><strong>Review your workout</strong><span>EDIT ANYTHING THAT LOOKS WRONG</span></div>'+
   '<label for="coachImportName">WORKOUT NAME</label><input id="coachImportName" maxlength="70" value="'+escapeHtml(next.name)+'">'+
   '<div class="coach-import-table-head"><span>STEP / DURATION</span><span>TARGET TYPE / RANGE</span></div>'+
   next.steps.map((step,i)=>{
    const options:{id:ImportedTarget;label:string}[]=[{id:'heart_rate',label:'Heart rate (bpm)'},{id:'power',label:'Fixed watts'},{id:'ftp_percent',label:'% FTP'},{id:'open',label:'Free ride'}];
    return '<div class="coach-import-step" data-import-step="'+i+'">'+
     '<div><label for="coachImportStepName'+i+'">STEP '+(i+1)+'</label><input id="coachImportStepName'+i+'" data-step-name="'+i+'" value="'+escapeHtml(step.name)+'">'+
     '<label for="coachImportMinutes'+i+'">DURATION (MIN)</label><input id="coachImportMinutes'+i+'" data-step-minutes="'+i+'" type="number" min=".0167" max="480" step=".0167" value="'+Number(step.minutes.toFixed(4))+'"></div>'+
     '<div><label for="coachImportKind'+i+'">INTENSITY</label><select id="coachImportKind'+i+'" data-step-kind="'+i+'">'+
     options.map(o=>'<option value="'+o.id+'" '+(o.id===step.target?'selected':'')+'>'+o.label+'</option>').join('')+'</select>'+
     '<div class="coach-import-range"><label>LOW<input data-step-low="'+i+'" aria-label="Step '+(i+1)+' minimum target" type="number" min="0" max="1500" value="'+(step.low??'')+'" '+(step.target==='open'?'disabled':'')+'></label>'+
     '<label>HIGH<input data-step-high="'+i+'" aria-label="Step '+(i+1)+' maximum target" type="number" min="0" max="1500" value="'+(step.high??'')+'" '+(step.target==='open'?'disabled':'')+'></label></div></div></div>';
   }).join('')+
   '<p class="coach-import-warning">'+(warnings.length?warnings.map(x=>escapeHtml(x)).join(' '):'Verify duration and intensity for every step before riding.')+'</p>'+
   '<div class="coach-import-save-actions"><button type="button" id="coachImportUse">SAVE & USE IN CLASSIC →</button><button type="button" id="coachImportDiscard">CANCEL</button></div>';
 }
 function collect():WorkoutDraft{
  if(!draft)throw Error('Create a workout to review first.');
  const values:ImportedStep[]=draft.steps.map((s,i)=>{
   const kind=$<HTMLSelectElement>('coachImportKind'+i).value;
   if(!allowedKind(kind))throw Error('Step '+(i+1)+': unknown target.');
   const low=kind==='open'?null:Number(host.querySelector<HTMLInputElement>('[data-step-low="'+i+'"]')?.value||NaN);
   const high=kind==='open'?null:Number(host.querySelector<HTMLInputElement>('[data-step-high="'+i+'"]')?.value||NaN);
   return {name:($<HTMLInputElement>('coachImportStepName'+i)).value.trim(),
    minutes:Number(($<HTMLInputElement>('coachImportMinutes'+i)).value),
    target:kind,low,high};
  });
  return validateDraft({name:$<HTMLInputElement>('coachImportName').value,steps:values,notes:draft.notes,source:draft.source});
 }
 $('coachImportParse').addEventListener('click',()=>{
  const result=parseWorkoutDescription(description.value);
  if(!result.draft){status(result.error||'Could not interpret this workout.');return;}
  buildReview(result.draft,result.warnings);status('Workout created. Check every duration and target below.');
 });
 $('coachImportExample').addEventListener('click',()=>{
  description.value=GARMIN_BASE_EXAMPLE;
  const result=parseWorkoutDescription(GARMIN_BASE_EXAMPLE,'screenshot');
  if(result.draft){buildReview(result.draft,result.warnings);status('Garmin Base example loaded: 2 hours at 103–114 bpm.');}
 });
 $<HTMLInputElement>('coachImportFile').addEventListener('change',async event=>{
  const file=(event.currentTarget as HTMLInputElement).files?.[0];
  if(!file)return;
  if(file.size>12*1024*1024){status('The file is too large (maximum 12 MB).');return;}
  const old=photoURL;
  if(old){URL.revokeObjectURL(old);photoURL=null;}
  const photo=$('coachImportPhoto');photo.hidden=true;photo.innerHTML='';
  let text='';
  try{
   if(/\.(zwo)$/i.test(file.name)){
    const result=importZwo(await file.text());
    if(!result.draft){status(result.error||'Could not import that ZWO workout.');return;}
    buildReview(result.draft,result.warnings);status('ZWO loaded. Review all intervals before using.');return;
   }
   if(file.type.startsWith('image/')||/\.(heic|heif|png|jpeg|jpg|webp)$/i.test(file.name)){
    photoURL=URL.createObjectURL(file);
    const img=document.createElement('img');img.src=photoURL;img.alt='Screenshot chosen for workout import';photo.append(img);photo.hidden=false;
    status('Reading screenshot on your device. The first recognition may take a little longer.');
    text=await readScreenshot(file);
   }else if(file.type==='text/plain'||file.name.toLowerCase().endsWith('.txt')){
    text=await file.text();
   }else{status('Choose a screenshot (PNG/JPG/HEIC), TXT or ZWO workout file.');return;}
   description.value=text.slice(0,12000);
   const parsed=parseWorkoutDescription(description.value,file.type.startsWith('image/')?'screenshot':'text');
   if(!parsed.draft){status('Screenshot text extracted, but no reliable workout duration was found. Correct the text above, then choose Create from Description.');return;}
   buildReview(parsed.draft,parsed.warnings);
   status('Workout details extracted. Please correct any OCR mistakes before saving.');
  }catch(error){
   status('Screenshot reading did not work in this browser: '+String(error instanceof Error?error.message:error)+'. You can still type the workout details above.');
  }
 });
 host.addEventListener('change',event=>{
  const target=event.target;
  if(!(target instanceof HTMLSelectElement)||!target.hasAttribute('data-step-kind'))return;
  const row=target.closest<HTMLElement>('[data-import-step]');if(!row)return;
  row.querySelectorAll<HTMLInputElement>('[data-step-low],[data-step-high]').forEach(input=>{input.disabled=target.value==='open';});
 });
 host.addEventListener('click',event=>{
  const node=event.target;
  if(!(node instanceof Element))return;
  if(node.closest('#coachImportDiscard')){$('coachImportReview').hidden=true;status('Draft cleared.');draft=null;return;}
  if(!node.closest('#coachImportUse'))return;
  try{
   const result=collect(),workout=draftToWorkout(result,'custom-'+Date.now());
   const saved=readCustomWorkouts().filter(w=>w.id!==workout.id).concat(workout).slice(-30);
   if(!writeJson(CUSTOM_WORKOUTS_KEY,saved)){status('Could not save this workout on your device. Check browser storage.');return;}
   onUse(workout);
   status('Workout saved and loaded into Today. Connect a trainer in Classic when ready.');
   const details=$<HTMLDetailsElement>('coachWorkoutImport');details.open=false;
  }catch(error){status(error instanceof Error?error.message:String(error));}
 });
 return {get stored(){return readCustomWorkouts();}};
}
