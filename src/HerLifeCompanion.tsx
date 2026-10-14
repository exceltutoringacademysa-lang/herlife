import {useEffect,useRef,useState,type FormEvent} from 'react';
import type {Session} from '@supabase/supabase-js';
import {Sparkles,Send,Scale,GraduationCap,BookOpen,NotebookPen,HeartHandshake,RotateCcw,LockKeyhole,Mic,MicOff,Volume2,VolumeX} from 'lucide-react';
type Mode='general'|'debate'|'slp'|'scripture'|'writing';
type Message={role:'user'|'assistant';text:string};
const MAX_VOICE_BYTES=4*1024*1024;
function RichReply({text}:{text:string}){
 const lines=text.split(/\n/);
 const inline=(line:string)=>line.split(/(\*\*[^*]+\*\*)/g).map((part,i)=>part.startsWith('**')&&part.endsWith('**')?<strong key={i}>{part.slice(2,-2)}</strong>:part);
 return <div className="ai-rich-reply">{lines.map((line,i)=>{const t=line.trim();if(!t)return <div key={i} className="ai-reply-space"/>;if(t.startsWith('### '))return <h4 key={i}>{inline(t.slice(4))}</h4>;if(t.startsWith('## ')||t.startsWith('# '))return <h3 key={i}>{inline(t.replace(/^#+\s*/,''))}</h3>;if(/^[-*] /.test(t))return <div key={i} className="ai-reply-bullet"><span aria-hidden="true">•</span><p>{inline(t.slice(2))}</p></div>;if(/^\d+[.)] /.test(t))return <div key={i} className="ai-reply-bullet"><span>{t.match(/^\d+/)?.[0]}.</span><p>{inline(t.replace(/^\d+[.)] /,''))}</p></div>;return <p key={i}>{inline(t)}</p>;})}</div>;
}

const modes:{id:Mode;label:string;icon:typeof Sparkles;intro:string;example:string}[]=[
 {id:'general',label:'Everyday',icon:HeartHandshake,intro:'Ask about study routines, planning, budgeting concepts or using HerLife.',example:'Help me plan a balanced university study week.'},
 {id:'debate',label:'Debate me',icon:Scale,intro:'Choose a motion. The companion will challenge your argument and debate the opposite side.',example:'Debate me: Universities should abolish traditional examinations. I support the motion.'},
 {id:'slp',label:'SLP tutor',icon:GraduationCap,intro:'Explore hypothetical clinical cases and explain your speech-language pathology reasoning.',example:'Give me a fictional child language assessment case and challenge my reasoning one step at a time.'},
 {id:'scripture',label:'Bible study',icon:BookOpen,intro:'Discuss passages, interpretations and faith questions.',example:'Help me reflect on James 1:5 with discussion questions.'},
 {id:'writing',label:'Writing coach',icon:NotebookPen,intro:'Get ideas for essays, speeches and journal prompts without opening your private documents.',example:'Help me organise a reflective essay without writing it for me.'}
];
export function HerLifeCompanion({session,initialMode='general'}:{session:Session;initialMode?:Mode}){
 const [mode,setMode]=useState<Mode>(initialMode),[messages,setMessages]=useState<Message[]>([]),[input,setInput]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const [recording,setRecording]=useState(false),[voice,setVoice]=useState<{data:string;mimeType:string}|null>(null),[speaking,setSpeaking]=useState(false);
 const recorder=useRef<MediaRecorder|null>(null),media=useRef<MediaStream|null>(null),chunks=useRef<Blob[]>([]);
 useEffect(()=>()=>{if(recorder.current?.state==='recording')recorder.current.stop();media.current?.getTracks().forEach(t=>t.stop());window.speechSynthesis?.cancel();},[]);
 async function toggleVoice(){
  if(recording){recorder.current?.stop();setRecording(false);return;}
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){setError('Voice notes are unsupported on this browser. Try Safari on an updated iPhone.');return;}
  try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:true});media.current=stream;chunks.current=[];
   const preferred=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(type=>MediaRecorder.isTypeSupported(type));
   const rec=new MediaRecorder(stream,preferred?{mimeType:preferred}:undefined);recorder.current=rec;
   rec.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data);};
   rec.onstop=async()=>{stream.getTracks().forEach(track=>track.stop());const blob=new Blob(chunks.current,{type:rec.mimeType});if(blob.size>MAX_VOICE_BYTES){setError('Voice note too large. Please record a shorter note (under 4 MB).');return;}try{const base64=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(Error('Voice encoding failed'));reader.onload=()=>resolve(String(reader.result).split(',')[1]||'');reader.readAsDataURL(blob);});setVoice({data:base64,mimeType:blob.type||'audio/mp4'});setError('');}catch{setError('Could not prepare your recording.');}};
   rec.start();setRecording(true);setVoice(null);setError('');
  }catch{setError('Microphone permission was denied or unavailable.');}
 }
 function say(text:string){if(!('speechSynthesis' in window)){setError('Read aloud is not supported here.');return;}window.speechSynthesis.cancel();if(speaking){setSpeaking(false);return;}const spoken=new SpeechSynthesisUtterance(text.replace(/[#*_]/g,''));spoken.rate=.92;spoken.lang='en-ZA';spoken.onend=()=>setSpeaking(false);spoken.onerror=()=>setSpeaking(false);setSpeaking(true);window.speechSynthesis.speak(spoken);}

 const active=modes.find(x=>x.id===mode)!;
 async function submit(event?:FormEvent,starter?:string){
  event?.preventDefault();
  const prompt=(starter??input).trim();if((!prompt&&!voice)||loading)return;
  const history=[...messages,{role:'user',text:prompt||(voice?'Please listen to my voice note and respond to the argument or question I express.':'')} as Message].slice(-14);
  setMessages(history);setInput('');setError('');setLoading(true);
  try{
   const response=await fetch('/api/companion',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({mode,messages:history,audio:voice})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(result.error||'The companion could not respond.');
   if(typeof result.reply!=='string')throw Error('The provider returned no answer.');
   setMessages(items=>[...items,{role:'assistant',text:result.reply}]);setVoice(null);
  }catch(e){setError(e instanceof Error?e.message:'Could not contact the companion.');}
  finally{setLoading(false);}
 }
 function changeMode(next:Mode){setMode(next);setMessages([]);setInput('');setVoice(null);setError('');window.speechSynthesis?.cancel();setSpeaking(false);}
 return <section className="companion-shell" aria-label="HerLife optional AI companion">
 <header className="companion-intro"><span className="companion-mark"><Sparkles size={22}/></span><div><p className="eyebrow">HERLIFE · OPTIONAL STUDY & LIFE SUPPORT</p><h1>Your companion</h1><p>Thoughtful conversations, constructive debates and educational guidance whenever you choose.</p></div></header>
 <div className="companion-modes" role="group" aria-label="Choose a companion mode">{modes.map(x=><button key={x.id} type="button" aria-pressed={mode===x.id} className={mode===x.id?'selected':''} onClick={()=>changeMode(x.id)}><x.icon size={17}/>{x.label}</button>)}</div>
 <div className="companion-conversation" aria-live="polite">
 {messages.length===0?<div className="companion-welcome"><active.icon size={30}/><h2>{active.label}</h2><p>{active.intro}</p><p className="companion-starter-guide">Write your own question, choose a debate motion, or record an argument. The conversation is not limited to preset questions.</p></div>:messages.map((message,i)=><div key={i} className={'companion-message '+message.role}><span>{message.role==='assistant'?'HerLife Companion':'You'}</span><div>{message.role==='assistant'?<><RichReply text={message.text}/><button type="button" className="ai-listen" onClick={()=>say(message.text)}>{speaking?<VolumeX size={15}/>:<Volume2 size={15}/>} {speaking?'Stop audio':'Listen to reply'}</button></>:message.text}</div></div>)}
 {loading&&<div className="companion-message assistant"><span>HerLife Companion</span><div>Thinking through your question…</div></div>}
 </div>
 {error&&<p role="alert" className="companion-error">{error}</p>}
 <form className="companion-composer" onSubmit={e=>void submit(e)}><label htmlFor="companion-prompt">Your message</label><textarea id="companion-prompt" value={input} maxLength={3500} rows={3} onChange={e=>setInput(e.target.value)} placeholder={mode==='debate'?'State your motion and position…':mode==='slp'?'Describe a fictional case or a topic to practise…':'Ask a question…'}/>{voice&&<div className="companion-voice-ready">Voice note ready to send <button type="button" onClick={()=>setVoice(null)}>Remove</button></div>}<div className="companion-composer-actions"><button type="button" className="secondary" onClick={()=>{setMessages([]);setError('');setInput('');}}><RotateCcw size={16}/> New conversation</button><div className="companion-send-controls"><button className="secondary" type="button" onClick={()=>void toggleVoice()} disabled={loading}>{recording?<MicOff size={16}/>:<Mic size={16}/>} {recording?'Stop recording':'Voice note'}</button><button className="primary" type="submit" disabled={loading||(!input.trim()&&!voice)}><Send size={16}/> Send</button></div></div></form>
 <p className="companion-privacy"><LockKeyhole size={15}/> Only text or voice notes you explicitly send go to the AI provider. Your private photos, videos, journal, notes, calendar and financial records are not retrieved automatically. Do not enter identifying patient details. Provider processing and free usage limits apply. AI replies can be mistaken.</p>
 </section>;
}
