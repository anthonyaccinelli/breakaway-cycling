import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {DOMParser} from '@xmldom/xmldom';
import {deflateRawSync} from 'node:zlib';

const transpile=(path)=>ts.transpileModule(readFileSync(new URL('../'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const coreUrl='data:text/javascript;base64,'+Buffer.from(transpile('src/coach-history-core.ts')).toString('base64');
const core=await import(coreUrl);
const impSource=transpile('src/coach-history-import.ts').replace(/from ['"]\.\/coach-history-core['"]/g,"from '"+coreUrl+"'");
const imports=await import('data:text/javascript;base64,'+Buffer.from(impSource).toString('base64'));
globalThis.DOMParser=DOMParser;
const start=Date.parse('2026-09-01T12:00:00Z');
const sample=(other={})=>core.validateRide({name:'Ride',start,duration:3600,movingSeconds:3500,distanceMeters:30000,elevationMeters:300,avgPower:190,avgHeartRate:140,avgCadence:85,best20minWatts:null,source:'FIT',indoor:false,stravaId:null,...other});

test('Strava cycling CSV handles quoted names, virtual rides, non-cycling exclusion',()=>{
 const csv='Activity ID,Activity Date,Activity Name,Activity Type,Elapsed Time,Moving Time,Distance,Filename,Average Watts\n'+
 '123,"Sep 1, 2026, 12:00:00 PM","Morning, hills",Ride,3600,3500,30000,activities/123.fit.gz,190\n'+
 '124,"Sep 2, 2026, 12:00:00 PM",Trainer,VirtualRide,1800,1700,14000,,120\n'+
 '125,"Sep 3, 2026, 12:00:00 PM",Trail Run,Run,3600,3200,7000,,\n';
 const rows=core.parseStravaCsv(csv);
 assert.equal(rows.length,2);assert.equal(rows[0].ride.name,'Morning, hills');
 assert.equal(rows[0].file,'activities/123.fit.gz');assert.equal(rows[1].ride.indoor,true);
});
test('FIT indoor cycling activity provides 20-minute actual effort estimate',()=>{
 const records=Array.from({length:1240},(_,i)=>({timestamp:new Date(start+i*1000),power:260,heart_rate:150,cadence:90}));
 const x=core.parseFitRide({sessions:[{sport:'cycling',sub_sport:'indoor_cycling',start_time:new Date(start),total_elapsed_time:1240,avg_power:260}],records});
 assert.equal(x.indoor,true);assert.equal(x.best20minWatts,260);assert.equal(x.avgHeartRate,150);
});
test('short or interrupted activities cannot produce a 20-minute power peak',()=>{
 const xs=Array.from({length:800},(_,i)=>({t:start+i*1000,power:400}));
 assert.equal(core.bestTwentyMinutePower(xs),null);
 const ys=Array.from({length:1300},(_,i)=>({t:start+i*1000+(i>500?20000:0),power:240}));
 assert.equal(core.bestTwentyMinutePower(ys),null);
});
test('parse GPX trackpoints and TCX cycling sessions',()=>{
 const gpx='<gpx xmlns="http://www.topografix.com/GPX/1/1"><trk><name>Gravel Ride</name><trkseg>'+
 '<trkpt lat="44" lon="-121"><ele>100</ele><time>2026-09-01T12:00:00Z</time><extensions><power>175</power></extensions></trkpt>'+
 '<trkpt lat="44.01" lon="-121.01"><ele>125</ele><time>2026-09-01T12:20:00Z</time><extensions><power>188</power></extensions></trkpt></trkseg></trk></gpx>';
 const g=core.parseXmlRide(gpx,'ride.gpx');
 assert.equal(g.name,'Gravel Ride');assert.ok(g.distanceMeters>0);assert.equal(g.avgPower,181.5);
 const tcx='<TrainingCenterDatabase><Activities><Activity Sport="Biking"><Track>'+
 '<Trackpoint><Time>2026-09-01T12:00:00Z</Time><DistanceMeters>0</DistanceMeters><Watts>100</Watts></Trackpoint>'+
 '<Trackpoint><Time>2026-09-01T12:15:00Z</Time><DistanceMeters>5000</DistanceMeters><Watts>150</Watts></Trackpoint>'+
 '</Track></Activity></Activities></TrainingCenterDatabase>';
 const t=core.parseXmlRide(tcx,'ride.tcx');assert.equal(t.source,'TCX');assert.equal(t.duration,900);
});
test('source-quality merging preserves the strongest ride recording and detects duplicates',()=>{
 const a=sample({stravaId:'55',source:'CSV',avgPower:null}),b=sample({stravaId:'55',source:'FIT',best20minWatts:290});
 const r=core.mergeRides([a],[b,a]);
 assert.equal(r.rides.length,1);assert.equal(r.rides[0].best20minWatts,290);assert.equal(r.rides[0].source,'FIT');
});
test('only recent 20-minute power may suggest current FTP',()=>{
 const old=sample({start:Date.parse('2020-09-01T12:00:00Z'),best20minWatts:340});
 assert.equal(core.historySummary([old],Date.parse('2026-10-29T12:00:00Z')).suggestedFtp,null);
 const recent=sample({start:Date.parse('2026-10-20T12:00:00Z'),best20minWatts:300});
 assert.equal(core.historySummary([old,recent],Date.parse('2026-10-29T12:00:00Z')).suggestedFtp,285);
});
function zipFile(name,data,compressed=false){
 const filename=Buffer.from(name),raw=Buffer.from(data),payload=compressed?deflateRawSync(raw):raw;
 const local=Buffer.alloc(30),central=Buffer.alloc(46),end=Buffer.alloc(22),crc=imports.crc32(raw);
 local.writeUInt32LE(0x04034b50);local.writeUInt16LE(compressed?8:0,8);local.writeUInt32LE(crc,14);
 local.writeUInt32LE(payload.length,18);local.writeUInt32LE(raw.length,22);local.writeUInt16LE(filename.length,26);
 central.writeUInt32LE(0x02014b50);central.writeUInt16LE(compressed?8:0,10);central.writeUInt32LE(crc,16);
 central.writeUInt32LE(payload.length,20);central.writeUInt32LE(raw.length,24);central.writeUInt16LE(filename.length,28);
 const directory=Buffer.concat([central,filename]),offset=local.length+filename.length+payload.length;
 end.writeUInt32LE(0x06054b50);end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);
 end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([local,filename,payload,directory,end]);
}
test('ZIP central directory and CRC integrity verification',async()=>{
 const bytes=zipFile('activities.csv','valid,CSV'),entries=imports.listZipEntries(bytes);
 assert.equal(entries.length,1);
 assert.equal(Buffer.from(await imports.extractZipEntry(bytes,entries[0])).toString(),'valid,CSV');
 bytes[entries[0].start]^=255;
 await assert.rejects(imports.extractZipEntry(bytes,entries[0]),/integrity verification/);
});
test('Deflate ZIP members use browser-compatible raw decompression',async t=>{
 try{new DecompressionStream('deflate-raw');}catch{t.skip('Node runtime lacks raw deflate decompression');return;}
 const bytes=zipFile('activities/123.gpx','compressed activity',true);
 assert.equal(Buffer.from(await imports.extractZipEntry(bytes,imports.listZipEntries(bytes)[0])).toString(),'compressed activity');
});
