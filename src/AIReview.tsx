import {useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {Sparkles} from 'lucide-react';
export function AIReview({session,mode,question,answer}:{session:Session;mode:'slp'|'debate';question:string;answer:string}){
 const [reply,setReply]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function review(){
  if(!answer.trim()||busy)return;setBusy(true);setError('');
  try{
   const text=mode==='slp'? 'For this fictional learning case, critique my reasoning and identify gaps, without providing medical advice or claiming to grade me officially. Case: '+question+'\nMy reasoning: '+answer:'Debate motion: '+question+'\nMy argument: '+answer+'\nEvaluate the logic, identify strengths, counterarguments and what would make the case stronger. Be constructively challenging.';
   const response=await fetch('/api/companion',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({mode,messages:[{role:'user',text:text.slice(0,3500)}]})});
   const result=await response.json();if(!response.ok)throw Error(result.error||'AI review unavailable.');
   setReply(result.reply);
  }catch(e){setError(e instanceof Error?e.message:'Could not review your answer.');}finally{setBusy(false);}
 }
 return <div className="ai-review"><button className="secondary" onClick={()=>void review()} disabled={busy||!answer.trim()}><Sparkles size={16}/>{busy?'Reviewing…':'Ask AI to review my answer'}</button><p className="tiny muted">Only this question and the answer you typed will be shared with Gemini. This is educational feedback, not an official mark.</p>{reply&&<div className="ai-review-reply">{reply}</div>}{error&&<p role="alert" className="companion-error">{error}</p>}</div>;
}
