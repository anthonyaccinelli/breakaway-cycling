import {mergeRides,parseFitRide,parseStravaCsv,parseXmlRide} from './coach-history-core';
import {getAccountUserId} from './account-storage';
import type {HistoricalRide,CsvRide} from './coach-history-core';

const DB_NAME='breakaway-coach-training-history-v1',STORE='rides',DB_VERSION=1;
const MAX_ZIP_BYTES=600*1024*1024;
const MAX_ENTRY_BYTES=32*1024*1024;
const MAX_CSV_BYTES=32*1024*1024;
const MAX_ENTRIES=10000;
const textDecoder=new TextDecoder('utf-8',{fatal:false});

function openDatabase():Promise<IDBDatabase> {
 return new Promise((resolve,reject)=>{
  if(!('indexedDB' in window)){reject(Error('This browser does not support local history storage.'));return;}
  const request=indexedDB.open(DB_NAME+'-'+getAccountUserId(),DB_VERSION);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE,{keyPath:'key'});};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||Error('Could not open local history database.'));
 });
}
export async function loadHistoricalRides():Promise<HistoricalRide[]>{
 const db=await openDatabase();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readonly'),request=tx.objectStore(STORE).getAll();
  request.onsuccess=()=>resolve((request.result as HistoricalRide[]).sort((a,b)=>b.start-a.start));
  request.onerror=()=>reject(request.error||Error('Could not read history.'));
 });}finally{db.close();}
}
export async function saveHistoricalRides(rides:HistoricalRide[]):Promise<void>{
 if(rides.length>15000)throw Error('Local activity limit reached. Contact support before importing more rides.');
 const db=await openDatabase();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
  store.clear();for(const ride of rides)store.put(ride);
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(tx.error||Error('Could not save imported activities.'));
  tx.onabort=()=>reject(tx.error||Error('Activity import was rolled back.'));
 });}finally{db.close();}
}
export async function clearHistoricalRides():Promise<void>{
 const db=await openDatabase();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).clear();
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('Unable to clear history.'));
 });}finally{db.close();}
}
function read16(v:DataView,off:number){if(off<0||off+2>v.byteLength)throw Error('Truncated ZIP file.');return v.getUint16(off,true);}
function read32(v:DataView,off:number){if(off<0||off+4>v.byteLength)throw Error('Truncated ZIP file.');return v.getUint32(off,true);}
export type ArchiveEntry={name:string;compressed:number;expanded:number;method:number;crc:number;start:number;encrypted:boolean};
export function listZipEntries(bytes:Uint8Array):ArchiveEntry[]{
 if(bytes.byteLength>MAX_ZIP_BYTES)throw Error('This archive exceeds the 600 MB preview limit. Import smaller batches of FIT, TCX, or GPX files.');
 const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 let eocd=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-22-65535);i--){
  if(read32(dv,i)===0x06054b50&&i+22+read16(dv,i+20)<=bytes.length){eocd=i;break;}
 }
 if(eocd<0)throw Error('Not a valid ZIP archive or its directory is missing.');
 const count=read16(dv,eocd+10),directoryBytes=read32(dv,eocd+12),offset=read32(dv,eocd+16);
 if(count===65535||offset===0xffffffff||directoryBytes===0xffffffff||read16(dv,eocd+4)!==0)throw Error('Multi-disk or ZIP64 archives are not supported in this preview.');
 if(count>MAX_ENTRIES||offset+directoryBytes>bytes.length)throw Error('ZIP directory exceeds safe limits.');
 const out:ArchiveEntry[]=[];let pos=offset;
 for(let j=0;j<count;j++){
  if(read32(dv,pos)!==0x02014b50)throw Error('Invalid ZIP directory entry.');
  const flags=read16(dv,pos+8),method=read16(dv,pos+10),crc=read32(dv,pos+16);
  const compressed=read32(dv,pos+20),expanded=read32(dv,pos+24);
  const nameLength=read16(dv,pos+28),extraLength=read16(dv,pos+30),commentLength=read16(dv,pos+32);
  const local=read32(dv,pos+42);
  const end=pos+46+nameLength+extraLength+commentLength;
  if(end>bytes.length)throw Error('Truncated ZIP entry.');
  const name=textDecoder.decode(bytes.subarray(pos+46,pos+46+nameLength));
  pos=end;
  if(local===0xffffffff)continue;
  if(read32(dv,local)!==0x04034b50)throw Error('Invalid ZIP member offset.');
  const start=local+30+read16(dv,local+26)+read16(dv,local+28);
  if(start+compressed>bytes.length)throw Error('Truncated ZIP member data.');
  out.push({name,compressed,expanded,method,crc,start,encrypted:!!(flags&1)});
 }
 return out;
}
const crcTable=(()=>{const table=new Uint32Array(256);for(let i=0;i<256;i++){let n=i;for(let j=0;j<8;j++)n=(n&1)?(0xedb88320^(n>>>1)):(n>>>1);table[i]=n>>>0;}return table;})();
export function crc32(bytes:Uint8Array):number{
 let crc=0xffffffff;for(const b of bytes)crc=crcTable[(crc^b)&255]^(crc>>>8);return(crc^0xffffffff)>>>0;
}
async function decompressBounded(data:Uint8Array,format:'gzip'|'deflate-raw',maxBytes:number):Promise<Uint8Array>{
 if(typeof DecompressionStream==='undefined')throw Error('Compressed archives require a current Chrome or Edge browser.');
 let stream:ReadableStream<Uint8Array>;
 try{stream=new Blob([new Uint8Array(data)]).stream().pipeThrough(new DecompressionStream(format));}
 catch{throw Error('This browser cannot expand '+format+' files. Try a recent Chrome or Edge.');}
 const reader=stream.getReader(),parts:Uint8Array[]=[];let length=0;
 try{
  for(;;){const {value,done}=await reader.read();if(done)break;if(!value)continue;
   length+=value.byteLength;if(length>maxBytes){await reader.cancel();throw Error('Decompressed activity exceeds the safe file size limit.');}
   parts.push(value);
  }
 }finally{reader.releaseLock();}
 const out=new Uint8Array(length);let o=0;for(const part of parts){out.set(part,o);o+=part.length;}return out;
}
export async function extractZipEntry(archive:Uint8Array,entry:ArchiveEntry):Promise<Uint8Array>{
 if(entry.encrypted)throw Error('Encrypted archive entries are unsupported.');
 if(entry.expanded>MAX_ENTRY_BYTES)throw Error('Activity is larger than the 32 MB per-file limit.');
 if(entry.method!==0&&entry.method!==8)throw Error('Unsupported ZIP compression method: '+entry.method);
 const compressed=archive.subarray(entry.start,entry.start+entry.compressed);
 const result=entry.method===0?new Uint8Array(compressed):await decompressBounded(compressed,'deflate-raw',MAX_ENTRY_BYTES);
 if(result.length!==entry.expanded||crc32(result)!==entry.crc)throw Error('ZIP member failed integrity verification.');
 return result;
}
const isRecording=(name:string)=>/\.(fit|tcx|gpx)(\.gz)?$/i.test(name);
const isCSV=(name:string)=>/(^|\/)activities\.csv$/i.test(name);
const csvKey=(s:string)=>s.trim().replace(/\\/g,'/').replace(/^\.?\//,'').toLowerCase();
const yieldToUI=()=>new Promise<void>(resolve=>setTimeout(resolve,0));
export type ImportProgress={done:number;total:number;current:string;accepted:number;skipped:number};
export type ImportResult={rides:HistoricalRide[];read:number;skipped:number;errors:string[];csvRides:number;archives:number};
type ActivityFile={name:string;bytes:()=>Promise<Uint8Array>};
async function inflateGzipIfNeeded(name:string,bytes:Uint8Array):Promise<Uint8Array>{
 return /\.gz$/i.test(name)?decompressBounded(bytes,'gzip',MAX_ENTRY_BYTES):bytes;
}
export async function collectRiderFiles(files:File[],onProgress:(info:ImportProgress)=>void=()=>{}):Promise<ImportResult>{
 if(!files.length)throw Error('Choose an activity archive or individual ride files.');
 if(files.length>MAX_ENTRIES)throw Error('Select fewer than 10,000 files at a time.');
 const recordings:ActivityFile[]=[],csvFiles:ActivityFile[]=[];let archives=0;
 for(const file of files){
  if(/\.zip$/i.test(file.name)){
   archives++;
   if(file.size>MAX_ZIP_BYTES)throw Error('This ZIP archive exceeds the 600 MB preview limit.');
   const bytes=new Uint8Array(await file.arrayBuffer());
   for(const entry of listZipEntries(bytes)){
    const safeName=csvKey(entry.name);
    if(isCSV(safeName)&&entry.expanded<=MAX_CSV_BYTES)
     csvFiles.push({name:entry.name,bytes:()=>extractZipEntry(bytes,entry)});
    else if(isRecording(safeName)&&/(^|\/)activities\//i.test(safeName)&&entry.expanded<=MAX_ENTRY_BYTES)
     recordings.push({name:entry.name,bytes:()=>extractZipEntry(bytes,entry)});
   }
  }else if(isCSV(file.name)&&file.size<=MAX_CSV_BYTES)csvFiles.push({name:file.name,bytes:async()=>new Uint8Array(await file.arrayBuffer())});
  else if(isRecording(file.name)&&file.size<=MAX_ENTRY_BYTES)recordings.push({name:file.name,bytes:async()=>new Uint8Array(await file.arrayBuffer())});
 }
 if(!recordings.length&&!csvFiles.length)throw Error('No supported cycling recordings or activities.csv were found.');
 if(recordings.length>MAX_ENTRIES)throw Error('There are too many activity files in this archive.');
 const rows:CsvRide[]=[];const errors:string[]=[];let skipped=0,read=0,done=0;
 for(const csv of csvFiles){
  try{rows.push(...parseStravaCsv(textDecoder.decode(await csv.bytes())));}
  catch(error){errors.push('activities.csv: '+String(error instanceof Error?error.message:error));}
 }
 const map=new Map<string,CsvRide>();
 for(const row of rows)if(row.file){map.set(csvKey(row.file),row);map.set(csvKey(row.file).split('/').pop()||'',row);}
 const rides:HistoricalRide[]=[];const total=recordings.length;onProgress({done,total,current:'Reading activity files',accepted:0,skipped});
 for(const item of recordings){
  try{
   const raw=await inflateGzipIfNeeded(item.name,await item.bytes());
   if(raw.byteLength>MAX_ENTRY_BYTES)throw Error('Activity exceeds 32 MB.');
   const meta=map.get(csvKey(item.name))||map.get(csvKey(item.name).split('/').pop()||'');
   const name=item.name.replace(/^.*\//,'').replace(/\.(fit|gpx|tcx)(\.gz)?$/i,'');
   let ride:HistoricalRide;
   if(/\.fit(\.gz)?$/i.test(item.name)){
    const browserFitDecoder='/coach-fit-decoder.js';
    const {decodeFIT}=await import(/* @vite-ignore */ browserFitDecoder);
    ride=parseFitRide(await decodeFIT(raw),name,meta?.ride.name,meta?.ride.stravaId??null);
   }else ride=parseXmlRide(textDecoder.decode(raw),name.replace(/\.gz$/i,''),meta?.ride.name,meta?.ride.stravaId??null);
   rides.push(ride);read++;
  }catch(error){skipped++;if(errors.length<15)errors.push(item.name.slice(-80)+': '+String(error instanceof Error?error.message:error));}
  done++;if(done%5===0||done===total){onProgress({done,total,current:item.name.slice(-70),accepted:read,skipped});await yieldToUI();}
 }
 // CSV records without usable tracks are still valuable for volume, distance and consistency.
 // Prefer track data when the same ride occurs in both places.
 const merged=mergeRides([],rides.concat(rows.map(x=>x.ride)));
 return {rides:merged.rides,read,skipped,errors,csvRides:rows.length,archives};
}
