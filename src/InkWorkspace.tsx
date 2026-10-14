import {useRef,useState,type PointerEvent} from 'react';
import {Pen,Highlighter,Eraser,Undo2,Redo2,Plus,Trash2,Download,ChevronLeft,ChevronRight} from 'lucide-react';
export type InkPoint={x:number;y:number;p:number};
export type InkStroke={id:string;points:InkPoint[];color:string;width:number;opacity:number};
export type InkPage={id:string;strokes:InkStroke[]};
const palette=['#35283d','#345bc6','#be354b','#19825c','#d69b22'];
const empty=():InkPage=>({id:crypto.randomUUID(),strokes:[]});
const svgPath=(points:InkPoint[])=>points.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');
export function InkWorkspace({pages,onChange,readOnly=false}:{pages:InkPage[];onChange:(pages:InkPage[])=>void;readOnly?:boolean}){
 const all=pages.length?pages:[empty()];const [index,setIndex]=useState(0),[tool,setTool]=useState<'pen'|'marker'|'eraser'>('pen'),[color,setColor]=useState(palette[0]),[width,setWidth]=useState(3),[inProgress,setInProgress]=useState<InkStroke|null>(null);
 const [redo,setRedo]=useState<InkStroke[]>([]);const active=all[Math.min(index,all.length-1)];const svg=useRef<SVGSVGElement>(null);
 const coords=(e:PointerEvent<SVGSVGElement>):InkPoint=>{const node=svg.current;const p=node!.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const matrix=node!.getScreenCTM();const q=matrix?p.matrixTransform(matrix.inverse()):p;return{x:Math.max(0,Math.min(1000,q.x)),y:Math.max(0,Math.min(1400,q.y)),p:e.pressure||.5};};
 const apply=(strokes:InkStroke[])=>{onChange(all.map(p=>p.id===active.id?{...p,strokes}:p));};
 function start(e:PointerEvent<SVGSVGElement>){if(readOnly)return;e.preventDefault();const pos=coords(e);svg.current?.setPointerCapture(e.pointerId);
  if(tool==='eraser'){const nearest=active.strokes.slice().reverse().find(s=>s.points.some(p=>Math.hypot(p.x-pos.x,p.y-pos.y)<Math.max(19,s.width*4)));if(nearest){apply(active.strokes.filter(s=>s.id!==nearest.id));setRedo(v=>[...v,nearest]);}return;}
  setInProgress({id:crypto.randomUUID(),points:[pos],color,width:tool==='marker'?width*5:width,opacity:tool==='marker'?.32:1});setRedo([]);
 }
 function move(e:PointerEvent<SVGSVGElement>){if(!inProgress)return;e.preventDefault();const point=coords(e);setInProgress(s=>s?{...s,points:[...s.points,point]}:s);}
 function finish(){if(!inProgress)return;apply([...active.strokes,inProgress]);setInProgress(null);}
 const rendered=[...active.strokes,...(inProgress?[inProgress]:[])];
 const buttons=(label:string,onClick:()=>void,disabled=false,selected=false,icon:React.ReactNode)=><button type="button" aria-label={label} aria-pressed={selected} title={label} onClick={onClick} disabled={disabled}>{icon}</button>;
 function exportPng(){const el=svg.current;if(!el)return;const copy=el.cloneNode(true) as SVGSVGElement;copy.querySelectorAll('rect')[0]?.setAttribute('fill','#ffffff');copy.setAttribute('xmlns','http://www.w3.org/2000/svg');const blob=new Blob([new XMLSerializer().serializeToString(copy)],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='HerLife-handwriting-'+(index+1)+'.svg';link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
 return <div className="ink-workspace">{!readOnly&&<div className="ink-toolbar">
 {buttons('Pen',()=>setTool('pen'),false,tool==='pen',<Pen size={18}/>)}
 {buttons('Highlighter',()=>setTool('marker'),false,tool==='marker',<Highlighter size={18}/>)}
 {buttons('Stroke eraser',()=>setTool('eraser'),false,tool==='eraser',<Eraser size={18}/>)}
 <div className="ink-palette">{palette.map(c=><button key={c} type="button" aria-label={'Ink '+c} aria-pressed={color===c} style={{backgroundColor:c}} onClick={()=>{setColor(c);setTool('pen');}}/>)}</div>
 <label className="ink-width">Width <input type="range" min="1" max="12" value={width} onChange={e=>setWidth(Number(e.target.value))}/></label>
 {buttons('Undo stroke',()=>{const s=active.strokes.at(-1);if(s){apply(active.strokes.slice(0,-1));setRedo(v=>[...v,s]);}},!active.strokes.length,false,<Undo2 size={18}/>)}
 {buttons('Redo stroke',()=>{const s=redo.at(-1);if(s){apply([...active.strokes,s]);setRedo(v=>v.slice(0,-1));}},!redo.length,false,<Redo2 size={18}/>)}
 {buttons('Export drawing',exportPng,false,false,<Download size={18}/>)}
 </div>}<div className="ink-canvas-wrap"><svg ref={svg} className="ink-svg" role="img" aria-label="Handwriting page. Draw with a stylus, mouse or finger" viewBox="0 0 1000 1400" preserveAspectRatio="xMidYMin meet" onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}><rect x="0" y="0" width="1000" height="1400" fill="#ffffff"/>{rendered.map(s=><path key={s.id} d={svgPath(s.points)+(s.points.length===1?'l .1,.1':'')} fill="none" stroke={s.color} strokeWidth={s.width} strokeOpacity={s.opacity} strokeLinecap="round" strokeLinejoin="round"/>)}</svg></div><div className="ink-pagination">
 {buttons('Previous page',()=>setIndex(x=>Math.max(0,x-1)),index===0,false,<ChevronLeft size={18}/>)}
 <span>Page {index+1} of {all.length}</span>
 {buttons('Next page',()=>setIndex(x=>Math.min(all.length-1,x+1)),index>=all.length-1,false,<ChevronRight size={18}/>)}
 {!readOnly&&buttons('Add page',()=>{onChange([...all,empty()]);setIndex(all.length);},false,false,<Plus size={18}/>)}
 {!readOnly&&buttons('Delete page',()=>{if(all.length>1&&window.confirm('Delete this handwriting page?')){onChange(all.filter(p=>p.id!==active.id));setIndex(x=>Math.max(0,x-1));}},all.length===1,false,<Trash2 size={18}/>)}
 </div><p className="tiny muted">Vector ink saves with this note. Pen, highlighter, eraser, undo, pages and export work with finger, stylus or mouse.</p></div>;
}
