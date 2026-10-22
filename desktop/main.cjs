const {app,BrowserWindow,session,shell}=require('electron');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const isDev=process.env.BREAKAWAY_DEV_URL;
function createWindow(){
 const win=new BrowserWindow({width:1440,height:940,minWidth:960,minHeight:680,backgroundColor:'#0b1520',webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
 win.webContents.setWindowOpenHandler(({url})=>{if(/^https:\/\//.test(url))shell.openExternal(url);return {action:'deny'};});
 win.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith('file://')&&!isDev){event.preventDefault();}});
 if(isDev)win.loadURL(isDev);
 else win.loadURL(pathToFileURL(path.join(__dirname,'../dist/index.html')).href);
}
app.whenReady().then(()=>{
 // Never allow the packaged application to make remote requests.
 if(!isDev)session.defaultSession.webRequest.onBeforeRequest((details,callback)=>{
   const url=details.url;
   callback({cancel:/^https?:\/\//i.test(url)||/^wss?:\/\//i.test(url)});
 });
 createWindow();
 app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
