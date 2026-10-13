import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Check, ChevronLeft, FilePlus2, PenLine, Plus, Search, Trash2 } from 'lucide-react';
import { supabase } from './lib/supabase';
type Kind = 'note'|'wardrobe'|'goal';
type Point = {x:number;y:number};
type Stroke = Point[];
type Item = {id:string;user_id:string;kind:Kind;title:string;body:string;details:Record<string,unknown>;updated_at:string};
type Props={session:Session;kind:Kind};
const titleMap={note:'Notes',wardrobe:'My wardrobe',goal:'Vision & goals'};
const getString=(obj:Record<string,unknown>,key:string)=>typeof obj[key]==='string'?obj[key] as string:'';
const getNumber=(obj:Record<string,unknown>,key:string)=>typeof obj[key]==='number'?obj[key] as number:0;
export function LifeStudio({session,kind}:Props){
 const [items,setItems]=useState<Item[]>([]);
 const [selected,setSelected]=useState<string|null>(null);
 const [draft,setDraft]=useState<Item|null>(null);
 const [status,setStatus]=useState('');
 const [busy,setBusy]=useState(false);
 const [query,setQuery]=useState('');
 const [draw,setDraw]=useState(false);
 const [strokes,setStrokes]=useState<Stroke[]>([]);
 const canvas=useRef<HTMLCanvasElement>(null);
 const writing=useRef(false);
 const latest=useRef<Stroke[]>([]);
 useEffect(()=>{
  let mounted=true;setSelected(null);setDraft(null);setQuery('');setStatus('');
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
   context.strokeStyle='#403544';context.lineWidth=2.2;context.lineCap='round';context.lineJoin='round';
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
 },[draw,strokes]);
 function edit(item:Item){setSelected(item.id);setDraft({...item,details:{...item.details}});setStatus('');}
 function create(){
  const item={id:crypto.randomUUID(),user_id:session.user.id,kind,title:'',body:'',details:{},updated_at:new Date().toISOString()};
  setDraft(item);setSelected(item.id);setStatus('');
 }
 function update(patch:Partial<Item>){setDraft(d=>d?{...d,...patch}:d);}
 function detail(key:string,value:unknown){setDraft(d=>d?{...d,details:{...d.details,[key]:value}}:d);}
 async function save(){
  if(!supabase||!draft)return;
  if(!draft.title.trim()){setStatus('Give this item a title before saving.');return;}
  setBusy(true);setStatus('');
  const payload={id:draft.id,user_id:session.user.id,kind,title:draft.title.trim(),body:draft.body,details:{...draft.details,strokes:latest.current},updated_at:new Date().toISOString()};
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
  const next=[...latest.current,[point(ev)]];latest.current=next;setStrokes(next);
 }
 function move(ev:PointerEvent<HTMLCanvasElement>){
  if(!writing.current)return;ev.preventDefault();
  const next=latest.current.map((s,i)=>i===latest.current.length-1?[...s,point(ev)]:s);
  latest.current=next;setStrokes(next);
 }
 function stop(){writing.current=false;}
 const filtered=items.filter(x=>(x.title+' '+x.body).toLowerCase().includes(query.toLowerCase()));
 const d=draft?.details??{};
 return <div className="life-studio">
  <div className="studio-heading"><div><p className="eyebrow">HERLIFE • YOUR PRIVATE SPACE</p><h1>{titleMap[kind]}</h1><p className="muted">{kind==='note'?'Your own notebook. Write, organise and draw freely.':kind==='wardrobe'?'A personal catalogue of the pieces you own and love.':'Give your dreams a direction, a deadline and a plan.'}</p></div><button className="primary" onClick={create}><Plus size={18}/> {kind==='note'?'New note':kind==='wardrobe'?'Add clothing':'New goal'}</button></div>
  <div className="studio-layout">
   <aside className="studio-index"><div className="studio-search"><Search size={17}/><input aria-label="Search items" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search your collection"/></div>
    {filtered.length===0?<p className="empty">{query?'No matching items.':'Nothing here yet. Start with your first entry.'}</p>:filtered.map(item=><button key={item.id} onClick={()=>edit(item)} className={'studio-list-item '+(selected===item.id?'active':'')}><strong>{item.title}</strong><span>{item.body.slice(0,85)|| (kind==='wardrobe'?getString(item.details,'category'):'Tap to open')}</span><small>{new Date(item.updated_at).toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'})}</small></button>)}
   </aside>
   <section className="studio-paper">
   {!draft?<div className="studio-blank"><FilePlus2 size={38}/><h2>Make this space yours.</h2><p>Select something on the left or create something new.</p></div>:<>
    <div className="studio-toolbar"><button className="secondary studio-back" onClick={()=>{setDraft(null);setSelected(null);}}><ChevronLeft size={18}/> All {titleMap[kind].toLowerCase()}</button><div className="studio-toolbar-right">{kind==='note'&&<button className="secondary" onClick={()=>setDraw(v=>!v)}><PenLine size={16}/>{draw?'Type':'Draw'}</button>}<button className="secondary" aria-label="Delete item" onClick={()=>void remove()}><Trash2 size={16}/></button><button className="primary" disabled={busy} onClick={()=>void save()}><Check size={17}/>{busy?'Saving…':'Save'}</button></div></div>
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
    {kind==='note'&&<div className="note-format">A generous writing surface for keyboard, touch and stylus. Use Draw for pen strokes.</div>}
    <textarea className={'studio-body '+(kind==='note'?'note-page':'')} value={draft.body} onChange={e=>update({body:e.target.value})} placeholder={kind==='note'?'Begin writing…':kind==='wardrobe'?'Fit, styling ideas, outfit combinations, notes…':'Why this matters, next steps, milestones and what success looks like…'} aria-label={kind==='note'?'Note body':'Details'} />
    {kind==='note'&&draw&&<div className="drawing-section"><div className="drawing-tools"><strong>Handwriting canvas</strong><button className="secondary" onClick={()=>{latest.current=[];setStrokes([]);}}>Clear ink</button></div><canvas className="note-canvas" ref={canvas} onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} aria-label="Freehand writing canvas for stylus or finger"/></div>}
    <div className="studio-status" role="status">{status||'Your changes are saved only when you tap Save.'}</div>
   </>}
   </section>
  </div>
 </div>;
}
