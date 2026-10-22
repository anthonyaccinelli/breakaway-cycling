import {createClient, type SupabaseClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL as string|undefined;
const key=import.meta.env.VITE_SUPABASE_ANON_KEY as string|undefined;
const desktop=import.meta.env.MODE==='desktop';
const client:SupabaseClient|null=!desktop&&url&&key?createClient(url,key):null;
const $=(id:string)=>document.getElementById(id)!;
const message=(s:string)=>{$('authMessage').textContent=s;};
let userId:string|null=null;
async function refresh(){
 const {data}=client?await client.auth.getUser():{data:{user:null}};
 userId=data.user?.id||null;
 $('authState').textContent=userId?`Signed in: ${data.user?.email||'account'}`:'Guest mode';
 $('authSignOut').toggleAttribute('disabled',!userId);
}
$('authSend').addEventListener('click',async()=>{
 if(!client){message(desktop?'Offline desktop mode: no account required.':'Cloud sign-in is not configured yet. Guest riding is available.');return;}
 const email=($('authEmail') as HTMLInputElement).value.trim();if(!email){message('Enter your email address.');return;}
 const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin}});
 message(error?'Sign-in failed: '+error.message:'Check your email for a sign-in link.');
});
$('authSignOut').addEventListener('click',async()=>{await client?.auth.signOut();await refresh();message('Signed out. Guest riding remains available.');});
$('authGuest').addEventListener('click',async()=>{await client?.auth.signOut();await refresh();message('Guest mode ready.');});
client?.auth.onAuthStateChange(()=>{void refresh();});
void refresh();
