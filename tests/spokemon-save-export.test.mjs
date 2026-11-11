import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/spokemon-playable.ts',import.meta.url),'utf8');
test('legacy app exports collection, buddy and input preference as portable versioned JSON',()=>{
 for(const key of ['spokemon-caught-v1','spokemon-buddy-v1','spokemon-input-choice-v1'])assert.ok(source.includes(key));
 assert.match(source,/data-pk-control="export"/);
 assert.match(source,/format:'spokemon-portable-save',version:1/);
 assert.match(source,/download='spokemon-save-'/);
 assert.doesNotMatch(source,/localStorage\.removeItem\((?:STORAGE|BUDDY_STORAGE)/);
});
