#!/usr/bin/env node
/**
 * Explicitly import a pinned, CI-built artifact from the private Coach repo.
 *
 * Requires a read-only GitHub token with Contents access to breakaway-coach.
 * This is a developer-time tool: token is never used or needed by Vercel.
 *
 * Usage: GH_TOKEN=... node scripts/sync-coach-bundle.mjs <full-Coach-source-commit>
 */
import {createHash} from 'node:crypto';
import {writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';

const REPO='anthonyaccinelli/breakaway-coach';
const EXPECTED=process.argv[2];
const token=process.env.GH_TOKEN||process.env.GITHUB_TOKEN;
if(!/^[a-f0-9]{40}$/.test(EXPECTED||''))throw Error('Pass a full 40-character Coach source commit as an explicit pin.');
if(!token)throw Error('Set GH_TOKEN (read-only access to the private breakaway-coach repository).');

async function githubJson(apiPath){
 const response=await fetch('https://api.github.com/'+apiPath,{
  headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28','User-Agent':'breakaway-coach-pinner'}
 });
 if(!response.ok)throw Error(apiPath+' returned '+response.status+': '+(await response.text()).slice(0,400));
 return response.json();
}
async function contents(path,ref){
 const payload=await githubJson('repos/'+REPO+'/contents/'+path+'?ref='+encodeURIComponent(ref));
 if(payload.encoding!=='base64'||typeof payload.content!=='string')throw Error('Unexpected GitHub Contents API response for '+path);
 return Buffer.from(payload.content.replace(/\s/g,''),'base64');
}
const branch=await githubJson('repos/'+REPO+'/git/ref/heads/coach-bundle');
const bundleCommit=branch?.object?.sha;
if(!/^[a-f0-9]{40}$/.test(bundleCommit||''))throw Error('Unable to resolve Coach distribution branch.');
const manifest=JSON.parse((await contents('manifest.json',bundleCommit)).toString('utf8'));
if(manifest.sourceRepository!==REPO||manifest.sourceCommit!==EXPECTED)throw Error('Coach source pin does not match published bundle.');
const dest=resolve(dirname(fileURLToPath(import.meta.url)),'../src/vendor/breakaway-coach');
const incoming={};
for(const type of ['js','css']){
 const path=manifest.files?.[type];
 if(path!=='dist-lib/breakaway-coach.'+type)throw Error('Unexpected bundle path: '+path);
 const bytes=await contents(path,bundleCommit);
 const digest='sha256-'+createHash('sha256').update(bytes).digest('base64');
 if(digest!==manifest.integrity?.[type])throw Error('Integrity mismatch: '+type);
 incoming[type]=bytes;
}
await mkdir(dest,{recursive:true});
await writeFile(resolve(dest,'breakaway-coach.js'),incoming.js);
await writeFile(resolve(dest,'breakaway-coach.css'),incoming.css);
await writeFile(resolve(dest,'manifest.json'),JSON.stringify({...manifest,bundleCommit},null,2)+'\n');
console.log('Pinned Breakaway Coach '+EXPECTED+' (bundle '+bundleCommit+')');
console.log('Run npm test && npm run build before opening a pull request.');
