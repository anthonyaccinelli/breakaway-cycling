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
 win.webContents.on('select-bluetooth-device',(event,deviceList,callback)=>{
   event.preventDefault();
   const devices=deviceList.filter(device=>device.deviceId);
   if(smoke||!devices.length){callback('');return;}
   const menu=require('electron').Menu.buildFromTemplate([
     ...devices.map(device=>({label:device.deviceName||device.deviceId,click:()=>callback(device.deviceId)})),
     {type:'separator'},
     {label:'Cancel',click:()=>callback('')}
   ]);
   menu.popup({window:win,callback:()=>{}});
 });
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
