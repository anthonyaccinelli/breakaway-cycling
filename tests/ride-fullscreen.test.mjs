import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../src/ride-fullscreen.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {bindFullscreenButton}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
function fixture(){
 const clicks=new Map(),changes=new Map(),errors=[];
 const button={disabled:false,attrs:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener:(k,v)=>clicks.set(k,v),removeEventListener:k=>clicks.delete(k)};
 let requested=0,exited=0,options;
 const doc={fullscreenEnabled:true,fullscreenElement:null,documentElement:{requestFullscreen(opts){requested++;options=opts;doc.fullscreenElement=doc.documentElement;changes.get('fullscreenchange')?.();return Promise.resolve();}},exitFullscreen(){exited++;doc.fullscreenElement=null;changes.get('fullscreenchange')?.();return Promise.resolve();},addEventListener:(k,v)=>changes.set(k,v),removeEventListener:k=>changes.delete(k)};
 return {button,doc,errors,click:()=>clicks.get('click')(),change:()=>changes.get('fullscreenchange')?.(),counts:()=>({requested,exited,options}),bind:()=>bindFullscreenButton(button,doc,m=>errors.push(m)),clicks,changes};
}
test('fullscreen requests happen synchronously on click and the button exits cleanly',async()=>{
 const f=fixture();f.bind();assert.equal(f.button.textContent,'FULL SCREEN');
 const pending=f.click();assert.equal(f.counts().requested,1,'request retains the click activation');assert.equal(f.button.disabled,true);await pending;
 assert.equal(f.button.textContent,'EXIT FULL SCREEN');assert.equal(f.button.attrs['aria-pressed'],'true');assert.equal(f.counts().options.navigationUI,'hide');
 await f.click();assert.equal(f.counts().exited,1);assert.equal(f.button.textContent,'FULL SCREEN');assert.equal(f.button.disabled,false);
});
test('Escape/browser exit updates the label and cleanup removes listeners',async()=>{
 const f=fixture(),cleanup=f.bind();await f.click();f.doc.fullscreenElement=null;f.change();assert.equal(f.button.textContent,'FULL SCREEN');assert.equal(f.button.attrs['aria-pressed'],'false');cleanup();assert.equal(f.clicks.size,0);assert.equal(f.changes.size,0);
});
test('rejected requests recover without leaving the button stuck or claiming fullscreen',async()=>{
 const f=fixture();f.doc.documentElement.requestFullscreen=()=>Promise.reject(Error('blocked'));f.bind();await f.click();assert.equal(f.errors.length,1);assert.equal(f.button.disabled,false);assert.equal(f.button.attrs['aria-pressed'],'false');
});
test('unsupported fullscreen is visibly unavailable and cannot issue requests',async()=>{
 const f=fixture();f.doc.fullscreenEnabled=false;f.bind();assert.equal(f.button.disabled,true);await f.click();assert.equal(f.counts().requested,0);
});
