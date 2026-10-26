import {build} from 'esbuild';import {copyFile,readFile,mkdir} from 'node:fs/promises';
await build({entryPoints:['scripts/quest-fit-entry.js'],outfile:'cycle-quest/fit-decoder.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'eof'});
let licenses='FIT decoder and browser dependencies\n\n';for(const dependency of ['fit-file-parser','buffer','base64-js','ieee754'])licenses+=dependency+'\n'+await readFile('node_modules/'+dependency+'/LICENSE','utf8')+'\n\n';await import('node:fs/promises').then(fs=>fs.writeFile('cycle-quest/FIT-PARSER-LICENSE.txt',licenses));
await mkdir('public/cq-autoplay',{recursive:true});
for(const f of ['fit-decoder.js','FIT-PARSER-LICENSE.txt','workouts.js','workout-ui.js']){let text=await readFile('cycle-quest/'+f,'utf8');text=text.replaceAll('/api/cycle-quest?asset=','./');await import('node:fs/promises').then(fs=>fs.writeFile('public/cq-autoplay/'+f,text));}
