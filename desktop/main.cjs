const {app,BrowserWindow,session,shell,protocol,net}=require('electron');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs');
const isDev=process.env.BREAKAWAY_DEV_URL;
const smoke=process.argv.includes('--smoke-test');
const root=path.resolve(__dirname,'../dist');
protocol.registerSchemesAsPrivileged([{scheme:'breakaway',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
function createWindow(){
 const win=new BrowserWindow({width:1440,height:940,minWidth:960,minHeight:680,show:!smoke,backgroundColor:'#0b1520',webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
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
