import {useCallback,useEffect,useRef,useState,type ChangeEvent} from 'react';
import type {Session} from '@supabase/supabase-js';
import {ArrowLeft,Bookmark,Check,CheckSquare,Folder,Grid2X2,Highlighter,ImagePlus,LayoutList,Menu,MoreVertical,PenLine,Plus,Search,Star,Trash2,Type,Undo2,Redo2,X,FileText,Download,Users} from 'lucide-react';
import {supabase} from './lib/supabase';
import {RichNoteEditor} from './RichNoteEditor';
import {ShareDialog} from './ShareDialog';

type Kind='note'|'journal';
type Item={id:string;user_id:string;kind:Kind;title:string;body:string;details:Record<string,unknown>;updated_at:string};
const get=(d:Record<string,unknown>,k:string)=>typeof d[k]==='string'?d[k] as string:'';
const paths=(d:Record<string,unknown>)=>Array.isArray(d.attachments)?d.attachments.filter((x):x is string=>typeof x==='string'):[];
const stamp=(d:string)=>new Date(d).toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'});
const friendly=(kind:Kind)=>kind==='note'?'Notes':'Journal';
const fresh=(uid:string,kind:Kind):Item=>({id:crypto.randomUUID(),user_id:uid,kind,title:'',body:'',details:{folder:'Personal'},updated_at:new Date().toISOString()});
export function NotesStudio({session,kind}:{session:Session;kind:Kind}){
 const [items,setItems]=useState<Item[]>([]),[draft,setDraft]=useState<Item|null>(null),[active,setActive]=useState<'All notes'|'Favourites'|'Recycle bin'|'Folder'>('All notes');
 const [folder,setFolder]=useState('Personal'),[drawer,setDrawer]=useState(false),[search,setSearch]=useState(''),[searchOpen,setSearchOpen]=useState(false),[grid,setGrid]=useState(true);
 const [extraFolders,setExtraFolders]=useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem('herlife-folders-'+session.user.id+'-'+kind)||'[]') as string[];}catch{return [];}});
 const [menu,setMenu]=useState(false),[editingMenu,setEditingMenu]=useState(false),[sort,setSort]=useState<'recent'|'title'|'oldest'>('recent'),[message,setMessage]=useState(''),[saving,setSaving]=useState(false);
 const [sharing,setSharing]=useState(false),[permissions,setPermissions]=useState<Record<string,'view'|'edit'>>({}),[conflict,setConflict]=useState(false);
 const revision=useRef<{id:string;at:string}|null>(null),inFlight=useRef(0);
 const [attachments,setAttachments]=useState<Record<string,string>>({}),[uploading,setUploading]=useState(false),[preview,setPreview]=useState(false),[font,setFont]=useState(17);
 const [undo,setUndo]=useState<string[]>([]),[redo,setRedo]=useState<string[]>([]);
 const textRef=useRef<HTMLTextAreaElement>(null),draftRef=useRef<Item|null>(null),pending=useRef(0),writeChain=useRef<Promise<unknown>>(Promise.resolve());
 const currentKey=session.user.id+'-'+kind;
 useEffect(()=>{let live=true;setDraft(null);setDrawer(false);setActive('All notes');setMessage('');setSearch('');setItems([]);
  void (async()=>{if(!supabase)return;const [{data:owned,error},{data:shares}]=await Promise.all([supabase.from('life_items').select('*').eq('kind',kind).eq('user_id',session.user.id).order('updated_at',{ascending:false}),supabase.from('note_shares').select('note_id,access').eq('collaborator_id',session.user.id)]);const shareRows=(shares||[]) as {note_id:string;access:'view'|'edit'}[];const ids=shareRows.map(x=>x.note_id);const shared=ids.length?await supabase.from('life_items').select('*').eq('kind',kind).in('id',ids):{data:[],error:null};if(!live)return;setPermissions(Object.fromEntries(shareRows.map(x=>[x.note_id,x.access])));if(error||shared.error)setMessage('Could not load all your notes.');setItems([...(owned||[]),...(shared.data||[])].filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i) as Item[]);})();
  return()=>{live=false;};},[currentKey,kind,session.user.id]);
 useEffect(()=>{draftRef.current=draft;},[draft]);
 const persist=useCallback((item:Item)=>{
  if(!supabase)return Promise.resolve(false);
  if(conflict){setMessage('Resolve the edit conflict before saving.');return Promise.resolve(false);}
  const token=++pending.current;setSaving(true);
  const snapshot={...item,title:item.title.trim()||'Untitled',updated_at:new Date().toISOString()};
  const send=async()=>{
   inFlight.current++;
   let result:{data:unknown;error:{message:string}|null};
   const prior=revision.current?.id===item.id?revision.current:null;
   if(prior){result=await supabase!.rpc('save_collaborative_note',{p_note:item.id,p_title:snapshot.title,p_body:item.body,p_details:item.details,p_expected_at:prior.at});}
   else if(item.user_id===session.user.id){result=await supabase!.from('life_items').upsert(snapshot,{onConflict:'id'}).select('*').single();}
   else{setMessage('You cannot create a note for another account.');setSaving(false);return false;}
   inFlight.current=Math.max(0,inFlight.current-1);
   const {data,error}=result;
   if(error){if(token===pending.current){setSaving(false);setMessage(error.message);if(error.message.includes('EDIT_CONFLICT'))setConflict(true);}return false;}
   const saved=data as Item;revision.current={id:item.id,at:saved.updated_at};
   setItems(old=>[saved,...old.filter(x=>x.id!==item.id)]);
   if(token===pending.current){setSaving(false);setMessage('All changes saved');}
   return true;
  };
  writeChain.current=writeChain.current.then(send,send);return writeChain.current as Promise<boolean>;
 },[conflict,session.user.id]);
 useEffect(()=>{if(!draft||conflict||permissions[draft.id]==='view')return;const current= draft;const timeout=window.setTimeout(()=>{void persist(current);},850);return()=>clearTimeout(timeout);},[draft,persist]);
 useEffect(()=>{let live=true;const d=draft;const files=d?paths(d.details):[];if(!files.length){setAttachments({});return;}
  void Promise.all(files.map(async p=>{const {data}=await supabase!.storage.from('herlife-private-memories').createSignedUrl(p,3600);return [p,data?.signedUrl||''] as const;})).then(x=>{if(live)setAttachments(Object.fromEntries(x));});
  return()=>{live=false;};},[draft?.id,JSON.stringify(draft?.details.attachments)]);
 useEffect(()=>{if(!draft?.id||!supabase)return;const noteId=draft.id;const client=supabase;
  const channel=client.channel('notes-watch-'+noteId).on('postgres_changes',{event:'UPDATE',schema:'public',table:'life_items',filter:'id=eq.'+noteId},payload=>{
   const row=payload.new as Item;if(inFlight.current||row.id!==noteId)return;
   if(revision.current?.id===noteId&&revision.current.at!==row.updated_at){setConflict(true);setMessage('This document was changed by another editor. Reload or keep a local copy to protect your work.');}
  }).subscribe();
  return()=>{void client.removeChannel(channel);};
 },[draft?.id]);
 function patch(edit:(d:Item)=>Item){setDraft(old=>old?edit(old):old);}
 function changeBody(v:string){if(draft){setUndo(a=>[...a.slice(-34),draft.body]);setRedo([]);}patch(d=>({...d,body:v,details:{...d.details,richHtml:''}}));}
 async function back(){if(draft&&!conflict&&permissions[draft.id]!=='view'){const current=draft;setDraft(null);await persist(current);}else setDraft(null);setPreview(false);setEditingMenu(false);}
 function edit(item:Item){revision.current={id:item.id,at:item.updated_at};setConflict(false);setSharing(false);setDraft({...item,details:{...item.details}});setUndo([]);setRedo([]);setPreview(false);setDrawer(false);setMessage('');}
 function create(){const item=fresh(session.user.id,kind);revision.current=null;setConflict(false);setDraft(item);setMessage('');setUndo([]);setRedo([]);setPreview(false);setDrawer(false);}
 async function dispose(){if(!draft||draft.user_id!==session.user.id)return;const item={...draft,details:{...draft.details,deletedAt:new Date().toISOString()}};const ok=await persist(item);if(ok){setDraft(null);setActive('All notes');}}
 async function restore(item:Item){const details={...item.details};delete details.deletedAt;await persist({...item,details});}
 async function permanent(item:Item){if(!window.confirm('Permanently delete this entry? This cannot be undone.'))return;await writeChain.current;const {error}=await supabase!.from('life_items').delete().eq('id',item.id).eq('user_id',session.user.id);if(error){setMessage(error.message);return;}setItems(x=>x.filter(y=>y.id!==item.id));}
 function format(before:string,after='',placeholder='text'){const el=textRef.current;if(!el||!draft)return;const a=el.selectionStart,b=el.selectionEnd;const selected=draft.body.slice(a,b)||placeholder;const body=draft.body.slice(0,a)+before+selected+after+draft.body.slice(b);changeBody(body);requestAnimationFrame(()=>{el.focus();el.setSelectionRange(a+before.length,a+before.length+selected.length);});}
 function history(backwards:boolean){if(!draft)return;const stack=backwards?undo:redo;const value=stack[stack.length-1];if(value===undefined)return;if(backwards){setUndo(x=>x.slice(0,-1));setRedo(x=>[...x,draft.body]);}else{setRedo(x=>x.slice(0,-1));setUndo(x=>[...x,draft.body]);}patch(x=>({...x,body:value}));}
 async function addPhoto(e:ChangeEvent<HTMLInputElement>){const files=Array.from(e.target.files||[]).slice(0,8);e.target.value='';if(!draft||!files.length||!supabase)return;const id=draft.id;setUploading(true);const uploaded:string[]=[];
  for(const file of files){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){setMessage('Only JPG, PNG or WebP images up to 10 MB are supported.');continue;}const path=session.user.id+'/notes/'+id+'/'+crypto.randomUUID()+(file.type==='image/png'?'.png':file.type==='image/webp'?'.webp':'.jpg');const {error}=await supabase.storage.from('herlife-private-memories').upload(path,file,{contentType:file.type});if(error)setMessage('Upload failed: '+error.message);else uploaded.push(path);}
  if(uploaded.length)patch(d=>({...d,details:{...d.details,attachments:[...paths(d.details),...uploaded]}}));setUploading(false);
 }
 async function removePhoto(path:string){if(!supabase)return;const {error}=await supabase.storage.from('herlife-private-memories').remove([path]);if(error){setMessage(error.message);return;}patch(d=>({...d,details:{...d.details,attachments:paths(d.details).filter(p=>p!==path)}}));}
 function exportText(){if(!draft)return;const blob=new Blob([draft.title+'\n\n'+draft.body],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(draft.title.trim()||'HerLife note').replace(/[^a-z0-9 _-]/gi,'').slice(0,60)+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 const live=items.filter(x=>!get(x.details,'deletedAt')),trashed=items.filter(x=>get(x.details,'deletedAt'));
 const visible=(active==='Recycle bin'?trashed:live.filter(x=>active==='Favourites'?x.details.pinned===true:active==='Folder'?get(x.details,'folder')===folder:true)).filter(x=>(x.title+' '+x.body).toLowerCase().includes(search.toLowerCase())).sort((a,b)=>sort==='title'?a.title.localeCompare(b.title):sort==='oldest'?a.updated_at.localeCompare(b.updated_at):Number(Boolean(b.details.pinned))-Number(Boolean(a.details.pinned))||b.updated_at.localeCompare(a.updated_at));
 const folders=[...new Set(['Personal',...extraFolders,...live.map(x=>get(x.details,'folder')).filter(Boolean)])];
 const caption=active==='Folder'?folder:active;const isWriting=Boolean(draft);const canEdit=draft?draft.user_id===session.user.id||permissions[draft.id]==='edit':true;
 return <section className={'real-notes '+(isWriting?'real-notes-writing':'real-notes-collection')} aria-label={friendly(kind)+' workspace'}>
 {isWriting&&draft?<>
  <div className="rn-editor-bar"><button aria-label="Return to notes" onClick={()=>void back()}><ArrowLeft size={24}/></button><span className="rn-editor-label">{kind==='journal'?'Journal entry':'Note'}</span><span className="rn-grow"/><button aria-label={draft.details.pinned?'Remove favourite':'Add favourite'} onClick={()=>patch(d=>({...d,details:{...d.details,pinned:!d.details.pinned}}))}><Star size={21} fill={draft.details.pinned?'currentColor':'none'}/></button><button aria-label="Add photo" disabled={!canEdit} onClick={()=>document.getElementById('rn-photo-upload')?.click()}><Plus size={24}/></button><button aria-label="Share note" onClick={async()=>{if(draft&&!revision.current){const ok=await persist(draft);if(!ok)return;}setSharing(true);}}><Users size={21}/></button><button aria-label="More note options" onClick={()=>setEditingMenu(v=>!v)}><MoreVertical size={24}/></button></div>
  {editingMenu&&<div className="rn-pop rn-editor-menu"><button onClick={()=>{setPreview(x=>!x);setEditingMenu(false);}}><FileText size={17}/>{preview?'Rich text editor':'Plain text mode'}</button><button onClick={()=>{patch(d=>({...d,details:{...d.details,pinned:!d.details.pinned}}));setEditingMenu(false);}}><Star size={17}/> {draft.details.pinned?'Remove favourite':'Add to favourites'}</button><button onClick={()=>{exportText();setEditingMenu(false);}}><Download size={17}/> Export text file</button><button disabled={!canEdit||draft.user_id!==session.user.id} onClick={()=>{setEditingMenu(false);void dispose();}}><Trash2 size={17}/> Move to recycle bin</button></div>}
  <div className="rn-document"><input className="rn-document-title" aria-label="Note title" placeholder={kind==='journal'?'Journal entry title':'Title'} value={draft.title} disabled={!canEdit} onChange={e=>patch(d=>({...d,title:e.target.value}))} maxLength={180}/><div className="rn-document-meta">{stamp(draft.updated_at)} · {saving?'Saving…':'Private'} <label className="rn-folder-select"><Folder size={14}/><input aria-label="Note folder" placeholder="Folder" value={get(draft.details,'folder')} disabled={!canEdit} onChange={e=>patch(d=>({...d,details:{...d.details,folder:e.target.value.slice(0,55)}}))}/></label></div>
  <input id="rn-photo-upload" type="file" disabled={!canEdit} hidden accept="image/jpeg,image/png,image/webp" multiple onChange={e=>void addPhoto(e)}/>
  {preview?<textarea ref={textRef} className="rn-document-body" aria-label="Note text" disabled={!canEdit} placeholder={kind==='journal'?'Write your thoughts…':'Start writing…'} style={{fontSize:font}} value={draft.body} onChange={e=>changeBody(e.target.value)}/>:<RichNoteEditor session={session} noteId={draft.id} key={draft.id} html={get(draft.details,'richHtml')} plainText={draft.body} fontSize={font} readOnly={!canEdit} onChange={(html,text)=>patch(d=>({...d,body:text,details:{...d.details,richHtml:html}}))}/>}
  {paths(draft.details).length>0&&<div className="rn-attachments">{paths(draft.details).map(p=><div key={p} className="rn-image">{attachments[p]?<img src={attachments[p]} alt="Note attachment" loading="lazy"/>:<span>Opening photo…</span>}<button aria-label="Remove attached picture" disabled={!canEdit} onClick={()=>void removePhoto(p)}><X size={16}/></button></div>)}</div>}
  </div>
  {preview&&<div className="rn-writing-tools" aria-label="Legacy text formatting toolbar"><button title="Handwriting mode is not yet in this editor" disabled><PenLine size={20}/></button><button aria-label="Insert checklist" onClick={()=>format('☐ ','','Task')}><CheckSquare size={20}/></button><button aria-label="Bold" onClick={()=>format('**','**')}><Type size={20}/></button><button aria-label="Highlight syntax" onClick={()=>format('==','==')}><Highlighter size={19}/></button><button aria-label="Heading" onClick={()=>format('## ','','Heading')}><Bookmark size={19}/></button><button aria-label="Smaller font" onClick={()=>setFont(v=>Math.max(14,v-1))}>A−</button><button aria-label="Larger font" onClick={()=>setFont(v=>Math.min(28,v+1))}>A+</button><button aria-label="Undo" disabled={!undo.length} onClick={()=>history(true)}><Undo2 size={20}/></button><button aria-label="Redo" disabled={!redo.length} onClick={()=>history(false)}><Redo2 size={20}/></button></div>}
  {conflict&&<div role="alert" className="rn-conflict"><strong>This note changed on another device.</strong><p>Your edits have not replaced the newer version.</p><button onClick={async()=>{const {data}=await supabase!.from('life_items').select('*').eq('id',draft.id).single();if(data)edit(data as Item);}}>Reload latest</button><button onClick={()=>{const copy={...draft,id:crypto.randomUUID(),user_id:session.user.id,title:(draft.title||'Untitled')+' (local copy)'};revision.current=null;setConflict(false);setDraft(copy);}}>Keep my work as a copy</button></div>}
  {sharing&&<ShareDialog session={session} noteId={draft.id} ownerId={draft.user_id} onClose={()=>setSharing(false)}/>}
  <div className="rn-bottom-status" role="status">{uploading?'Uploading images…':message|| (saving?'Saving…':'Autosave on')}<button onClick={()=>void persist(draft)} disabled={saving||!canEdit||conflict}><Check size={14}/> Save</button></div>
 </>:<>
  <header className="rn-heading"><h1>{caption}</h1><p>{visible.length} {kind==='journal'?'entries':'notes'}</p></header>
  <div className="rn-collection-bar"><button aria-label="Open folders menu" onClick={()=>setDrawer(true)}><Menu size={24}/></button><span className="rn-grow"/><button aria-label="Search notes" onClick={()=>setSearchOpen(x=>!x)}><Search size={23}/></button><button aria-label="Notes options" onClick={()=>setMenu(x=>!x)}><MoreVertical size={23}/></button></div>
  {searchOpen&&<label className="rn-search"><Search size={18}/><input autoFocus placeholder={'Search '+friendly(kind).toLowerCase()} value={search} onChange={e=>setSearch(e.target.value)}/><button aria-label="Close search" onClick={()=>{setSearchOpen(false);setSearch('');}}><X size={18}/></button></label>}
  {menu&&<div className="rn-pop rn-list-menu"><button onClick={()=>{setGrid(v=>!v);setMenu(false);}}>{grid?<LayoutList size={17}/>:<Grid2X2 size={17}/>} {grid?'List view':'Grid view'}</button><button onClick={()=>{setSort('recent');setMenu(false);}}>Newest first</button><button onClick={()=>{setSort('oldest');setMenu(false);}}>Oldest first</button><button onClick={()=>{setSort('title');setMenu(false);}}>Sort by title</button></div>}
  <div className="rn-section-label">{active==='Recycle bin'?'Deleted notes':'Your collection'}</div>
  {visible.length===0?<div className="rn-empty"><FileText size={32}/><p>{active==='Recycle bin'?'Your recycle bin is empty.':search?'No matching notes.':'Your space is ready for its first note.'}</p></div>:<div className={'rn-cards '+(grid?'rn-grid':'rn-list')}>{visible.map(item=><article key={item.id} className="rn-card"><button className="rn-card-main" onClick={()=>active==='Recycle bin'?undefined:edit(item)}><div className="rn-card-preview"><span>{item.body||'Start writing…'}</span>{paths(item.details).length>0&&<ImagePlus size={17}/>}</div><strong>{item.title.trim()||'Untitled'}</strong><small>{stamp(item.updated_at)} {item.details.pinned?' · ★':''}</small></button>{active==='Recycle bin'&&<div className="rn-trash-actions"><button onClick={()=>void restore(item)}>Restore</button><button onClick={()=>void permanent(item)}>Delete forever</button></div>}</article>)}</div>}
  {active!=='Recycle bin'&&<button className="rn-new" aria-label="Create new note" onClick={create}><PenLine size={25}/></button>}
  {drawer&&<div className="rn-drawer-backdrop" onClick={()=>setDrawer(false)}><nav aria-label="Note collections" className="rn-drawer" onClick={e=>e.stopPropagation()}><div className="rn-drawer-top"><strong>{friendly(kind)}</strong><button aria-label="Close folders" onClick={()=>setDrawer(false)}><X size={20}/></button></div>{([['All notes',live.length],['Favourites',live.filter(x=>x.details.pinned).length],['Recycle bin',trashed.length]] as const).map(([name,n])=><button key={name} className={active===name?'active':''} onClick={()=>{setActive(name);setDrawer(false);}}><span>{name}</span><small>{n}</small></button>)}<div className="rn-drawer-divider">FOLDERS</div>{folders.map(name=><button key={name} onClick={()=>{setActive('Folder');setFolder(name);setDrawer(false);}} className={active==='Folder'&&folder===name?'active':''}><Folder size={18}/><span>{name}</span></button>)}<div className="rn-new-folder"><input placeholder="New folder name" aria-label="New folder name" id="rn-new-folder-name"/><button onClick={()=>{const input=document.getElementById('rn-new-folder-name') as HTMLInputElement|null;const name=input?.value.trim().slice(0,55);if(!name)return;const next=[...new Set([...extraFolders,name])];setExtraFolders(next);localStorage.setItem('herlife-folders-'+session.user.id+'-'+kind,JSON.stringify(next));setFolder(name);setActive('Folder');setDrawer(false);}}>Open</button></div></nav></div>}
 </>}
 </section>;
}
