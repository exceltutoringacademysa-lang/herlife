import {useEffect,useMemo,useRef,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {BookOpen,Clock,Mic,MicOff,Play,Pause,RotateCcw,Check,Wallet,Palette,Image,ChevronRight} from 'lucide-react';
const passages=[
 {ref:'Psalm 23:1',text:'The LORD is my shepherd; I shall not want.',missing:'shepherd'},
 {ref:'Proverbs 3:5',text:'Trust in the LORD with all thine heart; and lean not unto thine own understanding.',missing:'Trust'},
 {ref:'Philippians 4:13',text:'I can do all things through Christ which strengtheneth me.',missing:'Christ'},
 {ref:'Psalm 119:105',text:'Thy word is a lamp unto my feet, and a light unto my path.',missing:'lamp'},
 {ref:'John 3:16',text:'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',missing:'loved'},
 {ref:'Romans 8:28',text:'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',missing:'good'},
 {ref:'Joshua 1:9',text:'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.',missing:'courage'},
 {ref:'Matthew 5:14',text:'Ye are the light of the world. A city that is set on an hill cannot be hid.',missing:'light'},
 {ref:'1 Thessalonians 5:17',text:'Pray without ceasing.',missing:'Pray'},
 {ref:'Psalm 46:10',text:'Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.',missing:'still'},
 {ref:'Hebrews 11:1',text:'Now faith is the substance of things hoped for, the evidence of things not seen.',missing:'faith'},
 {ref:'Matthew 6:33',text:'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.',missing:'kingdom'},
 {ref:'James 1:5',text:'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.',missing:'wisdom'},
 {ref:'Psalm 121:2',text:'My help cometh from the LORD, which made heaven and earth.',missing:'help'},
 {ref:'Isaiah 40:31',text:'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.',missing:'strength'},
 {ref:'Romans 12:12',text:'Rejoicing in hope; patient in tribulation; continuing instant in prayer;',missing:'hope'},
 {ref:'Colossians 3:23',text:'And whatsoever ye do, do it heartily, as to the Lord, and not unto men;',missing:'heartily'},
 {ref:'Psalm 37:4',text:'Delight thyself also in the LORD: and he shall give thee the desires of thine heart.',missing:'Delight'},
 {ref:'1 Corinthians 13:4',text:'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up,',missing:'kind'},
 {ref:'Lamentations 3:23',text:'They are new every morning: great is thy faithfulness.',missing:'faithfulness'}
];
type BibleMode='flash'|'missing'|'initial'|'voice';
type Tracking={savings:{id:string;name:string;target:number;amount:number}[];investments:{id:string;name:string;contributions:number;value:number}[];practice:string[]};
const initial:Tracking={savings:[],investments:[],practice:[]};
const rand=(n:number)=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'}).format(n);
function read(key:string):Tracking{try{const parsed=JSON.parse(localStorage.getItem(key)||'null') as Tracking|null;return parsed&&Array.isArray(parsed.practice)&&Array.isArray(parsed.savings)&&Array.isArray(parsed.investments)?parsed:initial;}catch{return initial;}}
export function BibleMemory({session}:{session:Session}){
 const storage='herlife-memory-v1-'+session.user.id;
 const [data,setData]=useState<Tracking>(()=>read(storage));
 const [mode,setMode]=useState<BibleMode>('flash'),[index,setIndex]=useState(0),[revealed,setRevealed]=useState(false),[input,setInput]=useState(''),[feedback,setFeedback]=useState('');
 const [recording,setRecording]=useState(false),[voiceUrl,setVoiceUrl]=useState('');
 const stream=useRef<MediaStream|null>(null),recorder=useRef<MediaRecorder|null>(null),chunks=useRef<Blob[]>([]);
 const verse=passages[index%passages.length];
 useEffect(()=>{localStorage.setItem(storage,JSON.stringify(data));},[data,storage]);
 useEffect(()=>()=>{recorder.current?.state==='recording'&&recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop());},[]);
 const practiced=new Set(data.practice);
 const streak=useMemo(()=>{let n=0;const d=new Date();while(true){const date=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');if(!practiced.has(date))break;n++;d.setDate(d.getDate()-1);}return n;},[data.practice]);
 function next(){setIndex(x=>x+1);setRevealed(false);setInput('');setFeedback('');}
 function mark(){const now=new Date();const date=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');setData(v=>({...v,practice:v.practice.includes(date)?v.practice:[...v.practice,date]}));setFeedback('Practice recorded for today.');}
 async function record(){if(recording){recorder.current?.stop();setRecording(false);return;}if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){setFeedback('Audio recording is not supported in this browser.');return;}try{const media=await navigator.mediaDevices.getUserMedia({audio:true});stream.current=media;chunks.current=[];const rec=new MediaRecorder(media);recorder.current=rec;rec.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data);};rec.onstop=()=>{setVoiceUrl(old=>{if(old)URL.revokeObjectURL(old);return URL.createObjectURL(new Blob(chunks.current,{type:rec.mimeType}));});media.getTracks().forEach(t=>t.stop());};rec.start();setRecording(true);}catch{setFeedback('Microphone access was not granted.');}}
 const blank=verse.text.replace(new RegExp('\\b'+verse.missing+'\\b','i'),'_____');
 return <section className="special-page"><header className="special-heading"><BookOpen/><div><p className="eyebrow">BIBLE MEMORY</p><h1>Remember the Word</h1><p>Learn real verses from the public-domain King James Version.</p></div></header>
 <div className="special-summary"><span><strong>{streak}</strong> day streak</span><span><strong>{data.practice.length}</strong> practice days recorded on this device</span></div>
 <div className="special-tabs">{([['flash','Flashcards'],['missing','Missing word'],['initial','First letters'],['voice','Voice practice']] as const).map(([id,label])=><button key={id} className={mode===id?'active':''} onClick={()=>{setMode(id);setInput('');setFeedback('');}}>{label}</button>)}</div>
 <div className="special-paper"><small>{verse.ref} · KJV · {index+1}/{passages.length}</small>
 {mode==='flash'?<><h2>{revealed?verse.text:'Take a moment and recall the verse.'}</h2><button className="secondary" onClick={()=>setRevealed(x=>!x)}>{revealed?'Hide verse':'Reveal verse'}</button></>:mode==='missing'?<><h2>{blank}</h2><label>Fill in the missing word<input value={input} onChange={e=>setInput(e.target.value)} placeholder="Type your answer"/></label><button className="secondary" onClick={()=>setFeedback(input.trim().toLowerCase()===verse.missing.toLowerCase()?'Correct!':'Answer: '+verse.missing)}>Check answer</button></>:mode==='initial'?<><h2>{verse.text.split(' ').map(w=>w.replace(/[A-Za-z]/g,(letter,i)=>i===0?letter:'_')).join(' ')}</h2><button className="secondary" onClick={()=>setRevealed(x=>!x)}>{revealed?'Hide full verse':'Show full verse'}</button>{revealed&&<p>{verse.text}</p>}</>:<><h2>{verse.text}</h2><p>Read or recite this verse aloud. You can listen back to your own recording.</p><button className="secondary" onClick={()=>void record()}>{recording?<MicOff size={17}/>:<Mic size={17}/>} {recording?'Stop recording':'Record voice'}</button>{voiceUrl&&<audio controls src={voiceUrl}/>}<p className="tiny muted">Recordings stay temporarily on this device and are not uploaded.</p></>}
 {feedback&&<p className="special-message" role="status">{feedback}</p>}
 <div className="special-actions"><button className="secondary" onClick={next}>Next verse <ChevronRight size={17}/></button><button className="primary" onClick={mark}><Check size={17}/> Mark practised</button></div></div></section>;
}
export function FinanceTracker({session}:{session:Session}){
 const storage='herlife-finance-tracker-'+session.user.id;const [data,setData]=useState<Tracking>(()=>read(storage));const [tab,setTab]=useState<'savings'|'investments'>('savings');const [name,setName]=useState(''),[amount,setAmount]=useState(''),[target,setTarget]=useState('');
 useEffect(()=>{localStorage.setItem(storage,JSON.stringify(data));},[storage,data]);
 const list=tab==='savings'?data.savings:data.investments;
 function add(e:React.FormEvent){e.preventDefault();const n=Number(amount),t=Number(target);if(!name.trim()||n<0||t<0||!Number.isFinite(n)||!Number.isFinite(t))return;const id=crypto.randomUUID();setData(d=>tab==='savings'?{...d,savings:[...d.savings,{id,name:name.trim(),amount:n,target:t}]}:{...d,investments:[...d.investments,{id,name:name.trim(),contributions:n,value:t}]});setName('');setAmount('');setTarget('');}
 return <section className="special-page"><header className="special-heading"><Wallet/><div><p className="eyebrow">FINANCIAL PLANNING</p><h1>Savings & investments</h1><p>Keep a private record of savings goals and investments.</p></div></header><div className="special-tabs"><button className={tab==='savings'?'active':''} onClick={()=>setTab('savings')}>Savings</button><button className={tab==='investments'?'active':''} onClick={()=>setTab('investments')}>Investments</button></div><div className="special-summary"><span><strong>{rand(tab==='savings'?data.savings.reduce((a,b)=>a+b.amount,0):data.investments.reduce((a,b)=>a+b.value,0))}</strong> {tab==='savings'?'saved':'estimated value'}</span><span>{list.length} tracked</span></div>
 <form className="special-form" onSubmit={add}><h2>{tab==='savings'?'New savings goal':'Track an investment'}</h2><label>Name<input required value={name} onChange={e=>setName(e.target.value)} placeholder={tab==='savings'?'Emergency savings':'Index fund'}/></label><label>{tab==='savings'?'Current savings (R)':'Contributions (R)'}<input required type="number" min="0" step=".01" value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>{tab==='savings'?'Goal (R)':'Estimated current value (R)'}<input required type="number" min="0" step=".01" value={target} onChange={e=>setTarget(e.target.value)}/></label><button className="primary" type="submit">Add to tracker</button></form>
 <div className="special-rows">{list.map(item=><article key={item.id}><strong>{item.name}</strong><span>{tab==='savings'?rand('amount' in item?item.amount:0)+' / '+rand('target' in item?item.target:0):rand('value' in item?item.value:0)}</span><button className="secondary" onClick={()=>setData(d=>tab==='savings'?{...d,savings:d.savings.filter(v=>v.id!==item.id)}:{...d,investments:d.investments.filter(v=>v.id!==item.id)})}>Remove</button></article>)}</div><p className="tiny muted">Manually recorded estimates only. No bank or brokerage connection, automatic valuations, or investment advice. Records are stored in this browser, not synced to other devices.</p></section>;
}
export function FocusTimer(){
 const [minutes,setMinutes]=useState(25),[seconds,setSeconds]=useState(1500),[running,setRunning]=useState(false),[rounds,setRounds]=useState(0);
 const finish=useRef(0);
 useEffect(()=>{if(!running)return;finish.current=Date.now()+seconds*1000;const tick=window.setInterval(()=>{const left=Math.max(0,Math.ceil((finish.current-Date.now())/1000));setSeconds(left);if(left===0){setRunning(false);setRounds(x=>x+1);}},500);return()=>window.clearInterval(tick);},[running]);
 function choose(n:number){setRunning(false);setMinutes(n);setSeconds(n*60);}
 return <section className="special-page"><header className="special-heading"><Clock/><div><p className="eyebrow">FOCUS & REST</p><h1>Pomodoro timer</h1><p>Make time for studying, prayer, rest or important work.</p></div></header><div className="special-tabs">{[[25,'Focus · 25 min'],[5,'Short break'],[15,'Long break']].map(([n,label])=><button key={n} className={minutes===n?'active':''} onClick={()=>choose(Number(n))}>{label}</button>)}</div><div className="focus-time" aria-live="off">{String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</div><div className="special-actions"><button className="primary" onClick={()=>setRunning(v=>!v)}>{running?<Pause size={18}/>:<Play size={18}/>} {running?'Pause':'Start'}</button><button className="secondary" onClick={()=>choose(minutes)}><RotateCcw size={17}/> Reset</button></div><p className="muted">{rounds} completed sessions this visit. Keep HerLife open for the timer; no background alarm has been scheduled.</p></section>;
}
export function AppearanceStudio({session}:{session:Session}){
 const key='herlife-accent-'+session.user.id;const [theme,setTheme]=useState(()=>localStorage.getItem(key)||'plum');
 const colors={plum:['#57415b','#f7f4f7'],rose:['#9a6279','#faf4f5'],sage:['#567a6d','#f4f8f5'],ocean:['#4a728d','#f3f7f9']} as const;
 useEffect(()=>{localStorage.setItem(key,theme);document.documentElement.style.setProperty('--purple',colors[theme as keyof typeof colors]?.[0]||colors.plum[0]);},[key,theme]);
 return <section className="special-page"><header className="special-heading"><Palette/><div><p className="eyebrow">MAKE IT YOURS</p><h1>Colour themes</h1><p>Choose the accent that feels most like her.</p></div></header><div className="theme-swatches">{Object.entries(colors).map(([name,c])=><button className={theme===name?'selected':''} style={{background:c[1],borderColor:c[0],color:c[0]}} onClick={()=>setTheme(name)} key={name}><span style={{background:c[0]}}/>{name}</button>)}</div><p className="tiny muted">Accent colours are a device preference. The app's light/dark setting remains available separately.</p></section>;
}
