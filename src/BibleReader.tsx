import {useEffect,useMemo,useState,type FormEvent} from 'react';
import type {Session} from '@supabase/supabase-js';
import {BookOpen,ArrowLeft,ArrowRight,Search,RefreshCw,Bookmark,BookmarkCheck,Type,Highlighter,Copy,Share2,Volume2,VolumeX,Trash2} from 'lucide-react';
const BOOKS = [
  ['Genesis',50],['Exodus',40],['Leviticus',27],['Numbers',36],['Deuteronomy',34],['Joshua',24],['Judges',21],['Ruth',4],['1 Samuel',31],['2 Samuel',24],['1 Kings',22],['2 Kings',25],['1 Chronicles',29],['2 Chronicles',36],['Ezra',10],['Nehemiah',13],['Esther',10],['Job',42],['Psalms',150],['Proverbs',31],['Ecclesiastes',12],['Song of Solomon',8],['Isaiah',66],['Jeremiah',52],['Lamentations',5],['Ezekiel',48],['Daniel',12],['Hosea',14],['Joel',3],['Amos',9],['Obadiah',1],['Jonah',4],['Micah',7],['Nahum',3],['Habakkuk',3],['Zephaniah',3],['Haggai',2],['Zechariah',14],['Malachi',4],
  ['Matthew',28],['Mark',16],['Luke',24],['John',21],['Acts',28],['Romans',16],['1 Corinthians',16],['2 Corinthians',13],['Galatians',6],['Ephesians',6],['Philippians',4],['Colossians',4],['1 Thessalonians',5],['2 Thessalonians',3],['1 Timothy',6],['2 Timothy',4],['Titus',3],['Philemon',1],['Hebrews',13],['James',5],['1 Peter',5],['2 Peter',3],['1 John',5],['2 John',1],['3 John',1],['Jude',1],['Revelation',22],
] as const;

type Verse={verse:number;text:string};
type Response={reference?:string;translation_name?:string;verses?:Verse[];error?:string};
type Saved={reference:string;text:string;version:'kjv'|'web';color:string;note?:string};
type Props={session:Session;onAddReflection:(reference:string)=>void;initialReference?:string};
const colors=['#fff1a8','#d7eadd','#f6d9eb','#dfebfc'];
const read=<T,>(key:string,fallback:T):T=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');return value??fallback;}catch{return fallback;}};
export function BibleReader({session,onAddReflection,initialReference='Psalm 23'}:Props){
 const prefix='herlife-bible-'+session.user.id+'-';
 const [version,setVersion]=useState<'kjv'|'web'>(()=>read(prefix+'version','kjv'));
 const [book,setBook]=useState('Psalms'),[chapter,setChapter]=useState(23);
 const [query,setQuery]=useState(initialReference),[reference,setReference]=useState(initialReference);
 const [data,setData]=useState<Response|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const [fontSize,setFontSize]=useState(()=>read(prefix+'font',19)),[spacing,setSpacing]=useState(()=>read(prefix+'spacing',1.85));
 const [saved,setSaved]=useState<Record<string,Saved>>(()=>read(prefix+'saved',{}));
 const [active,setActive]=useState<number|null>(null),[color,setColor]=useState(colors[0]),[showSaved,setShowSaved]=useState(false),[note,setNote]=useState(''),[message,setMessage]=useState('');
 const [speaking,setSpeaking]=useState(false);
 const count=BOOKS.find(([name])=>name===book)?.[1]??1;
 useEffect(()=>{localStorage.setItem(prefix+'saved',JSON.stringify(saved));},[prefix,saved]);
 useEffect(()=>{localStorage.setItem(prefix+'font',JSON.stringify(fontSize));localStorage.setItem(prefix+'spacing',JSON.stringify(spacing));localStorage.setItem(prefix+'version',JSON.stringify(version));},[prefix,fontSize,spacing,version]);
 useEffect(()=>{
  const controller=new AbortController();setLoading(true);setError('');setData(null);setActive(null);
  fetch('https://bible-api.com/'+encodeURIComponent(reference)+'?translation='+version,{signal:controller.signal}).then(async response=>{if(!response.ok)throw Error('This passage could not be found.');const body=await response.json() as Response;if(!body.verses?.length)throw Error(body.error||'No verses were returned.');if(!controller.signal.aborted)setData(body);}).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Unable to load the Bible.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[reference,version]);
 useEffect(()=>()=>window.speechSynthesis?.cancel(),[]);
 const allSaved=useMemo(()=>Object.values(saved).sort((a,b)=>a.reference.localeCompare(b.reference)),[saved]);
 function loadChapter(nextBook=book,nextChapter=chapter){const max=BOOKS.find(([name])=>name===nextBook)?.[1]??1;const n=Math.min(Math.max(1,nextChapter),max);setBook(nextBook);setChapter(n);const ref=nextBook+' '+n;setQuery(ref);setReference(ref);}
 function search(e:FormEvent){e.preventDefault();const term=query.trim();if(!term)return;setReference(term);const m=BOOKS.find(([name])=>term.toLowerCase().startsWith(name.toLowerCase()+' '));if(m){const n=Number(term.slice(m[0].length).trim().split(':')[0]);if(Number.isInteger(n)&&n>=1&&n<=m[1]){setBook(m[0]);setChapter(n);}}}
 const base=(data?.verses?.[0]&&data?.reference||reference).replace(/:\d+(?:-\d+)?(?:\s|$).*/,'');
 const selected=data?.verses?.find(v=>v.verse===active);
 const selectedRef=selected?base+':'+selected.verse:'';
 const selectedSaved=selected?saved[version+' '+selectedRef]:undefined;
 function saveVerse(){if(!selected)return;setSaved(v=>({...v,[version+' '+selectedRef]:{reference:selectedRef,text:selected.text.trim(),version,color,note:note.trim()}}));setMessage('Verse saved on this device.');}
 function highlight(v:Verse){const ref=base+':'+v.verse;const existing=saved[version+' '+ref];setActive(v.verse);setNote(existing?.note||'');setColor(existing?.color||colors[0]);}
 function speak(){if(!('speechSynthesis' in window)){setMessage('Read aloud is not supported by this browser.');return;}if(speaking){window.speechSynthesis.cancel();setSpeaking(false);return;}const utterance=new SpeechSynthesisUtterance((data?.verses||[]).map(v=>v.text).join(' '));utterance.lang='en-GB';utterance.rate=.88;utterance.onend=()=>setSpeaking(false);utterance.onerror=()=>setSpeaking(false);setSpeaking(true);window.speechSynthesis.speak(utterance);}
 async function share(){const text=selected?selectedRef+' (KJV/WEB) — '+selected.text.trim():reference;if(navigator.share){try{await navigator.share({text});}catch{}}else{await navigator.clipboard.writeText(text);setMessage('Copied for sharing.');}}
 return <div className="bible-reader bible-reading-app">
  <header className="bible-topline"><div className="eyebrow"><BookOpen size={16}/> SCRIPTURE</div><div className="bible-read-quick"><button className="secondary" onClick={()=>setShowSaved(v=>!v)}><Bookmark size={15}/> Saved ({allSaved.length})</button><button className="secondary" onClick={speak}>{speaking?<VolumeX size={16}/>:<Volume2 size={16}/>} {speaking?'Stop':'Listen'}</button></div></header>
  <div className="bible-tools"><label>Translation<select value={version} onChange={e=>setVersion(e.target.value as 'kjv'|'web')}><option value="kjv">King James Version (KJV)</option><option value="web">World English Bible (WEB)</option></select></label><label>Book<select value={book} onChange={e=>loadChapter(e.target.value,1)}>{BOOKS.map(([name])=><option key={name}>{name}</option>)}</select></label><label>Chapter<select value={chapter} onChange={e=>loadChapter(book,Number(e.target.value))}>{Array.from({length:count},(_,i)=><option value={i+1} key={i}>{i+1}</option>)}</select></label><form className="bible-search" onSubmit={search}><label htmlFor="bible-search-input">Find a passage</label><div><input id="bible-search-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Romans 8:28"/><button className="primary" type="submit"><Search size={16}/> Read</button></div></form></div>
  {showSaved&&<aside className="saved-scriptures"><div className="bible-reader-heading"><h2>Saved Scriptures</h2><button className="secondary" onClick={()=>setShowSaved(false)}>Close</button></div>{!allSaved.length?<p className="muted">Tap any verse to highlight and save it.</p>:allSaved.map(v=><div className="saved-scripture" key={v.version+v.reference}><button onClick={()=>{setVersion(v.version);setQuery(v.reference);setReference(v.reference);setShowSaved(false);}}><strong>{v.reference} · {v.version.toUpperCase()}</strong><span>{v.text}</span>{v.note&&<small>{v.note}</small>}</button><button className="icon-btn" aria-label={'Remove '+v.reference} onClick={()=>setSaved(x=>{const n={...x};delete n[v.version+' '+v.reference];return n;})}><Trash2 size={16}/></button></div>)}</aside>}
  <article className="bible-chapter bible-paper"><div className="bible-reader-heading"><div><p className="section-kicker">{version==='kjv'?'KING JAMES VERSION':'WORLD ENGLISH BIBLE'}</p><h2>{data?.reference||reference}</h2></div><div className="bible-type"><button className="icon-btn" aria-label="Smaller font" onClick={()=>setFontSize(n=>Math.max(15,n-2))}><Type size={15}/></button><span>{fontSize}px</span><button className="icon-btn" aria-label="Larger font" onClick={()=>setFontSize(n=>Math.min(32,n+2))}><Type size={23}/></button></div></div>
   <div className="bible-reading-preferences"><span>Line spacing</span><button aria-pressed={spacing===1.65} className={spacing===1.65?'active':''} onClick={()=>setSpacing(1.65)}>Compact</button><button aria-pressed={spacing===1.85} className={spacing===1.85?'active':''} onClick={()=>setSpacing(1.85)}>Comfort</button><button aria-pressed={spacing===2.2} className={spacing===2.2?'active':''} onClick={()=>setSpacing(2.2)}>Wide</button></div>
   {loading&&<p className="muted" role="status">Opening Scripture…</p>}{error&&<div role="alert" className="bible-error"><p>{error}</p><button className="secondary" onClick={()=>setReference(r=>r+' ' .trim())}><RefreshCw size={15}/> Retry</button></div>}
   {data?.verses&&<><div className="bible-verses bible-verse-lines" style={{fontSize,lineHeight:spacing}}>{data.verses.map(v=>{const stored=saved[version+' '+base+':'+v.verse];return <button key={v.verse} className={active===v.verse?'selected':''} style={stored?{backgroundColor:stored.color}:undefined} onClick={()=>highlight(v)}><sup>{v.verse}</sup><span>{v.text.trim()}</span>{stored&&<BookmarkCheck size={14}/>}</button>;})}</div>
   {selected&&<div className="verse-actions"><div className="verse-actions-title"><Highlighter size={17}/><strong>{selectedRef}</strong></div><div className="verse-colours">{colors.map(c=><button key={c} title="Highlight colour" aria-label={'Highlight '+c} aria-pressed={color===c} style={{background:c}} onClick={()=>setColor(c)}/>)}</div><textarea aria-label="Private verse note" rows={2} placeholder="Write a note about this verse (optional)…" value={note} onChange={e=>setNote(e.target.value)}/><div className="verse-actions-buttons"><button className="primary" onClick={saveVerse}><BookmarkPlusIcon/> {selectedSaved?'Update saved verse':'Highlight & save'}</button><button className="secondary" onClick={()=>onAddReflection(selectedRef)}>Reflect</button><button className="secondary" onClick={()=>void navigator.clipboard?.writeText(selectedRef+' — '+selected.text)}><Copy size={16}/> Copy</button><button className="secondary" onClick={()=>void share()}><Share2 size={16}/> Share</button><button className="icon-btn" onClick={()=>setActive(null)}>Done</button></div></div>}
   <p className="tiny muted bible-attribution">Text supplied by bible-api.com · An internet connection is needed. Saved verses are on this device only; not yet synced across devices.</p></>}
  </article>
  <footer className="bible-footer"><button className="secondary" disabled={chapter===1} onClick={()=>loadChapter(book,chapter-1)}><ArrowLeft size={16}/> Previous</button><button className="secondary" disabled={chapter===count} onClick={()=>loadChapter(book,chapter+1)}>Next <ArrowRight size={16}/></button></footer>{message&&<p role="status" className="tiny muted">{message}</p>}
 </div>;
}
function BookmarkPlusIcon(){return <Bookmark size={16}/>;}
