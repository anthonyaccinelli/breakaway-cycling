import {createClient, type SupabaseClient, type User} from '@supabase/supabase-js';
import {prepareAccountSettings, getAccountUserId, setSyncStatusListener, syncAccountSettings, eraseLocalAccountSettings} from './account-storage';
import './account.css';

let client:SupabaseClient|null=null;
let activeUser:User|null=null;
let signingOut=false;
let syncLabel='Saved to your account';
let syncError=false;
const AUTH_REDIRECT=new URL('/',window.location.origin).toString();
const RECOVERY_REDIRECT=new URL('/?account=recovery',window.location.origin).toString();
// Both destinations must be allowlisted under Supabase Auth → URL Configuration.

type Screen='login'|'signup'|'forgot'|'reset';
function el<T extends HTMLElement>(parent:ParentNode,id:string):T {
 return parent.querySelector<T>('#'+id)!;
}
function safelyShow(text:string,node:HTMLElement,kind:'error'|'success'='error'){
 node.textContent=text;
 node.hidden=!text;
 node.dataset.kind=kind;
}
function updateAccountMenus():void{
 document.querySelectorAll<HTMLElement>('.account-person-email').forEach(node=>{
  node.textContent=activeUser?.email||'Rider';
 });
 document.querySelectorAll<HTMLElement>('.account-sync-label').forEach(node=>{
  node.textContent=syncLabel;
  node.dataset.error=String(syncError);
 });
}
async function signOut():Promise<void>{
 if(!client||signingOut)return;
 signingOut=true;
 try{
  await syncAccountSettings();
  const {error}=await client.auth.signOut();
  if(error)throw error;
  eraseLocalAccountSettings();
  location.replace(location.pathname); // Fresh state; no previous rider remains mounted.
 }catch(error){
  signingOut=false;
  syncLabel='Sign out failed — settings not lost';
  syncError=true;
  updateAccountMenus();
  console.warn('[Account] Sign-out was cancelled',error);
 }
}
function accountMenu():HTMLElement{
 const shell=document.createElement('details');
 shell.className='account-menu';
 shell.innerHTML='<summary aria-label="Account menu">ACCOUNT <span aria-hidden="true">⌄</span></summary>'+
 '<div class="account-menu-sheet"><span class="account-menu-label">SIGNED IN AS</span>'+
 '<strong class="account-person-email"></strong>'+
 '<span class="account-sync-label" role="status">Saved to your account</span>'+
 '<button type="button" class="account-signout">Sign out</button></div>';
 shell.querySelector('button')!.addEventListener('click',()=>{void signOut();});
 return shell;
}
/** Insert account controls without disturbing the game's existing navigation. */
export function mountAccountControls():void{
 if(!activeUser)return;
 const home=document.querySelector<HTMLElement>('#modeLanding .mode-landing-meta');
 if(home&&!home.querySelector('.account-menu'))home.append(accountMenu());
 if(!document.getElementById('accountGlobalMenu')){
  const floating=accountMenu();
  floating.id='accountGlobalMenu';
  document.body.append(floating);
 }
 setSyncStatusListener((message,isError)=>{
  syncLabel=message;syncError=!!isError;updateAccountMenus();
 });
 updateAccountMenus();
}
export {getAccountUserId};

export async function bootAccount():Promise<void>{
 document.documentElement.dataset.accountGate='locked';
 const cover=document.createElement('div');
 cover.className='account-gate';
 cover.id='accountGate';
 cover.setAttribute('aria-label','Ride Breakaway account access');
 cover.innerHTML=[
 '<div class="account-shell">',
 '<section class="account-story" aria-label="About Ride Breakaway">',
 '<div class="account-wordmark"><span class="account-wordmark-symbol" aria-hidden="true">↗</span> RIDE BREAKAWAY</div>',
 '<div class="account-story-content">',
 '<span class="account-eyebrow">CREATE. CONNECT. RIDE.</span>',
 '<h1>YOUR RIDE.<br><em>YOUR RULES.</em></h1>',
 '<p>One account for every ride. Pick up your training wherever you left off.</p>',
 '<div class="account-feature-row"><span>01 <b>CLASSIC</b></span><span>02 <b>SURVIVAL</b></span><span>03 <b>CYCLE QUEST</b></span></div>',
 '</div>',
 '<div class="account-story-bottom"><span>YOUR SETTINGS</span><span>YOUR PROGRESS</span><span>BREAKAWAY COACH</span></div>',
 '</section>',
 '<section class="account-access" aria-label="Sign in to Ride Breakaway">',
 '<div class="account-access-top"><span>MEMBER ACCESS</span><span class="account-signal"><i aria-hidden="true"></i> CLOUD SYNC</span></div>',
 '<div class="account-access-content">',
 '<span class="account-overline" id="accountOverline">WELCOME BACK</span>',
 '<h2 id="accountHeading">Ready to ride?</h2>',
 '<p id="accountExplanation">Sign in to open your modes, settings, and training plans.</p>',
 '<form id="accountForm">',
 '<label class="account-field" for="accountEmail">EMAIL ADDRESS<input id="accountEmail" type="email" name="email" autocomplete="email" placeholder="you@example.com" required maxlength="254"></label>',
 '<label class="account-field" id="accountPasswordField" for="accountPassword">PASSWORD<input id="accountPassword" type="password" name="password" autocomplete="current-password" placeholder="Enter password" required minlength="8"></label>',
 '<label class="account-field" id="accountConfirmField" for="accountConfirm" hidden>CONFIRM PASSWORD<input id="accountConfirm" type="password" name="confirmation" autocomplete="new-password" placeholder="Confirm password" minlength="8"></label>',
 '<p class="account-feedback" id="accountFeedback" role="status" aria-live="polite" hidden></p>',
 '<button id="accountSubmit" class="account-submit" type="submit">SIGN IN <span aria-hidden="true">→</span></button>',
 '</form>',
 '<div class="account-secondary"><button type="button" id="accountSwitch">Create an account</button><button type="button" id="accountForgot">Forgot password?</button></div>',
 '<div class="account-footnote">Your FTP, trainer preferences and Breakaway Coach history stay with your account.</div>',
 '</div>',
 '<div class="account-access-foot"><span>POWERED BY YOUR PEDAL STROKES.</span><span>RIDE BREAKAWAY</span></div>',
 '</section>',
 '</div>'
 ].join('');
 document.body.append(cover);
 const form=el<HTMLFormElement>(cover,'accountForm');
 const feedback=el<HTMLElement>(cover,'accountFeedback');
 const email=el<HTMLInputElement>(cover,'accountEmail');
 const emailField=email.closest<HTMLElement>('.account-field')!;
 const password=el<HTMLInputElement>(cover,'accountPassword');
 const confirm=el<HTMLInputElement>(cover,'accountConfirm');
 const confirmField=el<HTMLElement>(cover,'accountConfirmField');
 const passwordField=el<HTMLElement>(cover,'accountPasswordField');
 const submit=el<HTMLButtonElement>(cover,'accountSubmit');
 const switchButton=el<HTMLButtonElement>(cover,'accountSwitch');
 const forgotButton=el<HTMLButtonElement>(cover,'accountForgot');
 let screen:Screen='login';
 let processing=false;
 let activated=false;
 let resolving:()=>void=()=>{};
 const redirectParams=new URLSearchParams(location.search);
 const authFragment=new URLSearchParams(location.hash.replace(/^#/,''));
 const authLinkError=authFragment.get('error')||redirectParams.get('error');
 const recoveryIntent=redirectParams.get('account')==='recovery'||authFragment.get('type')==='recovery';
 let recoveryUrl=recoveryIntent;
 const gateCompleted=new Promise<void>(resolve=>{resolving=resolve;});
 function screenState(next:Screen):void{
  screen=next;feedback.hidden=true;feedback.textContent='';
  emailField.hidden=next==='reset';
  email.required=next!=='reset';
  passwordField.hidden=next==='forgot';
  password.required=next!=='forgot';
  password.autocomplete=next==='login'?'current-password':'new-password';
  confirmField.hidden=next!=='signup';
  confirm.required=next==='signup';
  const content={
   login:['WELCOME BACK','Ready to ride?','Sign in to open your modes, settings, and training plans.','SIGN IN →','Create an account','Forgot password?'],
   signup:['JOIN THE RIDE','Create your account.','One login for Classic, Survival, Cycle Quest, and Breakaway Coach.','CREATE ACCOUNT →','Already have an account? Sign in',''],
   forgot:['ACCOUNT RECOVERY','Reset your password.','Enter your email and we’ll send you a recovery link.','SEND RESET LINK →','Back to sign in',''],
   reset:['SECURE YOUR ACCOUNT','Choose a new password.','Your recovery link is verified. Set a new password to continue.','UPDATE PASSWORD →','Back to sign in','']
  }[next];
  el<HTMLElement>(cover,'accountOverline').textContent=content[0];
  el<HTMLElement>(cover,'accountHeading').textContent=content[1];
  el<HTMLElement>(cover,'accountExplanation').textContent=content[2];
  submit.textContent=content[3];
  switchButton.textContent=content[4];
  forgotButton.hidden=!content[5];
  forgotButton.textContent=content[5];
  if(next!=='login')password.value='';
  if(next!=='signup')confirm.value='';
 }
 switchButton.addEventListener('click',()=>{
  screenState(screen==='login'?'signup':'login');
  if(screen==='reset')screenState('login');
 });
 forgotButton.addEventListener('click',()=>screenState('forgot'));
 async function activate(user:User):Promise<void>{
  if(activated||user.is_anonymous)return;
  submit.disabled=true;
  safelyShow('Loading your saved settings…',feedback,'success');
  try{
   const {adoptLegacy}=await prepareAccountSettings(client!,user.id);
   activeUser=user;
   activated=true;
   // If this browser previously held guest ride history, copy it to this
   // user's isolated local databases before the ride and Coach screens mount.
   if(adoptLegacy){
    try{await migrateLegacyHistory(user.id);}catch(error){console.warn('[Account] Local ride history migration skipped',error);}
   }
   cover.remove();
   document.documentElement.dataset.accountGate='ready';
   resolving();
  }catch(error){
   submit.disabled=false;
   safelyShow(error instanceof Error?error.message:'Could not load your saved settings. Try again.',feedback);
  }
 }
 const url=import.meta.env.VITE_SUPABASE_URL as string|undefined;
 const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string|undefined;
 if(!url||!key){
  safelyShow('Account connection is not configured for this deployment. Please contact support.',feedback);
  submit.disabled=true;return gateCompleted;
 }
 client=createClient(url,key,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
 });
 // Reserve recovery URLs for account access, never launch the ride mode from them.
 if(recoveryUrl)screenState(authLinkError?'forgot':'reset');
 client.auth.onAuthStateChange((event)=>{
  if(event==='PASSWORD_RECOVERY'){
   recoveryUrl=true;
   if(!activated){screenState('reset');password.focus();}
  }
  if(event==='SIGNED_OUT'&&activated&&!signingOut){
   eraseLocalAccountSettings();
   location.reload();
  }
 });
 form.addEventListener('submit',event=>{
  event.preventDefault();
  if(processing||!client)return;
  processing=true;submit.disabled=true;
  safelyShow('',feedback);
  void (async()=>{
   try{
    const address=email.value.trim().toLowerCase();
    if(screen==='login'){
     const {data,error}=await client!.auth.signInWithPassword({email:address,password:password.value});
     if(error)throw error;
     if(!data.user)throw Error('Could not verify your account.');
     await activate(data.user);
    }else if(screen==='signup'){
     if(password.value!==confirm.value)throw Error('Passwords do not match.');
     const {data,error}=await client!.auth.signUp({email:address,password:password.value,options:{emailRedirectTo:AUTH_REDIRECT}});
     if(error)throw error;
     if(data.session&&data.user)await activate(data.user);
     else {screenState('login');email.value=address;safelyShow('If this email is new and email delivery is enabled, a confirmation link will arrive. If you already have an account, sign in or select Forgot password. Check spam as well.',feedback,'success');}
    }else if(screen==='forgot'){
     const {error}=await client!.auth.resetPasswordForEmail(address,{redirectTo:RECOVERY_REDIRECT});
     if(error)throw error;
     safelyShow('If the address has an account, a recovery link is on its way.',feedback,'success');
    }else if(screen==='reset'){
     if(password.value.length<8)throw Error('Use at least 8 characters.');
     const {error}=await client!.auth.updateUser({password:password.value});
     if(error)throw error;
     const {error:signOutError}=await client!.auth.signOut();
     if(signOutError)throw signOutError;
     recoveryUrl=false;
     history.replaceState(null,'',location.pathname);
     screenState('login');
     safelyShow('Password updated. Sign in with your new password.',feedback,'success');
    }
   }catch(error){
    safelyShow(error instanceof Error?error.message:'Something went wrong. Please try again.',feedback);
   }finally{
    processing=false;
    if(!activated)submit.disabled=false;
   }
  })();
 });
 // getUser checks the remote session instead of trusting an unverified local token.
 try{
  const {data,error}=await client.auth.getUser();
  if(authLinkError&&recoveryIntent){
   screenState('forgot');
   safelyShow('This reset link is invalid or has expired. Enter your email to request a fresh one.',feedback);
  }else if(data.user&&recoveryUrl){
   screenState('reset');
   password.focus();
  }else if(data.user){
   await activate(data.user);
  }else if(recoveryIntent){
   screenState('forgot');
   safelyShow('This reset link could not be verified. Request a new password-reset email.',feedback);
  }else if(error&&error.name!=='AuthSessionMissingError'){
   safelyShow('Unable to verify session. Sign in to continue.',feedback);
  }
 }catch(error){
  console.warn('[Account] Session check unavailable',error);
  safelyShow('Can’t check your session right now. Try signing in.',feedback);
 }
 if(!activated){submit.disabled=false;email.focus();}
 return gateCompleted;
}
/** Never merge two users' local ride histories. Legacy migration is first login only. */
async function migrateLegacyHistory(userId:string):Promise<void>{
 if(!('indexedDB' in window))return;
 const names=[
  ['breakaway-local-rides-v1','rides','id'],
  ['breakaway-coach-training-history-v1','rides','key']
 ] as const;
 for(const [name,store,keyPath] of names){
  try{
   const data=await new Promise<unknown[]>((resolve,reject)=>{
    const open=indexedDB.open(name);
    open.onupgradeneeded=()=>{if(!open.result.objectStoreNames.contains(store))open.result.createObjectStore(store,{keyPath});};
    open.onerror=()=>reject(open.error);
    open.onsuccess=()=>{
     const db=open.result;
     const req=db.transaction(store,'readonly').objectStore(store).getAll();
     req.onsuccess=()=>{db.close();resolve(req.result);};
     req.onerror=()=>{db.close();reject(req.error);};
    };
   });
   if(!data.length)continue;
   await new Promise<void>((resolve,reject)=>{
    const open=indexedDB.open(name+'-'+userId);
    open.onupgradeneeded=()=>{if(!open.result.objectStoreNames.contains(store))open.result.createObjectStore(store,{keyPath});};
    open.onerror=()=>reject(open.error);
    open.onsuccess=()=>{
     const db=open.result,tx=db.transaction(store,'readwrite');
     tx.oncomplete=()=>{db.close();resolve();};
     tx.onerror=()=>{db.close();reject(tx.error);};
     for(const record of data)tx.objectStore(store).put(record);
    };
   });
  }catch(error){console.warn('[Account] Could not copy local history',name,error);}
 }
}
