import {useState,type FormEvent} from 'react';
import type {Session} from '@supabase/supabase-js';
import {Sparkles,Send,Scale,GraduationCap,BookOpen,NotebookPen,HeartHandshake,RotateCcw,LockKeyhole} from 'lucide-react';
type Mode='general'|'debate'|'slp'|'scripture'|'writing';
type Message={role:'user'|'assistant';text:string};
const modes:{id:Mode;label:string;icon:typeof Sparkles;intro:string;example:string}[]=[
 {id:'general',label:'Everyday',icon:HeartHandshake,intro:'Ask about study routines, planning, budgeting concepts or using HerLife.',example:'Help me plan a balanced university study week.'},
 {id:'debate',label:'Debate me',icon:Scale,intro:'Choose a motion. The companion will challenge your argument and debate the opposite side.',example:'Debate me: Universities should abolish traditional examinations. I support the motion.'},
 {id:'slp',label:'SLP tutor',icon:GraduationCap,intro:'Explore hypothetical clinical cases and explain your speech-language pathology reasoning.',example:'Give me a fictional child language assessment case and challenge my reasoning one step at a time.'},
 {id:'scripture',label:'Bible study',icon:BookOpen,intro:'Discuss passages, interpretations and faith questions.',example:'Help me reflect on James 1:5 with discussion questions.'},
 {id:'writing',label:'Writing coach',icon:NotebookPen,intro:'Get ideas for essays, speeches and journal prompts without opening your private documents.',example:'Help me organise a reflective essay without writing it for me.'}
];
export function HerLifeCompanion({session,initialMode='general'}:{session:Session;initialMode?:Mode}){
 const [mode,setMode]=useState<Mode>(initialMode),[messages,setMessages]=useState<Message[]>([]),[input,setInput]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const active=modes.find(x=>x.id===mode)!;
 async function submit(event?:FormEvent,starter?:string){
  event?.preventDefault();
  const prompt=(starter??input).trim();if(!prompt||loading)return;
  const history=[...messages,{role:'user',text:prompt} as Message].slice(-14);
  setMessages(history);setInput('');setError('');setLoading(true);
  try{
   const response=await fetch('/api/companion',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({mode,messages:history})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(result.error||'The companion could not respond.');
   if(typeof result.reply!=='string')throw Error('The provider returned no answer.');
   setMessages(items=>[...items,{role:'assistant',text:result.reply}]);
  }catch(e){setError(e instanceof Error?e.message:'Could not contact the companion.');}
  finally{setLoading(false);}
 }
 function changeMode(next:Mode){setMode(next);setMessages([]);setInput('');setError('');}
 return <section className="companion-shell" aria-label="HerLife optional AI companion">
 <header className="companion-intro"><span className="companion-mark"><Sparkles size={22}/></span><div><p className="eyebrow">HERLIFE · OPTIONAL STUDY & LIFE SUPPORT</p><h1>Your companion</h1><p>Thoughtful conversations, constructive debates and educational guidance whenever you choose.</p></div></header>
 <div className="companion-modes" role="group" aria-label="Choose a companion mode">{modes.map(x=><button key={x.id} type="button" aria-pressed={mode===x.id} className={mode===x.id?'selected':''} onClick={()=>changeMode(x.id)}><x.icon size={17}/>{x.label}</button>)}</div>
 <div className="companion-conversation" aria-live="polite">
 {messages.length===0?<div className="companion-welcome"><active.icon size={30}/><h2>{active.label}</h2><p>{active.intro}</p><button className="companion-suggestion" onClick={()=>void submit(undefined,active.example)}>{active.example} <Send size={15}/></button></div>:messages.map((message,i)=><div key={i} className={'companion-message '+message.role}><span>{message.role==='assistant'?'HerLife Companion':'You'}</span><div>{message.text}</div></div>)}
 {loading&&<div className="companion-message assistant"><span>HerLife Companion</span><div>Thinking through your question…</div></div>}
 </div>
 {error&&<p role="alert" className="companion-error">{error}</p>}
 <form className="companion-composer" onSubmit={e=>void submit(e)}><label htmlFor="companion-prompt">Your message</label><textarea id="companion-prompt" value={input} maxLength={3500} rows={3} onChange={e=>setInput(e.target.value)} placeholder={mode==='debate'?'State your motion and position…':mode==='slp'?'Describe a fictional case or a topic to practise…':'Ask a question…'}/><div className="companion-composer-actions"><button type="button" className="secondary" onClick={()=>{setMessages([]);setError('');setInput('');}}><RotateCcw size={16}/> New conversation</button><button className="primary" type="submit" disabled={loading||!input.trim()}><Send size={16}/> Send</button></div></form>
 <p className="companion-privacy"><LockKeyhole size={15}/> Only messages you choose to send go to the AI provider. Your private photos, videos, journal, notes, calendar and financial records are not retrieved automatically. Do not enter identifying patient details. Provider processing and free usage limits apply. AI replies can be mistaken.</p>
 </section>;
}
