import {EXAMPLE_WORKOUT,IMPORTED_WORKOUT_KEY,parseWorkoutDescription} from './coach-workout-import';
import type {ImportedWorkoutDraft} from './coach-workout-import';
import {escapeHtml} from './coach-dom';
import './coach-workout-import.css';

const fmt=(minutes:number|null)=>minutes===null?'—':Math.floor(minutes/60)+':'+String(minutes%60).padStart(2,'0')+':00';
export function mountWorkoutImporter(root:HTMLElement){
  root.innerHTML=`
    <div class="ci-head">
      <div><span class="ci-eyebrow">WORKOUT STUDIO / BREAKAWAY COACH</span><h2>Turn a workout into a ride.</h2>
      <p>Describe a workout from Garmin Coach or any training plan. Review exactly what Coach understood.</p></div>
      <span class="ci-preview-tag">FEATURE PREVIEW</span>
    </div>
    <div class="ci-grid">
      <section class="ci-card">
        <div class="ci-card-title"><span class="ci-step">01</span><div><h3>Tell Coach what to ride</h3><p>Plain English works. Just include duration and intensity.</p></div></div>
        <div class="ci-source" role="tablist" aria-label="Import method">
          <button type="button" id="ciTabText" role="tab" aria-selected="true" aria-controls="ciPanelText">✎ Describe</button>
          <button type="button" id="ciTabImage" role="tab" aria-selected="false" aria-controls="ciPanelImage">▣ Screenshot</button>
          <button type="button" id="ciTabFile" role="tab" aria-selected="false" aria-controls="ciPanelFile">↥ Workout file</button>
        </div>
        <div id="ciPanelText" role="tabpanel" aria-labelledby="ciTabText">
          <label class="ci-label" for="ciDescription">YOUR WORKOUT DESCRIPTION</label>
          <textarea id="ciDescription" rows="6" spellcheck="true" placeholder="Ride for 2 hours at a steady pace. Keep heart rate between 103 and 114 bpm."></textarea>
          <div class="ci-helper"><span>Include total time and heart-rate or power targets.</span><button id="ciExample" type="button">RESET TO GARMIN EXAMPLE ↺</button></div>
        </div>
        <div id="ciPanelImage" role="tabpanel" aria-labelledby="ciTabImage" hidden>
          <div class="ci-upload"><div class="ci-upload-icon">▣</div><strong>Have a Garmin workout screenshot?</strong>
          <p>Preview an image here. Automatic screenshot extraction is not yet connected; use Describe to enter the requirements.</p>
          <label for="ciImage" class="ci-file-label">CHOOSE SCREENSHOT</label><input id="ciImage" type="file" accept="image/png,image/jpeg,image/webp" hidden>
          <span id="ciImageStatus">No file selected</span><img id="ciImagePreview" alt="Uploaded workout screenshot preview" hidden></div>
        </div>
        <div id="ciPanelFile" role="tabpanel" aria-labelledby="ciTabFile" hidden>
          <div class="ci-upload"><div class="ci-upload-icon">▤</div><strong>Structured workout files</strong>
          <p>FIT and ZWO workout conversion is planned, but not available in this preview.</p>
          <button type="button" id="ciBackToText" class="ci-outline">DESCRIBE INSTEAD →</button></div>
        </div>
        <div class="ci-note"><span class="ci-note-dot"></span> Coach only extracts values explicitly supplied. It does not guess FTP or power from heart rate.</div>
      </section>

      <section class="ci-card ci-result">
        <div class="ci-card-title"><span class="ci-step">02</span><div><h3>Review your workout</h3><p>Check the details before saving.</p></div></div>
        <div class="ci-result-heading"><div><span class="ci-eyebrow">CYCLING · IMPORTED WORKOUT</span><h4 id="ciTitle">Base</h4>
          <p id="ciSubtitle">One continuous steady cycling interval</p></div>
          <span id="ciStatus" class="ci-status">READY TO REVIEW</span></div>
        <div class="ci-stats">
          <div><span aria-hidden="true">◷</span><strong id="ciDuration">2:00:00</strong><small>DURATION</small></div>
          <div><span aria-hidden="true">♡</span><strong id="ciTarget">103–114</strong><small id="ciTargetUnit">TARGET BPM</small></div>
          <div><span aria-hidden="true">▥</span><strong>1</strong><small>WORKOUT STEP</small></div>
        </div>
        <div class="ci-timeline-heading"><strong>Workout timeline</strong><span id="ciTimelineType">Heart-rate target</span></div>
        <div class="ci-timeline" id="ciTimeline" role="img" aria-label="Continuous cycling workout lasting two hours with a heart rate target of 103 to 114 bpm">
          <div class="ci-timeline-top"><span>STEADY RIDE</span><span id="ciTimelineMinutes">120 MIN</span></div>
          <div class="ci-timeline-bar"><strong id="ciTimelineTarget">♡ 103–114 BPM</strong><span>MAINTAIN THROUGHOUT</span></div>
          <div class="ci-timeline-times"><span>0:00</span><span id="ciTimelineMiddle">1:00:00</span><span id="ciTimelineEnd">2:00:00</span></div>
        </div>
        <div class="ci-breakdown">
          <h5>Workout details</h5>
          <div><span>Sport</span><strong>Cycling</strong></div>
          <div><span>Structure</span><strong id="ciStructure">One continuous block</strong></div>
          <div><span>Trainer mode</span><strong id="ciTrainerMode">SIM / manual resistance</strong></div>
        </div>
        <div class="ci-warnings"><strong>Review these details</strong><ul id="ciWarnings"></ul></div>
        <button id="ciSave" type="button" class="ci-save">SAVE WORKOUT DRAFT →</button>
        <p id="ciSaveStatus" role="status" aria-live="polite"></p>
        <p class="ci-limit">In this preview, saving drafts works. Live heart-rate coaching and starting imported workouts in Classic are not yet implemented.</p>
      </section>
    </div>
  `;
  const $=(id:string)=>root.querySelector<HTMLElement>('#'+id)!;
  const input=$('ciDescription') as HTMLTextAreaElement;
  const file=$('ciImage') as HTMLInputElement;
  const image=$('ciImagePreview') as HTMLImageElement;
  let imageUrl:string|null=null;
  let parsed:ImportedWorkoutDraft=parseWorkoutDescription(EXAMPLE_WORKOUT);
  input.value=EXAMPLE_WORKOUT;
  const switchTab=(mode:'Text'|'Image'|'File')=>{
    for(const v of ['Text','Image','File']){
      $('ciTab'+v).setAttribute('aria-selected',String(v===mode));
      $('ciPanel'+v).hidden=v!==mode;
    }
  };
  $('ciTabText').addEventListener('click',()=>switchTab('Text'));
  $('ciTabImage').addEventListener('click',()=>switchTab('Image'));
  $('ciTabFile').addEventListener('click',()=>switchTab('File'));
  $('ciBackToText').addEventListener('click',()=>switchTab('Text'));
  $('ciExample').addEventListener('click',()=>{input.value=EXAMPLE_WORKOUT;render();});
  function render(){
    parsed=parseWorkoutDescription(input.value);
    const t=parsed.target,hr=t?.kind==='heart-rate',power=t?.kind==='power';
    const label=hr?t.minBpm+'–'+t.maxBpm:power?t.lowWatts+'–'+t.highWatts:'—';
    const intensity=hr?'BPM':power?'WATTS':'MISSING';
    $('ciTitle').textContent=parsed.title;
    $('ciSubtitle').textContent=parsed.pace==='steady'?'One continuous steady cycling interval':'One continuous cycling interval';
    $('ciDuration').textContent=fmt(parsed.durationMinutes);
    $('ciTarget').textContent=label;
    $('ciTargetUnit').textContent='TARGET '+intensity;
    $('ciTimelineTarget').textContent=label+' '+intensity;
    $('ciTimelineType').textContent=hr?'Heart-rate target':power?'Power target':'Intensity not specified';
    $('ciTimelineMinutes').textContent=parsed.durationMinutes!==null?parsed.durationMinutes+' MIN':'TIME MISSING';
    $('ciTimelineMiddle').textContent=parsed.durationMinutes!==null?fmt(Math.floor(parsed.durationMinutes/2)):'—';
    $('ciTimelineEnd').textContent=fmt(parsed.durationMinutes);
    $('ciTrainerMode').textContent=hr?'SIM / manual resistance':power?'Power guidance / ERG optional':'Intensity not specified';
    $('ciStructure').textContent='One '+(parsed.pace==='steady'?'steady ':'')+'block';
    $('ciWarnings').innerHTML=parsed.warnings.map(w=>'<li>'+escapeHtml(w)+'</li>').join('');
    $('ciStatus').textContent=parsed.ready?'READY TO REVIEW':'NEEDS DETAILS';
    $('ciStatus').classList.toggle('is-incomplete',!parsed.ready);
    ($('ciSave') as HTMLButtonElement).disabled=!parsed.ready;
    $('ciTimeline').setAttribute('aria-label','Continuous cycling workout lasting '+fmt(parsed.durationMinutes)+' with target '+label+' '+intensity);
    $('ciSaveStatus').textContent='';
  }
  input.addEventListener('input',render);
  file.addEventListener('change',()=>{
    const f=file.files?.[0];
    if(imageUrl){URL.revokeObjectURL(imageUrl);imageUrl=null;}
    image.hidden=true;image.removeAttribute('src');
    if(!f){$('ciImageStatus').textContent='No file selected';return;}
    if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>8*1024*1024){
      $('ciImageStatus').textContent='Please select a JPG, PNG or WebP under 8 MB.';return;
    }
    imageUrl=URL.createObjectURL(f);image.src=imageUrl;image.hidden=false;
    $('ciImageStatus').textContent=f.name+' · image preview only';
  });
  $('ciSave').addEventListener('click',()=>{
    if(!parsed.ready)return;
    try{
      const v=JSON.parse(localStorage.getItem(IMPORTED_WORKOUT_KEY)||'[]');
      const history=Array.isArray(v)?v:[];
      localStorage.setItem(IMPORTED_WORKOUT_KEY,JSON.stringify([...history.slice(-24),{...parsed,id:'import-'+Date.now(),savedAt:new Date().toISOString()}]));
      $('ciSaveStatus').textContent='✓ Saved on this device. Imported-workout execution is not yet available.';
    }catch{$('ciSaveStatus').textContent='Unable to save. Please enable browser storage.';}
  });
  render();
}
