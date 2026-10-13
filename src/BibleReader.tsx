import { useEffect, useState, type FormEvent } from 'react';
import { BookOpen, ArrowLeft, ArrowRight, Search, RefreshCw, BookmarkPlus, Type } from 'lucide-react';

const BOOKS = [
  ['Genesis',50],['Exodus',40],['Leviticus',27],['Numbers',36],['Deuteronomy',34],['Joshua',24],['Judges',21],['Ruth',4],['1 Samuel',31],['2 Samuel',24],['1 Kings',22],['2 Kings',25],['1 Chronicles',29],['2 Chronicles',36],['Ezra',10],['Nehemiah',13],['Esther',10],['Job',42],['Psalms',150],['Proverbs',31],['Ecclesiastes',12],['Song of Solomon',8],['Isaiah',66],['Jeremiah',52],['Lamentations',5],['Ezekiel',48],['Daniel',12],['Hosea',14],['Joel',3],['Amos',9],['Obadiah',1],['Jonah',4],['Micah',7],['Nahum',3],['Habakkuk',3],['Zephaniah',3],['Haggai',2],['Zechariah',14],['Malachi',4],
  ['Matthew',28],['Mark',16],['Luke',24],['John',21],['Acts',28],['Romans',16],['1 Corinthians',16],['2 Corinthians',13],['Galatians',6],['Ephesians',6],['Philippians',4],['Colossians',4],['1 Thessalonians',5],['2 Thessalonians',3],['1 Timothy',6],['2 Timothy',4],['Titus',3],['Philemon',1],['Hebrews',13],['James',5],['1 Peter',5],['2 Peter',3],['1 John',5],['2 John',1],['3 John',1],['Jude',1],['Revelation',22],
] as const;
type Verse = { verse: number; text: string };
type Response = { reference?:string; translation_name?:string; verses?:Verse[]; error?:string };
type Props = { onAddReflection: (reference:string)=>void; initialReference?:string };
export function BibleReader({onAddReflection,initialReference='Psalm 23'}:Props) {
  const [version,setVersion] = useState<'kjv'|'web'>('kjv');
  const [book,setBook] = useState('Psalms');
  const [chapter,setChapter] = useState(23);
  const [query,setQuery] = useState(initialReference);
  const [reference,setReference] = useState(initialReference);
  const [data,setData] = useState<Response|null>(null);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  const [fontSize,setFontSize] = useState(17);
  const count = BOOKS.find(([name])=>name===book)?.[1] ?? 1;

  useEffect(()=>{
    const controller=new AbortController();
    setLoading(true);setError('');setData(null);
    const url='https://bible-api.com/'+encodeURIComponent(reference)+'?translation='+version;
    fetch(url,{signal:controller.signal}).then(async response=>{
      if(!response.ok) throw new Error('This passage could not be found.');
      const body=await response.json() as Response;
      if(!body.verses?.length) throw new Error(body.error||'No verses were returned.');
      setData(body);
    }).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Unable to load the Bible right now.');})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[reference,version]);
  function loadChapter(nextBook=book,nextChapter=chapter){
    const max=BOOKS.find(([name])=>name===nextBook)?.[1]??1;
    const chapterNumber=Math.min(Math.max(1,nextChapter),max);
    setBook(nextBook);setChapter(chapterNumber);
    const next=nextBook+' '+chapterNumber;
    setQuery(next);setReference(next);
  }
  function search(ev:FormEvent){
    ev.preventDefault();const term=query.trim();
    if(!term)return;
    setReference(term);
    const match=BOOKS.find(([name])=>term.toLowerCase().startsWith(name.toLowerCase()+' '));
    if(match){const n=Number(term.slice(match[0].length).trim().split(':')[0]);if(Number.isInteger(n)&&n>=1&&n<=match[1]){setBook(match[0]);setChapter(n);}}
  }
  return <div className="bible-reader">
    <header className="bible-topline"><div className="eyebrow"><BookOpen size={16}/> HERLIFE SCRIPTURE READER</div><span className="bible-translation">Choose your translation</span></header>
    <div className="bible-version"><div><label htmlFor="translation-select">Bible translation</label><select id="translation-select" value={version} onChange={e=>setVersion(e.target.value as 'kjv'|'web')}><option value="kjv">KJV — King James Version</option><option value="web">WEB — World English Bible</option></select></div><p>NKJV and NIV require publisher-authorised access. <a href="https://www.biblegateway.com/versions/New-King-James-Version-NKJV-Bible/" target="_blank" rel="noopener noreferrer">Read NKJV</a> · <a href="https://www.biblegateway.com/versions/New-International-Version-NIV-Bible/" target="_blank" rel="noopener noreferrer">Read NIV</a></p></div><div className="bible-tools">
      <label>Book<select value={book} onChange={e=>loadChapter(e.target.value,1)}>{BOOKS.map(([name])=><option key={name}>{name}</option>)}</select></label>
      <label>Chapter<select value={chapter} onChange={e=>loadChapter(book,Number(e.target.value))}>{Array.from({length:count},(_,i)=><option value={i+1} key={i}>{i+1}</option>)}</select></label>
      <form className="bible-search" onSubmit={search}><label htmlFor="bible-search-input">Search by reference</label><div><input id="bible-search-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Romans 8:28-39"/><button type="submit" className="primary" aria-label="Find passage"><Search size={18}/><span>Read</span></button></div></form>
    </div>
    <div className="bible-chapter card">
      <div className="bible-reader-heading"><div><p className="section-kicker">THE WORD</p><h2>{data?.reference||reference}</h2></div><div className="bible-type"><button className="icon-btn" disabled={fontSize<=15} onClick={()=>setFontSize(n=>Math.max(15,n-2))} aria-label="Decrease text size"><Type size={15}/></button><button className="icon-btn" disabled={fontSize>=25} onClick={()=>setFontSize(n=>Math.min(25,n+2))} aria-label="Increase text size"><Type size={21}/></button></div></div>
      {loading&&<p className="muted" role="status">Opening scripture…</p>}
      {error&&<div className="bible-error" role="alert"><p>{error}</p><button className="secondary" onClick={()=>setReference(query.trim()||reference)}><RefreshCw size={15}/> Try again</button></div>}
      {data?.verses&&<><div className="bible-verses" style={{fontSize}}>{data.verses.map((v,i)=><span key={i}><sup>{v.verse}</sup>{v.text.trim()} </span>)}</div><p className="tiny muted bible-attribution">Scripture: {data.translation_name||'World English Bible'} · delivered by bible-api.com. Internet connection required.</p><button className="secondary" onClick={()=>onAddReflection(data.reference||reference)}><BookmarkPlus size={17}/> Reflect on this passage</button></>}
    </div>
    <footer className="bible-footer"><button className="secondary" onClick={()=>loadChapter(book,chapter-1)} disabled={chapter===1}><ArrowLeft size={17}/> Previous chapter</button><button className="secondary" onClick={()=>loadChapter(book,chapter+1)} disabled={chapter===count}>Next chapter <ArrowRight size={17}/></button></footer>
  </div>;
}
