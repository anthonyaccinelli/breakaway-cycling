const {app,BrowserWindow,session,shell,protocol,net,dialog}=require('electron');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs');
const isDev=process.env.BREAKAWAY_DEV_URL;
const smoke=process.argv.includes('--smoke-test');
const allowedBluetoothPermissions=new Set(['bluetooth','bluetoothScanning']);
const root=path.resolve(__dirname,'../dist');
protocol.registerSchemesAsPrivileged([{scheme:'breakaway',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
function createWindow(){
 const win=new BrowserWindow({width:1440,height:940,minWidth:960,minHeight:680,show:!smoke,backgroundColor:'#0b1520',webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
 // Electron's Chromium Bluetooth chooser is implemented by the main process.
 // Keep the existing renderer Web Bluetooth requestDevice()/GATT/FTMS code unchanged.
 let chooser=null;
 const bleLog=(message)=>console.log('[Breakaway Bluetooth]',message);
 win.webContents.on('select-bluetooth-device',(event,deviceList,callback)=>{
   event.preventDefault();
   bleLog('Chooser event, discovered: '+deviceList.map(d=>d.deviceName||d.deviceId).join(', '));
   if(smoke){callback('');return;}
   if(!chooser){
     chooser={callback,devices:new Map(),settled:false,timer:null,prompting:false};
     const current=chooser;
     current.timer=setTimeout(()=>finishChooser(current,''),45000);
   }
   const current=chooser;
   for(const device of deviceList)if(device.deviceId)current.devices.set(device.deviceId,device.deviceName||device.deviceId);
   if(!current.prompting){
     current.prompting=true;
     // Use a native dialog rather than a transient popup menu, which macOS can
     // dismiss before the rider gets a chance to select the trainer.
     setTimeout(async()=>{
       if(chooser!==current||current.settled)return;
       const devices=[...current.devices.entries()];
       if(!devices.length){
         bleLog('No BLE devices discovered after scan window');
         await dialog.showMessageBox(win,{type:'warning',title:'Bluetooth scan',message:'No compatible Bluetooth devices found yet.',detail:'Check that Bluetooth is enabled in macOS, Breakaway Cycling has Bluetooth permission, and your trainer is powered on. Then try Connect FTMS trainer again.',buttons:['OK']});
         finishChooser(current,'');
         return;
       }
       const labels=devices.map(([,name])=>name);
       const result=await dialog.showMessageBox(win,{type:'question',title:'Connect Bluetooth device',message:'Select your cycling device',detail:labels.map((name,i)=>`${i+1}. ${name}`).join('\\n'),buttons:[...labels,'Cancel'],cancelId:labels.length,noLink:true});
       finishChooser(current,result.response<devices.length?devices[result.response][0]:'');
     },3500);
   }
 });
 function finishChooser(current,id){
   if(current.settled)return;
   current.settled=true;clearTimeout(current.timer);
   if(chooser===current)chooser=null;
   bleLog(id?'Selected device '+id:'Device selection cancelled or timed out');
   current.callback(id);
 }
 win.on('closed',()=>{if(chooser)finishChooser(chooser,'');});
 win.webContents.setWindowOpenHandler(({url})=>{if(/^https:\/\//.test(url)&&!smoke)shell.openExternal(url);return {action:'deny'};});
 win.webContents.on('will-navigate',(event,url)=>{if(!isDev&&!url.startsWith('breakaway://'))event.preventDefault();});
 if(smoke){
   win.webContents.on('did-finish-load',async()=>{
     try{
       const result=await win.webContents.executeJavaScript(`(async()=>{
         const generate=document.getElementById('generateRoute');
         const endless=document.getElementById('endlessRoute');
         const profile=document.getElementById('studioLiveChart');
         if(!generate||!endless||!profile)throw new Error('Missing route UI');
         const miles=document.getElementById('generatedMiles');
         if(miles)miles.value='10';
         generate.click();
         await new Promise(resolve=>setTimeout(resolve,300));
         const finite=!!profile.querySelector('svg');
         endless.click();
         await new Promise(resolve=>setTimeout(resolve,300));
         const infinite=!!profile.querySelector('svg');
         const seed=document.getElementById('generatedSeed')?.value;
         return {finite,infinite,seed};
       })()`);
       if(!result.finite||!result.infinite||!result.seed)throw Error('Route smoke test failed: '+JSON.stringify(result));
       console.log('OFFLINE_ROUTE_SMOKE_PASS',JSON.stringify(result));app.exit(0);
     }catch(error){console.error('OFFLINE_ROUTE_SMOKE_FAIL',error);app.exit(1);}
   });
   win.webContents.on('did-fail-load',(_,code,description)=>{console.error('LOAD_FAILED',code,description);app.exit(1);});
 }
 if(isDev)win.loadURL(isDev);
 else win.loadURL('breakaway://desktop/index.html');
}
app.whenReady().then(()=>{
 if(!isDev){
   session.defaultSession.setPermissionCheckHandler((_webContents,permission,requestingOrigin)=>{
     if(allowedBluetoothPermissions.has(permission))return true;
     return false;
   });
   session.defaultSession.setPermissionRequestHandler((_webContents,permission,callback,details)=>{
     const origin=details.requestingUrl||'';
     callback(allowedBluetoothPermissions.has(permission));
   });
   protocol.handle('breakaway',request=>{
     const url=new URL(request.url);
     const relative=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';
     const file=path.resolve(root,relative);
     if(file!==root&&!file.startsWith(root+path.sep))return new Response('Forbidden',{status:403});
     if(!fs.existsSync(file))return new Response('Not found',{status:404});
     return net.fetch(pathToFileURL(file).href);
   });
   // Packaged desktop mode never needs remote servers.
   session.defaultSession.webRequest.onBeforeRequest((details,callback)=>{
     callback({cancel:/^https?:\/\//i.test(details.url)||/^wss?:\/\//i.test(details.url)});
   });
 }
 createWindow();
 app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
