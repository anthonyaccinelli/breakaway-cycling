/// <reference types="vite/client" />
import type {SupabaseClient, RealtimeChannel} from '@supabase/supabase-js';

export type RiderPresence={setRiding:(riding:boolean)=>Promise<void>};
type ClientFactory=(url:string,key:string,options?:any)=>SupabaseClient;
export function startRiderPresence(createClient:ClientFactory,countElement:HTMLElement|null,badge:HTMLElement|null):RiderPresence|null{
 const url=import.meta.env.VITE_SUPABASE_URL as string|undefined;
 const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string|undefined;
 if(!url||!key||!countElement||!badge){if(badge)badge.title='Live rider count unavailable';return null;}
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const channel:RealtimeChannel=client.channel('breakaway-active-riders',{config:{presence:{key:crypto.randomUUID()}}});
 let riding=false,subscribed=false,online=false;
 const render=()=>{
  if(!online){countElement.textContent='—';badge.dataset.connected='false';badge.title='Live rider count temporarily unavailable';return;}
  const state=channel.presenceState();
  countElement.textContent=String(Object.values(state).reduce((n,presences)=>n+(presences.length?1:0),0));
  badge.dataset.connected='true';badge.title='Cyclists currently riding Breakaway';
 };
 const sync=async()=>{if(!subscribed)return;try{if(riding)await channel.track({riding:true});else await channel.untrack();}catch{online=false;render();}};
 channel.on('presence',{event:'sync'},render).subscribe(status=>{
  subscribed=status==='SUBSCRIBED';
  online=subscribed;
  render();
  if(subscribed)void sync();
 });
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&subscribed)render();});
 window.addEventListener('pagehide',()=>{void channel.untrack();});
 return {setRiding:async value=>{riding=value;await sync();}};
}
