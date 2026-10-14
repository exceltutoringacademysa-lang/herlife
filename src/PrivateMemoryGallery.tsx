import {useCallback,useEffect,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {ImagePlus,Trash2,RefreshCw,LockKeyhole,Film} from 'lucide-react';
import {supabase} from './lib/supabase';
const bucket='herlife-private-memories';
type Media={path:string;url:string;name:string;video:boolean;created_at:string};
export function PrivateMemoryGallery({session}:{session:Session}){
 const [items,setItems]=useState<Media[]>([]),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[open,setOpen]=useState<Media|null>(null);
 const load=useCallback(async()=>{
  const client=supabase;if(!client)return;
  const prefix=session.user.id;
  const {data,error}=await client.storage.from(bucket).list(prefix,{limit:100,sortBy:{column:'created_at',order:'desc'}});
  if(error){setNotice('Could not load your private memories: '+error.message);return;}
  const files=(data||[]).filter(f=>f.name&&!f.name.startsWith('.'));
  const signed=await Promise.all(files.map(async file=>{
   const path=prefix+'/'+file.name;
   const {data:link,error:linkError}=await client.storage.from(bucket).createSignedUrl(path,60*60);
   if(linkError||!link)return null;
   const video=/\.(mp4|mov|webm)$/i.test(file.name);
   return {path,url:link.signedUrl,name:file.name.replace(/^[a-f0-9-]{36}-/,''),video,created_at:file.created_at||''};
  }));
  setItems(signed.filter((f):f is Media=>f!==null));
 },[session.user.id]);
 useEffect(()=>{void load();},[load]);
 async function upload(files:FileList|null){
  if(!files?.length||!supabase)return;
  setBusy(true);setNotice('');
  let completed=0;let failed:string[]=[];
  for(const file of Array.from(files)){
   if(!/^(image\/(jpeg|png|webp|heic|heif)|video\/(mp4|quicktime|webm))$/.test(file.type)){failed.push(file.name+' (unsupported format)');continue;}
   if(file.size>45*1024*1024){failed.push(file.name+' (over 45 MB)');continue;}
   const ext=file.name.split('.').pop()?.toLowerCase()||'bin';
   const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-95);
   const path=session.user.id+'/'+crypto.randomUUID()+'-'+safeName.replace(/\.+$/,'')+(safeName.includes('.')?'':'.'+ext);
   const {error}=await supabase.storage.from(bucket).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
   if(error)failed.push(file.name+' ('+error.message+')');else completed++;
  }
  setBusy(false);setNotice(completed+' uploaded'+(failed.length?'. Not uploaded: '+failed.join('; '):'.'));
  await load();
 }
 async function remove(item:Media){
  if(!supabase||!window.confirm('Delete this memory permanently?'))return;
  const {error}=await supabase.storage.from(bucket).remove([item.path]);
  if(error)setNotice(error.message);else{setOpen(null);await load();}
 }
 return <section className="private-memory-page"><header className="special-heading"><Film/><div><p className="eyebrow">YOUR PERSONAL ALBUM</p><h1>My photos & videos</h1><p>Upload her own memories and revisit them in a private gallery.</p></div></header>
 <div className="private-memory-tools"><label className="primary memory-upload"><ImagePlus size={17}/>{busy?'Uploading…':'Add photos or videos'}<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm" multiple disabled={busy} onChange={e=>{void upload(e.target.files);e.target.value='';}}/></label><button className="secondary" onClick={()=>void load()}><RefreshCw size={16}/> Refresh</button></div>
 <p className="tiny muted"><LockKeyhole size={14}/> Private account storage: signed links expire after one hour. Up to 45 MB per file; larger videos should be compressed before upload. New uploads are shown in this gallery, not automatically inserted into the original welcome film.</p>
 {notice&&<p role="status" className="special-message">{notice}</p>}
 {!items.length?<div className="memory-empty">No private uploads yet. Add a favourite photograph or video to begin.</div>:<div className="private-memory-grid">{items.map(item=><button onClick={()=>setOpen(item)} key={item.path} aria-label={'Open '+item.name}>{item.video?<video src={item.url} muted playsInline preload="metadata"/>:<img src={item.url} alt={item.name} loading="lazy"/>}{item.video&&<span className="memory-video-mark">VIDEO</span>}</button>)}</div>}
 {open&&<div className="private-media-viewer" role="dialog" aria-modal="true" aria-label="Memory viewer"><div className="private-viewer-actions"><button className="secondary" onClick={()=>setOpen(null)}>Close</button><button className="secondary" onClick={()=>void remove(open)}><Trash2 size={16}/> Delete</button></div>{open.video?<video src={open.url} controls playsInline autoPlay/>:<img src={open.url} alt={open.name}/>}<p>{open.name}</p></div>}
 </section>;
}
