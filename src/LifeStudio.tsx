import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Check, ChevronLeft, FilePlus2, PenLine, Plus, Search, Trash2, Undo2, Highlighter, Eraser, Pin, ListTodo, Heading, ImagePlus, X } from 'lucide-react';
import { supabase } from './lib/supabase';
type Kind = 'note'|'wardrobe'|'goal'|'journal';
type Point = {x:number;y:number};
type Stroke = Point[];
type Item = {id:string;user_id:string;kind:Kind;title:string;body:string;details:Record<string,unknown>;updated_at:string};
type Props={session:Session;kind:Kind};
const titleMap={note:'Notes',wardrobe:'My wardrobe',goal:'Vision & goals',journal:'Journal'};
const getString=(obj:Record<string,unknown>,key:string)=>typeof obj[key]==='string'?obj[key] as string:'';
const getNumber=(obj:Record<string,unknown>,key:string)=>typeof obj[key]==='number'?obj[key] as number:0;
export function LifeStudio({session,kind}:Props){
 const [items,setItems]=useState<Item[]>([]);
 const [selected,setSelected]=useState<string|null>(null);
 const [draft,setDraft]=useState<Item|null>(null);
 const [status,setStatus]=useState('');
 const [busy,setBusy]=useState(false);
 const [uploading,setUploading]=useState(false);
 const [mediaUrls,setMediaUrls]=useState<Record<string,string>>({});
 const [query,setQuery]=useState('');
 const [draw,setDraw]=useState(false);
 const [strokes,setStrokes]=useState<Stroke[]>([]);
 const [inkMode,setInkMode]=useState<'pen'|'highlighter'|'eraser'>('pen');
 const [inkColor,setInkColor]=useState('#403544');
 const [folder,setFolder]=useState('All');
 const [editVersion,setEditVersion]=useState(0);
 const draftRef=useRef<Item|null>(null);
 const saveSequence=useRef(0);
 const canvas=useRef<HTMLCanvasElement>(null);
 const writing=useRef(false);
 const latest=useRef<Stroke[]>([]);
 useEffect(()=>{
  let mounted=true;setSelected(null);setDraft(null);setQuery('');setFolder('All');setStatus('');
  if(!supabase)return;
  supabase.from('life_items').select('*').eq('user_id',session.user.id).eq('kind',kind).order('updated_at',{ascending:false}).then(({data,error})=>{
   if(!mounted)return;
   if(error)setStatus('Could not load your saved items.');
   else setItems((data??[]) as Item[]);
  });
  return ()=>{mounted=false;};
 },[kind,session.user.id]);
 useEffect(()=>{
  const raw=draft?.details.strokes;
  const saved=Array.isArray(raw)?raw as Stroke[]:[];
  setStrokes(saved);latest.current=saved;
  setDraw(false);
 },[draft?.id]);
 useEffect(()=>{
  const node=canvas.current;if(!node||!draw)return;
  const context=node.getContext('2d');if(!context)return;
  const render=()=>{
   const bounds=node.getBoundingClientRect();
   const ratio=window.devicePixelRatio||1;
   node.width=Math.floor(bounds.width*ratio);node.height=Math.floor(bounds.height*ratio);
   context.setTransform(ratio,0,0,ratio,0,0);
   context.clearRect(0,0,bounds.width,bounds.height);
   context.strokeStyle=inkColor;context.lineWidth=inkMode==='highlighter'?8:2.2;context.lineCap='round';context.lineJoin='round';
   for(const stroke of latest.current){
    if(!stroke.length)continue;
    context.beginPath();
    context.moveTo(stroke[0].x*bounds.width,stroke[0].y*bounds.height);
    if(stroke.length===1)context.lineTo(stroke[0].x*bounds.width+.1,stroke[0].y*bounds.height+.1);
    for(const p of stroke.slice(1))context.lineTo(p.x*bounds.width,p.y*bounds.height);
    context.stroke();
   }
  };
  render();const obs=new ResizeObserver(render);obs.observe(node);return ()=>obs.disconnect();
 },[draw,strokes,inkColor,inkMode]);
 useEffect(()=>{draftRef.current=draft;},[draft]);
 useEffect(()=>{
  if(!editVersion||!supabase)return;
  const client=supabase;
  const sequence=++saveSequence.current;
  const clock=window.setTimeout(async()=>{
   const current=draftRef.current;if(!current)return;
   const payload={id:current.id,user_id:session.user.id,kind,title:current.title.trim()||'Untitled',body:current.body,details:{...current.details,strokes:latest.current},updated_at:new Date().toISOString()};
   setStatus('Saving…');
   const {data,error}=await client.from('life_items').upsert(payload,{onConflict:'id'}).select('*').single();
   if(sequence!==saveSequence.current)return;
   if(error){setStatus('Autosave failed; tap Save to retry.');return;}
   setItems(previous=>[data as Item,...previous.filter(item=>item.id!==current.id)]);
   setStatus('Saved automatically.');
  },1100);
  return()=>window.clearTimeout(clock);
 },[editVersion,session.user.id,kind]);
 useEffect(()=>{let alive=true;const attachments=Array.isArray(draft?.details.attachments)?draft.details.attachments.filter((x):x is string=>typeof x==='string'):[];if(!supabase||!attachments.length){setMediaUrls({});return;}Promise.all(attachments.map(async path=>{const {data}=await supabase!.storage.from('herlife-private-memories').createSignedUrl(path,3600);return [path,data?.signedUrl||''] as const;})).then(pairs=>{if(alive)setMediaUrls(Object.fromEntries(pairs));});return()=>{alive=false;};},[draft?.id,JSON.stringify(draft?.details.attachments)]);
 async function uploadPhotos(files:FileList|null){if(!files?.length||!supabase||!draft)return;setUploading(true);const paths:string[]=[];for(const file of Array.from(files).slice(0,8)){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){setStatus('Use JPG, PNG or WebP pictures up to 10 MB each.');continue;}const path=session.user.id+'/notes/'+draft.id+'/'+crypto.randomUUID()+'.'+(file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg');const {error}=await supabase.storage.from('herlife-private-memories').upload(path,file,{contentType:file.type,upsert:false});if(error)setStatus(error.message);else paths.push(path);}if(paths.length)detail('attachments',[...(Array.isArray(draft.details.attachments)?draft.details.attachments:[]),...paths]);setUploading(false);}
 async function removePhoto(path:string){if(!supabase||!draft)return;const {error}=await supabase.storage.from('herlife-private-memories').remove([path]);if(error){setStatus(error.message);return;}detail('attachments',(Array.isArray(draft.details.attachments)?draft.details.attachments:[]).filter(x=>x!==path));}
 function edit(item:Item){setSelected(item.id);setDraft({...item,details:{...item.details}});setStatus('');}
 function create(){
  const item={id:crypto.randomUUID(),user_id:session.user.id,kind,title:'',body:'',details:{},updated_at:new Date().toISOString()};
  setDraft(item);setSelected(item.id);setStatus('');
 }
 function update(patch:Partial<Item>){setDraft(d=>d?{...d,...patch}:d);setEditVersion(v=>v+1);}
 function detail(key:string,value:unknown){setDraft(d=>d?{...d,details:{...d.details,[key]:value}}:d);setEditVersion(v=>v+1);}
 async function save(){
  if(!supabase||!draft)return;
  saveSequence.current++;
  setBusy(true);setStatus('');
  const payload={id:draft.id,user_id:session.user.id,kind,title:draft.title.trim()||'Untitled',body:draft.body,details:{...draft.details,strokes:latest.current},updated_at:new Date().toISOString()};
  const {data,error}=await supabase.from('life_items').upsert(payload,{onConflict:'id'}).select('*').single();
  setBusy(false);
  if(error){setStatus(error.message);return;}
  const saved=data as Item;setItems(curr=>[saved,...curr.filter(x=>x.id!==saved.id)]);setDraft(saved);setStatus('Saved to your private space.');
 }
 async function remove(){
  if(!supabase||!draft||!window.confirm('Delete this item permanently?'))return;
  if(items.some(x=>x.id===draft.id)){
   const {error}=await supabase.from('life_items').delete().eq('id',draft.id).eq('user_id',session.user.id);
   if(error){setStatus(error.message);return;}
  }
  setItems(curr=>curr.filter(x=>x.id!==draft.id));setSelected(null);setDraft(null);setStatus('');
 }
 function point(ev:PointerEvent<HTMLCanvasElement>):Point{
  const box=ev.currentTarget.getBoundingClientRect();
  return {x:Math.max(0,Math.min(1,(ev.clientX-box.left)/box.width)),y:Math.max(0,Math.min(1,(ev.clientY-box.top)/box.height))};
 }
 function start(ev:PointerEvent<HTMLCanvasElement>){
  ev.preventDefault();ev.currentTarget.setPointerCapture(ev.pointerId);writing.current=true;
  if(inkMode==='eraser'){const next=latest.current.slice(0,-1);latest.current=next;setStrokes(next);return;}
  const next=[...latest.current,[point(ev)]];latest.current=next;setStrokes(next);setEditVersion(v=>v+1);
 }
 function move(ev:PointerEvent<HTMLCanvasElement>){
  if(!writing.current)return;ev.preventDefault();
  const next=latest.current.map((s,i)=>i===latest.current.length-1?[...s,point(ev)]:s);
  latest.current=next;setStrokes(next);
 }
 function stop(){writing.current=false;setEditVersion(v=>v+1);}
 const folders=['All',...Array.from(new Set(items.map(x=>getString(x.details,'folder')).filter(Boolean)))];
 const filtered=items.filter(x=>(folder==='All'||getString(x.details,'folder')===folder)&&(x.title+' '+x.body).toLowerCase().includes(query.toLowerCase())).sort((a,b)=>Number(Boolean(b.details.pinned))-Number(Boolean(a.details.pinned))||b.updated_at.localeCompare(a.updated_at));
 const d=draft?.details??{};
 return <div className="life-studio">
  <div className="studio-heading"><div><p className="eyebrow">HERLIFE • YOUR PRIVATE SPACE</p><h1>{titleMap[kind]}</h1><p className="muted">{kind==='note'?'Write, organise and draw freely.':kind==='journal'?'A quiet page for your thoughts.':kind==='wardrobe'?'A personal catalogue of the pieces you own and love.':'Give your dreams a direction, a deadline and a plan.'}</p></div><button className="primary" onClick={create}><Plus size={18}/> {kind==='note'?'New note':kind==='journal'?'New entry':kind==='wardrobe'?'Add clothing':'New goal'}</button></div>
  <div className={"studio-layout "+(draft?"studio-editing":"studio-browsing")}>
   <aside className="studio-index"><div className="studio-search"><Search size={17}/><input aria-label="Search items" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search your collection"/></div>
    {(kind==='note'||kind==='journal')&&<div className="studio-folders">{folders.map(name=><button className={folder===name?'active':''} key={name} onClick={()=>setFolder(name)}>{name}</button>)}</div>}
    {filtered.length===0?<p className="empty">{query?'No matching items.':'Nothing here yet. Start with your first entry.'}</p>:filtered.map(item=><button key={item.id} onClick={()=>edit(item)} className={'studio-list-item '+(selected===item.id?'active':'')}><strong>{item.details.pinned?'📌 ':''}{item.title}</strong><span>{item.body.slice(0,85)|| (kind==='wardrobe'?getString(item.details,'category'):'Tap to open')}</span><small>{new Date(item.updated_at).toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'})}</small></button>)}
   </aside>
   <section className="studio-paper">
   {!draft?<div className="studio-blank"><FilePlus2 size={38}/><h2>Make this space yours.</h2><p>Select something on the left or create something new.</p></div>:<>
    <div className="studio-toolbar"><button className="secondary studio-back" onClick={()=>{setDraft(null);setSelected(null);}}><ChevronLeft size={18}/> All {titleMap[kind].toLowerCase()}</button><div className="studio-toolbar-right">{(kind==='note'||kind==='journal')&&<button className="secondary" onClick={()=>setDraw(v=>!v)}><PenLine size={16}/>{draw?'Type':'Draw'}</button>}<button className="secondary" aria-label="Delete item" onClick={()=>void remove()}><Trash2 size={16}/></button><button className="primary" disabled={busy} onClick={()=>void save()}><Check size={17}/>{busy?'Saving…':'Save'}</button></div></div>
    <input className="studio-title" aria-label="Title" value={draft.title} onChange={e=>update({title:e.target.value})} maxLength={180} placeholder={kind==='note'?'Untitled note':kind==='wardrobe'?'Clothing item': 'Name your goal'}/>
    {kind==='wardrobe'&&<div className="studio-fields">
     <label>Category<input value={getString(d,'category')} placeholder="Dress, shoes, jacket…" onChange={e=>detail('category',e.target.value)}/></label>
     <label>Colour<input value={getString(d,'colour')} placeholder="Colour" onChange={e=>detail('colour',e.target.value)}/></label>
     <label>Season<select value={getString(d,'season')} onChange={e=>detail('season',e.target.value)}><option value="">Any season</option><option>Summer</option><option>Winter</option><option>Spring</option><option>Autumn</option></select></label>
     <label>Occasion<input value={getString(d,'occasion')} placeholder="Church, work, everyday…" onChange={e=>detail('occasion',e.target.value)}/></label>
     <label>Brand<input value={getString(d,'brand')} placeholder="Optional" onChange={e=>detail('brand',e.target.value)}/></label>
     <label>Estimated value (ZAR)<input type="number" min="0" step=".01" value={getString(d,'cost')||String(getNumber(d,'cost')||'')} onChange={e=>detail('cost',e.target.value)}/></label>
    </div>}
    {kind==='goal'&&<><div className="studio-fields">
     <label>Area<select value={getString(d,'area')} onChange={e=>detail('area',e.target.value)}><option value="">Choose an area</option>{['Faith','Education','Career','Financial','Relationships','Health','Personal growth','Other'].map(x=><option key={x}>{x}</option>)}</select></label>
     <label>Target date<input type="date" value={getString(d,'targetDate')} onChange={e=>detail('targetDate',e.target.value)}/></label>
     <label>Progress: {getNumber(d,'progress')}%<input type="range" min="0" max="100" step="5" value={getNumber(d,'progress')} onChange={e=>detail('progress',Number(e.target.value))}/></label>
     <label>Status<select value={getString(d,'status')||'Planning'} onChange={e=>detail('status',e.target.value)}>{['Planning','In progress','Paused','Completed'].map(x=><option key={x}>{x}</option>)}</select></label>
    </div><h3>Steps and milestones</h3></>}
    {(kind==='note'||kind==='journal')&&<div className="writing-actions"><button className="secondary" onClick={()=>detail('pinned',!d.pinned)}><Pin size={15}/>{d.pinned?'Unpin':'Pin'}</button><label>Folder<input placeholder="Personal" value={getString(d,'folder')} onChange={e=>detail('folder',e.target.value)} maxLength={60}/></label><button className="secondary" onClick={()=>update({body:draft.body+(draft.body?'\n':'')+'☐ '})}><ListTodo size={15}/> Checklist</button><button className="secondary" onClick={()=>update({body:draft.body+(draft.body?'\n':'')+'## '})}><Heading size={15}/> Heading</button></div>}
    {(kind==='note'||kind==='journal')&&<><div className="note-media-toolbar"><label className="secondary note-add-photo"><ImagePlus size={16}/>{uploading?'Uploading…':'Add photo'}<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading} onChange={e=>{void uploadPhotos(e.target.files);e.target.value='';}}/></label><span className="tiny muted">Private images · max 10 MB each</span></div>{Array.isArray(d.attachments)&&d.attachments.length>0&&<div className="note-photo-grid">{d.attachments.filter((x):x is string=>typeof x==='string').map(path=><div key={path} className="note-photo">{mediaUrls[path]?<img src={mediaUrls[path]} alt="Attached photograph"/>:<span>Loading photo…</span>}<button type="button" aria-label="Remove photo" onClick={()=>void removePhoto(path)}><X size={15}/></button></div>)}</div>}</>}
    {(kind==='note'||kind==='journal')&&<div className="note-format">Write freely. Choose Draw for Apple Pencil or touch handwriting.</div>}
    <textarea className={'studio-body '+((kind==='note'||kind==='journal')?'note-page':'')} value={draft.body} onChange={e=>update({body:e.target.value})} placeholder={(kind==='note'||kind==='journal')?'Begin writing…':kind==='wardrobe'?'Fit, styling ideas, outfit combinations, notes…':'Why this matters, next steps, milestones and what success looks like…'} aria-label={(kind==='note'||kind==='journal')?'Writing body':'Details'} />
    {(kind==='note'||kind==='journal')&&draw&&<div className="drawing-section"><div className="drawing-tools"><strong>Handwriting</strong><div className="ink-actions"><button className="icon-btn" title="Pen" aria-label="Pen" aria-pressed={inkMode==='pen'} onClick={()=>setInkMode('pen')}><PenLine size={17}/></button><button className="icon-btn" title="Highlighter" aria-label="Highlighter" aria-pressed={inkMode==='highlighter'} onClick={()=>setInkMode('highlighter')}><Highlighter size={17}/></button><button className="icon-btn" title="Erase last stroke" aria-label="Erase last stroke" onClick={()=>{latest.current=latest.current.slice(0,-1);setStrokes(latest.current);}}><Eraser size={17}/></button><button className="icon-btn" title="Undo" aria-label="Undo" onClick={()=>{latest.current=latest.current.slice(0,-1);setStrokes(latest.current);}}><Undo2 size={17}/></button><input type="color" aria-label="Ink colour" value={inkColor} onChange={e=>setInkColor(e.target.value)}/></div></div><canvas className="note-canvas" ref={canvas} onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} aria-label="Freehand writing canvas for stylus or finger"/></div>}
    <div className="studio-status" role="status">{status||'Changes save automatically while you write.'}</div>
   </>}
   </section>
  </div>
 </div>;
}
