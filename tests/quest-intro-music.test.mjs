import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../src/quest-intro-music.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {createQuestIntroMusic}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('Largo starts synchronously in the selection gesture, loops, and stops at navigation',()=>{
 const audio={currentTime:12,plays:0,pauses:0,play(){this.plays++;return Promise.resolve();},pause(){this.pauses++;}};
 const intro=createQuestIntroMusic(audio,{getItem:()=>null});intro.start();assert.equal(audio.plays,1);assert.equal(audio.currentTime,0);assert.equal(audio.loop,true);
 intro.stop();assert.equal(audio.pauses,1);assert.equal(audio.currentTime,0);intro.setEnabled(true);assert.equal(audio.plays,1);
});
test('Largo respects saved mute and rejects autoplay without an unhandled promise',async()=>{
 let plays=0;const audio={currentTime:0,play(){plays++;return Promise.reject(new Error('Blocked'));},pause(){}};
 const intro=createQuestIntroMusic(audio,{getItem:()=> 'false'});intro.start();assert.equal(plays,0);intro.setEnabled(true);assert.equal(plays,1);await new Promise(resolve=>setImmediate(resolve));intro.setEnabled(false);intro.stop();
});
