const {app,BrowserWindow,session,shell,protocol,net}=require('electron');
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
 win.webContents.on('select-bluetooth-device',(event,deviceList,callback)=>{
   event.preventDefault();
   // Chromium can emit an empty list before scanning discovers any devices.
   // Never treat an empty discovery update as a user cancellation.
   if(smoke){callback('');return;}
   if(!chooser){
     chooser={callback,devices:new Map(),timer:null,menu:null,settled:false};
     const active=chooser;
     active.timer=setTimeout(()=>{if(chooser===active&&!active.settled){active.settled=true;active.callback('');chooser=null;}},30000);
   }
   const active=chooser;
   for(const device of deviceList){
     if(device.deviceId)active.devices.set(device.deviceId,device.deviceName||device.deviceId);
   }
   if(!active.devices.size||active.menu||active.settled)return;
   // Allow a short scan window before displaying available trainers.
   setTimeout(()=>{
     if(chooser!==active||active.settled||active.menu||!active.devices.size)return;
     const {Menu}=require('electron');
     const choose=id=>{
       if(active.settled)return;
       active.settled=true;
       clearTimeout(active.timer);
       chooser=null;
       active.callback(id);
     };
     active.menu=Menu.buildFromTemplate([
       ...[...active.devices].map(([id,name])=>({label:name,click:()=>choose(id)})),
       {type:'separator'},
       {label:'Cancel',click:()=>choose('')}
     ]);
     active.menu.popup({window:win,callback:()=>{if(!active.settled)choose('');}});
   },1200);
 });
 win.on('closed',()=>{if(chooser&&!chooser.settled){clearTimeout(chooser.timer);chooser.callback('');chooser=null;}});
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
     if(allowedBluetoothPermissions.has(permission))return String(requestingOrigin||'').startsWith('breakaway://');
     return false;
   });
   session.defaultSession.setPermissionRequestHandler((_webContents,permission,callback,details)=>{
     const origin=details.requestingUrl||'';
     callback(allowedBluetoothPermissions.has(permission)&&origin.startsWith('breakaway://'));
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
