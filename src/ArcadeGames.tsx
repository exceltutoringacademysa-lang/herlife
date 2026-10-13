import {useMemo,useState} from 'react';
import {ArrowRight,RotateCcw,Sparkles} from 'lucide-react';
import {wordPairs} from './gameBank';
const shuffle=<T,>(items:T[]):T[]=>{const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;};
type Card={id:number;pair:number;label:string};
export function MemoryMatch(){
 const [round,setRound]=useState(0);
 const cards=useMemo(()=>shuffle(wordPairs.slice((round*4)%wordPairs.length,(round*4)%wordPairs.length+4).flatMap(([word,definition],i)=>[{id:i*2,pair:i,label:word},{id:i*2+1,pair:i,label:definition}])),[round]);
 const [first,setFirst]=useState<number|null>(null),[second,setSecond]=useState<number|null>(null),[solved,setSolved]=useState<number[]>([]),[attempts,setAttempts]=useState(0);
 const clear=()=>{setFirst(null);setSecond(null);};
 function flip(card:Card){
  if(solved.includes(card.pair)||second!==null||first===card.id)return;
  if(first===null){setFirst(card.id);return;}
  setSecond(card.id);setAttempts(n=>n+1);
  const original=cards.find(item=>item.id===first);
  if(original?.pair===card.pair){setSolved(s=>[...s,card.pair]);window.setTimeout(clear,450);}else window.setTimeout(clear,1100);
 }
 const done=solved.length===4;
 return <div className="arcade-play"><p className="section-kicker">MATCHING WORDS</p><h2>Find the four matching pairs</h2><p className="muted">Turn over a word and find its meaning. Two taps reveal the pair.</p><div className="memory-board">{cards.map(card=><button type="button" key={card.id} className={'memory-card '+(solved.includes(card.pair)?'solved':'')} onClick={()=>flip(card)} disabled={solved.includes(card.pair)} aria-label={solved.includes(card.pair)||first===card.id||second===card.id?card.label:'Face-down memory card'}>{solved.includes(card.pair)||first===card.id||second===card.id?<span>{card.label}</span>:<span className="memory-hidden">✧</span>}</button>)}</div><div className="arcade-stats"><span>Pairs {solved.length}/4</span><span>Tries {attempts}</span></div>{done&&<div className="arcade-success"><Sparkles/><strong>Every pair found!</strong><button className="primary" onClick={()=>{setRound(r=>r+1);setSolved([]);setAttempts(0);clear();}}>Another board <ArrowRight size={16}/></button></div>}</div>;
}
type Bubble={id:number;label:string;correct:boolean};
export function BubblePop(){
 const [level,setLevel]=useState(0),[points,setPoints]=useState(0),[feedback,setFeedback]=useState('');
 const pair=wordPairs[level%wordPairs.length];
 const bubbles=useMemo<Bubble[]>(()=>{
  const distractors=shuffle(wordPairs.filter(p=>p[0]!==pair[0]).map(p=>p[0])).slice(0,5);
  return shuffle([pair[0],...distractors].map((label,i)=>({id:i,label,correct:label===pair[0]})));
 },[level,pair]);
 function pop(b:Bubble){
  if(feedback)return;
  if(b.correct){setPoints(n=>n+1);setFeedback('Wonderful — that is the matching word!');}
  else setFeedback('Not quite. The matching word is '+pair[0]+'.');
 }
 return <div className="arcade-play"><p className="section-kicker">BUBBLE POP</p><h2>Catch the right word</h2><p className="muted">Read the meaning and pop the bubble with the matching word.</p><div className="bubble-clue"><span>CLUE {level+1} OF {wordPairs.length}</span><strong>{pair[1]}</strong></div><div className="bubble-field">{bubbles.map((b,i)=><button key={b.id} type="button" className={'bubble bubble-'+i+(feedback&&b.correct?' bubble-correct':'')} disabled={!!feedback} onClick={()=>pop(b)}>{b.label}</button>)}</div><div className="arcade-stats"><span>Correct {points}</span><span>Clue {(level%wordPairs.length)+1} / {wordPairs.length}</span></div>{feedback&&<div className="arcade-success"><strong role="status">{feedback}</strong><button className="primary" onClick={()=>{setLevel(l=>l+1);setFeedback('');}}>Next bubbles <ArrowRight size={16}/></button></div>}<button className="secondary" onClick={()=>{setLevel(0);setPoints(0);setFeedback('');}}><RotateCcw size={15}/> Restart</button></div>;
}
