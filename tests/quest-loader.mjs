import {readFile} from 'node:fs/promises';
const urls=new Map();
async function moduleURL(name){
 if(urls.has(name))return urls.get(name);
 let source=await readFile(new URL('../cycle-quest/'+name,import.meta.url),'utf8');
 const dependencies=[...new Set([...source.matchAll(/\/api\/cycle-quest\?asset=([a-z.-]+\.js)/g)].map(m=>m[1]))];
 for(const dependency of dependencies)source=source.replaceAll('/api/cycle-quest?asset='+dependency,await moduleURL(dependency));
 const url='data:text/javascript;base64,'+Buffer.from(source).toString('base64');urls.set(name,url);return url;
}
export async function loadQuestModule(name){return import(await moduleURL(name));}
