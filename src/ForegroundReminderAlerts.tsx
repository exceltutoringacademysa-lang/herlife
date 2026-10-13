import {useEffect,useRef,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {Bell,BellOff,X} from 'lucide-react';
import {supabase} from './lib/supabase';
type EventRow={id:string;title:string;starts_at:string;reminder_minutes:number};
function reminderTime(row:EventRow){return new Date(row.starts_at).getTime()-row.reminder_minutes*60000;}
export function ForegroundReminderAlerts({session}:{session:Session}){
 const [enabled,setEnabled]=useState(()=>localStorage.getItem('herlife-foreground-reminders')==='yes');
 const [alert,setAlert]=useState<EventRow|null>(null);
 const [permission,setPermission]=useState<string>(()=>typeof Notification==='undefined'?'unsupported':Notification.permission);
 const delivered=useRef<Set<string>>(new Set());
 async function activate(){
  if(typeof Notification==='undefined'){setEnabled(true);localStorage.setItem('herlife-foreground-reminders','yes');return;}
  const result=await Notification.requestPermission();setPermission(result);setEnabled(true);localStorage.setItem('herlife-foreground-reminders','yes');
 }
 useEffect(()=>{
  if(!enabled||!supabase)return;
  let active=true;
  async function check(){
   if(!supabase||document.visibilityState!=='visible')return;
   const now=Date.now();
   const start=new Date(now-24*60*60*1000).toISOString(),end=new Date(now+48*60*60*1000).toISOString();
   const {data}=await supabase.from('calendar_events').select('id,title,starts_at,reminder_minutes').eq('user_id',session.user.id).gte('starts_at',start).lte('starts_at',end);
   if(!active)return;
   for(const event of (data||[]) as EventRow[]){
    const moment=reminderTime(event);
    if(moment>now||now-moment>70000||delivered.current.has(event.id))continue;
    delivered.current.add(event.id);setAlert(event);
    if(typeof Notification!=='undefined'&&Notification.permission==='granted'&&document.visibilityState==='visible'){
     try{new Notification('HerLife reminder',{body:event.title,tag:'herlife-'+event.id});}catch{/* browsers may only support service-worker notifications */}
    }
    try{const Ctx=window.AudioContext;if(Ctx){const ctx=new Ctx();const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type='sine';oscillator.frequency.value=740;gain.gain.value=.04;oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start();oscillator.stop(ctx.currentTime+.26);oscillator.onended=()=>void ctx.close();}}catch{/* audio may be blocked */}
   }
  }
  void check();const tick=window.setInterval(()=>void check(),20000);
  return()=>{active=false;window.clearInterval(tick);};
 },[enabled,session.user.id]);
 return <>
  {alert&&<div className="foreground-alert" role="alert"><Bell size={18}/><span><strong>Event reminder</strong>{alert.title}</span><button aria-label="Dismiss reminder" className="icon-btn" onClick={()=>setAlert(null)}><X size={17}/></button></div>}
  <button className="icon-btn reminder-header-button" title={enabled?'On-screen reminders enabled. Alerts only while HerLife is active. Tap to disable.':'Enable on-screen reminders (only while app is open)'} aria-label={enabled?'On-screen reminders on. Tap to disable':'Enable on-screen reminders'} onClick={()=>{if(enabled){setEnabled(false);localStorage.setItem('herlife-foreground-reminders','no');}else void activate();}}>{enabled?<Bell size={19}/>:<BellOff size={19}/>}</button>
 </>;
}
