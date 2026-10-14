import {useEffect,useMemo,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {GraduationCap,BookOpen,RotateCcw,CheckCircle2,ArrowRight} from 'lucide-react';
import {slpBank} from './slpBank';
type History={completed:number[];correct:number[]};
const empty:History={completed:[],correct:[]};
function load(key:string):History{try{const x=JSON.parse(localStorage.getItem(key)||'null') as History|null;return x&&Array.isArray(x.completed)&&Array.isArray(x.correct)?x:empty;}catch{return empty;}}
export function SLPPractice({session}:{session:Session}){
 const key='herlife-slp-study-'+session.user.id;
 const [history,setHistory]=useState<History>(()=>load(key)),[type,setType]=useState<'all'|'case'|'question'>('all'),[topic,setTopic]=useState('All topics');
 const [at,setAt]=useState(0),[chosen,setChosen]=useState<number|null>(null),[reason,setReason]=useState(''),[show,setShow]=useState(false);
 useEffect(()=>{localStorage.setItem(key,JSON.stringify(history));},[history,key]);
 const topics=useMemo(()=>['All topics',...new Set(slpBank.map(i=>i.topic))],[]);
 const filtered=useMemo(()=>slpBank.filter(item=>(type==='all'||item.type===type)&&(topic==='All topics'||item.topic===topic)),[type,topic]);
 const item=filtered[at%filtered.length];
 function answer(index:number){if(chosen!==null)return;setChosen(index);setShow(true);setHistory(prev=>({...prev,completed:prev.completed.includes(item.id)?prev.completed:[...prev.completed,item.id],correct:index===item.correct&&!prev.correct.includes(item.id)?[...prev.correct,item.id]:prev.correct}));}
 function next(){setAt(i=>i+1);setChosen(null);setShow(false);setReason('');}
 function filterType(value:'all'|'case'|'question'){setType(value);setAt(0);setChosen(null);setReason('');setShow(false);}
 function filterTopic(value:string){setTopic(value);setAt(0);setChosen(null);setReason('');setShow(false);}
 return <section className="slp-page"><header className="special-heading"><GraduationCap/><div><p className="eyebrow">SPEECH-LANGUAGE PATHOLOGY • UCT STUDY SUPPORT</p><h1>Clinical Reasoning Studio</h1><p>100 mixed case-based and knowledge questions, with explanations and independent reasoning practice.</p></div></header>
 <div className="slp-stats"><span><strong>{history.completed.length}</strong> of 100 attempted</span><span><strong>{history.correct.length}</strong> first-time correct</span><span><strong>25</strong> practice topics</span></div>
 <div className="slp-filters"><div className="special-tabs">{([['all','All 100'],['case','Clinical cases'],['question','Knowledge questions']] as const).map(([val,label])=><button className={type===val?'active':''} key={val} onClick={()=>filterType(val)}>{label}</button>)}</div><label>Topic <select value={topic} onChange={e=>filterTopic(e.target.value)}>{topics.map(t=><option key={t}>{t}</option>)}</select></label></div>
 <div className="slp-question"><div className="slp-meta"><span>{item.type==='case'?'CASE STUDY':'KNOWLEDGE CHECK'}</span><span>{item.topic}</span><span>{at%filtered.length+1} / {filtered.length}</span></div><h2>{item.stem}</h2><div className="slp-choices">{item.options.map((text,i)=><button key={i} disabled={chosen!==null} className={chosen!==null?(i===item.correct?'correct':i===chosen?'incorrect':''):''} onClick={()=>answer(i)}><span>{String.fromCharCode(65+i)}</span>{text}{chosen!==null&&i===item.correct?<CheckCircle2 size={18}/>:null}</button>)}</div>
 <label className="slp-reason">Your clinical reasoning (optional)<textarea rows={4} placeholder="What assessment information would you need? Which alternatives would you rule out?" value={reason} onChange={e=>setReason(e.target.value)} /></label>
 {show&&<div className="slp-explanation" role="status"><strong>{chosen===item.correct?'Correct approach.':'Consider the alternative.'}</strong><p>{item.explanation}</p><p className="tiny muted">Learning scenario only. Always follow lecturer guidance, supervised clinical practice, applicable South African professional rules and assessment protocols.</p></div>}
 <div className="slp-actions"><button className="secondary" onClick={()=>setShow(true)}><BookOpen size={16}/> Read explanation</button><button className="primary" onClick={next}>Next question <ArrowRight size={16}/></button></div></div>
 <p className="tiny muted">These are original practice vignettes, not UCT examination questions or clinical guidance for a real patient. Progress is currently stored on this device and can be reset here.</p>
 <button className="secondary" onClick={()=>{if(window.confirm('Reset all SLP practice progress on this device?')){setHistory(empty);setAt(0);setChosen(null);setShow(false);}}}><RotateCcw size={15}/> Reset study progress</button></section>;
}
